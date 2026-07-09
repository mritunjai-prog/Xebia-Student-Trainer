import React, { useEffect, useMemo, useState } from 'react';
import { useLMS } from '../context/LMSContext';
import { evaluationApi } from '../api/client';
import { toast } from '../components/Toast';
import {
  Search, CheckCircle, Clock, FileText, ChevronRight,
  Bot, AlertCircle, Award, MessageSquare, Send, CheckSquare,
  Layers, Loader2
} from 'lucide-react';
import { evaluateSubmission as evaluateSubmissionAI } from '../utils/aiService';

const getApiErrorMessage = (error, fallback) => {
  if (error?.errors?.length) return error.errors.join(', ');
  return error?.message || fallback;
};

const formatAnswerText = (answer) => {
  const value = answer?.answer;
  if (value === undefined || value === null || value === '') {
    return <span className="italic text-neutral-400">No answer provided</span>;
  }
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return value.name || value.fileName || value.code || JSON.stringify(value);
  return String(value);
};

const getAnswerString = (answer) => {
  const value = answer?.answer;
  if (value === undefined || value === null || value === '') return 'No answer provided';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return value.name || value.fileName || value.code || JSON.stringify(value);
  return String(value);
};

const getCorrectAnswerText = (answer) => {
  if (answer?.correctAnswer) return answer.correctAnswer;
  const correctOptions = (answer?.optionDetails || []).filter((option) => option.correct).map((option) => option.optionText);
  if (correctOptions.length) return correctOptions.join(', ');
  return null;
};

