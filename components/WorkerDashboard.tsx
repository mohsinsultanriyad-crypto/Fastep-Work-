import React, { useMemo, useState } from "react";
import { User, Shift, Announcement } from "../types";
import { DAYS_IN_MONTH, BASE_HOURS } from "../constants";
import {
  Clock,
  CheckCircle,
  Megaphone,
  Save,
  Edit3,
  Lock,
  Zap,
  Coffee,
} from "lucide-react";

interface WorkerDashboardProps {
  user: User;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leaves: any[];
  announcements: Announcement[];
}

function getApiBase() {
  // 1) If you set VITE_API_BASE in .env, it will use that.
  // Example: VITE_API_BASE=https://xxxx-5000.app.github.dev/api
  const envBase = (import.meta as any)?.env?.VITE_API_BASE as string | undefined;
  if (envBase && typeof envBase === "string") return envBase.replace(/\/$/, "");

  // 2) Auto-detect Codespaces (3000 -> 5000)
  const host = window.location.hostname;
  const proto = window.location.protocol;

  if (host.includes("-3000.")) {
    return `${proto}//${host.replace("-3000.", "-5000.")}/api`;
  }

  // 3) Local fallback
  return "https://turbo-fishstick-97rvgg9vpxjxh777g-5000.app.github.dev/api";
}

