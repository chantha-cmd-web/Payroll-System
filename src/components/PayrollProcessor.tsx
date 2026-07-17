/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  Calculator, Edit3, Check, RefreshCw, FileSpreadsheet, 
  HelpCircle, Search, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PayrollResult } from '../types';

interface PayrollProcessorProps {
  processedData: PayrollResult[];
  onUpdateField: (id: number, field: string, value: string | number | boolean | undefined) => void;
  onResetOT: () => void;
  exchangeRate: number;
  isFullTime?: boolean;
  isPartTime?: boolean;
  onSyncAttendance?: (records: any[]) => void;
  onSyncSalary?: (records: any[]) => void;
  onSyncStatus?: (records: any[]) => void;
}

export default function PayrollProcessor({
  processedData,
  onUpdateField,
  onResetOT,
  exchangeRate,
  isFullTime,
  isPartTime,
  onSyncAttendance,
  onSyncSalary,
  onSyncStatus
}: PayrollProcessorProps) {
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showTaxGuide, setShowTaxGuide] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const salaryFileInputRef = useRef<HTMLInputElement>(null);
  const statusFileInputRef = useRef<HTMLInputElement>(null);

  const handleExportPDF = useReactToPrint({
    contentRef: tableRef,
    documentTitle: `Payroll_Data_${new Date().toISOString().split('T')[0]}`,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSyncAttendance) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
      onSyncAttendance(json);
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSalaryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSyncSalary) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      onSyncSalary(json);
    };
    reader.readAsArrayBuffer(file);
    if (salaryFileInputRef.current) {
      salaryFileInputRef.current.value = '';
    }
  };

  const handleStatusFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSyncStatus) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      onSyncStatus(json);
    };
    reader.readAsArrayBuffer(file);
    if (statusFileInputRef.current) {
      statusFileInputRef.current.value = '';
    }
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(emp => ({
      'ID': emp.staffId,
      'Name': emp.name,
      'Nationality': emp.nat,
      'Position': emp.pos,
      'Department': emp.dept,
      'Campus': emp.campus,
      'Gross Salary (USD)': emp.grossSalaryUSD,
      'Tax Base (KHR)': emp.taxBaseKHR,
      'Tax Rate (%)': emp.taxRate,
      'Tax Due (KHR)': emp.taxKHR,
      'Tax Due (USD)': emp.taxUSD,
      'Net Bank (USD)': emp.netBankUSD
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');
    XLSX.writeFile(workbook, `Payroll_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCampus, setSelectedCampus] = useState('All');

  const departments = useMemo(() => {
    return ['All', 'Operations', 'Finance', 'Academics'];
  }, []);

  const campuses = useMemo(() => {
    return ['All', 'Main', 'North', 'South', 'Online'];
  }, []);

  const filteredData = useMemo(() => {
    return processedData.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.pos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.campus.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'All' || emp.dept === selectedDept;
      const matchesCampus = selectedCampus === 'All' || emp.campus === selectedCampus;
      return matchesSearch && matchesDept && matchesCampus;
    });
  }, [processedData, searchTerm, selectedDept, selectedCampus]);

  const formatUSD = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatKHR = (val: number) => `${val.toLocaleString('en-US', { maximumFractionDigits: 0 })} ៛`;

  const handleStartEdit = (id: number, field: string, val: string | number | boolean) => {
    setEditingCell({ id, field });
    if (typeof val === 'boolean') {
      setEditValue(val ? 'true' : 'false');
    } else {
      setEditValue(val === 0 ? '' : val.toString());
    }
  };

  const handleSaveEdit = (id: number, field: string) => {
    let finalValue: string | number | boolean = editValue;
    
    // Check if it's supposed to be a number or boolean based on the field
    if (['spouse'].includes(field)) {
      finalValue = editValue === 'true';
    } else if (['staffId', 'name', 'nat', 'pos', 'dept', 'campus', 'doj', 'empDate', 'bankAcc', 'email', 'remarks'].includes(field)) {
      finalValue = editValue;
    } else if (['customGrossUSD', 'customSalaryPaidKHR'].includes(field) && editValue === '') {
      finalValue = undefined as any;
    } else {
      // It's a number
      finalValue = parseFloat(editValue) || 0;
    }
    
    onUpdateField(id, field, finalValue);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number, field: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <div className="flex-grow flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm h-full">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-850 flex flex-col gap-4 bg-slate-50 dark:bg-slate-950/40">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-brand-500" />
              35-Field Interactive Run Worksheet
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              GDTprogressive schedules applied. Click any dashed dollar value cell to edit and re-run instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Staff, ID, Campus..."
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-brand-500 text-slate-900 dark:text-slate-100"
              />
            </div>
            
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Depts</option>
              {departments.filter(d => d !== 'All').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Campuses</option>
              {campuses.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {onSyncAttendance && (
              <>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-brand-500" />
                  Sync Attendance
                </button>
              </>
            )}

            {onSyncSalary && (
              <>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  ref={salaryFileInputRef}
                  onChange={handleSalaryFileUpload}
                />
                <button
                  onClick={() => salaryFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                  Sync Basic & Rate
                </button>
              </>
            )}

            {onSyncStatus && (
              <>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  ref={statusFileInputRef}
                  onChange={handleStatusFileUpload}
                />
                <button
                  onClick={() => statusFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500" />
                  Sync Status
                </button>
              </>
            )}

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              Export PDF
            </button>
            
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              Export Excel
            </button>

            <button
              onClick={() => setShowTaxGuide(!showTaxGuide)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-brand-500" />
              Tax Guide
            </button>
            
            <button
              onClick={onResetOT}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-white dark:bg-slate-900 text-rose-600 hover:text-rose-700 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900/50 rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset All OT
            </button>

            <div className="px-3 py-1.5 bg-brand-500/10 text-brand-500 font-semibold font-mono text-[11px] rounded-lg border border-brand-500/20">
              Rate: 1 USD = {exchangeRate} KHR
            </div>
          </div>
        </div>
      </div>

      {/* Tax Guide Banner (Expandable) */}
      <AnimatePresence>
        {showTaxGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-brand-50/30 dark:bg-brand-950/10 border-b border-slate-200 dark:border-slate-850 p-5 space-y-3"
          >
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Official Cambodian Progressive Salary Tax Schedules (2026 GDT)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tier 1</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">0 - 1.5M KHR</p>
                <span className="text-xs font-bold text-slate-400 mt-1 block">0% Tax Rate</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tier 2</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">1.5M - 2.0M KHR</p>
                <span className="text-xs font-bold text-amber-500 mt-1 block">5% (-75k ៛ Rebate)</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tier 3</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">2.0M - 8.5M KHR</p>
                <span className="text-xs font-bold text-amber-500 mt-1 block">10% (-175k ៛ Rebate)</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tier 4</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">8.5M - 12.5M KHR</p>
                <span className="text-xs font-bold text-rose-500 mt-1 block">15% (-600k ៛ Rebate)</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tier 5</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">&gt; 12.5M KHR</p>
                <span className="text-xs font-bold text-rose-600 mt-1 block">20% (-1.22M ៛ Rebate)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spreadsheet Container */}
      <div className="flex-grow overflow-auto p-2" ref={tableRef}>
        <table className="w-max min-w-full text-left border-collapse select-none">
          <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-20 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isPartTime ? (
              <>
                <tr className="border-b border-slate-200 dark:border-slate-850">
                  <th rowSpan={2} className="p-3.5 sticky left-0 bg-slate-100 dark:bg-slate-800 z-30 font-bold border-r border-slate-200 dark:border-slate-700">No.</th>
                  <th rowSpan={2} className="p-3.5 sticky left-12 bg-slate-100 dark:bg-slate-800 z-30 font-bold border-r border-slate-200 dark:border-slate-700">Staff ID</th>
                  <th rowSpan={2} className="p-3.5 sticky left-32 bg-slate-100 dark:bg-slate-800 z-30 font-bold border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Names</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Position</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Campus</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Employee Date</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Rate</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Hours</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Basic Salary</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Pre.Pay<br/>(Pension on Apr'26)</th>
                  <th rowSpan={2} className="p-3.5 font-bold bg-brand-50/40 dark:bg-brand-950/10 text-brand-600 dark:text-brand-400 border-r border-slate-200 dark:border-slate-700 text-center">G.Salary</th>
                  <th rowSpan={2} className="p-3.5 font-bold bg-amber-50/30 dark:bg-amber-950/10 text-amber-600 border-r border-slate-200 dark:border-slate-700 text-center">Tax Rate</th>
                  <th rowSpan={2} className="p-3.5 font-bold bg-amber-50/30 dark:bg-amber-950/10 text-amber-600 border-r border-slate-200 dark:border-slate-700 text-center">TOS ($)</th>
                  <th rowSpan={2} className="p-3.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 text-center">Total Salary<br/>After Tax ($)</th>
                  <th colSpan={2} className="p-3.5 font-bold text-emerald-500 border-b border-r border-slate-200 dark:border-slate-700 text-center">None Taxable Amount ($)</th>
                  <th rowSpan={2} className="p-3.5 font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-700 text-center">Bank</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Bank Account<br/>Number</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Email</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">PT/FT?</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">SD Status</th>
                  <th rowSpan={2} className="p-3.5 font-bold text-center">Remarks</th>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-850">
                  <th className="p-2 font-bold text-emerald-500 border-r border-slate-200 dark:border-slate-700 text-center">SD<br/><span className="text-rose-500">Ret(+)</span>/<br/><span className="text-rose-500">Ded(-)</span></th>
                  <th className="p-2 font-bold text-emerald-500 border-r border-slate-200 dark:border-slate-700 text-center">Total</th>
                </tr>
              </>
            ) : (
              <tr className="border-b border-slate-200 dark:border-slate-850">
                <th className="p-3.5 sticky left-0 bg-slate-100 dark:bg-slate-800 z-30 font-bold">{isFullTime ? '1. No.' : 'No.'}</th>
                <th className="p-3.5 sticky left-12 bg-slate-100 dark:bg-slate-800 z-30 font-bold">{isFullTime ? '2. Staff ID' : 'Staff ID'}</th>
                <th className="p-3.5 sticky left-32 bg-slate-100 dark:bg-slate-800 z-30 font-bold border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {isFullTime ? '3. Names' : 'Names'}
                </th>
                <th className="p-3.5 font-bold">{isFullTime ? '4. Nationality' : 'Nationality'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '5. Position' : 'Position'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '6. Department' : 'Department'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '7. Campus' : 'Campus'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '9. DOJ (Cal. Eff. Date)' : 'DOJ(Cal. Eff. Date)'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '10. Employment Date' : 'EmploymentDate'}</th>
                <th className="p-3.5 font-bold bg-blue-50/40 dark:bg-blue-950/10">{isFullTime ? '11. Basic Salary' : 'Basic Salary'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '12. Pre. Pay / Percentage' : 'Pre. Pay / Percentage'}</th>
                {!isFullTime && <th className="p-3.5 font-bold text-blue-500">Hr Rate</th>}
                {isPartTime && <th className="p-3.5 font-bold text-blue-600">Present Hrs</th>}
                {!isFullTime && <th className="p-3.5 font-bold text-rose-500">Abs Hrs</th>}
                {!isFullTime && !isPartTime && <th className="p-3.5 font-bold text-emerald-500">Sub Hrs</th>}
                <th className="p-3.5 font-bold text-rose-500">{isFullTime ? '13. Absence (-)' : 'Abs(-)'}</th>
                <th className="p-3.5 font-bold text-emerald-500">{isFullTime ? '14. Maternity (+)' : 'Maternity (+)'}</th>
                <th className="p-3.5 font-bold text-emerald-500">{isFullTime ? '15. OT (+)' : 'OT (+)'}</th>
                <th className="p-3.5 font-bold text-emerald-500">{isFullTime ? '16. Cash Advance (+)/Seniority' : 'Cash Advance (+)/Seniorit'}</th>
                <th className="p-3.5 font-bold text-rose-500">{isFullTime ? '17. Cash Advance (-)' : 'Cash Advance (-)'}</th>
                <th className="p-3.5 font-bold text-rose-500">{isFullTime ? '18. Provident with NSSF (-)' : 'Provident with NSSF(-)'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '19. Seniority/ GEP' : 'Seniority/GEP'}</th>
                <th className="p-3.5 font-bold bg-brand-50/40 dark:bg-brand-950/10 text-brand-600 dark:text-brand-400">
                  {isFullTime ? '20. Gross Salary' : 'G.Salary'}
                </th>
                <th className="p-3.5 font-bold">{isFullTime ? '21. Salary to be Paid (KHR)' : 'Salary to be Paid (KHR)'}</th>
                <th className="p-3.5 font-bold text-center">{isFullTime ? '22. Spouse' : 'Spouse'}</th>
                <th className="p-3.5 font-bold text-center">{isFullTime ? '23. Minor Children' : 'Minor Children'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '24. Allowance' : 'Allawance'}</th>
                <th className="p-3.5 font-bold bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">{isFullTime ? '25. Salary Tax Calculation Base' : 'Salary Tax Calculation Base'}</th>
                <th className="p-3.5 font-bold text-center bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">{isFullTime ? '26. Tax Rate' : 'Tax Rate'}</th>
                <th className="p-3.5 font-bold bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">{isFullTime ? '27. Tax on Salary (KHR)' : 'TOS (KHR)'}</th>
                <th className="p-3.5 font-bold bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">{isFullTime ? '28. Tax on Salary ($)' : 'TOS ($)'}</th>
                <th className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{isFullTime ? '29. Total Salary After Tax ($)' : 'Total Salary After Tax ($)'}</th>
                <th className="p-3.5 font-bold text-emerald-500">{isFullTime ? '30. SD Return (+)/ Visa Extension  Work Permit (+)' : 'SD Return (+)/ Visa Extension  Work Permit (+)'}</th>
                <th className="p-3.5 font-bold text-rose-500">{isFullTime ? '31. Providence Fund' : 'Providence Fund'}</th>
                <th className="p-3.5 font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{isFullTime ? '32. Salary into Bank' : 'Net Bank ($)'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '33. Bank Account Number' : 'Bank Account Number'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '34. Email' : 'Email'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '35. Remarks' : 'Remarks'}</th>
                <th className="p-3.5 font-bold">{isFullTime ? '36. Gross for Summary' : 'Gross for Summary'}</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-150 dark:divide-slate-850 text-xs">
            {filteredData.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition">
                {/* Fixed identification cells */}
                <td className={`p-3 sticky left-0 bg-white dark:bg-[#0B0F19] z-10 font-medium text-slate-400 ${isPartTime ? 'text-center border-r border-slate-100 dark:border-slate-800' : ''}`}>
                  {emp.id}
                </td>
                <EditableCell
                  empId={emp.id}
                  field="staffId"
                  value={emp.staffId}
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onChangeValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  textColor="font-mono text-[11px]"
                  isCurrency={false}
                  className={`p-3 sticky left-12 bg-white dark:bg-[#0B0F19] z-10 cursor-pointer select-none relative group h-12 transition ${isPartTime ? 'border-r border-slate-100 dark:border-slate-800' : ''}`}
                />
                <EditableCell
                  empId={emp.id}
                  field="name"
                  value={emp.name}
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onChangeValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  textColor="font-bold text-slate-900 dark:text-slate-100"
                  isCurrency={false}
                  className={`p-3 sticky left-32 bg-white dark:bg-[#0B0F19] z-10 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] cursor-pointer select-none relative group h-12 transition`}
                />

                {!isPartTime && (
                  <EditableCell
                    empId={emp.id}
                    field="nat"
                    value={emp.nat}
                    editingCell={editingCell}
                    editValue={editValue}
                    onStartEdit={handleStartEdit}
                    onChangeValue={setEditValue}
                    onSaveEdit={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    textColor="text-slate-500"
                    isCurrency={false}
                  />
                )}

                <EditableCell
                  empId={emp.id}
                  field="pos"
                  value={emp.pos}
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onChangeValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  textColor="text-slate-500"
                  isCurrency={false}
                  className={isPartTime ? "p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" : undefined}
                />

                {!isPartTime && (
                  <EditableCell
                    empId={emp.id}
                    field="dept"
                    value={emp.dept}
                    editingCell={editingCell}
                    editValue={editValue}
                    onStartEdit={handleStartEdit}
                    onChangeValue={setEditValue}
                    onSaveEdit={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    textColor="text-slate-500"
                    isCurrency={false}
                  />
                )}

                <EditableCell
                  empId={emp.id}
                  field="campus"
                  value={emp.campus}
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onChangeValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  textColor="text-slate-500"
                  isCurrency={false}
                  className={isPartTime ? "p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" : undefined}
                />

                {!isPartTime && (
                  <EditableCell
                    empId={emp.id}
                    field="doj"
                    value={emp.doj}
                    editingCell={editingCell}
                    editValue={editValue}
                    onStartEdit={handleStartEdit}
                    onChangeValue={setEditValue}
                    onSaveEdit={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    textColor="text-slate-400 font-mono text-[10px]"
                    isCurrency={false}
                  />
                )}

                <EditableCell
                  empId={emp.id}
                  field="empDate"
                  value={emp.empDate}
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onChangeValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  textColor="text-slate-400 font-mono text-[10px]"
                  isCurrency={false}
                  className={isPartTime ? "p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" : undefined}
                />

                {/* Rate (Hr Rate for part time) */}
                {isPartTime && (
                  <EditableCell
                    empId={emp.id}
                    field="hourlyRate"
                    value={emp.hourlyRate}
                    editingCell={editingCell}
                    editValue={editValue}
                    onStartEdit={handleStartEdit}
                    onChangeValue={setEditValue}
                    onSaveEdit={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    textColor="text-blue-600 dark:text-blue-400 font-semibold text-center"
                    className="p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center"
                  />
                )}

                {/* Hours (Present Hrs for part time) */}
                {isPartTime && (
                  <EditableCell
                    empId={emp.id}
                    field="presentHours"
                    value={emp.presentHours}
                    editingCell={editingCell}
                    editValue={editValue}
                    onStartEdit={handleStartEdit}
                    onChangeValue={setEditValue}
                    onSaveEdit={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    textColor="text-blue-600 dark:text-blue-400 font-semibold text-center"
                    isCurrency={false}
                    className="p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center"
                  />
                )}

                {/* 10. Basic */}
                <EditableCell
                  empId={emp.id}
                  field="basic"
                  value={emp.basic}
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onChangeValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  textColor="text-slate-800 dark:text-slate-200 font-semibold bg-blue-50/20 dark:bg-blue-950/5"
                  readOnly={!isFullTime}
                  className={isPartTime ? "p-3 border-r border-slate-100 dark:border-slate-800 select-none group h-12 transition text-center" : undefined}
                />

                {/* 11. Prepay */}
                <EditableCell
                  empId={emp.id}
                  field="prePayPct"
                  value={emp.prepayAmount}
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onChangeValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  textColor="text-slate-500 font-mono"
                  isCurrency={false}
                  className={isPartTime ? "p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" : undefined}
                />

                {/* --- Editable Variables Columns for Non-Part-Time --- */}

                {!isPartTime && !isFullTime && (
                  <EditableCell
                    empId={emp.id}
                    field="hourlyRate"
                    value={emp.hourlyRate}
                    editingCell={editingCell}
                    editValue={editValue}
                    onStartEdit={handleStartEdit}
                    onChangeValue={setEditValue}
                    onSaveEdit={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    textColor="text-blue-600 dark:text-blue-400 font-semibold"
                  />
                )}

                {!isPartTime && !isFullTime && (
                  <EditableCell
                    empId={emp.id}
                    field="absenceHours"
                    value={emp.absenceHours}
                    editingCell={editingCell}
                    editValue={editValue}
                    onStartEdit={handleStartEdit}
                    onChangeValue={setEditValue}
                    onSaveEdit={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    textColor="text-rose-600 dark:text-rose-400 font-semibold"
                    isCurrency={false}
                  />
                )}

                {!isFullTime && !isPartTime && (
                  <EditableCell
                    empId={emp.id}
                    field="substituteHours"
                    value={emp.substituteHours}
                    editingCell={editingCell}
                    editValue={editValue}
                    onStartEdit={handleStartEdit}
                    onChangeValue={setEditValue}
                    onSaveEdit={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    textColor="text-emerald-600 dark:text-emerald-400 font-semibold"
                    isCurrency={false}
                  />
                )}

                {!isPartTime && (
                  <>
                    <EditableCell
                      empId={emp.id}
                      field="absence"
                      value={emp.absence}
                      editingCell={editingCell}
                      editValue={editValue}
                      onStartEdit={handleStartEdit}
                      onChangeValue={setEditValue}
                      onSaveEdit={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      textColor="text-rose-600 dark:text-rose-400 font-semibold"
                      readOnly={!isFullTime}
                    />
                    <EditableCell
                      empId={emp.id}
                      field="maternity"
                      value={emp.maternity}
                      editingCell={editingCell}
                      editValue={editValue}
                      onStartEdit={handleStartEdit}
                      onChangeValue={setEditValue}
                      onSaveEdit={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      textColor="text-emerald-600 dark:text-emerald-400 font-semibold"
                    />
                    <EditableCell
                      empId={emp.id}
                      field="ot"
                      value={emp.ot}
                      editingCell={editingCell}
                      editValue={editValue}
                      onStartEdit={handleStartEdit}
                      onChangeValue={setEditValue}
                      onSaveEdit={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      textColor="text-emerald-600 dark:text-emerald-400 font-semibold"
                      readOnly={!isFullTime}
                    />
                    <EditableCell
                      empId={emp.id}
                      field="caAdd"
                      value={emp.caAdd}
                      editingCell={editingCell}
                      editValue={editValue}
                      onStartEdit={handleStartEdit}
                      onChangeValue={setEditValue}
                      onSaveEdit={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      textColor="text-emerald-600 dark:text-emerald-400 font-semibold"
                    />
                    <EditableCell
                      empId={emp.id}
                      field="caDed"
                      value={emp.caDed}
                      editingCell={editingCell}
                      editValue={editValue}
                      onStartEdit={handleStartEdit}
                      onChangeValue={setEditValue}
                      onSaveEdit={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      textColor="text-rose-600 dark:text-rose-400 font-semibold"
                    />
                    <EditableCell
                      empId={emp.id}
                      field="nssf"
                      value={emp.nssf}
                      editingCell={editingCell}
                      editValue={editValue}
                      onStartEdit={handleStartEdit}
                      onChangeValue={setEditValue}
                      onSaveEdit={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      textColor="text-rose-600 dark:text-rose-400 font-semibold"
                    />
                    <EditableCell
                      empId={emp.id}
                      field="seniority"
                      value={emp.seniority}
                      editingCell={editingCell}
                      editValue={editValue}
                      onStartEdit={handleStartEdit}
                      onChangeValue={setEditValue}
                      onSaveEdit={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      textColor="text-slate-800 dark:text-slate-200"
                    />
                  </>
                )}

                {/* Gross Columns */}
                {isPartTime ? (
                  <td className="p-3 bg-brand-50/20 dark:bg-brand-950/5 text-sm h-12 w-32 align-top text-center border-r border-brand-100 dark:border-brand-900/50">
                    <input
                      type="number"
                      className="w-full bg-transparent border-b border-transparent focus:border-brand-300 text-center text-brand-700 dark:text-brand-300 font-bold focus:outline-none"
                      value={emp.customGrossUSD !== undefined ? emp.customGrossUSD : ''}
                      placeholder={emp.grossSalaryUSD.toString()}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateField(emp.id, 'customGrossUSD', val === '' ? undefined : parseFloat(val));
                      }}
                    />
                  </td>
                ) : (
                  <>
                    <td className="p-3 bg-brand-50/20 dark:bg-brand-950/5 text-sm h-12 w-32 align-top">
                      <input
                        type="number"
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-brand-200 dark:border-brand-800 rounded px-2 py-1 text-brand-700 dark:text-brand-300 font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                        value={emp.customGrossUSD !== undefined ? emp.customGrossUSD : ''}
                        placeholder={emp.grossSalaryUSD.toString()}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateField(emp.id, 'customGrossUSD', val === '' ? undefined : parseFloat(val));
                        }}
                      />
                    </td>
                    <td className="p-3 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] h-12 w-32 align-top">
                      <input
                        type="number"
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300 font-mono font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                        value={emp.customSalaryPaidKHR !== undefined ? emp.customSalaryPaidKHR : ''}
                        placeholder={emp.salaryPaidKHR.toString()}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateField(emp.id, 'customSalaryPaidKHR', val === '' ? undefined : parseFloat(val));
                        }}
                      />
                    </td>
                  </>
                )}

                {!isPartTime && (
                  <>
                    <EditableCell
                      empId={emp.id}
                      field="spouse"
                      value={emp.spouse}
                      editingCell={editingCell}
                      editValue={editValue}
                      onStartEdit={handleStartEdit}
                      onChangeValue={setEditValue}
                      onSaveEdit={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                    />
                    <EditableCell
                      empId={emp.id}
                      field="kids"
                      value={emp.kids}
                      editingCell={editingCell}
                      editValue={editValue}
                      onStartEdit={handleStartEdit}
                      onChangeValue={setEditValue}
                      onSaveEdit={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      textColor="text-slate-500 font-semibold"
                      isCurrency={false}
                    />
                    <EditableCell
                      empId={emp.id}
                      field="allowance"
                      value={emp.allowance}
                      editingCell={editingCell}
                      editValue={editValue}
                      onStartEdit={handleStartEdit}
                      onChangeValue={setEditValue}
                      onSaveEdit={handleSaveEdit}
                      onKeyDown={handleKeyDown}
                      textColor="text-slate-500"
                    />
                    <td className="p-3 font-mono text-[11px] bg-amber-50/20 dark:bg-amber-950/5 text-slate-700 dark:text-slate-300">
                      {formatKHR(emp.taxBaseKHR)}
                    </td>
                  </>
                )}

                <td className={`p-3 font-mono font-bold bg-amber-50/20 dark:bg-amber-950/5 text-amber-600 dark:text-amber-500 ${isPartTime ? 'text-center border-r border-amber-100 dark:border-amber-900/50' : 'text-center'}`}>
                  {emp.taxRate}
                </td>

                {!isPartTime && (
                  <td className="p-3 font-mono text-[11px] text-rose-500 bg-amber-50/20 dark:bg-amber-950/5 font-semibold">
                    {formatKHR(emp.taxKHR)}
                  </td>
                )}

                <td className={`p-3 text-rose-500 bg-amber-50/20 dark:bg-amber-950/5 font-semibold ${isPartTime ? 'text-center border-r border-amber-100 dark:border-amber-900/50' : ''}`}>
                  {formatUSD(emp.taxUSD)}
                </td>

                <td className={`p-3 font-semibold text-slate-800 dark:text-slate-200 ${isPartTime ? 'text-center border-r border-slate-100 dark:border-slate-800' : ''}`}>
                  {formatUSD(emp.salaryAfterTaxUSD)}
                </td>

                {/* 29. Visa Ded Return / SD Ret(+)/Ded(-) */}
                <EditableCell
                  empId={emp.id}
                  field="sdReturn"
                  value={emp.sdReturn}
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onChangeValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  textColor="text-emerald-600 dark:text-emerald-400 font-semibold"
                  className={isPartTime ? "p-3 border-r border-slate-100 dark:border-slate-800 text-center cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40" : undefined}
                />

                {/* For Part-Time we show Total (same as sdReturn effectively) */}
                {isPartTime && (
                  <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 text-center border-r border-slate-100 dark:border-slate-800">
                    {formatUSD(emp.sdReturn)} 
                  </td>
                )}

                {/* 30. Provident Fund */}
                {!isPartTime && (
                  <EditableCell
                    empId={emp.id}
                    field="provFund"
                    value={emp.provFund}
                    editingCell={editingCell}
                    editValue={editValue}
                    onStartEdit={handleStartEdit}
                    onChangeValue={setEditValue}
                    onSaveEdit={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    textColor="text-rose-600 dark:text-rose-400 font-semibold"
                  />
                )}

                {/* 31. Net Bank output */}
                <td className={`p-3 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400 text-sm ${isPartTime ? 'text-center border-r border-emerald-100 dark:border-emerald-900/50' : ''}`}>
                  {formatUSD(emp.netBankUSD)}
                </td>

                <EditableCell
                  empId={emp.id}
                  field="bankAcc"
                  value={emp.bankAcc}
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onChangeValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  textColor="text-slate-400"
                  isCurrency={false}
                  className={isPartTime ? "p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" : undefined}
                />
                <EditableCell
                  empId={emp.id}
                  field="email"
                  value={emp.email}
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onChangeValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  textColor="text-slate-400"
                  isCurrency={false}
                  className={isPartTime ? "p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" : undefined}
                />

                {isPartTime && (
                  <>
                    <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                      PT
                    </td>
                    <td className="p-3 text-center text-slate-500 border-r border-slate-100 dark:border-slate-800">
                      {emp.status}
                    </td>
                  </>
                )}

                <EditableCell
                  empId={emp.id}
                  field="remarks"
                  value={emp.remarks}
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onChangeValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onKeyDown={handleKeyDown}
                  textColor="text-slate-400"
                  isCurrency={false}
                  className={isPartTime ? "p-3 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" : undefined}
                />

                {!isPartTime && (
                  <td className="p-3 font-medium text-slate-600 dark:text-slate-400">
                    {formatUSD(emp.grossForSummary)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface EditableCellProps {
  empId: number;
  field: string;
  value: string | number | boolean;
  editingCell: { id: number; field: string } | null;
  editValue: string;
  onStartEdit: (id: number, field: string, val: string | number | boolean) => void;
  onChangeValue: (val: string) => void;
  onSaveEdit: (id: number, field: string) => void;
  onKeyDown: (e: React.KeyboardEvent, id: number, field: string) => void;
  textColor?: string;
  isCurrency?: boolean;
  currencySymbol?: string;
  className?: string;
  readOnly?: boolean;
}

function EditableCell({
  empId,
  field,
  value,
  editingCell,
  editValue,
  onStartEdit,
  onChangeValue,
  onSaveEdit,
  onKeyDown,
  textColor = 'text-slate-900 dark:text-slate-100',
  isCurrency = true,
  currencySymbol = '$',
  className,
  readOnly = false
}: EditableCellProps) {
  const isEditing = editingCell?.id === empId && editingCell?.field === field;

  // Handle boolean specifically
  if (typeof value === 'boolean') {
    return (
      <td className={className || `p-3 text-center select-none group h-12 transition ${readOnly ? '' : 'cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40'}`}>
        <label className={`flex items-center justify-center ${readOnly ? '' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            className={`w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-600 bg-white dark:bg-slate-900 ${readOnly ? '' : 'cursor-pointer'}`}
            checked={value}
            disabled={readOnly}
            onChange={(e) => {
              if (readOnly) return;
              onChangeValue(e.target.checked ? 'true' : 'false');
              onSaveEdit(empId, field);
            }}
          />
        </label>
      </td>
    );
  }

  const isNumberType = typeof value === 'number';

  return (
    <td
      onClick={() => !readOnly && !isEditing && onStartEdit(empId, field, value)}
      className={className || `p-3 cursor-pointer select-none relative group h-12 transition min-w-[100px] ${
        isEditing ? 'bg-brand-500/10' : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
      }`}
    >
      {isEditing ? (
        <div className="flex items-center gap-1 absolute inset-1 z-10 bg-white dark:bg-slate-900 shadow-xl border border-brand-500 rounded-lg px-1">
          {isCurrency && isNumberType && <span className="text-slate-400 text-[10px] font-mono">{currencySymbol}</span>}
          <input
            autoFocus
            type={isNumberType ? "number" : "text"}
            value={editValue}
            onChange={(e) => onChangeValue(e.target.value)}
            onBlur={() => onSaveEdit(empId, field)}
            onKeyDown={(e) => onKeyDown(e, empId, field)}
            className="w-full bg-transparent text-xs font-bold font-mono focus:outline-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className={`${textColor} ${isNumberType ? 'font-mono' : 'text-[11px] truncate max-w-[130px] font-medium'}`} title={typeof value === 'string' ? value : ''}>
            {isNumberType 
              ? (value === 0 ? '-' : (isCurrency ? (currencySymbol === '៛' ? `${value.toLocaleString()} ៛` : `${currencySymbol}${value.toLocaleString()}`) : value.toLocaleString()))
              : (value || '-')}
          </span>
          <Edit3 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
        </div>
      )}
    </td>
  );
}
