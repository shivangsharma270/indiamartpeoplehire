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
import AdminExitManagement from './pages/AdminExitManagement';
import AdminLdDashboard from './pages/AdminLdDashboard';
import ActiveJobs from './pages/ActiveJobs';
import JobDetails from './pages/JobDetails';
import Apply from './pages/Apply';
import Profile from './pages/Profile';
import ApplicantDetail from './pages/ApplicantDetail';
import HelpCenter from './pages/HelpCenter';
import InterviewPortal from './pages/InterviewPortal';
import EmployeePortal from './pages/EmployeePortal';
import EmployeeLd from './pages/EmployeeLd';
import AdminEmployeeTrack from './pages/AdminEmployeeTrack';

import { auth as firebaseAuth } from './lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

import EmployeeProfile from './pages/EmployeeProfile';

type UserRole = 'candidate' | 'admin' | 'employee' | null;

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (fUser) => {
      if (fUser) {
        // Normalize Firebase user to have 'id' property compatible with Supabase patterns
        const userWithId = Object.assign(fUser, { id: fUser.uid });
        setUser(userWithId);
        
        if (fUser.email === 'admin@teamstellarx.com') {
          setRole('admin');
        } else if (fUser.email?.toLowerCase().endsWith('@indiamart.com')) {
          setRole('employee');
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
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
          {user && (
            <Sidebar 
              isOpen={isSidebarOpen} 
              onClose={() => setIsSidebarOpen(false)} 
            />
          )}
          
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {user && (
              <Header 
                onMenuClick={() => setIsSidebarOpen(true)} 
              />
            )}
            
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/hire-pilot" element={user ? (role === 'admin' ? <Navigate to="/admin" /> : (role === 'employee' ? <Navigate to="/portal" /> : <Navigate to="/dashboard" />)) : <Login type="candidate" />} />
                <Route path="/admin-login" element={user ? <Navigate to="/admin" /> : <Login type="admin" />} />
                <Route path="/employee-login" element={user && role === 'employee' ? <Navigate to="/portal" /> : <Login type="employee" />} />
                <Route path="/login" element={
                  user 
                    ? (role === 'employee' ? <Navigate to="/portal" /> : (role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />))
                    : <Navigate to="/hire-pilot" />
                } />
                
                {/* Candidate Routes */}
                <Route path="/dashboard" element={user && role === 'candidate' ? <CandidateDashboard /> : <Navigate to="/login" />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/apply/:id" element={user && role === 'candidate' ? <Apply /> : <Navigate to="/login" />} />
                <Route path="/profile" element={user && role === 'candidate' ? <Profile /> : <Navigate to="/login" />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={user && role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
                <Route path="/admin/jobs" element={user && role === 'admin' ? <ActiveJobs /> : <Navigate to="/" />} />
                <Route path="/admin/applicant/:id" element={user && role === 'admin' ? <ApplicantDetail /> : <Navigate to="/" />} />
                <Route path="/admin/employee-track" element={user && role === 'admin' ? <AdminEmployeeTrack /> : <Navigate to="/" />} />
                <Route path="/admin/exit-management" element={user && role === 'admin' ? <AdminExitManagement /> : <Navigate to="/" />} />
                <Route path="/admin/ld-planner" element={user && role === 'admin' ? <AdminLdDashboard /> : <Navigate to="/" />} />
                
                {/* Employee / Team Routes */}
                <Route path="/portal" element={user && role === 'employee' ? <EmployeePortal /> : <Navigate to="/employee-login" />} />
                <Route path="/portal/ld" element={user && role === 'employee' ? <EmployeeLd /> : <Navigate to="/employee-login" />} />
                <Route path="/portal/profile" element={user && role === 'employee' ? <EmployeeProfile /> : <Navigate to="/employee-login" />} />

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
