import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { caseService } from '../services/caseService';
import { useAuthStore } from '../store/authStore';
import { employeeService } from '../services/employeeService';

const NurseLabResults = () => {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const [resultValues, setResultValues] = useState({});

  const { data: profile } = useQuery({
    queryKey: ['nurse-profile', session?.user?.email],
    queryFn: () => employeeService.getProfileByEmail(session?.user?.email),
    enabled: !!session?.user?.email,
  });

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['lab-queue'],
    queryFn: () => caseService.getLabQueue(),
  });

  const updateLabTestMutation = useMutation({
    mutationFn: ({ reportId, testValue }) => caseService.updateLabTest(reportId, {
      testvalue: testValue,
      performedbyid: profile?.employeeid,
      resultedon: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-queue']);
      alert('Lab result saved successfully!');
    }
  });

  const handleResultChange = (reportId, value) => {
    setResultValues(prev => ({ ...prev, [reportId]: value }));
  };

  const handleSaveResult = (reportId) => {
    const value = resultValues[reportId];
    if (!value) return;
    updateLabTestMutation.mutate({ reportId, testValue: value });
  };

  return (
    <MainLayout title="Pending Lab Tests" hidePadding={true}>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 bg-white dark:bg-slate-900 px-6 md:px-10 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="size-8 text-primary flex items-center">
            <span className="material-symbols-outlined text-4xl">science</span>
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">Pending Lab Tests</h2>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-6 p-6 md:p-10 max-w-[1440px] mx-auto w-full animate-in fade-in duration-700 min-h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold">Loading pending lab tests...</div>
          ) : queue.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold">No pending lab tests found.</div>
          ) : (
            queue.map(test => (
              <div key={test.reportid} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Case #{test.caserequestid}</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{test.firstname} {test.lastname}</h3>
                    <span className="text-sm text-primary font-medium">{test.department_name}</span>
                  </div>
                  <div className="px-3 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest">
                    {test.status}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200">{test.testname}</h4>
                      <p className="text-sm text-slate-500">Code: {test.testcode}</p>
                    </div>
                    {test.normalrange && (
                      <div className="text-xs text-right text-slate-400">
                        <p className="font-bold uppercase">Normal Range</p>
                        <p>{test.normalrange} {test.unit}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder={`Enter Result (${test.unit || 'value'})`} 
                      className="flex-1 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none w-full"
                      value={resultValues[test.reportid] || ''}
                      onChange={(e) => handleResultChange(test.reportid, e.target.value)}
                    />
                    <button 
                      onClick={() => handleSaveResult(test.reportid)}
                      disabled={!resultValues[test.reportid] || updateLabTestMutation.isPending}
                      className="px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </MainLayout>
  );
};

export default NurseLabResults;
