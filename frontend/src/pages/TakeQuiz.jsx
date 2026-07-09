import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLMS } from '../context/LMSContext';
import { assessmentApi, draftApi, submissionApi } from '../api/client';
import { toast } from '../components/Toast';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  LogOut,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  Upload,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const hasAnswer = (value) => value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);

export const TakeQuiz = () => {
  const { slug: assessmentId } = useParams();
  const navigate = useNavigate();
  const { currentUser, theme, toggleTheme, refreshStudentCoreData } = useLMS();

  const [assessment, setAssessment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [flaggedQIds, setFlaggedQIds] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef(null);
  const submittedRef = useRef(false);
  const draftHydratedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const loadAttempt = async () => {
      if (!currentUser?.id) return;
      setLoading(true);
      setError('');

      try {
        const loadedAssessment = await assessmentApi.get(assessmentId);
        const startedSubmission = await submissionApi.start(assessmentId);
        const draft = await draftApi.get(currentUser.id, assessmentId).catch(() => null);

        if (!active) return;

        setAssessment(loadedAssessment);
        setSubmission(startedSubmission);

        const draftData = draft?.draftData || {};
        const existingAnswers = draftData.answers || {};
        if (Object.keys(existingAnswers).length === 0) {
          (startedSubmission.answers || []).forEach((answer) => {
            existingAnswers[answer.questionId] = answer.answer;
          });
        }

        setAnswers(existingAnswers);
        setCurrentQIndex(Number(draftData.currentQuestion) || 0);
        const totalSeconds = (Number(loadedAssessment.duration) || 0) * 60;
        setSecondsLeft(Number(draftData.timeRemaining) || totalSeconds);
        draftHydratedRef.current = true;
      } catch (loadError) {
        if (active) setError(loadError.message || 'Failed to load assessment attempt.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAttempt();
    return () => {
      active = false;
    };
  }, [assessmentId, currentUser?.id]);

  useEffect(() => {
    if (!assessment || submittedRef.current || !draftHydratedRef.current || !currentUser?.id) return;
    const timer = setTimeout(() => {
      draftApi.save(currentUser.id, assessment.id, {
        answers,
        currentQuestion: currentQIndex,
        timeRemaining: secondsLeft
      }).catch((saveError) => {
        console.warn('Draft save failed', saveError);
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [answers, currentQIndex, secondsLeft, assessment?.id, currentUser?.id]);

  useEffect(() => {
    if (!assessment || submittedRef.current) return;
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [assessment?.id, secondsLeft]);

  useEffect(() => {
    if (assessment && secondsLeft === 0 && !submittedRef.current && submission) {
      executeFinalSubmission(true);
    }
  }, [secondsLeft, assessment, submission]);

  const questions = assessment?.questions || [];
  const currentQ = questions[currentQIndex];
  const totalQuestions = questions.length || 1;
  const progressPercentage = Math.round(((currentQIndex + 1) / totalQuestions) * 100);

  const answeredCount = useMemo(() => {
    return questions.filter((question) => hasAnswer(answers[question.id])).length;
  }, [answers, questions]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const toggleFlagReview = (qId) => {
    setFlaggedQIds((prev) => prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]);
    toast.add('Question flagged for review', 'info');
  };

  const toggleFullscreenMode = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {
        toast.add('Fullscreen error: blocked by browser security settings', 'warning');
      });
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const simulateFileUpload = (qId, name, sizeBytes) => {
    setUploadingFiles((prev) => ({ ...prev, [qId]: true }));
    setTimeout(() => {
      handleSelectAnswer(qId, {
        name,
        size: `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString()
      });
      setUploadingFiles((prev) => ({ ...prev, [qId]: false }));
      toast.add(`File "${name}" buffered as placeholder.`, 'success');
    }, 600);
  };

  const validateRequiredAnswers = () => {
    const unansweredRequired = questions.filter((question) => question.required && !hasAnswer(answers[question.id]));
    if (unansweredRequired.length > 0) {
      toast.add('Please provide answers for all required questions before submitting.', 'warning');
      return false;
    }
    return true;
  };

  const buildAnswersPayload = () => {
    return questions.map((question) => ({
      questionId: question.id,
      answer: answers[question.id] !== undefined ? answers[question.id] : ''
    }));
  };

  const executeFinalSubmission = async (autoSubmit = false) => {
    if (!submission || isSubmitting) return;
    if (!autoSubmit && !validateRequiredAnswers()) return;

    submittedRef.current = true;
    setIsSubmitting(true);

    try {
      const totalSeconds = (Number(assessment.duration) || 0) * 60;
      const completed = await submissionApi.submit(submission.id, {
        answers: buildAnswersPayload(),
        timeTaken: Math.max(1, totalSeconds - secondsLeft)
      });

      await refreshStudentCoreData?.().catch(() => null);
      setShowConfirmModal(false);
      if (document.fullscreenElement) document.exitFullscreen?.();
      toast.add(autoSubmit ? 'Time is up. Assessment submitted.' : 'Assessment submitted successfully!', 'success');
      navigate(`/results/${assessment.id}/${completed.id}`);
    } catch (submitError) {
      submittedRef.current = false;
      toast.add(submitError.message || 'Failed to submit assessment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border dark:border-neutral-800">Loading assessment attempt...</div>;
  }

  if (error || !assessment || !currentQ) {
    return (
      <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border dark:border-neutral-800">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white">Assessment unavailable</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{error || 'No questions are available.'}</p>
        <button onClick={() => navigate('/assessments')} className="mt-4 px-4 py-2 bg-[#6C1D5F] hover:bg-[#84117C] text-white rounded-2xl text-xs font-bold uppercase">
          Back to Assessments
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-brand-bg-light dark:bg-[#0a0a0a] p-4 md:p-8 flex flex-col justify-between transition-colors duration-300 w-full ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>

      <div className="flex justify-between items-center bg-white dark:bg-neutral-900 px-6 py-4 border border-brand-border dark:border-neutral-800 rounded-3xl shadow-sm mb-6">
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wide">Ongoing Assessment Exam</span>
          <h3 className="font-display font-black text-lg md:text-xl text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-xl">{assessment.title}</h3>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowConfirmModal(true)} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-2xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-neutral-800 transition-all cursor-pointer">
            {theme === 'light' ? <Moon className="w-5 h-5 text-[#6C1D5F]" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </button>
          <button onClick={toggleFullscreenMode} className="p-2 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 rounded-2xl text-neutral-500 cursor-pointer">
            {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/50">
            <Clock className={`w-5 h-5 ${secondsLeft < 120 ? 'animate-pulse' : ''}`} />
            <span className="font-mono font-bold text-base tracking-wider">{formatTime(secondsLeft)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mb-6">
        <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          <span>Progress Timeline</span>
          <span>Question {currentQIndex + 1} of {questions.length} ({progressPercentage}%)</span>
        </div>
        <div className="bg-neutral-200 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
          <div className="bg-[#01AC9F] h-full rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 items-start w-full">
        <div className="flex-1 w-full bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm min-h-[450px] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-brand-border/20 dark:border-neutral-800 pb-4">
              <span className="px-3 py-1.5 bg-[#6C1D5F]/10 dark:bg-purple-900/30 text-[#6C1D5F] dark:text-purple-300 font-bold rounded-lg text-sm font-mono">
                QUESTION #{currentQIndex + 1} - {currentQ.marks} PTS
              </span>
              {currentQ.required && <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-3 py-1 rounded-md uppercase font-mono">Mandatory Question</span>}
            </div>

            <p className="text-base md:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-6 leading-relaxed">
              {currentQ.text || currentQ.question || 'Untitled Question'}
            </p>

            <div className="mt-8">
              {(currentQ.type === 'mcq' || currentQ.type === 'true_false') && (
                <div className="space-y-3">
                  {currentQ.options?.map((opt) => {
                    const isChecked = answers[currentQ.id] === opt;
                    return (
                      <div key={opt} onClick={() => handleSelectAnswer(currentQ.id, opt)} className={`p-5 border rounded-2xl cursor-pointer flex items-center justify-between text-sm font-semibold transition-all ${isChecked ? 'bg-purple-50/80 border-[#6C1D5F] text-[#6C1D5F] dark:bg-purple-900/20 dark:border-purple-500 dark:text-purple-300 shadow-sm' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}>
                        <span>{opt}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isChecked ? 'border-[#6C1D5F] dark:border-purple-400' : 'border-neutral-300 dark:border-neutral-700'}`}>
                          {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-[#6C1D5F] dark:bg-purple-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'multiple_select' && (
                <div className="space-y-3">
                  {currentQ.options?.map((opt) => {
                    const activeSet = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
                    const isChecked = activeSet.includes(opt);
                    return (
                      <div key={opt} onClick={() => handleSelectAnswer(currentQ.id, isChecked ? activeSet.filter((value) => value !== opt) : [...activeSet, opt])} className={`p-5 border rounded-2xl cursor-pointer flex items-center justify-between text-sm font-semibold transition-all ${isChecked ? 'bg-emerald-50/80 border-[#01AC9F] text-[#01AC9F] dark:bg-emerald-900/20 dark:border-emerald-500 dark:text-emerald-300 shadow-sm' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}>
                        <span>{opt}</span>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isChecked ? 'bg-[#01AC9F] border-[#01AC9F] text-white' : 'border-neutral-300 dark:border-neutral-700'}`}>
                          {isChecked && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'short_answer' && (
                <input type="text" value={answers[currentQ.id] || ''} onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)} placeholder="Type your brief response here..." className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]" />
              )}

              {currentQ.type === 'paragraph' && (
                <textarea value={answers[currentQ.id] || ''} onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)} placeholder="Compose detailed response..." className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]" rows={5} />
              )}

              {currentQ.type === 'file_upload' && (
                <div className="space-y-4">
                  <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) simulateFileUpload(currentQ.id, file.name, file.size); }} className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center ${isDragOver ? 'border-[#01AC9F] bg-[#01AC9F]/5' : 'border-brand-border/80 dark:border-neutral-800 hover:border-brand-velvet'}`}>
                    <Upload className="w-8 h-8 text-neutral-500 dark:text-neutral-400 mb-2.5" />
                    <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">File upload is buffered as a placeholder in this phase.</p>
                    <label className="mt-4 px-4 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold rounded-lg text-[10px] cursor-pointer">
                      <span>Browse Files</span>
                      <input type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) simulateFileUpload(currentQ.id, file.name, file.size); }} />
                    </label>
                  </div>
                  {uploadingFiles[currentQ.id] && <div className="text-center py-2 text-xs text-[#01AC9F] font-bold animate-pulse">Buffering file placeholder...</div>}
                  {answers[currentQ.id] && typeof answers[currentQ.id] === 'object' && (
                    <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/40">
                      <p className="font-semibold text-neutral-800 dark:text-neutral-200 truncate text-xs">{answers[currentQ.id].name} ({answers[currentQ.id].size})</p>
                      <button onClick={() => handleSelectAnswer(currentQ.id, '')} className="p-1 hover:bg-rose-100 rounded text-rose-500"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-brand-border/20 dark:border-neutral-800 mt-8">
            <button onClick={() => toggleFlagReview(currentQ.id)} className={`py-2 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${flaggedQIds.includes(currentQ.id) ? 'bg-amber-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}>
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">{flaggedQIds.includes(currentQ.id) ? 'Flagged for Review' : 'Flag Question'}</span>
            </button>

            <div className="flex gap-2">
              <button onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))} disabled={currentQIndex === 0} className="py-2 px-3.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-2xl text-xs font-bold text-neutral-700 dark:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              {currentQIndex === questions.length - 1 ? (
                <button onClick={() => validateRequiredAnswers() && setShowConfirmModal(true)} disabled={isSubmitting} className="py-2 px-5 bg-[#01AC9F] hover:bg-[#01AC9F]/90 text-white rounded-2xl text-xs font-black uppercase shadow cursor-pointer flex items-center gap-1 disabled:opacity-60">
                  <CheckCircle className="w-4 h-4" /> Finish Exam
                </button>
              ) : (
                <button onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))} className="py-2 px-3.5 bg-[#6C1D5F] hover:bg-[#84117C] rounded-2xl text-xs font-bold text-white cursor-pointer flex items-center gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-80 shrink-0 bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-800 rounded-3xl p-6 shadow-sm min-h-[450px]">
          <h4 className="font-display font-black text-neutral-800 dark:text-white text-base">Question Palette</h4>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 mb-6">Draft saves automatically while you answer.</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
            {questions.map((q, idx) => {
              const isCurrent = currentQIndex === idx;
              const answered = hasAnswer(answers[q.id]);
              const flagged = flaggedQIds.includes(q.id);
              let bgStyle = 'bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800/40 dark:border-neutral-800';
              if (isCurrent) bgStyle = 'bg-[#6C1D5F] text-white border-transparent shadow ring-2 ring-brand-velvet/20';
              else if (flagged) bgStyle = 'bg-amber-500 text-white border-transparent';
              else if (answered) bgStyle = 'bg-emerald-500 text-white border-transparent';
              return <button key={q.id} onClick={() => setCurrentQIndex(idx)} className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${bgStyle}`}>{idx + 1}</button>;
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-brand-orange mx-auto animate-pulse" />
              <h3 className="font-display font-black text-lg text-neutral-800 dark:text-white">Submit Examination?</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Your answers will be submitted to the backend. You cannot undo this request.</p>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-2xl text-xs font-semibold grid grid-cols-2 gap-2 text-center text-neutral-500">
                <div><p className="text-[10px] uppercase tracking-wide">Questions answered</p><p className="text-sm font-bold text-neutral-800 dark:text-white mt-0.5">{answeredCount} of {questions.length}</p></div>
                <div><p className="text-[10px] uppercase tracking-wide">Time remaining</p><p className="text-sm font-bold text-rose-500 mt-0.5">{formatTime(secondsLeft)}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setShowConfirmModal(false)} className="py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold rounded-2xl text-xs cursor-pointer">Cancel & Review</button>
                <button onClick={() => executeFinalSubmission(false)} disabled={isSubmitting} className="py-2.5 bg-[#01AC9F] hover:bg-[#01AC9F]/90 text-white font-bold rounded-2xl text-xs shadow-md shadow-[#01AC9F]/20 cursor-pointer disabled:opacity-60">{isSubmitting ? 'Submitting...' : 'Confirm and Hand In'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
