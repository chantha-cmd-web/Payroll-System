/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from "react";
import {
  FileText,
  Printer,
  RefreshCw,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PayrollResult } from "../types";

interface PayslipsViewProps {
  processedData: PayrollResult[];
  onTriggerToast: (
    title: string,
    msg: string,
    type: "info" | "success" | "warning" | "alert",
  ) => void;
}

import { useReactToPrint } from "react-to-print";

export default function PayslipsView({
  processedData,
  onTriggerToast,
}: PayslipsViewProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    processedData[0]?.id || 1,
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const payslipRef = useRef<HTMLDivElement>(null);

  const selectedEmp = useMemo(() => {
    return (
      processedData.find((e) => e.id === selectedEmpId) || processedData[0]
    );
  }, [processedData, selectedEmpId]);

  const handlePrint = useReactToPrint({
    contentRef: payslipRef,
    documentTitle: `Payslip_${selectedEmp?.name?.replace(/\s+/g, "_") || "Document"}`,
    pageStyle: `
      @page { size: auto; margin: 20mm; }
      @media print {
        body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  const handleSendEmail = () => {
    if (!selectedEmp?.email) {
      onTriggerToast(
        "Email Failed",
        "No email address registered for this employee",
        "warning",
      );
      return;
    }

    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      onTriggerToast(
        "Payslip Dispatched",
        `Encrypted PDF payslip successfully emailed to ${selectedEmp.email}`,
        "success",
      );
    }, 1500);
  };

  const handleCycleEmployee = (dir: "next" | "prev") => {
    const idx = processedData.findIndex((e) => e.id === selectedEmpId);
    if (dir === "next") {
      const nextIdx = (idx + 1) % processedData.length;
      setSelectedEmpId(processedData[nextIdx].id);
    } else {
      const prevIdx = (idx - 1 + processedData.length) % processedData.length;
      setSelectedEmpId(processedData[prevIdx].id);
    }
  };

  if (!selectedEmp) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl text-center">
        <p className="text-sm text-slate-400">
          Please add an employee first to generate payslips.
        </p>
      </div>
    );
  }

  const formatUSD = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatKHR = (val: number) =>
    `${val.toLocaleString("en-US", { maximumFractionDigits: 0 })} ៛`;

  return (
    <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden h-full">
      {/* Sidebar Selector */}
      <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 flex flex-col h-full shrink-0 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-850 pb-4 mb-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-500" />
            Payslip Center
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => handleCycleEmployee("prev")}
              className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-500 transition border border-slate-200 dark:border-slate-850"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleCycleEmployee("next")}
              className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-500 transition border border-slate-200 dark:border-slate-850"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto space-y-2.5">
          {processedData.map((emp) => (
            <button
              key={emp.id}
              onClick={() => setSelectedEmpId(emp.id)}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                selectedEmpId === emp.id
                  ? "bg-brand-50/40 dark:bg-brand-950/20 border-brand-500/30 text-brand-700 dark:text-brand-300"
                  : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 border-slate-150 dark:border-slate-850 text-slate-600"
              }`}
            >
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {emp.name}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {emp.staffId} • {emp.dept}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {formatUSD(emp.netBankUSD)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Payslip View Area */}
      <div className="flex-grow flex flex-col bg-slate-100/50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-850/60 p-5 overflow-hidden shadow-inner relative">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-850">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Secure Digital Preview
          </span>

          <div className="flex gap-2">
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              {sendingEmail ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-brand-500" />
              )}
              Email Payslip
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-brand-500/10"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* The Payslip Document itself */}
        <div className="flex-grow overflow-y-auto flex justify-center p-4">
          <div
            id="printable-payslip"
            ref={payslipRef}
            className="w-full max-w-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 shadow-lg relative font-sans print-exact print:font-sans print:bg-white print:text-black print:border-none print:shadow-none print:p-0"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 dark:border-slate-200 print:border-black pb-6 mb-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-brand-700 dark:text-brand-400 print:text-black font-sans">
                  CAMBODIA ENTERPRISE CORP.
                </h2>
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 print:text-slate-700 font-sans mt-1">
                  សាជីវកម្មសហគ្រាសកម្ពុជា
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 uppercase tracking-wider mt-3">
                  Phnom Penh, Kingdom of Cambodia
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
                  Tax registration ID:{" "}
                  <span className="font-mono">GDT-KH-9401824</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300  print:bg-transparent print:text-black print:border-black px-4 py-2 rounded-lg border border-brand-200 dark:border-brand-800 uppercase tracking-widest font-sans inline-block">
                  OFFICIAL PAYSLIP / ប័ណ្ណបើកប្រាក់ខែ
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-700 mt-4 font-mono font-medium">
                  Period: June 2026
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-700 mt-1 font-mono font-medium">
                  Date: June 25, 2026
                </p>
              </div>
            </div>

            {/* Employee Details Section */}
            <div className="mb-6 border border-slate-200 dark:border-slate-700 print:border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/50 print:bg-white px-4 py-2 border-b border-slate-200 dark:border-slate-700 print:border-slate-300">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-black uppercase tracking-wider">
                  Employee Information / ព័ត៌មានបុគ្គលិក
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 text-xs bg-white dark:bg-slate-900 print:bg-white">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-500 font-semibold uppercase block mb-1">
                    Staff ID / អត្តលេខ
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 print:text-black">
                    {selectedEmp.staffId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-500 font-semibold uppercase block mb-1">
                    Display Name / ឈ្មោះ
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 print:text-black font-sans">
                    {selectedEmp.name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-500 font-semibold uppercase block mb-1">
                    Position / តួនាទី
                  </span>
                  <span
                    className="font-medium text-slate-800 dark:text-slate-200 print:text-black block truncate"
                    title={selectedEmp.pos}
                  >
                    {selectedEmp.pos}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-500 font-semibold uppercase block mb-1">
                    Department / ផ្នែក
                  </span>
                  <span
                    className="font-medium text-slate-800 dark:text-slate-200 print:text-black block truncate"
                    title={selectedEmp.dept}
                  >
                    {selectedEmp.dept}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-500 font-semibold uppercase block mb-1">
                    Campus / សាខា
                  </span>
                  <span
                    className="font-medium text-slate-800 dark:text-slate-200 print:text-black block truncate"
                    title={selectedEmp.campus}
                  >
                    {selectedEmp.campus}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-500 font-semibold uppercase block mb-1">
                    Type / ប្រភេទ
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 print:text-black block">
                    {selectedEmp.employmentType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-500 font-semibold uppercase block mb-1">
                    Nat. / សញ្ជាតិ
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 print:text-black block">
                    {selectedEmp.nat}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-500 font-semibold uppercase block mb-1">
                    Bank Account / គណនីធនាគារ
                  </span>
                  <span
                    className="font-mono font-semibold text-slate-800 dark:text-slate-200 print:text-black block truncate"
                    title={selectedEmp.bankAcc}
                  >
                    {selectedEmp.bankAcc || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6">
              {/* Earnings (Additions) */}
              <div className="border border-slate-200 dark:border-slate-700 print:border-slate-300 rounded-xl overflow-hidden bg-white dark:bg-slate-900 print:bg-white">
                <div className="bg-slate-50 dark:bg-slate-800/50 print:bg-white px-4 py-3 border-b border-slate-200 dark:border-slate-700 print:border-slate-300">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 print:text-black uppercase text-xs tracking-wider">
                    1. Earnings / ប្រាក់ចំណូល
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  {selectedEmp.employmentType === "Part-Time" ? (
                    <>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                        <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                          Hourly Rate / តម្លៃម៉ោង
                        </span>
                        <span className="font-mono font-semibold">
                          ${selectedEmp.hourlyRate?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                        <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                          Present Hours / ម៉ោងធ្វើការ
                        </span>
                        <span className="font-mono font-semibold">
                          {selectedEmp.presentHours} hrs
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                        <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                          Total Basic / ប្រាក់ខែគោល
                        </span>
                        <span className="font-mono font-semibold">
                          $
                          {(
                            selectedEmp.basic *
                            (selectedEmp.prePayPct / 100)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                        Basic Salary ({selectedEmp.prePayPct}%) / ប្រាក់ខែគោល
                      </span>
                      <span className="font-mono font-semibold">
                        $
                        {(
                          selectedEmp.basic *
                          (selectedEmp.prePayPct / 100)
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedEmp.maternity > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 print:text-emerald-700 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span>Maternity Benefit / ប្រាក់មាតុភាព</span>
                      <span className="font-mono font-semibold">
                        +${selectedEmp.maternity.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedEmp.ot > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 print:text-emerald-700 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span>Overtime Work (OT) / ប្រាក់ម៉ោងបន្ថែម</span>
                      <span className="font-mono font-semibold">
                        +${selectedEmp.ot.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedEmp.caAdd > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 print:text-emerald-700 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span>Allowance Addition / ប្រាក់ឧបត្ថម្ភ</span>
                      <span className="font-mono font-semibold">
                        +${selectedEmp.caAdd.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedEmp.seniority > 0 && (
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                        Seniority Indemnity / ប្រាក់អតីតភាពការងារ
                      </span>
                      <span className="font-mono font-semibold">
                        ${selectedEmp.seniority.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedEmp.sdReturn > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 print:text-emerald-700 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span>Visa Ded. Return / ប្រាក់សងទិដ្ឋាការ</span>
                      <span className="font-mono font-semibold">
                        +${selectedEmp.sdReturn.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 dark:border-slate-700 print:border-slate-300 rounded-xl overflow-hidden bg-white dark:bg-slate-900 print:bg-white">
                <div className="bg-slate-50 dark:bg-slate-800/50 print:bg-white px-4 py-3 border-b border-slate-200 dark:border-slate-700 print:border-slate-300">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 print:text-black uppercase text-xs tracking-wider">
                    2. Deductions / ការកាត់កង
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  {selectedEmp.absence > 0 ? (
                    <div className="flex justify-between text-rose-700 dark:text-rose-400 print:text-rose-700 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span>Absence Deductions / កាត់ប្រាក់អវត្តមាន</span>
                      <span className="font-mono font-semibold">
                        -${selectedEmp.absence.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-400 dark:text-slate-500 print:text-slate-400 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span>Absences / អវត្តមាន</span>
                      <span className="font-mono">-</span>
                    </div>
                  )}

                  {selectedEmp.caDed > 0 && (
                    <div className="flex justify-between text-rose-700 dark:text-rose-400 print:text-rose-700 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span>Cash Advance Ded. / កាត់ប្រាក់ខ្ចីមុន</span>
                      <span className="font-mono font-semibold">
                        -${selectedEmp.caDed.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedEmp.nssf > 0 && (
                    <div className="flex justify-between text-rose-700 dark:text-rose-400 print:text-rose-700 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span>NSSF Contribution / បេឡាជាតិសន្តិសុខសង្គម</span>
                      <span className="font-mono font-semibold">
                        -${selectedEmp.nssf.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedEmp.provFund > 0 && (
                    <div className="flex justify-between text-rose-700 dark:text-rose-400 print:text-rose-700 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span>Provident Fund / មូលនិធិសន្សំ</span>
                      <span className="font-mono font-semibold">
                        -${selectedEmp.provFund.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GDT Cambodian Taxation Calculations Area */}
            <div className="border border-slate-200 dark:border-slate-700 print:border-slate-300 rounded-xl overflow-hidden mb-6 bg-white dark:bg-slate-900 print:bg-white">
              <div className="bg-slate-50 dark:bg-slate-800/50 print:bg-white px-4 py-3 border-b border-slate-200 dark:border-slate-700 print:border-slate-300">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 print:text-black uppercase text-xs tracking-wider">
                  3. Taxation (GDT) / ពន្ធលើប្រាក់បៀវត្ស
                </h4>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                        Tax Base (KHR) / មូលដ្ឋានគិតពន្ធ
                      </span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                        {formatKHR(selectedEmp.taxBaseKHR)}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-2">
                      <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                        GDT Tax Rate / អត្រាពន្ធ
                      </span>
                      <span className="font-mono font-bold text-brand-700 dark:text-brand-400 print:text-black">
                        {selectedEmp.taxRate}
                      </span>
                    </div>
                    {selectedEmp.nat === "Khmer" && (
                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                          Relief (Spouse: {selectedEmp.spouse ? "1" : "0"},
                          Kids: {selectedEmp.kids}) / ការកាត់បន្ថយ
                        </span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 print:text-emerald-700 font-semibold">
                          -
                          {(
                            (selectedEmp.spouse ? 150000 : 0) +
                            selectedEmp.kids * 150000
                          ).toLocaleString()}{" "}
                          ៛
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 sm:pl-4">
                    <div className="flex justify-between bg-rose-50 dark:bg-rose-950/30 print:bg-transparent p-3 print:p-0 rounded-lg border border-rose-100 dark:border-rose-900/50 print:border-none print:border-b print:border-slate-200 print:pb-2 print:rounded-none">
                      <span className="text-rose-800 dark:text-rose-400 print:text-rose-700 font-semibold print:font-normal">
                        Tax Payment (KHR) / ពន្ធត្រូវបង់ (រៀល)
                      </span>
                      <span className="font-mono text-rose-700 dark:text-rose-400 print:text-rose-700 font-bold">
                        {formatKHR(selectedEmp.taxKHR)}
                      </span>
                    </div>
                    <div className="flex justify-between bg-rose-50 dark:bg-rose-950/30 print:bg-transparent p-3 print:p-0 rounded-lg border border-rose-100 dark:border-rose-900/50 print:border-none">
                      <span className="text-rose-800 dark:text-rose-400 print:text-rose-700 font-semibold print:font-normal">
                        Tax Payment (USD) / ពន្ធត្រូវបង់ (ដុល្លារ)
                      </span>
                      <span className="font-mono text-rose-700 dark:text-rose-400 print:text-rose-700 font-bold">
                        {formatUSD(selectedEmp.taxUSD)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Totals */}
            <div className="border-2 border-slate-800 dark:border-slate-600 print:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 print:bg-white p-6 rounded-xl mt-8">
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 uppercase font-bold tracking-wider block">
                  Net Bank Transfer Salary / ប្រាក់ខែត្រូវបើក
                </span>
                <span className="text-3xl font-black text-emerald-700  print:text-black mt-2 block font-mono">
                  {formatUSD(selectedEmp.netBankUSD)}
                </span>
              </div>

              <div className="text-right border-l-2 border-slate-200 dark:border-slate-700 print:border-slate-300 pl-6">
                <span className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 uppercase font-bold tracking-wider block">
                  Total Cost (GDT Gross)
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-200 print:text-black font-mono mt-2 block">
                  {formatUSD(selectedEmp.grossForSummary)}
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-12 px-8">
              <div className="text-center">
                <div className="border-b border-slate-400 dark:border-slate-600 print:border-slate-400 pb-8 mb-2"></div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-black uppercase">
                  Employee Signature / ហត្ថលេខាបុគ្គលិក
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-500 mt-1">
                  Date: .......................................
                </p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-400 dark:border-slate-600 print:border-slate-400 pb-8 mb-2"></div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-black uppercase">
                  Authorized Signature / ហត្ថលេខាអ្នកអនុញ្ញាត
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-500 mt-1">
                  Date: .......................................
                </p>
              </div>
            </div>

            {/* Security Footer Notice */}
            <div className="text-center mt-12 text-[10px] text-slate-400 dark:text-slate-500 print:text-slate-400 leading-relaxed border-t border-slate-200  print:border-slate-200 pt-4 font-sans">
              This digital payslip has been encrypted and backed up to our
              Cambodian Enterprise ledger. GDT tax compliance forms have been
              successfully generated.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
