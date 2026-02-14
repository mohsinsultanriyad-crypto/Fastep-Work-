
import React, { useState, useMemo } from 'react';
import { User, Shift, Leave, AdvanceRequest } from '../types';
import { CheckCircle2, Clock, Calendar as CalendarIcon, History, Wallet, Info } from 'lucide-react';
// Import BASE_HOURS to determine if a shift has overtime
import { BASE_HOURS } from '../constants';

interface WorkerHistoryProps {
  user: User;
  shifts: Shift[];
  leaves: Leave[];
  advanceRequests?: AdvanceRequest[];
}

const WorkerHistory: React.FC<WorkerHistoryProps> = ({ user, shifts, leaves, advanceRequests = [] }) => {
  const [view, setView] = useState<'attendance' | 'calendar' | 'leaves' | 'advances'>('attendance');

  const sortedShifts = useMemo(() => [...shifts].sort((a, b) => b.startTime - a.startTime), [shifts]);
  const sortedLeaves = useMemo(() => [...leaves].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [leaves]);
  const sortedAdvances = useMemo(() => [...advanceRequests].sort((a, b) => {
    const dateA = new Date(a.requestDate).getTime() || 0;
    const dateB = new Date(b.requestDate).getTime() || 0;
    return dateB - dateA;
  }), [advanceRequests]);

  const stats = useMemo(() => {
    return {
      leave: {
        total: leaves.length,
        accepted: leaves.filter(l => l.status === 'accepted').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        pending: leaves.filter(l => l.status === 'pending').length,
      },
      advance: {
        total: advanceRequests.length,
        approved: advanceRequests.filter(r => r.status === 'approved').length,
        pending: advanceRequests.filter(r => r.status === 'pending').length,
        totalPaid: advanceRequests.filter(r => r.status === 'approved').reduce((acc, r) => acc + r.amount, 0),
      }
    };
  }, [leaves, advanceRequests]);

  const now = new Date();
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: getDaysInMonth(now.getFullYear(), now.getMonth()) }, (_, i) => i + 1);

  return (
    <div className="px-6 pt-10 pb-6 space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Worker Audit</h1>
          <span className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">{user.workerId}</span>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl overflow-x-auto hide-scrollbar whitespace-nowrap">
          <button 
            onClick={() => setView('attendance')}
            className={`px-4 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${view === 'attendance' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            Work
          </button>
          <button 
            onClick={() => setView('calendar')}
            className={`px-4 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            Calendar
          </button>
          <button 
            onClick={() => setView('leaves')}
            className={`px-4 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${view === 'leaves' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            Leaves
          </button>
          <button 
            onClick={() => setView('advances')}
            className={`px-4 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${view === 'advances' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            Advances
          </button>
        </div>
      </header>

      {view === 'attendance' && (
        <div className="space-y-4">
          {sortedShifts.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No shift records found</p>
            </div>
          )}
          {sortedShifts.map(shift => (
            <div key={shift.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${shift.isApproved ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                  {shift.status === 'completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {new Date(shift.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{shift.totalHours.toFixed(1)} hrs</span>
                    {/* Fix: use totalHours and BASE_HOURS constant to determine OT status instead of non-existent otStartTime */}
                    {shift.totalHours > BASE_HOURS && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">OT</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${shift.isApproved ? 'text-blue-600' : 'text-gray-900'}`}>
                  {shift.isApproved ? `+${shift.totalHours.toFixed(1)}` : 'Waiting Approval'}
                </div>
                {shift.isApproved && <div className="text-[10px] font-bold text-blue-400 flex items-center justify-end gap-1 uppercase">Approved <CheckCircle2 size={10} /></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'calendar' && (
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
          <div className="text-center mb-6">
            <h3 className="font-bold text-gray-900">{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1 uppercase">{d}</div>
            ))}
            {days.map(day => {
              const dayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const shift = shifts.find(s => s.date === dayStr);
              const leave = leaves.find(l => l.date === dayStr);
              
              let statusClass = 'text-gray-900';
              let badge = null;

              if (shift) {
                statusClass = 'bg-blue-600 text-white rounded-full';
                if (shift.isApproved) badge = <div className="absolute -top-1 -right-1 bg-green-500 text-white p-0.5 rounded-full ring-2 ring-white"><CheckCircle2 size={8} /></div>;
              } else if (leave) {
                statusClass = 'bg-red-500 text-white rounded-full';
                badge = <div className="absolute -bottom-1 -right-1 bg-white text-red-500 text-[8px] font-bold px-1 rounded shadow-sm border border-red-100">{leave.status === 'accepted' ? 'L-A' : 'L-R'}</div>;
              }

              return (
                <div key={day} className="relative aspect-square flex items-center justify-center">
                  <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-all ${statusClass}`}>
                    {day}
                  </div>
                  {badge}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'leaves' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Total</p>
              <p className="text-lg font-bold text-gray-900">{stats.leave.total}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-2xl border border-green-100 shadow-sm text-center">
              <p className="text-[8px] font-bold text-green-600 uppercase mb-1">Approved</p>
              <p className="text-lg font-bold text-green-700">{stats.leave.accepted}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-2xl border border-red-100 shadow-sm text-center">
              <p className="text-[8px] font-bold text-red-600 uppercase mb-1">Rejected</p>
              <p className="text-lg font-bold text-red-700">{stats.leave.rejected}</p>
            </div>
          </div>

          <div className="space-y-4">
            {sortedLeaves.map(leave => (
              <div key={leave.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  leave.status === 'accepted' ? 'bg-green-500' :
                  leave.status === 'rejected' ? 'bg-red-500' :
                  'bg-orange-400'
                }`} />
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-gray-400" />
                    <h4 className="text-sm font-bold text-gray-900">{new Date(leave.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</h4>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    leave.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>{leave.status}</div>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-xl text-xs text-gray-600 italic">"{leave.reason}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'advances' && (
        <div className="space-y-6">
          <div className="bg-blue-600 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-lg shadow-blue-100">
            <div>
              <p className="text-[10px] font-bold uppercase opacity-70">Approved Total</p>
              <p className="text-3xl font-black">{stats.advance.totalPaid} SAR</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl"><Wallet size={28} /></div>
          </div>

          <div className="space-y-4">
            {sortedAdvances.length === 0 && <p className="text-center py-10 text-gray-400 text-sm">No advance requests found.</p>}
            {sortedAdvances.map(r => (
              <div key={r.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-3 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  r.status === 'approved' ? 'bg-green-500' :
                  r.status === 'rejected' ? 'bg-red-500' :
                  r.status === 'scheduled' ? 'bg-blue-500' :
                  'bg-orange-400'
                }`} />
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{r.amount} SAR</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{r.requestDate}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase ${
                    r.status === 'approved' ? 'bg-green-100 text-green-600' :
                    r.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    r.status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>{r.status}</div>
                </div>
                {r.status === 'scheduled' && r.paymentDate && (
                  <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <CalendarIcon size={12} />
                    Scheduled for: {r.paymentDate}
                  </div>
                )}
                {r.reason && <p className="text-[11px] text-gray-500 font-medium border-l-2 border-gray-100 pl-3">"{r.reason}"</p>}
                {r.status === 'approved' && (
                  <div className="flex items-center gap-2 text-[9px] font-bold text-orange-600 bg-orange-50 p-2 rounded-xl">
                    <Info size={12} />
                    Auto-deducted from next salary sheet.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerHistory;
