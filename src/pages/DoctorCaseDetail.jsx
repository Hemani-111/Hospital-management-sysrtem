import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { caseService } from '../services/caseService';
import { useAuthStore } from '../store/authStore';
import { employeeService } from '../services/employeeService';
import { appointmentService } from '../services/appointmentService';

const DoctorCaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { session } = useAuthStore();
    const userEmail = session?.user?.email;
    const userRole = session?.user?.role;
    const [activeTab, setActiveTab] = useState('Diagnosis');
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 4000);
    };
    
    // Fetch Case Detail
    const { data: caseDetail, isLoading } = useQuery({
      queryKey: ['case-detail', id],
      queryFn: () => caseService.getById(id),
      enabled: !!id
    });

    const [diagnosisNotes, setDiagnosisNotes] = useState('');
    const [severity, setSeverity] = useState('Moderate');
    const [selectedDiseaseId, setSelectedDiseaseId] = useState('');
    const [selectedLabTest, setSelectedLabTest] = useState('');
    
    // Prescription State
    const [medicines, setMedicines] = useState('');
    const [instructions, setInstructions] = useState('');


    // Lab Entry State (for Nurses)
    const [labResultInputs, setLabResultInputs] = useState({});

    // Admission State (for Nurses)
    const [selectedRoomId, setSelectedRoomId] = useState('');

    // Appointment State
    const [appointmentDate, setAppointmentDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [appointmentType, setAppointmentType] = useState('Followup');

    const { data: profile } = useQuery({
      queryKey: ['doctor-profile', userEmail],
      queryFn: () => employeeService.getProfileByEmail(userEmail),
      enabled: !!userEmail,
    });

    const { data: labCatalog = [] } = useQuery({
      queryKey: ['lab-catalog'],
      queryFn: () => caseService.getLabCatalog()
    });

    const { data: labTests = [] } = useQuery({
      queryKey: ['lab-tests', id],
      queryFn: () => caseService.getLabTests(id),
      enabled: !!id,
      refetchInterval: 2000
    });

    const { data: diseases = [] } = useQuery({
      queryKey: ['diseases'],
      queryFn: () => caseService.getDiseases(),
    });

    const { data: availableRooms = [] } = useQuery({
      queryKey: ['available-rooms'],
      queryFn: () => caseService.getAvailableRooms(),
      enabled: userRole === 'nurse'
    });


    const orderLabTestMutation = useMutation({
      mutationFn: (labtestid) => caseService.orderLabTest({
        caserequestid: id,
        labtestid: parseInt(labtestid),
        patientid: caseDetail?.patientid,
        orderedbyid: profile?.employeeid
      }),
      onSuccess: () => {
        queryClient.invalidateQueries(['lab-tests', id]);
        setSelectedLabTest('');
        showNotification('Lab test ordered successfully!');
      }
    });

    // Sync local state when data arrives
    React.useEffect(() => {
      if (caseDetail?.diagnosis?.[0]) {
        setDiagnosisNotes(caseDetail.diagnosis[0].notes || '');
        setSeverity(caseDetail.diagnosis[0].severity || 'Moderate');
        setSelectedDiseaseId(caseDetail.diagnosis[0].diseaseid || '');
      }
      if (caseDetail?.prescription?.[0]) {
        setMedicines(caseDetail.prescription[0].medicines || '');
        setInstructions(caseDetail.prescription[0].instructions || '');
      }
    }, [caseDetail]);

    const saveDiagnosisMutation = useMutation({
      mutationFn: (notes) => caseService.saveDiagnosis({
        caserequestid: parseInt(id),
        diseaseid: selectedDiseaseId ? parseInt(selectedDiseaseId) : null,
        severity: severity,
        notes: notes
      }),
      onSuccess: () => {
        queryClient.invalidateQueries(['case-detail', id]);
        showNotification('Diagnosis saved successfully!');
      }
    });

    const savePrescriptionMutation = useMutation({
      mutationFn: () => caseService.savePrescription({
        caserequestid: parseInt(id),
        medicines,
        instructions
      }),
      onSuccess: () => {
        queryClient.invalidateQueries(['case-detail', id]);
        showNotification('Prescription saved successfully!');
      }
    });

    const updateCaseStatusMutation = useMutation({
      mutationFn: (newStatus) => caseService.updateStatus(id, { status: newStatus }),
      onSuccess: () => {
        queryClient.invalidateQueries(['case-detail', id]);
        showNotification(`Case status updated to ${newStatus}`);
      }
    });

    const updateLabTestMutation = useMutation({
      mutationFn: ({ reportId, testValue }) => caseService.updateLabTest(reportId, {
        testvalue: testValue,
        performedbyid: profile?.employeeid,
        resultedon: new Date().toISOString()
      }),
      onSuccess: () => {
        queryClient.invalidateQueries(['lab-tests', id]);
        showNotification('Lab results recorded successfully.');
      }
    });

    const admitPatientMutation = useMutation({
      mutationFn: () => caseService.admitPatient(id, { roomid: parseInt(selectedRoomId) }),
      onSuccess: () => {
        queryClient.invalidateQueries(['case-detail', id]);
        queryClient.invalidateQueries(['available-rooms']);
        showNotification('Patient admitted successfully!');
      }
    });


    const createAppointmentMutation = useMutation({
      mutationFn: async () => {
        if (!caseDetail?.patientid || !profile?.employeeid) {
          throw new Error('Patient or Doctor profile not fully loaded. Please wait and try again.');
        }

        if (endTime <= startTime) {
          throw new Error('End time must be after start time.');
        }

        return appointmentService.create({
          caserequestid: parseInt(id),
          patientid: caseDetail.patientid,
          doctoremployeeid: profile.employeeid,
          createdbyempid: profile.employeeid,
          appointmentdate: appointmentDate,
          starttime: startTime,
          endtime: endTime,
          type: appointmentType
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['appointments']);
        queryClient.invalidateQueries(['patient-appointments']);
        queryClient.invalidateQueries(['doctor-schedule']);
        queryClient.invalidateQueries(['today-appts']);
        showNotification('Follow-up appointment scheduled successfully!');
        setAppointmentDate('');
        setStartTime('');
        setEndTime('');
      },
      onError: (err) => {
        console.error('Appointment Error:', err);
        const errorMsg = err.response?.data?.error || err.message || 'Unknown error occurred';
        showNotification(`Failed to schedule appointment: ${errorMsg}`, 'error');
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

          {caseDetail?.caserequestid && caseDetail?.status !== 'Resolved' && (
            <button 
              onClick={() => updateCaseStatusMutation.mutate(caseDetail.status === 'Accepted' ? 'InProgress' : 'Resolved')}
              disabled={updateCaseStatusMutation.isPending}
              className={`px-6 py-2 rounded-lg font-bold shadow-sm transition-colors ${
                caseDetail.status === 'Accepted' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Mark as {caseDetail.status === 'Accepted' ? 'In Progress' : 'Resolved'}
            </button>
          )}
        </div>
      </header>

      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-500">
           <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-md ${
             notification.type === 'success' 
               ? 'bg-emerald-500/90 text-white border-emerald-400' 
               : 'bg-rose-500/90 text-white border-rose-400'
           }`}>
              <span className="material-symbols-outlined font-black">
                {notification.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span className="text-sm font-black uppercase tracking-widest">{notification.message}</span>
              <button onClick={() => setNotification(null)} className="ml-4 hover:opacity-70 transition-opacity">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
           </div>
        </div>
      )}
      
      <main className="flex flex-col lg:flex-row gap-6 p-6 lg:p-10 max-w-[1440px] mx-auto w-full animate-in fade-in duration-700 min-h-[calc(100vh-64px)]">
        
        {/* Branded Case Report Header (Stays at TOP of PDF) */}
        <div className="print-only mb-10 w-full">
          <div className="flex justify-between items-start pb-6 border-b-4 border-primary mb-10">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">Hospital System</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Official Medical Discharge Summary</p>
            </div>
            <div className="text-right space-y-1">
              <p className="font-black text-lg text-primary">CASE #{id}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Printed: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-10">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-1">Patient Identification</h4>
              <p className="text-2xl font-black text-slate-900">{caseDetail?.firstname} {caseDetail?.lastname}</p>
              <div className="flex gap-6 text-sm">
                <p><span className="font-bold text-slate-400">Gender:</span> {caseDetail?.gender}</p>
                <p><span className="font-bold text-slate-400">Blood:</span> {caseDetail?.bloodgroup}</p>
              </div>
            </div>
            <div className="space-y-4 text-right">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-1">Medical Department</h4>
              <p className="text-xl font-bold text-slate-900">{caseDetail?.department?.name}</p>
              <p className="text-sm font-bold text-primary">Dr. {caseDetail?.doctor?.firstname} {caseDetail?.doctor?.lastname}</p>
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-[380px] flex flex-col gap-6 no-print">
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
            
            <h3 className="text-slate-900 dark:text-slate-100 font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">assignment</span> Case Timeline
            </h3>
            
            <div className="relative space-y-0">
              {/* Step 1: Assessment */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-xs flex">check</span>
                  </div>
                  <div className="w-0.5 h-10 bg-green-500"></div>
                </div>
                <div className="pb-6">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Patient Assessment</p>
                  <p className="text-xs text-slate-500">{new Date(caseDetail?.createdon).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — Recorded</p>
                </div>
              </div>
              
              {/* Step 2: Created */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-xs flex">check</span>
                  </div>
                  <div className="w-0.5 h-10 bg-green-500"></div>
                </div>
                <div className="pb-6">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Case Created</p>
                  <p className="text-xs text-slate-500">{new Date(caseDetail?.createdon).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — Initial Registry</p>
                </div>
              </div>

              {/* Step 3: Acceptance Status */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`size-6 rounded-full flex items-center justify-center shadow-sm ${
                    caseDetail?.status !== 'Open' ? 'bg-green-500 text-white' : 'bg-primary text-white animate-pulse'
                  }`}>
                    {caseDetail?.status !== 'Open' ? (
                      <span className="material-symbols-outlined text-xs flex">check</span>
                    ) : (
                      <div className="size-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className={`w-0.5 h-10 ${caseDetail?.status === 'InProgress' || caseDetail?.status === 'Resolved' ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                </div>
                <div className="pb-6">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Doctor Acceptance</p>
                  <p className="text-xs text-slate-500">
                    {caseDetail?.status === 'Open' ? 'Awaiting Doctor...' : `Accepted — Status: ${caseDetail?.status}`}
                  </p>
                </div>
              </div>

              {/* Step 4: Resolution */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`size-6 rounded-full flex items-center justify-center shadow-sm ${
                    caseDetail?.status === 'Resolved' ? 'bg-green-500 text-white' : 'border-2 border-slate-200 bg-white'
                  }`}>
                    {caseDetail?.status === 'Resolved' ? (
                      <span className="material-symbols-outlined text-xs flex">check_circle</span>
                    ) : (
                      <div className="size-2 bg-slate-200 rounded-full"></div>
                    )}
                  </div>
                </div>
                <div className="pb-6">
                  <p className={`text-sm font-bold ${caseDetail?.status === 'Resolved' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>Case Resolved</p>
                  <p className="text-xs text-slate-400">
                    {caseDetail?.status === 'Resolved' ? 'Finalized & Billed' : 'Pending Resolution'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/5 flex flex-col h-full min-h-[600px]">
            <div className="flex flex-wrap border-b border-primary/10 px-4 pt-4 gap-1">
              {['Assessment', 'Diagnosis', 'Prescription', 'Lab', ...(userRole === 'nurse' ? ['Admission'] : ['Appt'])].map((tab) => (
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

            {activeTab === 'Assessment' && (
              <div className="p-8 flex flex-col gap-8 grow animate-in fade-in duration-300">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Initial Assessment</h2>
                  <p className="text-slate-500 dark:text-slate-400">Clinical findings from the nursing triage.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Primary Symptoms</span>
                      <p className="text-slate-900 dark:text-slate-100 font-bold bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        {assessment?.symptoms || 'No symptoms recorded'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Patient Condition</span>
                      <div className="flex mt-1">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                          assessment?.condition === 'Critical' ? 'bg-red-500 text-white' : 
                          assessment?.condition === 'Moderate' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          {assessment?.condition || 'Stable'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Nurse's Clinical Notes</span>
                      <div className="text-slate-600 dark:text-slate-400 text-sm italic bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800 min-h-[100px]">
                        {assessment?.notes || 'No clinical notes provided.'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-4 mt-auto">
                   <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">info</span>
                      <h4 className="font-black text-primary uppercase text-xs tracking-widest">Referral Context</h4>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Urgency Level</span>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          caseDetail?.urgency === 'Emergency' ? 'bg-red-100 text-red-700' :
                          caseDetail?.urgency === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {caseDetail?.urgency || 'Routine'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Case Summary</span>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {caseDetail?.casesummary || 'Standard clinical referral.'}
                        </p>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'Diagnosis' && (
              <div className="p-8 flex flex-col gap-8 grow">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Current Diagnosis</h2>
                  <p className="text-slate-500 dark:text-slate-400">Update the patient's condition and clinical findings.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Disease / Condition</label>
                    <div className="relative">
                    <select 
                      className="w-full p-3 pl-10 rounded-lg border border-primary/20 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                      value={selectedDiseaseId}
                      onChange={(e) => setSelectedDiseaseId(e.target.value)}
                      disabled={userRole !== 'doctor'}
                    >
                      <option value="">-- Select Disease --</option>
                      {diseases.map(d => (
                        <option key={d.diseaseid} value={d.diseaseid}>{d.name} ({d.icd10code || 'N/A'})</option>
                      ))}
                    </select>
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
                    className="w-full grow min-h-[200px] p-4 rounded-lg border border-primary/20 bg-slate-50 dark:bg-slate-800 outline-none resize-none disabled:opacity-70" 
                    placeholder="Enter detailed diagnosis notes here..." 
                    value={diagnosisNotes}
                    onChange={(e) => setDiagnosisNotes(e.target.value)}
                    readOnly={userRole !== 'doctor'}
                  ></textarea>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-primary/5 no-print">
                  <button onClick={() => navigate('/cases')} className="px-6 py-2 rounded-lg border border-primary/20 text-primary font-bold hover:bg-primary/5 transition-colors">Discard</button>
                  {userRole === 'doctor' && (
                    <button 
                      onClick={() => saveDiagnosisMutation.mutate(diagnosisNotes)} 
                      disabled={saveDiagnosisMutation.isPending || !selectedDiseaseId}
                      className="px-8 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {saveDiagnosisMutation.isPending ? (
                        <span className="animate-spin material-symbols-outlined text-sm flex">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm flex">save</span>
                      )}
                      {saveDiagnosisMutation.isPending ? 'Saving...' : 'Save Diagnosis'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Prescription' && (
              <div className="p-8 flex flex-col gap-8 grow animate-in fade-in duration-300">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Prescription</h2>
                  <p className="text-slate-500 dark:text-slate-400">Prescribe medication for the patient.</p>
                </div>
                
                <div className="flex flex-col gap-2 grow">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Medicines (Format: Name - Dosage - Duration)</label>
                  <textarea 
                    className="w-full grow min-h-[150px] p-4 rounded-lg border border-primary/20 bg-slate-50 dark:bg-slate-800 outline-none resize-none disabled:opacity-70" 
                    placeholder="E.g., Paracetamol 500mg - 1-0-1 - 5 days..." 
                    value={medicines}
                    onChange={(e) => setMedicines(e.target.value)}
                    readOnly={userRole !== 'doctor'}
                  ></textarea>
                </div>

                <div className="flex flex-col gap-2 grow">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Special Instructions</label>
                  <textarea 
                    className="w-full grow min-h-[100px] p-4 rounded-lg border border-primary/20 bg-slate-50 dark:bg-slate-800 outline-none resize-none disabled:opacity-70" 
                    placeholder="Any specific advice or diet instructions..." 
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    readOnly={userRole !== 'doctor'}
                  ></textarea>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-primary/5 no-print">
                  <button onClick={() => navigate('/cases')} className="px-6 py-2 rounded-lg border border-primary/20 text-primary font-bold hover:bg-primary/5 transition-colors">Discard</button>
                  {userRole === 'doctor' && (
                    <button 
                      onClick={() => savePrescriptionMutation.mutate()} 
                      disabled={savePrescriptionMutation.isPending || !medicines}
                      className="px-8 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {savePrescriptionMutation.isPending ? (
                        <span className="animate-spin material-symbols-outlined text-sm flex">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm flex">medication</span>
                      )}
                      {savePrescriptionMutation.isPending ? 'Saving...' : 'Save Prescription'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Lab' && (
              <div className="p-8 flex flex-col gap-8 grow animate-in fade-in duration-300">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Lab Tests</h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    {userRole === 'nurse' ? 'Review prescribed tests and record results.' : 'Order new tests or review results.'}
                  </p>
                </div>
                
                {userRole !== 'nurse' && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-primary/10 flex gap-4 items-end animate-in slide-in-from-top duration-500">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Select Test Protocol</label>
                      <select 
                        className="w-full p-3 rounded-lg border border-primary/20 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none"
                        value={selectedLabTest}
                        onChange={e => setSelectedLabTest(e.target.value)}
                      >
                        <option value="">-- Choose Test --</option>
                        {labCatalog.map(t => (
                          <option key={t.labtestid} value={t.labtestid}>{t.testcode} - {t.testname}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => orderLabTestMutation.mutate(selectedLabTest)}
                      disabled={!selectedLabTest || orderLabTestMutation.isPending}
                      className="px-8 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 flex items-center gap-2 transition-all disabled:opacity-50 h-[50px]"
                    >
                      <span className="material-symbols-outlined font-black">science</span> Order Test
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-bold">Ordered Tests ({labTests.length})</h3>
                  {labTests.length === 0 ? (
                    <p className="text-slate-500 italic">No lab tests ordered for this case yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {labTests.map(test => (
                        <div key={test.reportid} className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{test.testname} <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">{test.testcode}</span></h4>
                            <p className="text-sm text-slate-500">Ordered: {new Date(test.orderedon).toLocaleString()}</p>
                            {test.resultedon && <p className="text-sm text-slate-500">Resulted: {new Date(test.resultedon).toLocaleString()} by {test.perf_first}</p>}
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Result Value</span>
                              {userRole === 'nurse' && test.status !== 'Resulted' ? (
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    placeholder={test.unit || 'Enter result'}
                                    className="p-2 text-sm rounded border border-primary/20 bg-slate-50 dark:bg-slate-800 outline-none w-24"
                                    value={labResultInputs[test.reportid] || ''}
                                    onChange={(e) => setLabResultInputs(prev => ({ ...prev, [test.reportid]: e.target.value }))}
                                  />
                                  <button 
                                    onClick={() => updateLabTestMutation.mutate({ reportId: test.reportid, testValue: labResultInputs[test.reportid] })}
                                    disabled={!labResultInputs[test.reportid]}
                                    className="px-3 py-1 bg-primary text-white text-xs font-bold rounded hover:bg-primary/90 disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <p className={`text-xl font-black ${test.testvalue ? 'text-slate-900 dark:text-slate-100' : 'text-slate-300'}`}>
                                  {test.testvalue || '--'} <span className="text-sm font-medium text-slate-500">{test.unit}</span>
                                </p>
                              )}
                            </div>
                            
                            <div className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest ${
                              test.status === 'Resulted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {test.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Admission' && userRole === 'nurse' && (
              <div className="p-8 flex flex-col gap-8 grow animate-in fade-in duration-300">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Patient Admission</h2>
                  <p className="text-slate-500 dark:text-slate-400">Admit the patient to a ward or private room.</p>
                </div>
                
                {caseDetail?.isadmitted ? (
                  <div className="flex flex-col items-center justify-center grow p-10 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
                    <span className="material-symbols-outlined text-green-500 text-6xl mb-4">bed</span>
                    <h3 className="text-xl font-bold text-green-800 dark:text-green-400">Patient is Admitted</h3>
                    <p className="text-green-700 dark:text-green-500 mt-2">Room ID: {caseDetail.roomid}</p>
                    <p className="text-sm text-green-600/80 dark:text-green-500/80 mt-1">Admitted on: {new Date(caseDetail.admittedon).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-8 grow">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Select Available Room</label>
                      <select 
                        className="w-full p-3 rounded-lg border border-primary/20 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none max-w-md"
                        value={selectedRoomId}
                        onChange={e => setSelectedRoomId(e.target.value)}
                      >
                        <option value="">-- Choose Room --</option>
                        {availableRooms.map(r => (
                          <option key={r.roomid} value={r.roomid}>Room {r.roomnumber} - {r.type} (${r.pricepernight}/night)</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-start gap-4 pt-4 border-t border-primary/5 mt-auto">
                      <button 
                        onClick={() => admitPatientMutation.mutate()} 
                        disabled={admitPatientMutation.isPending || !selectedRoomId}
                        className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        {admitPatientMutation.isPending ? (
                          <span className="animate-spin material-symbols-outlined text-sm flex">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-sm flex">bed</span>
                        )}
                        {admitPatientMutation.isPending ? 'Admitting...' : 'Admit Patient'}
                      </button>
                      <div className="flex gap-4">
                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-primary hover:bg-primary/5 transition-all font-black uppercase tracking-widest text-[10px] border border-primary/10 no-print"
                        >
                          <span className="material-symbols-outlined text-[16px] font-black">download</span> Download Report
                        </button>
                        <button 
                          onClick={() => setIsTreatmentModalOpen(true)}
                          className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all no-print"
                        >
                          <span className="material-symbols-outlined text-[18px]">medical_services</span>
                          Quick Actions
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}



            {activeTab === 'Appt' && (
              <div className="p-8 flex flex-col gap-8 grow animate-in fade-in duration-300">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Schedule Follow-up</h2>
                  <p className="text-slate-500 dark:text-slate-400">Book the next appointment for this patient.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Date</label>
                    <input 
                      type="date" 
                      className="w-full p-3 rounded-lg border border-primary/20 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                      value={appointmentDate}
                      onChange={e => setAppointmentDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Type</label>
                    <select 
                      className="w-full p-3 rounded-lg border border-primary/20 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                      value={appointmentType}
                      onChange={e => setAppointmentType(e.target.value)}
                    >
                      <option value="Followup">Follow-up</option>
                      <option value="Outpatient">Outpatient</option>
                      <option value="Inpatient">Inpatient</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Start Time</label>
                    <input 
                      type="time" 
                      className="w-full p-3 rounded-lg border border-primary/20 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">End Time</label>
                    <input 
                      type="time" 
                      className="w-full p-3 rounded-lg border border-primary/20 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-primary/5 mt-auto">
                  <button onClick={() => { setAppointmentDate(''); setStartTime(''); setEndTime(''); }} className="px-6 py-2 rounded-lg border border-primary/20 text-primary font-bold hover:bg-primary/5 transition-colors">Clear</button>
                  <button 
                    onClick={() => createAppointmentMutation.mutate()} 
                    disabled={createAppointmentMutation.isPending || !appointmentDate || !startTime || !endTime}
                    className="px-8 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {createAppointmentMutation.isPending ? (
                      <span className="animate-spin material-symbols-outlined text-sm flex">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm flex">event</span>
                    )}
                    {createAppointmentMutation.isPending ? 'Scheduling...' : 'Schedule Appointment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </MainLayout>
  );
};

export default DoctorCaseDetail;
