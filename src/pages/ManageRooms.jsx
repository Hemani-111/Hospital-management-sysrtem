import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomService } from '../services/roomService';
import { departmentService } from '../services/departmentService';

const typeConfig = {
  General:   { color: 'text-primary',    bg: 'bg-primary/5',    icon: 'bed',           badge: 'bg-primary/10 text-primary' },
  ICU:       { color: 'text-amber-600',  bg: 'bg-amber-500/5',  icon: 'monitor_heart', badge: 'bg-amber-100 text-amber-700' },
  Private:   { color: 'text-indigo-600', bg: 'bg-indigo-500/5', icon: 'single_bed',    badge: 'bg-indigo-100 text-indigo-700' },
  Emergency: { color: 'text-rose-600',   bg: 'bg-rose-500/5',   icon: 'emergency',     badge: 'bg-rose-100 text-rose-700' },
};

const ManageRooms = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    roomnumber: '',
    roomtype: 'General',
    departmentid: '',
    pricepernight: 500,
    isoccupied: false
  });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomService.getAll(),
  });

  const { data: stats } = useQuery({
    queryKey: ['room-stats'],
    queryFn: () => roomService.getStats(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => roomService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rooms']);
      queryClient.invalidateQueries(['room-stats']);
      setIsModalOpen(false);
      setFormData({
        roomnumber: '',
        roomtype: 'General',
        departmentid: '',
        pricepernight: 500,
        isoccupied: false
      });
      alert('Room created successfully!');
    }
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.roomnumber || !formData.departmentid) {
       return alert('Please fill in all required fields.');
    }
    createMutation.mutate(formData);
  };

  const filtered = rooms.filter(r => {
    const matchSearch = r.roomnumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.department?.name?.toLowerCase().includes(search.toLowerCase());
    const matchAvail = showAvailableOnly ? !r.isoccupied : true;
    return matchSearch && matchAvail;
  });

  return (
    <MainLayout title="Manage Rooms" hidePadding={true}>
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight">Hospital Infrastructure</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Admin</span>
            <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
            <span className="text-[10px] font-black uppercase text-primary tracking-widest">Wards & Rooms</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary w-64 outline-none font-bold"
              placeholder="Search room or dept..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Room
          </button>
        </div>
      </header>

      <div className="p-8 space-y-8 animate-in fade-in duration-700 bg-background-light dark:bg-slate-950 min-h-[calc(100vh-64px)]">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Inventory</span>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">hotel</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tighter">{stats?.total ?? '0'}</span>
              <span className="text-xs text-slate-400 font-bold">Total Capacity</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Operational Ready</span>
              <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-2 rounded-xl dark:bg-emerald-500/10">check_circle</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tighter text-emerald-600">{stats?.available ?? '0'}</span>
              <span className="text-xs text-emerald-500 font-bold uppercase tracking-widest">
                {stats?.total > 0 ? `${Math.round((stats.available / stats.total) * 100)}% Available` : '0% Available'}
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Currently Occupied</span>
              <span className="material-symbols-outlined text-rose-500 bg-rose-50 p-2 rounded-xl dark:bg-rose-500/10">cancel</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tighter text-rose-600">{stats?.occupied ?? '0'}</span>
              <span className="text-xs text-rose-500 font-bold uppercase tracking-widest">
                {stats?.total > 0 ? `${Math.round((stats.occupied / stats.total) * 100)}% Utilized` : '0% Utilized'}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{filtered.length} rooms listed in directory</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Filter: Available units only</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input className="sr-only peer" type="checkbox" checked={showAvailableOnly} onChange={e => setShowAvailableOnly(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Room Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing room data...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No matching facility records found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((room) => {
              const cfg = typeConfig[room.roomtype] || typeConfig.General;
              return (
                <div key={room.roomid} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`h-32 ${cfg.bg} flex items-center justify-center relative`}>
                    <div className={`absolute top-4 left-4 px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-black ${cfg.color} uppercase tracking-widest shadow-sm`}>{room.roomtype}</div>
                    <span className="material-symbols-outlined text-slate-200 dark:text-slate-800 text-6xl">{cfg.icon}</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-black tracking-tight">{room.roomnumber}</h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">{room.department?.name || 'General Clinic'}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${!room.isoccupied ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {room.isoccupied ? 'Occupied' : 'Vacant'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Price / Day</span>
                          <span className="text-lg font-black tracking-tighter text-slate-900 dark:text-slate-100">₹{room.pricepernight}</span>
                       </div>
                       <button className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary transition-all active:scale-90">
                          <span className="material-symbols-outlined text-[20px]">edit_note</span>
                       </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                 <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Register New Unit</h2>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                       <span className="material-symbols-outlined">close</span>
                    </button>
                 </div>
                 <p className="text-slate-500 font-medium text-sm">Expand the hospital capacity by adding a new operational room.</p>
              </div>

              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Room Number</label>
                       <input 
                        name="roomnumber"
                        placeholder="e.g. ICU-001"
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" 
                        value={formData.roomnumber}
                        onChange={handleInputChange}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Room Class</label>
                       <select 
                        name="roomtype"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" 
                        value={formData.roomtype}
                        onChange={handleInputChange}
                       >
                          <option value="General">General Ward</option>
                          <option value="Private">Private Suite</option>
                          <option value="ICU">ICU Unit</option>
                          <option value="Emergency">Emergency Bay</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Department</label>
                       <select 
                        name="departmentid"
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" 
                        value={formData.departmentid}
                        onChange={handleInputChange}
                       >
                          <option value="">Select Dept</option>
                          {departments.map(d => <option key={d.departmentid} value={d.departmentid}>{d.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Daily Tariff (₹)</label>
                       <input 
                        type="number"
                        name="pricepernight"
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" 
                        value={formData.pricepernight}
                        onChange={handleInputChange}
                       />
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-500 hover:bg-white transition-all uppercase tracking-widest">Cancel</button>
                 <button type="submit" disabled={createMutation.isLoading} className="flex-1 px-6 py-3 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all uppercase tracking-widest active:scale-95 disabled:opacity-50">Create Unit</button>
              </div>
           </form>
        </div>
      )}
    </MainLayout>
  );
};

export default ManageRooms;
