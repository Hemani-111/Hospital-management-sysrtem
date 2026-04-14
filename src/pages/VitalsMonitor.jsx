import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '../services/assessmentService';
import { useToastStore } from '../store/toastStore';

const VitalsMonitor = () => {
  const { addToast } = useToastStore();
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['latest-vitals-monitor'],
    queryFn: () => assessmentService.getAll(), // Or a more specific query for latest per patient
    refetchInterval: 5000, // Poll every 5s for 'real-time' effect
  });

  const getStatus = (v) => {
    if (v.oxygenlevel < 90 || v.systolicbp > 160) return 'Critical';
    if (v.oxygenlevel < 94 || v.systolicbp > 140) return 'Warning';
    return 'Normal';
  };

  return (
    <MainLayout title="Vitals Monitor" hidePadding={true}>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">monitor_heart</span> Vitals Monitor
        </h2>
        <div className="flex items-center gap-4">
          <button onClick={() => addToast('Emergency protocols activated!', 'error')} className="bg-red-500 text-white px-6 py-2 rounded-xl text-sm font-black shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95">
            Emergency Alert
          </button>
        </div>
      </header>

      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 bg-background-light dark:bg-slate-950 min-h-[calc(100vh-64px)]">
         {isLoading ? (
            <div className="text-center py-20 text-slate-400 font-bold">Initializing Vital Streams...</div>
         ) : assessments.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold">No active monitoring data available.</div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {assessments.map((a, i) => {
                  const status = getStatus(a);
                  return (
                    <div key={a.assessmentid} className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 shadow-sm transition-all ${status === 'Critical' ? 'border-red-500 ring-2 ring-red-500 ring-offset-2 animate-pulse-slow' : status === 'Warning' ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 dark:border-slate-800'}`}>
                       <div className="flex justify-between items-center mb-6">
                          <div>
                             <h3 className="font-black text-xl text-slate-900 dark:text-slate-100 tracking-tighter">Room {a.patientid % 5 ? `A-${a.patientid}` : `B-${a.patientid}`}</h3>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mt-1">{a.patient?.firstname} {a.patient?.lastname}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'Critical' ? 'bg-red-100 text-red-700' : status === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{status}</span>
                       </div>
                       
                       <div className="space-y-3">
                          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                             <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-rose-500">favorite</span> HR</span>
                             <span className={`font-mono font-black text-lg ${a.pulserate > 100 ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>{a.pulserate} <span className="text-[10px] opacity-40">BPM</span></span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                             <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-blue-500">blood_pressure</span> BP</span>
                             <span className={`font-mono font-black text-lg ${status === 'Critical' ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>{a.systolicbp}/{a.diastolicbp}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                             <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-cyan-500">air</span> SpO2</span>
                             <span className={`font-mono font-black text-lg ${a.oxygenlevel < 95 ? 'text-amber-500' : 'text-slate-900 dark:text-slate-100'}`}>{a.oxygenlevel}%</span>
                          </div>
                       </div>

                       <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Last Update: {new Date(a.assessedon).toLocaleTimeString()}</p>
                       </div>
                    </div>
                  );
               })}
            </div>
         )}
      </div>
    </MainLayout>
  );
};

export default VitalsMonitor;
