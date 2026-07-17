/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutGrid, Users, Calculator, FileText, Archive, Settings, LogOut, 
  Wifi, WifiOff, ShieldCheck, Database, Fingerprint, HelpCircle, RefreshCw, Sun, Moon, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, PayrollResult, BackupHistory, SystemNotification, OfflineQueueItem, AuditLog } from './types';

// Import newly created modular sub-components
import LoginScreen from './components/LoginScreen';
import DashboardOverview from './components/DashboardOverview';
import EmployeeMaster from './components/EmployeeMaster';
import PayrollProcessor from './components/PayrollProcessor';
import PayslipsView from './components/PayslipsView';
import ReportsExporter from './components/ReportsExporter';
import SettingsPanel from './components/SettingsPanel';
import SystemAlertToast from './components/SystemAlertToast';
import AuditTrail from './components/AuditTrail';

// Pre-populated compliant demo data matching the user's Cambodian Tax schema
const INITIAL_EMPLOYEES: Employee[] = [
  { 
    id: 1, 
    staffId: 'C001', 
    name: 'Sokha Chea', 
    nat: 'Khmer', 
    pos: 'Manager', 
    dept: 'Operations', 
    campus: 'Main', 
    employmentType: 'Full-Time',
    doj: '2022-01-15', 
    empDate: '2022-01-15', 
    basic: 2000,
    hourlyRate: 0,
    presentHours: 0,
    absenceHours: 0,
    substituteHours: 0,
    prePayPct: 100, 
    absence: 0, 
    maternity: 0, 
    ot: 150, 
    caAdd: 0, 
    caDed: 50, 
    nssf: 0, 
    seniority: 0, 
    spouse: true, 
    kids: 2, 
    allowance: 100, 
    sdReturn: 0, 
    provFund: 0, 
    bankAcc: 'ABA 012 345 678', 
    email: 'sokha@company.com', 
    remarks: 'Standard Run',
    status: 'W'
  },
  { 
    id: 2, 
    staffId: 'C002', 
    name: 'John Doe', 
    nat: 'Expat', 
    pos: 'Director', 
    dept: 'Finance', 
    campus: 'North', 
    employmentType: 'Semi-Full-Time',
    doj: '2023-03-01', 
    empDate: '2023-03-01', 
    basic: 3500,
    hourlyRate: 0,
    presentHours: 0,
    absenceHours: 4,
    substituteHours: 12,
    prePayPct: 100, 
    absence: 0, 
    maternity: 0, 
    ot: 0, 
    caAdd: 0, 
    caDed: 0, 
    nssf: 0, 
    seniority: 0, 
    spouse: false, 
    kids: 0, 
    allowance: 300, 
    sdReturn: 150, 
    provFund: 0, 
    bankAcc: 'ABA 876 543 210', 
    email: 'john@company.com', 
    remarks: 'Visa included',
    status: 'W'
  },
  { 
    id: 3, 
    staffId: 'C003', 
    name: 'Bopha Nguon', 
    nat: 'Khmer', 
    pos: 'Teacher', 
    dept: 'Academics', 
    campus: 'Main', 
    employmentType: 'Part-Time',
    doj: '2024-05-10', 
    empDate: '2024-05-10', 
    basic: 0,
    hourlyRate: 15,
    presentHours: 40,
    absenceHours: 0,
    substituteHours: 0,
    prePayPct: 100, 
    absence: 20, 
    maternity: 0, 
    ot: 45, 
    caAdd: 0, 
    caDed: 0, 
    nssf: 0, 
    seniority: 0, 
    spouse: true, 
    kids: 1, 
    allowance: 50, 
    sdReturn: 0, 
    provFund: 0, 
    bankAcc: 'ABA 112 233 445', 
    email: 'bopha@company.com', 
    remarks: 'Absence deducted',
    status: 'W'
  }
];

