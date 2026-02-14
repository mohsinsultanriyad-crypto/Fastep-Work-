
import React, { useState, useMemo } from 'react';
import { User, Shift, Leave, SitePost, AdvanceRequest, Announcement } from '../types';
import WorkerDashboard from './WorkerDashboard';
import WorkerHistory from './WorkerHistory';
import SiteFeed from './SiteFeed';
import Profile from './Profile';
import { LayoutDashboard, History, Rss, User as UserIcon } from 'lucide-react';
import { useEffect } from 'react';
import { API_BASE_URL } from '../api';

interface WorkerAppProps {
  user: User;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leaves: Leave[];
  setLeaves: React.Dispatch<React.SetStateAction<Leave[]>>;
  posts: SitePost[];
  setPosts: React.Dispatch<React.SetStateAction<SitePost[]>>;
  advanceRequests: AdvanceRequest[];
  setAdvanceRequests: React.Dispatch<React.SetStateAction<AdvanceRequest[]>>;
  announcements: Announcement[];
  onLogout: () => void;
}

const WorkerApp: React.FC<WorkerAppProps> = ({ 
  user, shifts, setShifts, leaves, setLeaves, posts, setPosts, 
  advanceRequests, setAdvanceRequests, announcements, onLogout 
}) => {
  // Load worker-specific data from backend on mount (single source of truth)
  useEffect(() => {
    // Use auth from localStorage (stored as { userId, ... }) to fetch canonical history
    const raw = typeof window !== 'undefined' ? localStorage.getItem('fastep_auth') : null;
    let auth: any = null;
    try { auth = raw ? JSON.parse(raw) : null; } catch (e) { auth = null; }
    const userId = auth?.userId || (user as any)._id || (user as any).id;
    if (!userId) return;

    (async () => {
      try {
        // ===== LOAD SHIFTS =====
        const shiftsRes = await fetch(`${API_BASE_URL}/api/work/list-by-user/${userId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (shiftsRes.ok) {
          const data = await shiftsRes.json();
          // Ensure each shift has a `date` field; derive from startTime if missing
          const normalized = (Array.isArray(data) ? data : []).map((s: any) => ({
            _id: s._id || s.id,
            id: s._id || s.id,
            workerId: s.workerId,
            date: s.date || (s.startTime ? new Date(Number(s.startTime)).toISOString().slice(0,10) : ''),
            startTime: s.startTime,
            endTime: s.endTime,
            breakMinutes: s.breakMinutes || 0,
            notes: s.notes || '',
            status: s.status || 'pending',
            isApproved: !!s.isApproved,
            totalHours: s.totalHours || 0
          }));
          setShifts(normalized as any);
        } else {
          setShifts([]);
        }

        // ===== LOAD LEAVES =====
        const leavesRes = await fetch(`${API_BASE_URL}/api/leaves/list-by-user/${userId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (leavesRes.ok) {
          const leavesData = await leavesRes.json();
          const normalizedLeaves = (Array.isArray(leavesData) ? leavesData : []).map((l: any) => ({
            id: l._id || l.id,
            workerId: l.workerId,
            date: l.date,
            reason: l.reason || '',
            status: l.status as 'pending' | 'accepted' | 'rejected'
          }));
          console.log('[WorkerApp] Loaded leaves:', normalizedLeaves);
          setLeaves(normalizedLeaves);
        } else {
          setLeaves([]);
        }

        // ===== LOAD ADVANCES =====
        const advancesRes = await fetch(`${API_BASE_URL}/api/advances/list-by-user/${userId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (advancesRes.ok) {
          const advancesData = await advancesRes.json();
          const normalizedAdvances = (Array.isArray(advancesData) ? advancesData : []).map((a: any) => ({
            id: a._id || a.id,
            workerId: a.workerId,
            workerName: user.name,
            amount: a.amount,
            reason: a.reason || '',
            requestDate: a.requestDate,
            status: a.status as 'pending' | 'approved' | 'rejected' | 'scheduled',
            paymentDate: a.paymentDate
          }));
          console.log('[WorkerApp] Loaded advances:', normalizedAdvances);
          setAdvanceRequests(normalizedAdvances);
        } else {
          setAdvanceRequests([]);
        }
      } catch (e) {
        console.warn('[WorkerApp] Failed to load worker data:', e);
        setShifts([]);
        setLeaves([]);
        setAdvanceRequests([]);
      }
    })();
  }, [user, setShifts, setLeaves, setAdvanceRequests]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'feed' | 'profile'>('dashboard');

  const workerShifts = useMemo(() => shifts.filter(s => s.workerId === user.id), [shifts, user.id]);
  const workerLeaves = useMemo(() => leaves.filter(l => l.workerId === user.id), [leaves, user.id]);
  // Filter advances for the current worker
  const workerAdvances = useMemo(() => advanceRequests.filter(r => r.workerId === user.id), [advanceRequests, user.id]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'dashboard' && (
          <WorkerDashboard 
            user={user} 
            shifts={shifts} 
            setShifts={setShifts} 
            leaves={leaves}
            announcements={announcements}
          />
        )}
        {activeTab === 'history' && (
          <WorkerHistory 
            user={user} 
            shifts={workerShifts} 
            leaves={workerLeaves} 
            advanceRequests={workerAdvances} 
          />
        )}
        {activeTab === 'feed' && (
          <SiteFeed user={user} posts={posts} setPosts={setPosts} />
        )}
        {activeTab === 'profile' && (
          <Profile 
            user={user} 
            onLogout={onLogout} 
            leaves={leaves} 
            setLeaves={setLeaves} 
            advanceRequests={advanceRequests}
            setAdvanceRequests={setAdvanceRequests}
          />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-nav px-6 py-3 flex justify-between items-center">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}><LayoutDashboard size={22} /><span className="text-[10px] font-medium">Dashboard</span></button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-400'}`}><History size={22} /><span className="text-[10px] font-medium">History</span></button>
        <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'feed' ? 'text-blue-600' : 'text-gray-400'}`}><Rss size={22} /><span className="text-[10px] font-medium">Site Feed</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}><UserIcon size={22} /><span className="text-[10px] font-medium">Profile</span></button>
      </nav>
    </div>
  );
};

export default WorkerApp;
