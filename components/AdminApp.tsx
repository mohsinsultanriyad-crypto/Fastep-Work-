
import React, { useState } from 'react';
import { User, Shift, Leave, SitePost, AdvanceRequest, Announcement } from '../types';
import AdminDashboard from './AdminDashboard';
import AdminWorkerList from './AdminWorkerList';
import SiteFeed from './SiteFeed';
import Profile from './Profile';
import { LayoutDashboard, Users, Rss, User as UserIcon } from 'lucide-react';

interface AdminAppProps {
  user: User;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leaves: Leave[];
  setLeaves: React.Dispatch<React.SetStateAction<Leave[]>>;
  workers: User[];
  setWorkers: React.Dispatch<React.SetStateAction<User[]>>;
  posts: SitePost[];
  setPosts: React.Dispatch<React.SetStateAction<SitePost[]>>;
  advanceRequests: AdvanceRequest[];
  setAdvanceRequests: React.Dispatch<React.SetStateAction<AdvanceRequest[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  onLogout: () => void;
}

const AdminApp: React.FC<AdminAppProps> = ({ 
  user, shifts, setShifts, leaves, setLeaves, workers, setWorkers, posts, setPosts, 
  advanceRequests, setAdvanceRequests, announcements, setAnnouncements, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workers' | 'feed' | 'profile'>('dashboard');

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'dashboard' && (
          <AdminDashboard 
            shifts={shifts} 
            setShifts={setShifts} 
            leaves={leaves} 
            setLeaves={setLeaves} 
            workers={workers}
            advanceRequests={advanceRequests}
            setAdvanceRequests={setAdvanceRequests}
            announcements={announcements}
            setAnnouncements={setAnnouncements}
          />
        )}
        {activeTab === 'workers' && (
          <AdminWorkerList 
            workers={workers} 
            setWorkers={setWorkers}
            shifts={shifts} 
            leaves={leaves} 
            advanceRequests={advanceRequests}
          />
        )}
        {activeTab === 'feed' && (
          <SiteFeed user={user} posts={posts} setPosts={setPosts} />
        )}
        {activeTab === 'profile' && (
          <Profile user={user} onLogout={onLogout} />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-nav px-6 py-3 flex justify-between items-center">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <LayoutDashboard size={22} />
          <span className="text-[10px] font-medium">Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab('workers')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'workers' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Users size={22} />
          <span className="text-[10px] font-medium">Workers</span>
        </button>
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'feed' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Rss size={22} />
          <span className="text-[10px] font-medium">Feed</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <UserIcon size={22} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default AdminApp;
