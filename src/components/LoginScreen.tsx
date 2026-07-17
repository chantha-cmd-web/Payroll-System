/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ShieldAlert,
  Fingerprint,
  Lock,
  ChevronRight,
  UserCheck,
  Key,
  RefreshCw,
  Smartphone,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginScreenProps {
  onLoginSuccess: (userEmail: string) => void;
  triggerBiometric: (platform: "ios" | "android", callback: () => void) => void;
  mfaEnabled: boolean;
}

export default function LoginScreen({
  onLoginSuccess,
  triggerBiometric,
  mfaEnabled,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoCode, setDemoCode] = useState("739401");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter a valid User ID");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (email !== "admin" || password !== "admin@123") {
      setError("Invalid User ID or Password.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mfaEnabled) {
        setMfaStep(true);
        // Randomize mock code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setDemoCode(code);
      } else {
        onLoginSuccess(email);
      }
    }, 1200);
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode === demoCode || mfaCode === "123456") {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess(email);
      }, 800);
    } else {
      setError(
        "Invalid verification code. Use code " + demoCode + " for demo.",
      );
    }
  };

  const handleBiometricAuth = (platform: "ios" | "android") => {
    triggerBiometric(platform, () => {
      onLoginSuccess(email);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-8 relative z-10"
      >
        {/* Header Logo & Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 mb-5 relative"
          >
            <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse" />
            <Globe className="w-8 h-8 text-white relative z-10" />
          </motion.div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            GDT Payroll Portal
          </h2>
          <p className="text-sm text-blue-200/70">
            Secure Enterprise Authentication
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!mfaStep ? (
          /* Login Form */
          <motion.form
            key="login-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleLoginSubmit}
            className="space-y-5"
          >
            <div>
              <label className="block text-[11px] font-semibold text-blue-300/80 uppercase tracking-widest mb-2">
                User ID
              </label>
              <div className="relative group">
                <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 text-white border border-slate-700/50 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-semibold text-blue-300/80 uppercase tracking-widest">
                  Password
                </label>
                <a
                  href="#"
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Recovery
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 text-white border border-slate-700/50 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:hover:bg-blue-600"
            >
              {loading ? (
                <RefreshCw className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <>
                  Authenticate
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Biometric Integration triggers */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="flex-shrink mx-4 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => handleBiometricAuth("ios")}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl text-xs text-slate-300 font-medium transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  Face ID
                </button>
                <button
                  type="button"
                  onClick={() => handleBiometricAuth("android")}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl text-xs text-slate-300 font-medium transition-colors"
                >
                  <Fingerprint className="w-4 h-4 text-violet-400" />
                  Fingerprint
                </button>
              </div>
            </div>
          </motion.form>
        ) : (
          /* MFA Step */
          <motion.form
            key="mfa-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleMfaSubmit}
            className="space-y-5"
          >
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center mb-4 border border-blue-500/20">
                <Key className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Two-Step Verification
              </h3>
              <p className="text-[13px] text-blue-200/70 mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                Enter the authorization code sent to your registered device.
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center tracking-[0.75em] font-mono font-bold text-2xl py-4 bg-slate-950/50 text-white border border-slate-700/50 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-700"
              />
            </div>

            {/* Simulated Authenticator Code Indicator */}
            <div className="p-3.5 bg-blue-500/5 rounded-xl border border-blue-500/10 text-center flex flex-col items-center gap-1.5">
              <span className="text-blue-300/60 text-[11px] uppercase tracking-widest font-semibold">
                Test Code Generated
              </span>
              <span className="font-mono font-bold text-lg text-blue-400 tracking-[0.2em]">
                {demoCode}
              </span>
              <button
                type="button"
                onClick={() => setMfaCode(demoCode)}
                className="text-blue-400 hover:text-blue-300 font-medium text-[11px] uppercase tracking-widest mt-1 transition-colors"
              >
                Auto-fill
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMfaStep(false);
                  setError("");
                }}
                className="flex-[0.8] py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 text-xs font-semibold rounded-xl border border-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[1.2] py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] flex items-center justify-center disabled:opacity-70 disabled:hover:bg-blue-600"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm Code"
                )}
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
