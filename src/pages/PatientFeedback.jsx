import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientPortalService } from '../services/patientPortalService';
import { feedbackService } from '../services/feedbackService';

// --- Star Rating Component ---
const StarRating = ({ value, onChange, disabled }) => (
  <div className="flex gap-1.5">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => !disabled && onChange(star)}
        disabled={disabled}
        className={`material-symbols-outlined text-3xl transition-all duration-150 ${
          disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'
        } ${value >= star ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-700'}`}
        style={{ fontVariationSettings: value >= star ? "'FILL' 1" : "'FILL' 0" }}
      >
        star
      </button>
    ))}
  </div>
);

// --- Staff Card for rating ---
const StaffCard = ({ person, role, caseId, patientId, alreadyReviewed, submitMutation }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isDone = alreadyReviewed || submitted;
  const avatarSeed = person.lastname;
  const avatarBg = role === 'Doctor' ? 'b6e3f4' : 'ffd5dc';
  const badgeColor = role === 'Doctor'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';

  const handleSubmit = () => {
    if (!rating) return;
    submitMutation.mutate(
      {
        patientid: patientId,
        employeeid: person.employeeid,
        caserequestid: caseId,
        rating,
        comment,
      },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all overflow-hidden ${
      isDone
        ? 'border-emerald-200 dark:border-emerald-800/50 opacity-80'
        : 'border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:shadow-lg'
    }`}>
      <div className="p-6 flex items-start gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="size-16 rounded-2xl overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-md">
            <img
              className="w-full h-full object-cover"
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=${avatarBg}`}
              alt={role}
            />
          </div>
        </div>

        {/* Info + Rating */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-black text-slate-900 dark:text-slate-100 text-lg leading-tight">
                {role === 'Doctor' ? 'Dr.' : ''} {person.firstname} {person.lastname}
              </p>
              <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeColor}`}>
                {role === 'Doctor' ? (person.doctorprofile?.specialization || 'Physician') : 'Nursing Staff'}
              </span>
            </div>

            {isDone && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-sm flex-shrink-0 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Reviewed
              </div>
            )}
          </div>

          {isDone ? (
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`material-symbols-outlined text-xl ${rating >= s ? 'text-yellow-400' : 'text-slate-200'}`}
                  style={{ fontVariationSettings: rating >= s ? "'FILL' 1" : "'FILL' 0" }}>star</span>
              ))}
              {comment && <p className="text-xs text-slate-500 ml-2 italic truncate">"{comment}"</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Rating</p>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comments (optional)</p>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={`Share your experience with ${role === 'Doctor' ? 'Dr.' : ''} ${person.firstname}...`}
                  rows={2}
                  className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none font-medium"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!rating || submitMutation.isPending}
                className="px-6 py-2.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitMutation.isPending ? (
                  <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">rate_review</span>
                )}
                Submit Review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main Page ---
const PatientFeedback = () => {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const userEmail = session?.user?.email;
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const { data: patient } = useQuery({
    queryKey: ['patient-profile', userEmail],
    queryFn: () => patientPortalService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });

  const { data: staffToRate = [], isLoading } = useQuery({
    queryKey: ['staff-to-rate', patient?.patientid],
    queryFn: () => feedbackService.getStaffToRate(patient.patientid),
    enabled: !!patient?.patientid,
  });

  const { data: existingFeedback = [] } = useQuery({
    queryKey: ['patient-existing-feedback', patient?.patientid],
    queryFn: () => feedbackService.getPatientFeedback(patient.patientid),
    enabled: !!patient?.patientid,
  });

  const submitMutation = useMutation({
    mutationFn: (data) => feedbackService.submit(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['patient-existing-feedback']);
      showNotification('Thank you! Your feedback has been recorded.');
    },
    onError: (err) => showNotification(`Failed to submit: ${err.message}`, 'error'),
  });

  const isAlreadyReviewed = (employeeId, caseId) =>
    existingFeedback.some(f => f.employeeid === employeeId && f.caserequestid === caseId);

  const reviewedCount = existingFeedback.length;
  const totalReviewable = staffToRate.reduce((acc, cs) => acc + (cs.employee ? 1 : 0) + (cs.nurse ? 1 : 0), 0);

  return (
    <MainLayout title="Feedback" hidePadding={true}>

      {/* Toast */}
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

      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="size-9 bg-yellow-400/10 text-yellow-500 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">star</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Rate Your Care</h2>
        </div>
        {totalReviewable > 0 && (
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <span className="text-primary font-black">{reviewedCount}</span>
            <span>/ {totalReviewable} reviewed</span>
          </div>
        )}
      </header>

      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-10 animate-in fade-in duration-700">

        {/* Hero */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter mb-2">
            Rate Your Experience
          </h1>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Share feedback about the doctors and nurses who cared for you. Your input helps us improve quality of care.
          </p>
        </div>

        {/* Progress bar */}
        {totalReviewable > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-5">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                <span>Review Progress</span>
                <span>{Math.round((reviewedCount / totalReviewable) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${(reviewedCount / totalReviewable) * 100}%` }}
                />
              </div>
            </div>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">verified</span>
            </div>
          </div>
        )}

        {/* Staff Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span>
          </div>
        ) : staffToRate.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <span className="material-symbols-outlined text-5xl text-slate-300">rate_review</span>
            <p className="font-black text-slate-500">No staff to rate yet</p>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Staff from your accepted or resolved cases will appear here once assigned.
            </p>
          </div>
        ) : (
          staffToRate.map((caseItem) => (
            <div key={caseItem.caserequestid} className="space-y-4">
              {/* Case header */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <span className="material-symbols-outlined text-sm text-slate-400">folder_open</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Case #{caseItem.caserequestid} • {caseItem.status}
                  </span>
                </div>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              {caseItem.employee && (
                <StaffCard
                  person={caseItem.employee}
                  role="Doctor"
                  caseId={caseItem.caserequestid}
                  patientId={patient?.patientid}
                  alreadyReviewed={isAlreadyReviewed(caseItem.employee.employeeid, caseItem.caserequestid)}
                  submitMutation={submitMutation}
                />
              )}

              {caseItem.nurse && (
                <StaffCard
                  person={caseItem.nurse}
                  role="Nurse"
                  caseId={caseItem.caserequestid}
                  patientId={patient?.patientid}
                  alreadyReviewed={isAlreadyReviewed(caseItem.nurse.employeeid, caseItem.caserequestid)}
                  submitMutation={submitMutation}
                />
              )}
            </div>
          ))
        )}

        {/* Privacy notice */}
        <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-5 border border-primary/10 flex items-start gap-4">
          <span className="material-symbols-outlined text-primary mt-0.5">shield</span>
          <div>
            <p className="font-black text-slate-900 dark:text-slate-100 text-sm mb-1">Privacy Notice</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Your ratings are used for internal quality improvement only. Comments are shared anonymously with department heads.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientFeedback;
