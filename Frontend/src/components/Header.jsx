import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  ChevronDown,
  Globe,
  LogOut,
  CheckCircle,
  Clock
} from 'lucide-react';
import { fileUrl } from '../services/api';

const Header = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [lang, setLang] = React.useState('EN');
  const [user, setUser] = React.useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

  React.useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(updatedUser);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const displayName = user.name || user.adminName || 'Admin User';
  const profileImg = user.image || user.adminImage;
  const hasProfileImage = profileImg && profileImg !== 'admin-default.png';

  const NOTIFICATIONS = [
    { id: 1, title: 'New Order #352', time: '5m ago', icon: CheckCircle, color: 'text-emerald-500' },
    { id: 2, title: 'Customer query', time: '1h ago', icon: Clock, color: 'text-amber-500' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('customer_token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <header className="h-20 bg-[#0f172a] border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300">
      <div className="flex items-center space-x-6 flex-1">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            placeholder="Search analytics, orders, or users..."
            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-brand/10 focus:bg-white/10 focus:border-brand/40 transition-all font-sans"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-5">
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white relative transition-all"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand rounded-full border-2 border-[#0f172a]"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Notifications</p>
                </div>
                <div className="p-2">
                  {NOTIFICATIONS.map(n => (
                    <div key={n.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer group">
                      <div className={`w-9 h-9 rounded-lg bg-white/5 shadow-sm border border-white/5 flex items-center justify-center ${n.color}`}>
                        <n.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-brand transition-colors">{n.title}</p>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setLang(lang === 'EN' ? 'FR' : 'EN')}
            className="px-3 py-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all flex items-center space-x-2"
          >
            <Globe className="w-4.5 h-4.5" />
            <span className="text-[11px] font-black uppercase tracking-widest">{lang}</span>
          </button>
        </div>

        <div className="h-8 w-px bg-white/5 mx-1"></div>

        <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate('/settings')}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-white group-hover:text-brand transition-colors leading-tight">{displayName}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              {localStorage.getItem('role') === 'ADMIN' ? 'Super Admin' : 'Customer'}
            </p>
          </div>
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-white/10 overflow-hidden ring-4 ring-transparent group-hover:ring-brand/20 group-hover:border-brand/40 transition-all duration-300">
              {hasProfileImage
                ? <img src={fileUrl(profileImg)} alt="Profile" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                : <div className="w-full h-full flex items-center justify-center text-brand font-black bg-brand/5 uppercase text-lg">{displayName[0]}</div>
              }
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0f172a]"></div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>

        <button
          onClick={handleLogout}
          title="Logout"
          className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
