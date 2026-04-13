import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import { caseService } from '../services/caseService';

const DoctorCases = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const userEmail = session?.user?.email;
  const [filter, setFilter] = useState('Open'); // Default to Open cases
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['doctor-profile', userEmail],
    queryFn: () => employeeService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });
  const employeeId = profile?.employeeid;

  const { data: cases, isLoading } = useQuery({
    queryKey: ['doctor-cases', profile?.employeeid, profile?.departmentid, filter],
    queryFn: () => {
      const params = {};
      if (filter === 'Open') {
        params.assigneddeptid = profile.departmentid;
        params.status = 'Open';
      } else {
        params.doctoremployeeid = profile.employeeid;
        if (filter !== 'All') params.status = filter;
      }
      return caseService.getAll(params);
    },
    enabled: !!profile?.employeeid && !!profile?.departmentid,
  });

  const acceptMutation = useMutation({
    mutationFn: (caseId) => caseService.updateStatus(caseId, { 
      status: 'Accepted', 
      doctoremployeeid: profile.employeeid 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['doctor-cases']);
      setFilter('Accepted'); // Switch to accepted tab automatically
      alert('Case accepted successfully!');
    },
    onError: (err) => alert(`Error accepting case: ${err.message}`)
  });

  const filteredCases = cases || [];
  return (
    <MainLayout title="My Cases" hidePadding={true}>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 lg:px-10 sticky top-0 z-10">
         <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-white">
               <span className="material-symbols-outlined">clinical_notes</span>
            </div>
            <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">My Cases</h2>
         </div>
         <div className="flex flex-1 justify-end gap-4 items-center">
            <div className="hidden md:flex w-full max-w-64">
               <div className="flex w-full items-center rounded-xl h-10 bg-slate-100 dark:bg-slate-800 px-3">
                  <span className="material-symbols-outlined text-slate-500 mr-2">search</span>
                  <input className="bg-transparent border-none outline-none text-sm w-full" placeholder="Search cases..." />
               </div>
            </div>
            <button className="flex items-center justify-center rounded-xl size-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
               <span className="material-symbols-outlined">tune</span>
            </button>
         </div>
      </header>

      <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full px-4 lg:px-10 py-6 animate-in fade-in duration-700">
         {/* Tabs Navigation */}
         <div className="mb-6 overflow-x-auto">
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 lg:gap-8 min-w-max">
               {['All', 'Open', 'Accepted', 'InProgress', 'Resolved'].map((status) => (
                 <span 
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`border-b-2 pb-3 pt-2 text-sm font-bold tracking-wide cursor-pointer transition-colors ${
                      filter === status ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-primary'
                    }`}
                  >
                    {status}
                  </span>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
               <div className="col-span-full py-20 text-center text-slate-400 font-bold">Loading cases...</div>
            ) : filteredCases.length === 0 ? (
               <div className="col-span-full py-20 text-center text-slate-400 font-bold">No cases found matching the criteria.</div>
            ) : (
               filteredCases.map((cs) => (
                  <div key={cs.caserequestid} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-full hover:shadow-md transition-shadow ${cs.urgency === 'Emergency' ? 'ring-1 ring-red-200' : ''}`}>
                     <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex flex-col">
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Case #{cs.caserequestid}</span>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{cs.patient?.firstname} {cs.patient?.lastname}</h3>
                           </div>
                           <div className="flex flex-col gap-2 items-end">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 ${
                                 cs.urgency === 'Emergency' ? 'bg-red-100 text-red-600' : 
                                 cs.urgency === 'Urgent' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                 {cs.urgency === 'Emergency' && <span className="material-symbols-outlined text-xs">emergency</span>} {cs.urgency}
                              </span>
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${
                                 cs.status === 'Resolved' ? 'bg-green-100 text-green-600' : 
                                 cs.status === 'InProgress' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                              }`}>{cs.status}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 mb-5">
                           <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                              {cs.patient?.firstname?.[0]}{cs.patient?.lastname?.[0]}
                           </div>
                           <div className="flex flex-col">
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                 {cs.patient?.dateofbirth ? new Date().getFullYear() - new Date(cs.patient.dateofbirth).getFullYear() : 'N/A'} • {cs.patient?.gender} • {cs.patient?.bloodgroup}
                              </p>
                              <div className="mt-1 flex gap-2">
                                 <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-medium border border-slate-200 dark:border-slate-700">{cs.department?.name}</span>
                              </div>
                           </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mb-2">
                           <p className="text-xs text-slate-500 mb-1">Case Summary</p>
                           <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">{cs.casesummary}</p>
                        </div>
                     </div>
                     <div className="px-5 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                        {cs.status === 'Open' ? (
                          <button 
                            onClick={() => acceptMutation.mutate(cs.caserequestid)} 
                            disabled={acceptMutation.isPending}
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-lg">check_circle</span> Accept Patient Case
                          </button>
                        ) : (
                          <button 
                            onClick={() => navigate(`/cases/${cs.caserequestid}`)} 
                            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">medical_services</span> View and Treat
                          </button>
                        )}
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
    </MainLayout>
  );
};

export default DoctorCases;
