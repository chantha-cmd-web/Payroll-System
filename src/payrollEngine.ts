/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cambodia GDT (General Department of Taxation) compliant payroll engine.
 * All Tax on Salary (ToS) calculations follow the official progressive
 * schedule and are shared by every payroll run module.
 */

import { Employee, PayrollResult } from './types';

export const roundUSD = (val: number): number => Math.round(val * 100) / 100;
export const roundKHR = (val: number): number => Math.round(val);

export function getSpouseCount(spouse: string): number {
  if (/^(yes|true|y|1)$/i.test(spouse)) return 1;
  return Number(spouse) > 0 ? 1 : 0;
}

// Family relief: spouse + minor children, 150,000 KHR each per month.
export function getFamilyReliefKHR(spouse: string, kids: number): number {
  return (getSpouseCount(spouse) + kids) * 150000;
}

// Pre. Pay / Percentage auto calculation based on employment status.
export function computePrepayAmount(emp: Employee, basePay: number): number {
  let prepayAmount = 0;
  if (emp.status === 'TT') {
    prepayAmount = basePay / 2;
  } else if (emp.status === 'UN' || emp.status === 'ML' || emp.status === 'SH') {
    prepayAmount = 0;
  } else if (emp.status === 'T' || emp.status === 'W') {
    prepayAmount = basePay;
  } else {
    // Fallback / manual entry: > 100 is treated as a direct monetary amount,
    // otherwise it is a percentage of basic salary.
    prepayAmount = emp.prePayPct > 100 ? emp.prePayPct : basePay * (emp.prePayPct / 100);
  }
  return roundUSD(prepayAmount);
}

// Official progressive ToS schedule (2026 GDT).
// Bracket boundaries use strict ">" semantics, so a base exactly on a
// boundary falls in the lower bracket.
export function computeTax(taxBaseKHR: number): { taxKHR: number; taxRate: string } {
  let taxKHR = 0;
  let taxRate = '0%';

  if (taxBaseKHR <= 1500000) {
    taxKHR = 0;
    taxRate = '0%';
  } else if (taxBaseKHR <= 2000000) {
    taxKHR = taxBaseKHR * 0.05 - 75000;
    taxRate = '5%';
  } else if (taxBaseKHR <= 8500000) {
    taxKHR = taxBaseKHR * 0.10 - 175000;
    taxRate = '10%';
  } else if (taxBaseKHR <= 12500000) {
    taxKHR = taxBaseKHR * 0.15 - 600000;
    taxRate = '15%';
  } else {
    taxKHR = taxBaseKHR * 0.20 - 1225000;
    taxRate = '20%';
  }

  return { taxKHR: roundKHR(Math.max(0, taxKHR)), taxRate };
}

export function computePayroll(emp: Employee, exchangeRate: number): PayrollResult {
  // --- 1. Gross Salary (USD) ---
  let basePay = emp.basic;
  let calculatedAbsence = emp.absence;
  let calculatedOT = emp.ot;
  let calculatedAfterSchool = 0;
  let calculatedAmount = 0;

  if (emp.employmentType === 'Part-Time') {
    basePay = roundUSD(emp.hourlyRate * emp.presentHours);
    calculatedAbsence = roundUSD(emp.absenceHours * emp.hourlyRate);
  } else if (emp.employmentType === 'Semi-Full-Time') {
    basePay = emp.basic;
    calculatedAmount = roundUSD((emp.scheduleHours ?? 0) * emp.hourlyRate);
    calculatedAfterSchool = roundUSD(emp.afterSchool * emp.hourlyRate);
  }

  const prepayAmount = computePrepayAmount(emp, basePay);

  // Gross = Pre.Pay − Absence + Maternity + OT + CashAdvance(+) − CashAdvance(−)
  //         − Provident/NSSF + Seniority/GEP
  const rawGross =
    emp.employmentType === 'Semi-Full-Time'
      ? prepayAmount + emp.other + emp.maternity + calculatedAmount + emp.caAdd - emp.nssf + calculatedAfterSchool + emp.seniority
      : prepayAmount - calculatedAbsence + emp.maternity + calculatedOT + emp.caAdd - emp.caDed - emp.nssf + emp.seniority;
  const computedGross = roundUSD(rawGross);
  const grossSalaryUSD = computedGross;

  // --- 2. Salary to be Paid (KHR) = Gross × Exchange Rate ---
  const computedSalaryPaidKHR = roundKHR(grossSalaryUSD * exchangeRate);
  const salaryPaidKHR = computedSalaryPaidKHR;

  // --- 3. Salary Tax Calculation Base = Salary Paid − Family Relief (Allowance) ---
  const allowanceKHR = getFamilyReliefKHR(emp.spouse, emp.kids);
  const taxBaseKHR = Math.max(0, salaryPaidKHR - allowanceKHR);

  // --- 4 & 5. Progressive ToS brackets and Tax on Salary (KHR) ---
  const { taxKHR, taxRate } = computeTax(taxBaseKHR);

  // --- 6. Tax on Salary (USD) = ToS (KHR) ÷ Exchange Rate ---
  const taxUSD = roundUSD(taxKHR / exchangeRate);

  // --- 7. Total Salary After Tax (USD) = Gross − ToS (USD) ---
  const salaryAfterTaxUSD = roundUSD(grossSalaryUSD - taxUSD);

  // --- 8. Bank Transfer Amount (USD) ---
  // Bank = After Tax + Other + Work Permit/SD Return − Seniority − Cash Advance (+)
  const netBankUSD = roundUSD(
    emp.employmentType === 'Full-Time'
      ? salaryAfterTaxUSD + emp.other + emp.sdReturn - emp.seniority - emp.caAdd
      : emp.employmentType === 'Semi-Full-Time'
        ? salaryAfterTaxUSD - emp.seniority - emp.caAdd + emp.adjustError - emp.workBook
        : salaryAfterTaxUSD + emp.sdReturn
  );

  const grossForSummary = roundUSD(
    emp.employmentType === 'Full-Time'
      ? grossSalaryUSD + emp.other + emp.sdReturn
      : emp.employmentType === 'Semi-Full-Time'
        ? grossSalaryUSD
        : grossSalaryUSD + emp.sdReturn
  );

  return {
    ...emp,
    basic: basePay,
    absence: calculatedAbsence,
    ot: calculatedOT,
    prepayAmount,
    grossSalaryUSD,
    salaryPaidKHR,
    taxBaseKHR,
    taxRate,
    taxKHR,
    taxUSD,
    salaryAfterTaxUSD,
    netBankUSD,
    grossForSummary
  };
}
