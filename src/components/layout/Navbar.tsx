import { Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { LogOut, User, LayoutDashboard, Briefcase, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, role, signOut } = useAuth();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              {role === 'admin' ? (
                <Link to="/admin" className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors">
                  <LayoutDashboard size={20} />
                  <span className="font-medium">Admin Panel</span>
                </Link>
              ) : (
                <>
                  <Link to="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors">
                    <Briefcase size={20} />
                    <span className="font-medium">Find Jobs</span>
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors">
                    <User size={20} />
                    <span className="font-medium">My Profile</span>
                  </Link>
                </>
              )}
              
              <button 
                onClick={async () => {
                  await signOut();
                  window.location.href = '/';
                }}
                className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
