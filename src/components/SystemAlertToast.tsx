/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Fingerprint, X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
}

interface SystemAlertToastProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
  biometricPrompt: {
    visible: boolean;
    platform: 'ios' | 'android';
    onSuccess: () => void;
    onCancel: () => void;
  } | null;
}

export default function SystemAlertToast({ toasts, removeToast, biometricPrompt }: SystemAlertToastProps) {
  const [bioState, setBioState] = useState<'scanning' | 'success' | 'failed'>('scanning');

  useEffect(() => {
    if (biometricPrompt?.visible) {
      setBioState('scanning');
      let successTimer: ReturnType<typeof setTimeout>;
      const timer = setTimeout(() => {
        setBioState('success');
        successTimer = setTimeout(() => {
          biometricPrompt.onSuccess();
        }, 1200);
      }, 2000);
      return () => {
        clearTimeout(timer);
        clearTimeout(successTimer);
      };
    }
  }, [biometricPrompt]);

  return (
    <>
      {/* Toast Notifications Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-4 flex items-start gap-3 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-brand-500" />
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {toast.type === 'alert' && <ShieldCheck className="w-5 h-5 text-rose-500" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-brand-500" />}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{toast.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Biometric Prompt Simulator */}
      <AnimatePresence>
        {biometricPrompt?.visible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            {biometricPrompt.platform === 'ios' ? (
              /* iOS FaceID Prompt */
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="w-full max-w-xs bg-slate-900/90 text-white backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-slate-800 flex flex-col items-center text-center"
              >
                <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                  {/* Face Scan Reticle */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-slate-700 border-dashed animate-spin [animation-duration:15s]" />
                  {bioState === 'scanning' ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-brand-400"
                    >
                      <Fingerprint className="w-12 h-12 text-slate-300" />
                    </motion.div>
                  ) : bioState === 'success' ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400"
                    >
                      <CheckCircle2 className="w-7 h-7" />
                    </motion.div>
                  ) : (
                    <X className="w-12 h-12 text-rose-500" />
                  )}
                </div>

                <h3 className="text-base font-semibold tracking-tight text-slate-100">Face ID</h3>
                <p className="text-xs text-slate-400 mt-2">
                  {bioState === 'scanning' && 'Scanning for Cambodia Payroll Auth...'}
                  {bioState === 'success' && 'Authenticated Successfully'}
                </p>

                <div className="w-full h-px bg-slate-800 my-4" />

                <button
                  onClick={biometricPrompt.onCancel}
                  className="text-sm font-semibold text-brand-400 hover:text-brand-300 transition w-full py-1"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              /* Android Fingerprint Prompt (Bottom Sheet style) */
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 22, stiffness: 250 }}
                className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 pb-8 shadow-2xl text-white"
              >
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-800 rounded-xl text-slate-300">
                    <Fingerprint className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-slate-100">Biometric Verification</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Confirm fingerprint or facial recognition on this device to access Cambodia Payroll securely.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center my-8">
                  <div className="relative flex items-center justify-center w-16 h-16">
                    {bioState === 'scanning' ? (
                      <>
                        <span className="absolute inline-flex h-full w-full rounded-full bg-brand-500/10 animate-ping" />
                        <Fingerprint className="w-10 h-10 text-brand-500 relative z-10" />
                      </>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 mt-3 font-mono">
                    {bioState === 'scanning' ? 'Touch the fingerprint sensor' : 'Fingerprint recognized'}
                  </span>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={biometricPrompt.onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setBioState('success')}
                    className="px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-500 rounded-lg transition"
                  >
                    Use PIN
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
