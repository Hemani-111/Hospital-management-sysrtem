import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { searchService } from '../../services/searchService';
import { Link } from 'react-router-dom';

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

  return (
    <header className="h-16 glass-morphism-heavy flex items-center justify-between px-6 sticky top-0 z-40 border-b border-white/20 dark:border-slate-800/30">
      <div className="flex items-center gap-3 group px-1">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90 md:hidden"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-lg font-display font-black tracking-tighter text-primary dark:text-primary-light uppercase bg-primary/5 dark:bg-primary/20 px-3 py-1 rounded-lg md:hidden">HMS</h1>
        
        {/* Breadcrumb / Title on Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Portal</span>
          <span className="material-symbols-outlined text-[12px] text-slate-300">chevron_right</span>
          <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{title}</h2>
        </div>
      </div>

      {/* Global Search Bar (Only for Staff) */}
      {(userRole === 'admin' || userRole === 'doctor') && (
        <div className="flex-1 max-w-xl mx-8 relative hidden md:block" ref={searchRef}>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text"
              placeholder="Search patients, doctors, or cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-primary/30 rounded-2xl pl-12 pr-4 py-2 text-sm font-bold outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>

          {/* Search Results Dropdown */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-2 max-h-[400px] overflow-y-auto no-scrollbar">
                {results.map((item, idx) => (
                  <Link 
                    key={idx}
                    to={item.link}
                    onClick={() => { setResults([]); setSearchTerm(''); }}
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
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Press ESC to dismiss</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hover:rotate-45"
        >
          <span className="material-symbols-outlined text-xl">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
        </button>
        <div className="size-9 rounded-2xl bg-medical-gradient flex items-center justify-center text-white shadow-lg ring-2 ring-white dark:ring-slate-800 cursor-pointer hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
