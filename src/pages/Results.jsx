import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLMS } from '../context/LMSContext';
import Editor from '@monaco-editor/react';
import {

  CheckCircle,
  XCircle,


  ArrowLeft,
  CornerDownRight,


  MessageSquare,
  FileText } from
'lucide-react';


export const Results = () => {
  const { id } = useParams();
  const { submissions, assessments, students } = useLMS();
  const navigate = useNavigate();

  const submission = submissions.find((s) => s.id === id);
  if (!submission) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border">
        Submission record not found.
      </div>);

  }

  const assessment = assessments.find((a) => a.id === submission.assessmentId);
  const student = students.find((s) => s.id === submission.studentId);

  if (!assessment) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border">
        Associated assessment template has been removed.
      </div>);

  }

  const isPassed = submission.percentage >= assessment.passingMarks;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Return Button */}
      <button
        onClick={() => navigate('/student-dashboard')}
        className="text-xs font-bold text-neutral-500 hover:text-neutral-700 flex items-center gap-1.5 cursor-pointer">
        
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Outcome Score Header */}
      <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="space-y-3.5 text-center md:text-left">
          <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
            <span className="px-2.5 py-0.5 bg-[#6C1D5F]/10 text-[#6C1D5F] dark:text-purple-300 font-bold rounded-lg text-[10px] uppercase font-mono">
              Exam Submission Closed
            </span>
            {submission.isEvaluated ?
            isPassed ?
            <span className="px-2.5 py-0.5 bg-emerald-50 text-[#01AC9F] dark:bg-emerald-950/20 dark:text-emerald-400 font-bold rounded-lg text-[10px] uppercase font-mono">
                  Passing Outcome
                </span> :

            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 font-bold rounded-lg text-[10px] uppercase font-mono">
                  Threshold Missed
                </span> :


            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 font-bold rounded-lg text-[10px] uppercase font-mono animate-pulse">
                Evaluating descriptive responses
              </span>
            }
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-black text-xl md:text-2xl text-neutral-800 dark:text-white leading-tight">
              {assessment.title}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Student Examinee: {student?.name || 'Academic Enrollee'}</p>
          </div>

          {/* Overall Comments */}
          {submission.remarks &&
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 border rounded-2xl flex items-start gap-2.5 text-left max-w-lg">
              <MessageSquare className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">Trainer Evaluation feedback</p>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5 leading-relaxed">
                  "{submission.remarks}"
                </p>
              </div>
            </div>
          }
        </div>

        {/* Visual Score Circle badge */}
        <div className="flex flex-col items-center shrink-0">
          <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shadow-lg transition-colors ${submission.isEvaluated ? isPassed ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20' : 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' : 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/10'}`}>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Your Score</span>
            <span className="font-display font-black text-3xl text-neutral-800 dark:text-white mt-1">
              {submission.isEvaluated ? `${submission.percentage}%` : 'Pending'}
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
              {submission.isEvaluated ? `${submission.score} / ${assessment.marks} pts` : '-- / --'}
            </span>
          </div>

          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold mt-3 uppercase tracking-wider text-center">
            Passing mark: {assessment.passingMarks}% ({Math.round(assessment.marks * (assessment.passingMarks / 100))} pts)
          </p>
        </div>

      </div>

      {/* Detailed Response reviews list */}
      <div className="space-y-4">
        <h3 className="font-display font-black text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Interactive Answers Audit</h3>

        <div className="space-y-4">
          {assessment.questions.map((q, idx) => {
            const ansObj = submission.answers.find((sa) => sa.questionId === q.id);
            const studentAns = ansObj?.answer;
            const marksAwarded = ansObj?.marksAwarded !== undefined ? ansObj.marksAwarded : 0;
            const isCorrect = marksAwarded > 0 || ansObj?.isCorrect;

            const isEvaluated = submission.isEvaluated;

            if (q.type === 'coding') {
              const codingAns = studentAns && typeof studentAns === 'object' ? studentAns : null;
              const isPassed = ansObj?.isCorrect || codingAns?.status === 'Accepted' || codingAns?.status === 'Partially Accepted';

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-neutral-900 border rounded-2xl p-5 space-y-4 shadow-md ${isEvaluated ? isPassed ? 'border-emerald-200/50 dark:border-emerald-950/50' : 'border-rose-200/50 dark:border-rose-950/50' : 'border-brand-border dark:border-neutral-700 dark:border-neutral-800'}`}>
                  
                  <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800/60 pb-3">
                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-500 dark:text-neutral-400 font-bold rounded text-[10px] font-mono">
                      Q{idx + 1} • CODING CHALLENGE
                    </span>

                    <span className="font-mono font-bold text-xs text-neutral-600 dark:text-neutral-300">
                      Awarded: <span className="text-[#6C1D5F] dark:text-purple-300">{codingAns?.score || marksAwarded}</span> / {q.marks} pts
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 leading-relaxed">
                    {q.question}
                  </p>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[10px] font-mono">
                      <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800/40">
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block font-sans">LANGUAGE USED</span>
                        <span className="text-neutral-800 dark:text-white font-bold">{codingAns?.language?.toUpperCase() || 'JAVASCRIPT'}</span>
                      </div>
                      <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800/40">
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block font-sans">EXECUTION OUTCOME</span>
                        <span className={`font-bold ${isPassed ? 'text-green-500' : 'text-amber-500'}`}>{codingAns?.status || 'Submitted'}</span>
                      </div>
                      <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800/40">
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block font-sans">SIMULATION SCORE</span>
                        <span className="text-neutral-800 dark:text-white font-bold">{codingAns?.score || marksAwarded} pts</span>
                      </div>
                      <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800/40">
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block font-sans">SUBMITTED TIMESTAMP</span>
                        <span className="text-neutral-500 font-bold text-[10px]">{codingAns?.submittedAt ? new Date(codingAns.submittedAt).toLocaleTimeString() : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="h-64 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-[#1E1E1E]">
                      <Editor
                        height="100%"
                        language={codingAns?.language || 'javascript'}
                        theme="vs-dark"
                        value={codingAns?.code || '// No solution was submitted.'}
                        options={{
                          readOnly: true,
                          fontSize: 12,
                          minimap: { enabled: false },
                          lineNumbers: 'on',
                          automaticLayout: true,
                          scrollBeyondLastLine: false,
                          folding: true
                        }} />
                      
                    </div>
                  </div>
                </div>);

            }

            return (
              <div
                key={q.id}
                className={`bg-white dark:bg-neutral-900 border rounded-2xl p-5 space-y-4 shadow-md ${isEvaluated ? isCorrect ? 'border-emerald-200/50 dark:border-emerald-950/50' : 'border-rose-200/50 dark:border-rose-950/50' : 'border-brand-border dark:border-neutral-700 dark:border-neutral-800'}`}>
                
                
                {/* Header info */}
                <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800/60 pb-3">
                  <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-500 dark:text-neutral-400 font-bold rounded text-[10px] font-mono">
                    Q{idx + 1} • {q.type.toUpperCase()}
                  </span>

                  <span className="font-mono font-bold text-xs text-neutral-600 dark:text-neutral-300">
                    Awarded: <span className="text-[#6C1D5F] dark:text-purple-300">{marksAwarded}</span> / {q.marks} pts
                  </span>
                </div>

                {/* Prompt */}
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 leading-relaxed">
                  {q.question}
                </p>

                {/* Answer evaluation boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Student Answer */}
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-2xl space-y-1.5 border border-neutral-100 dark:border-neutral-800/40">
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wide flex items-center gap-1">
                      <span>Your Answer</span>
                      {isEvaluated && (
                      isCorrect ?
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> :
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />)
                      }
                    </p>

                    <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {q.type === 'file_upload' && studentAns && typeof studentAns === 'object' ?
                      <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="truncate">{studentAns.name} ({studentAns.size})</span>
                        </div> :
                      q.type === 'multi_select' && Array.isArray(studentAns) ?
                      <ul className="list-disc pl-4 space-y-1">
                          {studentAns.map((idxStr, optI) =>
                        <li key={optI}>{q.options?.[Number(idxStr)] || `Option ${idxStr}`}</li>
                        )}
                        </ul> :
                      q.type === 'mcq' || q.type === 'true_false' ?
                      <span>{q.options?.[Number(studentAns)] || studentAns}</span> :

                      <p className="whitespace-pre-wrap italic">"{studentAns || 'No response.'}"</p>
                      }
                    </div>
                  </div>

                  {/* Correct Answer comparison */}
                  <div className="p-3 bg-emerald-500/5 dark:bg-emerald-950/10 rounded-2xl space-y-1.5 border border-emerald-100/40">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">Correct Template Answer</p>
                    
                    <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      {q.type === 'file_upload' ?
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">Trainer manual validation required</span> :
                      q.type === 'short_answer' || q.type === 'paragraph' ?
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">Manual semantic validation required</span> :
                      q.type === 'multi_select' && Array.isArray(q.correctAnswer) ?
                      <ul className="list-disc pl-4 space-y-1 text-[#01AC9F]">
                          {q.correctAnswer.map((idxStr, optI) =>
                        <li key={optI}>{q.options?.[Number(idxStr)] || `Option ${idxStr}`}</li>
                        )}
                        </ul> :
                      q.type === 'mcq' || q.type === 'true_false' ?
                      <span className="text-[#01AC9F]">{q.options?.[Number(q.correctAnswer)] || q.correctAnswer}</span> :
                      null}
                    </div>
                  </div>

                </div>

                {/* Submitting Answer Explanation and review comments */}
                {(q.explanation || ansObj?.remarks) &&
                <div className="pt-3 border-t border-dashed border-neutral-100 dark:border-neutral-800 space-y-1.5">
                    {ansObj?.remarks &&
                  <p className="text-[11px] text-[#6C1D5F] dark:text-purple-300 font-medium flex items-start gap-1">
                        <CornerDownRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Teacher Grade Remarks: "{ansObj.remarks}"</span>
                      </p>
                  }
                    {q.explanation &&
                  <p className="text-[11px] text-[#01AC9F] font-medium flex items-start gap-1">
                        <CornerDownRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Explanation: {q.explanation}</span>
                      </p>
                  }
                  </div>
                }

              </div>);

          })}
        </div>
      </div>

    </div>);

};

