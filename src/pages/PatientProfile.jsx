import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../components/ui/LogoutModal';

const PatientProfile = () => {
  const { session, logout } = useAuthStore();
  const navigate = useNavigate();
  const userEmail = session?.user?.email;
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['patient-profile', userEmail],
    queryFn: () => patientService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });
  const patientId = profile?.patientid;

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', patientId],
    queryFn: () => appointmentService.getPatientAppointments(patientId),
    enabled: !!patientId,
  });

  const nextAppt = appointments.find(a => a.status === 'Scheduled' || a.status === 'Confirmed');

  if (isLoading) {
    return (
      <MainLayout title="My Profile" hidePadding={true}>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
        </div>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout title="My Profile" hidePadding={true}>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-slate-500">
          <span className="material-symbols-outlined text-6xl text-red-300 mb-4">error</span>
          <h2 className="text-xl font-bold">Profile Not Found</h2>
          <p>Please check if your account is correctly linked to a patient record.</p>
        </div>
      </MainLayout>
    );
  }

  const fullName = `${profile.firstname} ${profile.lastname}`;
  const getAge = (dob) => {
    if (!dob) return 'N/A';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <>
      <MainLayout title="My Profile" hidePadding={true}>
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_circle</span> Patient Profile
          </h2>
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </header>

        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 bg-background-light dark:bg-slate-950 min-h-[calc(100vh-64px)]">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="h-40 bg-indigo-500 medical-pattern relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-primary/80"></div>
            </div>
            <div className="px-10 pb-12 relative">
              <div className="flex justify-between items-end mb-10">
                <div className="size-40 rounded-3xl border-8 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-2xl -mt-20 overflow-hidden relative group">
                  {profile.profilepicture ? (
                    <img className="w-full h-full object-cover" src={profile.profilepicture} alt="Patient" />
                  ) : (
                    <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.lastname}&backgroundColor=e0f2fe`} alt="Patient Avatar" />
                  )}
                </div>
                <div className="flex gap-2 mb-2">
                  <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 border border-indigo-500/10">
                    <span className="material-symbols-outlined text-sm">health_and_safety</span> Verified
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 leading-none tracking-tighter">{fullName}</h1>
                <p className="text-primary font-black text-xl tracking-tight">Patient ID: {profile.signupcode}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">calendar_month</span> Joined {new Date(profile.createdon).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-12 p-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <div className="text-center border-r border-slate-100 dark:border-slate-800">
                  <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{profile.bloodgroup || 'N/A'}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Blood</p>
                </div>
                <div className="text-center border-r border-slate-100 dark:border-slate-800">
                  <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{getAge(profile.dateofbirth)}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Age</p>
                </div>
                <div className="text-center border-r border-slate-100 dark:border-slate-800">
                  <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{profile.height || '--'} <span className="text-sm font-normal text-slate-400">cm</span></p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Height</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{profile.weight || '--'} <span className="text-sm font-normal text-slate-400">kg</span></p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Weight</p>
                </div>
              </div>

              <div className="mt-12 space-y-10">
                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-50 dark:border-slate-800 pb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="flex items-start gap-4">
                      <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                        <span className="material-symbols-outlined text-2xl">call</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                        <p className="font-black text-slate-900 dark:text-slate-100">{profile.phonenumber || 'Not listed'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="size-12 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center border border-red-100 dark:border-red-800">
                        <span className="material-symbols-outlined text-2xl">emergency</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact</p>
                        <p className="font-black text-slate-900 dark:text-slate-100">{profile.emergencycontact || 'Not listed'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 col-span-2">
                      <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex flex-shrink-0 items-center justify-center border border-slate-100 dark:border-slate-700">
                        <span className="material-symbols-outlined text-2xl">home</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {profile.addressline1} {profile.addressline2 && `, ${profile.addressline2}`} <br/>
                          {profile.city}, {profile.state} - {profile.postalcode} <br/>
                          {profile.country}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-6 border-b border-slate-50 dark:border-slate-800 pb-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Upcoming Appointments</h3>
                    <button onClick={() => navigate('/appointments')} className="text-primary text-[9px] font-black uppercase tracking-widest hover:underline">View All</button>
                  </div>
                  {nextAppt ? (
                    <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-between group hover:bg-primary/10 transition-all cursor-pointer" onClick={() => navigate('/appointments')}>
                      <div className="flex items-center gap-6">
                        <div className="size-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center justify-center border border-primary/10">
                          <span className="text-xs font-black text-primary">{new Date(nextAppt.appointmentdate).getDate()}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(nextAppt.appointmentdate).toLocaleString('default', { month: 'short' })}</span>
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-slate-100">Dr. {nextAppt.doctor?.firstname} {nextAppt.doctor?.lastname}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{nextAppt.starttime} • {nextAppt.doctor?.specialization}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-400 tracking-wide uppercase italic">No upcoming appointments scheduled</p>
                    </div>
                  )}
                </section>
                {profile.patientinsurance && profile.patientinsurance.length > 0 && (
                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-50 dark:border-slate-800 pb-3">Active Insurance Plans</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {profile.patientinsurance.map((pi) => (
                        <div key={pi.patientinsuranceid} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-white">{pi.insurance?.providername}</p>
                              <p className="text-xs font-bold text-primary">{pi.insurance?.planname}</p>
                            </div>
                            <span className="material-symbols-outlined text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg">verified_user</span>
                          </div>
                          <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            Policy: <span className="text-slate-900 dark:text-slate-300 font-bold">{pi.policynumber}</span> <br/>
                            Coverage: <span className="text-emerald-600 font-bold">{pi.coveragepercent}%</span> | Co-Pay: <span className="text-slate-900 dark:text-slate-300 font-bold">${pi.copay}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onConfirm={logout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
};

export default PatientProfile;
