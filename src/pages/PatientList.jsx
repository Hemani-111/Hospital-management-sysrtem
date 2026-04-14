import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

const PatientList = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [bloodFilter, setBloodFilter] = useState('All');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.getAll()
  });

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
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Admin</span>
          <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
          <span className="text-primary font-semibold">Patient List</span>
        </nav>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-r border-slate-200 pr-6">
            <button className="relative text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="text-slate-500 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">John Doe</p>
              <p className="text-xs text-slate-400">System Administrator</p>
            </div>
            <img alt="Admin Avatar" className="h-10 w-10 rounded-full border border-slate-200 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCym7_1UWp2gDlf-eSz7y0PSwnZvscE1fLo0Eu0TW1H-AMgIQF8nka7rlvvU6suQDYb5QZknHsDrnFMOZwxu7u4f4jhPtrZr5Fpr5NplNsiJ-Y4R0qtLvlllJ1933Jg_RMKO_zaXaW7VtFT1tET_motgshQwwstK-CFHd4EN4c3QxE2QFhYgLcYYzFSIzMeSz_xUCiZwV8J1H3R-EKtcnlg-E-R0HYglrSwn7zje1lnWqehPwHFng3M_pT-7Mls0dc4QXhp5fZBSZU" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto bg-background-light">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 min-w-[300px] gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                <input 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  placeholder="Search patients by name, ID or phone..." 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="All">Gender: All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <select 
                  value={bloodFilter}
                  onChange={(e) => setBloodFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="All">Blood Group: All</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-all">
              <span className="material-symbols-outlined text-sm">add</span>
              New Patient
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Patient Identity</th>
                  <th className="px-8 py-5">Demographics</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Life Metrics</th>
                  <th className="px-8 py-5">Case Summary</th>
                  <th className="px-8 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
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
                      <td className="px-8 py-5">
                        <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">#PT-{pt.patientid}</p>
                        <p className={`font-black tracking-tight ${selectedPatient?.patientid === pt.patientid ? 'text-primary' : 'text-slate-900 dark:text-white text-base'}`}>{pt.firstname} {pt.lastname}</p>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex flex-col gap-0.5">
                            <span className="text-slate-600 dark:text-slate-300 font-bold">{pt.dateofbirth ? new Date().getFullYear() - new Date(pt.dateofbirth).getFullYear() : 'N/A'} Years</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{pt.gender}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-300">call</span>
                            <span className="text-slate-600 dark:text-slate-300 font-medium">{pt.phonenumber}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800`}>
                          {pt.bloodgroup || 'N/A'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-slate-500 font-bold italic">No active cases</td>
                      <td className="px-8 py-5 text-center">
                        <button className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedPatient?.patientid === pt.patientid ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-primary hover:bg-primary/5'}`}>
                          {selectedPatient?.patientid === pt.patientid ? 'Viewing' : 'Inspect'}
                        </button>
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
          <div className="w-[35%] min-w-[350px] bg-white border-l border-slate-200 shadow-2xl flex flex-col z-10 transition-transform duration-300 transform translate-x-0">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Patient Details</h2>
                <button className="text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setSelectedPatient(null)}>
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
            
            <div className="flex border-b border-slate-200">
              <button className="flex-1 py-3 text-sm font-bold text-primary border-b-2 border-primary">Personal Info</button>
              <button className="flex-1 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">Case History</button>
              <button className="flex-1 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">Assessments</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
                <div className="relative overflow-hidden bg-primary text-white rounded-xl p-5 shadow-lg shadow-primary/20">
                  <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                  <div className="relative">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">Provider</p>
                        <h5 className="text-lg font-bold">{selectedPatient.insurance || 'No Coverage'}</h5>
                      </div>
                      <span className="px-2 py-1 bg-emerald-400/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-400/30 flex items-center gap-1 uppercase">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Active
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">Policy Number</p>
                        <p className="font-mono text-sm tracking-widest">SH-2024-8839-2910</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">Coverage Amount</p>
                          <p className="text-xl font-bold">₹2,00,000</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl opacity-40">credit_card</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-4 space-y-3">
                  <button className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md">
                      <span className="material-symbols-outlined text-lg">edit</span>
                      Edit Information
                  </button>
                  <button className="w-full bg-white text-primary font-bold py-3 rounded-xl border border-primary/20 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-lg">print</span>
                      Print Summary
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PatientList;
