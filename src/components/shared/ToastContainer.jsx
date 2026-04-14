import React from 'react';
import { useToastStore } from '../../store/toastStore';

const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-right-8 duration-300 ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toast.type === 'error' ? 'cancel' : 'check_circle'}
          </span>
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
