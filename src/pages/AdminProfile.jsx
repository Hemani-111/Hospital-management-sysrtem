import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';

const AdminProfile = () => {
  const { session } = useAuthStore();
  const userEmail = session?.user?.email;

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['admin-profile', userEmail],
    queryFn: () => employeeService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });
  const employeeId = profile?.employeeid;

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
          <p>Please check if your account is correctly linked to an administrative record.</p>
        </div>
      </MainLayout>
    );
  }

  const fullName = `${profile.firstname} ${profile.lastname}`;

  return (
    <MainLayout title="My Profile" hidePadding={true}>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
           <span className="material-symbols-outlined text-rose-500">admin_panel_settings</span> Administrator Profile
        </h2>
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 bg-background-light dark:bg-slate-950 min-h-[calc(100vh-64px)]">
         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="h-40 bg-rose-500 medical-pattern relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-rose-700/80"></div>
            </div>
            <div className="px-10 pb-12 relative">
               <div className="flex justify-between items-end mb-10">
                  <div className="size-40 rounded-3xl border-8 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-2xl -mt-20 overflow-hidden relative group">
                     {profile.profilepicture ? (
                       <img className="w-full h-full object-cover" src={profile.profilepicture} alt="Admin" />
                     ) : (
                       <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.lastname}&backgroundColor=ffe4e6`} alt="Admin Avatar" />
                     )}
                  </div>
                  <div className="flex gap-2 mb-2">
                     <span className="px-4 py-1.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 border border-rose-500/10">
                        <span className="material-symbols-outlined text-sm">verified_user</span> System Admin
                     </span>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 leading-none tracking-tighter">{fullName}</h1>
                  <p className="text-rose-600 font-black text-xl tracking-tight">Hospital Administration</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <span className="material-symbols-outlined text-sm text-rose-500">location_on</span> City Hospital • {profile.department?.name || 'Executive Office'}
                  </p>
                </div>

               <div className="grid grid-cols-3 gap-4 mt-12 p-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div className="text-center border-r border-slate-100 dark:border-slate-800">
                     <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{profile.employeenumber}</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Employee ID</p>
                  </div>
                  <div className="text-center border-r border-slate-100 dark:border-slate-800">
                     <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{profile.shifttype || 'Morning'}</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Access Level</p>
                  </div>
                  <div className="text-center">
                     <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{profile.joiningdate ? new Date(profile.joiningdate).getFullYear() : 'N/A'}</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Joined Year</p>
                  </div>
               </div>

               <div className="mt-12 space-y-10">
                   <section>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-50 dark:border-slate-800 pb-3">Contact & Identity</h3>
                      <div className="grid grid-cols-2 gap-8">
                          <div className="flex items-start gap-4">
                             <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center border border-rose-100 dark:border-rose-800">
                                <span className="material-symbols-outlined text-2xl">call</span>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                <p className="font-black text-slate-900 dark:text-slate-100">{profile.phonenumber || 'Not listed'}</p>
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
               </div>
            </div>
         </div>
      </div>
    </MainLayout>
  );
};

export default AdminProfile;
