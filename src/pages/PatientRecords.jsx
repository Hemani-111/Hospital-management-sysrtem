import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../services/patientService';

const PatientRecords = () => {
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patient-records-full'],
    queryFn: () => patientService.getAll(),
  });

  return (
    <MainLayout title="Patient Records" hidePadding={true}>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
           <span className="material-symbols-outlined text-primary">analytics</span> Master Patient Records
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary w-64 placeholder:font-bold" placeholder="Search patients..." type="text" />
          </div>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 bg-background-light dark:bg-slate-950 min-h-[calc(100vh-64px)]">
         <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-900/50">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <span className="material-symbols-outlined text-sm text-slate-400">filter_alt</span>
                  <select className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 outline-none">
                     <option>All Status</option>
                     <option>Admitted</option>
                     <option>Outpatient</option>
                  </select>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl ml-auto">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort by:</span>
                  <select className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 outline-none">
                     <option>Newest First</option>
                     <option>A-Z</option>
                  </select>
               </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <tr>
                       <th className="px-8 py-5">Patient ID</th>
                       <th className="px-8 py-5">Patient Identity</th>
                       <th className="px-8 py-5">Contact Details</th>
                       <th className="px-8 py-5">Registration</th>
                       <th className="px-8 py-5 text-center">Lifecycle</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {isLoading ? (
                       <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold">Retrieving patient digital records...</td></tr>
                    ) : patients.length === 0 ? (
                       <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold">No registered patients found in the central database.</td></tr>
                    ) : patients.map((patient) => (
                       <tr key={patient.patientid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group">
                          <td className="px-8 py-5 font-black text-slate-400 font-mono tracking-tighter">#PT-{patient.patientid.toString().padStart(4, '0')}</td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs ring-4 ring-primary/5">
                                   {patient.firstname[0]}{patient.lastname[0]}
                                </div>
                                <div>
                                   <p className="font-black text-slate-900 dark:text-slate-100 text-base leading-none mb-1">{patient.firstname} {patient.lastname}</p>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patient.gender || 'N/A'} • {patient.bloodgroup || 'N/A'}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <p className="font-bold text-slate-700 dark:text-slate-300">{patient.phonenumber || 'No contact provided'}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Primary Phone</p>
                          </td>
                          <td className="px-8 py-5">
                             <p className="font-bold text-slate-600 dark:text-slate-400">{new Date(patient.createdon).toLocaleDateString()}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Joined On</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                             <button className="px-5 py-2 bg-primary/10 text-primary font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all transform active:scale-95 shadow-sm group-hover:shadow-md">View EHR</button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            </div>
         </div>
      </div>
    </MainLayout>
  );
};

export default PatientRecords;
