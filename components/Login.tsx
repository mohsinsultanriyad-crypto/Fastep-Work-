
import React, { useState } from 'react';
import { User } from '../types';
import { MOCK_ADMIN, APP_NAME } from '../constants';
import { API_BASE_URL } from '../api';

interface LoginProps {
  onLogin: (user: User) => void;
  workers: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, workers }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isAdmin) {
      // Check admin credentials from constants (User requested FSA101 / password123)
      if (userId === MOCK_ADMIN.email && password === (MOCK_ADMIN.password || 'password123')) {
        onLogin(MOCK_ADMIN);
      } else {
        setError('Invalid Admin credentials');
      }
      setIsLoading(false);
    } else {
      // Worker login - call backend API
      try {
        console.log("[Login] Authenticating worker:", userId);
        
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerId: userId, password })
        });

        const data = await res.json();

        if (!res.ok) {
          console.warn("[Login] Login failed:", data);
          setError(data.message || 'Invalid credentials');
          setIsLoading(false);
          return;
        }

        console.log("[Login] Success for workerId:", userId);
        // Store token in localStorage
        localStorage.setItem('fastep_auth', JSON.stringify({
          token: data.token,
          user: data.user,
          timestamp: Date.now()
        }));

        onLogin(data.user);
      } catch (err) {
        console.error("[Login] Error:", err);
        setError('Login failed. Please try again.');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-blue-600 tracking-tight">{APP_NAME}</h1>
          <p className="text-gray-500 text-sm mt-2">Workforce Management System</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button 
              onClick={() => { setIsAdmin(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isAdmin ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              Worker
            </button>
            <button 
              onClick={() => { setIsAdmin(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isAdmin ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">
                {isAdmin ? 'Admin ID' : 'Worker ID'}
              </label>
              <input 
                type="text" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={isAdmin ? "FSA101" : "FS1001"}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
              />
            </div>

            {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all mt-4 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
        
        <p className="text-center text-gray-400 text-xs mt-8">
          © 2024 FASTEP WORK. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
