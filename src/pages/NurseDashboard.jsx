import React from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import { assessmentService } from '../services/assessmentService';
import { caseService } from '../services/caseService';

const NurseDashboard = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const userEmail = session?.user?.email;

  const { data: profile } = useQuery({
    queryKey: ['nurse-profile', userEmail],
    queryFn: () => employeeService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });
  const employeeId = profile?.employeeid;

  const { data: openCases } = useQuery({
    queryKey: ['open-cases-dept', profile?.departmentid],
    queryFn: () => caseService.getAll({ assigneddeptid: profile.departmentid, status: 'Open' }),
    enabled: !!profile?.departmentid,
  });

  const { data: recentAssessments } = useQuery({
    queryKey: ['recent-assessments'],
    queryFn: () => assessmentService.getAll(),
  });

  const { data: labQueue } = useQuery({
    queryKey: ['lab-queue-dept', profile?.departmentid],
    queryFn: () => caseService.getLabQueue({ assigneddeptid: profile.departmentid }),
    enabled: !!profile?.departmentid,
    refetchInterval: 2000
  });

  // Get last 2 assessments for the pending triage section
  const pendingTriageList = (recentAssessments || []).slice(0, 2);

  const stats = [
    { title: 'Patients to Assess', value: String(openCases?.length || 0), icon: 'stethoscope', color: 'blue', trend: 'Open Cases' },
    { title: 'Pending Labs', value: String(labQueue?.length || 0), icon: 'science', color: 'indigo', trend: 'To Process' },
    { title: 'Dept', value: profile?.department?.name || '...', icon: 'domain', color: 'green', trend: 'Your Ward' },
  ];

  return (
    <MainLayout title="Nurse Dashboard" hidePadding={true}>
      <header className="hidden md:flex h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 items-center justify-between px-8 sticky top-0 z-40 glass-morphism">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <span className="material-symbols-outlined text-2xl">healing</span>
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-slate-900 dark:text-slate-100 tracking-tight">Nursing Station</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{profile?.department?.name || 'Your Ward'} • Shift active</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none mb-1">
              {profile ? `${profile.firstname} ${profile.lastname}` : 'Loading...'}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{profile?.employeetype || 'Nurse'}</p>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 overflow-hidden shadow-inner">
            <img src={`https://ui-avatars.com/api/?name=${profile?.firstname}+${profile?.lastname}&background=random`} alt="Nurse" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
        <header className="relative w-full min-h-[160px] md:h-48 rounded-[2.5rem] overflow-hidden flex flex-col justify-center px-8 md:px-12 text-white bg-[#1f507a] shadow-2xl border border-white/10">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none translate-x-12 translate-y-4">
            <span className="material-symbols-outlined text-[180px] md:text-[240px]">shield_with_heart</span>
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-display font-black mb-2 tracking-tighter">
              Good day, {profile?.firstname || 'Nurse'}.
            </h1>
            <p className="text-sm md:text-xl font-medium opacity-90 max-w-lg leading-relaxed">
              {openCases?.length || 0} cases pending triage in your department. System status:{' '}
              <span className="font-black underline decoration-accent decoration-4 underline-offset-4 tracking-widest uppercase">Safe</span>.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
          {stats.map((s) => <StatCard key={s.title} {...s} />)}
        </div>

        {/* Quick Actions Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => navigate('/assess')}
            className="group p-8 rounded-[2.5rem] bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-9xl">stethoscope</span>
            </div>
            <h4 className="text-2xl font-black mb-1">Triage Assessment</h4>
            <p className="text-white/80 text-sm font-medium">Capture vitals and screen new patients.</p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest">
              Start Now <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </div>

          <div 
            onClick={() => navigate('/nurse-admissions')}
            className="group p-8 rounded-[2.5rem] bg-[#1f507a] text-white shadow-xl shadow-[#1f507a]/20 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-9xl">bed</span>
            </div>
            <h4 className="text-2xl font-black mb-1">In-patient Admissions</h4>
            <p className="text-white/80 text-sm font-medium">Assign rooms and wards to accepted cases.</p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest">
              Manage Wards <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </div>
        </section>

        <section className="glass-morphism rounded-[2.5rem] border border-white/20 dark:border-slate-800/20 shadow-premium overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
            <h3 className="text-2xl font-display font-black flex items-center gap-3 tracking-tighter">
              <span className="size-11 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                <span className="material-symbols-outlined text-2xl">science</span>
              </span>
              Pending Lab Tests — Results Needed
            </h3>
            <button onClick={() => navigate('/lab-results')} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest bg-indigo-500/5 px-6 py-3 rounded-2xl hover:bg-indigo-500/10 transition-all border border-indigo-500/10">
              Full Lab Queue
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {(labQueue || []).length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-bold">No pending lab tests for your department.</div>
            ) : (
              (labQueue || []).slice(0, 5).map((test) => (
                <div key={test.reportid} className="flex flex-col md:flex-row md:items-center justify-between p-7 rounded-3xl bg-white/40 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800/40 hover:shadow-premium group transition-all duration-500 cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                  <div className="flex items-center gap-8 mb-6 md:mb-0">
                    <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-inner border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-all duration-500">
                      <span className="material-symbols-outlined text-2xl text-indigo-500">experiment</span>
                    </div>
                    <div>
                      <h4 className="font-black text-xl tracking-tight text-slate-900 dark:text-slate-100 leading-none mb-2">
                        {test.firstname} {test.lastname} — <span className="text-indigo-500">{test.testname}</span>
                      </h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">
                        Report #{test.reportid} • Case #{test.caserequestid}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ordered On</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(test.orderedon).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/cases/${test.caserequestid}`)}
                      className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white border border-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Enter Report Results
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="glass-morphism rounded-[2.5rem] border border-white/20 dark:border-slate-800/20 shadow-premium overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
            <h3 className="text-2xl font-display font-black flex items-center gap-3 tracking-tighter">
              <span className="size-11 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                <span className="material-symbols-outlined text-2xl">assignment_turned_in</span>
              </span>
              Open Cases — Needs Triage
            </h3>
            <button onClick={() => navigate('/assessment-history')} className="text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 px-6 py-3 rounded-2xl hover:bg-emerald-500/10 transition-all border border-emerald-500/10">
              History Registry
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {(openCases || []).length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-bold">No open cases requiring triage.</div>
            ) : (
              (openCases || []).slice(0, 5).map((cs) => (
                <div key={cs.caserequestid} className="flex flex-col md:flex-row md:items-center justify-between p-7 rounded-3xl bg-white/40 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800/40 hover:shadow-premium group transition-all duration-500 cursor-pointer relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${cs.urgency === 'Emergency' ? 'bg-rose-500' : cs.urgency === 'Urgent' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                  <div className="flex items-center gap-8 mb-6 md:mb-0">
                    <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-inner border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-all duration-500">
                      <span className="text-xl font-black text-slate-600">{cs.patient?.firstname?.[0]}{cs.patient?.lastname?.[0]}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-xl tracking-tight text-slate-900 dark:text-slate-100 leading-none mb-2">
                        {cs.patient?.firstname} {cs.patient?.lastname}
                      </h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">
                        Case #{cs.caserequestid} • {cs.department?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                      cs.urgency === 'Emergency' ? 'bg-rose-100 text-rose-700 animate-pulse' :
                      cs.urgency === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>{cs.urgency}</span>
                    <button
                      onClick={() => navigate('/assess')}
                      className="flex-1 md:flex-none px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm"
                    >
                      Initialize Assessment
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default NurseDashboard;
