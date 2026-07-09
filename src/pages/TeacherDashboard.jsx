import React, { useState } from 'react';
import { useLMS } from '../context/LMSContext';
import { toast } from '../components/Toast';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Layers,
  FileSpreadsheet,
  FileSignature,
  AlertCircle,
  CheckCircle2,

  TrendingUp,
  Clock,
  ArrowUpRight,
  X } from

'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid } from
'recharts';
import { Link } from 'react-router-dom';

export const TeacherDashboard = () => {
  const { students, batches, assessments, submissions, notifications, editAssessment } = useLMS();

  // Quick Allocate State
  const [quickAllocateId, setQuickAllocateId] = useState(null);
  const [selectedBatches, setSelectedBatches] = useState([]);

  const handleQuickAllocate = () => {
    if (selectedBatches.length === 0) {
      toast.add('Please select at least one batch to allocate', 'error');
      return;
    }
    const assessment = assessments.find(a => a.id === quickAllocateId);
    if (!assessment) return;
    
    editAssessment(quickAllocateId, {
      ...assessment,
      status: 'published',
      batches: selectedBatches
    });
    toast.add('Assessment successfully allocated and published!', 'success');
    setQuickAllocateId(null);
    setSelectedBatches([]);
  };

  // Metrics Calculations
  const totalStudents = students.length;
  const totalBatches = batches.length;
  const totalAssessments = assessments.length;

  const activeAssessments = assessments.filter((a) => {
    if (a.status !== 'published') return false;
    const nowStr = new Date().toISOString().split('T')[0];
    return a.startDate <= nowStr && a.endDate >= nowStr;
  }).length;

  const completedAssessments = assessments.filter((a) => {
    if (a.status !== 'published') return false;
    const nowStr = new Date().toISOString().split('T')[0];
    return a.endDate < nowStr;
  }).length;

  // Submissions requiring evaluation (submitted status, manualGrade = true, and not yet evaluated)
  const pendingEvaluations = submissions.filter((sub) => {
    const as = assessments.find((a) => a.id === sub.assessmentId);
    return sub.status === 'submitted' && as?.manualGrade && !sub.isEvaluated;
  }).length;

  // Charts data preparation
  // 1. Submission Trend (Last 7 Days dummy dates but mapped to real submission counts)
  const submissionTrendData = [
  { name: 'Mon', count: 18 },
  { name: 'Tue', count: 24 },
  { name: 'Wed', count: 32 },
  { name: 'Thu', count: 15 },
  { name: 'Fri', count: 28 },
  { name: 'Sat', count: 12 },
  { name: 'Sun', count: 21 }];


  // 2. Average Scores per Top 5 Assessments (Auto or Manual Evaluated)
  const evaluatedSubs = submissions.filter((s) => s.status === 'submitted' && s.isEvaluated);
  const assessmentsScores = assessments.slice(0, 5).map((a) => {
    const subs = evaluatedSubs.filter((s) => s.assessmentId === a.id);
    const avg = subs.length > 0 ?
    Math.round(subs.reduce((sum, s) => sum + s.percentage, 0) / subs.length) :
    75; // fallback default
    return {
      title: a.title.split(' [')[0].substring(0, 15) + '...',
      average: avg,
      passing: 60
    };
  });

  // 3. Batch Student count & Performance
  const batchPerformanceData = batches.slice(0, 5).map((b) => {
    // find all students of this batch
    const bStudents = students.filter((s) => (s.batches || []).includes(b.id));
    const avgScore = bStudents.length > 0 ?
    Math.round(bStudents.reduce((sum, s) => sum + (s.averageScore || 0), 0) / bStudents.length) :
    80;
    return {
      name: b.name,
      students: b.studentCount,
      avgScore: avgScore
    };
  });

  // Recent Submissions (Latest 4)
  const recentSubmissions = submissions.
  filter((s) => s.status === 'submitted').
  slice(0, 4).
  map((s) => {
    const student = students.find((stud) => stud.id === s.studentId);
    const assessment = assessments.find((a) => a.id === s.assessmentId);
    return {
      id: s.id,
      studentName: student?.name || 'Unknown Student',
      studentAvatar: student?.avatar,
      assessmentTitle: assessment?.title || 'Unknown Quiz',
      submittedAt: s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Recent',
      score: s.score,
      totalMarks: assessment?.marks || 100,
      percentage: s.percentage,
      isEvaluated: s.isEvaluated
    };
  });

  // Draft & Unallocated Assessments
  const needsAttentionAssessments = assessments.
  filter((a) => a.status === 'draft' || a.status === 'unallocated').
  slice(0, 4);

  // Core color tokens from Xebia brand
  const velvetColor = '#6C1D5F';
  const emeraldColor = '#01AC9F';
  const orangeColor = '#FF6200';

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#4A1E47] via-[#6C1D5F] to-[#84117C] text-white p-6 md:p-8 rounded-3xl shadow-xl dark:shadow-purple-900/20 border border-white/10 dark:border-white/5 relative overflow-hidden flex flex-col justify-center min-h-[160px]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -mb-20 pointer-events-none" />
        
        <div className="relative z-10 space-y-1.5 max-w-3xl">
          <h2 className="font-display font-black text-2xl md:text-4xl tracking-tight text-white flex items-center gap-3 drop-shadow-md">
            Hello, Trainer!
          </h2>
          <p className="text-purple-100/90 text-xs md:text-sm leading-relaxed font-medium mt-2">
            Welcome to your comprehensive LMS Assessment Command Center. Review batch milestones, evaluate pending descriptive submissions, or design multi-question exams instantly.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: totalStudents, icon: Users, color: '#6C1D5F', bg: 'bg-[#6C1D5F]/10 dark:bg-purple-900/30' },
          { label: 'Total Batches', value: totalBatches, icon: Layers, color: '#01AC9F', bg: 'bg-[#01AC9F]/10 dark:bg-emerald-900/30' },
          { label: 'Total Assessments', value: totalAssessments, icon: FileSpreadsheet, color: '#F59E0B', bg: 'bg-amber-500/10 dark:bg-amber-900/30' },
          { label: 'Pending Evaluation', value: pendingEvaluations, icon: FileSignature, color: '#EF4444', bg: 'bg-rose-500/10 dark:bg-rose-900/30' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 p-4 md:p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-1.5 hover:shadow-xl dark:hover:shadow-purple-900/10 transition-all duration-300 group cursor-default">
            <div className={`p-3 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${kpi.bg}`}>
              <kpi.icon className="w-6 h-6" style={{ color: kpi.color }} />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mb-1">{kpi.label}</p>
              <h4 className="text-2xl md:text-3xl font-display font-black text-neutral-900 dark:text-white leading-none tracking-tight">
                {kpi.value}
              </h4>
            </div>
          </div>
        ))}
      </div>



      {/* Charts Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Submission Trend */}
        <div className="bg-white dark:bg-neutral-900/80 backdrop-blur-xl p-6 rounded-[1.5rem] border border-neutral-200 dark:border-neutral-800 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="font-display font-extrabold text-base text-neutral-900 dark:text-white uppercase tracking-wider">Submission Trend</h3>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Frequency of student quiz hand-ins over last week</p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 shadow-sm border border-emerald-200 dark:border-emerald-800">
              <TrendingUp className="w-4 h-4" /> +14.2%
            </span>
          </div>
          <div className="flex-grow w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={submissionTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={velvetColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={velvetColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" />
                <XAxis dataKey="name" stroke="currentColor" className="text-neutral-400 dark:text-neutral-500" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="currentColor" className="text-neutral-400 dark:text-neutral-500" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: velvetColor, fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke={velvetColor} strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, strokeWidth: 0, fill: velvetColor }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Average Scores per Assessment */}
        <div className="bg-white dark:bg-neutral-900/80 backdrop-blur-xl p-6 rounded-[1.5rem] border border-neutral-200 dark:border-neutral-800 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-[400px]">
          <div className="mb-8">
            <h3 className="font-display font-extrabold text-base text-neutral-900 dark:text-white uppercase tracking-wider">Assessment Averages</h3>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Average score (%) across top 5 core modules</p>
          </div>
          <div className="flex-grow w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assessmentsScores} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" />
                <XAxis type="number" domain={[0, 100]} stroke="currentColor" className="text-neutral-400 dark:text-neutral-500" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="title" type="category" stroke="currentColor" className="text-neutral-600 dark:text-neutral-400 font-semibold" fontSize={10} width={90} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(1,172,159,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: emeraldColor, fontWeight: 'bold' }}
                />
                <Bar dataKey="average" fill={emeraldColor} radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Batch Performance and Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Batch Performances */}
        <div className="bg-white dark:bg-neutral-900/80 backdrop-blur-xl p-6 rounded-[1.5rem] border border-neutral-200 dark:border-neutral-800 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 lg:col-span-1 flex flex-col h-full">
          <div className="mb-6">
            <h3 className="font-display font-extrabold text-base text-neutral-900 dark:text-white uppercase tracking-wider">Batch Performance</h3>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Compare student density and grades across core groups</p>
          </div>
          <div className="space-y-6 flex-grow">
            {batchPerformanceData.map((batch) => (
              <div key={batch.name} className="space-y-2 group cursor-default">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-neutral-800 dark:text-neutral-200 group-hover:text-[#6C1D5F] dark:group-hover:text-purple-400 transition-colors">{batch.name}</span>
                  <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg">{batch.students} active stds</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-[#6C1D5F] to-[#84117C] h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                      style={{ width: `${batch.avgScore}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-[translateX_2s_infinite]" />
                    </div>
                  </div>
                  <span className="text-sm font-black text-[#6C1D5F] dark:text-purple-300 font-mono w-10 text-right">{batch.avgScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions queue */}
        <div className="bg-white dark:bg-neutral-900/80 backdrop-blur-xl p-6 rounded-[1.5rem] border border-neutral-200 dark:border-neutral-800 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 lg:col-span-2 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-extrabold text-base text-neutral-900 dark:text-white uppercase tracking-wider">Recent Assessment Activity</h3>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Real-time submitted quiz streams synced directly</p>
            </div>
            <Link
              to="/manual-evaluation"
              className="text-sm text-[#6C1D5F] dark:text-purple-400 font-black hover:bg-purple-50 dark:hover:bg-purple-900/30 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
            >
              <span>View Queue</span> <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-wider text-[11px]">
                  <th className="pb-4 pl-3">Student</th>
                  <th className="pb-4">Assessment</th>
                  <th className="pb-4">Graded?</th>
                  <th className="pb-4 text-right pr-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-neutral-500 dark:text-neutral-400 font-medium">
                      No recent submissions.
                    </td>
                  </tr>
                ) : (
                  recentSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                      <td className="py-4 pl-3 flex items-center gap-3">
                        <img
                          src={sub.studentAvatar}
                          alt={sub.studentName}
                          className="w-6 h-6 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer" 
                        />
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">{sub.studentName}</span>
                      </td>
                      <td className="py-4 font-semibold text-neutral-600 dark:text-neutral-300 max-w-[180px] truncate">
                        {sub.assessmentTitle}
                      </td>
                      <td className="py-4">
                        {sub.isEvaluated ? (
                          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-black rounded-xl text-[11px] uppercase tracking-wide border border-emerald-200 dark:border-emerald-800">
                            Evaluated
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-black rounded-xl text-[11px] uppercase tracking-wide border border-rose-200 dark:border-rose-800 animate-pulse">
                            Needs Grading
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right font-mono font-black text-neutral-900 dark:text-white pr-3 text-base">
                        {sub.isEvaluated ? `${sub.percentage}%` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Needs Attention (Draft / Unallocated) */}
        <div className="bg-white dark:bg-neutral-900/80 backdrop-blur-xl p-6 rounded-[1.5rem] border border-neutral-200 dark:border-neutral-800 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 lg:col-span-1 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-extrabold text-base text-neutral-900 dark:text-white uppercase tracking-wider">Needs Attention</h3>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Draft or Unallocated assessments</p>
            </div>
            <Link
              to="/assessment-builder"
              className="text-sm text-[#01AC9F] dark:text-emerald-400 font-black hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-1.5 rounded-xl transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
            >
              Manage
            </Link>
          </div>
          <div className="space-y-4 flex-grow">
            {needsAttentionAssessments.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                No assessments need attention.
              </div>
            ) : (
              needsAttentionAssessments.map((a) => (
                <div key={a.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/50 rounded-xl flex items-center justify-between gap-3 group">
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">{a.title}</h4>
                    <p className="text-[10px] text-neutral-500 mt-1 capitalize">{a.type.replace('_', ' ')} • {a.marks} pts</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${a.status === 'unallocated' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                      {a.status}
                    </span>
                    {a.status === 'unallocated' ? (
                      <button 
                        onClick={() => {
                          setQuickAllocateId(a.id);
                          setSelectedBatches([]);
                        }} 
                        className="text-[10px] font-bold text-[#6C1D5F] hover:underline"
                      >
                        Quick Allocate
                      </button>
                    ) : (
                      <Link to={`/assessment-builder/${a.id}`} className="text-[10px] font-bold text-[#6C1D5F] hover:underline">
                        Edit Draft
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Quick Allocate Modal */}
      <AnimatePresence>
        {quickAllocateId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setQuickAllocateId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-white text-lg">Quick Allocate</h3>
                  <p className="text-xs text-neutral-500">Select batches to instantly publish this assessment</p>
                </div>
                <button onClick={() => setQuickAllocateId(null)} className="p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
                {batches.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4">No batches available to allocate.</p>
                ) : (
                  batches.map(b => (
                    <label key={b.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedBatches.includes(b.id) ? 'border-[#6C1D5F] bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}>
                      <input 
                        type="checkbox"
                        checked={selectedBatches.includes(b.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedBatches([...selectedBatches, b.id]);
                          else setSelectedBatches(selectedBatches.filter(id => id !== b.id));
                        }}
                        className="w-4 h-4 text-[#6C1D5F]"
                      />
                      <div>
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{b.name}</p>
                        <p className="text-xs text-neutral-500">{b.course}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-900/50">
                <button onClick={() => setQuickAllocateId(null)} className="px-4 py-2 text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl">
                  Cancel
                </button>
                <button 
                  onClick={handleQuickAllocate}
                  className="px-6 py-2 text-sm font-bold text-white bg-[#6C1D5F] hover:bg-[#84117C] rounded-xl shadow-md"
                >
                  Publish Now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>);

};
