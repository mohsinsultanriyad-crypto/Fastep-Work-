
import React, { useState, useEffect } from 'react';
import { User, Shift, Leave, SitePost, AdvanceRequest, Announcement } from './types';
import { MOCK_WORKERS, MOCK_ADMIN } from './constants';
import WorkerApp from './components/WorkerApp';
import AdminApp from './components/AdminApp';
import Login from './components/Login';

const App: React.FC = () => {
  // Hydrate auth from localStorage synchronously so refresh keeps user logged in
  const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('fastep_auth') : null;
  const initialUser = savedAuth ? (JSON.parse(savedAuth) as User) : null;
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [posts, setPosts] = useState<SitePost[]>([]);
  const [workers, setWorkers] = useState<User[]>(MOCK_WORKERS);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Persistence: Load
  useEffect(() => {
    const savedShifts = localStorage.getItem('fw_shifts');
    const savedLeaves = localStorage.getItem('fw_leaves');
    const savedPosts = localStorage.getItem('fw_posts');
    const savedWorkers = localStorage.getItem('fw_workers');
    const savedAdvance = localStorage.getItem('fw_advance');
    const savedAnnouncements = localStorage.getItem('fw_announcements');
    
    if (savedShifts) setShifts(JSON.parse(savedShifts));
    if (savedLeaves) setLeaves(JSON.parse(savedLeaves));
    if (savedPosts) setPosts(JSON.parse(savedPosts));
    if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
    if (savedAdvance) setAdvanceRequests(JSON.parse(savedAdvance));
    if (savedAnnouncements) setAnnouncements(JSON.parse(savedAnnouncements));
    
    setIsLoaded(true);
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('fw_shifts', JSON.stringify(shifts));
    localStorage.setItem('fw_leaves', JSON.stringify(leaves));
    localStorage.setItem('fw_posts', JSON.stringify(posts));
    localStorage.setItem('fw_workers', JSON.stringify(workers));
    localStorage.setItem('fw_advance', JSON.stringify(advanceRequests));
    localStorage.setItem('fw_announcements', JSON.stringify(announcements));
  }, [isLoaded, shifts, leaves, posts, workers, advanceRequests, announcements]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('fastep_auth', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to persist auth:', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('fastep_auth');
    } catch (e) {
      console.warn('Failed to clear auth:', e);
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} workers={workers} />;
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden flex flex-col">
      {currentUser.role === 'worker' ? (
        <WorkerApp 
          user={currentUser} 
          shifts={shifts} 
          setShifts={setShifts} 
          leaves={leaves} 
          setLeaves={setLeaves}
          posts={posts}
          setPosts={setPosts}
          advanceRequests={advanceRequests}
          setAdvanceRequests={setAdvanceRequests}
          announcements={announcements}
          onLogout={handleLogout}
        />
      ) : (
        <AdminApp 
          user={currentUser} 
          shifts={shifts} 
          setShifts={setShifts} 
          leaves={leaves} 
          setLeaves={setLeaves}
          workers={workers}
          setWorkers={setWorkers}
          posts={posts}
          setPosts={setPosts}
          advanceRequests={advanceRequests}
          setAdvanceRequests={setAdvanceRequests}
          announcements={announcements}
          setAnnouncements={setAnnouncements}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
