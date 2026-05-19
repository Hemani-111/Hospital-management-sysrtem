import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '../store/toastStore';
import { employeeService } from '../services/employeeService';
import LogoutModal from '../components/ui/LogoutModal';

const DoctorProfile = () => {
  const queryClient = useQueryClient();
  const { session, logout } = useAuthStore();
  const userEmail = session?.user?.email;
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    specialization: '',
    qualification: '',
    experienceyears: 0
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['doctor-profile', userEmail],
    queryFn: () => employeeService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });
  const employeeId = profile?.employeeid;

  const { addToast } = useToastStore();

  const updateMutation = useMutation({
    mutationFn: (data) => employeeService.upsertDoctorProfile({
      employeeid: profile.employeeid,
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile', userEmail] });
      setIsModalOpen(false);
      addToast('Profile updated successfully!', 'success');
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'experienceyears' ? parseInt(value) || 0 : value 
    }));
  };

  const handleEditClick = () => {
    if (profile?.doctorprofile) {
      setFormData({
        specialization: profile.doctorprofile.specialization || '',
        qualification: profile.doctorprofile.qualification || '',
        experienceyears: profile.doctorprofile.experienceyears || 0
      });
    }
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <MainLayout title="My Profile" hidePadding={true}>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
        </div>
      </MainLayout>
    );
  }

  const doctorProfile = profile?.doctorprofile;
  const fullName = profile ? `Dr. ${profile.firstname} ${profile.lastname}` : 'Loading...';

  return (
    <MainLayout title="My Profile" hidePadding={true}>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
           <span className="material-symbols-outlined text-primary">badge</span> My Professional Profile
        </h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleEditClick}
            className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            Edit Portfolio
          </button>
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 bg-background-light dark:bg-slate-950 min-h-[calc(100vh-64px)]">
         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="h-40 bg-primary medical-pattern relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80"></div>
            </div>
            <div className="px-10 pb-12 relative">
               <div className="flex justify-between items-end mb-10">
                  <div className="size-40 rounded-3xl border-8 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-2xl -mt-20 overflow-hidden relative group">
                     <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.lastname}&backgroundColor=b6e3f4`} alt="Doctor Profile" />
                  </div>
                  <div className="flex gap-2 mb-2">
                     <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 border border-emerald-500/10">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span> Service Active
                     </span>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 leading-none tracking-tighter">{fullName}</h1>
                  <p className="text-primary font-black text-xl tracking-tight">{doctorProfile?.specialization || 'Consultant Specialist'}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <span className="material-symbols-outlined text-sm text-primary">location_on</span> Aarogya HMS • Dept of {profile?.department?.name || 'Medical Services'}
                  </p>
                </div>

               <div className="grid grid-cols-3 gap-6 mt-12 p-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <div className="text-center border-r border-slate-100 dark:border-slate-800">
                       <p className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{doctorProfile?.experienceyears || '0'}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Years Active</p>
                    </div>
                  <div className="text-center border-r border-slate-100 dark:border-slate-800">
                     <p className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">4.9</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Trust Score</p>
                  </div>
                  <div className="text-center">
                     <p className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">1.2k</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Consults</p>
                  </div>
               </div>

               <div className="mt-12 space-y-10">
                   <section>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-50 dark:border-slate-800 pb-3">Clinical Credentials</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-bold text-lg">
                        {doctorProfile?.qualification || 'Qualifications pending verification.'} specializing in {doctorProfile?.specialization?.toLowerCase() || 'advanced healthcare'}.
                        A core member of our clinical team since {profile?.joiningdate ? new Date(profile.joiningdate).toLocaleDateString() : 'recent appointment'}.
                      </p>
                   </section>
                  
                   <section>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-50 dark:border-slate-800 pb-3">Identity & Contact</h3>
                      <div className="grid grid-cols-2 gap-8">
                          <div className="flex items-center gap-4">
                             <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                                <span className="material-symbols-outlined text-2xl">call</span>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Line</p>
                                <p className="font-black text-slate-900 dark:text-slate-100">{profile?.phonenumber || 'Not listed'}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                                <span className="material-symbols-outlined text-2xl">fingerprint</span>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</p>
                                <p className="font-black text-slate-900 dark:text-slate-100">{profile?.employeenumber}</p>
                             </div>
                          </div>
                      </div>
                   </section>
               </div>
            </div>
         </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <form 
            onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(formData); }} 
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
           >
              <div className="p-10 border-b border-slate-50 dark:border-slate-800">
                 <div className="flex justify-between items-center mb-2">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Edit Portfolio</h2>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                       <span className="material-symbols-outlined">close</span>
                    </button>
                 </div>
                 <p className="text-slate-500 font-bold text-sm">Update your clinical credentials and specialization.</p>
              </div>

              <div className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Medical Specialization</label>
                    <input 
                      name="specialization"
                      required
                      placeholder="e.g. Cardiologist"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                      value={formData.specialization}
                      onChange={handleInputChange}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Academic Qualifications</label>
                    <textarea 
                      name="qualification"
                      required
                      placeholder="e.g. MBBS, MD (Cardiology)"
                      rows="3"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none" 
                      value={formData.qualification}
                      onChange={handleInputChange}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Years of Clinical Experience</label>
                    <input 
                      name="experienceyears"
                      type="number"
                      required
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                      value={formData.experienceyears}
                      onChange={handleInputChange}
                    />
                 </div>
              </div>

              <div className="p-10 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-white transition-all uppercase tracking-widest">Discard</button>
                 <button type="submit" disabled={updateMutation.isPending} className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all uppercase tracking-widest active:scale-95 disabled:opacity-50">
                    {updateMutation.isPending ? 'Saving...' : 'Commit Changes'}
                 </button>
              </div>
           </form>
        </div>
      )}
      <LogoutModal 
         isOpen={isLogoutModalOpen}
         onConfirm={logout}
         onCancel={() => setIsLogoutModalOpen(false)}
      />
    </MainLayout>
  );
};

export default DoctorProfile;
