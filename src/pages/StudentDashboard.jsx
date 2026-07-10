import React, { useState } from 'react';
import { useLMS } from '../context/LMSContext';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Trophy,
  TrendingUp,
  Calendar as CalendarIcon,
  Clock,
  HelpCircle,
  ArrowRight
} from



  'lucide-react';
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
  const { currentUser, assessments, submissions, getLeaderboard, certificates } = useLMS();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (!currentUser) return null;

  // Filter assessments and submissions assigned to student's batches
  const studentBatchIds = currentUser.batches || [];

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
          className={`px-4 py-2 font-semibold text-sm ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-semibold text-sm ${activeTab === 'achievements' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
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
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg text-neutral-800 dark:text-white mb-2">{title}</h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Score: <span className="font-semibold text-indigo-600">{cert.finalScore}%</span></p>
                      <p className="text-xs text-neutral-400">Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/results/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${cert.submissionId}`)}
                      className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-sm hover:bg-indigo-100 transition-colors self-start"
                    >
                      View Details
                    </button>
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

    </div>);

};
