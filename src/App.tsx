import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './lib/supabase';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import CandidateDashboard from './pages/CandidateDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ActiveJobs from './pages/ActiveJobs';
import JobDetails from './pages/JobDetails';
import Apply from './pages/Apply';
import Profile from './pages/Profile';
import ApplicantDetail from './pages/ApplicantDetail';
import HelpCenter from './pages/HelpCenter';
import InterviewPortal from './pages/InterviewPortal';

import { auth as firebaseAuth } from './lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

type UserRole = 'candidate' | 'admin' | null;

interface AuthContextType {
  user: any;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (fUser) => {
      if (fUser) {
        // Normalize Firebase user to have 'id' property compatible with Supabase patterns
        const userWithId = Object.assign(fUser, { id: fUser.uid });
        setUser(userWithId);
        
        if (fUser.email === 'admin@company.com' || fUser.email === 'shivang.sharma@indiamart.com') {
          setRole('admin');
        } else {
          setRole('candidate');
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(firebaseAuth);
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      <BrowserRouter>
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
          {user && <Sidebar />}
          
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {user && <Header />}
            
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/hire-pilot" element={user ? <Navigate to="/dashboard" /> : <Login type="candidate" />} />
                <Route path="/admin-login" element={user ? <Navigate to="/admin" /> : <Login type="admin" />} />
                <Route path="/login" element={<Navigate to="/hire-pilot" />} />
                
                {/* Candidate Routes */}
                <Route path="/dashboard" element={role === 'candidate' ? <CandidateDashboard /> : <Navigate to="/login" />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/apply/:id" element={role === 'candidate' ? <Apply /> : <Navigate to="/login" />} />
                <Route path="/profile" element={role === 'candidate' ? <Profile /> : <Navigate to="/login" />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
                <Route path="/admin/jobs" element={role === 'admin' ? <ActiveJobs /> : <Navigate to="/login" />} />
                <Route path="/admin/applicant/:id" element={role === 'admin' ? <ApplicantDetail /> : <Navigate to="/login" />} />
                
                {/* Generic Authenticated Route */}
                <Route path="/help" element={user ? <HelpCenter /> : <Navigate to="/login" />} />
                
                {/* Public Portal Route */}
                <Route path="/schedule/:appId" element={<InterviewPortal />} />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
          <Toaster position="top-right" richColors />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
