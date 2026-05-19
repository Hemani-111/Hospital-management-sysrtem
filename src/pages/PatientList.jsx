import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import { caseService } from '../services/caseService';
import { billingService } from '../services/billingService';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

const PatientList = () => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [bloodFilter, setBloodFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'history', 'assessments'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { session } = useAuthStore();
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.getAll()
  });

  const { data: patientHistory, isLoading: loadHistory } = useQuery({
    queryKey: ['patient-history', selectedPatient?.patientid],
    queryFn: () => patientService.getCases(selectedPatient.patientid),
    enabled: !!selectedPatient && activeTab === 'history'
  });

  const { data: patientAssessments, isLoading: loadAssessments } = useQuery({
    queryKey: ['patient-assessments', selectedPatient?.patientid],
    queryFn: () => patientService.getAssessments(selectedPatient.patientid),
    enabled: !!selectedPatient && activeTab === 'assessments'
  });

  const dischargeMutation = useMutation({
    mutationFn: async (caseId) => {
      // 1. Discharge patient
      await caseService.dischargePatient(caseId);
      // 2. Generate automated bill
      await billingService.generateBill(caseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patients']);
      addToast('Patient discharged and bill generated!', 'success');
      setSelectedPatient(null);
    },
    onError: (err) => addToast(`Discharge failed: ${err.message}`, 'error')
  });

  const updateMutation = useMutation({
    mutationFn: (data) => patientService.update(selectedPatient.patientid, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries(['patients']);
      setSelectedPatient(updated);
      setIsEditModalOpen(false);
      addToast('Patient information updated!', 'success');
    },
    onError: (err) => addToast(`Update failed: ${err.message}`, 'error')
  });

  const handleEditClick = () => {
    setEditForm({ ...selectedPatient });
    setIsEditModalOpen(true);
  };

  const handlePrint = () => {
    // Basic print trick: filter everything except a print-specific div or just print the whole page
    // For a professional demo, we'll just trigger the browser print.
    window.print();
  };

  const filteredPatients = (patients || []).filter(pt => {
    const matchesSearch = `${pt.firstname} ${pt.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pt.phonenumber?.includes(searchTerm) ||
      pt.patientid?.toString().includes(searchTerm);
    
    const matchesGender = genderFilter === 'All' || pt.gender === genderFilter;
    const matchesBlood = bloodFilter === 'All' || pt.bloodgroup === bloodFilter;

    return matchesSearch && matchesGender && matchesBlood;
  });

  return (
    <MainLayout title="Patient List" hidePadding={true}>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between">
        <nav className="flex items-center gap-2 text-xs md:sm">
          <span className="text-slate-400 hidden sm:inline">Admin</span>
          <span className="material-symbols-outlined text-[10px] text-slate-400 hidden sm:inline">chevron_right</span>
          <span className="text-primary font-semibold">Patient List</span>
        </nav>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden sm:flex items-center gap-4 border-r border-slate-200 dark:border-slate-800 pr-6">
            <button className="text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden xs:block">
              <p className="text-xs md:sm font-semibold">{session?.user?.user_metadata?.first_name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{session?.user?.role || 'Staff'}</p>
            </div>
            <div className="size-8 md:size-10 rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.email}&backgroundColor=e0f2fe`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-background-light dark:bg-background-dark print:hidden">
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row flex-1 gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                  placeholder="Search..." 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="flex-1 sm:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 outline-none"
                >
                  <option value="All">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <select 
                  value={bloodFilter}
                  onChange={(e) => setBloodFilter(e.target.value)}
                  className="flex-1 sm:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 outline-none"
                >
                  <option value="All">All Blood</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
            <button 
              onClick={() => navigate('/patients/create')}
              className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all text-sm shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span className="whitespace-nowrap">New Patient</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-premium overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[800px] md:min-w-0">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Patient Identity</th>
                  <th className="px-8 py-5 hidden sm:table-cell">Demographics</th>
                  <th className="px-8 py-5 hidden lg:table-cell">Contact</th>
                  <th className="px-8 py-5 hidden md:table-cell">Life Metrics</th>
                  <th className="px-8 py-5">Case Summary</th>
                  <th className="px-8 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] md:text-sm">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan="6" className="p-0">
                        <Skeleton variant="table-row" />
                      </td>
                    </tr>
                  ))
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState 
                        title="No patients found" 
                        description={searchTerm ? `We couldn't find any patient matching "${searchTerm}"` : "The patient database is currently empty."}
                        icon="person_search"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((pt) => (
                    <tr key={pt.patientid} className={`transition-all duration-300 cursor-pointer ${selectedPatient?.patientid === pt.patientid ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`} onClick={() => setSelectedPatient(pt)}>
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 mb-0.5 md:mb-1 uppercase tracking-widest">#PT-{pt.patientid}</p>
                        <p className={`font-black tracking-tight ${selectedPatient?.patientid === pt.patientid ? 'text-primary' : 'text-slate-900 dark:text-white text-sm md:text-base'}`}>{pt.firstname} {pt.lastname}</p>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 hidden sm:table-cell">
                         <div className="flex flex-col gap-0.5">
                            <span className="text-slate-600 dark:text-slate-300 font-bold">{pt.dateofbirth ? new Date().getFullYear() - new Date(pt.dateofbirth).getFullYear() : 'N/A'} Years</span>
                            <span className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-wider">{pt.gender}</span>
                         </div>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 hidden lg:table-cell">
                         <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xs md:text-sm text-slate-300">call</span>
                            <span className="text-slate-600 dark:text-slate-300 font-medium">{pt.phonenumber}</span>
                         </div>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 hidden md:table-cell">
                        <span className={`px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800`}>
                          {pt.bloodgroup || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        {pt.caserequestid ? (
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-tight w-fit ${pt.isadmitted ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              {pt.case_status} {pt.isadmitted ? `• Rm ${pt.roomnumber}` : ''}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold">CAS-{pt.caserequestid}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-medium">No Active Case</span>
                        )}
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          {pt.isadmitted && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); dischargeMutation.mutate(pt.caserequestid); }}
                              disabled={dischargeMutation.isPending}
                              className="px-2 md:px-4 py-1.5 md:py-2 bg-rose-500 text-white rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all"
                            >
                              {dischargeMutation.isPending ? '...' : 'Out'}
                            </button>
                          )}
                          <button className={`px-3 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${selectedPatient?.patientid === pt.patientid ? 'bg-primary text-white' : 'text-primary'}`}>
                            {selectedPatient?.patientid === pt.patientid ? 'View' : 'Inspect'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <span>Displaying {filteredPatients.length} records</span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50">
                <span className="material-symbols-outlined text-sm font-black">chevron_left</span>
              </button>
              <button className="px-4 py-1.5 rounded-lg bg-primary text-white shadow-lg shadow-primary/20">1</button>
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Right Side Modal Overlay (Slide-out) */}
        {selectedPatient && (
          <div className="fixed inset-y-0 right-0 w-full md:w-[35%] md:min-w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-[60] md:z-10 transition-all duration-500 transform translate-x-0 print:translate-x-0 print:border-none print:shadow-none print:w-full print:fixed print:inset-0 print:z-[1000] print:bg-white print:overflow-visible">
            <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4 print:mb-8">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white print:text-3xl print:text-primary">Patient Summary</h2>
                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer print:hidden" onClick={() => setSelectedPatient(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex items-center gap-4">
                <img alt="Patient Avatar" className="h-16 w-16 rounded-xl border border-slate-200 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwS6-dB698BKS0PU5yPdmXRmaoVya-8Dg3Q03afS2Z-5-hqR2htNRlrDjH5nWLlgx1UvCqqVq7YsMQ7yXjodjcyzcljBufdZs472NYWhAFCpHlEWjATxmcOJvB8453WhSzrysVrSm0uAe5X_N3WVOtg1W0sC0pskBhNrOhPXhmQ5SzjKsLjTIk_IV36QkGB1HxGwMuMx2oOPKsapnXj_Xa59jnm1MHZey-GEI-kAaTIBQGg46WjfhArQuIzo4hpN4JXGWNTIfs97g" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-none">{selectedPatient.firstname} {selectedPatient.lastname}</h3>
                  <p className="text-sm text-slate-500 mt-1">#PT-{selectedPatient.patientid} • {selectedPatient.dateofbirth ? new Date().getFullYear() - new Date(selectedPatient.dateofbirth).getFullYear() : 'N/A'}Y • {selectedPatient.gender}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">{selectedPatient.isregistered ? 'Registered' : 'New'}</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">{selectedPatient.bloodgroup}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex border-b border-slate-200 print:hidden">
              <button 
                onClick={() => setActiveTab('personal')}
                className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 'personal' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
              >Personal Info</button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
              >Case History</button>
              <button 
                onClick={() => setActiveTab('assessments')}
                className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 'assessments' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
              >Assessments</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar print:overflow-visible print:p-0 print:space-y-12">
              <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-100">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Medical Record • {new Date().toLocaleDateString()}</p>
              </div>

              {/* Show all sections in print mode regardless of active tab */}
              <div className="print:block space-y-12">
              {activeTab === 'personal' && (
                <>
                  <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Demographics</h4>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Contact Number</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedPatient.phonenumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Emergency Contact</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedPatient.emergencycontact || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Signup Code</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedPatient.signupcode || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Joined On</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedPatient.createdon ? new Date(selectedPatient.createdon).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Residential Address</h4>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex gap-3">
                        <span className="material-symbols-outlined text-slate-400 text-lg">location_on</span>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {selectedPatient.addressline1}, <br/>
                            {selectedPatient.addressline2 && <>{selectedPatient.addressline2}, <br/></>}
                            {selectedPatient.city}, {selectedPatient.state} - {selectedPatient.postalcode}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Insurance Details</h4>
                    {selectedPatient.insurance_provider ? (
                      <div className="relative overflow-hidden bg-primary text-white rounded-xl p-5 shadow-lg shadow-primary/20">
                        <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                        <div className="relative">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">Provider</p>
                              <h5 className="text-lg font-bold">{selectedPatient.insurance_provider}</h5>
                            </div>
                            <span className="px-2 py-1 bg-emerald-400/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-400/30 flex items-center gap-1 uppercase">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Active
                            </span>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">Policy Number</p>
                              <p className="font-mono text-sm tracking-widest leading-none">{selectedPatient.insurance_policy || 'N/A'}</p>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">Coverage Amount</p>
                                <p className="text-xl font-bold">₹{parseFloat(selectedPatient.insurance_coverage || 0).toLocaleString()}</p>
                              </div>
                              <span className="material-symbols-outlined text-3xl opacity-40">credit_card</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50">
                        <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">shield_off</span>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Insurance Details Found</p>
                        <p className="text-[10px] text-slate-400 mt-1">Patient is currently paying out-of-pocket</p>
                      </div>
                    )}
                  </section>
                </>
              )}

              {activeTab === 'history' && (
                <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Medical Case History</h4>
                  {loadHistory ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                    </div>
                  ) : patientHistory?.length === 0 ? (
                    <div className="text-center py-10">
                      <span className="material-symbols-outlined text-slate-200 text-5xl">folder_off</span>
                      <p className="text-slate-400 text-xs font-bold mt-2 italic">No case history found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patientHistory?.map(c => (
                        <div key={c.caserequestid} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group">
                          <div className="flex justify-between items-start mb-2">
                             <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'}`}>
                               {c.status}
                             </span>
                             <span className="text-[10px] text-slate-400 font-bold">#{new Date(c.createdon).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm font-black text-slate-900 line-clamp-2 mb-2">{c.casesummary}</p>
                          <div className="flex items-center gap-2 mt-auto">
                             <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                               <span className="material-symbols-outlined text-sm">medical_services</span>
                             </div>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                               {c.doctor ? `Dr. ${c.doctor.lastname}` : 'Unassigned'} • {c.department?.name}
                             </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'assessments' && (
                <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Triage Assessment History</h4>
                  {loadAssessments ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                    </div>
                  ) : patientAssessments?.length === 0 ? (
                    <div className="text-center py-10">
                      <span className="material-symbols-outlined text-slate-200 text-5xl">assignment_late</span>
                      <p className="text-slate-400 text-xs font-bold mt-2 italic">No triage records found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patientAssessments?.map(a => (
                        <div key={a.assessmentid} className="p-5 rounded-3xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden relative">
                          <div className="absolute top-0 right-0 p-3">
                             <span className={`px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${a.urgency === 'High' ? 'bg-rose-500 text-white' : 'bg-slate-100'}`}>
                               {a.urgency} Priority
                             </span>
                          </div>
                          <div className="flex items-center gap-4 mb-4">
                             <div className="text-center">
                               <p className="text-lg font-black text-slate-900 leading-none">{new Date(a.assessmentdate).getDate()}</p>
                               <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">{new Date(a.assessmentdate).toLocaleString('default', { month: 'short' })}</p>
                             </div>
                             <div className="h-8 w-px bg-slate-100"></div>
                             <div>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Nurse Assessor</p>
                               <p className="text-xs font-black text-slate-700">{a.nurse_firstname ? `Nurse ${a.nurse_lastname}` : 'System'}</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-50 mb-3 text-center">
                             <div>
                               <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">BP</p>
                               <p className="text-xs font-black text-slate-900">{a.bloodpressure}</p>
                             </div>
                             <div>
                               <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Temp</p>
                               <p className="text-xs font-black text-slate-900">{a.temperature}°C</p>
                             </div>
                             <div>
                               <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">BPM</p>
                               <p className="text-xs font-black text-slate-900">{a.heartrate}</p>
                             </div>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed italic line-clamp-2">"{a.symptoms}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              </div>

              <div className="pt-4 space-y-3 print:hidden">
                  {selectedPatient.isadmitted && (
                    <button 
                      onClick={() => dischargeMutation.mutate(selectedPatient.caserequestid)}
                      disabled={dischargeMutation.isPending}
                      className="w-full bg-rose-500 text-white font-black py-4 rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-rose-200"
                    >
                      <span className="material-symbols-outlined text-lg font-black">logout</span>
                      {dischargeMutation.isPending ? 'Processing Discharge...' : 'Discharge Patient'}
                    </button>
                  )}
                  <button 
                    onClick={handleEditClick}
                    className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                      <span className="material-symbols-outlined text-lg">edit</span>
                      Edit Information
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="w-full bg-white text-primary font-bold py-3 rounded-xl border border-primary/20 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                      <span className="material-symbols-outlined text-lg">print</span>
                      Print Summary
                  </button>
              </div>

              <div className="hidden print:block pt-12 mt-12 border-t border-slate-100 italic text-slate-400 text-[10px] text-center">
                This is a computer-generated summary for internal use only. Authorized signature required for clinical validity.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 h-auto max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-primary/5">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Edit Patient Record</h3>
                <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mt-1">Admin Privilege Area</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
              <section className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">First Name</label>
                  <input 
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/10 outline-none font-bold"
                    value={editForm.firstname} 
                    onChange={e => setEditForm({...editForm, firstname: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Last Name</label>
                  <input 
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/10 outline-none font-bold"
                    value={editForm.lastname} 
                    onChange={e => setEditForm({...editForm, lastname: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Date of Birth</label>
                  <input 
                    type="date"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/10 outline-none font-bold"
                    value={editForm.dateofbirth ? editForm.dateofbirth.split('T')[0] : ''} 
                    onChange={e => setEditForm({...editForm, dateofbirth: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Contact Phone</label>
                  <input 
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/10 outline-none font-bold font-mono"
                    value={editForm.phonenumber} 
                    onChange={e => setEditForm({...editForm, phonenumber: e.target.value})}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-900 border-l-4 border-primary pl-4">Location Details</h4>
                <div className="space-y-4">
                  <input 
                    placeholder="Address Line 1"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none"
                    value={editForm.addressline1} 
                    onChange={e => setEditForm({...editForm, addressline1: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="City"
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none"
                      value={editForm.city} 
                      onChange={e => setEditForm({...editForm, city: e.target.value})}
                    />
                    <input 
                      placeholder="Postal Code"
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none"
                      value={editForm.postalcode} 
                      onChange={e => setEditForm({...editForm, postalcode: e.target.value})}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-900 border-l-4 border-amber-500 pl-4">Insurance & Coverage</h4>
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none font-bold"
                    value={editForm.insurance}
                    onChange={e => setEditForm({...editForm, insurance: e.target.value})}
                  >
                    <option value="">No Insurance</option>
                    <option value="Star Health">Star Health</option>
                    <option value="LIC Medical">LIC Medical</option>
                    <option value="Care Health">Care Health</option>
                    <option value="HDFC Ergo">HDFC Ergo</option>
                  </select>
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-4 text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => updateMutation.mutate(editForm)}
                disabled={updateMutation.isPending}
                className="flex-1 py-4 text-sm font-black uppercase tracking-widest bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default PatientList;
