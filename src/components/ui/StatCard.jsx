import React from 'react';

const StatCard = ({ title, value, icon, color, trend }) => {
  return (
    <div className="glass-morphism rounded-[2.5rem] p-6 flex items-center gap-6 border border-white/40 dark:border-slate-800/40 shadow-premium hover:shadow-glow transition-all duration-500 hover:-translate-y-1 hover:bg-white/80 dark:hover:bg-slate-900/80 cursor-pointer group grow">
      <div className="relative">
        <div className={`size-14 rounded-2xl bg-${color}-100/80 dark:bg-${color}-900/30 flex items-center justify-center text-${color}-600 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ring-1 ring-${color}-200/50 dark:ring-${color}-800/50`}>
          <span className="material-symbols-outlined text-3xl transition-transform duration-500 group-hover:scale-110">{icon}</span>
        </div>
        <div className={`absolute -bottom-1 -right-1 size-4 bg-${color}-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
      </div>
      <div className="flex-1">
        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1 group-hover:translate-x-1 transition-transform duration-300">{title}</p>
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-display font-black text-slate-900 dark:text-slate-100 leading-none">{value}</h3>
          {trend && (
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100 dark:border-slate-800 transition-all group-hover:scale-105 ${
              trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 
              'bg-slate-100/50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400'
            }`}>
              {trend.startsWith('+') && <span className="material-symbols-outlined text-[12px] animate-pulse">trending_up</span>}
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
