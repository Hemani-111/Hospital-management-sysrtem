import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { searchService } from '../../services/searchService';
import { Link } from 'react-router-dom';
import LogoutModal from '../ui/LogoutModal';

const Header = ({ title, onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { session } = useAuthStore();
  const userRole = session?.user?.role;
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [results, setResults] = React.useState([]);
  const searchRef = React.useRef(null);

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 1) {
        const data = await searchService.globalSearch(searchTerm);
        setResults(data);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Close search results when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);

  const { logout } = useAuthStore();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

  return (
    <header className="h-16 glass-morphism-heavy flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 border-b border-white/20 dark:border-slate-800/30">
      <div className="flex items-center gap-2 md:gap-3 group px-1">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90 md:hidden"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="size-10 flex items-center justify-center md:hidden overflow-hidden">
          <img src="/logo.png" alt="HMS Logo" className="w-full h-full object-contain" />
        </div>
        
        {/* Breadcrumb / Title on Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Portal</span>
          <span className="material-symbols-outlined text-[9px] text-slate-300">chevron_right</span>
          <h2 className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight truncate max-w-[150px] lg:max-w-none">{title}</h2>
        </div>
      </div>

      {/* Global Search Bar (Only for Staff) */}
      {(userRole === 'admin' || userRole === 'doctor') && (
        <>
          <div className={`flex-1 max-w-xl mx-4 md:mx-8 relative ${isMobileSearchOpen ? 'fixed inset-x-0 top-0 h-16 bg-white dark:bg-slate-900 z-50 flex items-center px-4 animate-in slide-in-from-top duration-300' : 'hidden md:block'}`} ref={searchRef}>
            <div className="relative group w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
              <input 
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-primary/30 rounded-2xl pl-11 pr-4 py-2 text-sm font-bold outline-none transition-all placeholder:text-slate-400"
              />
              {isMobileSearchOpen && (
                <button 
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 md:hidden"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 mx-4 md:mx-0">
                <div className="p-2 max-h-[60vh] md:max-h-[400px] overflow-y-auto no-scrollbar">
                  {results.map((item, idx) => (
                    <Link 
                      key={idx}
                      to={item.link}
                      onClick={() => { setResults([]); setSearchTerm(''); setIsMobileSearchOpen(false); }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/5 group transition-all"
                    >
                      <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">
                        <span className="material-symbols-outlined text-xl">
                          {item.type === 'patient' ? 'person' : item.type === 'doctor' ? 'badge' : 'assignment'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1 capitalize">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.type} • #{item.id}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex items-center gap-1 md:gap-3">
        {(userRole === 'admin' || userRole === 'doctor') && (
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="p-1.5 text-slate-500 md:hidden"
          >
            <span className="material-symbols-outlined text-lg">search</span>
          </button>
        )}
        <button 
          onClick={toggleTheme}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined text-[18px] md:text-xl">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
        </button>
        <Link to="/profile" className="size-7 md:size-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:scale-110 transition-all overflow-hidden ring-2 ring-primary/20 shadow-sm">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.email || 'User'}&backgroundColor=e0f2fe`} 
            alt="Profile" 
            className="w-full h-full object-cover scale-150 transform object-top" 
          />
        </Link>
      </div>
      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onConfirm={logout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </header>
  );
};

export default Header;
