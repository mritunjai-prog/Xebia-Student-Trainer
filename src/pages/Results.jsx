import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLMS } from '../context/LMSContext';
import Editor from '@monaco-editor/react';
import { CertificateViewer } from '../components/certificates/CertificateViewer';
import {

  CheckCircle,
  XCircle,


  ArrowLeft,
  CornerDownRight,


  MessageSquare,
  Award,
  Sparkles,
  FileText } from
'lucide-react';


export const Results = () => {
  const { id } = useParams();
  const { submissions, assessments, students, certificates } = useLMS();
  const navigate = useNavigate();

  const [showCertificate, setShowCertificate] = useState(false);

  const submission = submissions.find((s) => s.id === id);
  if (!submission) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border">
        Submission record not found.
      </div>);

  }

  const assessment = assessments.find((a) => a.id === submission.assessmentId);
  const student = students.find((s) => s.id === submission.studentId);
  const earnedCertificate = certificates?.find((c) => c.submissionId === submission.id && c.status === 'ACTIVE');

  if (!assessment) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border">
        Associated assessment template has been removed.
      </div>);

  }

  const isMasked = assessment.scoreReleasePolicy === 'MANUAL_RELEASE_BY_TRAINER' && submission.score == null;
  const isPassed = !isMasked && submission.percentage >= assessment.passingMarks;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Return Button */}
      <button
        onClick={() => navigate('/student-dashboard')}
        className="text-xs font-bold text-neutral-500 hover:text-neutral-700 flex items-center gap-1.5 cursor-pointer">
        
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Outcome Score Header */}
      <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 rounded-xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="space-y-3.5 text-center md:text-left">
          <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
            <span className="px-2.5 py-0.5 bg-[#6C1D5F]/10 text-[#6C1D5F] dark:text-purple-300 font-bold rounded-lg text-[10px] uppercase font-mono">
              Exam Submission Closed
            </span>
            {isMasked ? (
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 font-bold rounded-lg text-[10px] uppercase font-mono">
                  Pending Manual Release
                </span>
            ) : submission.isEvaluated ?
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
          <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border rounded-xl flex items-start gap-2.5 text-left max-w-lg">
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
          <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shadow-md transition-colors ${isMasked ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : submission.isEvaluated ? isPassed ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20' : 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' : 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/10'}`}>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Your Score</span>
            <span className="font-display font-black text-2xl text-neutral-800 dark:text-white mt-0.5">
              {isMasked ? 'Hidden' : submission.isEvaluated ? `${submission.percentage}%` : 'Pending'}
            </span>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-mono">
              {isMasked ? '-- / --' : submission.isEvaluated ? `${submission.score} / ${assessment.marks} pts` : '-- / --'}
            </span>
          </div>

          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold mt-3 uppercase tracking-wider text-center">
            Passing mark: {assessment.passingMarks}% ({Math.round(assessment.marks * (assessment.passingMarks / 100))} pts)
          </p>
        </div>

      </div>

      {/* Detailed Response reviews list */}
      {!isMasked && (
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
                  className={`bg-white dark:bg-neutral-900 border rounded-xl p-3 space-y-3 shadow-sm ${isEvaluated ? isPassed ? 'border-emerald-200/50 dark:border-emerald-950/50' : 'border-rose-200/50 dark:border-rose-950/50' : 'border-brand-border dark:border-neutral-700 dark:border-neutral-800'}`}>
                  
                  <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800/60 pb-1.5">
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
                      <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-100 dark:border-neutral-800/40">
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block font-sans">LANGUAGE USED</span>
                        <span className="text-neutral-800 dark:text-white font-bold">{codingAns?.language?.toUpperCase() || 'JAVASCRIPT'}</span>
                      </div>
                      <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-100 dark:border-neutral-800/40">
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block font-sans">EXECUTION OUTCOME</span>
                        <span className={`font-bold ${isPassed ? 'text-green-500' : 'text-amber-500'}`}>{codingAns?.status || 'Submitted'}</span>
                      </div>
                      <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-100 dark:border-neutral-800/40">
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block font-sans">SIMULATION SCORE</span>
                        <span className="text-neutral-800 dark:text-white font-bold">{codingAns?.score || marksAwarded} pts</span>
                      </div>
                      <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-100 dark:border-neutral-800/40">
                        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block font-sans">SUBMITTED TIMESTAMP</span>
                        <span className="text-neutral-500 font-bold text-[10px]">{codingAns?.submittedAt ? new Date(codingAns.submittedAt).toLocaleTimeString() : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="h-48 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-[#1E1E1E]">
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
                className={`bg-white dark:bg-neutral-900 border rounded-xl p-3 space-y-2 shadow-sm ${isEvaluated ? isCorrect ? 'border-emerald-200/50 dark:border-emerald-950/50' : 'border-rose-200/50 dark:border-rose-950/50' : 'border-brand-border dark:border-neutral-700 dark:border-neutral-800'}`}>
                
                
                {/* Header info */}
                <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800/60 pb-1.5">
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
                  <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl space-y-1.5 border border-neutral-100 dark:border-neutral-800/40">
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
                  {isEvaluated && (
                    <div className="p-2 bg-emerald-500/5 dark:bg-emerald-950/10 rounded-xl space-y-1.5 border border-emerald-100/40">
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
                  )}
                </div>

                {/* Submitting Answer Explanation and review comments */}
                {((isEvaluated && q.explanation) || ansObj?.remarks) &&
                <div className="pt-3 border-t border-dashed border-neutral-100 dark:border-neutral-800 space-y-1.5">
                    {ansObj?.remarks &&
                  <p className="text-[11px] text-[#6C1D5F] dark:text-purple-300 font-medium flex items-start gap-1">
                        <CornerDownRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Teacher Grade Remarks: "{ansObj.remarks}"</span>
                      </p>
                  }
                    {isEvaluated && q.explanation &&
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
    )}

      {/* Certificate Achievement Section */}
      {earnedCertificate && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-300/40 dark:border-amber-600/30 shadow-xl">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-300/10 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none" />
          
          <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            {/* Trophy Icon */}
            <div className="shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Award className="w-10 h-10 text-white" />
            </div>
            
            {/* Text Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Achievement Unlocked</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white mb-1">
                You've Earned a Certificate! 🎉
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                Congratulations <span className="font-bold text-neutral-900 dark:text-white">{student?.name}</span> — you passed <span className="font-bold">{assessment?.title}</span> with a score of <span className="font-bold text-amber-600">{earnedCertificate.finalScore.toFixed(1)}%</span>.
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 font-mono">
                Credential ID: {earnedCertificate.serialNumber}
              </p>
            </div>
            
            {/* Action Button */}
            <div className="shrink-0">
              <button
                onClick={() => setShowCertificate(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all text-sm"
              >
                <Award className="w-4 h-4" />
                View Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificate && earnedCertificate && (
        <CertificateViewer
          certificate={earnedCertificate}
          studentName={student?.name}
          assessmentTitle={assessment?.title}
          onClose={() => setShowCertificate(false)}
        />
      )}

    </div>);

};