export const Evaluation = () => {
  const { students, assessments } = useLMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGraded, setFilterGraded] = useState('pending');
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [resultLoading, setResultLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEvaluatingAi, setIsEvaluatingAi] = useState(false);

  const [questionMarks, setQuestionMarks] = useState({});
  const [questionRemarks, setQuestionRemarks] = useState({});
  const [overallRemarks, setOverallRemarks] = useState('');

  const loadSubmissions = async () => {
    setQueueLoading(true);
    setError('');
    try {
      const list = await evaluationApi.listSubmissions();
      setSubmissions(list.filter((item) => ['submitted', 'evaluated'].includes(item.status)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load submissions.'));
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const submissionsWithLabels = useMemo(() => submissions.map((submission) => {
    const student = students.find((item) => item.id === submission.studentId);
    const assessment = assessments.find((item) => item.id === submission.assessmentId);
    return {
      ...submission,
      studentName: student?.name || (selectedResult?.student?.id === submission.studentId ? selectedResult?.student?.name : null) || 'Unknown Student',
      studentAvatar: student?.avatar,
      assessmentTitle: assessment?.title || (selectedResult?.assessment?.id === submission.assessmentId ? selectedResult?.assessment?.title : null) || 'Unknown Assessment'
    };
  }), [assessments, selectedResult, students, submissions]);

  const filteredSubs = submissionsWithLabels.filter((submission) => {
    const matchesSearch =
      submission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.assessmentTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGraded =
      filterGraded === 'all' ||
      (filterGraded === 'pending' && !submission.isEvaluated) ||
      (filterGraded === 'graded' && submission.isEvaluated);

    return matchesSearch && matchesGraded;
  });

  const currentSub = submissionsWithLabels.find((submission) => submission.id === selectedSubId);
  const currentAssessment = selectedResult?.assessment;
  const currentStudent = selectedResult?.student;
  const answers = selectedResult?.answers || [];
  const totalMarks = answers.reduce((sum, answer) => sum + (Number(answer.maxMarks) || 0), 0);
  const isAlreadyEvaluated = Boolean(currentSub?.isEvaluated || selectedResult?.isEvaluated);

  const handleSelectSubmission = async (submission) => {
    setSelectedSubId(submission.id);
    setSelectedResult(null);
    setResultLoading(true);
    setError('');

    try {
      const result = await evaluationApi.getResult(submission.id);
      setSelectedResult(result);
      setOverallRemarks(result.remarks || '');
      setQuestionMarks(Object.fromEntries((result.answers || []).map((answer) => [answer.questionId, answer.marksAwarded || 0])));
      setQuestionRemarks(Object.fromEntries((result.answers || []).map((answer) => [answer.questionId, answer.remarks || ''])));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load submission result.'));
    } finally {
      setResultLoading(false);
    }
  };

  const handleMarkChange = (questionId, value, maxMarks) => {
    const safeValue = Math.max(0, Math.min(Number(maxMarks) || 0, Number(value) || 0));
    setQuestionMarks((prev) => ({ ...prev, [questionId]: safeValue }));
  };

  const handleRemarkChange = (questionId, value) => {
    setQuestionRemarks((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedSubId || isAlreadyEvaluated || submitLoading) return;
    setSubmitLoading(true);
    try {
      const payload = {
        questionEvaluations: answers.map((answer) => ({
          questionId: answer.questionId,
          marksAwarded: questionMarks[answer.questionId] ?? 0,
          remarks: questionRemarks[answer.questionId] || ''
        })),
        overallRemarks: overallRemarks.trim()
      };
      const evaluated = await evaluationApi.evaluate(selectedSubId, payload);
      setSubmissions((prev) => prev.map((submission) => submission.id === evaluated.id ? evaluated : submission));
      const result = await evaluationApi.getResult(selectedSubId);
      setSelectedResult(result);
      toast.add('Evaluation published. Student result is now available.', 'success');
    } catch (err) {
      toast.add(getApiErrorMessage(err, 'Failed to publish evaluation.'), 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAutoEvaluate = async () => {
    if (!answers.length || isAlreadyEvaluated) return;
    setIsEvaluatingAi(true);
    toast.add('AI is preparing suggested marks. Review before publishing.', 'info');

    const newMarks = { ...questionMarks };
    const newRemarks = { ...questionRemarks };

    try {
      for (const answer of answers) {
        const aiResult = await evaluateSubmissionAI(
          answer.question || answer.questionText || 'Question',
          getAnswerString(answer),
          answer.maxMarks || 0,
          answer.type || 'manual',
          getCorrectAnswerText(answer) || ''
        );
        newMarks[answer.questionId] = Math.min(Number(answer.maxMarks) || 0, Number(aiResult.suggestedMarks) || 0);
        newRemarks[answer.questionId] = `[AI Auto-Scored]: ${aiResult.remarks}`;
      }
      setQuestionMarks(newMarks);
      setQuestionRemarks(newRemarks);
      toast.add('Auto-evaluation suggestions are ready.', 'success');
    } catch {
      toast.add('Auto-evaluation failed. You can still grade manually.', 'error');
    } finally {
      setIsEvaluatingAi(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] -mt-6 -mx-6 bg-neutral-100 dark:bg-[#0a0a0a] flex flex-col lg:flex-row overflow-hidden">
      <div className="w-full lg:w-[380px] h-1/3 lg:h-auto shrink-0 bg-white dark:bg-neutral-900 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800 flex flex-col z-10">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 space-y-4">
          <div>
            <h2 className="font-display font-black text-xl text-neutral-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-[#6C1D5F]" /> Evaluation
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Review backend submissions and provide feedback.</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or assessment..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]"
            />
          </div>

          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            {['pending', 'graded', 'all'].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterGraded(mode)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${filterGraded === mode ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {queueLoading ? (
            <div className="p-8 text-center text-neutral-400">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm font-medium">Loading submissions...</p>
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No submissions found in this queue.</p>
            </div>
          ) : (
            filteredSubs.map((submission) => {
              const isSelected = selectedSubId === submission.id;
              return (
                <button
                  key={submission.id}
                  onClick={() => handleSelectSubmission(submission)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${isSelected ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 shadow-sm' : 'bg-white dark:bg-neutral-900 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C1D5F] to-[#84117C] text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                        {submission.studentName?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-[#6C1D5F] dark:text-purple-300' : 'text-neutral-900 dark:text-white'}`}>
                          {submission.studentName}
                        </p>
                        <p className="text-[10px] text-neutral-500 line-clamp-1">{submission.assessmentTitle}</p>
                      </div>
                    </div>
                    {submission.isEvaluated ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {selectedSubId && currentSub ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-[#0a0a0a] relative">
            <div className="max-w-3xl mx-auto p-8 space-y-8">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/40 text-sm">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              {resultLoading ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center text-neutral-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-sm font-bold">Loading detailed result...</p>
                </div>
              ) : selectedResult ? (
                <>
                  <div className="pb-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-4 shadow-sm">
                      <FileText className="w-3.5 h-3.5" />
                      {String(currentAssessment?.type || 'assessment').replace('_', ' ').toUpperCase()}
                    </div>
                    <h1 className="text-3xl font-display font-black text-neutral-900 dark:text-white mb-2">{currentAssessment?.title || currentSub.assessmentTitle}</h1>
                    <p className="text-sm text-neutral-500">Submitted by {currentStudent?.name || currentSub.studentName}</p>
                  </div>

                  <div className="space-y-6">
                    {answers.map((answer, index) => {
                      const correctAnswer = getCorrectAnswerText(answer);
                      return (
                        <div key={answer.questionId} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                          <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 flex-1">
                                <span className="text-neutral-400 mr-2">{index + 1}.</span>
                                {answer.question || 'Untitled Question'}
                              </h4>
                              <div className="shrink-0 text-xs font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                                {answer.maxMarks} Marks
                              </div>
                            </div>
                          </div>

                          <div className="p-5 bg-neutral-50 dark:bg-[#0a0a0a] space-y-4">
                            <div>
                              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Student's Answer:</p>
                              <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                                {formatAnswerText(answer)}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-bold text-[#01AC9F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" /> Expected Correct Answer:
                              </p>
                              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm text-sm text-emerald-700 dark:text-emerald-300">
                                {correctAnswer || <span className="italic opacity-60">Manual evaluation required / correct answer hidden</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="w-full lg:w-[400px] h-1/2 lg:h-auto shrink-0 bg-white dark:bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 flex flex-col shadow-xl z-20">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur z-10">
              <h3 className="font-bold text-sm flex items-center gap-2 dark:text-white">
                <Award className="w-4 h-4 text-[#6C1D5F]" /> Grading Panel
              </h3>
              <button
                onClick={handleAutoEvaluate}
                disabled={isEvaluatingAi || isAlreadyEvaluated || !answers.length}
                className="text-[10px] font-bold flex items-center gap-1 text-white bg-[#6C1D5F] hover:bg-[#84117C] px-3 py-1.5 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEvaluatingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                {isEvaluatingAi ? 'Analyzing...' : 'Auto Evaluation Using AI'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {isAlreadyEvaluated && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40 text-xs font-bold">
                  This submission is already evaluated. Backend re-evaluation is intentionally blocked.
                </div>
              )}

              <div className="space-y-4">
                {answers.map((answer, index) => (
                  <div key={answer.questionId} className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Q{index + 1} Marks</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={answer.maxMarks}
                          disabled={isAlreadyEvaluated}
                          value={questionMarks[answer.questionId] !== undefined ? questionMarks[answer.questionId] : ''}
                          onChange={(event) => handleMarkChange(answer.questionId, event.target.value, answer.maxMarks)}
                          className="w-16 px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-sm text-center font-bold focus:ring-2 focus:ring-[#6C1D5F] focus:outline-none dark:text-white disabled:opacity-60"
                        />
                        <span className="text-xs text-neutral-500 font-bold">/ {answer.maxMarks}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Remarks</label>
                      <input
                        type="text"
                        placeholder="Optional feedback..."
                        disabled={isAlreadyEvaluated}
                        value={questionRemarks[answer.questionId] || ''}
                        onChange={(event) => handleRemarkChange(answer.questionId, event.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:ring-2 focus:ring-[#6C1D5F] focus:outline-none dark:text-white disabled:opacity-60"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-400" /> Overall Feedback
                </label>
                <textarea
                  rows={4}
                  placeholder="Summarize the student's performance..."
                  disabled={isAlreadyEvaluated}
                  value={overallRemarks}
                  onChange={(event) => setOverallRemarks(event.target.value)}
                  className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-[#6C1D5F] focus:outline-none resize-none dark:text-white shadow-sm disabled:opacity-60"
                />
              </div>
            </div>

            <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-neutral-500">Total Score:</span>
                <span className="text-2xl font-black text-[#6C1D5F] dark:text-purple-400">
                  {Object.values(questionMarks).reduce((sum, mark) => sum + Number(mark || 0), 0)} <span className="text-sm text-neutral-400">/ {totalMarks}</span>
                </span>
              </div>
              <button
                onClick={handleSubmitEvaluation}
                disabled={isAlreadyEvaluated || submitLoading || !answers.length}
                className="w-full py-3 bg-gradient-to-r from-[#6C1D5F] to-[#84117C] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isAlreadyEvaluated ? 'Evaluation Already Published' : 'Publish Evaluation'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 bg-neutral-50/50 dark:bg-neutral-950/20">
          <Layers className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-bold text-neutral-500 dark:text-neutral-400">Select a submission to evaluate</p>
          <p className="text-sm mt-1">Click on any student in the queue to begin grading.</p>
          {error && <p className="text-sm mt-4 text-rose-500">{error}</p>}
        </div>
      )}
    </div>
  );
};
