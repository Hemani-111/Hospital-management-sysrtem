import React from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import { caseService } from '../services/caseService';
import { employeeService } from '../services/employeeService';
import { roomService } from '../services/roomService';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Fetch real stats
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: () => patientService.getAll() });
  const { data: cases } = useQuery({ queryKey: ['cases'], queryFn: () => caseService.getAll() });
  const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: () => employeeService.getAll() });
  const { data: roomStats } = useQuery({ 
    queryKey: ['rooms-stats'], 
    queryFn: () => roomService.getStats() 
  });

  const rooms = roomStats?.available || 0;

  const stats = [
    { title: 'Total Patients', value: patients?.length || '0', icon: 'person', color: 'blue', trend: (patients?.length || 0) > 100 ? '+12%' : 'Active' },
    { title: 'Active Cases', value: cases?.filter(c => c.status === 'Open').length || '0', icon: 'medical_services', color: 'purple', trend: 'Live' },
    { title: 'Available Rooms', value: rooms || '0', icon: 'bed', color: 'green', trend: '85%' },
    { title: 'Staff Count', value: staff?.length || '0', icon: 'groups_3', color: 'yellow', trend: '+2%' },
  ];

  return (
    <MainLayout title="Admin Dashboard" hidePadding={true}>
      <header className="hidden md:flex h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 items-center justify-between px-8 sticky top-0 z-40 glass-morphism">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 font-medium">Home</span>
          <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
          <span className="font-bold text-primary uppercase tracking-widest text-[10px]">Management Console</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hover:scale-110 active:scale-95 group">
            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">notifications</span>
            <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-1.5 pr-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none mb-1">Dr. Chen</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Super Admin</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 md:pt-10 space-y-10 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <section className="relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] bg-[#1f507a] text-white shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-8 border border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none"></div>
          <div className="absolute top-0 right-0 h-full w-1/2 opacity-10 pointer-events-none translate-x-1/4">
            <span className="material-symbols-outlined text-[300px]">shield_with_heart</span>
          </div>
          <div className="relative z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full border border-emerald-500/30 mb-8 text-[10px] font-black uppercase tracking-widest text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Live
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter leading-tight drop-shadow-sm">HMS Dashboard</h1>
            <p className="text-lg md:text-xl opacity-90 font-medium max-w-xl leading-relaxed">Infrastructure status: <span className="font-black underline decoration-accent decoration-4 underline-offset-4">OPTIMAL</span>. You have 42 medical staff members currently active across 8 wards.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
            <button onClick={() => navigate('/patients/create')} className="w-full sm:w-auto px-8 py-4 bg-white text-primary font-black rounded-2xl shadow-xl hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 group">
              <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">person_add</span> New Patient
            </button>
            <button onClick={() => navigate('/billing')} className="w-full sm:w-auto px-8 py-4 bg-primary-dark/30 backdrop-blur-md text-white font-black rounded-2xl shadow-xl hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all text-xs uppercase tracking-widest border border-white/20 flex items-center justify-center gap-2 group">
              <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">payments</span> Financials
            </button>
          </div>
        </section>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Table Area */}
          <section className="lg:col-span-2 grow flex flex-col glass-morphism rounded-[2.5rem] border border-white/20 dark:border-slate-800/20 shadow-premium overflow-hidden min-h-[500px]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                  <span className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                    <span className="material-symbols-outlined">clinical_notes</span>
                  </span>
                  Emergency Triage
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Active Cases Dashboard</p>
              </div>
              <button onClick={() => navigate('/patient_list')} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all border border-primary/10">View Full Registry</button>
            </div>
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[700px]">
                <thead className="sticky top-0 z-10 glass-morphism border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Identity</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Diagnosis Status</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Assigned MD</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {(cases || []).slice(0, 4).map((caseReq) => (
                    <tr key={caseReq.caserequestid} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`size-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs ring-4 ring-transparent group-hover:ring-blue-50 dark:group-hover:ring-blue-900/10 transition-all duration-500`}>
                            {caseReq.patient?.firstname?.[0]}{caseReq.patient?.lastname?.[0]}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight">{caseReq.patient?.firstname} {caseReq.patient?.lastname}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">ID: P-{caseReq.patientid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300 tracking-tight">{caseReq.casesummary?.slice(0, 30)}...</span>
                          <span className={`w-fit px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            caseReq.status === 'Open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                          }`}>{caseReq.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                           <span className="material-symbols-outlined text-lg">medical_services</span>
                           <span className="text-xs font-bold">{caseReq.employee?.firstname ? `Dr. ${caseReq.employee.firstname}` : 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <button onClick={() => navigate(`/cases/${caseReq.caserequestid}`)} className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm transition-all text-slate-400 hover:text-primary">
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!cases || cases.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-8 py-10 text-center text-slate-400 font-medium">No active cases found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Department Overview */}
          <div className="lg:col-span-1 flex flex-col glass-morphism-heavy rounded-[2.5rem] border border-white/30 dark:border-slate-800/30 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                <span className="size-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-amber-600 text-xl">domain</span>
                </span>
                Wards
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational</span>
            </div>
            <div className="p-6 flex-1 space-y-6 overflow-y-auto max-h-[500px] no-scrollbar">
              {[
                { name: 'Cardiology', icon: 'favorite', cases: 12, staff: 3, rooms: 4, color: 'rose' },
                { name: 'Neurology', icon: 'psychology', cases: 8, staff: 2, rooms: 2, color: 'purple' },
                { name: 'Gen Med', icon: 'stethoscope', cases: 22, staff: 5, rooms: 10, color: 'blue' },
                { name: 'Emergency', icon: 'emergency', cases: 6, staff: 8, rooms: 5, color: 'amber' },
              ].map((dept) => (
                <div key={dept.name} className="p-5 rounded-3xl bg-white/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800/50 hover:shadow-premium group transition-all duration-500 cursor-pointer">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`size-11 rounded-2xl bg-${dept.color}-100 dark:bg-${dept.color}-900/30 flex items-center justify-center text-${dept.color}-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner ring-1 ring-${dept.color}-200/50 dark:ring-${dept.color}-800/50`}>
                        <span className="material-symbols-outlined text-xl">{dept.icon}</span>
                      </div>
                      <span className="font-black text-slate-900 dark:text-slate-100 tracking-tight text-lg">{dept.name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-2xl text-center border border-slate-100/50 dark:border-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
                      <p className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-1">Staff</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300">{dept.staff}</p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-2xl text-center border border-slate-100/50 dark:border-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
                      <p className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-1">Cases</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300">{dept.cases}</p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-2xl text-center border border-slate-100/50 dark:border-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
                      <p className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-1">Beds</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300">{dept.rooms}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
               <button onClick={() => navigate('/manage_staff')} className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-primary/5 hover:text-primary transition-all border border-transparent hover:border-primary/10">Resource Management</button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
