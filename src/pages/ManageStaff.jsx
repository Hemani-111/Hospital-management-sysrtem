import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';

const roleColors = {
  Doctor:        'bg-blue-100 text-blue-700',
  Nurse:         'bg-green-100 text-green-700',
  Admin:         'bg-purple-100 text-purple-700',
};

const shiftIcon = { Morning: 'wb_sunny', Evening: 'bedtime', Night: 'dark_mode' };

const EMPTY_FORM = {
  firstname: '', lastname: '', employeetype: 'Nurse',
  departmentid: '', employeenumber: '',
  dateofbirth: '', gender: 'Male', phonenumber: '',
  addressline1: '', addressline2: '', city: '', state: '',
  postalcode: '', country: 'India',
  shifttype: 'Morning', joiningdate: new Date().toISOString().split('T')[0],
  isactive: true,
};

const EMPTY_DOCTOR = {
  specialization: '', licensenumber: '', qualification: '',
  experienceyears: '', consultationfee: '',
};

const ManageStaff = () => {
  const queryClient = useQueryClient();
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modal state
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isEditMode, setIsEditMode]     = useState(false);
  const [selectedId, setSelectedId]     = useState(null);
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [doctorData, setDoctorData]     = useState(EMPTY_DOCTOR);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // New success state
  const [notification, setNotification] = useState(null);

  // ------ Utility ------
  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ------ Queries ------
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => employeeService.getAll(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  });

  // ------ Mutations ------
  const createMutation = useMutation({
    mutationFn: ({ profile, doctor }) => employeeService.createStaff(profile, doctor),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      setShowSuccessModal(true); 
    },
    onError: (err) => notify(`Error: ${err.message}`, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => employeeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      closeModal();
      notify('Staff record updated successfully!');
    },
    onError: (err) => notify(`Error: ${err.message}`, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => employeeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      notify('Staff member removed.');
    },
    onError: (err) => notify(`Error: ${err.message}`, 'error'),
  });

  // ------ Handlers ------
  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedId(null);
    // Generate a more robust unique number: EMP-24-[RandomHEX]
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).toUpperCase().slice(-4);
    const newEmpNum = `EMP-${yearSuffix}-${randomHex}`;
    
    setFormData({ ...EMPTY_FORM, employeenumber: newEmpNum });
    setDoctorData(EMPTY_DOCTOR);
    setShowSuccessModal(false);
    setIsModalOpen(true);
  };

  const openEditModal = (s) => {
    setIsEditMode(true);
    setSelectedId(s.employeeid);
    setFormData({
      firstname: s.firstname, lastname: s.lastname, employeetype: s.employeetype,
      departmentid: s.departmentid, employeenumber: s.employeenumber,
      dateofbirth: s.dateofbirth || '', gender: s.gender || 'Male',
      phonenumber: s.phonenumber || '', addressline1: s.addressline1 || '',
      addressline2: s.addressline2 || '', city: s.city || '', state: s.state || '',
      postalcode: s.postalcode || '', country: s.country || 'India',
      shifttype: s.shifttype || 'Morning', joiningdate: s.joiningdate || '',
      isactive: s.isactive,
    });
    if (s.doctorprofile) {
      setDoctorData({
        specialization: s.doctorprofile.specialization,
        licensenumber: s.doctorprofile.licensenumber,
        qualification: s.doctorprofile.qualification,
        experienceyears: s.doctorprofile.experienceyears,
        consultationfee: s.doctorprofile.consultationfee,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Remove ${name} from the system? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleDrChange = (e) => setDoctorData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstname || !formData.lastname || !formData.departmentid) {
      return alert('Please fill all required fields (First Name, Last Name, Department).');
    }
    if (isEditMode) {
      // On edit, don't touch signupcode or userid
      const { signupcode, userid, ...editPayload } = formData;
      updateMutation.mutate({ id: selectedId, data: editPayload });
    } else {
      createMutation.mutate({
        profile: formData,
        doctor: formData.employeetype === 'Doctor' ? doctorData : null,
      });
    }
  };

  // ------ Filter ------
  const filtered = staff.filter(s => {
    const name = `${s.firstname} ${s.lastname}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || s.employeenumber?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || s.employeetype === roleFilter;
    return matchSearch && matchRole;
  });

  // ====================
  // RENDER
  // ====================
  return (
    <MainLayout title="Manage Staff" hidePadding={true}>
      {/* --- Notification Toast --- */}
      {notification && (
        <div className="fixed top-20 right-8 z-[100] animate-in slide-in-from-right-10 duration-500">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            notification.type === 'error' 
              ? 'bg-rose-50 border-rose-100 text-rose-700' 
              : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}>
            <span className="material-symbols-outlined">
              {notification.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <p className="text-sm font-black uppercase tracking-tight">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-4 opacity-50 hover:opacity-100">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Portal Admin</span>
          <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
          <span className="text-primary font-black uppercase tracking-widest text-[10px]">Workforce</span>
        </nav>
        <button
          onClick={openAddModal}
          className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Register New Employee
        </button>
      </header>

      <div className="p-8 space-y-8 animate-in fade-in duration-700 bg-background-light dark:bg-slate-950 min-h-[calc(100vh-64px)]">
        {/* Title */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Hospital Workforce</h1>
            <p className="text-slate-500 font-medium mt-1">Manage doctors, nurses, and administrative personnel.</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{staff.length}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Personnel</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          {/* Filters */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex gap-4 flex-wrap bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400">search</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                placeholder="Search by name or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl">
              {['All', 'Doctor', 'Nurse', 'Admin'].map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-4 py-1 rounded-lg text-xs font-black transition-all ${roleFilter === role ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {role}{role !== 'All' ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-5">Employee</th>
                  <th className="px-8 py-5">ID Number</th>
                  <th className="px-8 py-5">Role</th>
                  <th className="px-8 py-5">Department</th>
                  <th className="px-8 py-5">Shift</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {isLoading ? (
                  <tr><td colSpan="7" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading personnel...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No records found.</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.employeeid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden ring-4 ring-slate-100 dark:ring-slate-800">
                          <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.lastname}&backgroundColor=b6e3f4`} alt="Avatar" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-slate-100 text-base leading-none mb-1">{s.firstname} {s.lastname}</p>
                          <span className="text-[10px] font-bold text-slate-400">{s.phonenumber || 'No phone'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-400 font-mono font-black text-xs">{s.employeenumber}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${roleColors[s.employeetype] || 'bg-slate-100 text-slate-600'}`}>
                        {s.employeetype}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-600 dark:text-slate-400">{s.department?.name || '—'}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500 font-bold">
                        <span className="material-symbols-outlined text-sm">{shiftIcon[s.shifttype] || 'schedule'}</span>
                        {s.shifttype || 'Flexible'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {s.userid ? (
                        <div className="space-y-1">
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Registered
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Pending Setup
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditModal(s)} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all active:scale-95" title="Edit">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(s.employeeid, `${s.firstname} ${s.lastname}`)} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95" title="Delete">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* ADD / EDIT FORM */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {isEditMode ? 'Update Employee' : 'Register New Employee'}
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  {isEditMode ? 'Update professional record.' : 'Fill in details — the Employee ID will be used for activation.'}
                </p>
              </div>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto p-8 space-y-8 flex-1">

                {/* --- Personal --- */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">person</span>
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Personal Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">First Name *</label>
                      <input name="firstname" required value={formData.firstname} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Name *</label>
                      <input name="lastname" required value={formData.lastname} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date of Birth</label>
                      <input name="dateofbirth" type="date" value={formData.dateofbirth} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone Number</label>
                      <input name="phonenumber" type="tel" value={formData.phonenumber} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                </section>

                {/* --- Employment --- */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">work</span>
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Employment Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee Number *</label>
                      <input name="employeenumber" required value={formData.employeenumber} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold font-mono outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Role / Type *</label>
                      <select name="employeetype" value={formData.employeetype} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="Doctor">Doctor</option>
                        <option value="Nurse">Nurse</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Department *</label>
                      <select name="departmentid" required value={formData.departmentid} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.departmentid} value={d.departmentid}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Shift Type</label>
                      <select name="shifttype" value={formData.shifttype} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="Morning">Morning</option>
                        <option value="Evening">Evening</option>
                        <option value="Night">Night</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Joining Date</label>
                      <input name="joiningdate" type="date" value={formData.joiningdate} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                </section>

                {/* --- Doctor Profile (conditional) --- */}
                {formData.employeetype === 'Doctor' && (
                  <section className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-blue-500">medical_information</span>
                      <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Medical Profile</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Specialization</label>
                        <input name="specialization" placeholder="e.g. Cardiology" value={doctorData.specialization} onChange={handleDrChange}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">License Number</label>
                        <input name="licensenumber" placeholder="MCI/NMC Reg. No." value={doctorData.licensenumber} onChange={handleDrChange}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Qualification</label>
                        <input name="qualification" placeholder="e.g. MBBS, MD (Cardiology)" value={doctorData.qualification} onChange={handleDrChange}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Experience (Years)</label>
                        <input name="experienceyears" type="number" min="0" value={doctorData.experienceyears} onChange={handleDrChange}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Consultation Fee (₹)</label>
                        <input name="consultationfee" type="number" min="0" value={doctorData.consultationfee} onChange={handleDrChange}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    </div>
                  </section>
                )}

                {/* --- Address --- */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Address</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Address Line 1</label>
                      <input name="addressline1" value={formData.addressline1} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Address Line 2</label>
                      <input name="addressline2" value={formData.addressline2} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">City</label>
                      <input name="city" value={formData.city} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">State</label>
                      <input name="state" value={formData.state} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Postal Code</label>
                      <input name="postalcode" value={formData.postalcode} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Country</label>
                      <input name="country" value={formData.country} onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4 flex-shrink-0 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-500 hover:bg-white transition-all uppercase tracking-widest">
                  Cancel
                </button>
                <button type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-[2] px-6 py-3 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60">
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                  )}
                  {isEditMode ? 'Update Record' : 'Register Employee'}
                </button>
              </div>
            </form>
        </div>
      )}

      {/* --- Success Modal --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/10">
              <span className="material-symbols-outlined text-4xl text-emerald-600 dark:text-emerald-400">person_add</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">Staff Registered</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                The profile has been created. Please share the <strong>Employee ID</strong> below with the staff member to complete their registration.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee ID</span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono font-black text-primary tracking-wider">{formData.employeenumber}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(formData.employeenumber);
                    notify('Employee ID copied!');
                  }}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:text-primary transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-base">content_copy</span>
                </button>
              </div>
            </div>

            <button 
              onClick={() => { setShowSuccessModal(false); closeModal(); }}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ManageStaff;
