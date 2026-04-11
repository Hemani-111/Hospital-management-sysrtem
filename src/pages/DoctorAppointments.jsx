import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import { appointmentService } from '../services/appointmentService';

const DoctorAppointments = () => {
  const { session } = useAuthStore();
  const userEmail = session?.user?.email;

  const { data: profile } = useQuery({
    queryKey: ['doctor-profile', userEmail],
    queryFn: () => employeeService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });
  const employeeId = profile?.employeeid;

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['doctor-schedule', profile?.employeeid],
    queryFn: () => appointmentService.getDoctorAppointments(profile.employeeid),
    enabled: !!profile?.employeeid,
  });

  const appointmentList = appointments || [];
  return (
    <MainLayout title="Appointments" hidePadding={true}>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Appointments</h2>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative text-slate-500">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-sm">event</span>
            Schedule
          </button>
        </div>
      </header>

      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Upcoming Schedule</h1>
               <p className="text-slate-500 mt-1">Review your patient consultations for the week.</p>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
               <button className="px-4 py-1.5 bg-white dark:bg-slate-900 shadow-sm rounded-md text-sm font-bold text-primary">Today</button>
               <button className="px-4 py-1.5 text-sm font-bold text-slate-500 hover:text-slate-700">Week</button>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden mt-6">
            <div className="space-y-4 relative">
               <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-800"></div>
               {isLoading ? (
                  <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Schedule...</div>
               ) : appointmentList.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No upcoming appointments found.</div>
               ) : (
                  appointmentList.map((item, idx) => (
                    <div key={idx} className="relative pl-12">
                       <div className="absolute left-5 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-white dark:ring-slate-900 z-10"></div>
                       <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between hover:shadow-md transition-all gap-4">
                          <div className="flex items-center gap-6 w-full md:w-auto">
                             <div className="text-center min-w-[70px]">
                                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.starttime?.substring(0, 5)}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase">{item.starttime?.includes('AM') || parseInt(item.starttime) < 12 ? 'AM' : 'PM'}</p>
                             </div>
                             <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{item.patient?.firstname} {item.patient?.lastname}</p>
                                   <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                      item.type === 'Inpatient' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                   }`}>{item.type}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                   <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">calendar_month</span> {item.appointmentdate}</span>
                                   <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span> {item.status}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex gap-3 w-full md:w-auto justify-end">
                             <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-bold hover:bg-white dark:hover:bg-slate-800 transition-all">Details</button>
                             <button className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">video_camera_front</span>
                                Join Call
                             </button>
                          </div>
                       </div>
                    </div>
                  ))
               )}
            </div>
         </div>
      </div>
    </MainLayout>
  );
};

export default DoctorAppointments;
