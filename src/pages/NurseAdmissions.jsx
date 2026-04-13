import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { caseService } from '../services/caseService';

const URGENCY_COLORS = {
  Emergency: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  Urgent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const ROOM_TYPE_COLORS = {
  General: 'bg-blue-100 text-blue-600',
  Private: 'bg-purple-100 text-purple-600',
  ICU: 'bg-rose-100 text-rose-600',
};

const NurseAdmissions = () => {
  const queryClient = useQueryClient();

  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. Get ALL cases (not admitted) — no department restriction
  const { data: allCases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['all-pending-admissions'],
    queryFn: () => caseService.getAll({ isadmitted: 'false' }),
  });

  // 2. Get Available Rooms
  const { data: availableRooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['available-rooms'],
    queryFn: () => caseService.getAvailableRooms(),
  });

  // 3. Admit Mutation
  const admitMutation = useMutation({
    mutationFn: ({ caseId, roomId }) => caseService.admitPatient(caseId, { roomid: parseInt(roomId) }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-pending-admissions']);
      queryClient.invalidateQueries(['available-rooms']);
      setSelectedCase(null);
      setSelectedRoomId('');
      showNotification('Patient admitted and room assigned successfully!');
    },
    onError: (err) => showNotification(`Admission failed: ${err.message}`, 'error'),
  });

  // Filter logic
  const filteredCases = allCases.filter(cs => {
    const name = `${cs.patient?.firstname} ${cs.patient?.lastname}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || String(cs.caserequestid).includes(search);
    const matchStatus = statusFilter === 'All' || cs.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statuses = ['All', 'Open', 'Accepted', 'InProgress'];

  return (
    <MainLayout title="Patient Admissions" hidePadding={true}>

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[999] px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          notification.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {notification.type === 'error' ? 'cancel' : 'check_circle'}
          </span>
          {notification.message}
        </div>
      )}

      {/* Page Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="size-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">bed</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Patient Admissions</h2>
        </div>
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <span className="material-symbols-outlined text-base">meeting_room</span>
          <span>{availableRooms.length} rooms available</span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">

        {/* LEFT PANEL — Patient List */}
        <div className="w-2/5 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/50">

          {/* Search + Filter */}
          <div className="p-5 space-y-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search by name or case ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    statusFilter === s
                      ? 'bg-primary text-white shadow-sm shadow-primary/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Patient List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingCases ? (
              <div className="flex items-center justify-center pt-20">
                <span className="animate-spin material-symbols-outlined text-3xl text-primary">progress_activity</span>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-20 text-slate-400 gap-3">
                <span className="material-symbols-outlined text-5xl">clinical_notes</span>
                <p className="text-sm font-bold">No patients found</p>
                <p className="text-xs text-center max-w-[180px]">Try adjusting your search or filter</p>
              </div>
            ) : (
              filteredCases.map((cs) => (
                <div
                  key={cs.caserequestid}
                  onClick={() => { setSelectedCase(cs); setSelectedRoomId(''); }}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
                    selectedCase?.caserequestid === cs.caserequestid
                      ? 'border-primary bg-white dark:bg-slate-900 shadow-lg shadow-primary/10'
                      : 'border-transparent bg-white dark:bg-slate-900 hover:border-primary/30 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-lg shadow-inner flex-shrink-0">
                      {cs.patient?.firstname?.[0]}{cs.patient?.lastname?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                        {cs.patient?.firstname} {cs.patient?.lastname}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Case #{cs.caserequestid}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${URGENCY_COLORS[cs.urgency] || URGENCY_COLORS.Normal}`}>
                          {cs.urgency}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{cs.status}</span>
                      </div>
                      {cs.department?.name && (
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">domain</span> {cs.department.name}
                        </p>
                      )}
                    </div>
                    {selectedCase?.caserequestid === cs.caserequestid && (
                      <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">check_circle</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Count footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
              {filteredCases.length} patients • {allCases.length} total awaiting admission
            </p>
          </div>
        </div>

        {/* RIGHT PANEL — Room Picker */}
        <div className="flex-1 flex flex-col">
          {!selectedCase ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-12">
              <div className="size-24 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">adaptive_audio_mic</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">Select a Patient</h3>
                <p className="text-slate-400 text-sm max-w-xs">Choose a patient from the list on the left to assign them a room or ward.</p>
              </div>
              <div className="flex items-center gap-8 mt-4">
                <div className="text-center">
                  <p className="text-3xl font-black text-primary">{allCases.length}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Awaiting</p>
                </div>
                <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                  <p className="text-3xl font-black text-emerald-500">{availableRooms.length}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Rooms Free</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
              {/* Selected patient header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-black shadow-lg shadow-primary/20">
                    {selectedCase.patient?.firstname?.[0]}{selectedCase.patient?.lastname?.[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {selectedCase.patient?.firstname} {selectedCase.patient?.lastname}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Case #{selectedCase.caserequestid}
                      </p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${URGENCY_COLORS[selectedCase.urgency] || URGENCY_COLORS.Normal}`}>
                        {selectedCase.urgency}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedCase(null); setSelectedRoomId(''); }}
                  className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Room picker */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Select a Room or Ward
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {availableRooms.length} available
                  </span>
                </div>

                {loadingRooms ? (
                  <div className="flex items-center justify-center pt-16">
                    <span className="animate-spin material-symbols-outlined text-3xl text-primary">progress_activity</span>
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div className="p-10 text-center bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-800/20">
                    <span className="material-symbols-outlined text-4xl text-rose-300 mb-3">no_meeting_room</span>
                    <p className="text-rose-600 dark:text-rose-400 text-sm font-bold">No rooms currently available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {availableRooms.map((room) => (
                      <div
                        key={room.roomid}
                        onClick={() => setSelectedRoomId(String(room.roomid))}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                          selectedRoomId === String(room.roomid)
                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary/40 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ROOM_TYPE_COLORS[room.type] || 'bg-slate-100 text-slate-600'}`}>
                            {room.type}
                          </span>
                          {selectedRoomId === String(room.roomid) && (
                            <span className="material-symbols-outlined text-primary text-xl animate-in zoom-in">check_circle</span>
                          )}
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                          Room {room.roomnumber}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {room.department?.name || 'General Ward'}
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Rate</span>
                          <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                            ₹{room.pricepernight}<span className="text-[10px] text-slate-400 font-normal">/day</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {selectedRoomId && (
                  <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">info</span>
                    <div>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                        Assigning <span className="text-primary">Room {availableRooms.find(r => String(r.roomid) === selectedRoomId)?.roomnumber}</span> to{' '}
                        <span className="text-primary">{selectedCase.patient?.firstname} {selectedCase.patient?.lastname}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">This action will mark the patient as admitted and the room as occupied.</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => admitMutation.mutate({ caseId: selectedCase.caserequestid, roomId: selectedRoomId })}
                  disabled={!selectedRoomId || admitMutation.isPending}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {admitMutation.isPending ? (
                    <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg">bed</span>
                  )}
                  {admitMutation.isPending ? 'Processing Admission...' : 'Confirm Admission & Assign Room'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default NurseAdmissions;