function safeId(user: any) {
  // Prefer Mongo _id if present
  return user?._id || user?.mongoId || user?.id || user?.workerId || "";
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  user,
  shifts,
  setShifts,
  announcements,
}) => {
  const API = getApiBase();
  const todayStr = new Date().toISOString().split("T")[0];

  const workerDbId = safeId(user);

  // Helper to parse timestamp safely
  const parseTime = (timeVal: any): string => {
    if (!timeVal) return "08:00";
    try {
      // If it's a string that looks like a timestamp
      if (typeof timeVal === "string" && /^\d{13}$/.test(timeVal)) {
        const ms = Number(timeVal);
        const date = new Date(ms);
        const h = String(date.getHours()).padStart(2, "0");
        const m = String(date.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
      }
      // If it's already a number (milliseconds)
      if (typeof timeVal === "number") {
        const date = new Date(timeVal);
        const h = String(date.getHours()).padStart(2, "0");
        const m = String(date.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
      }
      // Default: try parsing as date
      const date = new Date(timeVal);
      if (!isNaN(date.getTime())) {
        const h = String(date.getHours()).padStart(2, "0");
        const m = String(date.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
      }
    } catch (e) {
      console.warn("Failed to parse time:", timeVal, e);
    }
    return "08:00";
  };

  // Find today's entry (match by db id OR old id to be safe)
  const todayShift = useMemo(() => {
    return shifts.find(
      (s) =>
        (s.workerId === workerDbId || s.workerId === (user as any)?.id) &&
        s.date === todayStr
    );
  }, [shifts, workerDbId, todayStr, user]);

  const [inTime, setInTime] = useState(
    todayShift ? parseTime(todayShift.startTime) : "08:00"
  );
  const [outTime, setOutTime] = useState(
    todayShift ? parseTime(todayShift.endTime) : "18:30"
  );
  const [breakMins, setBreakMins] = useState(
    todayShift ? String(todayShift.breakMinutes) : "30"
  );
  const [notes, setNotes] = useState(todayShift?.notes || "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const dailyPay = (user as any).monthlySalary / DAYS_IN_MONTH;
  const hourlyPay = dailyPay / BASE_HOURS;
  const otRate = hourlyPay * 1.5;

  // ✅ Refetch work status from server to check if approved
  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      console.log(`[Refresh] Checking status for ${workerDbId} on ${todayStr}`);
      const url = `${API}/work/status/${workerDbId}/${todayStr}`;
      console.log(`[Refresh] URL: ${url}`);
      
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" }
      });
      
      if (res.ok) {
        const work = await res.json();
        console.log(`[Refresh] Got response:`, work);
        if (work) {
          // Update shifts with latest data
          const newShift: any = {
            id: work._id,
            workerId: workerDbId,
            date: todayStr,
            startTime: work.startTime,
            endTime: work.endTime,
            breakMinutes: work.breakMinutes || 0,
            notes: work.notes || "",
            status: work.status,
            isApproved: !!work.isApproved,
            totalHours: work.totalHours,
            estimatedEarnings: 0,
            approvedEarnings: 0,
          };

          setShifts((prev) => {
            const filtered = prev.filter(
              (s) =>
                !(
                  (s.workerId === workerDbId || s.workerId === (user as any)?.id) &&
                  s.date === todayStr
                )
            );
            return [...filtered, newShift];
          });
          
          if (work.isApproved) {
            alert("✅ Your entry has been approved!");
          } else {
            alert("⏳ Your entry is still pending. Check back later.");
          }
        }
      } else {
        const errMsg = await res.text();
        console.log(`[Refresh] Error ${res.status}:`, errMsg);
        alert(`No submission found for today (${todayStr}). Please submit first.`);
      }
    } catch (e) {
      console.error("Refetch failed:", e);
      alert("Error checking status. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const calculateBreakdown = (inT: string, outT: string, brk: string) => {
    const [inH, inM] = inT.split(":").map(Number);
    const [outH, outM] = outT.split(":").map(Number);

    let totalMs =
      outH * 3600000 + outM * 60000 - (inH * 3600000 + inM * 60000);
    if (totalMs < 0) totalMs += 24 * 3600000;

    const workHrs = totalMs / 3600000 - Number(brk || 0) / 60;
    const regHrs = Math.min(BASE_HOURS, workHrs);
    const otHrs = Math.max(0, workHrs - BASE_HOURS);

    const regEarnings = Math.max(0, regHrs) * hourlyPay;
    const otEarnings = Math.max(0, otHrs) * otRate;

    return {
      total: Math.max(0, workHrs),
      reg: Math.max(0, regHrs),
      ot: Math.max(0, otHrs),
      regEarnings,
      otEarnings,
      totalEarnings: regEarnings + otEarnings,
    };
  };

  const currentBreakdown = calculateBreakdown(inTime, outTime, breakMins);

  const stats = useMemo(() => {
    const workerShifts = shifts.filter(
      (s) => s.workerId === workerDbId || s.workerId === (user as any)?.id
    );

    let regTotal = 0;
    let otTotal = 0;
    let appTotal = 0;

    workerShifts.forEach((s) => {
      const b = calculateBreakdown(
        new Date(s.startTime).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        new Date(s.endTime).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        String(s.breakMinutes)
      );
      regTotal += b.regEarnings;
      otTotal += b.otEarnings;
      if (s.isApproved) appTotal += b.regEarnings + b.otEarnings;
    });

    return { regTotal, otTotal, totalEst: regTotal + otTotal, appTotal };
  }, [shifts, workerDbId, user, hourlyPay, otRate]);

  const isLocked = !!todayShift?.isApproved;

  const handleSave = async () => {
    if (isLocked) return;

    setSaving(true);
    try {
      const totalHrs = currentBreakdown.total;
      const estEarnings = currentBreakdown.totalEarnings;

      const [inH, inM] = inTime.split(":").map(Number);
      const [outH, outM] = outTime.split(":").map(Number);

      const startTime = new Date(
        new Date(todayStr).setHours(inH, inM, 0, 0)
      ).getTime();

      const endTime = new Date(
        new Date(todayStr).setHours(outH, outM, 0, 0)
      ).getTime();

      const payload = {
        workerId: workerDbId, // ✅ Mongo id preferred
        date: todayStr,
        startTime,
        endTime,
        breakMinutes: Number(breakMins || 0),
        notes: notes || "",
        totalHours: totalHrs,
        otHours: Math.max(0, totalHrs - BASE_HOURS),
      };

      console.log(`[Submit] Payload:`, payload);

      // ✅ send to backend
      const res = await fetch(`${API}/work/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // show backend message if present
        let msg = "Submit failed";
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch {}
        alert(msg);
        return;
      }

      // backend may return saved doc
      let saved: any = null;
      try {
        saved = await res.json();
        console.log(`[Submit] Success. Saved:`, saved);
      } catch {
        saved = null;
      }

      // ✅ update local UI shifts so history/admin UI stays consistent
      const newShift: Shift = {
        id: saved?._id || todayShift?.id || Math.random().toString(36).slice(2, 11),
        workerId: workerDbId,
        date: todayStr,
        startTime,
        endTime,
        breakMinutes: Number(breakMins || 0),
        notes,
        status: saved?.status || "pending",
        isApproved: !!saved?.isApproved,
        totalHours: totalHrs,
        estimatedEarnings: estEarnings,
        approvedEarnings: saved?.approvedEarnings || 0,
      } as any;

      setShifts((prev) => {
        // replace today's entry for this worker
        const filtered = prev.filter(
          (s) =>
            !(
              (s.workerId === workerDbId || s.workerId === (user as any)?.id) &&
              s.date === todayStr
            )
        );
        return [...filtered, newShift];
      });

      setIsEditing(false);
    } catch (e) {
      console.log(e);
      alert("Backend not running ❌");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 pt-10 pb-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Worker Dashboard
          </h2>
          <h1 className="text-2xl font-bold text-gray-900">
            Hello, {user.name?.split(" ")?.[0] || "Worker"}
          </h1>
        </div>
        <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
          <img
            src={(user as any).photoUrl}
            alt="profile"
            className="h-full w-full object-cover"
          />
        </div>
      </header>

      {announcements.length > 0 && (
        <div className="bg-blue-600 rounded-2xl p-4 flex gap-3 items-center shadow-lg shadow-blue-100">
          <div className="bg-white/20 p-2 rounded-xl text-white">
            <Megaphone size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-blue-100 uppercase">
              Site Notice
            </p>
            <p className="text-sm font-bold text-white leading-snug">
              {announcements[0].content}
            </p>
          </div>
        </div>
      )}

      {/* Main Stats Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              Total Working Hours (Today)
            </span>
            <div className="text-4xl font-mono font-bold text-gray-900 tabular-nums">
              {todayShift && !isEditing
                ? todayShift.totalHours.toFixed(2)
                : currentBreakdown.total.toFixed(2)}
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
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                OT Earned
              </span>
              <Zap size={10} className="text-orange-500" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {stats.otTotal.toFixed(0)}{" "}
              <span className="text-xs text-gray-500 font-medium">SAR</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Total Approved
              </span>
              <CheckCircle size={10} className="text-blue-500" />
            </div>
            <div className="text-lg font-bold text-blue-600">
              {stats.appTotal.toFixed(0)}{" "}
              <span className="text-xs text-blue-400 font-medium">SAR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
            {isLocked ? (
              <Lock size={16} className="text-blue-500" />
            ) : (
              <Edit3 size={16} className="text-gray-400" />
            )}
            {todayShift && !isEditing ? "Today's Work Log" : "Manual Time Entry"}
          </h3>

          {todayShift && !isLocked && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-[10px] font-bold text-blue-600 uppercase"
            >
              Edit Entry
            </button>
          )}
        </div>

        {(!todayShift || isEditing) && !isLocked ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Morning In
                </label>
                <input
                  type="time"
                  value={inTime}
                  onChange={(e) => setInTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Evening Out
                </label>
                <input
                  type="time"
                  value={outTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                Lunch/Break (Minutes)
              </label>
              <div className="relative">
                <Coffee
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="number"
                  value={breakMins}
                  onChange={(e) => setBreakMins(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-100 pl-11 pr-4 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Live Calculation Preview */}
            <div className="bg-blue-50/50 rounded-2xl p-4 space-y-3 border border-blue-100/50">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-blue-600 tracking-widest">
                <span>Shift Breakdown</span>
                <span>Rate: {hourlyPay.toFixed(1)}/h</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-center flex-1 border-r border-blue-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">
                    Base ({BASE_HOURS}h)
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {currentBreakdown.reg.toFixed(2)}h
                  </p>
                </div>
                <div className="text-center flex-1 border-r border-blue-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase text-orange-500">
                    OT (1.5x)
                  </p>
                  <p className="text-sm font-bold text-orange-600">
                    {currentBreakdown.ot.toFixed(2)}h
                  </p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">
                    Today Earnings
                  </p>
                  <p className="text-sm font-black text-blue-700">
                    {currentBreakdown.totalEarnings.toFixed(0)} SAR
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Work done details..."
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 h-20 resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-100 transition-all"
            >
              <Save size={18} />
              {saving ? "SAVING..." : todayShift ? "UPDATE WORK LOG" : "SAVE WORK LOG"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase">
                  Morning In
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(todayShift!.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase">
                  Out Time
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(todayShift!.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50/30 p-3 rounded-2xl text-center">
                <p className="text-[8px] font-bold text-gray-400 uppercase">
                  Regular
                </p>
                <p className="text-xs font-bold text-gray-900">
                  {currentBreakdown.reg.toFixed(1)}h
                </p>
              </div>
              <div className="bg-orange-50/30 p-3 rounded-2xl text-center">
                <p className="text-[8px] font-bold text-orange-400 uppercase">
                  OT
                </p>
                <p className="text-xs font-bold text-orange-600">
                  {currentBreakdown.ot.toFixed(1)}h
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl text-center">
                <p className="text-[8px] font-bold text-gray-400 uppercase">
                  Break
                </p>
                <p className="text-xs font-bold text-gray-900">
                  {todayShift!.breakMinutes}m
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">
                  Verification Status
                </p>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    isLocked ? "text-green-600" : "text-orange-500"
                  }`}
                >
                  {isLocked ? "Approved & Paid" : "Waiting Verification"}
                </span>
              </div>
              {!isLocked && (
                <button
                  onClick={handleRefreshStatus}
                  disabled={refreshing}
                  className="text-[10px] font-bold text-blue-600 uppercase disabled:opacity-50 active:scale-95"
                >
                  {refreshing ? "Checking..." : "Check Status"}
                </button>
              )}
              {isLocked && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">
                    Daily Total
                  </p>
                  <p className="text-sm font-black text-gray-900">
                    {currentBreakdown.totalEarnings.toFixed(0)} SAR
                  </p>
                </div>
              )}
            </div>

            {todayShift?.notes && (
              <div className="bg-gray-50 p-4 rounded-2xl italic text-xs text-gray-600 border-l-2 border-blue-200">
                "{todayShift.notes}"
              </div>
            )}

            {isLocked && (
              <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-blue-600" />
                  <p className="text-[9px] font-bold text-blue-700 uppercase leading-tight">
                    This entry is locked and verified by the Admin.
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Clear form and allow new submission
                    setInTime("08:00");
                    setOutTime("18:30");
                    setBreakMins("30");
                    setNotes("");
                    setIsEditing(true);
                  }}
                  className="text-[9px] font-bold text-blue-600 uppercase whitespace-nowrap active:scale-95"
                >
                  New Entry
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">
          Monthly Earnings
        </h3>
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Monthly Salary</p>
            <p className="text-xl font-bold text-gray-900">
              {(user as any).monthlySalary} SAR
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold">
              Base Per Day
            </p>
            <p className="text-sm font-semibold text-gray-600">
              {(((user as any).monthlySalary || 0) / 30).toFixed(0)} SAR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
