import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import Markdown from 'react-markdown';
import { useLMS } from '../context/LMSContext';
import { assessmentApi, codingApi, draftApi, submissionApi } from '../api/client';
import { toast } from '../components/Toast';
import {
  AlertTriangle,
  BookOpen,
  Bug,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Maximize2,
  Minimize2,
  Moon,
  Play,
  RefreshCw,
  Send,
  Sun,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { debugCodeWithAI } from '../utils/aiService';

export const TakeCoding = () => {
  const { slug: assessmentId } = useParams();
  const navigate = useNavigate();
  const { currentUser, theme, toggleTheme, refreshStudentCoreData } = useLMS();

  const [assessment, setAssessment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [codeValue, setCodeValue] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [consoleTab, setConsoleTab] = useState('testcases');
  const [runResult, setRunResult] = useState(null);
  const [submittedCodes, setSubmittedCodes] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugOutput, setDebugOutput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const containerRef = useRef(null);
  const finalizedRef = useRef(false);

  const problems = useMemo(() => {
    return (assessment?.questions || []).filter((question) => question.type === 'coding');
  }, [assessment]);

  const currentProblem = problems[currentProblemIdx];

  useEffect(() => {
    let active = true;

    const loadCodingAttempt = async () => {
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
        const totalSeconds = (Number(loadedAssessment.duration) || 60) * 60;
        setSecondsLeft(Number(draft?.draftData?.timeRemaining) || totalSeconds);
        setSubmittedCodes(draft?.draftData?.submittedCodes || {});
      } catch (loadError) {
        if (active) setError(loadError.message || 'Failed to load coding assessment.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCodingAttempt();
    return () => {
      active = false;
    };
  }, [assessmentId, currentUser?.id]);

  useEffect(() => {
    if (!currentProblem) return;
    const allowed = currentProblem.codingLanguagesAllowed?.length
      ? currentProblem.codingLanguagesAllowed
      : ['javascript', 'python', 'java', 'cpp'];
    const language = allowed.includes(selectedLanguage) ? selectedLanguage : allowed[0];
    const savedCode = submittedCodes[currentProblem.id]?.code;
    const starterCode = currentProblem.codingTemplates?.[language] || `// Write your ${language} solution here`;

    setSelectedLanguage(language);
    setCodeValue(savedCode || starterCode);
    setRunResult(null);
    setConsoleOutput('');
    setConsoleTab('testcases');
  }, [currentProblem?.id]);

  useEffect(() => {
    if (!assessment || finalizedRef.current || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [assessment?.id, secondsLeft]);

  useEffect(() => {
    if (!assessment || !currentUser?.id || finalizedRef.current) return;
    const timer = setTimeout(() => {
      draftApi.save(currentUser.id, assessment.id, {
        currentQuestion: currentProblemIdx,
        timeRemaining: secondsLeft,
        submittedCodes
      }).catch((draftError) => console.warn('Coding draft save failed', draftError));
    }, 800);

    return () => clearTimeout(timer);
  }, [assessment?.id, currentUser?.id, currentProblemIdx, secondsLeft, submittedCodes]);

  useEffect(() => {
    if (secondsLeft === 0 && submission && !finalizedRef.current) {
      handleFinalizeExam();
    }
  }, [secondsLeft, submission]);

  const allowedLanguages = currentProblem?.codingLanguagesAllowed?.length
    ? currentProblem.codingLanguagesAllowed
    : ['javascript', 'python', 'java', 'cpp'];

  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleLanguageChange = (language) => {
    if (currentProblem) {
      setSubmittedCodes((prev) => ({
        ...prev,
        [currentProblem.id]: {
          ...(prev[currentProblem.id] || {}),
          language: selectedLanguage,
          code: codeValue
        }
      }));
    }

    setSelectedLanguage(language);
    setCodeValue(currentProblem?.codingTemplates?.[language] || `// Write your ${language} solution here`);
  };

  const handleEditorChange = (value) => {
    const nextCode = value || '';
    setCodeValue(nextCode);
    if (!currentProblem) return;
    setSubmittedCodes((prev) => ({
      ...prev,
      [currentProblem.id]: {
        ...(prev[currentProblem.id] || {}),
        language: selectedLanguage,
        code: nextCode
      }
    }));
  };

  const handleRunCode = async () => {
    if (!codeValue.trim()) {
      toast.add('Cannot run empty code.', 'warning');
      return;
    }

    setIsEvaluating(true);
    setConsoleTab('console');
    setConsoleOutput('Sending code to backend placeholder runner...\nNo real code execution is performed in this phase.\n');

    try {
      const response = await codingApi.run({
        assessmentId: assessment.id,
        questionId: currentProblem.id,
        language: selectedLanguage,
        code: codeValue,
        customInput: useCustomInput ? customInput : ''
      });

      setRunResult(response);
      setConsoleOutput((prev) => `${prev}${response.message || 'Placeholder run completed.'}\nStatus: ${response.status}\nOutput: ${response.output || ''}\n`);
      setConsoleTab('results');
    } catch (runError) {
      setConsoleOutput((prev) => `${prev}Backend placeholder run failed.\n`);
      toast.add(runError.message || 'Code run failed.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!codeValue.trim()) {
      toast.add('Cannot submit empty code.', 'warning');
      return;
    }

    setIsEvaluating(true);
    setConsoleTab('console');
    setConsoleOutput('Submitting code to backend placeholder API...\n');

    try {
      const response = await codingApi.submit({
        submissionId: submission?.id,
        assessmentId: assessment.id,
        questionId: currentProblem.id,
        language: selectedLanguage,
        code: codeValue
      });

      setSubmittedCodes((prev) => ({
        ...prev,
        [currentProblem.id]: {
          language: selectedLanguage,
          code: codeValue,
          status: response.status,
          score: Number(response.score) || 0,
          submittedAt: response.submittedAt
        }
      }));
      setConsoleOutput((prev) => `${prev}Coding submission saved.\nStatus: ${response.status}\nScore placeholder: ${response.score || 0}/${currentProblem.marks} pts.\n`);
      toast.add('Code submitted. Backend placeholder execution only.', 'success');

      if (currentProblemIdx < problems.length - 1) {
        setCurrentProblemIdx((prev) => prev + 1);
      }
    } catch (submitError) {
      setConsoleOutput((prev) => `${prev}Backend coding submission failed.\n`);
      toast.add(submitError.message || 'Code submission failed.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDebugWithAI = async () => {
    if (!codeValue.trim()) {
      toast.add('Cannot debug empty code.', 'warning');
      return;
    }

    setIsDebugging(true);
    setConsoleTab('debug');
    setDebugOutput('Analyzing code and execution logs with AI Tutor...\n');

    try {
      const problemStatement = currentProblem.codingExplanation || currentProblem.question || currentProblem.text;
      const hint = await debugCodeWithAI(codeValue, selectedLanguage, problemStatement, consoleOutput || 'No logs available.');
      setDebugOutput(`### AI Tutor Hint\n\n${hint}`);
    } catch {
      setDebugOutput('Error: AI Tutor is currently unavailable.');
      toast.add('AI Debugger failed.', 'error');
    } finally {
      setIsDebugging(false);
    }
  };

  const handleFinalizeExam = async () => {
    if (!submission || finalizedRef.current) return;
    finalizedRef.current = true;

    try {
      const answers = problems.map((problem) => ({
        questionId: problem.id,
        answer: submittedCodes[problem.id] || {
          language: selectedLanguage,
          code: problem.id === currentProblem?.id ? codeValue : '',
          status: 'SUBMITTED_PLACEHOLDER'
        }
      }));
      const totalSeconds = (Number(assessment.duration) || 60) * 60;
      const completed = await submissionApi.submit(submission.id, {
        answers,
        timeTaken: Math.max(1, totalSeconds - secondsLeft)
      });

      await refreshStudentCoreData?.().catch(() => null);
      setShowConfirmModal(false);
      toast.add('Coding assessment finalized successfully.', 'success');
      navigate(`/results/${assessment.id}/${completed.id}`);
    } catch (finalizeError) {
      finalizedRef.current = false;
      toast.add(finalizeError.message || 'Failed to finalize coding assessment.', 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border dark:border-neutral-800">Loading coding assessment...</div>;
  }

  if (error || !assessment || problems.length === 0 || !currentProblem) {
    return (
      <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-brand-border dark:border-neutral-800">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white">Coding Assessment unavailable</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">{error || 'No coding questions are configured.'}</p>
        <button onClick={() => navigate('/assessments')} className="mt-4 px-4 py-2 bg-[#6C1D5F] hover:bg-[#84117C] text-white rounded-2xl text-xs font-bold uppercase tracking-wider">
          Return to Assessments
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} id="coding-challenge-workspace" className="h-screen flex flex-col bg-neutral-50 dark:bg-[#1E1E1E] text-neutral-800 dark:text-neutral-200 overflow-hidden font-sans select-none transition-colors duration-300">
      <header className="h-14 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowConfirmModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-neutral-600 dark:text-neutral-400 hover:text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Exit
          </button>
          <div>
            <h1 className="text-sm font-black text-neutral-900 dark:text-white leading-tight">{assessment.title}</h1>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Coding Placeholder Flow</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-bold text-neutral-500">
            <Clock className="w-4 h-4 text-rose-500" /> {formatTimer(secondsLeft)}
          </div>
          <button onClick={toggleTheme} className="p-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-white">
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button onClick={toggleFullscreen} className="p-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-white">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <aside className="w-full lg:w-[38%] xl:w-[34%] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="px-2 py-1 rounded-lg bg-[#6C1D5F]/10 text-[#6C1D5F] dark:text-purple-300 text-[10px] font-black uppercase">
              Problem {currentProblemIdx + 1} of {problems.length}
            </span>
            <span className="text-xs font-black text-[#01AC9F]">{currentProblem.marks} pts</span>
          </div>

          <div>
            <h2 className="font-display font-black text-xl text-neutral-900 dark:text-white">{currentProblem.question || currentProblem.text}</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">{currentProblem.codingExplanation || currentProblem.explanation || 'Solve the problem using one of the allowed languages.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] text-neutral-500 uppercase font-bold">Time Limit</p>
              <p className="font-black mt-1">{currentProblem.codingTimeLimit || 1000} ms</p>
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] text-neutral-500 uppercase font-bold">Memory</p>
              <p className="font-black mt-1">{currentProblem.codingMemoryLimit || 256} MB</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-neutral-500 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Public Test Cases</h3>
            {(currentProblem.codingTestCases || []).filter((testCase) => testCase.visibility === 'public').map((testCase, index) => (
              <div key={testCase.id || index} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono space-y-1">
                <p><span className="text-neutral-500">Input:</span> {testCase.input}</p>
                <p><span className="text-neutral-500">Expected:</span> {testCase.expectedOutput || testCase.output}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex-1 min-w-0 flex flex-col bg-neutral-100 dark:bg-[#1E1E1E]">
          <div className="h-12 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <select value={selectedLanguage} onChange={(event) => handleLanguageChange(event.target.value)} className="bg-neutral-100 dark:bg-neutral-800 text-xs font-bold rounded-lg px-3 py-1.5 border border-neutral-200 dark:border-neutral-700">
                {allowedLanguages.map((language) => <option key={language} value={language}>{language}</option>)}
              </select>
              <span className="text-[10px] text-neutral-500">Backend run is a safe placeholder.</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRunCode} disabled={isEvaluating || isDebugging} className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                <Play className="w-3.5 h-3.5 text-[#01AC9F]" /> Run Code
              </button>
              <button onClick={handleSubmitCode} disabled={isEvaluating || isDebugging} className="px-5 py-1.5 bg-[#6C1D5F] hover:bg-[#84117C] text-white text-xs font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                <Send className="w-3.5 h-3.5 text-purple-300" /> Submit Code
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
              theme={theme === 'light' ? 'light' : 'vs-dark'}
              value={codeValue}
              onChange={handleEditorChange}
              options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false }}
            />
          </div>

          <div className="h-64 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex flex-col">
            <div className="h-10 bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-3">
              <div className="flex gap-1.5">
                {[
                  ['testcases', Terminal, 'Test Cases'],
                  ['console', Terminal, 'Console'],
                  ['results', CheckCircle2, 'Run Results'],
                  ['debug', Bug, 'AI Tutor']
                ].map(([id, Icon, label]) => (
                  <button key={id} onClick={() => setConsoleTab(id)} className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 ${consoleTab === id ? 'bg-[#6C1D5F] text-white' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'}`}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
              <button onClick={handleDebugWithAI} disabled={isEvaluating || isDebugging} className="text-[10px] font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 flex items-center gap-1 disabled:opacity-50">
                <Bug className="w-3 h-3" /> AI Debug
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-neutral-50 dark:bg-neutral-950">
              {consoleTab === 'testcases' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 uppercase">
                    <input type="checkbox" checked={useCustomInput} onChange={(event) => setUseCustomInput(event.target.checked)} /> Enable custom input
                  </label>
                  {useCustomInput && <textarea value={customInput} onChange={(event) => setCustomInput(event.target.value)} className="w-full h-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5" placeholder="Paste custom input..." />}
                  <p className="text-neutral-500">Click Run Code to call the backend placeholder runner.</p>
                </div>
              )}
              {consoleTab === 'console' && (
                <div className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                  {isEvaluating ? <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin text-[#01AC9F]" /> Calling backend placeholder...</span> : consoleOutput || 'Ready.'}
                </div>
              )}
              {consoleTab === 'results' && (
                <div className="space-y-2">
                  {runResult ? (
                    <>
                      <p>Status: <strong>{runResult.status}</strong></p>
                      <p>Message: {runResult.message}</p>
                      {(runResult.testCaseResults || []).map((result, index) => (
                        <div key={index} className={`p-2 rounded-lg border ${result.passed ? 'border-emerald-500 text-emerald-600' : 'border-rose-500 text-rose-600'}`}>
                          Case {index + 1}: {result.passed ? 'PASS' : 'FAIL'}
                        </div>
                      ))}
                    </>
                  ) : <p className="text-neutral-500">No run results yet.</p>}
                </div>
              )}
              {consoleTab === 'debug' && (
                <div className="whitespace-pre-wrap leading-relaxed text-neutral-900 dark:text-neutral-300 font-sans">
                  {isDebugging ? <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> AI Tutor is analyzing...</span> : <Markdown className="prose prose-sm dark:prose-invert max-w-none">{debugOutput || 'Click AI Debug for a hint.'}</Markdown>}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-neutral-200 space-y-4">
              <h4 className="font-display font-black text-sm text-white uppercase tracking-wider">Finalize Coding Assessment?</h4>
              <p className="text-xs text-neutral-500">This submits placeholder coding answers to the normal submission result flow.</p>
              <div className="flex items-center justify-end gap-2 border-t border-neutral-800 pt-3">
                <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 hover:bg-neutral-800 rounded-2xl text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-white">Cancel</button>
                <button onClick={handleFinalizeExam} className="px-5 py-2 bg-[#6C1D5F] hover:bg-[#84117C] text-white font-bold rounded-2xl text-xs uppercase tracking-wider">Finalize and Exit</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
