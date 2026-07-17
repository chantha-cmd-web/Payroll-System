/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  employeeName: string;
  field: string;
  oldValue: string | number | boolean | undefined;
  newValue: string | number | boolean | undefined;
}

export interface Employee {
  id: number;
  staffId: string;
  name: string;
  nat: 'Khmer' | 'Expat';
  pos: string;
  dept: string;
  campus: string;
  employmentType: 'Full-Time' | 'Semi-Full-Time' | 'Part-Time';
  doj: string;
  empDate: string;
  basic: number; // USD
  hourlyRate: number; // For part time and semi-full-time
  scheduleHours?: number; // For semi-full-time (Teaching Schedule per month)
  presentHours: number; // For part time
  absenceHours: number; // For semi-full-time and part-time
  substituteHours: number; // For semi-full-time
  prePayPct: number; // %
  absence: number; // USD (Calculated or fixed)
  maternity: number; // USD
  ot: number; // USD
  caAdd: number; // Cash Advance / Allowance Add
  caDed: number; // Cash Advance Ded
  nssf: number; // NSSF Ded
  seniority: number; // Seniority Indemnity
  spouse: boolean; // Spouse Relief (Khmer only)
  kids: number; // Number of kids for Relief (Khmer only)
  allowance: number; // Tax-exempt / specific allowance (USD)
  sdReturn: number; // Visa / special deduction return
  provFund: number; // Provident fund deduction
  bankAcc: string;
  email: string;
  remarks: string;
  status: string;
  customGrossUSD?: number;
  customSalaryPaidKHR?: number;
}

export interface PayrollResult extends Employee {
  prepayAmount: number;
  grossSalaryUSD: number;
  salaryPaidKHR: number;
  taxBaseKHR: number;
  taxRate: string;
  taxKHR: number;
  taxUSD: number;
  salaryAfterTaxUSD: number;
  netBankUSD: number;
  grossForSummary: number;
}

export interface WidgetConfig {
  id: string;
  title: string;
  enabled: boolean;
  type: 'stat' | 'chart' | 'list' | 'system';
  size: 'sm' | 'md' | 'lg';
}

export interface BackupHistory {
  id: string;
  timestamp: string;
  filename: string;
  size: string;
  checksum: string;
  encrypted: boolean;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'alert';
}

export interface OfflineQueueItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: string;
  payload: Employee | Omit<Employee, 'id'>;
}
