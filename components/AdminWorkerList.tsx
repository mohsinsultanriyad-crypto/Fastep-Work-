
import React, { useState, useMemo } from 'react';
import { User, Shift, Leave, AdvanceRequest } from '../types';
import { Search, Download, FileText, Edit2, X, CheckCircle, Loader2, History, UserPlus, Lock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { DAYS_IN_MONTH, BASE_HOURS } from '../constants';
import WorkerHistory from './WorkerHistory';

interface AdminWorkerListProps {
  workers: User[];
  setWorkers: React.Dispatch<React.SetStateAction<User[]>>;
  shifts: Shift[];
  leaves: Leave[];
  advanceRequests: AdvanceRequest[];
}

const AdminWorkerList: React.FC<AdminWorkerListProps> = ({ workers, setWorkers, shifts, leaves, advanceRequests }) => {
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [salaryModalWorker, setSalaryModalWorker] = useState<{worker: User, payroll: any} | null>(null);
  const [historyWorker, setHistoryWorker] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newWorker, setNewWorker] = useState({
    name: '', workerId: '', trade: '', monthlySalary: '', phone: '', password: 'password123', iqamaExpiry: '', passportExpiry: ''
  });

  const filteredWorkers = useMemo(() => {
    return workers.filter(w => 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      w.workerId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workers, searchQuery]);

  const calculateSalary = (worker: User) => {
    const workerShifts = shifts.filter(s => s.workerId === worker.id && s.isApproved);
    const workerLeaves = leaves.filter(l => l.workerId === worker.id);
    const rejectedLeavesCount = workerLeaves.filter(l => l.status === 'rejected').length;
    
    // Calculate total approved advances for this worker
    const workerAdvances = advanceRequests.filter(r => r.workerId === worker.id && r.status === 'approved');
    const totalApprovedAdvances = workerAdvances.reduce((acc, r) => acc + r.amount, 0);

    const dailyRate = worker.monthlySalary / DAYS_IN_MONTH;
    const hourlyRate = dailyRate / BASE_HOURS;
    const otRate = hourlyRate * 1.5;
    
    let totalNormalHrs = 0;
    let totalOtHrs = 0;
    
    workerShifts.forEach(s => {
      const normal = Math.min(BASE_HOURS, s.totalHours || 0);
      totalNormalHrs += normal;
      if (s.otStartTime && s.otEndTime) {
        totalOtHrs += (s.otEndTime - s.otStartTime) / 3600000;
      }
    });

    const regularEarnings = totalNormalHrs * hourlyRate;
    const totalOtPay = totalOtHrs * otRate;
    const deductions = rejectedLeavesCount * dailyRate;
    
    // Final payable salary logic: Regular + OT - Leaves Deductions - Paid Advances
    const finalPay = regularEarnings + totalOtPay - deductions - totalApprovedAdvances;
    
    return { 
      dailyRate, hourlyRate, otRate, 
      totalNormalHrs, totalOtHrs, 
      regularEarnings, totalOtPay, 
      deductions, totalAdvances: totalApprovedAdvances, finalPay,
      totalHours: totalNormalHrs + totalOtHrs
    };
  };

  const generateSheet = (worker: User) => {
    setIsGenerating(worker.id);
    const payroll = calculateSalary(worker);
    setTimeout(() => {
      setIsGenerating(null);
      setSalaryModalWorker({ worker, payroll });
    }, 1000);
  };

  const handleUpdateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWorker) {
      setWorkers(prev => prev.map(w => w.id === editingWorker.id ? editingWorker : w));
    }
    setEditingWorker(null);
  };

  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newWorker.name,
      workerId: newWorker.workerId,
      trade: newWorker.trade,
      monthlySalary: Number(newWorker.monthlySalary),
      phone: newWorker.phone,
      password: newWorker.password,
      role: 'worker',
      photoUrl: `https://picsum.photos/seed/${newWorker.workerId}/200`,
      isActive: true,
      iqamaExpiry: newWorker.iqamaExpiry,
      passportExpiry: newWorker.passportExpiry
    };
    setWorkers(prev => [...prev, newUser]);
    setShowAddModal(false);
    setNewWorker({ name: '', workerId: '', trade: '', monthlySalary: '', phone: '', password: 'password123', iqamaExpiry: '', passportExpiry: '' });
  };

  return (
    <div className="px-6 pt-10 pb-6 space-y-8 bg-gray-50/50 min-h-screen">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Personnel</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Directory</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
          <UserPlus size={20} />
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          placeholder="Filter workers..." 
          className="w-full bg-white border-2 border-gray-100 pl-12 pr-4 py-4 rounded-2xl text-sm font-bold shadow-sm focus:border-blue-300 outline-none" 
        />
      </div>

      <div className="space-y-4">
        {filteredWorkers.map(worker => {
          const payroll = calculateSalary(worker);
          const loading = isGenerating === worker.id;
          return (
            <div key={worker.id} className={`bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-5 ${!worker.isActive ? 'opacity-60 grayscale' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 overflow-hidden shadow-inner">
                    <img src={worker.photoUrl} className="w-full h-full object-cover" alt={worker.name} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">{worker.name}</h4>
                    <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">{worker.trade} • {worker.workerId}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setEditingWorker(worker)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => setHistoryWorker(worker)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 transition-colors">
                    <History size={18} />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => generateSheet(worker)} 
                disabled={loading} 
                className="w-full bg-blue-600 text-white text-xs font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-50 transition-all"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Generate Salary Sheet
              </button>
            </div>
          );
        })}
      </div>

      {salaryModalWorker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600" />
            <div className="flex justify-between items-center pt-2">
              <h3 className="text-xl font-black text-gray-900">Salary Sheet</h3>
              <button onClick={() => setSalaryModalWorker(null)} className="p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-400 uppercase">Worker</span><span className="text-sm font-black text-gray-900">{salaryModalWorker.worker.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-400 uppercase">Monthly Base</span><span className="text-sm font-bold text-gray-900">{salaryModalWorker.worker.monthlySalary} SAR</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-6">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase">Total Hours</span>
                <p className="text-xl font-black text-gray-900">{salaryModalWorker.payroll.totalHours.toFixed(1)} <span className="text-[10px]">hrs</span></p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[9px] font-bold text-blue-500 uppercase">OT Hours</span>
                <p className="text-xl font-black text-blue-600">{salaryModalWorker.payroll.totalOtHrs.toFixed(1)} <span className="text-[10px]">hrs</span></p>
              </div>
            </div>

            <div className="space-y-3 px-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-gray-400 uppercase">Regular Earnings</span>
                <span className="text-gray-900">+{salaryModalWorker.payroll.regularEarnings.toFixed(0)} SAR</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-blue-500 uppercase">Overtime (1.5x)</span>
                <span className="text-blue-600">+{salaryModalWorker.payroll.totalOtPay.toFixed(0)} SAR</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-red-400 uppercase">Rejected Leaves</span>
                <span className="text-red-500">-{salaryModalWorker.payroll.deductions.toFixed(0)} SAR</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-orange-400 uppercase">Paid Advances</span>
                <span className="text-orange-500">-{salaryModalWorker.payroll.totalAdvances.toFixed(0)} SAR</span>
              </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-blue-100">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-80">Final Payable Salary</p>
                <p className="text-3xl font-black tracking-tight">{salaryModalWorker.payroll.finalPay.toFixed(0)} <span className="text-sm font-normal">SAR</span></p>
              </div>
              <div className="bg-white/20 p-2 rounded-xl">
                <CheckCircle size={32} />
              </div>
            </div>

            <button onClick={() => setSalaryModalWorker(null)} className="w-full bg-gray-900 text-white font-bold py-5 rounded-2xl active:scale-95 transition-all shadow-lg shadow-gray-200">
              Close Statement
            </button>
          </div>
        </div>
      )}

      {historyWorker && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-white animate-in slide-in-from-right duration-300">
          <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Worker Audit</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{historyWorker.name}</p>
            </div>
            <button onClick={() => setHistoryWorker(null)} className="p-3 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <WorkerHistory 
              user={historyWorker} 
              shifts={shifts.filter(s => s.workerId === historyWorker.id)} 
              leaves={leaves.filter(l => l.workerId === historyWorker.id)}
              advanceRequests={advanceRequests.filter(r => r.workerId === historyWorker.id)}
            />
          </div>
          <div className="p-6 border-t border-gray-50 bg-gray-50">
            <button onClick={() => setHistoryWorker(null)} className="w-full bg-gray-900 text-white font-bold py-5 rounded-2xl active:scale-95 transition-all">Close History</button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-white overflow-y-auto animate-in slide-in-from-bottom duration-300">
          <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Add New Personnel</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Set Profile & Documents</p>
            </div>
            <button onClick={() => setShowAddModal(false)} className="p-3 bg-gray-50 text-gray-400 rounded-full"><X size={24} /></button>
          </div>
          <form onSubmit={handleCreateWorker} className="flex-1 p-6 space-y-6 pb-24">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Identity Details</label>
              <input required value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} type="text" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold" placeholder="Full Name" />
              <div className="grid grid-cols-2 gap-4">
                <input required value={newWorker.workerId} onChange={e => setNewWorker({...newWorker, workerId: e.target.value})} type="text" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold" placeholder="FS1001" />
                <input required value={newWorker.password} onChange={e => setNewWorker({...newWorker, password: e.target.value})} type="text" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold" placeholder="Pass123" />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Document Expiry Dates</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-gray-400 ml-1">IQAMA EXPIRY</span>
                  <input value={newWorker.iqamaExpiry} onChange={e => setNewWorker({...newWorker, iqamaExpiry: e.target.value})} type="date" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm" />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-gray-400 ml-1">PASSPORT EXPIRY</span>
                  <input value={newWorker.passportExpiry} onChange={e => setNewWorker({...newWorker, passportExpiry: e.target.value})} type="date" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Professional Details</label>
              <input required value={newWorker.trade} onChange={e => setNewWorker({...newWorker, trade: e.target.value})} type="text" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold" placeholder="Trade (e.g. Mason)" />
              <div className="grid grid-cols-2 gap-4">
                <input required value={newWorker.monthlySalary} onChange={e => setNewWorker({...newWorker, monthlySalary: e.target.value})} type="number" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold" placeholder="Salary (SAR)" />
                <input required value={newWorker.phone} onChange={e => setNewWorker({...newWorker, phone: e.target.value})} type="tel" className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold" placeholder="Phone" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-5 rounded-3xl shadow-xl shadow-blue-100 active:scale-95 transition-all mt-4">Create Worker Profile</button>
          </form>
        </div>
      )}

      {editingWorker && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 space-y-5 animate-in zoom-in duration-200 relative shadow-2xl">
            <button onClick={() => setEditingWorker(null)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500 transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-black text-gray-900">Edit Profile</h3>
            <form onSubmit={handleUpdateWorker} className="space-y-4">
              <div>
                <span className="text-[8px] font-bold text-gray-400 uppercase ml-1">Trade & Salary</span>
                <input required value={editingWorker.trade} onChange={e => setEditingWorker({...editingWorker, trade: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border-2 border-gray-100 mb-2" />
                <input type="number" required value={editingWorker.monthlySalary} onChange={e => setEditingWorker({...editingWorker, monthlySalary: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border-2 border-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[8px] font-bold text-gray-400 uppercase ml-1">Iqama</span>
                  <input type="date" value={editingWorker.iqamaExpiry || ''} onChange={e => setEditingWorker({...editingWorker, iqamaExpiry: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl text-[10px] font-bold border-2 border-gray-100" />
                </div>
                <div>
                  <span className="text-[8px] font-bold text-gray-400 uppercase ml-1">Passport</span>
                  <input type="date" value={editingWorker.passportExpiry || ''} onChange={e => setEditingWorker({...editingWorker, passportExpiry: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl text-[10px] font-bold border-2 border-gray-100" />
                </div>
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkerList;
