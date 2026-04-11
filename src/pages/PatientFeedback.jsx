import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientPortalService } from '../services/patientPortalService';
import { feedbackService } from '../services/feedbackService';

const PatientFeedback = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const userEmail = session?.user?.email;

  const [ratings, setRatings] = useState({}); // { staffId: { rating, comment, caseId } }

  const { data: patient } = useQuery({
    queryKey: ['patient-profile', userEmail],
    queryFn: () => patientPortalService.getProfileByEmail(userEmail),
    enabled: !!userEmail,
  });

  const { data: staffToRate = [], isLoading: isLoadingStaff } = useQuery({
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
      alert('Thank you! Your feedback has been recorded.');
    }
  });

  const handleRatingChange = (staffId, rating, caseId) => {
    setRatings(prev => ({
      ...prev,
      [staffId]: { ...(prev[staffId] || {}), rating, caseId }
    }));
  };

  const handleCommentChange = (staffId, comment) => {
    setRatings(prev => ({
      ...prev,
      [staffId]: { ...(prev[staffId] || {}), comment }
    }));
  };

  const handleSubmit = (staffId) => {
    const feedback = ratings[staffId];
    if (!feedback?.rating) return alert('Please select a rating before submitting.');
    
    submitMutation.mutate({
      patientid: patient.patientid,
      employeeid: staffId,
      caserequestid: feedback.caseId,
      rating: feedback.rating,
      comment: feedback.comment || ''
    });
  };

  const isAlreadyReviewed = (staffId, caseId) => {
     return existingFeedback.some(f => f.employeeid === staffId && f.caserequestid === caseId);
  };

  return (
    <MainLayout title="Patient Feedback" hidePadding={true}>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 md:px-10 py-3 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="flex items-center gap-4 text-primary">
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-primary">medical_services</span>
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">HealthConnect</h2>
        </div>
      </header>

      <div className="flex-1 flex justify-center py-8 px-4 md:px-0 animate-in fade-in duration-700 bg-background-light dark:bg-slate-950 min-h-[calc(100vh-64px)]">
        <div className="flex flex-col max-w-[800px] flex-1 gap-8">
          <div className="flex flex-col gap-2">
            <div onClick={() => navigate('/patient/dashboard')} className="flex items-center gap-2 text-primary font-bold mb-1 cursor-pointer w-fit hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="text-sm">Back to Dashboard</span>
            </div>
            <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-black leading-tight tracking-tighter">Rate Your Care Experience</h1>
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium">Your feedback helps us recognize outstanding staff and improve our medical services for everyone.</p>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-slate-900 dark:text-slate-100 text-xl font-black flex items-center gap-2 tracking-tight">
              <span className="material-symbols-outlined text-primary">groups</span>
              Medical Staff from Recent Visits
            </h2>

            {isLoadingStaff ? (
               <div className="text-center py-12 text-slate-400 font-bold">Loading care history...</div>
            ) : staffToRate.length === 0 ? (
               <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">rate_review</span>
                  <p className="text-slate-400 font-bold">No resolved cases found to rate yet.</p>
               </div>
            ) : (
               staffToRate.map((caseItem) => {
                  const doctor = caseItem.employee;
                  const nurse = caseItem.nurse;
                  
                  return (
                    <React.Fragment key={caseItem.caserequestid}>
                       {/* Doctor Card */}
                       {doctor && (
                         <div className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm transition-all ${isAlreadyReviewed(doctor.employeeid, caseItem.caserequestid) ? 'border-slate-100 grayscale-[0.6] opacity-70' : 'border-slate-200 dark:border-slate-800 hover:shadow-md'}`}>
                            <div className="p-6 flex flex-col md:flex-row gap-6">
                               <div className="flex-shrink-0">
                                 <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden ring-4 ring-primary/5">
                                   <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.lastname}&backgroundColor=b6e3f4`} alt="Doctor" />
                                 </div>
                               </div>
                               <div className="flex-1 flex flex-col gap-4">
                                 <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                      <h3 className="text-slate-900 dark:text-slate-100 text-lg font-black">{doctor.firstname} {doctor.lastname}</h3>
                                      <p className="text-primary font-bold text-xs px-2.5 py-1 bg-primary/10 rounded-full w-fit uppercase tracking-wider">{doctor.doctorprofile?.specialization || 'Physician'}</p>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Case #{caseItem.caserequestid}</p>
                                 </div>

                                 {isAlreadyReviewed(doctor.employeeid, caseItem.caserequestid) ? (
                                    <div className="flex items-center gap-2 text-green-600 font-black text-sm">
                                      <span className="material-symbols-outlined">check_circle</span>
                                      Feedback Submitted
                                    </div>
                                 ) : (
                                    <div className="flex flex-col gap-5">
                                      <div className="flex flex-col gap-2">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Rate interaction</p>
                                        <div className="flex gap-2">
                                          {[1,2,3,4,5].map(star => (
                                            <span 
                                              key={star}
                                              onClick={() => handleRatingChange(doctor.employeeid, star, caseItem.caserequestid)}
                                              className={`material-symbols-outlined cursor-pointer transition-all ${ratings[doctor.employeeid]?.rating >= star ? 'text-yellow-400 fill-1' : 'text-slate-200'} hover:scale-110`}
                                            >star</span>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        <textarea 
                                          className="w-full rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 border focus:border-primary focus:ring-1 focus:ring-primary outline-none p-4 text-sm font-medium" 
                                          placeholder="Share more details about your experience..." 
                                          rows="3"
                                          onChange={(e) => handleCommentChange(doctor.employeeid, e.target.value)}
                                        ></textarea>
                                      </div>
                                      <button 
                                        disabled={submitMutation.isLoading}
                                        onClick={() => handleSubmit(doctor.employeeid)}
                                        className="w-fit px-8 py-3 bg-primary text-white font-black rounded-xl transition-all hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
                                      >
                                        Submit Review
                                      </button>
                                    </div>
                                 )}
                               </div>
                            </div>
                         </div>
                       )}

                       {/* Nurse Card */}
                       {nurse && (
                         <div className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm transition-all ${isAlreadyReviewed(nurse.employeeid, caseItem.caserequestid) ? 'border-slate-100 grayscale-[0.6] opacity-70' : 'border-slate-200 dark:border-slate-800 hover:shadow-md'}`}>
                            <div className="p-6 flex flex-col md:flex-row gap-6">
                               <div className="flex-shrink-0">
                                 <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden ring-4 ring-primary/5">
                                   <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${nurse.lastname}&backgroundColor=ffd5dc`} alt="Nurse" />
                                 </div>
                               </div>
                               <div className="flex-1 flex flex-col gap-4">
                                 <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                      <h3 className="text-slate-900 dark:text-slate-100 text-lg font-black">{nurse.firstname} {nurse.lastname}</h3>
                                      <p className="text-slate-500 font-bold text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full w-fit uppercase tracking-wider">Nursing Staff</p>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Case #{caseItem.caserequestid}</p>
                                 </div>

                                 {isAlreadyReviewed(nurse.employeeid, caseItem.caserequestid) ? (
                                    <div className="flex items-center gap-2 text-green-600 font-black text-sm">
                                      <span className="material-symbols-outlined">check_circle</span>
                                      Feedback Submitted
                                    </div>
                                 ) : (
                                    <div className="flex flex-col gap-5">
                                      <div className="flex flex-col gap-2">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Rate care quality</p>
                                        <div className="flex gap-2">
                                          {[1,2,3,4,5].map(star => (
                                            <span 
                                              key={star}
                                              onClick={() => handleRatingChange(nurse.employeeid, star, caseItem.caserequestid)}
                                              className={`material-symbols-outlined cursor-pointer transition-all ${ratings[nurse.employeeid]?.rating >= star ? 'text-yellow-400 fill-1' : 'text-slate-200'} hover:scale-110`}
                                            >star</span>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        <textarea 
                                          className="w-full rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 border focus:border-primary focus:ring-1 focus:ring-primary outline-none p-4 text-sm font-medium" 
                                          placeholder="Share more details about your experience..." 
                                          rows="3"
                                          onChange={(e) => handleCommentChange(nurse.employeeid, e.target.value)}
                                        ></textarea>
                                      </div>
                                      <button 
                                        disabled={submitMutation.isLoading}
                                        onClick={() => handleSubmit(nurse.employeeid)}
                                        className="w-fit px-8 py-3 bg-primary text-white font-black rounded-xl transition-all hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
                                      >
                                        Submit Review
                                      </button>
                                    </div>
                                 )}
                               </div>
                            </div>
                         </div>
                       )}
                    </React.Fragment>
                  )
               })
            )}

            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/10 flex items-start gap-4">
              <span className="material-symbols-outlined text-primary">info</span>
              <div className="flex flex-col gap-1">
                <p className="text-slate-900 dark:text-slate-100 font-black tracking-tight">Privacy Notice</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Your ratings are used for internal quality improvement. Individual comments are shared anonymously with medical departments unless you specify otherwise.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientFeedback;
