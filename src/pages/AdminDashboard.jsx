import React from 'react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

import { useQuery } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import { caseService } from '../services/caseService';
import { employeeService } from '../services/employeeService';
import { roomService } from '../services/roomService';
import { departmentService } from '../services/departmentService';
import { analyticsService } from '../services/analyticsService';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const deptVisuals = {
  'Cardiology': { icon: 'favorite', color: 'rose' },
  'Neurology': { icon: 'psychology', color: 'purple' },
  'Gen Med': { icon: 'stethoscope', color: 'blue' },
  'General Medicine': { icon: 'medical_information', color: 'blue' },
  'Emergency': { icon: 'emergency', color: 'amber' },
  'Pediatrics': { icon: 'child_care', color: 'emerald' },
  'Pathology': { icon: 'biotech', color: 'indigo' },
  'Radiology': { icon: 'settings_overscan', color: 'slate' },
  'Surgery': { icon: 'content_cut', color: 'cyan' },
  'ICU': { icon: 'monitor_heart', color: 'rose' },
  'default': { icon: 'domain', color: 'primary' }
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Fetch real stats
  const { data: patients, isLoading: loadPatients } = useQuery({ queryKey: ['patients'], queryFn: () => patientService.getAll() });
  const { data: cases, isLoading: loadCases } = useQuery({ queryKey: ['cases'], queryFn: () => caseService.getAll() });
  const { data: staff, isLoading: loadStaff } = useQuery({ queryKey: ['staff'], queryFn: () => employeeService.getAll() });
  const { data: roomStats, isLoading: loadRooms } = useQuery({ 
    queryKey: ['rooms-stats'], 
    queryFn: () => roomService.getStats() 
  });
  const { data: deptStats = [], isLoading: loadDepts } = useQuery({
    queryKey: ['dept-stats'],
    queryFn: () => departmentService.getStats()
  });
  const { data: analyticsData, isLoading: loadAnalytics } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsService.getOverview()
  });

  const isGlobalLoading = loadPatients || loadCases || loadStaff || loadRooms || loadDepts || loadAnalytics;

  const COLORS = ['#6366f1', '#64748b', '#22c55e', '#ef4444'];

  const rooms = roomStats?.available || 0;

  const stats = [
    { title: 'Total Patients', value: patients?.length || '0', icon: 'person', color: 'blue', trend: (patients?.length || 0) > 100 ? '+12%' : 'Active' },
    { title: 'Active Cases', value: cases?.filter(c => c.status === 'Open').length || '0', icon: 'medical_services', color: 'purple', trend: 'Live' },
    { title: 'Available Rooms', value: rooms || '0', icon: 'bed', color: 'green', trend: '85%' },
    { title: 'Staff Count', value: staff?.length || '0', icon: 'groups_3', color: 'yellow', trend: '+2%' },
  ];

  return (
    <MainLayout title="Admin Dashboard" hidePadding={true}>

      <div className="p-4 md:p-8 md:pt-10 space-y-10 max-w-7xl mx-auto">


        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Revenue & Inflow Trends */}
          <div className="lg:col-span-2 glass-morphism rounded-[2.5rem] border border-white/20 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black tracking-tight">Financial & Patient Flow</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Last 6 Months Snapshot</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-primary"></div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Inflow</span>
                </div>
              </div>
            </div>
            
            
            <div className="h-auto w-full flex flex-col md:flex-row gap-8">
              <div className="h-[250px] flex-1">
                {loadAnalytics ? (
                  <Skeleton className="h-full w-full rounded-2xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={analyticsData?.revenueTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#6366f1" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="h-[250px] flex-1">
                {loadAnalytics ? (
                  <Skeleton className="h-full w-full rounded-2xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={analyticsData?.inflowTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      />
                      <Bar 
                        dataKey="patients" 
                        fill="#10b981" 
                        radius={[6, 6, 0, 0]} 
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Room Occupancy Pie Chart */}
          <div className="glass-morphism rounded-[2.5rem] border border-white/20 p-8 flex flex-col items-center">
            <h3 className="text-xl font-black tracking-tight self-start">Bed Occupancy</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 self-start mb-4">Real-time status</p>
            
            <div className="h-[250px] w-full">
              {loadAnalytics ? (
                <Skeleton variant="circle" className="size-48 mx-auto" />
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.occupancy || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(analyticsData?.occupancy || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Table Area */}
          <section className="lg:col-span-2 grow flex flex-col glass-morphism rounded-[2.5rem] border border-white/20 dark:border-slate-800/20 shadow-premium overflow-hidden min-h-[500px]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                  <span className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                    <span className="material-symbols-outlined">clinical_notes</span>
                  </span>
                  Emergency Triage
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Active Cases Dashboard</p>
              </div>
              <button onClick={() => navigate('/patient_list')} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all border border-primary/10">View Full Registry</button>
            </div>
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[700px]">
                <thead className="sticky top-0 z-10 glass-morphism border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Identity</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Diagnosis Status</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Assigned MD</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {loadCases ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan="4">
                          <Skeleton variant="table-row" />
                        </td>
                      </tr>
                    ))
                  ) : (!cases || cases.length === 0) ? (
                    <tr>
                      <td colSpan="4">
                        <EmptyState 
                          title="No Active Cases" 
                          description="Excellent! All current patient cases have been resolved."
                          icon="clinical_notes"
                          className="py-12"
                        />
                      </td>
                    </tr>
                  ) : (
                    cases.slice(0, 4).map((caseReq) => (
                      <tr key={caseReq.caserequestid} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`size-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs ring-4 ring-transparent group-hover:ring-blue-50 dark:group-hover:ring-blue-900/10 transition-all duration-500`}>
                              {caseReq.patient?.firstname?.[0]}{caseReq.patient?.lastname?.[0]}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight">{caseReq.patient?.firstname} {caseReq.patient?.lastname}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">ID: P-{caseReq.patientid}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300 tracking-tight">{caseReq.casesummary?.slice(0, 30)}...</span>
                            <span className={`w-fit px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              caseReq.status === 'Open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                            }`}>{caseReq.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                             <span className="material-symbols-outlined text-lg">medical_services</span>
                             <span className="text-xs font-bold">{caseReq.employee?.firstname ? `Dr. ${caseReq.employee.firstname}` : 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <button onClick={() => navigate(`/cases/${caseReq.caserequestid}`)} className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm transition-all text-slate-400 hover:text-primary">
                            <span className="material-symbols-outlined">arrow_forward</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Department Overview */}
          <div className="lg:col-span-1 flex flex-col glass-morphism-heavy rounded-[2.5rem] border border-white/30 dark:border-slate-800/30 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                <span className="size-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-amber-600 text-xl">domain</span>
                </span>
                Wards
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational</span>
            </div>
            <div className="p-6 flex-1 space-y-6 overflow-y-auto max-h-[500px] no-scrollbar">
              {loadDepts ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} variant="card" className="rounded-3xl" />
                ))
              ) : deptStats.map((dept) => {
                const visual = deptVisuals[dept.name] || deptVisuals['default'];
                return (
                  <div key={dept.departmentid} className="p-5 rounded-3xl bg-white/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800/50 hover:shadow-premium group transition-all duration-500 cursor-pointer">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className={`size-11 rounded-2xl bg-${visual.color}-100 dark:bg-${visual.color}-900/30 flex items-center justify-center text-${visual.color}-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner ring-1 ring-${visual.color}-200/50 dark:ring-${visual.color}-800/50`}>
                          <span className="material-symbols-outlined text-xl">{visual.icon}</span>
                        </div>
                        <span className="font-black text-slate-900 dark:text-slate-100 tracking-tight text-lg">{dept.name}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-2xl text-center border border-slate-100/50 dark:border-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
                        <p className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-1">Staff</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">{dept.staff_count}</p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-2xl text-center border border-slate-100/50 dark:border-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
                        <p className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-1">Cases</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">{dept.case_count}</p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-2xl text-center border border-slate-100/50 dark:border-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
                        <p className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-1">Beds</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">{dept.bed_count}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
               <button onClick={() => navigate('/manage_staff')} className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-primary/5 hover:text-primary transition-all border border-transparent hover:border-primary/10">Resource Management</button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
