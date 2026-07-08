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
  Clock3
} from 'lucide-react';

export const StudentAssessments = () => {
  const { currentUser, assessments, submissions } = useLMS();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Active, Upcoming, Completed
  const [typeFilter, setTypeFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  if (!currentUser) return null;

  // Student specific submissions
  const studentSubmissions = submissions.filter((s) => s.studentId === currentUser.id);

  // All assessments assigned to the student's batch(es)
  const studentAssessments = assessments.filter((a) => {
    return a.status === 'published' && a.batches && a.batches.some((bId) => currentUser.batches?.includes(bId));
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

    return matchesSearch && matchesStatus && matchesType && matchesDifficulty;
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
    setSortBy('Newest');
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
                        {as.type.replace('_', ' ')}
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
                          <button
                            onClick={() => handleStartAttempt(as.id)}
                            className="bg-[#01AC9F] hover:bg-[#019388] text-white px-4 py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            {as.attemptsMade >= as.maxAttempts ? 'Assessment Locked' : 'Start'}
                          </button>
                        ) : as.computedStatus === 'Completed' ? (
                          <button
                            onClick={() => as.studentSubmission && handleViewResult(as.studentSubmission.id)}
                            disabled={!as.studentSubmission}
                            className={`bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 px-4 py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-colors ${!as.studentSubmission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {as.studentSubmission ? 'View Result' : (as.attemptsMade >= as.maxAttempts ? 'Assessment Locked' : 'Expired')}
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">
                            Locked
                          </span>
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
                    <button
                      onClick={() => handleStartAttempt(as.id)}
                      disabled={as.attemptsMade >= as.maxAttempts}
                      className={`w-full py-2 rounded-lg text-xs font-black uppercase shadow-sm tracking-wider cursor-pointer flex items-center justify-center gap-1 transition-all ${as.attemptsMade >= as.maxAttempts ? 'bg-neutral-400 text-white cursor-not-allowed' : 'bg-[#6C1D5F] hover:bg-[#84117C] text-white shadow-purple-950/10'}`}
                    >
                      <span>{as.attemptsMade >= as.maxAttempts ? 'Assessment Locked' : 'Initialize Assessment'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : as.computedStatus === 'Completed' ? (
                    <button
                      onClick={() => as.studentSubmission && handleViewResult(as.studentSubmission.id)}
                      disabled={!as.studentSubmission}
                      className={`w-full py-2 rounded-lg text-xs font-black uppercase shadow-sm border tracking-wider flex items-center justify-center gap-1 transition-all bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 ${!as.studentSubmission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span>{as.studentSubmission ? 'View Result' : (as.attemptsMade >= as.maxAttempts ? 'Assessment Locked' : 'Expired')}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2 rounded-lg text-xs font-black uppercase border tracking-wider flex items-center justify-center gap-1 transition-all bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed"
                    >
                      <span>Starts on {new Date(`${as.startDate}T${as.startTime || '00:00'}`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {as.startTime || '00:00'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


