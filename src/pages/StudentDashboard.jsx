import React, { useState } from 'react';
import { useLMS } from '../context/LMSContext';
import { useNavigate } from 'react-router-dom';
import CertificateViewer from '../components/CertificateViewer';
import {
  ClipboardList,
  Trophy,
  TrendingUp,
  Calendar as CalendarIcon,
  Clock,
  HelpCircle,
  ArrowRight,
  Award,
  FileText,
  FolderOpen,
  BookOpen,
  Download,
  History,
  X,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from
  'recharts';


export const StudentDashboard = () => {
  const { currentUser, assessments, submissions, getLeaderboard, certificates, getAssessmentHistory, batches } = useLMS();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [historyModalAssessment, setHistoryModalAssessment] = useState(null);
  const [assessmentHistoryList, setAssessmentHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  if (!currentUser) return null;

  // Filter assessments and submissions assigned to student's batches
  const studentBatchIds = currentUser.batches || [];

  const handleOpenHistory = async (e, assessment) => {
    e.stopPropagation();
    setHistoryModalAssessment(assessment);
    setLoadingHistory(true);
    try {
      const history = await getAssessmentHistory(assessment.id);
      setAssessmentHistoryList(history || []);
    } catch (err) {
      console.error(err);
      setAssessmentHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getMockMaterials = (courseName) => {
    const defaultMaterials = [
      { id: 'm1', name: 'LMS Assessment Guidelines.pdf', type: 'PDF Document', size: '540 KB', icon: 'file-text', desc: 'Official instructions on taking exams, uploading coding projects, and reading logs.' },
      { id: 'm2', name: 'Practice Quiz Questions.docx', type: 'Word Doc', size: '1.2 MB', icon: 'file-text', desc: 'Mock test questions including multiple choice, multi-select, and short answers.' },
      { id: 'm3', name: 'Code Quality Checklist.pdf', type: 'PDF Document', size: '1.8 MB', icon: 'file-text', desc: 'Coding standards and clean code conventions for assignments.' }
    ];

    if (!courseName) return defaultMaterials;

    const course = courseName.toLowerCase();
    if (course.includes('java')) {
      return [
        { id: 'j1', name: 'Java Core Course Syllabus.pdf', type: 'PDF Document', size: '1.1 MB', icon: 'file-text', desc: 'Detailed week-by-week syllabus covering JDK, JVM, OOPs, Collections, and Streams.' },
        { id: 'j2', name: 'Multi-threading & OOPs Slides.pptx', type: 'Slide Deck', size: '5.2 MB', icon: 'slide', desc: 'Presentation slides explaining OOP concepts, thread lifecycle, synchronization, and executor service.' },
        { id: 'j3', name: 'Practice Concurrency Challenges.zip', type: 'Code Archive', size: '3.1 MB', icon: 'archive', desc: 'Practice exercises with boilerplate classes and unit tests for concurrency models.' },
        ...defaultMaterials
      ];
    } else if (course.includes('react') || course.includes('frontend') || course.includes('js') || course.includes('web')) {
      return [
        { id: 'r1', name: 'React 19 Hooks & Architecture.pdf', type: 'PDF Document', size: '820 KB', icon: 'file-text', desc: 'Comprehensive guide to custom hooks, server actions, and component state optimization.' },
        { id: 'r2', name: 'Tailwind CSS Quick Reference.pdf', type: 'PDF Document', size: '1.4 MB', icon: 'file-text', desc: 'CSS Utility reference sheets and responsive flexbox/grid layout design tips.' },
        { id: 'r3', name: 'Vite React Project Boilerplate.zip', type: 'Code Archive', size: '940 KB', icon: 'archive', desc: 'Standard pre-configured Vite project with routing, Tailwind configurations, and Lucide icons.' },
        ...defaultMaterials
      ];
    }
    return defaultMaterials;
  };

  // Assessments matching student's batch
  const assignedAssessments = assessments.filter((a) =>
    a.status?.toLowerCase() === 'published' && a.batches.some((bId) => studentBatchIds.includes(bId))
  );

  // Completed / Submitted submissions by student
  const studentSubmissions = submissions.filter((s) => s.studentId === currentUser.id);

  // Leaderboard ranking of this student
  const leaderboard = getLeaderboard();
  const rankObj = leaderboard.find((entry) => entry.studentId === currentUser.id);
  const currentRank = rankObj ? rankObj.rank : leaderboard.length;

  // Split assessments into lists
  const nowStr = new Date().toISOString().split('T')[0];

  const activeAssessments = assignedAssessments.filter((a) => {
    const isCompleted = studentSubmissions.some((s) => s.assessmentId === a.id && s.status === 'submitted');
    return a.startDate <= nowStr && a.endDate >= nowStr && !isCompleted;
  });

  const upcomingAssessments = assignedAssessments.filter((a) => a.startDate > nowStr);

  const completedAssessments = assignedAssessments.filter((a) =>
    studentSubmissions.some((s) => s.assessmentId === a.id && s.status === 'submitted')
  );

  // Recharts score path
  const completedSubsWithAssessments = studentSubmissions.
    filter((s) => s.status === 'submitted' && s.isEvaluated).
    map((s) => {
      const a = assessments.find((as) => as.id === s.assessmentId);
      return {
        name: a?.title.split(' [')[0].substring(0, 10) + '...',
        score: s.percentage,
        passing: 60
      };
    });

  // Recent scores
  const recentScores = studentSubmissions.
    filter((s) => s.status === 'submitted').
    slice(0, 3).
    map((s) => {
      const a = assessments.find((as) => as.id === s.assessmentId);
      return {
        id: s.id,
        title: a?.title || 'Assessment',
        percentage: s.percentage,
        isEvaluated: s.isEvaluated,
        score: s.score,
        marks: a?.marks || 20
      };
    });

  const handleStartAttempt = (aId) => {
    const as = assessments.find((x) => x.id === aId);
    if (!as) return;
    const slug = as.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'assessment';
    if (as.type === 'coding') {
      navigate(`/take-coding/${slug}`);
    } else {
      navigate(`/take/${slug}`);
    }
  };

  const handleViewResult = (sId) => {
    const sub = studentSubmissions.find(s => s.id === sId);
    if (!sub) return;
    const as = assessments.find(a => a.id === sub.assessmentId);
    const slug = as ? as.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'results';
    navigate(`/results/${slug}/${sId}`);
  };

  return (
    <div className="space-y-6">

      {/* Student Welcome Card */}
      <div className="bg-gradient-to-r from-[#4A1E47] via-[#6C1D5F] to-[#84117C] text-white p-6 md:p-8 rounded-3xl shadow-xl dark:shadow-purple-900/20 border border-white/10 dark:border-white/5 relative overflow-hidden flex flex-col justify-center min-h-[160px]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -mb-20 pointer-events-none" />

        <div className="relative z-10 space-y-1.5 max-w-3xl">
          <h2 className="font-display font-black text-2xl md:text-4xl tracking-tight text-white flex items-center gap-3 drop-shadow-md">
            Hi, {currentUser.name}!
          </h2>
          <p className="text-purple-100/90 text-xs md:text-sm leading-relaxed font-medium mt-2">
            Ready for your exams? Below is a list of your assigned modules. Review the countdown timers, complete MCQs, upload required code archives, and review your performance instantly.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-neutral-700">
        <button
          className={`px-4 py-2 font-semibold text-sm ${activeTab === 'overview' ? 'text-[#6C1D5F] border-b-2 border-[#6C1D5F]' : 'text-neutral-500 hover:text-neutral-750 dark:hover:text-neutral-300'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-semibold text-sm ${activeTab === 'classroom' ? 'text-[#6C1D5F] border-b-2 border-[#6C1D5F]' : 'text-neutral-500 hover:text-neutral-750 dark:hover:text-neutral-300'}`}
          onClick={() => {
            setActiveTab('classroom');
            if (studentBatchIds.length > 0 && !selectedBatchId) {
              setSelectedBatchId(studentBatchIds[0]);
            }
          }}
        >
          Classroom Hub & Materials
        </button>
        <button
          className={`px-4 py-2 font-semibold text-sm ${activeTab === 'achievements' ? 'text-[#6C1D5F] border-b-2 border-[#6C1D5F]' : 'text-neutral-500 hover:text-neutral-750 dark:hover:text-neutral-300'}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements Portfolio
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* KPI 1 */}
        <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-700/60 shadow-sm p-4 md:p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-1 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="p-3 bg-[#01AC9F]/10 dark:bg-emerald-950/20 text-[#01AC9F] rounded-2xl shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-300 font-bold uppercase tracking-wider">Active Exams</p>
            <h4 className="text-2xl font-display font-extrabold text-neutral-800 dark:text-white mt-0.5 flex items-baseline gap-1.5">
              {activeAssessments.length} <span className='text-xs font-semibold text-neutral-400'>Available</span>
            </h4>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-700/60 shadow-sm p-4 md:p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-1 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-300 font-bold uppercase tracking-wider">Upcoming</p>
            <h4 className="text-2xl font-display font-extrabold text-neutral-800 dark:text-white mt-0.5 flex items-baseline gap-1.5">
              {upcomingAssessments.length} <span className='text-xs font-semibold text-neutral-400'>scheduled</span>
            </h4>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-700/60 shadow-sm p-4 md:p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-1 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="p-3 bg-purple-500/10 text-brand-velvet rounded-2xl shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-300 font-bold uppercase tracking-wider">Leaderboard Rank</p>
            <h4 className="text-2xl font-display font-extrabold text-neutral-800 dark:text-white mt-0.5 flex items-baseline gap-1.5">
              {currentRank} <span className='text-xs font-semibold text-neutral-400'>Overall</span>
            </h4>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-700/60 shadow-sm p-4 md:p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-1 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-300 font-bold uppercase tracking-wider">Assessments Graded</p>
            <h4 className="text-2xl font-display font-extrabold text-neutral-800 dark:text-white mt-0.5 flex items-baseline gap-1.5">
              {completedAssessments.length} <span className='text-xs font-semibold text-neutral-400'>submitted</span>
            </h4>
          </div>
        </div>

      </div>

      {/* Grid of assessments & scores graph */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Core Assessments available List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-black text-sm text-neutral-800 dark:text-white tracking-wider">Available Assessments</h3>
            <span className="text-xs bg-red-50 text-rose-700 font-bold px-2.5 py-1 rounded-full animate-pulse">{activeAssessments.length} Pending Assessment</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeAssessments.length === 0 ?
              <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 rounded-2xl p-10 text-center text-neutral-500 dark:text-neutral-400 md:col-span-2">
                Awesome! You have no pending exams. All completed or expired.
              </div> :

              activeAssessments.map((as) => {
                const isDraftSub = studentSubmissions.find((s) => s.assessmentId === as.id && s.status === 'in_progress');
                return (
                  <div key={as.id} className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-brand-border dark:border-neutral-700 dark:border-neutral-700/60 shadow-sm space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="px-2 py-0.5 bg-emerald-50 text-[#01AC9F] font-bold rounded text-[10px] uppercase font-mono">
                          {(as.type || '').replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-bold ${as.difficulty === 'Easy' ? 'text-green-500' : as.difficulty === 'Medium' ? 'text-amber-500' : 'text-rose-500'}`}>
                          {as.difficulty}
                        </span>
                      </div>

                      <h4 className="font-display font-bold text-sm text-neutral-800 dark:text-white mt-2 leading-tight truncate">
                        {as.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {as.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-brand-border/80 dark:border-neutral-700/80 dark:border-neutral-800/50 space-y-3.5 mt-auto">
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500 dark:text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 shrink-0 text-[#6C1D5F]" /> {String(as.duration).replace(' mins', '')} mins</span>
                        <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 shrink-0 text-[#01AC9F]" /> {as.questions.length} Questions</span>
                      </div>

                      <button
                        onClick={() => handleStartAttempt(as.id)}
                        className={`w-full py-2 rounded-2xl text-[10px] font-black uppercase shadow tracking-wider cursor-pointer flex items-center justify-center gap-1 transition-all bg-[#6C1D5F] hover:bg-[#84117C] text-white shadow-purple-950/10`}>

                        <span>{isDraftSub ? 'Resume Draft Attempt' : 'Initialize Assessment'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>);

              })
            }
          </div>
        </div>

        {/* Scoring list sidebar */}
        <div className="space-y-4">
          <h3 className="font-display font-black text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Recent Graded Exams</h3>

          <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-700/60 shadow-sm rounded-2xl p-4 md:p-5 space-y-3">
            {recentScores.length === 0 ?
              <div className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
                No assessments graded yet.
              </div> :

              recentScores.map((score) =>
                <div
                  key={score.id}
                  onClick={() => handleViewResult(score.id)}
                  className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-brand-border/20 hover:border-brand-velvet dark:hover:border-purple-600 transition-all cursor-pointer flex items-center justify-between gap-3">

                  <div className="truncate">
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{score.title}</h4>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">Raw points: {score.isEvaluated ? `${score.score}/${score.marks}` : 'Evaluating descriptive replies...'}</p>
                  </div>

                  <span className={`px-2.5 py-1.5 rounded-2xl font-mono font-black text-xs shrink-0 text-center ${score.isEvaluated ? 'bg-emerald-50 text-[#01AC9F] dark:bg-emerald-950/20 dark:text-emerald-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'}`}>
                    {score.isEvaluated ? `${score.percentage}%` : 'Pending'}
                  </span>
                </div>
              )
            }
          </div>
        </div>

      </div>

      {/* Recharts Student progress tracking chart */}
      {completedSubsWithAssessments.length > 0 &&
        <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-700/60 shadow-sm p-6 rounded-3xl space-y-4 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div>
            <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">My Academic Progress Pathway</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Chronological average score trends over your submissions</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completedSubsWithAssessments}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                <XAxis dataKey="name" stroke="#A3A3A3" fontSize={10} tickLine={false} />
                <YAxis stroke="#A3A3A3" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#01AC9F" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      }
        </>
      ) : activeTab === 'classroom' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Batch Selector */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-display font-black text-sm text-neutral-800 dark:text-white uppercase tracking-wider">My Classrooms</h3>
            <div className="space-y-3">
              {studentBatchIds.map((bId) => {
                const batchObj = batches?.find(b => b.id === bId);
                const batchName = batchObj ? batchObj.name : `Batch ${bId}`;
                const courseName = batchObj ? batchObj.course : 'General Course';
                const isSelected = selectedBatchId === bId;
                return (
                  <button
                    key={bId}
                    type="button"
                    onClick={() => setSelectedBatchId(bId)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-white dark:bg-neutral-900 border-[#6C1D5F] dark:border-purple-500 shadow-md ring-2 ring-[#6C1D5F]/10' 
                        : 'bg-white/60 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 hover:bg-white dark:hover:bg-neutral-900'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-[#6C1D5F]/10 text-[#6C1D5F] dark:text-purple-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="truncate flex-1">
                      <p className="font-bold text-xs text-neutral-800 dark:text-white truncate">{batchName}</p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{courseName}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Classroom Content (Assessments & Shared Materials) */}
          <div className="lg:col-span-3 space-y-6">
            {selectedBatchId ? (() => {
              const selectedBatchObj = batches?.find(b => b.id === selectedBatchId);
              const batchName = selectedBatchObj ? selectedBatchObj.name : `Batch ${selectedBatchId}`;
              const courseName = selectedBatchObj ? selectedBatchObj.course : 'General Course';
              
              // Assessments belonging to this batch
              const batchAssessments = assignedAssessments.filter(a => a.batches?.includes(selectedBatchId));
              const batchActive = batchAssessments.filter(a => {
                const isCompleted = studentSubmissions.some(s => s.assessmentId === a.id && s.status === 'submitted');
                return a.startDate <= nowStr && a.endDate >= nowStr && !isCompleted;
              });
              const batchCompleted = batchAssessments.filter(a => 
                studentSubmissions.some(s => s.assessmentId === a.id && s.status === 'submitted')
              );

              // Mock Materials
              const materials = getMockMaterials(courseName);

              return (
                <div className="space-y-6 animate-fade-in">
                  {/* Classroom Banner */}
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-[#6C1D5F]/10 dark:bg-purple-950/20 text-[#6C1D5F] dark:text-purple-400 rounded-3xl">
                        <FolderOpen className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-lg text-neutral-800 dark:text-white">{batchName}</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Course: <span className="font-semibold text-neutral-700 dark:text-neutral-200">{courseName}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 shrink-0">
                      <ClipboardList className="w-3.5 h-3.5 text-[#01AC9F]" />
                      <span>{batchAssessments.length} Assessments</span>
                      <span className="text-neutral-300 dark:text-neutral-700 mx-1">|</span>
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{materials.length} Materials</span>
                    </div>
                  </div>

                  {/* Tab Content Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1: Assessments Grouped & Structured */}
                    <div className="space-y-4">
                      <h4 className="font-display font-bold text-xs text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-[#01AC9F]" /> Batch Assessments
                      </h4>
                      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3.5">
                        {batchAssessments.length === 0 ? (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-6">No assessments assigned to this batch yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {/* Active Group */}
                            {batchActive.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-650 dark:text-emerald-400">Active Exams</p>
                                {batchActive.map(as => (
                                  <div key={as.id} className="p-3 bg-neutral-550/5 dark:bg-neutral-950/40 rounded-xl border border-neutral-200/50 dark:border-neutral-800 flex items-center justify-between gap-3 group">
                                    <div className="truncate flex-1">
                                      <h5 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{as.title}</h5>
                                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">{as.duration} mins • {as.questions?.length || 0} Questions</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenHistory(e, as)}
                                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                                        title="View Assessment Edit History Log"
                                      >
                                        <History className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStartAttempt(as.id)}
                                        className="px-2.5 py-1 bg-[#6C1D5F] hover:bg-[#84117C] text-white font-bold text-[10px] tracking-wider rounded-lg uppercase cursor-pointer"
                                      >
                                        Start
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Completed Group */}
                            {batchCompleted.length > 0 && (
                              <div className="space-y-2 pt-2">
                                <p className="text-[10px] font-extrabold uppercase tracking-wide text-neutral-500">Graded / Completed</p>
                                {batchCompleted.map(as => {
                                  const submission = studentSubmissions.find(s => s.assessmentId === as.id && s.status === 'submitted');
                                  return (
                                    <div key={as.id} className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 opacity-90 hover:opacity-100 transition-opacity">
                                      <div className="truncate flex-1">
                                        <h5 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{as.title}</h5>
                                        <p className="text-[10px] text-neutral-500 mt-0.5">
                                          {submission && submission.isEvaluated ? `Graded: ${submission.percentage}%` : 'Pending Evaluation'}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={(e) => handleOpenHistory(e, as)}
                                          className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                                          title="View Assessment Edit History Log"
                                        >
                                          <History className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => submission && handleViewResult(submission.id)}
                                          disabled={!submission}
                                          className="px-2.5 py-1 bg-neutral-105 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-bold text-[10px] tracking-wider rounded-lg uppercase cursor-pointer"
                                        >
                                          Result
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Scheduled/Upcoming Group */}
                            {batchAssessments.filter(a => a.startDate > nowStr).length > 0 && (
                              <div className="space-y-2 pt-2">
                                <p className="text-[10px] font-extrabold uppercase tracking-wide text-neutral-455">Scheduled / Upcoming</p>
                                {batchAssessments.filter(a => a.startDate > nowStr).map(as => (
                                  <div key={as.id} className="p-3 bg-neutral-50/50 dark:bg-neutral-950/20 rounded-xl border border-neutral-150 dark:border-neutral-850 flex items-center justify-between gap-3 opacity-60">
                                    <div className="truncate flex-1">
                                      <h5 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 truncate">{as.title}</h5>
                                      <p className="text-[9px] text-neutral-400 mt-0.5">Starts on {as.startDate} at {as.startTime || '00:00'}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenHistory(e, as)}
                                      className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
                                    >
                                      <History className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Shared Learning Materials */}
                    <div className="space-y-4">
                      <h4 className="font-display font-bold text-xs text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" /> Shared Materials
                      </h4>
                      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3.5">
                        {materials.map((mat) => (
                          <div key={mat.id} className="p-3.5 bg-neutral-50 dark:bg-neutral-950/40 rounded-xl border border-neutral-200/50 dark:border-neutral-800 flex items-start justify-between gap-4 hover:-translate-y-0.5 hover:shadow-sm transition-all">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 rounded-xl mt-0.5 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-neutral-800 dark:text-white leading-tight">{mat.name}</h5>
                                <p className="text-[10px] text-neutral-500 mt-0.5">{mat.type} • {mat.size}</p>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1.5 leading-normal">{mat.desc}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => toast.add(`Downloading ${mat.name}...`, 'success')}
                              className="p-2 text-neutral-400 hover:text-[#6C1D5F] dark:hover:text-purple-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 rounded-xl transition-all cursor-pointer shrink-0"
                              title="Download Resource"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Classroom Edit Feed updates */}
                  {batchAssessments.some(a => a.modificationReason) && (
                    <div className="space-y-4 pt-2">
                      <h4 className="font-display font-bold text-xs text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-500" /> Recent Classroom Updates & Revisions
                      </h4>
                      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4">
                        {batchAssessments.filter(a => a.modificationReason).map(as => (
                          <div key={as.id} className="flex gap-4 border-l-2 border-amber-400 pl-4 py-1">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300 border border-amber-100 dark:border-amber-900 px-2 py-0.5 rounded">Revision Notification</span>
                                <span className="text-[10px] text-neutral-400">{as.startDate}</span>
                              </div>
                              <p className="text-xs text-neutral-850 dark:text-neutral-100 font-bold mt-1">
                                Trainer updated assessment <strong className="underline text-[#6C1D5F] dark:text-purple-400">{as.title}</strong>
                              </p>
                              <p className="text-xs text-neutral-550 dark:text-neutral-400 italic mt-0.5">
                                "{as.modificationReason}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })() : (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-16 text-center text-neutral-500">
                Please select a classroom from the left to view assessments and study materials.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="font-display font-black text-xl text-neutral-800 dark:text-white tracking-wider">Your Certificates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates && certificates.length > 0 ? (
              certificates.map((cert) => {
                const asObj = assessments.find(a => a.id === cert.assessmentId);
                const title = asObj ? asObj.title : 'Assessment';
                return (
                  <div key={cert.id} className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow">
                    <div>
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/40 text-[#6C1D5F] dark:text-purple-400 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg text-neutral-800 dark:text-white mb-2">{title}</h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Score: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{cert.finalScore}%</span></p>
                      <p className="text-xs text-neutral-400">Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => navigate(`/results/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${cert.submissionId}`)}
                        className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-lg text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        Details
                      </button>
                      <button 
                        onClick={() => setSelectedCertificate({ cert, title })}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1 border border-indigo-100 dark:border-indigo-900/30"
                      >
                        <Award className="w-3.5 h-3.5" /> View Certificate
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-neutral-500">
                You haven't earned any certificates yet. Complete assessments with a score of 60% or higher to unlock them!
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCertificate && (
        <CertificateViewer
          certificate={selectedCertificate.cert}
          studentName={currentUser?.name}
          assessmentTitle={selectedCertificate.title}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {/* Assessment Edit History Modal */}
      {historyModalAssessment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white dark:from-neutral-950 dark:to-neutral-900 shrink-0">
              <div>
                <h3 className="font-display font-black text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-[#6C1D5F] dark:text-purple-400" /> Version Revision History
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-md">{historyModalAssessment.title}</p>
              </div>
              <button 
                type="button"
                onClick={() => setHistoryModalAssessment(null)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-8 h-8 border-2 border-[#6C1D5F] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-neutral-555 font-bold uppercase tracking-wider">Fetching version history...</p>
                </div>
              ) : assessmentHistoryList.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <Info className="w-10 h-10 text-neutral-400 mx-auto" />
                  <div>
                    <p className="font-bold text-sm text-neutral-800 dark:text-neutral-250">Original Configuration</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-1">No previous edit history logs exist for this assessment. It is in its original state.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-y-1 before:left-3.5 before:w-0.5 before:bg-neutral-150 dark:before:bg-neutral-800">
                  {/* Latest Active Version */}
                  <div className="flex gap-4 relative">
                    <div className="w-7 h-7 bg-[#6C1D5F] dark:bg-purple-600 rounded-full flex items-center justify-center font-mono font-bold text-[10px] text-white z-10 shadow-sm shrink-0">
                      L
                    </div>
                    <div className="flex-1 bg-[#6C1D5F]/5 dark:bg-purple-950/20 border border-[#6C1D5F]/25 dark:border-purple-900/50 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-850 dark:text-white uppercase">Latest Active Version</span>
                        <span className="text-[10px] font-bold text-neutral-400">{historyModalAssessment.startDate}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px] text-neutral-600 dark:text-neutral-350">
                        <div><span className="block text-[9px] font-bold text-neutral-400 uppercase">Duration</span>{historyModalAssessment.duration} mins</div>
                        <div><span className="block text-[9px] font-bold text-neutral-400 uppercase">Total Marks</span>{historyModalAssessment.marks} pts</div>
                        <div><span className="block text-[9px] font-bold text-neutral-400 uppercase">Difficulty</span>{historyModalAssessment.difficulty}</div>
                        <div><span className="block text-[9px] font-bold text-neutral-400 uppercase">Topic</span>{historyModalAssessment.topic}</div>
                      </div>
                    </div>
                  </div>

                  {/* Previous Historical Versions */}
                  {assessmentHistoryList.map((hist, idx) => {
                    const formattedHistDate = new Date(hist.modifiedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={hist.id || idx} className="flex gap-4 relative">
                        <div className="w-7 h-7 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-450 rounded-full flex items-center justify-center font-mono font-bold text-[10px] z-10 shrink-0">
                          {hist.version ? `v${hist.version}` : `v${assessmentHistoryList.length - idx}`}
                        </div>
                        <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 p-4 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Version {hist.version} Snapshot</span>
                            <span className="text-[10px] text-neutral-400 font-mono">{formattedHistDate}</span>
                          </div>
                          
                          <p className="text-xs text-neutral-600 dark:text-neutral-450 pt-1 leading-normal font-medium">
                            <span className="font-bold text-neutral-400 dark:text-neutral-500">Edit Reason:</span> "{hist.modificationReason}"
                          </p>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 mt-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                            <div><span className="block text-[8px] font-bold text-neutral-400 uppercase">Duration</span>{hist.duration} mins</div>
                            <div><span className="block text-[8px] font-bold text-neutral-400 uppercase">Total Marks</span>{hist.marks} pts</div>
                            <div><span className="block text-[8px] font-bold text-neutral-400 uppercase">Difficulty</span>{hist.difficulty}</div>
                            <div><span className="block text-[8px] font-bold text-neutral-400 uppercase">Modified By</span>{hist.lastModifiedBy}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/40 text-right shrink-0">
              <button 
                type="button"
                onClick={() => setHistoryModalAssessment(null)}
                className="px-5 py-2 bg-neutral-250 hover:bg-neutral-300 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>);

};
