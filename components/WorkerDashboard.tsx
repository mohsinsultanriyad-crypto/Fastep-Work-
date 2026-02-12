
import React, { useState, useEffect, useMemo } from 'react';
import { User, Shift, Leave, ShiftStatus, Announcement } from '../types';
import { SHIFT_DURATION_MS, OT_DECISION_WINDOW_MS, MAX_OT_DURATION_MS, DAYS_IN_MONTH } from '../constants';
import { Play, Square, Clock, TrendingUp, CheckCircle, AlertCircle, Megaphone, Loader2 } from 'lucide-react';

interface WorkerDashboardProps {
  user: User;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leaves: Leave[];
  announcements: Announcement[];
}

const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ user, shifts, setShifts, leaves, announcements }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Find currently active shift (running or OT)
  const activeShift = shifts.find(s => s.workerId === user.id && (s.status === 'running' || s.status === 'ot_requested' || s.status === 'ot_running'));
  
  // Find if there's any shift pending admin approval
  const pendingApprovalShift = shifts.find(s => s.workerId === user.id && s.status === 'completed' && !s.isApproved);

  const startJob = () => {
    if (pendingApprovalShift) return;
    const newShift: Shift = {
      id: Math.random().toString(36).substr(2, 9),
      workerId: user.id,
      date: todayStr,
      startTime: Date.now(),
      status: 'running',
      isApproved: false,
      totalHours: 0,
      estimatedEarnings: 0,
      approvedEarnings: 0
    };
    setShifts(prev => [...prev, newShift]);
  };

  const endJob = () => {
    setShifts(prev => prev.map(s => {
      if (s.id === activeShift?.id) {
        return { 
          ...s, 
          status: 'completed', 
          endTime: Date.now(),
          totalHours: (Date.now() - s.startTime) / 3600000 
        };
      }
      return s;
    }));
  };

  const applyOvertime = () => {
    setShifts(prev => prev.map(s => {
      if (s.id === activeShift?.id) {
        return { ...s, status: 'ot_requested', otRequestedAt: Date.now() };
      }
      return s;
    }));
  };

  const endOvertime = () => {
    setShifts(prev => prev.map(s => {
      if (s.id === activeShift?.id) {
        return { 
          ...s, 
          status: 'completed', 
          otEndTime: Date.now(),
          endTime: Date.now(),
          totalHours: (Date.now() - s.startTime) / 3600000 
        };
      }
      return s;
    }));
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const stats = useMemo(() => {
    const workerShifts = shifts.filter(s => s.workerId === user.id);
    const dailyPay = user.monthlySalary / DAYS_IN_MONTH;
    const hourlyPay = dailyPay / 10;
    const otHourlyPay = hourlyPay * 1.5;

    let totalEst = 0;
    let totalAppr = 0;

    workerShifts.forEach(s => {
      const normalHrs = Math.min(10, s.totalHours || 0);
      const otHrs = s.otStartTime && s.otEndTime ? (s.otEndTime - s.otStartTime) / 3600000 : 0;
      const amount = (normalHrs * hourlyPay) + (otHrs * otHourlyPay);
      
      totalEst += amount;
      if (s.isApproved) totalAppr += amount;
    });

    return { totalEst, totalAppr };
  }, [shifts, user]);

  const renderAction = () => {
    if (pendingApprovalShift) {
      return (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center animate-pulse">
          <div className="bg-gray-200 p-4 rounded-full text-gray-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Pending Approval</h3>
            <p className="text-sm text-gray-500">Your last job entry is being verified by the Admin. Please wait for approval to start a new job.</p>
          </div>
        </div>
      );
    }

    if (!activeShift) {
      return (
        <button 
          onClick={startJob}
          className="w-full bg-blue-600 text-white rounded-2xl py-8 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-blue-100"
        >
          <div className="bg-white/20 p-4 rounded-full">
            <Play fill="white" size={32} />
          </div>
          <span className="text-xl font-bold">START JOB</span>
        </button>
      );
    }

    const elapsed = now - activeShift.startTime;
    const isShiftDone = elapsed >= SHIFT_DURATION_MS;

    if (activeShift.status === 'running') {
      if (isShiftDone) {
        const countdown = Math.max(0, Math.floor((OT_DECISION_WINDOW_MS - (elapsed - SHIFT_DURATION_MS)) / 1000));
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
              <AlertCircle className="text-orange-500 shrink-0" />
              <div className="text-xs text-orange-800">
                10 hours completed. Auto-ending in <span className="font-bold">{countdown}s</span> if no action taken.
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={endJob}
                className="flex-1 bg-gray-100 text-gray-800 rounded-2xl py-6 font-bold active:scale-95 transition-all"
              >
                END JOB
              </button>
              <button 
                onClick={applyOvertime}
                className="flex-1 bg-blue-600 text-white rounded-2xl py-6 font-bold active:scale-95 transition-all"
              >
                APPLY OT
              </button>
            </div>
          </div>
        );
      }
      return (
        <button 
          onClick={endJob}
          className="w-full bg-gray-900 text-white rounded-2xl py-8 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <div className="bg-white/10 p-4 rounded-full">
            <Square fill="white" size={28} />
          </div>
          <span className="text-xl font-bold">END JOB</span>
        </button>
      );
    }

    if (activeShift.status === 'ot_requested') {
      const waitTime = now - (activeShift.otRequestedAt || 0);
      const countdown = Math.max(0, Math.floor((OT_DECISION_WINDOW_MS - waitTime) / 1000));
      return (
        <div className="bg-blue-50 border border-blue-100 p-8 rounded-2xl flex flex-col items-center gap-4 text-center">
          <Clock className="text-blue-500 animate-pulse" size={48} />
          <div>
            <h3 className="text-lg font-bold text-blue-900">OT Requested</h3>
            <p className="text-sm text-blue-600">Waiting for Admin decision...</p>
          </div>
          <div className="text-3xl font-mono font-bold text-blue-800">00:{countdown.toString().padStart(2, '0')}</div>
        </div>
      );
    }

    if (activeShift.status === 'ot_running') {
      const otDuration = now - (activeShift.otStartTime || 0);
      return (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-100 p-5 rounded-2xl text-center space-y-2">
            <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Overtime Running</span>
            <div className="text-3xl font-mono font-bold text-green-800">{formatDuration(otDuration)}</div>
            <div className="text-[10px] text-green-600 font-bold uppercase flex items-center justify-center gap-1.5 opacity-80">
              <Clock size={12} />
              OT Started at: {new Date(activeShift.otStartTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button 
            onClick={endOvertime}
            className="w-full bg-red-600 text-white rounded-2xl py-6 font-bold active:scale-95 transition-all shadow-lg shadow-red-100"
          >
            END OVERTIME / SHIFT
          </button>
        </div>
      );
    }

    return null;
  };

  const getShiftTime = () => {
    if (!activeShift) return "00:00:00";
    if (activeShift.status === 'ot_running') return "10:00:00";
    return formatDuration(now - activeShift.startTime);
  };

  return (
    <div className="px-6 pt-10 pb-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Worker Dashboard</h2>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {user.name.split(' ')[0]}</h1>
        </div>
        <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
          <img src={user.photoUrl} alt="profile" className="h-full w-full object-cover" />
        </div>
      </header>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="bg-blue-600 rounded-2xl p-4 flex gap-3 items-center shadow-lg shadow-blue-100">
          <div className="bg-white/20 p-2 rounded-xl text-white"><Megaphone size={20} /></div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-blue-100 uppercase">Site Notice</p>
            <p className="text-sm font-bold text-white leading-snug">{announcements[0].content}</p>
          </div>
        </div>
      )}

      {/* Main Stats Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Current Working Hours</span>
            <div className="text-4xl font-mono font-bold text-gray-900 tabular-nums">
              {getShiftTime()}
            </div>
          </div>
          <div className="bg-blue-50 p-2 rounded-xl">
            <Clock className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Estimated</span>
              <TrendingUp size={10} className="text-gray-400" />
            </div>
            <div className="text-lg font-bold text-gray-900">{stats.totalEst.toFixed(2)} <span className="text-xs text-gray-500 font-medium">SAR</span></div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Approved</span>
              <CheckCircle size={10} className="text-blue-500" />
            </div>
            <div className="text-lg font-bold text-blue-600">{stats.totalAppr.toFixed(2)} <span className="text-xs text-blue-400 font-medium">SAR</span></div>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div>
        {renderAction()}
      </div>

      {/* Monthly Summary */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">Monthly Earnings</h3>
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Monthly Salary</p>
            <p className="text-xl font-bold text-gray-900">{user.monthlySalary} SAR</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Base Per Day</p>
            <p className="text-sm font-semibold text-gray-600">{(user.monthlySalary / 30).toFixed(0)} SAR</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
