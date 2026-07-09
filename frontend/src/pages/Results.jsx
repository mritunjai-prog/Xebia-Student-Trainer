import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { submissionApi } from '../api/client';
import {
  ArrowLeft,
  CheckCircle,
  CornerDownRight,
  FileText,
  MessageSquare,
  XCircle
} from 'lucide-react';

const formatAnswer = (answer) => {
  if (answer === undefined || answer === null || answer === '') return 'No response.';
  if (Array.isArray(answer)) return answer.join(', ');
  if (typeof answer === 'object') return answer.name ? `${answer.name} (${answer.size || 'file'})` : JSON.stringify(answer, null, 2);
  return String(answer);
};

export const Results = () => {
  const { id: submissionId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    submissionApi.getResult(submissionId)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Failed to load result.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [submissionId]);

  const isEvaluated = result?.isEvaluated;
  const isPassed = useMemo(() => Number(result?.percentage || 0) >= 40, [result?.percentage]);

  if (loading) {
    return <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border dark:border-neutral-800">Loading result...</div>;
  }

  if (error || !result) {
    return (
      <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border dark:border-neutral-800">
        <p className="font-bold text-neutral-800 dark:text-white">Submission result not found.</p>
        <p className="text-sm text-neutral-500 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <button onClick={() => navigate('/student-dashboard')} className="text-xs font-bold text-neutral-500 hover:text-neutral-700 flex items-center gap-1.5 cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3.5 text-center md:text-left">
          <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
            <span className="px-2.5 py-0.5 bg-[#6C1D5F]/10 text-[#6C1D5F] dark:text-purple-300 font-bold rounded-lg text-[10px] uppercase font-mono">
              {result.status}
            </span>
            {isEvaluated ? (
              isPassed ? (
                <span className="px-2.5 py-0.5 bg-emerald-50 text-[#01AC9F] dark:bg-emerald-950/20 dark:text-emerald-400 font-bold rounded-lg text-[10px] uppercase font-mono">Passing Outcome</span>
              ) : (
                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 font-bold rounded-lg text-[10px] uppercase font-mono">Threshold Missed</span>
              )
            ) : (
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 font-bold rounded-lg text-[10px] uppercase font-mono animate-pulse">Pending manual evaluation</span>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-black text-xl md:text-2xl text-neutral-800 dark:text-white leading-tight">
              {result.assessment?.title || 'Assessment Result'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Student Examinee: {result.student?.name || 'Academic Enrollee'}</p>
          </div>

          {result.remarks && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 border rounded-2xl flex items-start gap-2.5 text-left max-w-lg">
              <MessageSquare className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">Trainer Evaluation feedback</p>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5 leading-relaxed">"{result.remarks}"</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center shrink-0">
          <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shadow-lg transition-colors ${isEvaluated ? isPassed ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20' : 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' : 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/10'}`}>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Your Score</span>
            <span className="font-display font-black text-3xl text-neutral-800 dark:text-white mt-1">{isEvaluated ? `${Math.round(result.percentage)}%` : 'Pending'}</span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-mono">{isEvaluated ? `${result.score} pts` : '-- / --'}</span>
          </div>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold mt-3 uppercase tracking-wider text-center">
            Submitted: {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : 'N/A'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-display font-black text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Interactive Answers Audit</h3>
        {result.answers.map((answer, idx) => {
          const isCoding = answer.type === 'coding';
          const isCorrect = answer.isCorrect || Number(answer.marksAwarded) > 0;
          const studentAnswer = answer.answer;
          const codingAnswer = isCoding && studentAnswer && typeof studentAnswer === 'object' ? studentAnswer : null;

          return (
            <div key={answer.id || answer.questionId} className={`bg-white dark:bg-neutral-900 border rounded-2xl p-5 space-y-4 shadow-md ${isEvaluated ? isCorrect ? 'border-emerald-200/50 dark:border-emerald-950/50' : 'border-rose-200/50 dark:border-rose-950/50' : 'border-brand-border dark:border-neutral-800'}`}>
              <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800/60 pb-3">
                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold rounded text-[10px] font-mono">
                  Q{idx + 1} - {answer.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="font-mono font-bold text-xs text-neutral-600 dark:text-neutral-300">
                  Awarded: <span className="text-[#6C1D5F] dark:text-purple-300">{answer.marksAwarded}</span> / {answer.maxMarks} pts
                </span>
              </div>

              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 leading-relaxed">{answer.question}</p>

              {isCoding ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[10px] font-mono">
                    <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800/40">
                      <span className="text-[9px] text-neutral-500 block font-sans">LANGUAGE USED</span>
                      <span className="text-neutral-800 dark:text-white font-bold">{codingAnswer?.language?.toUpperCase() || 'N/A'}</span>
                    </div>
                    <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800/40">
                      <span className="text-[9px] text-neutral-500 block font-sans">STATUS</span>
                      <span className="font-bold text-amber-500">{codingAnswer?.status || 'Submitted'}</span>
                    </div>
                  </div>
                  <div className="h-64 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-[#1E1E1E]">
                    <Editor height="100%" language={codingAnswer?.language || 'javascript'} theme="vs-dark" value={codingAnswer?.code || '// No solution was submitted.'} options={{ readOnly: true, fontSize: 12, minimap: { enabled: false }, automaticLayout: true }} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-2xl space-y-1.5 border border-neutral-100 dark:border-neutral-800/40">
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wide flex items-center gap-1">
                      <span>Your Answer</span>
                      {isEvaluated && (isCorrect ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />)}
                    </p>
                    <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {answer.type === 'file_upload' ? (
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="truncate">{formatAnswer(studentAnswer)}</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap italic">"{formatAnswer(studentAnswer)}"</p>
                      )}
                    </div>
                  </div>

                  {isEvaluated && (
                    <div className="p-3 bg-emerald-500/5 dark:bg-emerald-950/10 rounded-2xl space-y-1.5 border border-emerald-100/40">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">Correct Answer</p>
                      <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        {answer.correctAnswer || answer.optionDetails?.filter((option) => option.correct).map((option) => option.optionText).join(', ') || 'Manual validation required'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {answer.remarks && (
                <div className="pt-3 border-t border-dashed border-neutral-100 dark:border-neutral-800 space-y-1.5">
                  <p className="text-[11px] text-[#6C1D5F] dark:text-purple-300 font-medium flex items-start gap-1">
                    <CornerDownRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Teacher Grade Remarks: "{answer.remarks}"</span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
