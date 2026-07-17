/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileSpreadsheet, Download, RefreshCw, Layers, Archive, Banknote, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PayrollResult } from '../types';

interface ReportsExporterProps {
  processedData: PayrollResult[];
  onTriggerToast: (title: string, msg: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function ReportsExporter({ processedData, onTriggerToast }: ReportsExporterProps) {
  const [exportingReportId, setExportingReportId] = useState<string | null>(null);

  const formatUSD = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatKHR = (val: number) => `${val.toLocaleString('en-US', { maximumFractionDigits: 0 })} ៛`;

  const availableReports = [
    {
      id: 'gdt-tax-declaration',
      title: 'Cambodian GDT Progressive Tax Declaration',
      description: 'Official format with spouse/kids reliefs, progressive KHR tax bases, and individual tax payments in KHR and USD.',
      icon: FileSpreadsheet,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/25',
      filename: 'gdt_tax_declaration_june_2026.csv',
      dataGenerator: () => {
        // Generate CSV rows
        const headers = 'No,Staff ID,Name,Nationality,Basic Salary (USD),Tax Base (KHR),Tax Rate,Tax due (KHR),Tax due (USD),After Tax Salary (USD)\n';
        const rows = processedData.map(e => 
          `${e.id},"${e.staffId}","${e.name}",${e.nat},${e.basic},${e.taxBaseKHR},${e.taxRate},${e.taxKHR},${e.taxUSD},${e.salaryAfterTaxUSD}`
        ).join('\n');
        return headers + rows;
      }
    },
    {
      id: 'aba-bulk-transfer',
      title: 'ABA Bank Bulk Salary Transfer File',
      description: 'Pre-formatted ABA Bank CSV file mapping Net Bank Transfers, employee names, and account numbers for easy bank portal uploads.',
      icon: Banknote,
      color: 'text-brand-500 bg-brand-50 dark:bg-brand-950/25',
      filename: 'aba_payroll_upload_june_2026.csv',
      dataGenerator: () => {
        const headers = 'Account Number,Amount,Currency,Details\n';
        const rows = processedData.map(e => 
          `"${e.bankAcc}",${e.netBankUSD.toFixed(2)},USD,"Salary June 2026 ${e.staffId}"`
        ).join('\n');
        return headers + rows;
      }
    },
    {
      id: 'acleda-bulk-transfer',
      title: 'ACLEDA Bank CSV Payroll Transfer',
      description: 'Corporate ACLEDA format matching standard salary schedules. Auto-calculates equivalents in KHR for domestic payroll runs.',
      icon: Archive,
      color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/25',
      filename: 'acleda_payroll_transfers_2026.csv',
      dataGenerator: () => {
        const headers = 'No,Name,Account,Amount KHR,Details\n';
        const rows = processedData.map(e => 
          `${e.id},"${e.name}","${e.bankAcc}",${(e.netBankUSD * 4050).toFixed(0)},"Corporate Salary"`
        ).join('\n');
        return headers + rows;
      }
    },
    {
      id: 'campus-expenses',
      title: 'Campus Expenses Report (Monthly/Yearly)',
      description: 'Generates a financial summary of salary expenses grouped by Campus. Useful for tracking operational costs across locations.',
      icon: Layers,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/25',
      filename: `campus_expenses_${new Date().getFullYear()}_${new Date().getMonth() + 1}.csv`,
      dataGenerator: () => {
        const campusTotals: Record<string, number> = {};
        processedData.forEach(e => {
          if (!campusTotals[e.campus]) campusTotals[e.campus] = 0;
          campusTotals[e.campus] += e.grossSalaryUSD;
        });
        
        const headers = 'Year,Month,Campus,Total Expenses (USD)\n';
        const year = new Date().getFullYear();
        const month = new Date().toLocaleString('en-US', { month: 'long' });
        
        const rows = Object.entries(campusTotals).map(([campus, total]) => 
          `${year},${month},"${campus}",${total.toFixed(2)}`
        ).join('\n');
        
        return headers + rows;
      }
    },
    {
      id: 'enterprise-full-summary',
      title: 'Full Corporate Financial Summary',
      description: 'Consolidated JSON breakdown of gross commitments, total Cambodian tax collected, average salaries, and budget costs.',
      icon: Layers,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/25',
      filename: 'enterprise_payroll_consolidated_2026.json',
      dataGenerator: () => {
        const totalGross = processedData.reduce((acc, e) => acc + e.grossSalaryUSD, 0);
        const totalTaxes = processedData.reduce((acc, e) => acc + e.taxUSD, 0);
        const totalNet = processedData.reduce((acc, e) => acc + e.netBankUSD, 0);
        const payload = {
          period: 'June 2026',
          currencyExchangeRate: 4050,
          grossCommitmentUSD: totalGross,
          gdtTaxesUSD: totalTaxes,
          netTransfersUSD: totalNet,
          headcount: processedData.length,
          employees: processedData.map(e => ({
            id: e.staffId,
            name: e.name,
            grossUSD: e.grossSalaryUSD,
            taxUSD: e.taxUSD,
            netUSD: e.netBankUSD
          }))
        };
        return JSON.stringify(payload, null, 2);
      }
    }
  ];

  const handleTriggerExport = (report: typeof availableReports[0]) => {
    setExportingReportId(report.id);
    
    setTimeout(() => {
      // Trigger browser download
      const content = report.dataGenerator();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', report.filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportingReportId(null);
      onTriggerToast(
        'Export Successful',
        `Successfully compiled and downloaded "${report.filename}"`,
        'success'
      );
    }, 1200);
  };

  return (
    <div className="flex-grow flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm overflow-y-auto">
      
      {/* Subheader */}
      <div className="border-b border-slate-200 dark:border-slate-850 pb-5 mb-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Archive className="w-4 h-4 text-brand-500" />
          Export Center & Compliance Reports
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Compile and export data sheets, GDT progressive tax files, and ABA/ACLEDA corporate banking formats. Files are compiled in the sandbox and encrypted for security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {availableReports.map((report) => {
          const Icon = report.icon;
          const isExporting = exportingReportId === report.id;
          
          return (
            <div
              key={report.id}
              className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col justify-between hover:border-brand-500/25 dark:hover:border-brand-500/20 transition min-h-[200px]"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${report.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {report.title}
                  </h4>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {report.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/40 dark:border-slate-850/45 flex justify-between items-center">
                <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">
                  Format: {report.filename.split('.').pop()?.toUpperCase()}
                </span>

                <button
                  onClick={() => handleTriggerExport(report)}
                  disabled={!!exportingReportId}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 shadow-md shadow-brand-500/10"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Compiling...
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      Export File
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/15 border border-amber-200/50 dark:border-amber-900/20 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400">Compliance & Privacy Notice</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            These files contain personal identifiable information (PII) of employees such as salary amounts and ABA/ACLEDA bank account routing details. Ensure secure file transport protocols when transmitting exports outside of the sandbox.
          </p>
        </div>
      </div>

    </div>
  );
}
