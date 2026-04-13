import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '../services/assessmentService';

const conditionColors = {
  Critical: 'bg-red-100 text-red-700',
  Moderate: 'bg-orange-100 text-orange-700',
  Stable: 'bg-green-100 text-green-700',
};

const NurseAssessmentHistory = () => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [search, setSearch] = useState('');

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['assessment-history'],
    queryFn: () => assessmentService.getAll(),
  });

  const thisWeek = assessments.filter(a => {
    const d = new Date(a.assessedon);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) <= 7;
  });

  const thisMonth = assessments.filter(a => {
    const d = new Date(a.assessedon);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const filtered = assessments.filter(a => {
    const name = `${a.patient?.firstname} ${a.patient?.lastname}`.toLowerCase();
    return name.includes(search.toLowerCase()) || String(a.patientid).includes(search);
  });

  return (
    <MainLayout title="Assessment History" hidePadding={true}>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 bg-white dark:bg-slate-900 px-6 md:px-10 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="size-8 text-primary flex items-center">
            <span className="material-symbols-outlined text-4xl">history_edu</span>
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">Assessment History</h2>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-6 p-6 md:p-10 max-w-[1440px] mx-auto w-full animate-in fade-in duration-700 min-h-[calc(100vh-80px)]">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Total Assessments', value: assessments.length, icon: 'analytics' },
            { label: 'This Week', value: thisWeek.length, icon: 'calendar_today' },
            { label: 'This Month', value: thisMonth.length, icon: 'event_note' },
          ].map(s => (
            <div key={s.label} className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-800 border border-primary/10 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{s.label}</p>
                <span className="material-symbols-outlined text-primary/40">{s.icon}</span>
              </div>
              <p className="text-primary tracking-tight text-3xl font-bold leading-tight">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-primary/5 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="Search by patient name or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{filtered.length} record(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Condition</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assessed By</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {isLoading ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">Loading assessments...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">No assessments found.</td></tr>
                ) : (
                  filtered.map((a) => (
                    <React.Fragment key={a.assessmentid}>
                      <tr className={`hover:bg-primary/5 transition-colors ${expandedRow === a.assessmentid ? 'bg-primary/5 border-l-4 border-primary' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {a.patient?.firstname?.[0]}{a.patient?.lastname?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{a.patient?.firstname} {a.patient?.lastname}</p>
                              <p className="text-xs text-slate-500">ID: #{a.patientid}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(a.assessedon).toLocaleDateString()} • {new Date(a.assessedon).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${conditionColors[a.condition] || 'bg-slate-100 text-slate-600'}`}>
                            {a.condition || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {a.employee ? `${a.employee.firstname} ${a.employee.lastname}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setExpandedRow(expandedRow === a.assessmentid ? null : a.assessmentid)}
                            className="text-primary font-semibold text-sm hover:underline"
                          >
                            {expandedRow === a.assessmentid ? 'Hide' : 'View Detail'}
                          </button>
                        </td>
                      </tr>

                      {expandedRow === a.assessmentid && (
                        <tr className="bg-white dark:bg-slate-800">
                          <td className="px-6 py-8" colSpan="5">
                            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
                              {/* Vitals Grid */}
                              <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Recorded Vitals</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                                  {[
                                    { label: 'Temp', value: a.temperature, unit: '°C' },
                                    { label: 'BP Sys', value: a.systolicbp, unit: 'mmHg' },
                                    { label: 'BP Dia', value: a.diastolicbp, unit: 'mmHg' },
                                    { label: 'Heart Rate', value: a.pulserate, unit: 'BPM' },
                                    { label: 'SpO2', value: a.oxygenlevel, unit: '%' },
                                    { label: 'Blood Sugar', value: a.bloodsugar, unit: 'mg/dL' },
                                  ].map(v => (
                                    <div key={v.label} className="p-4 rounded-xl border border-primary/10 bg-slate-50 dark:bg-slate-900">
                                      <p className="text-xs text-slate-500 mb-1">{v.label}</p>
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-bold">{v.value ?? '—'}</span>
                                        <span className="text-[10px] text-slate-400 font-medium uppercase">{v.unit}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Symptoms Reported</h4>
                                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-primary/5 min-h-[80px]">
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{a.symptoms || 'None recorded.'}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Nurse Observations</h4>
                                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-primary/5 min-h-[80px]">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{a.notes || 'No additional observations.'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-primary/5 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <p className="text-xs text-slate-500">Showing {filtered.length} of {assessments.length} assessments</p>
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default NurseAssessmentHistory;
