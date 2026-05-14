import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../App';
import { LayoutDashboard, Briefcase, User, ShieldCheck, Mail, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Sidebar() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  const isAdmin = role === 'admin';
  const isIndiaMartEmployee = user?.email?.endsWith('@indiamart.com');

  const menuItems = isAdmin ? [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Active Jobs', path: '/admin/jobs', icon: Briefcase },
  ] : [
    { label: 'Job Search', path: '/dashboard', icon: Briefcase },
    { label: 'My Profile', path: '/profile', icon: User },
  ];

  if (isIndiaMartEmployee && !isAdmin) {
    menuItems.push({ label: 'Employee Portal', path: '/portal', icon: ShieldCheck });
  }

  return (
    <aside className="w-64 bg-[#0a2540] flex flex-col border-r border-slate-800 text-slate-300 h-screen">
      <div className="p-6 flex items-center space-x-3 shrink-0">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 overflow-hidden">
          <img src="/imlogo.png" alt="Indiamart" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm tracking-tight leading-none">Indiamart's</span>
          <span className="text-red-500 font-black text-xs uppercase tracking-tighter">PeopleFlow AI</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold px-3 py-4">
          {isAdmin ? 'Recruitment' : 'Career'}
        </div>
        
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all group ${
                isActive ? 'bg-red-600 text-white' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-red-400'} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}

        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold px-3 py-4">
          Support
        </div>
        <Link to="/help" className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all group ${
          location.pathname === '/help' ? 'bg-red-600 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
        }`}>
           <Mail size={18} className={location.pathname === '/help' ? 'text-white' : 'text-slate-400 group-hover:text-red-400'} />
           <span className="text-sm font-medium text-left">Help Center</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800 shrink-0">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase overflow-hidden">
            {user?.email?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.email}</p>
            <p className="text-[10px] text-slate-500 truncate lowercase">{role}</p>
          </div>
          <button 
            onClick={signOut}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