export default function App() {
  // Authentication & Security state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  
  // App Navigation & Panel
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // App Master Database State
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  
  // Exchange Rate State (up to date with NBC of Cambodia)
  const [exchangeRate, setExchangeRate] = useState(4100);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleResetData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset All Data',
      message: 'Are you sure you want to reset all data? This will remove all employees and cannot be undone.',
      onConfirm: () => {
        setEmployees([]);
        triggerToast('Data Reset', 'All employee data has been successfully cleared.', 'success');
        setConfirmDialog(null);
      }
    });
  };

  const handleResetOT = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset OT & Substitutes',
      message: 'Are you sure you want to reset OT to 0 for all employees? This will also clear manual gross salary overrides.',
      onConfirm: () => {
        setEmployees(prev => prev.map(emp => {
          if (emp.customGrossUSD !== undefined || emp.customSalaryPaidKHR !== undefined) {
            const newLog: AuditLog = {
              id: Math.random().toString(36).substring(7),
              timestamp: new Date().toISOString(),
              user: 'Admin',
              employeeName: emp.name,
              field: 'Reset OT (Cleared Gross Salary Overrides)',
              oldValue: emp.customGrossUSD !== undefined ? emp.customGrossUSD : emp.customSalaryPaidKHR,
              newValue: undefined
            };
            setAuditLogs(logs => [newLog, ...logs]);
          }
          return { 
            ...emp, 
            ot: 0, 
            substituteHours: 0,
            customGrossUSD: undefined,
            customSalaryPaidKHR: undefined 
          };
        }));
        triggerToast('OT Reset', 'Overtime has been reset to 0 for all employees.', 'success');
        setConfirmDialog(null);
      }
    });
  };

  const syncAttendanceData = (records: any[]) => {
    let missingIds = new Set<string>();
    let updateCount = 0;

    // 1. Find the Staff ID column
    let idCol = '';
    for (const record of records) {
      for (const [key, val] of Object.entries(record)) {
        const strVal = String(val).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (['id', 'staffid', 'employeeid', 'empid'].includes(strVal) || strVal.includes('staffid') || strVal.includes('idno')) {
          idCol = key;
          break;
        }
      }
      if (idCol) break;
    }

    // 2. Aggregate the hours per Staff ID
    const aggregated: Record<string, { absence: number, sub: number }> = {};
    
    records.forEach(record => {
      let staffId = '';
      if (idCol && record[idCol]) {
        staffId = String(record[idCol]).trim();
      } else {
        // Fallbacks if no explicit header matched
        staffId = String(record.B || record.C || record.ID || record.id || record['Staff ID'] || record['staffId'] || '').trim();
      }

      if (!staffId || staffId.toLowerCase().includes('id') || staffId.toLowerCase().includes('staff')) return;

      const parseHrs = (val: any) => {
        if (val === undefined || val === null || val === '') return undefined;
        const num = Number(String(val).replace(/,/g, ''));
        return isNaN(num) ? undefined : num;
      };

      const absenceHrs = parseHrs(record.AN) ?? parseHrs(record['Absence']) ?? 0;
      const subHrs = parseHrs(record.AM) ?? parseHrs(record['Substitute']) ?? 0;

      // Normalize staff ID for robust matching
      const normalizedStaffId = staffId.toUpperCase().replace(/\s+/g, '');

      if (!aggregated[normalizedStaffId]) {
        aggregated[normalizedStaffId] = { absence: 0, sub: 0 };
      }
      aggregated[normalizedStaffId].absence += absenceHrs;
      aggregated[normalizedStaffId].sub += subHrs;
    });

    setEmployees(prev => {
      const updatedEmployees = [...prev];
      for (const [staffId, data] of Object.entries(aggregated)) {
        const empIndex = updatedEmployees.findIndex(e => 
          e.staffId.toUpperCase().replace(/\s+/g, '') === staffId && 
          e.employmentType === 'Semi-Full-Time'
        );
        
        if (empIndex === -1) {
          missingIds.add(staffId);
        } else {
          updatedEmployees[empIndex] = {
            ...updatedEmployees[empIndex],
            absenceHours: data.absence,
            substituteHours: data.sub
          };
          updateCount++;
        }
      }
      return updatedEmployees;
    });

    if (missingIds.size > 0) {
      triggerToast('Attendance Sync Warning', `Missing IDs not found: ${Array.from(missingIds).join(', ')}`, 'warning');
    }
    if (updateCount > 0) {
      triggerToast('Attendance Synced', `${updateCount} staff attendance records updated & consolidated.`, 'success');
    }
  };

  const syncSalaryInfo = (records: any[]) => {
    let missingIds = new Set<string>();
    let updateCount = 0;

    // 1. Find the Staff ID column
    let idCol = '';
    for (const record of records) {
      for (const [key, val] of Object.entries(record)) {
        const strVal = String(val).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (['id', 'staffid', 'employeeid', 'empid'].includes(strVal) || strVal.includes('staffid') || strVal.includes('idno')) {
          idCol = key;
          break;
        }
      }
      if (idCol) break;
    }

    setEmployees(prev => {
      const updatedEmployees = [...prev];
      records.forEach(record => {
        let staffId = '';
        if (idCol && record[idCol]) {
          staffId = String(record[idCol]).trim();
        } else {
          staffId = String(record.B || record.C || record.ID || record.id || record['Staff ID'] || record['staffId'] || '').trim();
        }

        if (!staffId || staffId.toLowerCase().includes('id') || staffId.toLowerCase().includes('staff')) return;

        const rate = Number(String(record.Rate || record.rate || record['Rate per hour'] || record['Hr Rate'] || record['Hr. Rate'] || record.L || record.K || '').replace(/,/g, '')) || 0;
        const basic = Number(String(record.Basic || record.basic || record['Basic Salary'] || record['basic salary'] || record.J || '').replace(/,/g, '')) || 0;

        const normalizedStaffId = staffId.toUpperCase().replace(/\s+/g, '');

        const empIndex = updatedEmployees.findIndex(e => 
          e.staffId.toUpperCase().replace(/\s+/g, '') === normalizedStaffId && 
          e.employmentType === 'Semi-Full-Time'
        );
        
        if (empIndex === -1) {
          missingIds.add(normalizedStaffId);
        } else {
          updatedEmployees[empIndex] = {
            ...updatedEmployees[empIndex],
            hourlyRate: rate || updatedEmployees[empIndex].hourlyRate,
            basic: basic || updatedEmployees[empIndex].basic
          };
          updateCount++;
        }
      });
      return updatedEmployees;
    });

    if (missingIds.size > 0) {
      triggerToast('Salary Sync Warning', `Missing IDs not found: ${Array.from(missingIds).join(', ')}`, 'warning');
    }
    if (updateCount > 0) {
      triggerToast('Salary Synced', `${updateCount} staff basic salary & rate records updated.`, 'success');
    }
  };

  const syncStatusData = (records: any[]) => {
    let missingIds = new Set<string>();
    let updateCount = 0;

    let idCol = '';
    for (const record of records) {
      for (const [key, val] of Object.entries(record)) {
        const strVal = String(val).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (['id', 'staffid', 'employeeid', 'empid'].includes(strVal) || strVal.includes('staffid') || strVal.includes('idno')) {
          idCol = key;
          break;
        }
      }
      if (idCol) break;
    }

    setEmployees(prev => {
      const updatedEmployees = [...prev];
      records.forEach(record => {
        let staffId = '';
        if (idCol && record[idCol]) {
          staffId = String(record[idCol]).trim();
        } else {
          staffId = String(record.B || record.C || record.ID || record.id || record['Staff ID'] || record['staffId'] || '').trim();
        }

        if (!staffId || staffId.toLowerCase().includes('id') || staffId.toLowerCase().includes('staff')) return;

        // Try to get status column
        let statusVal = '';
        for (const [key, val] of Object.entries(record)) {
           const strKey = key.toLowerCase();
           if (strKey.includes('status') || strKey === 'av') {
              statusVal = String(val).trim().toUpperCase();
              break;
           }
        }
        if (!statusVal) {
           statusVal = String(record.Status || record.status || '').trim().toUpperCase();
        }

        if (!statusVal) return;

        const normalizedStaffId = staffId.toUpperCase().replace(/\s+/g, '');

        const empIndex = updatedEmployees.findIndex(e => 
          e.staffId.toUpperCase().replace(/\s+/g, '') === normalizedStaffId && 
          e.employmentType === 'Semi-Full-Time'
        );
        
        if (empIndex === -1) {
          missingIds.add(normalizedStaffId);
        } else {
          updatedEmployees[empIndex] = {
            ...updatedEmployees[empIndex],
            status: statusVal
          };
          updateCount++;
        }
      });
      return updatedEmployees;
    });

    if (missingIds.size > 0) {
      triggerToast('Status Sync Warning', `Missing IDs not found: ${Array.from(missingIds).join(', ')}`, 'warning');
    }
    if (updateCount > 0) {
      triggerToast('Status Synced', `${updateCount} staff status records updated.`, 'success');
    }
  };

  // Theme configuration (Dark mode defaults to active)
  const [darkMode, setDarkMode] = useState(true);
  const [syncWithSystemTheme, setSyncWithSystemTheme] = useState(true);

  // Offline Mode & Connectivity simulation
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Secure Backups History State
  const [backupKey, setBackupKey] = useState('cam_pay_secure_aes256_k');
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([
    {
      id: 'b1',
      timestamp: '2026-06-25T14:30:00-07:00',
      filename: 'cambodia_payroll_backup_20260625.gdt',
      size: '24.5 KB',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      encrypted: true
    }
  ]);

  // System Notifications and Toast system
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'alert' }[]>([]);
  const [biometricPrompt, setBiometricPrompt] = useState<{ visible: boolean; platform: 'ios' | 'android'; onSuccess: () => void; onCancel: () => void } | null>(null);

  // Apply Dark Mode class to <html> tag for Tailwind styling
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Trigger simple overlay Toast Alerts
  const triggerToast = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, title, message, type }]);
    
    // Add to notification ledger
    const notificationItem: SystemNotification = {
      id: Math.random().toString(36).substring(7),
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type
    };
    setNotifications(prev => [notificationItem, ...prev]);

    // Auto-remove Toast after 4.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- COMPLIANT CAMBODIAN TAX ENGINE ---
  const processedData: PayrollResult[] = useMemo(() => {
    return employees.map(emp => {
      // 1. Gross Salary (GDT compliant calculation)
      
      let basePay = emp.basic;
      let calculatedAbsence = emp.absence;
      let calculatedOT = emp.ot;

      if (emp.employmentType === 'Part-Time') {
        basePay = Number((emp.hourlyRate * emp.presentHours).toFixed(2));
        calculatedAbsence = Number((emp.absenceHours * emp.hourlyRate).toFixed(2));
      } else if (emp.employmentType === 'Semi-Full-Time') {
        basePay = emp.basic; // Removed scheduleHours, Semi-Full-Time base pay comes from Basic Salary
        calculatedAbsence = Number((emp.absenceHours * emp.hourlyRate).toFixed(2));
        calculatedOT = Number((emp.substituteHours * emp.hourlyRate).toFixed(2));
      }

      // 12. Pre. Pay / Percentage auto calculation based on status
      let prepayAmount = 0;
      if (emp.status === 'TT') {
        prepayAmount = basePay / 2;
      } else if (emp.status === 'UN' || emp.status === 'ML') {
        prepayAmount = 0;
      } else if (emp.status === 'T' || emp.status === 'W') {
        prepayAmount = basePay;
      } else {
        // Fallback or "N", "SP" manual entry logic
        // If user enters a value > 100, treat it as a direct monetary amount. Otherwise, treat as percentage of basic.
        prepayAmount = emp.prePayPct > 100 ? emp.prePayPct : (basePay * (emp.prePayPct / 100));
      }
      prepayAmount = Math.round(prepayAmount * 100) / 100;
      
      // Sum from Prepay until Seniority / GEP (columns 12 to 19)
      // Using exact column values to match Excel SUM(S72:Z72), applying signs from headers
      const rawGross = prepayAmount - calculatedAbsence + emp.maternity + calculatedOT + emp.caAdd - emp.caDed - emp.nssf + emp.seniority;
      const computedGross = Math.round(rawGross * 100) / 100;
      const grossSalaryUSD = emp.customGrossUSD !== undefined ? emp.customGrossUSD : computedGross;
      
      
      
      // 2. KHR salary conversion for GDT schedules
      const computedSalaryPaidKHR = grossSalaryUSD * exchangeRate;
      const salaryPaidKHR = emp.customSalaryPaidKHR !== undefined ? emp.customSalaryPaidKHR : computedSalaryPaidKHR;

      // 3. Spouses and Dependent Kids tax reliefs (KHR) - applicable to Khmer nationals only
      let reliefKHR = 0;
      if (emp.nat === 'Khmer') {
        if (emp.spouse) reliefKHR += 150000;
        reliefKHR += (emp.kids * 150000);
      }

      // 4. Progressive Tax Calculation Base in KHR
      const allowanceKHR = emp.allowance * exchangeRate;
      const taxBaseKHR = Math.max(0, salaryPaidKHR - reliefKHR + allowanceKHR);

      // 5. Official progressive tax schedules and rate calculations
      let taxKHR = 0;
      let taxRate = '0%';
      if (emp.nat !== 'Khmer') {
        // Expat non-residents are taxed at flat 20% flat rate on all Cambodian earned income
        taxKHR = taxBaseKHR * 0.20;
        taxRate = '20% Flat';
      } else {
        // Progressive Tiers for Khmer Nationals
        if (taxBaseKHR <= 1500000) {
          taxKHR = 0;
          taxRate = '0%';
        } else if (taxBaseKHR <= 2000000) {
          taxKHR = (taxBaseKHR * 0.05) - 75000;
          taxRate = '5%';
        } else if (taxBaseKHR <= 8500000) {
          taxKHR = (taxBaseKHR * 0.10) - 175000;
          taxRate = '10%';
        } else if (taxBaseKHR <= 12500000) {
          taxKHR = (taxBaseKHR * 0.15) - 600000;
          taxRate = '15%';
        } else {
          taxKHR = (taxBaseKHR * 0.20) - 1225000;
          taxRate = '20%';
        }
      }

      taxKHR = Math.max(0, taxKHR);
      const taxUSD = taxKHR / exchangeRate;

      // 6. Net Salaries
      const salaryAfterTaxUSD = grossSalaryUSD + emp.allowance - taxUSD;
      const netBankUSD = salaryAfterTaxUSD + emp.sdReturn - emp.provFund;
      const grossForSummary = grossSalaryUSD + emp.allowance + emp.sdReturn;

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
    });
  }, [employees, exchangeRate]);

  // Handle Employee Database modifications with Online Sync simulation
  const handleAddEmployee = (newEmp: Omit<Employee, 'id'>) => {
    if (!isOnline) {
      // Queue offline change
      const queueItem: OfflineQueueItem = {
        id: Math.random().toString(36).substring(7),
        action: 'CREATE',
        timestamp: new Date().toISOString(),
        payload: newEmp
      };
      setOfflineQueue(prev => [...prev, queueItem]);
      triggerToast('Offline Queued', `Employee "${newEmp.name}" added to offline queue`, 'warning');
    } else {
      setEmployees(prev => {
        const id = Math.max(...prev.map(e => e.id), 0) + 1;
        return [...prev, { ...newEmp, id }];
      });
      triggerToast('Record Created', `Employee "${newEmp.name}" successfully saved`, 'success');
    }
  };

  const handleBulkAddEmployees = (newEmps: Omit<Employee, 'id'>[]) => {
    if (!newEmps.length) return;
    if (!isOnline) {
      const queueItems: OfflineQueueItem[] = newEmps.map(emp => ({
        id: Math.random().toString(36).substring(7),
        action: 'CREATE',
        timestamp: new Date().toISOString(),
        payload: emp
      }));
      setOfflineQueue(prev => [...prev, ...queueItems]);
      triggerToast('Offline Queued', `${newEmps.length} employees added to offline queue`, 'warning');
    } else {
      setEmployees(prev => {
        let maxId = Math.max(...prev.map(e => e.id), 0);
        const added = newEmps.map(emp => ({ ...emp, id: ++maxId }));
        return [...prev, ...added];
      });
      triggerToast('Records Created', `${newEmps.length} employees successfully imported`, 'success');
    }
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    if (!isOnline) {
      const queueItem: OfflineQueueItem = {
        id: Math.random().toString(36).substring(7),
        action: 'UPDATE',
        timestamp: new Date().toISOString(),
        payload: updatedEmp
      };
      setOfflineQueue(prev => [...prev, queueItem]);
      triggerToast('Offline Queued', `Update for "${updatedEmp.name}" added to offline queue`, 'warning');
    } else {
      setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
      triggerToast('Record Updated', `Employee "${updatedEmp.name}" successfully updated`, 'success');
    }
  };

  const handleDeleteEmployee = (id: number) => {
    const target = employees.find(e => e.id === id);
    if (!target) return;

    if (!isOnline) {
      const queueItem: OfflineQueueItem = {
        id: Math.random().toString(36).substring(7),
        action: 'DELETE',
        timestamp: new Date().toISOString(),
        payload: target
      };
      setOfflineQueue(prev => [...prev, queueItem]);
      triggerToast('Offline Queued', `Deletion of "${target.name}" added to offline queue`, 'warning');
    } else {
      setEmployees(prev => prev.filter(e => e.id !== id));
      triggerToast('Record Deleted', `Employee "${target.name}" removed from database`, 'success');
    }
  };

  const handleUpdateField = (id: number, field: string, value: string | number | boolean | undefined) => {
    const target = employees.find(e => e.id === id);
    if (!target) return;

    if (field === 'customGrossUSD' || field === 'customSalaryPaidKHR') {
      const oldValue = target[field as keyof Employee] as string | number | undefined;
      if (oldValue !== value) {
        const newLog: AuditLog = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          user: 'Admin', // User who performed the change
          employeeName: target.name,
          field: field === 'customGrossUSD' ? 'Gross Salary (USD)' : 'Salary Paid (KHR)',
          oldValue,
          newValue: value
        };
        setAuditLogs(prev => [newLog, ...prev]);
      }
    }

    const updated = { ...target, [field]: value };
    handleUpdateEmployee(updated);
  };

  // Synchronize Offline queue changes back to master ledger
  const triggerSyncUpdates = () => {
    if (offlineQueue.length === 0) return;
    
    // Process offline queue items
    let updatedDb = [...employees];
    offlineQueue.forEach(item => {
      if (item.action === 'CREATE') {
        updatedDb.push(item.payload);
      } else if (item.action === 'UPDATE') {
        updatedDb = updatedDb.map(e => e.id === item.payload.id ? item.payload : e);
      } else if (item.action === 'DELETE') {
        updatedDb = updatedDb.filter(e => e.id !== item.payload.id);
      }
    });

    setEmployees(updatedDb);
    setOfflineQueue([]);
    triggerToast('Database Synchronized', 'All pending offline modifications have been successfully merged', 'success');
  };

  // Secure Encrypted Backups Engine (AES-GCM-256 simulation)
  const triggerEncryptedBackup = () => {
    const timestamp = new Date().toISOString();
    const formattedDate = timestamp.split('T')[0].replace(/-/g, '');
    const filename = `cambodia_payroll_backup_${formattedDate}.gdt`;
    
    // Simulate encryption hash based on backup secret key and data volume
    const size = `${(20 + Math.random() * 8).toFixed(1)} KB`;
    const checksum = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newBackup: BackupHistory = {
      id: Math.random().toString(36).substring(7),
      timestamp,
      filename,
      size,
      checksum,
      encrypted: true
    };

    setBackupHistory(prev => [newBackup, ...prev]);
    triggerToast('Encrypted Backup Secured', `Ledger encrypted via AES-GCM-256 using key ID "${backupKey.substring(0, 6)}..."`, 'success');
  };

  const clearBackupHistory = () => {
    setBackupHistory([]);
    triggerToast('Backup Logs Purged', 'History ledger deleted from local cache', 'info');
  };

  // Biometrics prompt simulation launcher
  const launchBiometricVerification = (platform: 'ios' | 'android', callback: () => void) => {
    setBiometricPrompt({
      visible: true,
      platform,
      onSuccess: () => {
        setBiometricPrompt(null);
        triggerToast('Haptic Verified', 'Native Biometric Token matched successfully', 'success');
        callback();
      },
      onCancel: () => {
        setBiometricPrompt(null);
        triggerToast('Verification Canceled', 'Biometric auth was canceled by user', 'info');
      }
    });
  };

  // Simulated push notification centers for settings
  const triggerSimulatedNotification = (type: 'tax' | 'sync' | 'backup' | 'mfa') => {
    if (type === 'tax') {
      triggerToast(
        'GDT Tax Bracket Warning',
        'Staff C001 Sokha Chea is exceeding progressive tax brackets. Net pay will reflect progressive 20% tier calculations.',
        'warning'
      );
    } else if (type === 'sync') {
      triggerToast(
        'Sync Warning',
        'Network bandwidth degraded in Phnom Penh Main Campus. Local cache is active to sustain productivity.',
        'alert'
      );
    } else if (type === 'backup') {
      triggerToast(
        'Encrypted Cloud Status',
        'AES-GCM-256 backup handshake successfully performed with Cloud Run cluster.',
        'success'
      );
    } else if (type === 'mfa') {
      triggerToast(
        'MFA Device Authorized',
        'Your security token westernassenmenttest@gmail.com is fully validated.',
        'info'
      );
    }
  };

  // Logout routine - Clear user sessions and route back to Landing Portal
  const handleLogoutRoutine = () => {
    triggerToast('Session Cleared', 'Logged out successfully. Secure cookies, session caches, and biometric tokens purged.', 'info');
    setTimeout(() => {
      setIsLoggedIn(false);
      setCurrentUserEmail('');
    }, 600);
  };

  const handleLoginSuccess = (email: string) => {
    setCurrentUserEmail(email);
    setIsLoggedIn(true);
    triggerToast('Security Auth Granted', `Logged in as administrator: ${email}`, 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden">
      
      {/* Toast Alert System overlay */}
      <SystemAlertToast 
        toasts={toasts} 
        removeToast={removeToast} 
        biometricPrompt={biometricPrompt}
      />

      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div
            key="login-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LoginScreen 
              onLoginSuccess={handleLoginSuccess}
              triggerBiometric={launchBiometricVerification}
              mfaEnabled={mfaEnabled}
            />
          </motion.div>
        ) : (
          /* Main App Frame */
          <motion.div
            key="app-frame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen relative overflow-hidden"
          >
            {/* Left Drawer Navigation Panel */}
            <aside className={`bg-slate-900 dark:bg-blue-950 border-r border-slate-800 dark:border-blue-900 flex flex-col transition-all duration-300 z-20 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
              
              {/* Logo / Title block */}
              <div className="px-5 py-5 border-b border-slate-800 dark:border-blue-900 flex items-center justify-between">
                {!sidebarCollapsed ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                      <ShieldCheck className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-xs tracking-tight text-white uppercase">
                        GDT Payroll
                      </h2>
                      <span className="text-[10px] text-blue-400 font-bold tracking-widest block font-mono">
                        CAMBODIA
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-600/30">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>

              {/* Navigation links */}
              <nav className="flex-grow p-4 space-y-2">
                <MenuButton 
                  id="dashboard" 
                  label="Overview Dashboard" 
                  icon={LayoutGrid} 
                  active={activeMenu === 'dashboard'} 
                  collapsed={sidebarCollapsed} 
                  onClick={setActiveMenu} 
                />
                <MenuButton 
                  id="employees" 
                  label="Employee Master" 
                  icon={Users} 
                  active={activeMenu === 'employees'} 
                  collapsed={sidebarCollapsed} 
                  onClick={setActiveMenu} 
                />
                <MenuButton 
                  id="payroll" 
                  label="Full-time Staff Run" 
                  icon={Calculator} 
                  active={activeMenu === 'payroll'} 
                  collapsed={sidebarCollapsed} 
                  onClick={setActiveMenu} 
                />
                <MenuButton 
                  id="semi-full-time" 
                  label="Semi Full-time Run" 
                  icon={Calculator} 
                  active={activeMenu === 'semi-full-time'} 
                  collapsed={sidebarCollapsed} 
                  onClick={setActiveMenu} 
                />
                <MenuButton 
                  id="part-time" 
                  label="Part-Time Teacher Run" 
                  icon={Calculator} 
                  active={activeMenu === 'part-time'} 
                  collapsed={sidebarCollapsed} 
                  onClick={setActiveMenu} 
                />
                <MenuButton 
                  id="payslips" 
                  label="Payslip Center" 
                  icon={FileText} 
                  active={activeMenu === 'payslips'} 
                  collapsed={sidebarCollapsed} 
                  onClick={setActiveMenu} 
                />
                <MenuButton 
                  id="reports" 
                  label="Export Center" 
                  icon={Archive} 
                  active={activeMenu === 'reports'} 
                  collapsed={sidebarCollapsed} 
                  onClick={setActiveMenu} 
                />
                <MenuButton 
                  id="audit" 
                  label="Audit Logs" 
                  icon={History} 
                  active={activeMenu === 'audit'} 
                  collapsed={sidebarCollapsed} 
                  onClick={setActiveMenu} 
                />
                <MenuButton 
                  id="settings" 
                  label="System Settings" 
                  icon={Settings} 
                  active={activeMenu === 'settings'} 
                  collapsed={sidebarCollapsed} 
                  onClick={setActiveMenu} 
                />
              </nav>

              {/* Network Status Toggle (Manual override simulator in sidebar footer) */}
              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsOnline(!isOnline);
                    triggerToast(
                      !isOnline ? 'Online Restored' : 'Offline Activated',
                      !isOnline ? 'Internet connection back online. Sync engine validated.' : 'Offline mode active. Modifications will queue locally.',
                      !isOnline ? 'success' : 'warning'
                    );
                  }}
                  className={`w-full py-2 px-3 rounded-xl border flex items-center gap-2.5 transition text-left text-xs font-semibold ${
                    isOnline
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25 text-amber-500 animate-pulse'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">Online Sandbox</span>}
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">Offline Mode</span>}
                    </>
                  )}
                </button>
              </div>

              {/* Logout button at bottom */}
              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={handleLogoutRoutine}
                  className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2.5 text-xs text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition text-left font-semibold"
                >
                  <LogOut className="w-4 h-4 text-slate-400" />
                  {!sidebarCollapsed && <span className="truncate">Secure Logout</span>}
                </button>
              </div>

            </aside>

            {/* Right Main workspace panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Toolbar Header */}
              <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      Cambodia Enterprise Hub
                    </h1>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-widest font-mono">
                      GDT Compliance Engine • active sandbox
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  
                  {/* Sync status button helper inside Toolbar */}
                  {offlineQueue.length > 0 && isOnline && (
                    <button
                      onClick={triggerSyncUpdates}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition flex items-center gap-1 animate-pulse"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Sync {offlineQueue.length} Pending
                    </button>
                  )}

                  {/* Dark Mode Toggle */}
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-500 transition"
                  >
                    {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-brand-500" />}
                  </button>

                  {/* Admin card */}
                  <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-950 py-1.5 px-3 rounded-xl border border-slate-150 dark:border-slate-850">
                    <div className="w-7 h-7 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xs">
                      A
                    </div>
                    <div className="hidden sm:block text-left">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block max-w-[120px] truncate" title={currentUserEmail}>
                        {currentUserEmail.split('@')[0]}
                      </span>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono tracking-widest font-semibold">
                        Admin role
                      </span>
                    </div>
                  </div>

                </div>
              </header>

              {/* Main Canvas Workspace with micro motion transitions */}
              <main className="flex-grow overflow-hidden p-6 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMenu}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="h-full flex flex-col"
                  >
                    {activeMenu === 'dashboard' && (
                      <DashboardOverview 
                        processedData={processedData}
                        offlineQueueLength={offlineQueue.length}
                        isOnline={isOnline}
                        toggleNetworkStatus={() => {
                          setIsOnline(!isOnline);
                          triggerToast(
                            !isOnline ? 'Online Restored' : 'Offline Activated',
                            !isOnline ? 'Connection back online. Sync engines verified.' : 'Offline mode active. Modifications will queue locally.',
                            !isOnline ? 'success' : 'warning'
                          );
                        }}
                        triggerSync={triggerSyncUpdates}
                        backupHistoryCount={backupHistory.length}
                        onRunBackup={triggerEncryptedBackup}
                        mfaEnabled={mfaEnabled}
                        biometricsEnabled={biometricsEnabled}
                        onNavigateToMenu={setActiveMenu}
                      />
                    )}

                    {activeMenu === 'employees' && (
                      <EmployeeMaster 
                        employees={employees}
                        onAddEmployee={handleAddEmployee}
                        onBulkAddEmployees={handleBulkAddEmployees}
                        onUpdateEmployee={handleUpdateEmployee}
                        onDeleteEmployee={handleDeleteEmployee}
                        onResetData={handleResetData}
                        onTriggerToast={triggerToast}
                        isOnline={isOnline}
                      />
                    )}

                    {activeMenu === 'payroll' && (
                      <PayrollProcessor 
                        processedData={processedData.filter(d => d.employmentType === 'Full-Time')}
                        onUpdateField={handleUpdateField}
                        onResetOT={handleResetOT}
                        exchangeRate={exchangeRate}
                        isFullTime={true}
                      />
                    )}

                    {activeMenu === 'semi-full-time' && (
                      <PayrollProcessor 
                        processedData={processedData.filter(d => d.employmentType === 'Semi-Full-Time')}
                        onUpdateField={handleUpdateField}
                        onResetOT={handleResetOT}
                        exchangeRate={exchangeRate}
                        onSyncAttendance={syncAttendanceData}
                        onSyncSalary={syncSalaryInfo}
                        onSyncStatus={syncStatusData}
                      />
                    )}

                    {activeMenu === 'part-time' && (
                      <PayrollProcessor 
                        processedData={processedData.filter(d => d.employmentType === 'Part-Time')}
                        onUpdateField={handleUpdateField}
                        onResetOT={handleResetOT}
                        exchangeRate={exchangeRate}
                        isPartTime={true}
                      />
                    )}

                    {activeMenu === 'payslips' && (
                      <PayslipsView 
                        processedData={processedData}
                        onTriggerToast={triggerToast}
                      />
                    )}

                    {activeMenu === 'reports' && (
                      <ReportsExporter 
                        processedData={processedData}
                        onTriggerToast={triggerToast}
                      />
                    )}

                    {activeMenu === 'audit' && (
                      <AuditTrail logs={auditLogs} />
                    )}

                    {activeMenu === 'settings' && (
                      <SettingsPanel 
                        darkMode={darkMode}
                        setDarkMode={setDarkMode}
                        syncWithSystemTheme={syncWithSystemTheme}
                        setSyncWithSystemTheme={setSyncWithSystemTheme}
                        mfaEnabled={mfaEnabled}
                        setMfaEnabled={setMfaEnabled}
                        biometricsEnabled={biometricsEnabled}
                        setBiometricsEnabled={setBiometricsEnabled}
                        backupHistory={backupHistory}
                        onTriggerBackup={triggerEncryptedBackup}
                        onClearBackupHistory={clearBackupHistory}
                        backupKey={backupKey}
                        setBackupKey={setBackupKey}
                        exchangeRate={exchangeRate}
                        setExchangeRate={setExchangeRate}
                        onTriggerSimulatedNotification={triggerSimulatedNotification}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{confirmDialog.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {confirmDialog.message}
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition shadow-sm"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Side Draw Navigation Button sub-component
interface MenuButtonProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
  onClick: (id: string) => void;
}

function MenuButton({ id, label, icon: Icon, active, collapsed, onClick }: MenuButtonProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full p-3 rounded-xl flex items-center gap-3 transition text-left text-xs font-bold leading-none ${
        active
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
          : 'text-slate-400 hover:bg-slate-800 dark:hover:bg-blue-900/40 hover:text-white'
      }`}
    >
      <Icon className={`w-4.5 h-4.5 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
