import React from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import { appointmentService } from '../services/appointmentService';
import { caseService } from '../services/caseService';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const userEmail = session?.user?.email;

  const { data: profile } = useQuery({
    queryKey: ['doctor-profile', userEmail],
    queryFn: () => employeeService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });
  const employeeId = profile?.employeeid;

  const { data: todayAppts } = useQuery({
    queryKey: ['today-appts', profile?.employeeid],
    queryFn: () => appointmentService.getDoctorAppointments(profile.employeeid, new Date().toISOString().split('T')[0]),
    enabled: !!profile?.employeeid,
  });

  const { data: deptCases } = useQuery({
    queryKey: ['dept-cases', profile?.departmentid],
    queryFn: () => caseService.getAll({ departmentid: profile.departmentid, status: 'Open' }),
    enabled: !!profile?.departmentid,
  });

  const stats = [
    { title: "Today's Appointments", value: todayAppts?.length || '0', icon: 'event_available', color: 'blue', trend: 'Live' },
    { title: 'Open Cases (Dept)', value: deptCases?.length || '0', icon: 'folder_open', color: 'purple', trend: 'Urgent' },
    { title: 'Department', value: profile?.department?.name || 'N/A', icon: 'domain', color: 'green', trend: 'Assigned' },
  ];

  return (
    <MainLayout title="Doctor Dashboard" hidePadding={true}>
      <header className="hidden md:flex h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 items-center justify-between px-8 sticky top-0 z-40 glass-morphism">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 ring-1 ring-white/20">
             <span className="material-symbols-outlined text-2xl">medical_services</span>
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-slate-900 dark:text-slate-100 tracking-tight">Doctor Console</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{profile?.department?.name || 'Medical Staff'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none mb-1">Dr. {profile?.lastname || '...'}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{profile?.doctorprofile?.specialization || 'Consultant'}</p>
          </div>
          <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden shadow-inner">
            <img src={`https://ui-avatars.com/api/?name=Dr+${profile?.firstname}+${profile?.lastname}&background=random`} alt="Doctor" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
        <header className="relative w-full min-h-[160px] md:h-48 rounded-[2.5rem] overflow-hidden flex flex-col justify-center px-8 md:px-12 text-white bg-[#1f507a] shadow-2xl border border-white/10">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none translate-x-12 translate-y-4">
            <span className="material-symbols-outlined text-[180px] md:text-[240px]">shield_with_heart</span>
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-display font-black mb-2 tracking-tighter">Welcome back, Dr. {profile?.lastname || '...'}.</h1>
            <p className="text-sm md:text-xl font-medium opacity-90 max-w-lg leading-relaxed">
              {deptCases?.length || 0} urgent cases pending review in your department. System status is <span className="font-black underline decoration-accent decoration-4 underline-offset-4 tracking-widest uppercase">Optimal</span>.
            </p>
          </div>
        </header>

        {/* Priority Interventions */}
        <section className="bg-rose-50/50 dark:bg-rose-900/10 rounded-[2.5rem] p-8 border border-rose-100/50 dark:border-rose-800/20 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[120px]">notification_important</span>
          </div>
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="size-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-rose-500/20">
              <span className="material-symbols-outlined text-xl">emergency</span>
            </div>
            <div>
              <h3 className="font-black text-rose-900 dark:text-rose-100 uppercase tracking-[0.2em] text-[10px]">Critical Alerts</h3>
              <p className="text-xs font-bold text-rose-600/70">Immediate attention required</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 relative z-10">
            {(deptCases || []).slice(0, 1).map((c) => (
              <div key={c.caserequestid} className="glass-morphism p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between shadow-premium border border-white/40 dark:border-slate-800/40 group hover:border-rose-300 transition-all duration-500">
                <div className="flex items-center gap-5 mb-4 sm:mb-0">
                  <div className="size-14 rounded-2xl bg-rose-100/80 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 font-black text-sm ring-1 ring-rose-200 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    {c.patient?.firstname?.[0]}{c.patient?.lastname?.[0]}
                  </div>
                  <div>
                    <p className="text-xl font-display font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1.5">{c.patient?.firstname} {c.patient?.lastname}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em]">{c.casesummary?.slice(0, 50)}</p>
                  </div>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <button onClick={() => navigate('/cases')} className="flex-1 sm:flex-none px-8 py-3.5 text-[10px] font-black text-white bg-rose-500 rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 uppercase tracking-widest">Accept Triage</button>
                  <button className="flex-1 sm:flex-none px-6 py-3.5 text-[10px] font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest border border-slate-200/50 dark:border-slate-700">Refer</button>
                </div>
              </div>
            ))}
            {(!deptCases || deptCases.length === 0) && (
              <div className="text-center py-6 text-slate-400 font-medium italic">No emergency alerts for your department.</div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
          {stats.map((s) => <StatCard key={s.title} {...s} />)}
        </div>

        <section className="glass-morphism rounded-[2.5rem] border border-white/20 dark:border-slate-800/20 shadow-premium overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
            <h3 className="text-2xl font-display font-black flex items-center gap-3 tracking-tighter">
              <span className="size-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-2xl">event_note</span>
              </span>
              Clinical Registry
            </h3>
            <button onClick={() => navigate('/appointments')} className="text-primary text-[10px] font-black uppercase tracking-widest bg-primary/5 px-6 py-3 rounded-2xl hover:bg-primary/10 transition-all border border-primary/10">Full Calendar</button>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            {todayAppts?.length === 0 ? (
               <div className="p-10 text-center text-slate-400 font-bold">No appointments scheduled for today.</div>
            ) : (
              todayAppts?.map((item, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-7 rounded-3xl bg-white/40 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800/40 hover:shadow-premium group transition-all duration-500 cursor-pointer">
                  <div className="flex items-center gap-8 mb-6 md:mb-0">
                    <div className="text-center min-w-[80px]">
                      <p className="text-3xl font-display font-black text-primary leading-none">{item.starttime?.substring(0, 5)}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{parseInt(item.starttime) < 12 ? 'AM' : 'PM'}</p>
                    </div>
                    <div className="h-12 w-px bg-slate-200 dark:bg-slate-700/50 hidden md:block"></div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="font-black text-xl tracking-tight text-slate-900 dark:text-slate-100">{item.patient?.firstname} {item.patient?.lastname}</p>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                          item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                        }`}>{item.status}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-70">
                         <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg text-emerald-500">check_circle</span> {item.status}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigate('/cases')} className="w-full md:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all group-hover:shadow-premium hover:-translate-y-0.5 active:scale-95">Open Record</button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default DoctorDashboard;
