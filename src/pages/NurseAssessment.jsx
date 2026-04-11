import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import { assessmentService } from '../services/assessmentService';
import { patientService } from '../services/patientService';

const NurseAssessment = () => {
  const { session } = useAuthStore();
  const userEmail = session?.user?.email;
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [condition, setCondition] = useState('Stable');
  const [vitals, setVitals] = useState({
    temperature: '', systolicbp: '', diastolicbp: '',
    pulserate: '', oxygenlevel: '', bloodsugar: '', symptoms: '', notes: ''
  });

  const { data: profile } = useQuery({
    queryKey: ['nurse-profile', userEmail],
    queryFn: () => employeeService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });
  const employeeId = profile?.employeeid;

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['pending-assessments'],
    queryFn: () => patientService.getAll(),
  });

  const saveAssessment = useMutation({
    mutationFn: () => assessmentService.create({
      patientid: selectedPatient.patientid,
      nurseemployeeid: profile.employeeid,
      symptoms: vitals.symptoms,
      condition: condition,
      temperature: parseFloat(vitals.temperature) || null,
      systolicbp: parseInt(vitals.systolicbp) || null,
      diastolicbp: parseInt(vitals.diastolicbp) || null,
      pulserate: parseInt(vitals.pulserate) || null,
      oxygenlevel: parseFloat(vitals.oxygenlevel) || null,
      bloodsugar: parseFloat(vitals.bloodsugar) || null,
      notes: vitals.notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['recent-assessments']);
      setStep(1);
      setSelectedPatient(null);
      setVitals({ temperature: '', systolicbp: '', diastolicbp: '', pulserate: '', oxygenlevel: '', bloodsugar: '', symptoms: '', notes: '' });
      alert('Assessment saved successfully!');
    },
    onError: (err) => alert(`Error: ${err.message}`),
  });

  return (
    <MainLayout title="Assess Patient" hidePadding={true}>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assess Patient</h2>
      </header>

      <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Stepper */}
        <div className="flex items-center gap-12 mb-12 border-b border-slate-100 dark:border-slate-800 pb-6">
          {[{ n: 1, label: 'Select Patient' }, { n: 2, label: 'Record Vitals' }].map(({ n, label }) => (
            <div key={n} className={`flex items-center gap-3 transition-opacity ${step === n ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`size-10 rounded-full flex items-center justify-center font-black ${step === n ? 'bg-primary text-white shadow-xl shadow-primary/20' : step > n ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>{step > n ? '✓' : n}</div>
              <span className={`font-black text-sm uppercase tracking-widest ${step === n ? 'text-primary' : ''}`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Patient Queue */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Patient Queue</h3>
            {isLoading ? (
              <p className="text-slate-400 text-sm">Loading patients...</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {patients.slice(0, 10).map((pt) => (
                  <div
                    key={pt.patientid}
                    onClick={() => { setSelectedPatient(pt); setStep(1); }}
                    className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer group hover:shadow-xl ${
                      selectedPatient?.patientid === pt.patientid
                        ? 'border-primary bg-white dark:bg-slate-900 shadow-xl'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 opacity-60 grayscale-[50%]'
                    }`}
                  >
                    {selectedPatient?.patientid === pt.patientid && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full size-7 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm font-black">check</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                        {pt.firstname?.[0]}{pt.lastname?.[0]}
                      </div>
                      <div>
                        <h4 className="font-black">{pt.firstname} {pt.lastname}</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">#{pt.patientid} • {pt.gender}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {pt.bloodgroup || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px]">
              {step === 1 ? (
                <div className="p-12 text-center h-full flex flex-col items-center justify-center space-y-6">
                  <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl">inventory</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-2">Ready to Assess?</h3>
                    <p className="text-slate-500 font-medium max-w-sm">Select a patient from the queue to start their clinical vitals assessment.</p>
                  </div>
                  {selectedPatient && (
                    <button onClick={() => setStep(2)} className="px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 mt-4">
                      Proceed to Vitals <span className="material-symbols-outlined font-black">arrow_forward</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                      <h3 className="font-black text-xl">Vitals Assessment</h3>
                      <p className="text-sm font-bold text-primary uppercase">Patient: {selectedPatient?.firstname} {selectedPatient?.lastname}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">Condition</span>
                      <div className="flex gap-2">
                        {['Stable', 'Moderate', 'Critical'].map(c => (
                          <button key={c} onClick={() => setCondition(c)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                              condition === c
                                ? c === 'Critical' ? 'bg-red-500 text-white' : c === 'Moderate' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >{c}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { key: 'temperature', label: 'Temperature (°C)', icon: 'thermostat' },
                        { key: 'systolicbp', label: 'Systolic BP', icon: 'blood_pressure' },
                        { key: 'diastolicbp', label: 'Diastolic BP', icon: 'blood_pressure' },
                        { key: 'pulserate', label: 'Heart Rate (BPM)', icon: 'favorite' },
                        { key: 'oxygenlevel', label: 'SpO2 (%)', icon: 'air' },
                        { key: 'bloodsugar', label: 'Blood Sugar (mg/dL)', icon: 'water_drop' },
                      ].map(({ key, label, icon }) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-slate-400">{icon}</span> {label}
                          </label>
                          <input
                            type="number"
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/30 outline-none font-bold text-lg"
                            value={vitals[key]}
                            onChange={e => setVitals(prev => ({ ...prev, [key]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Symptoms *</label>
                      <input
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="e.g. Chest pain, shortness of breath..."
                        value={vitals.symptoms}
                        onChange={e => setVitals(prev => ({ ...prev, symptoms: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Notes</label>
                      <textarea
                        rows={3}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        placeholder="Additional observations..."
                        value={vitals.notes}
                        onChange={e => setVitals(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                    <button onClick={() => setStep(1)} className="px-6 py-3 font-black text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Back</button>
                    <button
                      onClick={() => saveAssessment.mutate()}
                      disabled={!vitals.symptoms || saveAssessment.isPending}
                      className="px-10 py-3 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveAssessment.isPending ? (
                        <span className="animate-spin material-symbols-outlined font-black">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined font-black">save_as</span>
                      )}
                      {saveAssessment.isPending ? 'Saving...' : 'Finalize Assessment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NurseAssessment;
