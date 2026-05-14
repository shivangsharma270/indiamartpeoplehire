import { useLocation } from 'react-router-dom';
import { useAuth } from '../../App';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { role } = useAuth();
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname === '/admin') return 'Talent Dashboard';
    if (location.pathname.startsWith('/admin/applicant')) return 'Candidate Analysis';
    if (location.pathname === '/dashboard') return 'Opportunity Search';
    if (location.pathname === '/profile') return 'My Professional Profile';
    if (location.pathname === '/apply') return 'Submit Application';
    return "Indiamart PeopleFlow";
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center space-x-3 md:space-x-4">
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg md:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base md:text-lg font-bold text-slate-800 truncate">{getTitle()}</h1>
        {role === 'admin' && (
          <span className="hidden sm:inline-block bg-red-50 text-red-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border border-red-100">
            Admin Portal
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Gemini status removed as per user request */}
      </div>
    </header>
  );
}
