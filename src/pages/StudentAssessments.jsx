import React, { useState } from 'react';
import { useLMS } from '../context/LMSContext';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  HelpCircle,
  ArrowRight,
  LayoutGrid,
  List,
  Search,
  Filter,
  X,
  Calendar,
  CheckCircle2,
  Clock3,
  Award,
  History,
  Info
} from 'lucide-react';
import CertificateViewer from '../components/CertificateViewer';

export const StudentAssessments = () => {
  const { currentUser, assessments, submissions, getAssessmentHistory, batches, certificates } = useLMS();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Active, Upcoming, Completed
  const [typeFilter, setTypeFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [historyModalAssessment, setHistoryModalAssessment] = useState(null);
  const [assessmentHistoryList, setAssessmentHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  if (!currentUser) return null;

  // Student specific submissions
  const studentSubmissions = submissions.filter((s) => s.studentId === currentUser.id);

  // All assessments assigned to the student's batch(es)
  const studentAssessments = assessments.filter((a) => {
    return a.status?.toLowerCase() === 'published' && a.batches && a.batches.some((bId) => currentUser.batches?.includes(bId));
  });

  const now = new Date();

  // Map each assessment with its computed status for the student
  const mappedAssessments = studentAssessments.map((a) => {
    const subs = studentSubmissions.filter((s) => s.assessmentId === a.id);
    const completedSubs = subs.filter(s => s.status === 'submitted');
    const inProgressSub = subs.find(s => s.status === 'in_progress');
    const maxAttempts = a.maxAttempts || 1;
    
    let computedStatus = 'Active';

    const startDateTime = new Date(`${a.startDate}T${a.startTime || '00:00'}`);
    const endDateTime = a.endDate ? new Date(`${a.endDate}T${a.endTime || '23:59'}`) : new Date('2099-12-31');

    if (now > endDateTime) {
      computedStatus = 'Completed';
    } else if (now < startDateTime) {
      computedStatus = 'Upcoming';
    } else if (completedSubs.length >= maxAttempts) {
      computedStatus = 'Completed';
    }

    return {
      ...a,
      computedStatus,
      attemptsMade: completedSubs.length,
      studentSubmission: completedSubs[completedSubs.length - 1],
      maxAttempts
    };
  });

  // Filter and Sort logic
  let filteredAssessments = mappedAssessments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.computedStatus === statusFilter;
    const matchesType = typeFilter === 'All' || a.type === typeFilter;
    const matchesDifficulty = difficultyFilter === 'All' || a.difficulty === difficultyFilter;
    const matchesBatch = batchFilter === 'All' || (a.batches && a.batches.includes(batchFilter));

    return matchesSearch && matchesStatus && matchesType && matchesDifficulty && matchesBatch;
  });

  filteredAssessments.sort((a, b) => {
    if (sortBy === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'Oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'A-Z') return a.title.localeCompare(b.title);
    if (sortBy === 'Z-A') return b.title.localeCompare(a.title);
    return 0;
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setTypeFilter('All');
    setDifficultyFilter('All');
    setBatchFilter('All');
    setSortBy('Newest');
  };

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

  const handleStartAttempt = (id) => {
    const as = assessments.find((x) => x.id === id);
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
    <div className="space-y-6 w-full">
      {/* Control Panel (Search, Filters, View Toggles) */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 space-y-4">
        
        {/* Top Row: Search and Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by assessment title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-neutral-400 font-medium whitespace-nowrap">
            <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-200 font-bold">
              {filteredAssessments.length}
            </span> Assessments Found
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
            <Filter className="w-4 h-4" /> Filters:
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] cursor-pointer shadow-sm min-w-[120px]"
          >
            <option value="All">Status: All</option>
            <option value="Active">Active</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
          </select>

          <select 
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] cursor-pointer shadow-sm min-w-[150px]"
          >
            <option value="All">Batch: All</option>
            {(currentUser.batches || []).map((bId) => {
              const bObj = batches?.find(b => b.id === bId);
              return (
                <option key={bId} value={bId}>
                  {bObj ? bObj.name : `Batch ${bId}`}
                </option>
              );
            })}
          </select>

          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] cursor-pointer shadow-sm min-w-[150px]"
          >
            <option value="All">Type: All</option>
            <option value="mcq">MCQ</option>
            <option value="coding">Coding</option>
            <option value="true_false">True / False</option>
            <option value="multi_select">Multi Select</option>
            <option value="short_answer">Short Answer</option>
            <option value="file_upload">File Upload</option>
          </select>

          <select 
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] cursor-pointer shadow-sm min-w-[150px]"
          >
            <option value="All">Difficulty: All</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] cursor-pointer shadow-sm min-w-[160px]"
          >
            <option value="Newest">Sort: Newest First</option>
            <option value="Oldest">Sort: Oldest First</option>
            <option value="A-Z">Sort: A-Z</option>
            <option value="Z-A">Sort: Z-A</option>
          </select>

          {(searchQuery || statusFilter !== 'All' || typeFilter !== 'All' || difficultyFilter !== 'All' || sortBy !== 'Newest') && (
            <button onClick={handleClearFilters} className="text-xs font-bold text-[#6C1D5F] dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1 bg-[#6C1D5F]/10 dark:bg-purple-400/10 px-2 py-1 rounded-md">
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}

          <div className="ml-auto flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-800 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-800 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Display based on ViewMode */}
      {filteredAssessments.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-16 text-center text-neutral-500 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-full">
            <Search className="w-8 h-8 text-neutral-400" />
          </div>
          <div>
            <p className="font-bold text-lg text-neutral-700 dark:text-neutral-300">No assessments found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[60vh]">
            <div className="overflow-x-auto w-full"><table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
                <tr className="text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-6 font-bold">Assessment Title</th>
                  <th className="py-4 px-6 font-bold">Type</th>
                  <th className="py-4 px-6 font-bold">Difficulty</th>
                  <th className="py-4 px-6 font-bold text-center">Status</th>
                  <th className="py-4 px-6 text-right font-bold">Marks / Duration</th>
                  <th className="py-4 px-6 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 bg-white dark:bg-neutral-900">
                {filteredAssessments.map((as) => {
                  const statusColor = {
                    Active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                    Upcoming: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                    Completed: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                  }[as.computedStatus];

                  const StatusIcon = {
                    Active: CheckCircle2,
                    Upcoming: Calendar,
                    Completed: Clock3
                  }[as.computedStatus];

                  return (
                    <tr 
                      key={as.id} 
                      className="even:bg-neutral-50/50 dark:even:bg-neutral-800/20 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-neutral-900 dark:text-white truncate max-w-[250px]">{as.title}</div>
                        <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 truncate max-w-[250px]">
                          {as.description}
                        </div>
                      </td>
                      <td className="py-4 px-6 capitalize font-semibold text-neutral-600 dark:text-neutral-300">
                        {(as.type || '').replace('_', ' ')}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${as.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : as.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'}`}>
                          {as.difficulty}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${statusColor}`}>
                          <StatusIcon className="w-3 h-3" />
                          {as.computedStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="font-bold text-neutral-900 dark:text-white">{as.marks} Marks</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">{as.duration} mins</div>
                        <div className="text-[10px] text-[#01AC9F] mt-1 font-bold">Attempts: {as.attemptsMade}/{as.maxAttempts}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {as.computedStatus === 'Active' ? (
                          <div className="flex flex-col gap-1.5 items-center">
                            <button
                              onClick={() => handleStartAttempt(as.id)}
                              className="bg-[#01AC9F] hover:bg-[#019388] text-white px-4 py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-colors cursor-pointer w-full text-center"
                            >
                              {as.attemptsMade >= as.maxAttempts ? 'Assessment Locked' : 'Start'}
                            </button>
                            <button
                              onClick={(e) => handleOpenHistory(e, as)}
                              className="bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 w-full"
                            >
                              <History className="w-3 h-3" /> History Log
                            </button>
                          </div>
                        ) : as.computedStatus === 'Completed' ? (
                          <div className="flex flex-col gap-1.5 items-center w-full">
                            <button
                              onClick={() => as.studentSubmission && handleViewResult(as.studentSubmission.id)}
                              disabled={!as.studentSubmission}
                              className={`w-full text-center bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 px-4 py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-colors ${!as.studentSubmission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {as.studentSubmission ? 'View Result' : (as.attemptsMade >= as.maxAttempts ? 'Assessment Locked' : 'Expired')}
                            </button>
                            {certificates && certificates.find(c => c.assessmentId === as.id) && (
                              <button
                                onClick={() => setSelectedCertificate({ cert: certificates.find(c => c.assessmentId === as.id), title: as.title })}
                                className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-4 py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 w-full"
                              >
                                <Award className="w-3 h-3" /> Certificate
                              </button>
                            )}
                            <button
                              onClick={(e) => handleOpenHistory(e, as)}
                              className="bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 w-full"
                            >
                              <History className="w-3 h-3" /> History Log
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5 items-center">
                            <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">
                              Upcoming
                            </span>
                            <button
                              onClick={(e) => handleOpenHistory(e, as)}
                              className="bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 w-full"
                            >
                              <History className="w-3 h-3" /> History Log
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredAssessments.map((as) => {
            const difficultyColor = {
              Easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50',
              Medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50',
              Hard: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50'
            }[as.difficulty] || 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50';
            
            const statusColor = as.computedStatus === 'Active' 
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
              : as.computedStatus === 'Completed'
                ? 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                : 'text-neutral-700 bg-neutral-50 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';

            return (
              <div key={as.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 md:p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group overflow-hidden relative">
                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-gradient-to-br from-[#6C1D5F]/5 to-transparent blur-2xl group-hover:bg-[#6C1D5F]/10 transition-colors pointer-events-none" />

                {/* Header Section */}
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-black text-sm md:text-base text-neutral-800 dark:text-white leading-tight mb-1 truncate">
                      {as.title}
                    </h3>
                    <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate w-full">
                      {as.subject || as.course || 'General'}
                    </div>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border shadow-sm ${statusColor} shrink-0`}>
                    {as.computedStatus}
                  </span>
                </div>

                {as.description && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2">
                    {as.description}
                  </p>
                )}

                {/* Info Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded text-[10px] font-bold capitalize">
                    {(as.type || '').replace('_', ' ')}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${difficultyColor}`}>
                    {as.difficulty}
                  </span>
                  <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-[#6C1D5F] dark:text-purple-400 rounded text-[10px] font-bold font-mono">
                    {as.marks} pts
                  </span>
                  <span className="px-1.5 py-0.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 rounded text-[10px] font-bold">
                    {String(as.duration).replace(' mins', '')} min
                  </span>
                </div>

                <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800 relative z-10">
                  {as.computedStatus === 'Active' ? (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleStartAttempt(as.id)}
                        disabled={as.attemptsMade >= as.maxAttempts}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase shadow-sm tracking-wider cursor-pointer flex items-center justify-center gap-1 transition-all ${as.attemptsMade >= as.maxAttempts ? 'bg-neutral-400 text-white cursor-not-allowed' : 'bg-[#6C1D5F] hover:bg-[#84117C] text-white shadow-purple-950/10'}`}
                      >
                        <span>{as.attemptsMade >= as.maxAttempts ? 'Locked' : 'Start'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenHistory(e, as)}
                        className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 border border-neutral-250 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        title="View Edit History Log"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  ) : as.computedStatus === 'Completed' ? (
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => as.studentSubmission && handleViewResult(as.studentSubmission.id)}
                        disabled={!as.studentSubmission}
                        className={`w-full py-2 rounded-lg text-xs font-black uppercase shadow-sm border tracking-wider flex items-center justify-center gap-1 transition-all bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 ${!as.studentSubmission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span>{as.studentSubmission ? 'View Result' : (as.attemptsMade >= as.maxAttempts ? 'Assessment Locked' : 'Expired')}</span>
                      </button>
                      <div className="flex gap-2">
                        {certificates && certificates.find(c => c.assessmentId === as.id) && (
                          <button
                            onClick={() => setSelectedCertificate({ cert: certificates.find(c => c.assessmentId === as.id), title: as.title })}
                            className="flex-1 py-2 rounded-lg text-xs font-black uppercase shadow-sm border border-indigo-200 tracking-wider flex items-center justify-center gap-1 transition-all bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer"
                          >
                            <Award className="w-4 h-4" /> <span>Certificate</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleOpenHistory(e, as)}
                          className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 border border-neutral-250 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                          title="View Edit History Log"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <button
                        disabled
                        className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase border tracking-wider flex items-center justify-center gap-1 transition-all bg-neutral-105 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed"
                      >
                        <span>Upcoming</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenHistory(e, as)}
                        className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 border border-neutral-250 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                        title="View Edit History Log"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
                    <p className="text-xs text-neutral-550 dark:text-neutral-450 mt-1">No previous edit history logs exist for this assessment. It is in its original state.</p>
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
                        <div className="w-7 h-7 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-455 rounded-full flex items-center justify-center font-mono font-bold text-[10px] z-10 shrink-0">
                          {hist.version ? `v${hist.version}` : `v${assessmentHistoryList.length - idx}`}
                        </div>
                        <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 p-4 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Version {hist.version} Snapshot</span>
                            <span className="text-[10px] text-neutral-400 font-mono">{formattedHistDate}</span>
                          </div>
                          
                          <p className="text-xs text-neutral-650 dark:text-neutral-450 pt-1 leading-normal font-medium">
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
    </div>
  );
};


