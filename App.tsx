
import React, { useState, useEffect } from 'react';
import { User, Shift, Leave, SitePost, AdvanceRequest, Announcement } from './types';
import { MOCK_WORKERS, MOCK_ADMIN } from './constants';
import WorkerApp from './components/WorkerApp';
import AdminApp from './components/AdminApp';
import Login from './components/Login';

const App: React.FC = () => {
  // Hydrate auth from localStorage synchronously so refresh keeps user logged in
  const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('fastep_auth') : null;
  let initialUser: User | null = null;
  if (savedAuth) {
    try {
      const parsed = JSON.parse(savedAuth);
      initialUser = parsed?.user || parsed || null;
    } catch (e) {
      initialUser = null;
    }
  }
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [posts, setPosts] = useState<SitePost[]>([]);
  const [workers, setWorkers] = useState<User[]>(MOCK_WORKERS);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // NOTE: Work-related data (shifts/leaves/posts/advance/announcements) is
  // always loaded from backend APIs at runtime. We intentionally do NOT
  // persist these in localStorage to keep a single source of truth.
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
      const authObj = {
        user,
        userId: (user as any)?._id || (user as any)?.id,
        workerId: (user as any)?.workerId || null,
        role: (user as any)?.role || null,
        timestamp: Date.now()
      };
      localStorage.setItem('fastep_auth', JSON.stringify(authObj));
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
