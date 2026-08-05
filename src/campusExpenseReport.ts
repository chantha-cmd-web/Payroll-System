/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Campus expense report builder used by the Overview Dashboard Excel export.
 * Mirrors the reference workbook's "Expenses by Campus" layout:
 *
 *   No. | Campus | Description | No.Staff | G.Salary | NSSF | Cash Advance | Visa | Work Permit | TOS | Bank
 *
 * Rows are grouped by campus then by position, with a "Sub Total :" row per
 * campus and a final "Grand Total" row. NSSF and TOS are reported as negative
 * values (deductions). The report G.Salary excludes the separately-listed
 * columns (NSSF / Cash Advance / Visa / Work Permit / TOS) so that
 *   Bank = G.Salary + NSSF + Cash Advance + Visa + Work Permit + TOS
 * reconciles exactly for every row (this also matches the reference workbook,
 * where Seniority/GEP is paid outside the bank transfer and thus excluded).
 */

import { PayrollResult } from './types';

export const roundUSD = (v: number): number => Math.round(v * 100) / 100;

export interface CampusExpenseRow {
  campus: string;
  description: string;
  staffCount: number;
  gross: number;
  nssf: number;
  cashAdvance: number;
  visa: number;
  workPermit: number;
  tos: number;
  bank: number;
  isSubTotal: boolean;
  isGrandTotal: boolean;
}

// Preferred row order inside each campus, taken from the reference workbook.
export const CAMPUS_POSITION_ORDER = [
  'Management Team',
  'Staff',
  'Nanny & Teacher Assistant',
  'Full Time Teachers (Khmer)',
  'Full Time Teachers (Foreigner)'
];

export interface CampusExpenseGroup {
  /** 1-based sequence number shown in the "No." column. */
  no: number;
  campus: string;
  /** 1-based sheet row of the first data row of this campus group. */
  startRow: number;
  /** 1-based sheet row of the "Sub Total :" row of this campus group. */
  endRow: number;
}

export interface CampusExpenseSummary {
  rows: CampusExpenseRow[];
  grandTotal: CampusExpenseRow;
  groups: CampusExpenseGroup[];
}

/**
 * Report G.Salary for one employee.
 * = netBank + nssf - cashAdvance(net) - visa - workPermit + tax,
 * which for Full-Time staff reduces to Pre.Pay - Abs + Maternity + OT and for
 * every employment type guarantees the row reconciles to Bank.
 */
function reportGross(e: PayrollResult): number {
  return roundUSD(e.netBankUSD + e.nssf - (e.caAdd - e.caDed) - e.sdReturn - e.other + e.taxUSD);
}

function emptyRow(): CampusExpenseRow {
  return {
    campus: '',
    description: '',
    staffCount: 0,
    gross: 0,
    nssf: 0,
    cashAdvance: 0,
    visa: 0,
    workPermit: 0,
    tos: 0,
    bank: 0,
    isSubTotal: false,
    isGrandTotal: false
  };
}

function addToRow(row: CampusExpenseRow, e: PayrollResult): void {
  row.staffCount += 1;
  row.gross = roundUSD(row.gross + reportGross(e));
  row.nssf = roundUSD(row.nssf - e.nssf);
  row.cashAdvance = roundUSD(row.cashAdvance + (e.caAdd - e.caDed));
  row.visa = roundUSD(row.visa + e.sdReturn);
  row.workPermit = roundUSD(row.workPermit + e.other);
  row.tos = roundUSD(row.tos - e.taxUSD);
  row.bank = roundUSD(row.bank + e.netBankUSD);
}

export function buildCampusExpenseReport(data: PayrollResult[]): CampusExpenseSummary {
  // Group by campus, preserving order of first appearance.
  const campusOrder: string[] = [];
  const byCampus = new Map<string, PayrollResult[]>();
  for (const e of data) {
    const campus = e.campus || '(None)';
    if (!byCampus.has(campus)) {
      byCampus.set(campus, []);
      campusOrder.push(campus);
    }
    byCampus.get(campus)!.push(e);
  }

  // Ordered union of positions present in the data: reference order first,
  // then any other positions in order of first appearance.
  const posOrder: string[] = [];
  const posSeen = new Set<string>();
  for (const campus of campusOrder) {
    for (const e of byCampus.get(campus)!) {
      const pos = e.pos || '(No Position)';
      if (!posSeen.has(pos)) {
        posSeen.add(pos);
        posOrder.push(pos);
      }
    }
  }
  posOrder.sort((a, b) => {
    const ia = CAMPUS_POSITION_ORDER.indexOf(a);
    const ib = CAMPUS_POSITION_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const rows: CampusExpenseRow[] = [];
  const groups: CampusExpenseGroup[] = [];
  const grandTotal: CampusExpenseRow = { ...emptyRow(), description: 'Grand Total', isGrandTotal: true };

  campusOrder.forEach((campus, idx) => {
    const emps = byCampus.get(campus)!;
    const startRow = rows.length + 2; // sheet row (header is row 1)
    const sub: CampusExpenseRow = { ...emptyRow(), description: 'Sub Total :', isSubTotal: true };

    for (const pos of posOrder) {
      const row: CampusExpenseRow = { ...emptyRow(), campus, description: pos };
      for (const e of emps) {
        if ((e.pos || '(No Position)') === pos) {
          addToRow(row, e);
          addToRow(sub, e);
          addToRow(grandTotal, e);
        }
      }
      rows.push(row);
    }

    rows.push(sub);
    groups.push({ no: idx + 1, campus, startRow, endRow: rows.length + 1 });
  });

  return { rows, grandTotal, groups };
}
