import React, { useEffect, useMemo, useState } from "react";
import { User, Shift, Leave, AdvanceRequest, Announcement } from "../types";
import {
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  Calendar,
  Wallet,
  Trophy,
  Megaphone,
  Bell,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { API_BASE_URL as API } from "../api";

interface AdminDashboardProps {
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leaves: Leave[];
  setLeaves: React.Dispatch<React.SetStateAction<Leave[]>>;
  workers: User[];
  advanceRequests: AdvanceRequest[];
  setAdvanceRequests: React.Dispatch<React.SetStateAction<AdvanceRequest[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
}

type PendingWork = {
  _id: string;
  date: string;
  totalHours?: number;
  otHours?: number;
  notes?: string;
  breakMinutes?: number;
  workerId?: any; // can be populated object OR string
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  shifts,
  setShifts,
  leaves,
  setLeaves,
  workers,
  advanceRequests,
  setAdvanceRequests,
  announcements,
  setAnnouncements,
}) => {
  // ---------------------------
  // ✅ Backend Pending Leaves & Advances
  // ---------------------------
  const [pendingLeavesFromBackend, setPendingLeavesFromBackend] = useState<any[]>([]);
  const [pendingAdvancesFromBackend, setPendingAdvancesFromBackend] = useState<any[]>([]);
  const [pendingAttendance, setPendingAttendance] = useState<PendingWork[]>([]);
  const [backendOk, setBackendOk] = useState(true);

  const getAdminSecret = () => {
    // Get admin secret from env - MUST be set via VITE_ADMIN_SECRET
    const secret = (import.meta as any)?.env?.VITE_ADMIN_SECRET || '';
    if (!secret) {
      console.warn('[AdminDashboard] ⚠️ VITE_ADMIN_SECRET not set! Admin endpoints will fail with 401');
    }
    return secret;
  };

  const fetchPendingLeaves = async () => {
    try {
      const adminSecret = getAdminSecret();
      console.log('[AdminDashboard] Fetching pending leaves...', { secret: adminSecret ? '***set***' : 'NOT SET' });
      const res = await fetch(`${API}/api/leaves/admin/pending`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[AdminDashboard] Failed to fetch pending leaves:', { 
          status: res.status, 
          statusText: res.statusText,
          body: errorText,
          url: res.url
        });
        return;
      }

      const data = await res.json();
      const leaves = Array.isArray(data) ? data : [];
      console.log('[AdminDashboard] Fetched pending leaves:', leaves.length);
      setPendingLeavesFromBackend(leaves);
    } catch (err) {
      console.error('[AdminDashboard] Error fetching leaves:', err);
    }
  };

  const fetchPendingAdvances = async () => {
    try {
      const adminSecret = getAdminSecret();
      console.log('[AdminDashboard] Fetching pending advances...', { secret: adminSecret ? '***set***' : 'NOT SET' });
      const res = await fetch(`${API}/api/advances/admin/pending`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[AdminDashboard] Failed to fetch pending advances:', { 
          status: res.status, 
          statusText: res.statusText,
          body: errorText,
          url: res.url
        });
        return;
      }

      const data = await res.json();
      const advances = Array.isArray(data) ? data : [];
      console.log('[AdminDashboard] Fetched pending advances:', advances.length);
      setPendingAdvancesFromBackend(advances);
    } catch (err) {
      console.error('[AdminDashboard] Error fetching advances:', err);
    }
  };

  const approveLeave = async (leaveId: string, status: 'accepted' | 'rejected') => {
    try {
      const adminSecret = getAdminSecret();
      console.log(`[AdminDashboard] ${status} leave ${leaveId}`, { secret: adminSecret ? '***set***' : 'NOT SET' });
      const res = await fetch(`${API}/api/leaves/admin/${leaveId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[AdminDashboard] Failed to ${status} leave:`, { 
          status: res.status, 
          statusText: res.statusText,
          body: errorText,
          url: res.url
        });
        alert(`Failed to ${status} leave (${res.status}): ${errorText}`);
        return;
      }

      console.log(`[AdminDashboard] Successfully ${status} leave`);
      setPendingLeavesFromBackend(prev => prev.filter(l => l._id !== leaveId));
      // Also update the local state
      setLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status } : l));
      await fetchPendingLeaves(); // Refresh list
    } catch (err) {
      console.error(`[AdminDashboard] Error ${status} leave:`, err);
      alert(`Error: ${(err as Error).message}`);
    }
  };

  const approveAdvance = async (advanceId: string, status: 'approved' | 'rejected' | 'scheduled', paymentDate?: string) => {
    try {
      const adminSecret = getAdminSecret();
      console.log(`[AdminDashboard] ${status} advance ${advanceId}`, { secret: adminSecret ? '***set***' : 'NOT SET' });
      const body: any = { status };
      if (status === 'scheduled' && paymentDate) {
        body.paymentDate = paymentDate;
      }

      const res = await fetch(`${API}/api/advances/admin/${advanceId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[AdminDashboard] Failed to ${status} advance:`, { 
          status: res.status, 
          statusText: res.statusText,
          body: errorText,
          url: res.url
        });
        alert(`Failed to ${status} advance (${res.status}): ${errorText}`);
        return;
      }

      console.log(`[AdminDashboard] Successfully ${status} advance`);
      setPendingAdvancesFromBackend(prev => prev.filter(a => a._id !== advanceId));
      // Also update the local state
      setAdvanceRequests(prev => prev.map(a => 
        a.id === advanceId ? { ...a, status, paymentDate } : a
      ));
      await fetchPendingAdvances(); // Refresh list
    } catch (err) {
      console.error(`[AdminDashboard] Error ${status} advance:`, err);
      alert(`Error: ${(err as Error).message}`);
    }
  };

  // Fetch pending leaves and advances on mount
  useEffect(() => {
    fetchPendingLeaves();
    fetchPendingAdvances();
    fetchPendingAttendance();
    
    // Refresh every 8-10 seconds
    const interval = setInterval(() => {
      fetchPendingLeaves();
      fetchPendingAdvances();
      fetchPendingAttendance();
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPendingAttendance = async () => {
    try {
      const res = await fetch(`${API}/api/admin/pending`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        setBackendOk(false);
        return;
      }

      const data = await res.json();

      // backend may return array OR {data:[]}
      const list: PendingWork[] = Array.isArray(data) ? data : [];
      console.log(`[AdminDashboard] Fetched pending entries:`, list.length, "items");
      console.log(`[AdminDashboard] Current shifts state:`, shifts.length, "items");
      setPendingAttendance(list);
      setBackendOk(true);
    } catch (err) {
      console.log(err);
      setBackendOk(false);
    }
  };

  const approveShift = async (id: string) => {
    try {
      console.log(`[AdminApprove] Approving work ID: ${id}`);
      
      const res = await fetch(`${API}/api/admin/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        console.error(`[AdminApprove] Failed with status ${res.status}`);
        alert("Approve failed ❌ (backend error)");
        return;
      }

      const updated = await res.json();
      console.log(`[AdminApprove] Success! Updated work:`, updated);

      // ✅ remove from UI instantly
      setPendingAttendance((prev) => prev.filter((x) => x._id !== id));
      
      alert("✅ Work hours approved successfully!");

      // (optional) refresh after short delay
      setTimeout(() => fetchPendingAttendance(), 500);
    } catch (err) {
      console.error("[AdminApprove] Error:", err);
      alert("Backend not running ❌");
    }
  };

  // Clear all cached work data (call this after backend clear-all)
  const clearCachedWorkData = () => {
    try {
      console.log("[Admin] Clearing work-related in-memory state...");
      // We no longer persist work data in browser storage; only clear runtime state.
      setShifts([]);
      setPendingAttendance([]);
      alert("✅ Cleared in-memory work state. Backend data remains unchanged.");
    } catch (err) {
      console.error("[Admin] Error clearing cache:", err);
      alert("Error clearing cache");
    }
  };

  // ---------------------------
  // Existing UI states
  // ---------------------------
  const [showPresentModal, setShowPresentModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnounce, setNewAnnounce] = useState("");
  const [announcePriority, setAnnouncePriority] = useState<"low" | "high">("low");
  const [schedulingReqId, setSchedulingReqId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0]);

  const todayStr = new Date().toISOString().split("T")[0];

  // Stats
  const presentTodayCount = shifts.filter((s) => s.date === todayStr).length;
  const pendingAdvances = advanceRequests.filter((r) => r.status === "pending");
  const pendingLeaves = leaves.filter((l) => l.status === "pending");

  const totalRequestsCount =
    pendingAdvances.length + pendingLeaves.length + pendingAttendance.length;

  // Scheduled Payments Due Alert
  const dueScheduledPayments = useMemo(() => {
    return advanceRequests.filter(
      (r) => r.status === "scheduled" && r.paymentDate && r.paymentDate <= todayStr
    );
  }, [advanceRequests, todayStr]);

  // Document Alerts
  const expiringDocs = useMemo(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return workers.filter((w) => {
      if (!w.isActive) return false;
      const iqama = w.iqamaExpiry ? new Date(w.iqamaExpiry) : null;
      const passport = w.passportExpiry ? new Date(w.passportExpiry) : null;
      return (iqama && iqama < thirtyDaysFromNow) || (passport && passport < thirtyDaysFromNow);
    });
  }, [workers]);

  const handleAddAnnouncement = () => {
    if (!newAnnounce.trim()) return;
    setAnnouncements([
      {
        id: Math.random().toString(36).substr(2, 9),
        content: newAnnounce,
        priority: announcePriority,
        timestamp: Date.now(),
      },
      ...announcements,
    ]);
    setNewAnnounce("");
    setShowAnnounceModal(false);
  };

  const decideAdvance = (id: string, status: "approved" | "rejected" | "scheduled", date?: string) => {
    setAdvanceRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, paymentDate: status === "scheduled" ? date : r.paymentDate } : r
      )
    );
    setSchedulingReqId(null);
  };

  const decideLeave = (id: string, status: "accepted" | "rejected") => {
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const otLeaderboard = useMemo(() => {
    const map: Record<string, number> = {};
    shifts.forEach((s) => {
      if (s.totalHours > 10) {
        map[s.workerId] = (map[s.workerId] || 0) + (s.totalHours - 10);
      }
    });
    return Object.entries(map)
      .map(([id, hrs]) => ({ worker: workers.find((w) => w.id === id), hrs }))
      .sort((a, b) => b.hrs - a.hrs)
      .slice(0, 3);
  }, [shifts, workers]);

  // helper: backend populated worker OR local list
  const getWorkerFromPending = (pending: PendingWork) => {
    const w = pending.workerId;
    if (w && typeof w === "object") return w;
    if (typeof w === "string") return workers.find((x) => x.id === w);
    return undefined;
  };

  return (
    <div className="px-6 pt-10 pb-6 space-y-8 bg-gray-50/50 min-h-screen">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Admin Control Center
          </h2>
          <h1 className="text-2xl font-black text-gray-900">Operations Hub</h1>

          {/* ✅ small backend status */}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                backendOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {backendOk ? "Backend running ✅" : "Backend not running ❌"}
            </span>
            <button
              onClick={clearCachedWorkData}
              className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-all"
              title="Clear cached work entries from browser storage"
            >
              Clear Cache
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAnnounceModal(true)}
          className="bg-gray-900 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all"
          title="Announcement"
        >
          <Megaphone size={20} />
        </button>
      </header>

      {/* Red Alert: Scheduled Payments Due Today */}
      {dueScheduledPayments.length > 0 && (
        <div className="bg-red-600 rounded-[2.5rem] p-6 text-white space-y-4 shadow-xl shadow-red-200 border-4 border-red-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={18} /> Scheduled Payments Due
            </h3>
            <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
              Today
            </span>
          </div>
          <div className="space-y-4">
            {dueScheduledPayments.map((r) => (
              <div
                key={r.id}
                className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-black">{r.workerName}</p>
                    <p className="text-lg font-bold">{r.amount} SAR</p>
                    <p className="text-[10px] font-bold opacity-70">Reason: {r.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase opacity-60">Scheduled For</p>
                    <p className="text-xs font-bold">{r.paymentDate}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => decideAdvance(r.id, "rejected")}
                    className="flex-1 bg-red-800/50 hover:bg-red-900/50 text-[10px] font-black py-2.5 rounded-xl border border-white/20 transition-all"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => decideAdvance(r.id, "approved")}
                    className="flex-1 bg-white text-red-600 text-[10px] font-black py-2.5 rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowPresentModal(true)}
          className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm text-left active:bg-gray-50 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Users size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{presentTodayCount}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            Reported Today
          </p>
        </button>

        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl mb-4 w-fit">
            <Bell size={20} />
          </div>
          <p className="text-3xl font-black text-gray-900">{totalRequestsCount}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            Total Requests
          </p>
        </div>
      </div>

      {/* ✅ LIVE Attendance Verification (from Backend) */}
      {pendingAttendance.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-blue-700 uppercase flex items-center gap-2 ml-1">
              <CheckCircle size={14} /> Attendance Verification
            </h3>
            <button
              onClick={fetchPendingAttendance}
              className="text-[10px] font-bold text-blue-600 uppercase"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {pendingAttendance.map((s) => {
              const worker = getWorkerFromPending(s);
              return (
                <div
                  key={s._id}
                  className="bg-white p-5 rounded-[2rem] border-2 border-blue-50 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {worker?.photoUrl ? (
                        <img src={worker.photoUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100" />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {worker?.name || "Worker"}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold">{s.date}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-blue-600">
                        {(s.totalHours ?? 0).toFixed(2)} hrs
                      </p>
                      <p className="text-[8px] text-orange-500 font-bold uppercase">
                        OT: {(s.otHours ?? 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {s.notes && (
                    <p className="text-[10px] bg-gray-50 p-2 rounded-xl italic">"{s.notes}"</p>
                  )}

                  <button
                    onClick={() => approveShift(s._id)}
                    className="w-full bg-blue-600 text-white text-[10px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={14} /> Approve Work Hours
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Advances */}
      {(pendingAdvancesFromBackend.length > 0 || pendingAdvances.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-green-600 uppercase flex items-center gap-2 ml-1">
            <Wallet size={14} /> Pending Advances
          </h3>
          <div className="space-y-3">
            {(pendingAdvancesFromBackend.length > 0 ? pendingAdvancesFromBackend : pendingAdvances).map((r: any) => (
              <div key={r._id || r.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{r.workerName || 'Worker'}</h4>
                    <p className="text-xl font-black text-green-600">{r.amount} SAR</p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{r.requestDate}</span>
                </div>

                {schedulingReqId === (r._id || r.id) ? (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-2xl">
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-white border border-blue-100 p-3 rounded-xl text-xs font-bold"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSchedulingReqId(null)}
                        className="flex-1 text-[10px] font-bold text-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => approveAdvance(r._id || r.id, "scheduled", scheduleDate)}
                        className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-2 rounded-xl"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => approveAdvance(r._id || r.id, "rejected")}
                      className="bg-red-50 text-red-600 text-[10px] font-bold py-3 rounded-xl"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setSchedulingReqId(r._id || r.id)}
                      className="bg-blue-50 text-blue-600 text-[10px] font-bold py-3 rounded-xl"
                    >
                      Schedule
                    </button>
                    <button
                      onClick={() => approveAdvance(r._id || r.id, "approved")}
                      className="bg-green-600 text-white text-[10px] font-bold py-3 rounded-xl shadow-lg shadow-green-100"
                    >
                      Pay Now
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Leaves */}
      {(pendingLeavesFromBackend.length > 0 || pendingLeaves.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2 ml-1">
            <Calendar size={14} /> Pending Leaves
          </h3>
          <div className="space-y-3">
            {(pendingLeavesFromBackend.length > 0 ? pendingLeavesFromBackend : pendingLeaves).map((l: any) => (
              <div key={l._id || l.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {workers.find((w) => w.id === l.workerId)?.name || l.workerId}
                    </h4>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-tighter">{l.date}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-[8px] font-bold px-2 py-1 rounded">
                    REQUEST
                  </span>
                </div>
                <p className="text-xs text-gray-600 italic px-3 border-l-2 border-gray-100">"{l.reason}"</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => approveLeave(l._id || l.id, "rejected")}
                    className="bg-gray-50 text-gray-400 text-xs font-bold py-3 rounded-xl"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => approveLeave(l._id || l.id, "accepted")}
                    className="bg-blue-600 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-blue-100"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring Documents */}
      {expiringDocs.length > 0 && (
        <div className="bg-red-600 rounded-[2.5rem] p-6 text-white space-y-4 shadow-xl shadow-red-100">
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 opacity-80">
            <AlertCircle size={14} /> Critical Document Alerts
          </h3>
          <div className="space-y-2">
            {expiringDocs.map((w) => (
              <div key={w.id} className="flex items-center justify-between bg-white/10 p-3 rounded-2xl">
                <div>
                  <p className="text-sm font-bold">{w.name}</p>
                  <p className="text-[8px] font-bold uppercase opacity-60">
                    Expires Soon: {w.iqamaExpiry || w.passportExpiry}
                  </p>
                </div>
                <Bell size={16} className="text-red-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OT Leaderboard */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Trophy size={14} className="text-yellow-500" /> OT Leaderboard
        </h3>
        {otLeaderboard.length > 0 ? (
          otLeaderboard.map((entry, i) => (
            <div key={i} className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-900">{entry.worker?.name}</span>
              <span className="text-blue-600">{entry.hrs.toFixed(1)}h</span>
            </div>
          ))
        ) : (
          <p className="text-[10px] text-gray-400 text-center py-4">No overtime recorded yet.</p>
        )}
      </div>

      {/* Present List Modal (kept same simple) */}
      {showPresentModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-900">Today's Attendance</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Workers who reported work</p>
              </div>
              <button
                onClick={() => setShowPresentModal(false)}
                className="p-2 bg-gray-50 text-gray-400 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-center text-gray-400 text-sm py-6">
              (This modal uses local shifts list. Your live pending requests are shown above.)
            </div>

            <button
              onClick={() => setShowPresentModal(false)}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            <h3 className="text-xl font-black text-gray-900">New Broadcast</h3>
            <textarea
              value={newAnnounce}
              onChange={(e) => setNewAnnounce(e.target.value)}
              placeholder="Type announcement..."
              className="w-full bg-gray-50 p-4 rounded-2xl text-sm h-32 focus:border-blue-500 outline-none"
            />
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setAnnouncePriority("low")}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg ${
                  announcePriority === "low" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"
                }`}
              >
                STANDARD
              </button>
              <button
                onClick={() => setAnnouncePriority("high")}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg ${
                  announcePriority === "high" ? "bg-white shadow-sm text-red-600" : "text-gray-400"
                }`}
              >
                PRIORITY
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowAnnounceModal(false)}
                className="w-full bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAnnouncement}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl"
              >
                Send Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
