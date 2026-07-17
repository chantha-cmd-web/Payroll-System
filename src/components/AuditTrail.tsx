import React, { useState } from 'react';
import { Search, History, Clock, User, FileText, ArrowRight } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditTrailProps {
  logs: AuditLog[];
}

export default function AuditTrail({ logs }: AuditTrailProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log =>
    log.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.field.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-grow flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm h-full">
      <div className="p-5 border-b border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-950/40">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-500" />
            Audit Trail
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Log of manual overrides to gross salary and final salary payouts.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by staff or field..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex-grow overflow-auto p-5">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <FileText className="w-12 h-12 mb-3 opacity-20" />
            <p>No audit logs found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map(log => (
              <div key={log.id} className="flex flex-col sm:flex-row justify-between p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-brand-300 dark:hover:border-brand-800/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {log.employeeName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{log.field}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs font-mono">
                      <span className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                        {log.oldValue === undefined ? 'Auto' : log.oldValue}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 rounded font-bold">
                        {log.newValue === undefined ? 'Auto' : log.newValue}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span>{log.user}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
