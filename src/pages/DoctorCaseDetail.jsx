import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { caseService } from '../services/caseService';

const DoctorCaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('Diagnosis');
    
    // Fetch Case Detail
    const { data: caseDetail, isLoading } = useQuery({
      queryKey: ['case-detail', id],
      queryFn: () => caseService.getById(id),
      enabled: !!id
    });

    const [diagnosisNotes, setDiagnosisNotes] = useState('');
    const [severity, setSeverity] = useState('Moderate');

    // Sync local state when data arrives
    React.useEffect(() => {
      if (caseDetail?.diagnosis?.[0]) {
        setDiagnosisNotes(caseDetail.diagnosis[0].notes || '');
        setSeverity(caseDetail.diagnosis[0].severity || 'Moderate');
      }
    }, [caseDetail]);

    const saveDiagnosisMutation = useMutation({
      mutationFn: (notes) => caseService.saveDiagnosis({
        caserequestid: id,
        diseaseid: 1, // Placeholder: In a real app, this would be selected from a list
        severity: severity,
        notes: notes
      }),
      onSuccess: () => {
        queryClient.invalidateQueries(['case-detail', id]);
        alert('Diagnosis saved successfully!');
      }
    });

    if (isLoading) {
      return (
        <MainLayout title="Loading Case..." hidePadding={true}>
          <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
             <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
          </div>
        </MainLayout>
      );
    }

    const patient = caseDetail?.patient;
    const assessment = caseDetail?.patientassessment?.[0];

  return (
    <MainLayout title={`Doctor Case Detail - ${patient?.firstname || ''} ${patient?.lastname || ''}`} hidePadding={true}>
      <header className="flex items-center justify-between border-b border-primary/10 bg-white dark:bg-slate-900 px-6 py-3 lg:px-10 sticky top-0 z-10">
        <div className="flex items-center gap-4 text-primary">
          <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center cursor-pointer" onClick={() => navigate('/cases')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">Case Details</h2>
        </div>
        <div className="flex flex-1 justify-end gap-8 items-center">
          <nav className="hidden md:flex items-center gap-9">
            <span className="text-primary text-sm font-semibold border-b-2 border-primary pb-1 cursor-pointer" onClick={() => navigate('/cases')}>Cases</span>
            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors cursor-pointer">Patients</span>
            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/appointments')}>Schedule</span>
          </nav>
        </div>
      </header>
      
      <main className="flex flex-col lg:flex-row gap-6 p-6 lg:p-10 max-w-[1440px] mx-auto w-full animate-in fade-in duration-700 min-h-[calc(100vh-64px)]">
        <aside className="w-full lg:w-[380px] flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-primary/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl ring-4 ring-primary/5">
                {patient?.firstname?.[0]}{patient?.lastname?.[0]}
              </div>
              <div className="flex flex-col">
                <h1 className="text-slate-900 dark:text-slate-100 text-xl font-bold">{patient?.firstname} {patient?.lastname}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                   {patient?.dateofbirth ? new Date().getFullYear() - new Date(patient.dateofbirth).getFullYear() : 'N/A'}Y • {patient?.gender} • {patient?.bloodgroup} Blood
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/10 mb-6">
              <span className="material-symbols-outlined text-primary">call</span>
              <div className="flex flex-col">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Mobile</p>
                <p className="text-slate-900 dark:text-slate-100 font-medium">{patient?.phonenumber || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase">Temp</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">{assessment?.temperature || '--'}°C</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase">BP</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">{assessment?.systolicbp}/{assessment?.diastolicbp}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase">O2 Sat</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">{assessment?.oxygenlevel || '--'}%</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800">
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-bold uppercase">Heart Rate</p>
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{assessment?.pulserate || '--'} bpm</p>
              </div>
            </div>

            <h3 className="text-slate-900 dark:text-slate-100 font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">assignment</span> Case Status
            </h3>
            
            <div className="relative space-y-0">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm flex">check</span>
                  </div>
                  <div className="w-0.5 h-10 bg-green-500"></div>
                </div>
                <div className="pb-6">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Assessment</p>
                  <p className="text-xs text-slate-500">Completed 10:30 AM</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm flex">check</span>
                  </div>
                  <div className="w-0.5 h-10 bg-green-500"></div>
                </div>
                <div className="pb-6">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Created</p>
                  <p className="text-xs text-slate-500">Completed 10:45 AM</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm flex">check</span>
                  </div>
                  <div className="w-0.5 h-10 bg-primary"></div>
                </div>
                <div className="pb-6">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Accepted</p>
                  <p className="text-xs text-slate-500">Completed 11:00 AM</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-6 rounded-full border-2 border-primary bg-white dark:bg-slate-900 flex items-center justify-center">
                    <div className="size-2 bg-primary rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">In Progress</p>
                  <p className="text-xs text-primary/70 font-medium">Current Step</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/5 flex flex-col h-full min-h-[600px]">
            <div className="flex flex-wrap border-b border-primary/10 px-4 pt-4 gap-1">
              {['Assessment', 'Diagnosis', 'Prescription', 'Lab', 'Appt', 'Admission'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 ${
                    activeTab === tab ? 'text-primary border-primary' : 'text-slate-500 hover:text-primary border-transparent'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-8 flex flex-col gap-8 grow">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Current Diagnosis</h2>
                <p className="text-slate-500 dark:text-slate-400">Update the patient's condition and clinical findings.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Disease / Condition</label>
                  <div className="relative">
                    <input className="w-full p-3 pl-10 rounded-lg border border-primary/20 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none" type="text" defaultValue="Coronary Artery Disease" />
                    <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 flex">search</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Severity</label>
                  <div className="flex gap-2">
                    <button onClick={() => setSeverity('Mild')} className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${severity === 'Mild' ? 'bg-green-600 text-white border-green-600' : 'border-slate-200 text-slate-600'}`}>Mild</button>
                    <button onClick={() => setSeverity('Moderate')} className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${severity === 'Moderate' ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-200 text-slate-600'}`}>Moderate</button>
                    <button onClick={() => setSeverity('Severe')} className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold transition-all ${severity === 'Severe' ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200' : 'border-slate-200 text-slate-600'}`}>Severe</button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 grow">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Clinical Notes</label>
                <textarea 
                  className="w-full grow min-h-[200px] p-4 rounded-lg border border-primary/20 bg-slate-50 dark:bg-slate-800 outline-none resize-none" 
                  placeholder="Enter detailed diagnosis notes here..." 
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-primary/5">
                <button onClick={() => navigate('/cases')} className="px-6 py-2 rounded-lg border border-primary/20 text-primary font-bold hover:bg-primary/5 transition-colors">Discard</button>
                <button 
                  onClick={() => saveDiagnosisMutation.mutate(diagnosisNotes)} 
                  disabled={saveDiagnosisMutation.isPending}
                  className="px-8 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {saveDiagnosisMutation.isPending ? (
                    <span className="animate-spin material-symbols-outlined text-sm flex">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm flex">save</span>
                  )}
                  {saveDiagnosisMutation.isPending ? 'Saving...' : 'Save Diagnosis'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MainLayout>
  );
};

export default DoctorCaseDetail;
