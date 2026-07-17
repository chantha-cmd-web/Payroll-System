import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, Search, Edit2, Trash2, X, Save, UserCheck, 
  Briefcase, FileText, Globe, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee } from '../types';
import * as XLSX from 'xlsx';

interface EmployeeMasterProps {
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onBulkAddEmployees?: (emps: Omit<Employee, 'id'>[]) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: number) => void;
  onResetData?: () => void;
  onTriggerToast?: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
  isOnline: boolean;
}

type TabType = 'Full-Time' | 'Semi-Full-Time' | 'Part-Time';

export default function EmployeeMaster({
  employees,
  onAddEmployee,
  onBulkAddEmployees,
  onUpdateEmployee,
  onDeleteEmployee,
  onResetData,
  onTriggerToast,
  isOnline
}: EmployeeMasterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedNat, setSelectedNat] = useState('All');
  const [selectedCampus, setSelectedCampus] = useState('All');
  const [activeTab, setActiveTab] = useState<TabType>('Full-Time');
  const [isEditing, setIsEditing] = useState<Employee | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getEmptyForm = (): Omit<Employee, 'id'> => ({
    staffId: '',
    name: '',
    nat: 'Khmer',
    pos: '',
    dept: 'Operations',
    campus: 'Main',
    employmentType: activeTab,
    doj: new Date().toISOString().split('T')[0],
    empDate: new Date().toISOString().split('T')[0],
    basic: 1000,
    hourlyRate: 0,
    scheduleHours: 0,
    presentHours: 0,
    absenceHours: 0,
    substituteHours: 0,
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
    allowance: 0,
    sdReturn: 0,
    provFund: 0,
    bankAcc: '',
    email: '',
    remarks: '',
    status: 'W'
  });

  const [formData, setFormData] = useState<Omit<Employee, 'id'>>(getEmptyForm());

  const departments = useMemo(() => {
    return ['All', 'Operations', 'Finance', 'Academics'];
  }, []);

  const campuses = useMemo(() => {
    return ['All', 'Main', 'North', 'South', 'Online'];
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchTab = emp.employmentType === activeTab;
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.pos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.campus.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'All' || emp.dept === selectedDept;
      const matchesNat = selectedNat === 'All' || emp.nat === selectedNat;
      const matchesCampus = selectedCampus === 'All' || emp.campus === selectedCampus;
      return matchTab && matchesSearch && matchesDept && matchesNat && matchesCampus;
    });
  }, [employees, searchTerm, selectedDept, selectedNat, selectedCampus, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.staffId) return;

    if (isEditing) {
      onUpdateEmployee({ ...formData, id: isEditing.id });
      setIsEditing(null);
    } else {
      onAddEmployee(formData);
      setIsAdding(false);
    }
    setFormData(getEmptyForm());
  };

  const handleEditClick = (emp: Employee) => {
    setIsEditing(emp);
    setFormData({ ...emp });
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsAdding(false);
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Use header: 1 to get an array of arrays
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (data.length < 2) {
          if (onTriggerToast) onTriggerToast('Import Failed', 'No valid rows found in Excel.', 'warning');
          else alert('No valid rows found in Excel.');
          return;
        }

        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(15, data.length); i++) {
           const rowStr = (data[i] || []).join('').toLowerCase().replace(/[^a-z0-9]/g, '');
           if (rowStr.includes('staffid') || rowStr.includes('name') || rowStr.includes('basic')) {
              headerRowIdx = i;
              break;
           }
        }

        const headers = data[headerRowIdx] || [];
        const columnIndexMap: Record<number, number> = {};

        headers.forEach((header: any, index: number) => {
           if (typeof header === 'string') {
              const norm = header.toLowerCase().replace(/[^a-z]/g, ''); // strip numbers too!
              const rawLower = header.toLowerCase();
              if (norm.includes('staffid')) columnIndexMap[2] = index;
              else if (norm.includes('name')) columnIndexMap[3] = index;
              else if (norm.includes('nat')) columnIndexMap[4] = index;
              else if (norm.includes('pos')) columnIndexMap[5] = index;
              else if (norm.includes('dept')) columnIndexMap[6] = index;
              else if (norm.includes('campus')) columnIndexMap[7] = index;
              else if (norm.includes('doj')) columnIndexMap[9] = index;
              else if (norm.includes('empdate')) columnIndexMap[10] = index;
              else if (norm.includes('basic')) columnIndexMap[11] = index;
              else if (norm.includes('prepay') || norm.includes('percentage')) columnIndexMap[12] = index;
              else if (norm.includes('rate') && !norm.includes('corporate')) columnIndexMap[100] = index;
              else if (norm.includes('schedule') || norm.includes('teaching')) columnIndexMap[101] = index;
              else if (norm.includes('abs')) columnIndexMap[13] = index;
              else if (norm.includes('mat')) columnIndexMap[14] = index;
              else if (norm.includes('ot')) columnIndexMap[15] = index;
              else if (norm.includes('adv') && (rawLower.includes('+') || rawLower.includes('add') || norm.includes('senior'))) columnIndexMap[16] = index;
              else if (norm.includes('adv') && (rawLower.includes('-') || rawLower.includes('ded') || rawLower.includes('minus'))) columnIndexMap[17] = index;
              else if (norm.includes('nssf')) columnIndexMap[18] = index;
              else if (norm.includes('seniority')) columnIndexMap[19] = index;
              else if (norm.includes('gross') || norm.includes('gsalary')) columnIndexMap[20] = index;
              else if (norm.includes('salarytobepaid') || (norm.includes('salary') && norm.includes('paid'))) columnIndexMap[21] = index;
              else if (norm.includes('spouse')) columnIndexMap[22] = index;
              else if (norm.includes('child') || norm.includes('kid')) columnIndexMap[23] = index;
              else if (norm.includes('allowance')) columnIndexMap[24] = index;
              else if (norm.includes('sdreturn') || norm.includes('visa')) columnIndexMap[30] = index;
              else if (norm.includes('prov')) columnIndexMap[31] = index;
              else if (norm.includes('bank') && norm.includes('acc')) columnIndexMap[33] = index;
              else if (norm.includes('email')) columnIndexMap[34] = index;
              else if (norm.includes('remark')) columnIndexMap[35] = index;
              else if (norm.includes('status')) columnIndexMap[102] = index;
              else if (norm.includes('type') || norm.includes('employmenttype')) columnIndexMap[99] = index;
           }
        });

        const parseNumber = (val: any, defaultVal: number = 0) => {
           if (typeof val === 'number') return val;
           if (!val) return defaultVal;
           const parsed = Number(String(val).replace(/,/g, '').trim());
           return isNaN(parsed) ? defaultVal : parsed;
        };

        let importedCount = 0;
        const newEmployeesToImport: Omit<Employee, 'id'>[] = [];
        for (let i = headerRowIdx + 1; i < data.length; i++) {
           const row = data[i];
           if (!row || !row.length) continue;
           
           const staffIdIdx = columnIndexMap[2] ?? 1;
           const nameIdx = columnIndexMap[3] ?? 2;
           
           const staffId = row[staffIdIdx];
           const name = row[nameIdx];
           
           if (name && staffId) {
             const getValue = (idx: number, defaultVal: any = '') => {
                const colIdx = columnIndexMap[idx];
                return colIdx !== undefined ? row[colIdx] : defaultVal;
             };

             const rawType = String(getValue(99, '')).toLowerCase();
             let assignedType = activeTab;
             if (rawType.includes('semi')) assignedType = 'Semi-Full-Time';
             else if (rawType.includes('part')) assignedType = 'Part-Time';
             else if (rawType.includes('full')) assignedType = 'Full-Time';

              newEmployeesToImport.push({
               ...getEmptyForm(),
               staffId: String(staffId),
               name: String(name),
               nat: String(getValue(4, 'Khmer')).toLowerCase().includes('expat') ? 'Expat' : 'Khmer',
               pos: String(getValue(5, 'Staff')),
               dept: String(getValue(6, 'Operations')),
               campus: String(getValue(7, 'Main')),
               doj: String(getValue(9, new Date().toISOString().split('T')[0])),
               empDate: String(getValue(10, new Date().toISOString().split('T')[0])),
               basic: parseNumber(getValue(11, 0), 0),
               hourlyRate: parseNumber(getValue(100, 0), 0),
               scheduleHours: parseNumber(getValue(101, 0), 0),
               prePayPct: parseNumber(getValue(12, 100), 100),
               absence: parseNumber(getValue(13, 0), 0),
               maternity: parseNumber(getValue(14, 0), 0),
               ot: parseNumber(getValue(15, 0), 0),
               caAdd: parseNumber(getValue(16, 0), 0),
               caDed: parseNumber(getValue(17, 0), 0),
               nssf: parseNumber(getValue(18, 0), 0),
               seniority: parseNumber(getValue(19, 0), 0),
               customGrossUSD: getValue(20, '') !== '' ? parseNumber(getValue(20)) : undefined,
               customSalaryPaidKHR: getValue(21, '') !== '' ? parseNumber(getValue(21)) : undefined,
               spouse: String(getValue(22, '')).toLowerCase() === 'yes',
               kids: parseNumber(getValue(23, 0), 0),
               allowance: parseNumber(getValue(24, 0), 0),
               sdReturn: parseNumber(getValue(30, 0), 0),
               provFund: parseNumber(getValue(31, 0), 0),
               bankAcc: String(getValue(33, '')),
               email: String(getValue(34, '')),
               remarks: String(getValue(35, '')),
               status: String(getValue(102, 'W')).toUpperCase(),
               employmentType: assignedType
             });
             importedCount++;
           }
        }

        if (newEmployeesToImport.length > 0) {
          if (onBulkAddEmployees) {
            onBulkAddEmployees(newEmployeesToImport);
          } else {
            newEmployeesToImport.forEach(emp => onAddEmployee(emp));
          }
        }

        if (importedCount === 0) {
          if (onTriggerToast) onTriggerToast('Import Warning', 'No valid rows found. Ensure columns contain "Name" and "Staff ID" or are numbered correctly.', 'warning');
          else alert('No valid rows found. Ensure columns contain "Name" and "Staff ID" or are numbered correctly.');
        } else {
          if (onTriggerToast) onTriggerToast('Import Success', `Successfully imported ${importedCount} employees as ${activeTab}.`, 'success');
          else alert(`Successfully imported ${importedCount} employees as ${activeTab}.`);
        }
      } catch (err) {
        console.error("Error importing excel:", err);
        if (onTriggerToast) onTriggerToast('Import Error', 'Failed to parse Excel file.', 'warning');
        else alert('Failed to parse Excel file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden h-full">
      {/* Search and List Side */}
      <div className="flex-grow flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Staff, ID, Position, Campus..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition duration-150 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Departments</option>
              {departments.filter(d => d !== 'All').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Campuses</option>
              {campuses.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedNat}
              onChange={(e) => setSelectedNat(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Nationalities</option>
              <option value="Khmer">Khmer</option>
              <option value="Expat">Expat</option>
            </select>
            
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleExcelImport} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>

            {onResetData && (
              <button
                onClick={onResetData}
                className="px-3 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Data
              </button>
            )}

            <button
              onClick={() => {
                setFormData({ ...getEmptyForm(), employmentType: activeTab });
                setIsAdding(true);
                setIsEditing(null);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ml-auto sm:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-850 px-4 pt-2 gap-4">
          {(['Full-Time', 'Semi-Full-Time', 'Part-Time'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-xs font-bold transition border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {tab} Staff
            </button>
          ))}
        </div>

        {/* List Content */}
        <div className="flex-grow overflow-y-auto p-4">
          {filteredEmployees.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Employees Found</h3>
              <p className="text-xs text-slate-400 mt-1">Try tweaking your search terms or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEmployees.map(emp => {
                const isDuplicate = employees.filter(e => e.name.toLowerCase() === emp.name.toLowerCase()).length > 1;
                return (
                <motion.div
                  key={emp.id}
                  layoutId={`emp-card-${emp.id}`}
                  className={`p-4 bg-slate-50 dark:bg-slate-950/40 border hover:border-blue-500/30 dark:hover:border-blue-500/30 rounded-2xl flex justify-between items-start transition shadow-sm ${isDuplicate ? 'border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/20' : 'border-slate-200/60 dark:border-slate-850/60'}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                        {emp.staffId}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{emp.campus} Campus</span>
                      {isDuplicate && <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">Duplicate Name</span>}
                    </div>

                    <div>
                      <h4 className={`font-bold text-sm ${isDuplicate ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>{emp.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        {emp.pos} • {emp.dept}
                      </p>
                    </div>

                    <div className="flex gap-4 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {emp.nat}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        {emp.employmentType === 'Part-Time' ? `${emp.hourlyRate}/hr` : `$${emp.basic.toLocaleString()}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEditClick(emp)}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-500 hover:text-blue-500 rounded-xl transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEmployee(emp.id)}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-400 hover:text-rose-500 rounded-xl transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail / Editor Sidebar */}
      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div
            initial={{ opacity: 0, x: 50, width: 0 }}
            animate={{ opacity: 1, x: 0, width: '420px' }}
            exit={{ opacity: 0, x: 50, width: 0 }}
            className="flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-lg flex flex-col h-full w-full md:w-[420px]"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {isEditing ? `Edit: ${isEditing.name}` : 'New Employee Entry'}
              </h3>
              <button
                onClick={handleCancel}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-xl text-slate-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-5 space-y-4">
              
              {/* Primary Identity Section */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1">
                  1. Identity & Assignment
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Staff ID Code *
                    </label>
                    <input required type="text" value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Employment Type *
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as TabType })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Semi-Full-Time">Semi-Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Employee Display Name *
                  </label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Nationality *
                    </label>
                    <select value={formData.nat} onChange={(e) => setFormData({ ...formData, nat: e.target.value as 'Khmer' | 'Expat' })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Khmer">Khmer</option>
                      <option value="Expat">Expat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Position
                    </label>
                    <input type="text" value={formData.pos} onChange={(e) => setFormData({ ...formData, pos: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Department
                    </label>
                    <select value={formData.dept} onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Operations">Operations</option>
                      <option value="Finance">Finance</option>
                      <option value="Academics">Academics</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Campus
                    </label>
                    <input type="text" value={formData.campus} onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Date of Joining
                    </label>
                    <input type="date" value={formData.doj} onChange={(e) => setFormData({ ...formData, doj: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Employment Date
                    </label>
                    <input type="date" value={formData.empDate} onChange={(e) => setFormData({ ...formData, empDate: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              {/* Financial Section */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1">
                  2. Compensation & Hours
                </span>

                {formData.employmentType !== 'Part-Time' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Basic Salary (USD) *
                      </label>
                      <input required type="number" value={formData.basic} onChange={(e) => setFormData({ ...formData, basic: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Prepay Percentage (%)
                      </label>
                      <input type="number" value={formData.prePayPct} onChange={(e) => setFormData({ ...formData, prePayPct: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                    </div>
                    {formData.employmentType === 'Semi-Full-Time' && (
                      <div className="grid grid-cols-2 gap-3 col-span-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            Hourly Rate (USD)
                          </label>
                          <input type="number" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            Substitute Hours
                          </label>
                          <input type="number" value={formData.substituteHours} onChange={(e) => setFormData({ ...formData, substituteHours: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.employmentType === 'Part-Time' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Hourly Rate (USD) *
                      </label>
                      <input required type="number" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Present Hours
                      </label>
                      <input type="number" value={formData.presentHours} onChange={(e) => setFormData({ ...formData, presentHours: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                )}

                {(formData.employmentType === 'Semi-Full-Time' || formData.employmentType === 'Part-Time') && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Absence Hours
                    </label>
                    <input type="number" value={formData.absenceHours} onChange={(e) => setFormData({ ...formData, absenceHours: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                )}
              </div>
              
              {/* Payroll Adjustments Section */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1">
                  3. Payroll Run Adjustments (USD)
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-500 mb-1">Absence Ded (-)</label>
                    <input type="number" value={formData.absence} onChange={(e) => setFormData({ ...formData, absence: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-500 mb-1">Maternity (+)</label>
                    <input type="number" value={formData.maternity} onChange={(e) => setFormData({ ...formData, maternity: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-500 mb-1">Overtime (+)</label>
                    <input type="number" value={formData.ot} onChange={(e) => setFormData({ ...formData, ot: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-500 mb-1">Advance Add (+)</label>
                    <input type="number" value={formData.caAdd} onChange={(e) => setFormData({ ...formData, caAdd: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-500 mb-1">Advance Ded (-)</label>
                    <input type="number" value={formData.caDed} onChange={(e) => setFormData({ ...formData, caDed: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-500 mb-1">NSSF (-)</label>
                    <input type="number" value={formData.nssf} onChange={(e) => setFormData({ ...formData, nssf: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Seniority (+)</label>
                    <input type="number" value={formData.seniority} onChange={(e) => setFormData({ ...formData, seniority: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Tax-Exempt Allowance (+)</label>
                    <input type="number" value={formData.allowance} onChange={(e) => setFormData({ ...formData, allowance: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-500 mb-1">Special Ded Return (+)</label>
                    <input type="number" value={formData.sdReturn} onChange={(e) => setFormData({ ...formData, sdReturn: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-500 mb-1">Provident Fund (-)</label>
                    <input type="number" value={formData.provFund} onChange={(e) => setFormData({ ...formData, provFund: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                {formData.nat === 'Khmer' && (
                  <div className="grid grid-cols-2 gap-3 mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <div>
                      <label className="block text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1">Spouse Relief</label>
                      <select value={formData.spouse ? 'Yes' : 'No'} onChange={(e) => setFormData({ ...formData, spouse: e.target.value === 'Yes' })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-blue-800 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1">Number of Kids</label>
                      <input type="number" min="0" value={formData.kids} onChange={(e) => setFormData({ ...formData, kids: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-blue-200 dark:border-blue-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* System Data Section */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1">
                  4. Additional Details
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Bank Account</label>
                    <input type="text" value={formData.bankAcc} onChange={(e) => setFormData({ ...formData, bankAcc: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Remarks</label>
                  <textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} rows={2}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-blue-500 appearance-none">
                    <option value="W">Working as Normal(Staff) (W)</option>
                    <option value="T">Both FT and SFT Kinder (T)</option>
                    <option value="TT">SFT ended of Contract (TT)</option>
                    <option value="N">New (N)</option>
                    <option value="ML">Maternity Leave (ML)</option>
                    <option value="UN">Unpaid Leave (UN)</option>
                    <option value="SP">Special Case (SP)</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-blue-500/10"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Record
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
