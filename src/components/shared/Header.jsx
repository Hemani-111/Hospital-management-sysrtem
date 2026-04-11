import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Header = ({ title, onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 md:hidden glass-morphism-heavy flex items-center justify-between px-6 sticky top-0 z-40 border-b border-white/20 dark:border-slate-800/30">
      <div className="flex items-center gap-3 group px-1">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-lg font-display font-black tracking-tighter text-primary dark:text-primary-light uppercase bg-primary/5 dark:bg-primary/20 px-3 py-1 rounded-lg">HMS</h1>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hover:rotate-45"
        >
          <span className="material-symbols-outlined text-xl">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
        </button>
        <div className="size-9 rounded-2xl bg-medical-gradient flex items-center justify-center text-white shadow-lg ring-2 ring-white dark:ring-slate-800">
          <span className="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
