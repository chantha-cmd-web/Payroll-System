/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Moon, Sun, Monitor, Fingerprint, Key, Database, Bell,
  RefreshCw, Lock, Trash2, Eye, EyeOff, Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BackupHistory } from '../types';

interface SettingsPanelProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  syncWithSystemTheme: boolean;
  setSyncWithSystemTheme: (val: boolean) => void;
  mfaEnabled: boolean;
  setMfaEnabled: (val: boolean) => void;
  biometricsEnabled: boolean;
  setBiometricsEnabled: (val: boolean) => void;
  backupHistory: BackupHistory[];
  onTriggerBackup: () => void;
  onClearBackupHistory: () => void;
  backupKey: string;
  setBackupKey: (val: string) => void;
  exchangeRate: number;
  setExchangeRate: (val: number) => void;
  onTriggerSimulatedNotification: (type: 'tax' | 'sync' | 'backup' | 'mfa') => void;
}

export default function SettingsPanel({
  darkMode,
  setDarkMode,
  syncWithSystemTheme,
  setSyncWithSystemTheme,
  mfaEnabled,
  setMfaEnabled,
  biometricsEnabled,
  setBiometricsEnabled,
  backupHistory,
  onTriggerBackup,
  onClearBackupHistory,
  backupKey,
  setBackupKey,
  exchangeRate,
  setExchangeRate,
  onTriggerSimulatedNotification
}: SettingsPanelProps) {
  const [showBackupKey, setShowBackupKey] = useState(false);
  const [testingBiometrics, setTestingBiometrics] = useState(false);

  // Monitor System Level Color Scheme if active
  useEffect(() => {
    if (syncWithSystemTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkMode(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => {
        setDarkMode(e.matches);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [syncWithSystemTheme, setDarkMode]);

  const handleToggleSystemSync = (checked: boolean) => {
    setSyncWithSystemTheme(checked);
    if (checked) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkMode(mediaQuery.matches);
    }
  };

  const handleTestBiometrics = () => {
    setTestingBiometrics(true);
    setTimeout(() => {
      setTestingBiometrics(false);
      setBiometricsEnabled(!biometricsEnabled);
    }, 1500);
  };

  return (
    <div className="flex-grow flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm overflow-y-auto max-w-4xl mx-auto w-full">
      {/* Subheader */}
      <div className="border-b border-slate-200 dark:border-slate-850 pb-5 mb-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-500" />
          System Settings & Security Config
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Manage visual settings, enroll biometrics credentials, establish multi-factor authentication, configure encrypted cloud backup nodes, and simulate push alerts.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Row 1: Appearance & Theme settings */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-500" />
            1. Appearance & Sync Theme Settings
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Toggle system-level sync */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-slate-400" />
                  Auto-Sync with System Appearance
                </h5>
                <p className="text-[10px] text-slate-400 mt-1">
                  Sync theme automatically with your device system appearance.
                </p>
              </div>
              <input
                type="checkbox"
                checked={syncWithSystemTheme}
                onChange={(e) => handleToggleSystemSync(e.target.checked)}
                className="w-4.5 h-4.5 accent-brand-500 cursor-pointer"
              />
            </div>

            {/* Manual Toggle */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  {darkMode ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  Toggle Dark / Light Mode
                </h5>
                <p className="text-[10px] text-slate-400 mt-1">
                  {syncWithSystemTheme ? 'Disabled (System sync is active)' : 'Manually choose dark or light styling.'}
                </p>
              </div>
              <button
                disabled={syncWithSystemTheme}
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl border transition ${
                  syncWithSystemTheme 
                    ? 'bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Biometrics & Multi-Factor Security */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-500" />
            2. Biometrics & Multi-Factor Authentication (MFA)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Biometric setup */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-brand-500" />
                    Biometrics Setup (Face ID / Fingerprint)
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Faster access across both iOS and Android via native system-level biometric sheets.
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  biometricsEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {biometricsEnabled ? 'Enrolled' : 'Not Set'}
                </span>
              </div>

              <button
                onClick={handleTestBiometrics}
                disabled={testingBiometrics}
                className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 rounded-lg font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition flex items-center justify-center gap-1.5"
              >
                {testingBiometrics ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Fingerprint className="w-3.5 h-3.5" />
                    {biometricsEnabled ? 'Remove Enrollment' : 'Enroll Device Biometrics'}
                  </>
                )}
              </button>
            </div>

            {/* MFA Setup */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-violet-500" />
                    Robust Multi-Factor Auth (MFA)
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Require a secure 6-digit Authenticator verification code upon logging into the portal.
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  mfaEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-400'
                }`}>
                  {mfaEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-800/60">
                <span className="font-semibold text-slate-500">MFA Verification Status</span>
                <input
                  type="checkbox"
                  checked={mfaEnabled}
                  onChange={(e) => setMfaEnabled(e.target.checked)}
                  className="w-4.5 h-4.5 accent-violet-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Secure Backup Configuration */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-500" />
            3. Encrypted Cloud Storage Backups (AES-GCM-256)
          </h4>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              <div className="md:col-span-2">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  Backup Secret Encryption Key
                </h5>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Backup files are encrypted locally with this key before dispatching. Keep this key safe.
                </p>
              </div>

              <div className="relative">
                <input
                  type={showBackupKey ? 'text' : 'password'}
                  value={backupKey}
                  onChange={(e) => setBackupKey(e.target.value)}
                  placeholder="Enter secret key"
                  className="w-full pl-3 pr-10 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowBackupKey(!showBackupKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showBackupKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Backup history logs */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  Secure Backup History Ledger
                </h5>
                {backupHistory.length > 0 && (
                  <button
                    onClick={onClearBackupHistory}
                    className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    Purge Logs
                  </button>
                )}
              </div>

              {backupHistory.length === 0 ? (
                <div className="text-center py-6 text-slate-400 font-medium">
                  No encrypted backups created in this session.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {backupHistory.map((b) => (
                    <div
                      key={b.id}
                      className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-900"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-300 block text-[11px]">
                          {b.filename}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                          Size: {b.size} • Key ID: {b.checksum.substring(0, 8)}... • Encrypted: Yes
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {b.timestamp.split('T')[1]?.substring(0, 5) || b.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 4: Simulated Push Notification center */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-violet-500 animate-bounce" />
            4. Sandbox Push Notification Simulator
          </h4>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Trigger simulated native push alerts to preview critical system notifications, GDT tax alerts, backup responses, or offline/online status logs.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <button
              onClick={() => onTriggerSimulatedNotification('tax')}
              className="py-2.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 transition text-center"
            >
              Tax Threshold alert
            </button>
            <button
              onClick={() => onTriggerSimulatedNotification('sync')}
              className="py-2.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 transition text-center"
            >
              Sync Interrupted alert
            </button>
            <button
              onClick={() => onTriggerSimulatedNotification('backup')}
              className="py-2.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 transition text-center"
            >
              Backup Success alert
            </button>
            <button
              onClick={() => onTriggerSimulatedNotification('mfa')}
              className="py-2.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 transition text-center"
            >
              MFA Audited alert
            </button>
          </div>
        </div>

        {/* Row 5: Finance & Calculation Settings */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-emerald-500" />
            5. Finance & Calculation Settings
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="flex flex-col p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                NBC Exchange Rate (KHR/USD)
              </h5>
              <p className="text-[10px] text-slate-400 mb-3">
                Current exchange rate matching National Bank of Cambodia reference rate for GDT tax conversion.
              </p>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
