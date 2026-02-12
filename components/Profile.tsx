
import React, { useState } from 'react';
import { User, Leave, AdvanceRequest } from '../types';
import { LEAVE_REASONS } from '../constants';
import { LogOut, Phone, Briefcase, DollarSign, PlusCircle, ChevronRight, X, CheckCircle, Wallet, History, Database, DownloadCloud, UploadCloud, FileCheck } from 'lucide-react';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  leaves?: Leave[];
  setLeaves?: React.Dispatch<React.SetStateAction<Leave[]>>;
  advanceRequests?: AdvanceRequest[];
  setAdvanceRequests?: React.Dispatch<React.SetStateAction<AdvanceRequest[]>>;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, leaves, setLeaves, advanceRequests, setAdvanceRequests }) => {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [leaveReason, setLeaveReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);

  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');

  const handleApplyLeave = () => {
    if (!setLeaves) {
      console.error("setLeaves not provided to Profile");
      return;
    }
    const finalReason = leaveReason === 'Other' ? customReason : leaveReason;
    if (!finalReason) {
      alert("Please select a reason");
      return;
    }

    const newLeave: Leave = {
      id: Math.random().toString(36).substr(2, 9),
      workerId: user.id,
      date: leaveDate,
      reason: finalReason,
      status: 'pending'
    };
    
    setLeaves(prev => [...prev, newLeave]);
    setIsSuccess(true);
    setTimeout(() => { 
      setShowLeaveModal(false); 
      setIsSuccess(false); 
      setLeaveReason(''); 
      setCustomReason(''); 
    }, 1500);
  };

  const handleApplyAdvance = () => {
    if (!setAdvanceRequests || !advanceAmount || !advanceReason) return;
    const newReq: AdvanceRequest = {
      id: Math.random().toString(36).substr(2, 9),
      workerId: user.id,
      workerName: user.name,
      amount: Number(advanceAmount),
      reason: advanceReason,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setAdvanceRequests(prev => [...prev, newReq]);
    setIsSuccess(true);
    setTimeout(() => { setShowAdvanceModal(false); setIsSuccess(false); setAdvanceAmount(''); setAdvanceReason(''); }, 1500);
  };

  const backupData = () => {
    const data = {
      shifts: localStorage.getItem('fw_shifts'),
      leaves: localStorage.getItem('fw_leaves'),
      workers: localStorage.getItem('fw_workers'),
      advance: localStorage.getItem('fw_advance')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FASTEP_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const restoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.shifts) localStorage.setItem('fw_shifts', data.shifts);
        if (data.leaves) localStorage.setItem('fw_leaves', data.leaves);
        if (data.workers) localStorage.setItem('fw_workers', data.workers);
        if (data.advance) localStorage.setItem('fw_advance', data.advance);
        alert("Restore successful! App will reload.");
        window.location.reload();
      } catch (err) { alert("Invalid backup file."); }
    };
    reader.readAsText(file);
  };

  const myAdvanceRequests = advanceRequests?.filter(r => r.workerId === user.id) || [];

  return (
    <div className="px-6 pt-10 pb-6 space-y-8">
      <header className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden">
          <img src={user.photoUrl} alt="profile" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{user.trade || 'Administrator'}</p>
        </div>
      </header>

      {/* Admin Specific Data Tools */}
      {user.role === 'admin' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 flex items-center gap-2">
            <Database size={12} /> Data Security & Backup
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={backupData} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all">
              <DownloadCloud size={24} className="text-blue-600" />
              <span className="text-[10px] font-bold uppercase text-gray-400">Backup</span>
            </button>
            <label className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all cursor-pointer">
              <UploadCloud size={24} className="text-orange-600" />
              <span className="text-[10px] font-bold uppercase text-gray-400">Restore</span>
              <input type="file" accept=".json" onChange={restoreData} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Document Tracking Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 flex items-center gap-2">
          <FileCheck size={12} /> Legal Documents
        </h3>
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500 font-medium">Iqama Expiry</p>
            <p className="text-sm font-bold text-gray-900">{user.iqamaExpiry || "Not Set"}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500 font-medium">Passport Expiry</p>
            <p className="text-sm font-bold text-gray-900">{user.passportExpiry || "Not Set"}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">Personal Details</h3>
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-xl text-gray-400"><Phone size={18} /></div>
              <span className="text-sm font-medium text-gray-600">Phone</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{user.phone}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-xl text-gray-400"><Briefcase size={18} /></div>
              <span className="text-sm font-medium text-gray-600">ID</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{user.workerId || 'ADMIN'}</span>
          </div>
        </div>
      </div>

      {user.role === 'worker' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">Actions</h3>
          <div className="space-y-3">
            <button onClick={() => setShowLeaveModal(true)} className="w-full bg-white border border-gray-100 p-5 rounded-3xl flex items-center justify-between shadow-sm active:bg-gray-50 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><PlusCircle size={24} /></div>
                <div><p className="text-sm font-bold text-gray-900">Apply Leave</p><p className="text-[10px] text-gray-400 uppercase">Request time off</p></div>
              </div>
              <ChevronRight className="text-gray-300" />
            </button>
            <button onClick={() => setShowAdvanceModal(true)} className="w-full bg-white border border-gray-100 p-5 rounded-3xl flex items-center justify-between shadow-sm active:bg-gray-50 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Wallet size={24} /></div>
                <div><p className="text-sm font-bold text-gray-900">Request Advance</p><p className="text-[10px] text-gray-400 uppercase">Borrow money</p></div>
              </div>
              <ChevronRight className="text-gray-300" />
            </button>
          </div>
        </div>
      )}

      <button onClick={onLogout} className="w-full bg-red-50 text-red-600 font-bold py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-4">
        <LogOut size={20} /> Log Out
      </button>

      {/* Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-6">
            {!isSuccess ? (
              <>
                <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-gray-900">Request Advance</h3><button onClick={() => setShowAdvanceModal(false)} className="p-1 text-gray-400"><X size={24} /></button></div>
                <div className="space-y-4">
                  <input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="Amount (SAR)" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-lg font-bold" />
                  <textarea value={advanceReason} onChange={(e) => setAdvanceReason(e.target.value)} placeholder="Reason..." className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm h-24" />
                </div>
                <button onClick={handleApplyAdvance} className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl active:scale-95 shadow-lg shadow-green-100">Submit Request</button>
              </>
            ) : (
              <div className="py-10 flex flex-col items-center text-center space-y-4"><div className="bg-green-100 p-4 rounded-full text-green-600"><CheckCircle size={48} /></div><h3 className="text-xl font-bold text-gray-900">Request Sent!</h3></div>
            )}
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-6">
            {!isSuccess ? (
              <>
                <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-gray-900">Apply Leave</h3><button onClick={() => setShowLeaveModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Leave Date</label>
                    <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Reason</label>
                    <select value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm">
                      <option value="">Select Reason</option>
                      {LEAVE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  {leaveReason === 'Other' && (
                    <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Tell us more..." className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm h-24" />
                  )}
                </div>
                <button onClick={handleApplyLeave} disabled={!leaveReason || (leaveReason === 'Other' && !customReason)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 disabled:opacity-50">Submit Request</button>
              </>
            ) : (
              <div className="py-10 flex flex-col items-center text-center space-y-4"><div className="bg-green-100 p-4 rounded-full text-green-600 animate-bounce"><CheckCircle size={48} /></div><h3 className="text-xl font-bold text-gray-900">Request Sent!</h3></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
