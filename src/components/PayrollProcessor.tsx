/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  Calculator, Download, Edit3, Check, RefreshCw, AlertCircle, FileSpreadsheet, 
  HelpCircle, DollarSign, ArrowRightLeft, Percent, Eye, Search, FileText
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
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Nationality</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Position</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Campus</th>
                  <th rowSpan={2} className="p-3.5 font-bold border-r border-slate-200 dark:border-slate-700 text-center">Start Date</th>
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
            ) : isFullTime ? (
              <tr className="border-b border-slate-200 dark:border-slate-850">
                <th className="p-3.5 sticky left-0 bg-slate-100 dark:bg-slate-800 z-30 font-bold">1. No.</th>
                <th className="p-3.5 sticky left-12 bg-slate-100 dark:bg-slate-800 z-30 font-bold">2. Staff ID</th>
                <th className="p-3.5 sticky left-32 bg-slate-100 dark:bg-slate-800 z-30 font-bold border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">3. Names</th>
                <th className="p-3.5 font-bold">4. Nationality</th>
                <th className="p-3.5 font-bold">5. Position</th>
                <th className="p-3.5 font-bold">6. Department</th>
                <th className="p-3.5 font-bold">7. Campus</th>
                <th className="p-3.5 font-bold">9. DOJ (Cal. Eff. Date)</th>
                <th className="p-3.5 font-bold">10. Employment Date</th>
                <th className="p-3.5 font-bold bg-blue-50/40 dark:bg-blue-950/10">11. Basic Salary</th>
                <th className="p-3.5 font-bold">12. Pre. Pay / Percentage</th>
                <th className="p-3.5 font-bold text-rose-500">13. Absence (-)</th>
                <th className="p-3.5 font-bold text-emerald-500">14. Maternity (+)</th>
                <th className="p-3.5 font-bold text-emerald-500">15. OT (+)</th>
                <th className="p-3.5 font-bold text-emerald-500">16. Cash Advance (+)/Seniority</th>
                <th className="p-3.5 font-bold text-rose-500">17. Cash Advance (-)</th>
                <th className="p-3.5 font-bold text-rose-500">18. Provident with NSSF (-)</th>
                <th className="p-3.5 font-bold">19. Seniority/ GEP</th>
                <th className="p-3.5 font-bold bg-brand-50/40 dark:bg-brand-950/10 text-brand-600 dark:text-brand-400">20. Gross Salary</th>
                <th className="p-3.5 font-bold">21. Salary to be Paid (KHR)</th>
                <th className="p-3.5 font-bold text-center">22. Spouse</th>
                <th className="p-3.5 font-bold text-center">23. Minor Children</th>
                <th className="p-3.5 font-bold">24. Allowance</th>
                <th className="p-3.5 font-bold bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">25. Salary Tax Calculation Base</th>
                <th className="p-3.5 font-bold text-center bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">26. Tax Rate</th>
                <th className="p-3.5 font-bold bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">27. Tax on Salary (KHR)</th>
                <th className="p-3.5 font-bold bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">28. Tax on Salary ($)</th>
                <th className="p-3.5 font-bold text-slate-800 dark:text-slate-200">29. Total Salary After Tax ($)</th>
                <th className="p-3.5 font-bold text-emerald-500">30. SD Return (+)/ Visa Extension  Work Permit (+)</th>
                <th className="p-3.5 font-bold text-rose-500">31. Providence Fund</th>
                <th className="p-3.5 font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">32. Salary into Bank</th>
                <th className="p-3.5 font-bold">33. Bank Account Number</th>
                <th className="p-3.5 font-bold">34. Email</th>
                <th className="p-3.5 font-bold">35. Remarks</th>
                <th className="p-3.5 font-bold">36. Gross for Summary</th>
              </tr>
            ) : (
              <tr className="border-b border-slate-200 dark:border-slate-850">
                <th className="p-3.5 sticky left-0 bg-slate-100 dark:bg-slate-800 z-30 font-bold">No.</th>
                <th className="p-3.5 sticky left-12 bg-slate-100 dark:bg-slate-800 z-30 font-bold">Staff ID</th>
                <th className="p-3.5 sticky left-32 bg-slate-100 dark:bg-slate-800 z-30 font-bold border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Names</th>
                <th className="p-3.5 font-bold">Nationality</th>
                <th className="p-3.5 font-bold">Position</th>
                <th className="p-3.5 font-bold">Department</th>
                <th className="p-3.5 font-bold">Campus</th>
                <th className="p-3.5 font-bold">DOJ(Cal. Eff. Date)</th>
                <th className="p-3.5 font-bold">EmploymentDate</th>
                <th className="p-3.5 font-bold bg-blue-50/40 dark:bg-blue-950/10">Basic Salary</th>
                <th className="p-3.5 font-bold">Pre.Pay / Percentage</th>
                <th className="p-3.5 font-bold text-indigo-500">Other</th>
                <th className="p-3.5 font-bold text-emerald-500">Maternity (+)</th>
                <th className="p-3.5 font-bold text-blue-500">Rate</th>
                <th className="p-3.5 font-bold text-blue-500">Hour</th>
                <th className="p-3.5 font-bold text-blue-500">Amount $</th>
                <th className="p-3.5 font-bold text-emerald-500">Cash Advance (+)/Seniorit</th>
                <th className="p-3.5 font-bold text-rose-500">Provident with NSSF(-)</th>
                <th className="p-3.5 font-bold text-indigo-500">HRM/After school program</th>
                <th className="p-3.5 font-bold">PTT/GEP</th>
                <th className="p-3.5 font-bold bg-brand-50/40 dark:bg-brand-950/10 text-brand-600 dark:text-brand-400">G.Salary</th>
                <th className="p-3.5 font-bold">Salary to be Paid (KHR)</th>
                <th className="p-3.5 font-bold text-center">Spouse</th>
                <th className="p-3.5 font-bold text-center">Minor Children</th>
                <th className="p-3.5 font-bold">Allawance</th>
                <th className="p-3.5 font-bold bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">Salary Tax Calculation Base</th>
                <th className="p-3.5 font-bold text-center bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">Tax Rate</th>
                <th className="p-3.5 font-bold bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">TOS (KHR)</th>
                <th className="p-3.5 font-bold bg-amber-50/30 dark:bg-amber-950/10 text-amber-600">TOS ($)</th>
                <th className="p-3.5 font-bold text-slate-800 dark:text-slate-200">Total Salary After Tax ($)</th>
                <th className="p-3.5 font-bold text-orange-500">Adjust error TOS/NSSF</th>
                <th className="p-3.5 font-bold text-rose-500">Work Book (-)</th>
                <th className="p-3.5 font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Bank</th>
                <th className="p-3.5 font-bold">Bank Account Number</th>
                <th className="p-3.5 font-bold">Email</th>
                <th className="p-3.5 font-bold">Remarks</th>
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
                  className={isPartTime ? "p-3 border-r border-slate-100 dark:border-slate-800 text-center cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40" : undefined}
                />

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
                  className={isPartTime ? "p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" : undefined}
                  displayFormat={formatDate}
                />
 
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
                  displayFormat={formatDate}
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
                    isCurrency={false}
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

                {/* === Basic + financial cells: FT / SFT / PT branches === */}
                {isFullTime ? (
                  <>
                    <EditableCell empId={emp.id} field="basic" value={emp.basic} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-800 dark:text-slate-200 font-semibold bg-blue-50/20 dark:bg-blue-950/5" />
                    <EditableCell empId={emp.id} field="prePayPct" value={emp.prepayAmount} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-500 font-mono" isCurrency={false} />
                    <EditableCell empId={emp.id} field="absence" value={emp.absence} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-rose-600 dark:text-rose-400 font-semibold" />
                    <EditableCell empId={emp.id} field="maternity" value={emp.maternity} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-emerald-600 dark:text-emerald-400 font-semibold" />
                    <EditableCell empId={emp.id} field="ot" value={emp.ot} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-emerald-600 dark:text-emerald-400 font-semibold" readOnly={!isFullTime} />
                    <EditableCell empId={emp.id} field="caAdd" value={emp.caAdd} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-emerald-600 dark:text-emerald-400 font-semibold" />
                    <EditableCell empId={emp.id} field="caDed" value={emp.caDed} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-rose-600 dark:text-rose-400 font-semibold" />
                    <EditableCell empId={emp.id} field="nssf" value={emp.nssf} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-rose-600 dark:text-rose-400 font-semibold" />
                    <EditableCell empId={emp.id} field="seniority" value={emp.seniority} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-800 dark:text-slate-200" />
                    <td className="p-3 bg-brand-50/20 dark:bg-brand-950/5 text-sm h-12 w-32 align-top">
                      <input type="number" className="w-full bg-white/50 dark:bg-slate-800/50 border border-brand-200 dark:border-brand-800 rounded px-2 py-1 text-brand-700 dark:text-brand-300 font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                        value={emp.customGrossUSD !== undefined ? emp.customGrossUSD : ''} placeholder={emp.grossSalaryUSD.toString()}
                        onChange={(e) => { const val = e.target.value; onUpdateField(emp.id, 'customGrossUSD', val === '' ? undefined : parseFloat(val)); }} />
                    </td>
                    <td className="p-3 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] h-12 w-32 align-top">
                      <input type="number" className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300 font-mono font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                        value={emp.customSalaryPaidKHR !== undefined ? emp.customSalaryPaidKHR : ''} placeholder={emp.salaryPaidKHR.toString()}
                        onChange={(e) => { const val = e.target.value; onUpdateField(emp.id, 'customSalaryPaidKHR', val === '' ? undefined : parseFloat(val)); }} />
                    </td>
                    <EditableCell empId={emp.id} field="spouse" value={emp.spouse} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown} />
                    <EditableCell empId={emp.id} field="kids" value={emp.kids} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-500 font-semibold" isCurrency={false} />
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 font-mono text-[11px]">{formatKHR((emp.spouse ? 150000 : 0) + emp.kids * 150000)}</td>
                    <td className="p-3 font-mono text-[11px] bg-amber-50/20 dark:bg-amber-950/5 text-slate-700 dark:text-slate-300">{formatKHR(emp.taxBaseKHR)}</td>
                    <td className="p-3 font-mono font-bold bg-amber-50/20 dark:bg-amber-950/5 text-amber-600 dark:text-amber-500 text-center">{emp.taxRate}</td>
                    <td className="p-3 font-mono text-[11px] text-rose-500 bg-amber-50/20 dark:bg-amber-950/5 font-semibold">{formatKHR(emp.taxKHR)}</td>
                    <td className="p-3 text-rose-500 bg-amber-50/20 dark:bg-amber-950/5 font-semibold">{formatUSD(emp.taxUSD)}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{formatUSD(emp.salaryAfterTaxUSD)}</td>
                    <EditableCell empId={emp.id} field="sdReturn" value={emp.sdReturn} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-emerald-600 dark:text-emerald-400 font-semibold" />
                    <EditableCell empId={emp.id} field="provFund" value={emp.provFund} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-rose-600 dark:text-rose-400 font-semibold" />
                    <td className="p-3 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatUSD(emp.netBankUSD)}</td>
                    <EditableCell empId={emp.id} field="bankAcc" value={emp.bankAcc} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-400" isCurrency={false} />
                    <EditableCell empId={emp.id} field="email" value={emp.email} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-400" isCurrency={false} />
                    <EditableCell empId={emp.id} field="remarks" value={emp.remarks} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-400" isCurrency={false} />
                    <td className="p-3 font-medium text-slate-600 dark:text-slate-400">{formatUSD(emp.grossForSummary)}</td>
                  </>
                ) : isPartTime ? (
                  <>
                    <EditableCell empId={emp.id} field="basic" value={emp.basic} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-800 dark:text-slate-200 font-semibold bg-blue-50/20 dark:bg-blue-950/5" readOnly={true}
                      className="p-3 border-r border-slate-100 dark:border-slate-800 select-none group h-12 transition text-center" />
                    <EditableCell empId={emp.id} field="prePayPct" value={emp.prepayAmount} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-500 font-mono" isCurrency={false}
                      className="p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" />
                    <td className="p-3 bg-brand-50/20 dark:bg-brand-950/5 text-sm h-12 w-32 align-top text-center border-r border-brand-100 dark:border-brand-900/50">
                      <input type="number" className="w-full bg-transparent border-b border-transparent focus:border-brand-300 text-center text-brand-700 dark:text-brand-300 font-bold focus:outline-none"
                        value={emp.customGrossUSD !== undefined ? emp.customGrossUSD : ''} placeholder={emp.grossSalaryUSD.toString()}
                        onChange={(e) => { const val = e.target.value; onUpdateField(emp.id, 'customGrossUSD', val === '' ? undefined : parseFloat(val)); }} />
                    </td>
                    <td className="p-3 font-mono font-bold bg-amber-50/20 dark:bg-amber-950/5 text-amber-600 dark:text-amber-500 text-center border-r border-amber-100 dark:border-amber-900/50">{emp.taxRate}</td>
                    <td className="p-3 text-rose-500 bg-amber-50/20 dark:bg-amber-950/5 font-semibold text-center border-r border-amber-100 dark:border-amber-900/50">{formatUSD(emp.taxUSD)}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 text-center border-r border-slate-100 dark:border-slate-800">{formatUSD(emp.salaryAfterTaxUSD)}</td>
                    <EditableCell empId={emp.id} field="sdReturn" value={emp.sdReturn} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-emerald-600 dark:text-emerald-400 font-semibold"
                      className="p-3 border-r border-slate-100 dark:border-slate-800 text-center cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40" />
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 text-center border-r border-slate-100 dark:border-slate-800">{formatUSD(emp.sdReturn)}</td>
                    <td className="p-3 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400 text-sm text-center border-r border-emerald-100 dark:border-emerald-900/50">{formatUSD(emp.netBankUSD)}</td>
                    <EditableCell empId={emp.id} field="bankAcc" value={emp.bankAcc} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-400" isCurrency={false}
                      className="p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" />
                    <EditableCell empId={emp.id} field="email" value={emp.email} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-400" isCurrency={false}
                      className="p-3 border-r border-slate-100 dark:border-slate-800 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" />
                    <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-100 dark:border-slate-800">PT</td>
                    <td className="p-3 text-center text-slate-500 border-r border-slate-100 dark:border-slate-800">{emp.status}</td>
                    <EditableCell empId={emp.id} field="remarks" value={emp.remarks} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-400" isCurrency={false}
                      className="p-3 cursor-pointer select-none group h-12 transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-center" />
                  </>
                ) : (
                  <>
                    <EditableCell empId={emp.id} field="basic" value={emp.basic} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-800 dark:text-slate-200 font-semibold bg-blue-50/20 dark:bg-blue-950/5" readOnly={true} />
                    <EditableCell empId={emp.id} field="prePayPct" value={emp.prepayAmount} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-500 font-mono" isCurrency={false} />
                    <EditableCell empId={emp.id} field="other" value={emp.other} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-indigo-600 dark:text-indigo-400 font-semibold" isCurrency={false} />
                    <EditableCell empId={emp.id} field="maternity" value={emp.maternity} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-emerald-600 dark:text-emerald-400 font-semibold" />
                    <EditableCell empId={emp.id} field="hourlyRate" value={emp.hourlyRate} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-blue-600 dark:text-blue-400 font-semibold" isCurrency={false} />
                    <EditableCell empId={emp.id} field="scheduleHours" value={emp.scheduleHours ?? 0} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-blue-600 dark:text-blue-400 font-semibold" isCurrency={false} />
                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400 font-mono bg-blue-50/20 dark:bg-blue-950/5">${(emp.hourlyRate * (emp.scheduleHours ?? 0)).toFixed(2)}</td>
                    <EditableCell empId={emp.id} field="caAdd" value={emp.caAdd} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-emerald-600 dark:text-emerald-400 font-semibold" />
                    <EditableCell empId={emp.id} field="nssf" value={emp.nssf} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-rose-600 dark:text-rose-400 font-semibold" />
                    <EditableCell empId={emp.id} field="afterSchool" value={emp.afterSchool} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-indigo-600 dark:text-indigo-400 font-semibold" isCurrency={false} />
                    <EditableCell empId={emp.id} field="seniority" value={emp.seniority} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-800 dark:text-slate-200" />
                    <td className="p-3 bg-brand-50/20 dark:bg-brand-950/5 text-sm h-12 w-32 align-top">
                      <input type="number" className="w-full bg-white/50 dark:bg-slate-800/50 border border-brand-200 dark:border-brand-800 rounded px-2 py-1 text-brand-700 dark:text-brand-300 font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                        value={emp.customGrossUSD !== undefined ? emp.customGrossUSD : ''} placeholder={emp.grossSalaryUSD.toString()}
                        onChange={(e) => { const val = e.target.value; onUpdateField(emp.id, 'customGrossUSD', val === '' ? undefined : parseFloat(val)); }} />
                    </td>
                    <td className="p-3 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] h-12 w-32 align-top">
                      <input type="number" className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300 font-mono font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                        value={emp.customSalaryPaidKHR !== undefined ? emp.customSalaryPaidKHR : ''} placeholder={emp.salaryPaidKHR.toString()}
                        onChange={(e) => { const val = e.target.value; onUpdateField(emp.id, 'customSalaryPaidKHR', val === '' ? undefined : parseFloat(val)); }} />
                    </td>
                    <EditableCell empId={emp.id} field="spouse" value={emp.spouse} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown} />
                    <EditableCell empId={emp.id} field="kids" value={emp.kids} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-500 font-semibold" isCurrency={false} />
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 font-mono text-[11px]">{formatKHR((emp.spouse ? 150000 : 0) + emp.kids * 150000)}</td>
                    <td className="p-3 font-mono text-[11px] bg-amber-50/20 dark:bg-amber-950/5 text-slate-700 dark:text-slate-300">{formatKHR(emp.taxBaseKHR)}</td>
                    <td className="p-3 font-mono font-bold bg-amber-50/20 dark:bg-amber-950/5 text-amber-600 dark:text-amber-500 text-center">{emp.taxRate}</td>
                    <td className="p-3 font-mono text-[11px] text-rose-500 bg-amber-50/20 dark:bg-amber-950/5 font-semibold">{formatKHR(emp.taxKHR)}</td>
                    <td className="p-3 text-rose-500 bg-amber-50/20 dark:bg-amber-950/5 font-semibold">{formatUSD(emp.taxUSD)}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{formatUSD(emp.salaryAfterTaxUSD)}</td>
                    <EditableCell empId={emp.id} field="adjustError" value={emp.adjustError} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-orange-600 dark:text-orange-400 font-semibold" />
                    <EditableCell empId={emp.id} field="workBook" value={emp.workBook} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-rose-600 dark:text-rose-400 font-semibold" isCurrency={false} />
                    <td className="p-3 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatUSD(emp.netBankUSD)}</td>
                    <EditableCell empId={emp.id} field="bankAcc" value={emp.bankAcc} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-400" isCurrency={false} />
                    <EditableCell empId={emp.id} field="email" value={emp.email} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-400" isCurrency={false} />
                    <EditableCell empId={emp.id} field="remarks" value={emp.remarks} editingCell={editingCell} editValue={editValue} onStartEdit={handleStartEdit} onChangeValue={setEditValue} onSaveEdit={handleSaveEdit} onKeyDown={handleKeyDown}
                      textColor="text-slate-400" isCurrency={false} />
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const formatDate = (val: string | number | boolean): string => {
  const s = String(val);
  if (!s || s === '-') return '-';

  // Try parsing as an Excel serial number (days since 1900-01-01)
  const num = Number(s);
  if (!isNaN(num) && num > 1 && num < 200000) {
    const d = new Date(Date.UTC(1899, 11, 30 + num));
    if (!isNaN(d.getTime())) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${d.getUTCDate()}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
    }
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }

  return s;
};

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
  displayFormat?: (val: string | number | boolean) => string;
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
  readOnly = false,
  displayFormat
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
              : (displayFormat ? displayFormat(value) : (value || '-'))}
          </span>
          <Edit3 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
        </div>
      )}
    </td>
  );
}
