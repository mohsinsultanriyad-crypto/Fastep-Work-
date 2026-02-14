
import React, { useState, useMemo, useEffect } from 'react';
import { User, Shift, Announcement, AdvanceRequest } from '../types';
import { DAYS_IN_MONTH, BASE_HOURS } from '../constants';
import { Clock, TrendingUp, CheckCircle, Megaphone, Save, Edit3, Lock, Zap, Coffee, Calendar, Wallet, Info, AlertCircle } from 'lucide-react';

interface WorkerDashboardProps {
  user: User;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leaves: any[];
  advanceRequests: AdvanceRequest[];
  announcements: Announcement[];
}

const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ user, shifts, setShifts, announcements, advanceRequests }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState(todayStr);
  
  const selectedShift = useMemo(() => 
    shifts.find(s => s.workerId === user.id && s.date === selectedDate),
    [shifts, user.id, selectedDate]
  );

  const [inTime, setInTime] = useState('08:00');
  const [outTime, setOutTime] = useState('18:30');
  const [breakMins, setBreakMins] = useState('30');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (selectedShift) {
      setInTime(new Date(selectedShift.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
      setOutTime(new Date(selectedShift.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
      setBreakMins(selectedShift.breakMinutes.toString());
      setNotes(selectedShift.notes || '');
      setIsEditing(false);
    } else {
      setInTime('08:00');
      setOutTime('18:30');
      setBreakMins('30');
      setNotes('');
      setIsEditing(false);
    }
  }, [selectedShift, selectedDate]);

  const dailyPay = user.monthlySalary / DAYS_IN_MONTH;
  const hourlyPay = dailyPay / BASE_HOURS;
  const otRate = hourlyPay * 1.5;

  const calculateBreakdown = (inT: string, outT: string, brk: string) => {
    const [inH, inM] = inT.split(':').map(Number);
    const [outH, outM] = outT.split(':').map(Number);
    
    let totalMs = (outH * 3600000 + outM * 60000) - (inH * 3600000 + inM * 60000);
    if (totalMs < 0) totalMs += 24 * 3600000;
    
    const workHrs = (totalMs / 3600000) - (Number(brk) / 60);
    const regHrs = Math.min(BASE_HOURS, workHrs);
    const otHrs = Math.max(0, workHrs - BASE_HOURS);
    
    const regEarnings = regHrs * hourlyPay;
    const otEarnings = otHrs * otRate;
    
    return { 
      total: Math.max(0, workHrs), 
      reg: Math.max(0, regHrs), 
      ot: Math.max(0, otHrs),
      regEarnings,
      otEarnings,
      totalEarnings: regEarnings + otEarnings
    };
  };

  const currentBreakdown = calculateBreakdown(inTime, outTime, breakMins);

  const handleSave = () => {
    if (!selectedDate) {
      alert("Working date is required.");
      return;
    }
    if (selectedDate > todayStr) {
      alert("Submission for future dates is not allowed.");
      return;
    }
    if (selectedShift?.isApproved) {
      alert("This date has already been approved and cannot be modified.");
      return;
    }

    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    const startTime = new Date(new Date(selectedDate).setHours(inH, inM, 0, 0)).getTime();
    const endTime = new Date(new Date(selectedDate).setHours(outH, outM, 0, 0)).getTime();

    const newShift: Shift = {
      id: selectedShift?.id || Math.random().toString(36).substr(2, 9),
      workerId: user.id,
      date: selectedDate,
      startTime,
      endTime,
      breakMinutes: Number(breakMins),
      notes,
      status: 'pending',
      isApproved: false,
      totalHours: currentBreakdown.total,
      estimatedEarnings: currentBreakdown.totalEarnings,
      approvedEarnings: 0
    };

    setShifts(prev => {
      const filtered = prev.filter(s => s.id !== newShift.id);
      return [...filtered, newShift];
    });
    setIsEditing(false);
  };

  // ADVANCED EARNINGS CALCULATION
  const stats = useMemo(() => {
    const workerShifts = shifts.filter(s => s.workerId === user.id);
    let appTotalEarnings = 0;
    let pendingTotalEarnings = 0;
    let totalWorkHours = 0;

    workerShifts.forEach(s => {
      // Use original shift timestamps to calculate earnings
      const b = calculateBreakdown(
        new Date(s.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        new Date(s.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        s.breakMinutes.toString()
      );
      
      if (s.isApproved) {
        appTotalEarnings += b.totalEarnings;
      } else {
        pendingTotalEarnings += b.totalEarnings;
      }
      totalWorkHours += b.total;
    });

    const totalAdvances = advanceRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0);

    return { 
      appTotalEarnings, 
      pendingTotalEarnings, 
      totalWorkHours, 
      totalAdvances,
      netPayable: appTotalEarnings - totalAdvances
    };
  }, [shifts, user.id, hourlyPay, otRate, advanceRequests]);

  const isLocked = selectedShift?.isApproved;

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
            <span className="text-[10px] font-bold text-gray-400 uppercase">Total Working Hours (Cycle)</span>
            <div className="text-4xl font-mono font-bold text-gray-900 tabular-nums">
              {stats.totalWorkHours.toFixed(1)}
              <span className="text-lg ml-1 font-sans text-gray-400">HRS</span>
            </div>
          </div>
          <div className="bg-blue-50 p-2 rounded-xl">
            <Clock className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Est. Payable</span>
              <TrendingUp size={10} className="text-blue-500" />
            </div>
            <div className="text-lg font-bold text-gray-900">{stats.appTotalEarnings.toFixed(0)} <span className="text-xs text-gray-500 font-medium">SAR</span></div>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-1 justify-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Approved</span>
              <CheckCircle size={10} className="text-green-500" />
            </div>
            <div className="text-lg font-bold text-green-600">{(stats.appTotalEarnings).toFixed(0)} <span className="text-xs text-green-400 font-medium">SAR</span></div>
          </div>
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
            {isLocked ? <Lock size={16} className="text-blue-500" /> : <Edit3 size={16} className="text-gray-400" />}
            {selectedShift && !isEditing ? "View Work Log" : "Manual Time Entry"}
          </h3>
          {selectedShift && !isLocked && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-blue-600 uppercase">Edit Entry</button>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Working Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="date" 
              value={selectedDate}
              max={todayStr}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 pl-11 pr-4 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
            />
          </div>
        </div>

        {(!selectedShift || isEditing) && !isLocked ? (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Morning In</label>
                <input 
                  type="time" 
                  value={inTime} 
                  onChange={e => setInTime(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Evening Out</label>
                <input 
                  type="time" 
                  value={outTime} 
                  onChange={e => setOutTime(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Lunch/Break (Minutes)</label>
              <div className="relative">
                <Coffee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="number" 
                  value={breakMins} 
                  onChange={e => setBreakMins(e.target.value)} 
                  placeholder="0" 
                  className="w-full bg-gray-50 border border-gray-100 pl-11 pr-4 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                />
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-4 space-y-3 border border-blue-100/50">
               <div className="flex justify-between items-center text-[10px] font-black uppercase text-blue-600 tracking-widest">
                 <span>Shift Breakdown</span>
                 <span>Rate: {hourlyPay.toFixed(1)}/h</span>
               </div>
               <div className="flex justify-between items-center">
                 <div className="text-center flex-1 border-r border-blue-100">
                   <p className="text-[9px] font-bold text-gray-400 uppercase">Base (10h)</p>
                   <p className="text-sm font-bold text-gray-900">{currentBreakdown.reg.toFixed(2)}h</p>
                 </div>
                 <div className="text-center flex-1 border-r border-blue-100">
                   <p className="text-[9px] font-bold text-gray-400 uppercase text-orange-500">OT (1.5x)</p>
                   <p className="text-sm font-bold text-orange-600">{currentBreakdown.ot.toFixed(2)}h</p>
                 </div>
                 <div className="text-center flex-1">
                   <p className="text-[9px] font-bold text-gray-400 uppercase">Earnings</p>
                   <p className="text-sm font-black text-blue-700">{currentBreakdown.totalEarnings.toFixed(0)} SAR</p>
                 </div>
               </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-100 transition-all"
            >
              <Save size={18} />
              {selectedShift ? 'UPDATE WORK LOG' : 'SAVE WORK LOG'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Morning In</p>
                <p className="text-sm font-bold text-gray-900">{new Date(selectedShift!.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Out Time</p>
                <p className="text-sm font-bold text-gray-900">{new Date(selectedShift!.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
              <div>
                 <p className="text-[9px] font-bold text-gray-400 uppercase">Verification Status</p>
                 <span className={`text-[10px] font-bold uppercase ${isLocked ? 'text-green-600' : 'text-orange-500'}`}>
                   {isLocked ? "Approved & Paid" : "Waiting Verification"}
                 </span>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-bold text-gray-400 uppercase">Shift Total</p>
                 <p className="text-sm font-black text-gray-900">{currentBreakdown.totalEarnings.toFixed(0)} SAR</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DYNAMIC EARNINGS BREAKDOWN - THE WALLET VIEW */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 flex items-center gap-2">
          <Wallet size={12} /> Live Financial Status
        </h3>
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Contract Salary</p>
              <p className="text-lg font-black text-gray-900">{user.monthlySalary} <span className="text-xs font-normal">SAR</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-green-500 uppercase">Total Approved</p>
              <p className="text-xl font-black text-green-600">{stats.appTotalEarnings.toFixed(0)} <span className="text-xs">SAR</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
              <div className="flex items-center gap-1">
                <AlertCircle size={10} className="text-orange-400" />
                <p className="text-[9px] font-bold text-gray-400 uppercase">Pending Appr.</p>
              </div>
              <p className="text-sm font-bold text-gray-900">+{stats.pendingTotalEarnings.toFixed(0)} SAR</p>
            </div>
            <div className="bg-red-50/50 p-4 rounded-2xl space-y-1 border border-red-100/30">
              <div className="flex items-center gap-1">
                <TrendingUp size={10} className="text-red-400 -scale-y-100" />
                <p className="text-[9px] font-bold text-red-400 uppercase">Advances Taken</p>
              </div>
              <p className="text-sm font-bold text-red-600">-{stats.totalAdvances.toFixed(0)} SAR</p>
            </div>
          </div>

          <div className="bg-blue-600 rounded-2xl p-5 text-white flex justify-between items-center shadow-xl shadow-blue-50">
            <div>
              <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest">Net Payable Balance</p>
              <p className="text-3xl font-black">{stats.netPayable.toFixed(0)} <span className="text-sm font-normal">SAR</span></p>
            </div>
            <div className="bg-white/20 p-2 rounded-xl">
               <CheckCircle size={28} />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
             <Info size={12} className="text-blue-500 shrink-0" />
             This breakdown is calculated based on hours approved by the Admin and advances deducted.
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
