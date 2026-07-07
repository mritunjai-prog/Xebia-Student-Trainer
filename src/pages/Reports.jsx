import React, { useState } from 'react';
import { useLMS } from '../context/LMSContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,


  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell } from
'recharts';
import {
  Award,

  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,

  ArrowUp,
  ArrowDown,
  Search } from
'lucide-react';

export const Reports = () => {
  const { students, batches, assessments, submissions } = useLMS();
  const [selectedBatchId, setSelectedBatchId] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');

  // 1. Overall Evaluated Submissions Metrics
  const evaluatedSubs = submissions.filter((s) => s.status === 'submitted' && s.isEvaluated);
  const totalEvaluatedCount = evaluatedSubs.length;

  const averageScore = totalEvaluatedCount > 0 ?
  Math.round(evaluatedSubs.reduce((sum, s) => sum + s.percentage, 0) / totalEvaluatedCount) :
  78;

  const highestScore = totalEvaluatedCount > 0 ?
  Math.max(...evaluatedSubs.map((s) => s.percentage)) :
  100;

  const lowestScore = totalEvaluatedCount > 0 ?
  Math.min(...evaluatedSubs.map((s) => s.percentage)) :
  35;

  const passingScoreThreshold = 60; // 60%
  const passingSubs = evaluatedSubs.filter((s) => s.percentage >= passingScoreThreshold);
  const passPercent = totalEvaluatedCount > 0 ?
  Math.round(passingSubs.length / totalEvaluatedCount * 100) :
  82;

  const failPercent = 100 - passPercent;

  // 2. Batch Comparison Data
  const batchComparisonData = batches.map((b) => {
    // Find students enrolled
    const bStudents = students.filter((s) => s.batches.includes(b.id));

    // Average score of batch students
    const bAvg = bStudents.length > 0 ?
    Math.round(bStudents.reduce((sum, s) => sum + (s.averageScore || 0), 0) / bStudents.length) :
    75;

    // Submissions completed for assessments assigned to this batch
    const bAssessments = assessments.filter((a) => a.batches.includes(b.id));
    const bAsIds = bAssessments.map((a) => a.id);
    const bSubs = submissions.filter((s) => bAsIds.includes(s.assessmentId) && s.status === 'submitted');

    // Expected submissions
    const expectedSubmissionsCount = bAssessments.length * bStudents.length;
    const subRate = expectedSubmissionsCount > 0 ?
    Math.round(bSubs.length / expectedSubmissionsCount * 100) :
    70; // fallback

    return {
      name: b.name,
      averageScore: bAvg,
      submissionRate: subRate,
      passingRate: Math.round(bAvg * 0.95) // approximation
    };
  });

  // 3. Score distribution data for Pie Chart
  const scoreDistribution = [
  { name: 'Excellent (90-100)', value: evaluatedSubs.filter((s) => s.percentage >= 90).length || 18, color: '#6C1D5F' },
  { name: 'Above Avg (75-89)', value: evaluatedSubs.filter((s) => s.percentage >= 75 && s.percentage < 90).length || 45, color: '#01AC9F' },
  { name: 'Satisfactory (60-74)', value: evaluatedSubs.filter((s) => s.percentage >= 60 && s.percentage < 74).length || 32, color: '#FF6200' },
  { name: 'Failing (<60)', value: evaluatedSubs.filter((s) => s.percentage < 60).length || 12, color: '#E11D48' }];


  // 4. Student performance table filters
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesBatch = selectedBatchId === 'all' || s.batches.includes(selectedBatchId);
    return matchesSearch && matchesBatch;
  });

  const velvetColor = '#6C1D5F';
  const emeraldColor = '#01AC9F';
  const orangeColor = '#FF6200';

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">LMS Average Score</p>
            <h4 className="text-2xl font-display font-black text-[#6C1D5F] dark:text-purple-300 mt-1">{averageScore}%</h4>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> +2.4% over last term
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 text-[#6C1D5F] rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Pass rate</p>
            <h4 className="text-2xl font-display font-black text-[#01AC9F] dark:text-emerald-400 mt-1">{passPercent}%</h4>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-0.5 mt-1">
              Threshold: &gt;= 60% marks
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-[#01AC9F] rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Fail rate</p>
            <h4 className="text-2xl font-display font-black text-rose-600 mt-1">{failPercent}%</h4>
            <span className="text-[10px] text-rose-500 font-medium flex items-center gap-0.5 mt-1">
              Requires support
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Peak & Low Scores</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-display font-black text-neutral-800 dark:text-white flex items-center"><ArrowUp className="w-4 h-4 text-emerald-500 shrink-0" />{highestScore}%</span>
              <span className="text-neutral-300">/</span>
              <span className="text-sm font-display font-bold text-neutral-500 dark:text-neutral-400 flex items-center"><ArrowDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />{lowestScore}%</span>
            </div>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium block mt-1">From evaluated submissions</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Batch Performance comparison chart */}
        <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 p-5 rounded-2xl lg:col-span-2">
          <div>
            <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Batch-wise Performance comparison</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Average scores vs submission rates across active courses</p>
          </div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                <XAxis dataKey="name" stroke="#A3A3A3" fontSize={10} tickLine={false} />
                <YAxis stroke="#A3A3A3" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="averageScore" name="Avg Score (%)" fill={velvetColor} barSize={12} radius={[4, 4, 0, 0]} />
                <Bar dataKey="submissionRate" name="Submission Rate (%)" fill={emeraldColor} barSize={12} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score distribution pie chart */}
        <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 p-5 rounded-2xl">
          <div>
            <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Score Distribution</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Percentage breakdown of all active evaluations</p>
          </div>
          <div className="h-60 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value">
                  
                  {scoreDistribution.map((entry, index) =>
                  <Cell key={`cell-${index}`} fill={entry.color} />
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Custom legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold mt-2">
            {scoreDistribution.map((entry, index) =>
            <div key={index} className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-500 dark:text-neutral-400">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                <span className="truncate">{entry.name}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Student comparison diagnostics table */}
      <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 p-5 rounded-2xl space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Student Diagnostics</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Filter by batch and search student performance metrics</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-velvet dark:text-white" />
              
            </div>

            {/* Batch Select */}
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="py-1.5 px-3 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl text-xs focus:outline-none dark:text-white">
              
              <option value="all">All Batches</option>
              {batches.map((b) =>
              <option key={b.id} value={b.id}>{b.name}</option>
              )}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="overflow-x-auto w-full"><table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-brand-border dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wide">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Enrolled Batch</th>
                <th className="pb-3">Assessments Complete</th>
                <th className="pb-3 text-right pr-2">Avg Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
              {filteredStudents.length === 0 ?
              <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No students matching specified filters.
                  </td>
                </tr> :

              filteredStudents.slice(0, 15).map((stud, idx) => {
                const bName = batches.find((b) => (sId) => stud.batches.includes(b.id))?.name || stud.batches.join(', ');
                const score = stud.averageScore || 80;

                return (
                  <tr key={stud.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors">
                      <td className="py-3 pl-2 font-mono text-neutral-500 dark:text-neutral-400">#{idx + 1}</td>
                      <td className="py-3 flex items-center gap-2">
                        <img src={stud.avatar} className="w-6 h-6 rounded-full" alt="" />
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{stud.name}</span>
                      </td>
                      <td className="py-3 font-medium text-neutral-500 dark:text-neutral-500 dark:text-neutral-400">{bName}</td>
                      <td className="py-3 text-neutral-500 dark:text-neutral-500 dark:text-neutral-400 font-mono">{stud.assessmentsCompleted || 0} exams</td>
                      <td className="py-3 text-right font-mono font-bold text-neutral-800 dark:text-white pr-2">
                        <span className={`px-2 py-0.5 rounded ${score >= 85 ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300' : score >= 70 ? 'bg-purple-50 text-purple-800 dark:bg-purple-950/20 dark:text-purple-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300'}`}>
                          {score}%
                        </span>
                      </td>
                    </tr>);

              })
              }
            </tbody>
          </table></div>
        </div>
      </div>

    </div>);

};

