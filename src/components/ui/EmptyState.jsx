import React from 'react';

const EmptyState = ({ 
  icon = 'search_off', 
  title = 'No results found', 
  description = 'We couldn\'t find what you\'re looking for. Try adjusting your filters or search terms.',
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in zoom-in-95 duration-500 ${className}`}>
      <div className="size-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-700 shadow-inner">
        <span className="material-symbols-outlined text-5xl text-slate-400 font-light">{icon}</span>
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium text-sm leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-8 px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
