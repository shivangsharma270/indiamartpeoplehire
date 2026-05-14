import { Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { LogOut, User, LayoutDashboard, Briefcase, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, role, signOut } = useAuth();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200">
            <ShieldCheck size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">PeopleFlow</span>
        </Link>

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
                onClick={signOut}
                className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </>
          ) : (
            <Link 
              to="/login"
              className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-md active:scale-95"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
