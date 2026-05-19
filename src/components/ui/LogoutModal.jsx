import React from 'react';

const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="size-16 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mb-6 ring-4 ring-red-50 dark:ring-red-900/10">
            <span className="material-symbols-outlined text-3xl">logout</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-2">Sign Out</h3>
          <p className="text-sm font-bold text-slate-500 mb-8">Are you sure you want to end your session?</p>
          
          <div className="flex w-full gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
