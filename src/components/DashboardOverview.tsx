/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, DollarSign, Scale, Database, RefreshCw, EyeOff, LayoutGrid, CheckCircle2,
  Trash2, Plus, Sliders, Wifi, WifiOff, ShieldCheck, Download, Calendar, Activity, 
  Settings, UserCheck, AlertCircle, FileSpreadsheet, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSXNS from 'xlsx-js-style';
const XLSX: typeof XLSXNS = ((XLSXNS as unknown as { default?: typeof XLSXNS }).default) ?? XLSXNS;
import { PayrollResult, WidgetConfig } from '../types';
import { buildCampusExpenseReport } from '../campusExpenseReport';

interface DashboardOverviewProps {
  processedData: PayrollResult[];
  offlineQueueLength: number;
  isOnline: boolean;
  toggleNetworkStatus: () => void;
  triggerSync: () => void;
  backupHistoryCount: number;
  onRunBackup: () => void;
  mfaEnabled: boolean;
  biometricsEnabled: boolean;
  onNavigateToMenu: (menu: string) => void;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'totals', title: 'Payroll Financials', enabled: true, type: 'stat', size: 'sm' },
  { id: 'taxes', title: 'Cambodian GDT Taxes', enabled: true, type: 'stat', size: 'sm' },
  { id: 'offline-sync', title: 'Offline Workspace & Sync', enabled: true, type: 'system', size: 'sm' },
  { id: 'gdt-distribution', title: 'GDT Tax Distribution', enabled: true, type: 'chart', size: 'md' },
  { id: 'department-chart', title: 'Payroll by Department', enabled: true, type: 'chart', size: 'md' },
  { id: 'campus-expenses', title: 'Campus Expenses', enabled: true, type: 'chart', size: 'md' },
  { id: 'backup-widget', title: 'Encrypted Cloud Backups', enabled: true, type: 'system', size: 'sm' },
  { id: 'security-widget', title: 'Security & MFA Audit', enabled: true, type: 'system', size: 'sm' }
];

const CAMPUS_EXPENSE_HEADERS = [
  'No.', 'Campus', 'Description', 'No.Staff', 'G.Salary', 'NSSF',
  'Cash Advance', 'Visa', 'Work Permit', 'TOS', 'Bank'
];

const CAMPUS_EXPENSE_COL_WCH = [5, 10, 26, 9, 12, 10, 13, 10, 12, 10, 12];
const CAMPUS_MONEY_FMT = '"$"#,##0.00;("$"#,##0.00);"$-"';
const CAMPUS_COUNT_FMT = '0';

