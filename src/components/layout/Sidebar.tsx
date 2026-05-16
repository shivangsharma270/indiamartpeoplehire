import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { LayoutDashboard, Briefcase, User, ShieldCheck, Mail, LogOut, X, Zap, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  let menuItems: any[] = [];
  if (role === 'admin') {
    menuItems = [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { label: 'Active Jobs', path: '/admin/jobs', icon: Briefcase },
      { label: 'Employee Track', path: '/admin/employee-track', icon: ShieldCheck },
      { label: 'L&D Planner', path: '/admin/ld-planner', icon: Zap },
      { label: 'Exit Interview Analysis', path: '/admin/exit-management', icon: LogOut },
    ];
  } else if (role === 'employee') {
    menuItems = [
      { label: 'Employee Hub', path: '/portal', icon: ShieldCheck },
      { label: 'Learning & Dev', path: '/portal/ld', icon: BookOpen },
      { label: 'My Profile', path: '/portal/profile', icon: User },
    ];
  } else {
    menuItems = [
      { label: 'Job Search', path: '/dashboard', icon: Briefcase },
      { label: 'My Profile', path: '/profile', icon: User },
    ];
  }

  const SidebarContent = (
    <aside className="w-64 bg-[#0a2540] flex flex-col border-r border-slate-800 text-slate-300 h-full">
      <div className="p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 overflow-hidden">
            <img src="/imlogo.png" alt="Indiamart" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm tracking-tight leading-none">Indiamart's</span>
            <span className="text-red-500 font-black text-xs uppercase tracking-tighter">PeopleFlow AI</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white md:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold px-3 py-4">
          {role === 'admin' ? 'Recruitment' : (role === 'employee' ? 'Internal' : 'Career')}
        </div>
        
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) onClose();
              }}
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
        <Link 
          to="/help" 
          onClick={() => {
            if (window.innerWidth < 768) onClose();
          }}
          className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all group ${
            location.pathname === '/help' ? 'bg-red-600 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'
          }`}
        >
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
            onClick={handleSignOut}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        {SidebarContent}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-64 h-full shadow-2xl"
            >
              {SidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
