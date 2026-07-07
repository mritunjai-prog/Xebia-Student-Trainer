import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLMS } from '../context/LMSContext';
import { toast } from '../components/Toast';
import Editor from '@monaco-editor/react';
import Markdown from 'react-markdown';
import {
  Play,
  Send,
  RefreshCw,

  Maximize2,
  Minimize2,
  ChevronLeft,
  Clock,
  Terminal,


  Tag,

  FileCode2,

  CheckCircle2,

  BookOpen,
  AlertTriangle,
  Flame,
  Info } from





'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


export const TakeCoding = () => {
  const { slug } = useParams();
  const { assessments, currentUser, startAssessment, submitAssessment, submitCodingSubmission, codingSubmissions } = useLMS();
  const navigate = useNavigate();

  const assessment = assessments.find((a) => (a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'assessment') === slug && a.type === 'coding');

  if (!currentUser || !assessment) {
    return (
      <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-brand-border dark:border-neutral-700 dark:border-neutral-800">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white">Coding Assessment not found</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
          We could not locate this coding challenge. It may have been archived or removed by the trainer.
        </p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-[#6C1D5F] hover:bg-[#84117C] text-white rounded-2xl text-xs font-bold font-display uppercase tracking-wider">
          Return to Dashboard
        </button>
      </div>);
  }

  // Active submission / state
  const [submission, setSubmission] = useState(null);
  const [problems, setProblems] = useState(assessment.questions || []);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const currentProblem = problems[currentProblemIdx];

  if (!currentProblem) {
    return (
      <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-brand-border dark:border-neutral-700 dark:border-neutral-800">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white">No Problems Found</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
          This coding assessment currently has no problems configured. Please contact your trainer.
        </p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-[#6C1D5F] hover:bg-[#84117C] text-white rounded-2xl text-xs font-bold font-display uppercase tracking-wider">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Editor states
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [codeValue, setCodeValue] = useState('');

  // Custom Input State
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');

  // Console tabs: 'testcases' | 'console' | 'results'
  const [consoleTab, setConsoleTab] = useState('testcases');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // General assessment timer (in seconds)
  const [secondsLeft, setSecondsLeft] = useState(assessment.duration * 60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('problem');

  // References
  const containerRef = useRef(null);

  // 1. Initialize assessment attempt
  useEffect(() => {
    const attempt = startAssessment(assessment.id, currentUser.id);
    setSubmission(attempt);

    // Calc remaining seconds left
    if (attempt.startedAt) {
      const elapsedSecs = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      const totalSecs = assessment.duration * 60;
      const remaining = Math.max(0, totalSecs - elapsedSecs);
      setSecondsLeft(remaining);
    }
  }, [id]);

  // 2. Countdown Timer ticking
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // 3. Load templates or previous autosaved drafts for the current problem
  useEffect(() => {
    if (!currentProblem) return;

    // Default to the first allowed language of the current problem
    const allowed = currentProblem.codingLanguagesAllowed || ['javascript', 'python', 'java'];
    const initialLang = allowed.includes('javascript') ? 'javascript' : allowed[0];
    setSelectedLanguage(initialLang);

    // Try to load autosave draft from LocalStorage
    const draftKey = `draft_code_${assessment.id}_${currentProblem.id}_${initialLang}`;
    const savedCode = localStorage.getItem(draftKey);

    if (savedCode) {
      setCodeValue(savedCode);
    } else {
      // Load starter template
      const template = currentProblem.codingTemplates?.[initialLang] || `// Write your ${initialLang} solution here`;
      setCodeValue(template);
    }

    // Clear evaluation console outputs
    setEvaluationResult(null);
    setConsoleOutput('');
    setConsoleTab('testcases');
  }, [currentProblemIdx]);

  // 4. Handle language change, loading respective drafts/templates
  const handleLanguageChange = (lang) => {
    // Save current draft before switching
    const currentDraftKey = `draft_code_${assessment.id}_${currentProblem.id}_${selectedLanguage}`;
    localStorage.setItem(currentDraftKey, codeValue);

    setSelectedLanguage(lang);

    // Load next draft/template
    const nextDraftKey = `draft_code_${assessment.id}_${currentProblem.id}_${lang}`;
    const savedCode = localStorage.getItem(nextDraftKey);
    if (savedCode) {
      setCodeValue(savedCode);
    } else {
      const template = currentProblem.codingTemplates?.[lang] || `// Write your ${lang} solution here`;
      setCodeValue(template);
    }
  };

  // 5. Code Autosave on typing
  const handleEditorChange = (value) => {
    const val = value || '';
    setCodeValue(val);

    // Save in draft key
    const draftKey = `draft_code_${assessment.id}_${currentProblem.id}_${selectedLanguage}`;
    localStorage.setItem(draftKey, val);
  };

  // Fullscreen support
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Format timer string
  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor(secs % 3600 / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 6. Mock Code Execution (Run Code)
  const handleRunCode = () => {
    if (!codeValue.trim()) {
      toast.add('Cannot execute empty code canvas.', 'warning');
      return;
    }

    setIsEvaluating(true);
    setConsoleTab('console');
    setConsoleOutput('Starting simulation sandbox...\nCompiling source tree...\nRunning code against public test cases...\n');

    setTimeout(() => {
      // Determine compilation success
      if (codeValue.includes('syntax_error') || codeValue.includes('syntax-error')) {
        setConsoleOutput((prev) => prev + 'Compilation failed.\nERROR: SyntaxError: Unexpected end of input at line 4\n');
        setEvaluationResult({
          status: 'Compilation Error',
          executionTime: 0,
          memoryUsage: 0,
          testResults: []
        });
        setIsEvaluating(false);
        return;
      }

      // Check for timeout keywords
      if (codeValue.includes('infinite_loop') || codeValue.includes('while(true)')) {
        setConsoleOutput((prev) => prev + 'SIGTERM: Time Limit Exceeded. Process killed after 1500ms.\n');
        setEvaluationResult({
          status: 'Time Limit Exceeded',
          executionTime: 1.5,
          memoryUsage: 45.2,
          testResults: []
        });
        setIsEvaluating(false);
        return;
      }

      // Simulation delay parameters
      const runTime = (Math.random() * 0.12 + 0.02).toFixed(3);
      const memUsed = (Math.random() * 12 + 15).toFixed(1);

      // Custom Input simulation
      if (useCustomInput) {
        setConsoleOutput((prev) => prev + `SUCCESS: Executed correctly.\n--- INPUT ---\n${customInput || 'None'}\n--- OUTPUT ---\n${customInput ? 'Modified: ' + customInput : 'Mock output calculated.'}\n`);
        setEvaluationResult({
          status: 'Accepted',
          executionTime: parseFloat(runTime),
          memoryUsage: parseFloat(memUsed),
          testResults: []
        });
        setIsEvaluating(false);
        return;
      }

      // Standard public testcases execution
      const testCases = currentProblem.codingTestCases || [];
      const publicCases = testCases.filter((tc) => tc.visibility === 'public');

      // Determine if code is empty template (or unmodified)
      const isTemplate = codeValue.includes('// Write your') || codeValue.includes('# Write your') || codeValue.trim().length < 50;

      const results = publicCases.map((tc, index) => {
        // If template: fail. If they typed a nice looking code, let it pass 90% of the time
        let passed = !isTemplate;
        if (codeValue.includes('fail_case')) passed = false;

        return {
          id: tc.id,
          input: tc.input,
          expected: tc.expectedOutput,
          actual: passed ? tc.expectedOutput : 'Template placeholder return',
          passed,
          visibility: 'public',
          weight: tc.weight
        };
      });

      const allPassed = results.every((r) => r.passed);
      const statusText = allPassed ? 'Accepted' : 'Wrong Answer';

      setConsoleOutput((prev) => prev + `Execution completed in ${runTime}s using ${memUsed}MB.\n${allPassed ? 'ALL PUBLIC TEST CASES PASSED ✓' : 'SOME TEST CASES FAILED ✗'}\n`);

      setEvaluationResult({
        status: statusText,
        executionTime: parseFloat(runTime),
        memoryUsage: parseFloat(memUsed),
        testResults: results
      });

      setIsEvaluating(false);
    }, 1500);
  };

  // 7. Mock Submission evaluation (Submit Code)
  const handleSubmitCode = () => {
    if (!codeValue.trim()) {
      toast.add('Cannot submit empty code workspace.', 'warning');
      return;
    }

    setIsEvaluating(true);
    setConsoleTab('console');
    setConsoleOutput('Preparing submission evaluation...\nRunning final code against all test suites (including hidden cases)...\n');

    setTimeout(() => {
      const isTemplate = codeValue.includes('// Write your') || codeValue.includes('# Write your') || codeValue.trim().length < 50;
      const testCases = currentProblem.codingTestCases || [];

      let overallStatus = 'Accepted';

      if (codeValue.includes('syntax_error')) overallStatus = 'Compilation Error';else
      if (codeValue.includes('infinite_loop')) overallStatus = 'Time Limit Exceeded';else
      if (isTemplate) overallStatus = 'Wrong Answer';else
      if (codeValue.includes('fail_hidden')) overallStatus = 'Partially Accepted';

      const results = testCases.map((tc) => {
        let passed = true;
        if (overallStatus === 'Wrong Answer' || overallStatus === 'Compilation Error' || overallStatus === 'Time Limit Exceeded') {
          passed = false;
        } else if (overallStatus === 'Partially Accepted' && tc.visibility === 'hidden') {
          passed = false;
        }
        return {
          id: tc.id,
          input: tc.input,
          expected: tc.expectedOutput,
          actual: passed ? tc.expectedOutput : overallStatus === 'Compilation Error' ? 'Compilation Error' : 'Mock Output Diff',
          passed,
          visibility: tc.visibility,
          weight: tc.weight
        };
      });

      const passedCount = results.filter((r) => r.passed).length;
      const totalWeight = testCases.reduce((sum, tc) => sum + tc.weight, 0) || 30;
      const passedWeightSum = results.filter((r) => r.passed).reduce((sum, r) => sum + r.weight, 0);

      // Calculate marks based on weight percentage
      const marksEarned = Math.round(passedWeightSum / totalWeight * currentProblem.marks);

      const runTime = (Math.random() * 0.15 + 0.05).toFixed(3);
      const memUsed = (Math.random() * 15 + 18).toFixed(1);

      const finalStatus = passedCount === testCases.length ? 'Accepted' : passedCount === 0 ? 'Wrong Answer' : 'Partially Accepted';

      setConsoleOutput((prev) => prev + `Evaluation finalized.\nPassed: ${passedCount}/${testCases.length} cases.\nStatus: ${finalStatus}\nScore awarded: ${marksEarned}/${currentProblem.marks} pts.\n`);

      const res = {
        status: finalStatus,
        executionTime: parseFloat(runTime),
        memoryUsage: parseFloat(memUsed),
        testResults: results,
        marksEarned
      };

      setEvaluationResult(res);
      setIsEvaluating(false);

      // Create detailed Coding Submission inside LocalStorage via LMSContext
      const codSub = {
        id: `CSUB-${Date.now()}`,
        assessmentId: assessment.id,
        studentId: currentUser.id,
        studentName: currentUser.name,
        problemId: currentProblem.id,
        problemTitle: currentProblem.question,
        code: codeValue,
        language: selectedLanguage,
        score: marksEarned,
        timeTaken: Math.max(10, Math.round(assessment.duration * 60 - secondsLeft)),
        memoryUsed: parseFloat(memUsed),
        status: finalStatus,
        testCasesPassed: passedCount,
        totalTestCases: testCases.length,
        submittedAt: new Date().toISOString()
      };

      // Call context to submit and store in LocalStorage!
      submitCodingSubmission(codSub);
      toast.add(`Draft locked for "${currentProblem.question}"! Score: ${marksEarned}/${currentProblem.marks}`, 'success');

      // Check if there is another problem to proceed
      if (currentProblemIdx < problems.length - 1) {
        setTimeout(() => {
          toast.add('Proceeding to next question...', 'info');
          setCurrentProblemIdx((prev) => prev + 1);
        }, 1200);
      }
    }, 1500);
  };

  // Autosubmit on timer expiration
  const handleAutoSubmit = () => {
    toast.add('Time is up! Autosubmitting exam results...', 'warning');
    handleFinalizeExam();
  };

  // Submit complete Assessment (Final submission)
  const handleFinalizeExam = () => {
    // Collect all sub-submissions for this assessment to calculate total standard submission
    const studentSubs = codingSubmissions.filter((sub) => sub.assessmentId === assessment.id && sub.studentId === currentUser.id);

    // Sum scores of each problem
    const totalScoreEarned = problems.reduce((sum, p) => {
      const match = studentSubs.find((s) => s.problemId === p.id);
      return sum + (match?.score || 0);
    }, 0);

    // Map answers for the standard lms submission
    const formattedAnswers = problems.map((p) => {
      const match = studentSubs.find((s) => s.problemId === p.id);
      return {
        questionId: p.id,
        answer: {
          code: match?.code || localStorage.getItem(`draft_code_${assessment.id}_${p.id}_javascript`) || '// No submission',
          language: match?.language || 'javascript',
          status: match?.status || 'Wrong Answer',
          score: match?.score || 0,
          submittedAt: match?.submittedAt || new Date().toISOString()
        }
      };
    });

    // Save standard LMS submission
    const lmsSub = submitAssessment(submission.id, formattedAnswers);
    toast.add('Exam finalized and successfully evaluated!', 'success');
    setShowConfirmModal(false);

    // Redirect to results page
    const slug = assessment.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'results';
    navigate(`/results/${slug}/${lmsSub.id || submission.id}`);
  };

  // Get student's previous attempts for this problem
  const previousAttempts = codingSubmissions.filter((sub) => sub.problemId === currentProblem.id && sub.studentId === currentUser.id);

  return (
    <div
      ref={containerRef}
      id="coding-challenge-workspace"
      className="h-screen flex flex-col bg-[#1E1E1E] text-neutral-200 overflow-hidden font-sans select-none">
      
      {/* 1. Header Bar */}
      <header className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Exit exam? Your current drafts are autosaved, but you must submit to finalize points.')) {
                navigate('/');
              }
            }}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-white transition-all cursor-pointer">
            
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="h-4 w-px bg-neutral-800"></div>

          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-400">
              {assessment.title}
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-display font-black leading-none text-white tracking-tight">
                {currentProblemIdx + 1}. {currentProblem.question}
              </h2>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${currentProblem.codingDifficulty === 'Easy' ? 'bg-green-950 text-green-400 border border-green-800' : currentProblem.codingDifficulty === 'Medium' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                {currentProblem.codingDifficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="hidden md:flex items-center gap-1.5">
          {problems.map((prob, idx) => {
            const hasSub = codingSubmissions.some((s) => s.problemId === prob.id && s.studentId === currentUser.id);
            return (
              <button
                key={prob.id}
                onClick={() => setCurrentProblemIdx(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold font-mono border flex items-center justify-center transition-all cursor-pointer ${idx === currentProblemIdx ? 'bg-[#6C1D5F] border-[#6C1D5F] text-white' : hasSub ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' : 'bg-neutral-800 border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-white'}`}
                title={prob.question}>
                
                {idx + 1}
              </button>);

          })}
        </div>

        <div className="flex items-center gap-4">
          {/* Global timer countdown */}
          <div className="flex items-center gap-2 px-3 py-1 bg-neutral-800 rounded-lg text-rose-400 font-mono font-bold text-xs border border-rose-900/40">
            <Clock className="w-4 h-4 animate-pulse text-rose-500" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
              title="Toggle Fullscreen">
              
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/20 cursor-pointer flex items-center gap-1">
              
              <Send className="w-3.5 h-3.5" />
              <span>Finalize Exam</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Workspace Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Panel: Problem Description */}
          <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col lg:border-r border-b lg:border-b-0 border-neutral-800 bg-neutral-900 overflow-hidden shrink-0 lg:shrink">
          {/* Problem Header Options Tabs */}
          <div className="h-10 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0">
            <div className="flex gap-1">
              <button
                onClick={() => setSidebarTab('problem')}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${sidebarTab === 'problem' ? 'bg-neutral-800 text-white' : 'text-neutral-500 dark:text-neutral-400 hover:text-white'}`}>
                
                Problem Description
              </button>
              <button
                onClick={() => setSidebarTab('hints')}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${sidebarTab === 'hints' ? 'bg-neutral-800 text-white' : 'text-neutral-500 dark:text-neutral-400 hover:text-white'}`}>
                
                Hints ({currentProblem.codingHints?.length || 0})
              </button>
              <button
                onClick={() => setSidebarTab('history')}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${sidebarTab === 'history' ? 'bg-neutral-800 text-white' : 'text-neutral-500 dark:text-neutral-400 hover:text-white'}`}>
                
                Attempts ({previousAttempts.length})
              </button>
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">
              Marks: {currentProblem.marks} pts
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
            
            {sidebarTab === 'problem' &&
            <div className="space-y-6">
                {/* Title */}
                <div className="space-y-1">
                  <h3 className="text-lg font-display font-bold text-white tracking-tight">
                    {currentProblem.question}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(currentProblem.codingTags || []).map((t) =>
                  <span key={t} className="px-2 py-0.5 bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full text-[9px] font-mono flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> {t}
                      </span>
                  )}
                  </div>
                </div>

                {/* Problem Statement Description via Markdown */}
                <div className="prose prose-sm prose-invert max-w-none text-neutral-300 text-xs md:text-sm leading-relaxed space-y-4">
                  <div className="bg-neutral-950/40 border border-neutral-800 p-4 rounded-2xl space-y-2">
                    <p className="font-bold text-neutral-100 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-[#01AC9F]" /> Problem Statement</p>
                    <Markdown>{currentProblem.codingExplanation || currentProblem.question}</Markdown>
                  </div>
                </div>

                {/* Constraints */}
                {currentProblem.codingConstraints &&
              <div className="space-y-2">
                    <h4 className="text-xs uppercase font-mono font-bold text-neutral-500 dark:text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-500" /> Constraints
                    </h4>
                    <pre className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl font-mono text-xs text-neutral-500 dark:text-neutral-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {currentProblem.codingConstraints}
                    </pre>
                  </div>
              }

                {/* Input Format */}
                {currentProblem.codingInputFormat &&
              <div className="space-y-1.5">
                    <h4 className="text-xs uppercase font-mono font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">Input Format</h4>
                    <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/40 p-3 rounded-2xl border border-neutral-800">
                      {currentProblem.codingInputFormat}
                    </p>
                  </div>
              }

                {/* Output Format */}
                {currentProblem.codingOutputFormat &&
              <div className="space-y-1.5">
                    <h4 className="text-xs uppercase font-mono font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">Output Format</h4>
                    <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/40 p-3 rounded-2xl border border-neutral-800">
                      {currentProblem.codingOutputFormat}
                    </p>
                  </div>
              }

                {/* Sample Input/Output */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase font-mono text-neutral-500 dark:text-neutral-400 tracking-wider">Sample Input</span>
                    <pre className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl font-mono text-xs text-emerald-400 overflow-x-auto leading-normal">
                      {currentProblem.codingSampleInput}
                    </pre>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase font-mono text-neutral-500 dark:text-neutral-400 tracking-wider">Sample Output</span>
                    <pre className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl font-mono text-xs text-emerald-400 overflow-x-auto leading-normal">
                      {currentProblem.codingSampleOutput}
                    </pre>
                  </div>
                </div>

                {/* Notes */}
                {currentProblem.codingNotes &&
              <div className="p-3.5 bg-neutral-950/30 border border-neutral-800 rounded-2xl flex gap-2.5 text-neutral-500 dark:text-neutral-400">
                    <Info className="w-5 h-5 text-blue-500 shrink-0" />
                    <div className="text-[11px] leading-relaxed">
                      <strong className="text-neutral-300 font-medium">Author Notes:</strong> {currentProblem.codingNotes}
                    </div>
                  </div>
              }
              </div>
            }

            {sidebarTab === 'hints' &&
            <div className="space-y-4">
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Algorithm Hints</h3>
                {currentProblem.codingHints && currentProblem.codingHints.length > 0 ?
              currentProblem.codingHints.map((hint, i) =>
              <div key={i} className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-bold font-mono text-[#01AC9F]">HINT #{i + 1}</span>
                      <p className="text-xs text-neutral-300 leading-relaxed">{hint}</p>
                    </div>
              ) :

              <p className="text-xs text-neutral-500">No hints available for this problem.</p>
              }
              </div>
            }

            {sidebarTab === 'history' &&
            <div className="space-y-4">
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Previous Submissions</h3>
                {previousAttempts.length === 0 ?
              <p className="text-xs text-neutral-500">No attempts saved yet. Click "Submit Code" to runhidden tests.</p> :

              previousAttempts.map((att, idx) =>
              <div key={att.id} className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${att.status === 'Accepted' ? 'text-green-500' : 'text-amber-500'}`}>{att.status}</span>
                          <span className="text-neutral-500">•</span>
                          <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[10px]">{att.language}</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{new Date(att.submittedAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">{att.score}</span> / {currentProblem.marks} pts
                      </div>
                    </div>
              )
              }
              </div>
            }
          </div>
        </div>

        {/* Right Panel: Code Editor */}
          <div className="w-full lg:w-1/2 flex flex-col bg-[#1E1E1E] overflow-hidden flex-1">
          
          {/* Editor Header Settings Panel */}
          <div className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 font-mono flex items-center gap-1"><FileCode2 className="w-4 h-4 text-purple-400" /> Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-neutral-800 hover:bg-neutral-750 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-neutral-700 outline-none cursor-pointer">
                
                {(currentProblem.codingLanguagesAllowed || []).map((l) =>
                <option key={l} value={l}>
                    {l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}
                  </option>
                )}
              </select>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] uppercase font-bold text-neutral-500">Theme:</span>
                <button
                  onClick={() => setEditorTheme((prev) => prev === 'vs-dark' ? 'light' : 'vs-dark')}
                  className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 rounded text-[10px] text-neutral-300 font-mono uppercase tracking-wide cursor-pointer">
                  
                  {editorTheme === 'vs-dark' ? 'Dark' : 'Light'}
                </button>
              </div>

              {/* Font controls */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] uppercase font-bold text-neutral-500">Font:</span>
                <button
                  onClick={() => setFontSize((prev) => Math.max(12, prev - 1))}
                  className="w-5 h-5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 rounded text-xs font-mono text-neutral-300 flex items-center justify-center cursor-pointer">
                  
                  -
                </button>
                <span className="text-[10px] font-mono font-bold px-1">{fontSize}</span>
                <button
                  onClick={() => setFontSize((prev) => Math.min(20, prev + 1))}
                  className="w-5 h-5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 rounded text-xs font-mono text-neutral-300 flex items-center justify-center cursor-pointer">
                  
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden bg-[#1E1E1E]">
            <Editor
              height="100%"
              language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage === 'python' ? 'python' : selectedLanguage}
              theme={editorTheme}
              value={codeValue}
              onChange={handleEditorChange}
              options={{
                fontSize: fontSize,
                minimap: { enabled: false },
                lineNumbers: 'on',
                folding: true,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                formatOnPaste: true,
                suggestOnTriggerCharacters: true
              }} />
            
          </div>

          {/* Console / Testcases Terminal Section (Fixed Heights Split-Pane Bottom) */}
          <div className="h-64 bg-neutral-900 border-t border-neutral-800 flex flex-col overflow-hidden shrink-0">
            {/* Terminal Header Tab Selectors */}
            <div className="h-9 bg-neutral-950 border-b border-neutral-850 flex items-center justify-between px-3 shrink-0">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setConsoleTab('testcases')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 ${consoleTab === 'testcases' ? 'bg-neutral-800 text-white' : 'text-neutral-500 dark:text-neutral-400 hover:text-white'}`}>
                  
                  <Terminal className="w-3.5 h-3.5" /> Test Cases
                </button>
                <button
                  onClick={() => setConsoleTab('console')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 ${consoleTab === 'console' ? 'bg-neutral-800 text-white' : 'text-neutral-500 dark:text-neutral-400 hover:text-white'}`}>
                  
                  <Terminal className="w-3.5 h-3.5" /> Console logs
                </button>
                {evaluationResult &&
                <button
                  onClick={() => setConsoleTab('results')}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 ${consoleTab === 'results' ? 'bg-emerald-950 text-emerald-400' : 'text-neutral-500 dark:text-neutral-400 hover:text-white'}`}>
                  
                    <CheckCircle2 className="w-3.5 h-3.5" /> Run Results
                  </button>
                }
              </div>

              {/* Quick Reset draft action */}
              <button
                onClick={() => {
                  if (confirm('Reset starter template? All modifications in this language for this problem will be lost.')) {
                    const template = currentProblem.codingTemplates?.[selectedLanguage] || '';
                    setCodeValue(template);
                    toast.add('Starter template reset successfully.', 'info');
                  }
                }}
                className="text-[10px] font-bold text-neutral-500 hover:text-neutral-300 flex items-center gap-1 cursor-pointer transition-all">
                
                <RefreshCw className="w-3 h-3" /> Reset Template
              </button>
            </div>

            {/* Terminal Inner viewport */}
            <div className="flex-1 overflow-y-auto p-4 bg-neutral-950 font-mono text-xs">
              
              {consoleTab === 'testcases' &&
              <div className="space-y-4">
                  {/* Custom input toggle checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                    type="checkbox"
                    id="custom-input"
                    checked={useCustomInput}
                    onChange={(e) => setUseCustomInput(e.target.checked)}
                    className="rounded border-neutral-700 text-[#01AC9F] bg-neutral-800 accent-[#01AC9F]" />
                  
                    <label htmlFor="custom-input" className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase select-none cursor-pointer">
                      Enable Custom test Input
                    </label>
                  </div>

                  {useCustomInput ?
                <div className="space-y-2">
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase">Input Stream Payload</span>
                      <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Paste custom standard input variables here..."
                    className="w-full h-24 bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 font-mono text-xs text-white outline-none focus:border-neutral-700" />
                  
                    </div> :

                <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 border-b border-neutral-850 pb-1.5">
                        <span>Preloaded Public Cases</span>
                        <span className="text-[10px] text-[#01AC9F]">Click run to validate</span>
                      </div>
                      <div className="space-y-2">
                        {(currentProblem.codingTestCases || []).
                    filter((tc) => tc.visibility === 'public').
                    map((tc, i) =>
                    <div key={tc.id} className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-lg space-y-1">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase">Sample Case #{i + 1}</span>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <span className="text-neutral-500">Input:</span> <span className="text-neutral-300 font-mono">{tc.input.replace('\n', ' ')}</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500">Expected:</span> <span className="text-emerald-500 font-mono">{tc.expectedOutput}</span>
                                </div>
                              </div>
                            </div>
                    )}
                      </div>
                    </div>
                }
                </div>
              }

              {consoleTab === 'console' &&
              <div className="whitespace-pre-wrap leading-relaxed text-neutral-300">
                  {isEvaluating ?
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#01AC9F]" />
                      <span>Simulating compiler pipeline, running sandbox tests...</span>
                    </div> :

                consoleOutput || 'Ready. Click "Run Code" to start execution logs.'
                }
                </div>
              }

              {consoleTab === 'results' && evaluationResult &&
              <div className="space-y-4">
                  {/* Performance widgets */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-neutral-900 rounded-2xl border border-neutral-850">
                      <span className="text-[10px] text-neutral-500 uppercase">Execution Time</span>
                      <h5 className="text-xs font-bold text-white mt-0.5 font-mono">{evaluationResult.executionTime}s</h5>
                    </div>
                    <div className="p-2 bg-neutral-900 rounded-2xl border border-neutral-850">
                      <span className="text-[10px] text-neutral-500 uppercase">Memory usage</span>
                      <h5 className="text-xs font-bold text-white mt-0.5 font-mono">{evaluationResult.memoryUsage} MB</h5>
                    </div>
                    <div className="p-2 bg-neutral-900 rounded-2xl border border-neutral-850">
                      <span className="text-[10px] text-neutral-500 uppercase">Core Status</span>
                      <h5 className={`text-xs font-bold mt-0.5 ${evaluationResult.status === 'Accepted' ? 'text-green-400' : 'text-rose-400'}`}>{evaluationResult.status}</h5>
                    </div>
                  </div>

                  {/* Individual testcase result cards */}
                  <div className="space-y-2">
                    {evaluationResult.testResults && evaluationResult.testResults.length > 0 ?
                  evaluationResult.testResults.map((tr, idx) =>
                  <div key={idx} className={`p-3 rounded-2xl border flex items-center justify-between text-[11px] ${tr.passed ? 'bg-green-950/25 border-green-900 text-green-300' : 'bg-rose-950/25 border-rose-900 text-rose-300'}`}>
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-neutral-500">Case #{idx + 1} ({tr.visibility})</span>
                            <div className="flex gap-2 font-mono">
                              <span>Input: <strong className="text-white">{tr.input.replace('\n', ' ')}</strong></span>
                              <span>Expected: <strong className="text-white">{tr.expected}</strong></span>
                              <span>Got: <strong className="text-white">{tr.actual}</strong></span>
                            </div>
                          </div>
                          <span className={`font-bold font-mono text-xs ${tr.passed ? 'text-green-400' : 'text-rose-400'}`}>
                            {tr.passed ? 'PASS ✓' : 'FAIL ✗'}
                          </span>
                        </div>
                  ) :

                  <p className="text-[10px] text-neutral-500 text-center py-4">Custom input evaluated successfully. Review the logs in Console.</p>
                  }
                  </div>
                </div>
              }
            </div>

            {/* Buttons Row (Controls Pane) */}
            <div className="h-12 bg-neutral-950 border-t border-neutral-850 flex items-center justify-between px-3 shrink-0">
              <span className="text-[10px] text-neutral-500 font-mono">
                {selectedLanguage.toUpperCase()} environment
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isEvaluating}
                  className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                  
                  <Play className="w-3.5 h-3.5 text-[#01AC9F]" />
                  <span>Run Code</span>
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={isEvaluating}
                  className="px-5 py-1.5 bg-[#6C1D5F] hover:bg-[#84117C] text-white text-xs font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-purple-950/25">
                  
                  <Send className="w-3.5 h-3.5 text-purple-300" />
                  <span>Submit Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Confirm Final Submit Modal Dialog */}
      <AnimatePresence>
        {showConfirmModal &&
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-neutral-200 space-y-4">
            
              <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
                <div className="w-10 h-10 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-white uppercase tracking-wider">Finalize Exam Submission?</h4>
                  <p className="text-[10px] text-neutral-500">Lock in your current scores and exit the sandbox</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <p className="leading-relaxed text-neutral-500 dark:text-neutral-400">
                  By submitting, your compiled draft code for all questions in this challenge will be synchronized to the evaluation center.
                </p>
                
                <div className="p-3.5 bg-neutral-950/60 border border-neutral-850 rounded-2xl space-y-2 font-mono text-[10px]">
                  <span className="text-neutral-500 font-bold uppercase block">Current status breakdown:</span>
                  {problems.map((prob, i) => {
                  const match = codingSubmissions.find((sub) => sub.problemId === prob.id && sub.studentId === currentUser.id);
                  return (
                    <div key={prob.id} className="flex justify-between items-center text-neutral-300">
                        <span>Q{i + 1}: {prob.question}</span>
                        <span className={`font-bold ${match ? 'text-green-400' : 'text-neutral-500'}`}>
                          {match ? `LOCKED (${match.score} pts)` : 'UNSUBMITTED'}
                        </span>
                      </div>);

                })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-neutral-800 pt-3">
                <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 hover:bg-neutral-800 rounded-2xl text-xs font-bold font-display uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hover:text-white cursor-pointer">
                
                  Cancel
                </button>
                <button
                onClick={handleFinalizeExam}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/20 cursor-pointer">
                
                  Finalize and Exit
                </button>
              </div>
            </motion.div>
          </div>
        }
      </AnimatePresence>
    </div>);

};
