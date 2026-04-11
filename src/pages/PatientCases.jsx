import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { patientPortalService } from '../services/patientPortalService';

const TABS = ['Overview', 'Diagnosis', 'Prescription', 'Lab Results', 'Billing'];

const PatientCases = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const userEmail = session?.user?.email;

  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const { data: patient } = useQuery({
    queryKey: ['patient-profile', userEmail],
    queryFn: () => patientPortalService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['patient-cases', patient?.patientid],
    queryFn: () => patientPortalService.getCases(patient.patientid),
    enabled: !!patient?.patientid,
    onSuccess: (data) => { if (data.length > 0 && !selectedCaseId) setSelectedCaseId(data[0].caserequestid); }
  });

  const selected = cases.find(c => c.caserequestid === selectedCaseId) || cases[0];

  const renderTabContent = () => {
    if (!selected) return <div className="p-8 text-slate-400 text-center font-bold">Select a case to view details.</div>;

    if (activeTab === 'Overview') return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Department', selected.department?.name],
            ['Status', selected.status],
            ['Urgency', selected.urgency],
            ['Created On', selected.createdon ? new Date(selected.createdon).toLocaleDateString() : 'N/A'],
          ].map(([label, value]) => (
            <div key={label} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{label}</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">{value || 'N/A'}</p>
            </div>
          ))}
        </div>
        {selected.casesummary && (
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
            <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">Case Summary</p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selected.casesummary}</p>
          </div>
        )}
      </div>
    );

    if (activeTab === 'Diagnosis') {
      const diagnoses = selected.diagnosis || [];
      return (
        <div className="p-6 space-y-4">
          {diagnoses.length === 0 ? (
            <div className="text-center text-slate-400 font-bold py-12">No diagnosis recorded yet.</div>
          ) : diagnoses.map((d, i) => (
            <div key={i} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary">clinical_notes</span>
                <h4 className="font-bold text-lg">{d.disease?.name || `Diagnosis #${i + 1}`}</h4>
                <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase ${d.severity === 'Severe' ? 'bg-red-100 text-red-700' : d.severity === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{d.severity}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{d.notes}</p>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'Prescription') {
      const prescriptions = selected.prescription || [];
      return (
        <div className="p-6 space-y-4">
          {prescriptions.length === 0 ? (
            <div className="text-center text-slate-400 font-bold py-12">No prescriptions yet.</div>
          ) : (
            <>
              {prescriptions.map((rx, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="size-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      <span className="material-symbols-outlined">pill</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-bold">{rx.medications}</h4>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">{rx.dosage} • {rx.frequency}</p>
                      {rx.instructions && <p className="text-xs text-slate-400 mt-1">{rx.instructions}</p>}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 font-medium whitespace-nowrap">
                    Until: {rx.enddate ? new Date(rx.enddate).toLocaleDateString() : 'Ongoing'}
                  </div>
                </div>
              ))}
              <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold">Low on stock?</h4>
                  <p className="text-sm text-slate-400">Order your refills online from our partner pharmacy.</p>
                </div>
                <button onClick={() => alert('Refill Ordered Successfully!')} className="bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-xl font-bold transition-all">Order Refill</button>
              </div>
            </>
          )}
        </div>
      );
    }

    if (activeTab === 'Lab Results') {
      const labs = selected.labreport || [];
      return (
        <div className="p-6 space-y-4">
          {labs.length === 0 ? (
            <div className="text-center text-slate-400 font-bold py-12">No lab reports yet.</div>
          ) : labs.map((lab, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold">{lab.labtest?.testname || 'Lab Test'}</h4>
                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${lab.status === 'Abnormal' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{lab.status || 'N/A'}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Result: <strong>{lab.resultvalue || 'Pending'}</strong> {lab.labtest?.unit}</p>
              <p className="text-xs text-slate-400 mt-1">Normal Range: {lab.labtest?.normalrange || 'N/A'}</p>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'Billing') {
      return (
        <div className="p-6">
          <div className="text-center space-y-4 py-8">
            <span className="material-symbols-outlined text-5xl text-primary">account_balance_wallet</span>
            <p className="font-bold text-slate-600 dark:text-slate-400">View your complete billing information in the Billing section.</p>
            <button onClick={() => navigate('/patient/bills')} className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors">Go to Billing</button>
          </div>
        </div>
      );
    }
  };

  return (
    <MainLayout title="My Cases" hidePadding={true}>
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2 rounded-lg text-white">
            <span className="material-symbols-outlined">medical_services</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">My Cases</h2>
        </div>
      </header>

      <div className="flex flex-1 p-6 gap-6 h-[calc(100vh-73px)] animate-in fade-in duration-700">
        {/* Case List */}
        <div className="w-2/5 flex flex-col gap-4 overflow-y-auto pr-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">My Consultations</h3>
          {isLoading ? (
            <div className="text-slate-400 text-sm">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="text-slate-400 text-sm">No cases found.</div>
          ) : (
            cases.map((c) => (
              <div
                key={c.caserequestid}
                onClick={() => { setSelectedCaseId(c.caserequestid); setActiveTab('Overview'); }}
                className={`p-4 rounded-xl bg-white dark:bg-slate-900 border-2 shadow-sm cursor-pointer transition-all ${
                  selectedCaseId === c.caserequestid ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg">Case #{c.caserequestid}</h4>
                    <p className="text-slate-500 text-sm">{c.createdon ? new Date(c.createdon).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                    c.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                    c.status === 'InProgress' ? 'bg-blue-100 text-blue-700' : 'bg-primary/10 text-primary'
                  }`}>{c.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                    {c.employee?.firstname?.[0]}{c.employee?.lastname?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Dr. {c.employee?.firstname} {c.employee?.lastname}</p>
                    <p className="text-xs text-slate-500">{c.employee?.doctorprofile?.specialization} • {c.department?.name}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Case Details */}
        <div className="w-3/5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
          {selected ? (
            <>
              <div className="p-6 bg-primary text-white">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Case #{selected.caserequestid} Details</h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${selected.urgency === 'Emergency' ? 'bg-red-500' : selected.urgency === 'Urgent' ? 'bg-amber-500' : 'bg-white/20'}`}>{selected.urgency}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <span className="material-symbols-outlined text-3xl">ecg_heart</span>
                  </div>
                  <div>
                    <p className="text-sm text-white/80 font-medium">Primary Physician</p>
                    <p className="text-lg font-bold">Dr. {selected.employee?.firstname} {selected.employee?.lastname} • {selected.employee?.doctorprofile?.specialization}</p>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 dark:border-slate-800 px-6">
                <div className="flex gap-8 overflow-x-auto no-scrollbar">
                  {TABS.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-primary'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
                {renderTabContent()}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 font-bold">
              Select a case to view details.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientCases;
