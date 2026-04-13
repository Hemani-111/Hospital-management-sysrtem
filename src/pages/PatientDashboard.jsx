import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/ui/StatCard';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { patientPortalService } from '../services/patientPortalService';
import { appointmentService } from '../services/appointmentService';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const userEmail = session?.user?.email;

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-profile', userEmail],
    queryFn: () => patientPortalService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['patient-cases', patient?.patientid],
    queryFn: () => patientPortalService.getCases(patient.patientid),
    enabled: !!patient?.patientid,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', patient?.patientid],
    queryFn: () => appointmentService.getPatientAppointments(patient.patientid),
    enabled: !!patient?.patientid,
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['patient-bills', patient?.patientid],
    queryFn: () => patientPortalService.getBills(patient.patientid),
    enabled: !!patient?.patientid,
  });

  const upcomingAppts = (appointments || []).filter(a => a.status === 'Scheduled' || a.status === 'Confirmed');
  const activeCases   = (cases || []).filter(c => c.status !== 'Resolved' && c.status !== 'Closed');
  const pendingBills  = (bills || []).filter(b => b.paymentstatus === 'Pending' || b.paymentstatus === 'Partial');
  const pendingAmount = pendingBills.reduce((s, b) => s + parseFloat(b.totalamount || 0), 0);

  const accountStats = [
    { title: 'Appointments', value: String(upcomingAppts.length), icon: 'event',          color: 'blue',   trend: upcomingAppts[0]?.appointmentdate || 'None', path: '/appointments' },
    { title: 'Active Cases', value: String(activeCases.length),  icon: 'clinical_notes',  color: 'purple', trend: 'Ongoing' },
    { title: 'Pending Bills',value: `₹${pendingAmount.toLocaleString()}`, icon: 'payments', color: 'yellow', trend: 'Pay Now' },
  ];

  // Get all lab reports from cases
  const labReports = cases.flatMap(c => c.labreport || []).slice(0, 3);

  if (isLoading) {
    return (
      <MainLayout title="Patient Dashboard" hidePadding={true}>
        <div className="flex items-center justify-center min-h-screen">
          <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Patient Dashboard" hidePadding={true}>
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Hero Banner */}
        <header className="relative w-full min-h-[160px] md:h-48 rounded-[2.5rem] overflow-hidden flex flex-col justify-center px-8 md:px-12 text-white bg-[#1f507a] shadow-2xl border border-white/10">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none translate-x-12 translate-y-4">
            <span className="material-symbols-outlined text-[180px] md:text-[240px]">shield_with_heart</span>
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-display font-black mb-2 tracking-tighter">
              Welcome, {patient?.firstname || 'Patient'}.
            </h1>
            <p className="text-sm md:text-xl font-medium opacity-90 max-w-lg leading-relaxed">
              You have <span className="font-black underline decoration-accent decoration-4 underline-offset-4 tracking-widest">{activeCases.length} active case(s)</span> and {upcomingAppts.length} upcoming appointment(s).
            </p>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
          {accountStats.map((s) => <StatCard key={s.title} {...s} />)}
        </div>

        {/* Active Case Progress */}
        {activeCases.length > 0 && (
          <section className="glass-morphism rounded-[2.5rem] border border-white/20 dark:border-slate-800/20 shadow-premium p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[120px]">clinical_notes</span>
            </div>
            <h2 className="text-2xl font-display font-black mb-10 flex items-center gap-4 tracking-tighter">
              <span className="size-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-2xl">analytics</span>
              </span>
              Active Recovery Progress
            </h2>

            {activeCases.slice(0, 1).map(c => {
              const hasDiagnosis    = (c.diagnosis || []).length > 0;
              const hasPrescription = (c.prescription || []).length > 0;
              const hasLabReport    = (c.labreport || []).length > 0;
              const consulted       = true;

              const steps = [
                { icon: 'check',             label: 'Registration',  active: true },
                { icon: 'check',             label: 'Consultation',  active: consulted },
                { icon: 'lab_research',      label: 'Lab Reports',   active: hasLabReport, current: !hasLabReport },
                { icon: 'assignment',        label: 'Diagnosis',     active: hasDiagnosis, current: !hasDiagnosis && hasLabReport },
                { icon: 'medical_information', label: 'Prescription', active: hasPrescription, current: !hasPrescription && hasDiagnosis },
              ];

              return (
                <div key={c.caserequestid}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div>
                      <h3 className="text-xl font-display font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-2">
                        Case #{c.caserequestid} — {c.department?.name}
                      </h3>
                      <p className="text-slate-500 font-black flex items-center gap-2 uppercase tracking-[0.2em] text-[10px] opacity-70">
                        <span className="material-symbols-outlined text-sm text-primary">person</span>
                        Attending: Dr. {c.employee?.firstname} {c.employee?.lastname} • {c.employee?.doctorprofile?.specialization}
                      </p>
                    </div>
                    <div className={`px-6 py-3 text-[10px] font-black rounded-2xl border shadow-sm uppercase tracking-widest ${
                      c.status === 'Resolved' ? 'bg-green-100 text-green-700 border-green-500/10' :
                      c.status === 'InProgress' ? 'bg-blue-100 text-blue-700 border-blue-500/10' :
                      'bg-emerald-100 text-emerald-700 border-emerald-500/10'
                    }`}>Status: {c.status}</div>
                  </div>

                  <div className="overflow-x-auto pb-6 no-scrollbar">
                    <div className="relative flex justify-between items-center w-full min-w-[700px] px-12 bg-white/50 dark:bg-slate-800/20 p-12 rounded-[2rem] border border-slate-100 dark:border-slate-800/40">
                      <div className="absolute left-20 right-20 top-1/2 -translate-y-1/2 h-2 bg-slate-100 dark:bg-slate-800/50 -z-0 rounded-full">
                        <div className={`h-full bg-primary rounded-full shadow-glow`} style={{ width: `${(steps.filter(s => s.active).length / steps.length) * 100}%` }}></div>
                      </div>
                      {steps.map((step, i) => (
                        <div key={i} className="flex flex-col items-center gap-4 relative z-10">
                          <div className={`size-14 md:size-16 rounded-[1.25rem] flex items-center justify-center transition-all duration-700 shadow-premium ${
                            step.active ? 'bg-primary text-white scale-110 ring-8 ring-white dark:ring-slate-900' :
                            step.current ? 'bg-medical-gradient text-white ring-8 ring-primary/10 animate-pulse scale-125' :
                            'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'
                          }`}>
                            <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step.active || step.current ? 'text-primary' : 'text-slate-400'}`}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Lab Notifications */}
        {labReports.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-display font-black flex items-center gap-4 tracking-tighter">
                <span className="size-11 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 font-black shadow-inner">!</span>
                Recent Lab Reports
              </h2>
              <button onClick={() => navigate('/patient/cases')} className="text-primary text-[10px] font-black uppercase tracking-widest bg-primary/5 px-6 py-3 rounded-2xl hover:bg-primary/10 transition-all border border-primary/10">Full Archive</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {labReports.map((res, i) => (
                <div key={i} className="group glass-morphism p-8 rounded-[2rem] border border-white/40 dark:border-slate-800/40 shadow-premium hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500 opacity-80"></div>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="size-14 bg-rose-50 dark:bg-rose-900/40 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner">
                      <span className="material-symbols-outlined text-3xl">biotech</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-rose-100 text-rose-700 rounded-full">{res.status || 'Done'}</span>
                  </div>
                  <h4 className="font-display font-black text-2xl text-slate-900 dark:text-slate-100 mb-2 tracking-tight">{res.labtest?.testname || 'Lab Test'}</h4>
                  <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed">Result: {res.resultvalue} {res.labtest?.unit}</p>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-8">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{res.orderedon ? new Date(res.orderedon).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default PatientDashboard;
