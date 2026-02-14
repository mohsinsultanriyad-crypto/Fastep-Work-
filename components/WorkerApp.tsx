
import React, { useState, useMemo } from 'react';
import { User, Shift, Leave, SitePost, AdvanceRequest, Announcement } from '../types';
import WorkerDashboard from './WorkerDashboard';
import WorkerHistory from './WorkerHistory';
import SiteFeed from './SiteFeed';
import Profile from './Profile';
import { LayoutDashboard, History, Rss, User as UserIcon } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'feed' | 'profile'>('dashboard');

  const workerShifts = useMemo(() => shifts.filter(s => s.workerId === user.id), [shifts, user.id]);
  const workerLeaves = useMemo(() => leaves.filter(l => l.workerId === user.id), [leaves, user.id]);
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
            advanceRequests={workerAdvances}
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