const CAMPUS_BORDER: XLSXNS.CellStyle['border'] = {
  top: { style: 'thin', color: { rgb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { rgb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { rgb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { rgb: 'FFE2E8F0' } }
};

const CAMPUS_HEADER_STYLE: XLSXNS.CellStyle = {
  font: { bold: true, sz: 10, name: 'Calibri', color: { rgb: 'FF0F172A' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFF1F5F9' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: CAMPUS_BORDER
};

const CAMPUS_DATA_STYLE: XLSXNS.CellStyle = {
  font: { sz: 10, name: 'Calibri', color: { rgb: 'FF1F2937' } },
  alignment: { vertical: 'center', wrapText: true },
  border: CAMPUS_BORDER
};

const CAMPUS_SUBTOTAL_STYLE: XLSXNS.CellStyle = {
  font: { bold: true, sz: 10, name: 'Calibri', color: { rgb: 'FF1F2937' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFF8FAFC' } },
  alignment: { vertical: 'center', wrapText: true },
  border: CAMPUS_BORDER
};

const CAMPUS_GRAND_TOTAL_STYLE: XLSXNS.CellStyle = {
  font: { bold: true, sz: 10, name: 'Calibri', color: { rgb: 'FF0F172A' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFE2E8F0' } },
  alignment: { vertical: 'center', wrapText: true },
  border: CAMPUS_BORDER
};

export default function DashboardOverview({
  processedData,
  offlineQueueLength,
  isOnline,
  toggleNetworkStatus,
  triggerSync,
  backupHistoryCount,
  onRunBackup,
  mfaEnabled,
  biometricsEnabled,
  onNavigateToMenu
}: DashboardOverviewProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('June 2026');

  // --- Calculations ---
  const totals = useMemo(() => {
    let basicTotal = 0;
    let grossTotal = 0;
    let netBankTotal = 0;
    let taxTotalUSD = 0;
    let taxTotalKHR = 0;
    let khmerCount = 0;
    let expatCount = 0;

    processedData.forEach(emp => {
      basicTotal += emp.basic;
      grossTotal += emp.grossSalaryUSD;
      netBankTotal += emp.netBankUSD;
      taxTotalUSD += emp.taxUSD;
      taxTotalKHR += emp.taxKHR;
      if (emp.nat === 'Khmer') khmerCount++;
      else expatCount++;
    });

    return {
      basicTotal,
      grossTotal,
      netBankTotal,
      taxTotalUSD,
      taxTotalKHR,
      khmerCount,
      expatCount,
      totalCount: processedData.length
    };
  }, [processedData]);

  // Tax distribution for GDT chart
  const taxDistribution = useMemo(() => {
    const distribution = {
      '0%': 0,
      '5%': 0,
      '10%': 0,
      '15%': 0,
      '20%': 0
    };
    processedData.forEach(emp => {
      if (emp.taxRate === '0%') distribution['0%']++;
      else if (emp.taxRate === '5%') distribution['5%']++;
      else if (emp.taxRate === '10%') distribution['10%']++;
      else if (emp.taxRate === '15%') distribution['15%']++;
      else if (emp.taxRate === '20%') distribution['20%']++;
    });
    return distribution;
  }, [processedData]);

  // Department distribution
  const deptData = useMemo(() => {
    const depts: Record<string, number> = {};
    processedData.forEach(emp => {
      depts[emp.dept] = (depts[emp.dept] || 0) + emp.grossSalaryUSD;
    });
    return Object.entries(depts).map(([name, value]) => ({ name, value }));
  }, [processedData]);

  // Campus distribution
  const campusData = useMemo(() => {
    const campuses: Record<string, number> = {};
    processedData.forEach(emp => {
      campuses[emp.campus] = (campuses[emp.campus] || 0) + emp.grossSalaryUSD;
    });
    return Object.entries(campuses).map(([name, value]) => ({ name, value }));
  }, [processedData]);

  const handleExportCampusExpenses = () => {
    const { rows, grandTotal, groups } = buildCampusExpenseReport(processedData);
    const aoa: (string | number)[][] = [CAMPUS_EXPENSE_HEADERS.slice()];
    const noByRow = new Map<number, number>();
    groups.forEach(g => noByRow.set(g.startRow - 1, g.no));

    rows.forEach((r, i) => {
      aoa.push([
        noByRow.get(i) ?? '',
        r.campus,
        r.description,
        r.staffCount,
        r.gross,
        r.nssf,
        r.cashAdvance,
        r.visa,
        r.workPermit,
        r.tos,
        r.bank
      ]);
    });
    aoa.push([
      '', '', grandTotal.description, grandTotal.staffCount, grandTotal.gross, grandTotal.nssf,
      grandTotal.cashAdvance, grandTotal.visa, grandTotal.workPermit, grandTotal.tos, grandTotal.bank
    ]);

    const sheet = XLSXNS.utils.aoa_to_sheet(aoa);
    sheet['!cols'] = CAMPUS_EXPENSE_COL_WCH.map((wch) => ({ wch }));

    // Merge the No. and Campus cells across each campus group (data rows + Sub Total).
    sheet['!merges'] = groups.flatMap(g => ([
      { s: { r: g.startRow - 1, c: 0 }, e: { r: g.endRow - 1, c: 0 } },
      { s: { r: g.startRow - 1, c: 1 }, e: { r: g.endRow - 1, c: 1 } }
    ]));

    const range = XLSXNS.utils.decode_range(sheet['!ref']!);
    const subTotalRows = new Set(
      rows.map((r, i) => (r.isSubTotal ? i + 1 : -1)).filter(r => r >= 0)
    );
    const grandTotalRow = rows.length + 1;

    for (let R = 0; R <= range.e.r; R++) {
      for (let C = 0; C <= range.e.c; C++) {
        const addr = XLSXNS.utils.encode_cell({ r: R, c: C });
        const cell = sheet[addr];
        if (!cell) continue;
        if (R === 0) {
          cell.s = CAMPUS_HEADER_STYLE;
        } else if (R === grandTotalRow) {
          cell.s = CAMPUS_GRAND_TOTAL_STYLE;
        } else if (subTotalRows.has(R)) {
          cell.s = CAMPUS_SUBTOTAL_STYLE;
        } else {
          cell.s = CAMPUS_DATA_STYLE;
        }
        if (C === 0 || C === 3) cell.z = CAMPUS_COUNT_FMT;
        if (C >= 4 && C <= 10) cell.z = CAMPUS_MONEY_FMT;
      }
    }

    const workbook = XLSXNS.utils.book_new();
    XLSXNS.utils.book_append_sheet(workbook, sheet, 'Campus Expenses');
    XLSX.writeFile(workbook, `Campus_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`, { cellStyles: true });
  };

  const toggleWidget = (id: string) => {
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w)
    );
  };

  const activeWidgets = widgets.filter(w => w.enabled);

  return (
    <div className="flex-1 overflow-y-auto px-1 py-2 space-y-6">
      {/* Dashboard Subheader Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-brand-500" />
            Executive Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics and Cambodian GDT tax indicators for {selectedMonth}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-400">
            <ShieldCheck className="w-3 h-3" />
            GDT Sandbox Mode
          </span>
          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl transition"
          >
            <Sliders className="w-3.5 h-3.5 text-brand-500" />
            {isCustomizing ? 'Done Customizing' : 'Customize Widgets'}
          </button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:border-brand-500"
          >
            <option value="June 2026">June 2026 (Active)</option>
            <option value="May 2026">May 2026</option>
            <option value="April 2026">April 2026</option>
          </select>
        </div>
      </div>

      {/* Widget Customizer Slide-out Overlay */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl p-5"
          >
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Configure Active Dashboard Widgets
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {widgets.map(w => (
                <button
                  key={w.id}
                  onClick={() => toggleWidget(w.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition text-left ${
                    w.enabled
                      ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-500/30 text-brand-700 dark:text-brand-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-semibold">{w.title}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    w.enabled ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 dark:border-slate-700'
                  }`}>
                    {w.enabled && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
        
        {/* Total Payroll Stat Widget */}
        {activeWidgets.some(w => w.id === 'totals') && (
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[170px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Payroll Commitment
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  ${totals.grossTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {(totals.grossTotal * 4050).toLocaleString()} KHR
                </p>
              </div>
              <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-xl text-brand-500">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 text-[11px] text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg w-fit">
              <Activity className="w-3 h-3" />
              +4.8% vs last month run
            </div>
          </div>
        )}

        {/* GDT Cambodian Taxes */}
        {activeWidgets.some(w => w.id === 'taxes') && (
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[170px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Cambodian GDT Taxes
                </span>
                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                  {totals.taxTotalKHR.toLocaleString()} ៛
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  ${totals.taxTotalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </p>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-500">
                <Scale className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-4">
              <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
              Based on GDT progressive tax rules
            </div>
          </div>
        )}

        {/* Offline Sync and Network Indicator */}
        {activeWidgets.some(w => w.id === 'offline-sync') && (
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm rounded-2xl p-5 flex flex-col justify-between min-h-[170px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Offline Mode Sync Status
                </span>
                <div className="flex items-center gap-2 mt-2">
                  {isOnline ? (
                    <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      <Wifi className="w-4 h-4" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                      <WifiOff className="w-4 h-4" /> Offline Mode
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {offlineQueueLength > 0 
                    ? `${offlineQueueLength} unsynced change(s) queued` 
                    : 'All records in sync'
                  }
                </p>
              </div>
              <button
                onClick={toggleNetworkStatus}
                title="Toggle network status simulator"
                className={`p-2.5 rounded-xl border transition ${
                  isOnline 
                    ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500' 
                    : 'bg-amber-500/20 border-amber-500/30 text-amber-500 animate-pulse'
                }`}
              >
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={triggerSync}
                disabled={!isOnline || offlineQueueLength === 0}
                className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white text-[11px] font-semibold rounded-lg transition flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Sync Updates
              </button>
            </div>
          </div>
        )}

        {/* GDT Tax Bracket Distribution Graph */}
        {activeWidgets.some(w => w.id === 'gdt-distribution') && (
          <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm rounded-2xl p-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              GDT Tax Bracket Distribution
            </h4>
            
            <div className="h-44 flex items-end justify-between gap-4 pt-4 px-2">
              {Object.entries(taxDistribution).map(([rate, count]) => {
                const max = Math.max(...(Object.values(taxDistribution) as number[]), 1);
                const heightPct = ((count as number) / max) * 100;
                return (
                  <div key={rate} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-8 bg-slate-950 text-white text-[10px] py-1 px-2 rounded font-mono opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      {count} Staff
                    </div>
                    {/* Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-lg h-32 flex items-end overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`w-full rounded-t-lg transition ${
                          rate === '0%' ? 'bg-slate-300 dark:bg-slate-700' :
                          rate === '5%' ? 'bg-amber-400' :
                          rate === '10%' ? 'bg-amber-500' :
                          rate === '15%' ? 'bg-rose-500' : 'bg-rose-600'
                        }`}
                      />
                    </div>
                    {/* Label */}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
                      {rate}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Department Breakdowns Graph */}
        {activeWidgets.some(w => w.id === 'department-chart') && (
          <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm rounded-2xl p-5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              Payroll Commitment by Department (USD)
            </h4>

            <div className="h-44 flex flex-col justify-between gap-3 pt-2">
              {deptData.map(({ name, value }) => {
                const total = totals.grossTotal || 1;
                const pct = (value / total) * 100;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{name}</span>
                      <span className="font-mono text-slate-500">${value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className="bg-brand-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Campus Expenses Breakdowns Graph */}
        {activeWidgets.some(w => w.id === 'campus-expenses') && (
          <div className="md:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Expenses by Campus (USD)
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  {campusData.length} campus{campusData.length !== 1 ? 'es' : ''}
                </span>
                <button
                  onClick={handleExportCampusExpenses}
                  title="Export Expenses by Campus to Excel"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 transition"
                >
                  <Download className="w-3 h-3" />
                  Export Excel
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {campusData.map(({ name, value }) => {
                const total = totals.grossTotal || 1;
                const pct = (value / total) * 100;
                return (
                  <div key={name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{name} Campus</span>
                      <span className="font-mono text-slate-500">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-3 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className="bg-emerald-500 h-full rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{pct.toFixed(1)}% of total</span>
                      <span>{processedData.filter(e => e.campus === name).length} staff</span>
                    </div>
                  </div>
                );
              })}
              {campusData.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No campus data available. Import employee data to see expenses.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Encrypted Cloud Backup Status Widget */}
        {activeWidgets.some(w => w.id === 'backup-widget') && (
          <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-sm rounded-2xl p-5 flex flex-col justify-between min-h-[170px]">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Encrypted Backup Status
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">
                    <Database className="w-4.5 h-4.5 text-brand-500" />
                    AES-GCM-256 Enabled
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {backupHistoryCount > 0 
                      ? `${backupHistoryCount} secure backups saved successfully` 
                      : 'No secure backups captured yet'
                    }
                  </p>
                </div>

                <div className="p-2.5 bg-brand-50 dark:bg-brand-950/30 rounded-xl text-brand-500 text-xs font-mono font-bold">
                  v1.2
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={onRunBackup}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800/80 transition flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Backup Now
              </button>
              <button
                onClick={() => onNavigateToMenu('settings')}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 rounded-xl text-slate-500 border border-slate-200 dark:border-slate-850"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Security & Compliance / GDT Footer */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850/60 rounded-2xl text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          Security Compliance &amp; GDT Cambodian Taxation Sandbox Mode
          <svg className="w-3 h-3 ml-auto group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Compliance Audit</span>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MFA Security</span>
                <div className="text-xs font-bold mt-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${mfaEnabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {mfaEnabled ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Biometrics</span>
                <div className="text-xs font-bold mt-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${biometricsEnabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {biometricsEnabled ? 'Enrolled' : 'Not Set'}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-3">
              Encryption standards verified. All sensitive credentials are hashed locally via SHA256.
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">GDT Taxation Sandbox</h4>
                <p className="text-[10px] text-slate-400">Add records in Employee Master to calculate tax liability instantly.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToMenu('payroll')}
              className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Open Full-time Staff Run
            </button>
          </div>
        </div>
      </details>

    </div>
  );
}
