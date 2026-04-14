import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '../store/toastStore';
import { caseService } from '../services/caseService';
import { employeeService } from '../services/employeeService';

const AssignCase = () => {
  const queryClient = useQueryClient();
  const [selections, setSelections] = useState({}); // { caseId: doctorEmployeeID }

  const { data: openCases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['unassigned-cases'],
    queryFn: () => caseService.getAll({ Status: 'Open' }),
  });

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => employeeService.getDoctors(),
  });

  const { addToast } = useToastStore();

  const assignMutation = useMutation({
    mutationFn: ({ caseId, doctorId }) =>
      caseService.updateStatus(caseId, { doctoremployeeid: doctorId, status: 'Accepted' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['unassigned-cases']);
      addToast('Case assigned successfully!', 'success');
    },
    onError: (err) => addToast(`Error: ${err.message}`, 'error'),
  });

  const unassigned = openCases.filter(c => !c.doctoremployeeid);

  return (
    <MainLayout title="Assign Case" hidePadding={true}>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Admin</span>
          <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
          <span className="text-primary font-semibold">Assign Case</span>
        </nav>
        <button
          onClick={() => queryClient.invalidateQueries(['unassigned-cases'])}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh
        </button>
      </header>

      <div className="p-8 space-y-8 animate-in fade-in duration-700 min-h-[calc(100vh-64px)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Unassigned Cases</h1>
            <p className="text-slate-500 mt-1">{unassigned.length} case(s) pending doctor assignment.</p>
          </div>
        </div>

        {casesLoading ? (
          <div className="py-20 text-center text-slate-400 font-bold">Loading cases...</div>
        ) : unassigned.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl block mb-3">check_circle</span>
            <p className="font-bold text-lg">All cases have been assigned!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {unassigned.map((cs) => (
              <div key={cs.caserequestid} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Case #{cs.caserequestid}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm">person</span>
                      {cs.patient?.firstname} {cs.patient?.lastname}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Dept: {cs.department?.name}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg uppercase">Pending Assignment</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      cs.urgency === 'Emergency' ? 'bg-red-100 text-red-700' :
                      cs.urgency === 'Urgent' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>{cs.urgency}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-2">{cs.casesummary || 'No summary provided.'}</p>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <select
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
                    value={selections[cs.caserequestid] || ''}
                    onChange={e => setSelections(prev => ({ ...prev, [cs.caserequestid]: e.target.value }))}
                  >
                    <option value="">Select Doctor ({cs.department?.name})</option>
                    {doctors
                      .filter(d => !cs.departmentid || d.departmentid === cs.departmentid)
                      .map(d => (
                        <option key={d.employeeid} value={d.employeeid}>
                          Dr. {d.firstname} {d.lastname} — {d.doctorprofile?.specialization || 'General'}
                        </option>
                      ))
                    }
                  </select>
                  <button
                    onClick={() => {
                      const doctorId = selections[cs.caserequestid];
                      if (!doctorId) return addToast('Please select a doctor first.', 'error');
                      assignMutation.mutate({ caseId: cs.caserequestid, doctorId: parseInt(doctorId) });
                    }}
                    disabled={!selections[cs.caserequestid] || assignMutation.isPending}
                    className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold hover:bg-primary hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {assignMutation.isPending ? '...' : 'Assign'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AssignCase;
