import React, { useState, useMemo } from 'react';
import { useLMS } from '../context/LMSContext';
import { toast } from '../components/Toast';
import Editor from '@monaco-editor/react';
import {
  Plus, Trash2, Copy, Send, Settings, HelpCircle,
  FileEdit, Check, X, Search, Filter, LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EnterpriseBuilderLayout } from '../components/assessment-builder/EnterpriseBuilderLayout';

export const AssessmentBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    assessments,
    batches,
    createAssessment,
    editAssessment,
    deleteAssessment,
    duplicateAssessment,
    archiveAssessment,
    publishAssessment
  } = useLMS();

  // Top-level Navigation and View Modes
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'edit'
  const [editingAssessmentId, setEditingAssessmentId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'table'

  // Listing / Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [difficulty, setDifficulty] = useState('Medium');
  const [duration, setDuration] = useState(30);
  const [passingMarks, setPassingMarks] = useState(12);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:59');
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [asType, setAsType] = useState('mcq');
  const [status, setStatus] = useState('draft');
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarksValue, setNegativeMarksValue] = useState(25); // percentage

  // Question Builder States
  const [questions, setQuestions] = useState([]);

  // Individual Question Temporary State
  const [currentQText, setCurrentQText] = useState('');
  const [currentQType, setCurrentQType] = useState('mcq');

  // Coding challenge builder states
  const [codingDifficulty, setCodingDifficulty] = useState('Easy');
  const [codingTimeLimit, setCodingTimeLimit] = useState(1000);
  const [codingMemoryLimit, setCodingMemoryLimit] = useState(256);
  const [codingLanguagesAllowed, setCodingLanguagesAllowed] = useState(['javascript', 'python']);
  const [codingTagsText, setCodingTagsText] = useState('');
  const [codingConstraints, setCodingConstraints] = useState('1 <= N <= 10^5');
  const [codingInputFormat, setCodingInputFormat] = useState('');
  const [codingOutputFormat, setCodingOutputFormat] = useState('');
  const [codingSampleInput, setCodingSampleInput] = useState('');
  const [codingSampleOutput, setCodingSampleOutput] = useState('');
  const [codingExplanation, setCodingExplanation] = useState('');
  const [codingNotes, setCodingNotes] = useState('');
  const [codingHintsList, setCodingHintsList] = useState([]);
  const [newHintText, setNewHintText] = useState('');

  // Templates state
  const [codingTemplates, setCodingTemplates] = useState({
    javascript: '// Write your javascript solution here\nfunction solve(n) {\n  \n}',
    python: '# Write your python solution here\ndef solve(n):\n    pass',
    java: '// Write your java solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}',
    cpp: '// Write your C++ solution here\n#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}'
  });
  const [templateEditLang, setTemplateEditLang] = useState('javascript');

  // Test cases state
  const [codingTestCasesList, setCodingTestCasesList] = useState([]);
  const [newTcInput, setNewTcInput] = useState('');
  const [newTcExpected, setNewTcExpected] = useState('');
  const [newTcWeight, setNewTcWeight] = useState(10);
  const [newTcVisibility, setNewTcVisibility] = useState('public');
  const [currentQMarks, setCurrentQMarks] = useState(5);
  const [currentQRequired, setCurrentQRequired] = useState(true);
  const [currentQExplanation, setCurrentQExplanation] = useState('');
  const [currentQOptions, setCurrentQOptions] = useState(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
  const [currentQCorrectIndex, setCurrentQCorrectIndex] = useState('0');
  const [currentQCorrectIndices, setCurrentQCorrectIndices] = useState(['0']);

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setInstructions('');
    setSelectedBatches([]);
    setDifficulty('Medium');
    setDuration(30);
    setPassingMarks(12);

    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setStartDate(today);
    setEndDate(today);

    setAttemptsAllowed(1);
    setShuffleQuestions(false);
    setRandomizeOptions(false);
    setAsType('mcq');
    setStatus('draft');
    setNegativeMarking(false);
    setNegativeMarksValue(25);
    setQuestions([]);

    // reset single q
    resetSingleQuestionFields();
  };

  const resetSingleQuestionFields = () => {
    setCurrentQText('');
    setCurrentQType('mcq');
    setCurrentQMarks(5);
    setCurrentQRequired(true);
    setCurrentQExplanation('');
    setCurrentQOptions(['Option A', 'Option B', 'Option C', 'Option D']);
    setCurrentQCorrectIndex('0');
    setCurrentQCorrectIndices(['0']);

    // Reset coding states
    setCodingDifficulty('Easy');
    setCodingTimeLimit(1000);
    setCodingMemoryLimit(256);
    setCodingLanguagesAllowed(['javascript', 'python']);
    setCodingTagsText('');
    setCodingConstraints('1 <= N <= 10^5');
    setCodingInputFormat('');
    setCodingOutputFormat('');
    setCodingSampleInput('');
    setCodingSampleOutput('');
    setCodingExplanation('');
    setCodingNotes('');
    setCodingHintsList([]);
    setNewHintText('');
    setCodingTestCasesList([]);
    setNewTcInput('');
    setNewTcExpected('');
    setNewTcWeight(10);
    setNewTcVisibility('public');
    setCodingTemplates({
      javascript: '// Write your javascript solution here\nfunction solve(n) {\n  \n}',
      python: '# Write your python solution here\ndef solve(n):\n    pass',
      java: '// Write your java solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}',
      cpp: '// Write your C++ solution here\n#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}'
    });
  };

  // Open Create Mode
  const handleOpenCreate = () => {
    resetForm();
    setActiveTab('create');
  };

  // Open Edit Mode
  const handleOpenEdit = (as) => {
    setEditingAssessmentId(as.id);
    setTitle(as.title);
    setDescription(as.description);
    setInstructions(as.instructions);
    setSelectedBatches(as.batches);
    setDifficulty(as.difficulty);
    setDuration(as.duration);
    setPassingMarks(as.passingMarks);
    setStartDate(as.startDate);
    setStartTime(as.startTime);
    setEndDate(as.endDate);
    setEndTime(as.endTime);
    setAttemptsAllowed(as.attemptsAllowed);
    setShuffleQuestions(as.shuffleQuestions);
    setRandomizeOptions(as.randomizeOptions);
    setAsType(as.type);
    setStatus(as.status === 'archived' ? 'draft' : as.status);
    setNegativeMarking(as.negativeMarking || false);
    setNegativeMarksValue(as.negativeMarksValue || 25);
    setQuestions(as.questions);

    setActiveTab('edit');
  };

  React.useEffect(() => {
    if (location.state?.editAssessmentId) {
      const assessmentToEdit = assessments.find(a => a.id === location.state.editAssessmentId);
      if (assessmentToEdit) {
        handleOpenEdit(assessmentToEdit);
      }
      // Clear the state so it doesn't re-trigger on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, assessments, navigate]);

  // Question adding
  const handleAddQuestionToDraft = () => {
    if (!currentQText.trim()) {
      toast.add('Please enter question description', 'warning');
      return;
    }

    if (currentQType === 'coding' && codingTestCasesList.length === 0) {
      toast.add('Please add at least one test case for the coding question.', 'warning');
      return;
    }

    const calculatedMarks = currentQType === 'coding' ?
    codingTestCasesList.reduce((sum, tc) => sum + tc.weight, 0) :
    currentQMarks;

    const newQ = {
      id: `Q-${Date.now()}`,
      type: currentQType,
      question: currentQText.trim(),
      marks: calculatedMarks,
      required: currentQRequired,
      explanation: currentQExplanation.trim()
    };

    if (currentQType === 'mcq' || currentQType === 'true_false') {
      newQ.options = currentQOptions.filter((o) => o.trim() !== '');
      newQ.correctAnswer = currentQCorrectIndex;
    } else if (currentQType === 'multi_select') {
      newQ.options = currentQOptions.filter((o) => o.trim() !== '');
      newQ.correctAnswer = currentQCorrectIndices;
    } else if (currentQType === 'coding') {
      newQ.correctAnswer = '';
      newQ.codingDifficulty = codingDifficulty;
      newQ.codingTimeLimit = codingTimeLimit;
      newQ.codingMemoryLimit = codingMemoryLimit;
      newQ.codingLanguagesAllowed = codingLanguagesAllowed;
      newQ.codingTags = codingTagsText.split(',').map((t) => t.trim()).filter(Boolean);
      newQ.codingConstraints = codingConstraints;
      newQ.codingInputFormat = codingInputFormat;
      newQ.codingOutputFormat = codingOutputFormat;
      newQ.codingSampleInput = codingSampleInput;
      newQ.codingSampleOutput = codingSampleOutput;
      newQ.codingExplanation = codingExplanation.trim() || currentQText.trim();
      newQ.codingNotes = codingNotes;
      newQ.codingHints = codingHintsList;
      newQ.codingTemplates = codingTemplates;
      newQ.codingTestCases = codingTestCasesList;
    } else {
      newQ.correctAnswer = '';
    }

    setQuestions((prev) => [...prev, newQ]);
    resetSingleQuestionFields();
    toast.add('Question appended successfully!', 'success');
  };

  const handleDeleteQuestionFromDraft = (qId) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
    toast.add('Question removed', 'info');
  };

  const handleDuplicateQuestionInDraft = (q) => {
    const dup = {
      ...q,
      id: `Q-${Date.now()}-${Math.random()}`,
      question: `${q.question} (Copy)`
    };
    setQuestions((prev) => [...prev, dup]);
    toast.add('Question duplicated', 'success');
  };

  const handleOptionChange = (idx, val) => {
    const updated = [...currentQOptions];
    updated[idx] = val;
    setCurrentQOptions(updated);
  };

  const addOptionField = () => {
    setCurrentQOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
  };

  const removeOptionField = (idx) => {
    if (currentQOptions.length <= 2) {
      toast.add('At least two options are required', 'warning');
      return;
    }
    setCurrentQOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleMultiCorrectIndex = (idxStr) => {
    setCurrentQCorrectIndices((prev) =>
    prev.includes(idxStr) ?
    prev.filter((i) => i !== idxStr) :
    [...prev, idxStr]
    );
  };

  // Submit full form
  const handleSaveAssessment = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.add('Please supply assessment title', 'warning');
      return;
    }
    if (selectedBatches.length === 0) {
      toast.add('Please assign to at least one batch', 'warning');
      return;
    }
    if (questions.length === 0) {
      toast.add('Please add at least one question to the assessment', 'warning');
      return;
    }

    const calculatedTotalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    const assessmentPayload = {
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      batches: selectedBatches,
      difficulty,
      marks: calculatedTotalMarks,
      passingMarks: Math.min(passingMarks, calculatedTotalMarks),
      duration,
      startDate,
      startTime,
      endDate,
      endTime,
      attemptsAllowed,
      shuffleQuestions,
      randomizeOptions,
      autoGrade: asType === 'mcq' || asType === 'true_false' || asType === 'multi_select',
      manualGrade: asType === 'short_answer' || asType === 'file_upload' || asType === 'assignment' || asType === 'mixed',
      status,
      negativeMarking,
      negativeMarksValue,
      type: asType,
      questions,
      createdBy: 'T1' // fallback trainer
    };

    if (activeTab === 'create') {
      createAssessment(assessmentPayload);
      toast.add(`Assessment "${title}" created successfully!`, 'success');
    } else if (activeTab === 'edit' && editingAssessmentId) {
      editAssessment(editingAssessmentId, assessmentPayload);
      toast.add(`Assessment updated!`, 'success');
    }

    setActiveTab('list');
    resetForm();
  };

  // Duplicate assessment action
  const handleDuplicate = (e, id, label) => {
    e.stopPropagation();
    duplicateAssessment(id);
    toast.add(`Duplicated "${label}". Copy is set to Draft.`, 'success');
  };

  // Delete assessment
  const handleDelete = (e, id, label) => {
    e.stopPropagation();
    if (confirm(`Delete assessment "${label}"? This will delete all associated student submissions!`)) {
      deleteAssessment(id);
      toast.add(`Deleted "${label}".`, 'error');
    }
  };

  const handlePublishNow = (e, id, label) => {
    e.stopPropagation();
    publishAssessment(id);
    toast.add(`Published "${label}" successfully! Assigned batches notified.`, 'success');
  };

  const filteredAssessments = useMemo(() => {
    let result = [...assessments]; // copy to allow sorting
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(q) || a.type.toLowerCase().includes(q));
    }
    
    if (statusFilter !== 'All') {
      result = result.filter(a => a.status === statusFilter);
    } else {
      result = result.filter(a => a.status !== 'archived'); // Hide archived by default
    }
    
    if (typeFilter !== 'All') {
      result = result.filter(a => a.type === typeFilter);
    }
    
    if (difficultyFilter !== 'All') {
      result = result.filter(a => a.difficulty === difficultyFilter);
    }
    
    // Sort logic
    result.sort((a, b) => {
      // Assuming IDs are generated chronologically or we use a date property if one existed.
      // Since dummy data IDs might be standard, we'll sort based on ID alphabetically as fallback or by marks for testing.
      if (sortBy === 'Newest') return b.id.localeCompare(a.id);
      if (sortBy === 'Oldest') return a.id.localeCompare(b.id);
      if (sortBy === 'A-Z') return a.title.localeCompare(b.title);
      if (sortBy === 'Z-A') return b.title.localeCompare(a.title);
      return 0;
    });

    return result;
  }, [assessments, searchQuery, statusFilter, typeFilter, difficultyFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setTypeFilter('All');
    setDifficultyFilter('All');
    setSortBy('Newest');
  };

  return (
    <div className="space-y-6">
      
      {/* Header section removed as requested */}

      <AnimatePresence mode="wait">
        {activeTab === 'list' ?
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-4">
          
            {/* Toolbar - Redesigned to match BatchManagement */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4">
              
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[300px] group">
                  <Search className="w-5 h-5 text-neutral-500 absolute left-4 top-3.5 group-focus-within:text-[#6C1D5F] transition-colors" />
                  <input
                    type="text"
                    placeholder="Search assessments by title or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>
                
                {/* Create Assessment Button */}
                <button
                  onClick={handleOpenCreate}
                  className="py-3 px-6 bg-gradient-to-r from-[#6C1D5F] to-[#84117C] hover:from-[#84117C] hover:to-[#4A1E47] text-white rounded-2xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer shrink-0">
                  <Plus className="w-4 h-4" />
                  <span>Create Assessment</span>
                </button>
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
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
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

                <div className="ml-auto flex items-center gap-4">
                  {/* View Toggle */}
                  <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
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

                  <div className="flex items-center gap-2 text-sm text-neutral-400 font-medium">
                    <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-200 font-bold">{filteredAssessments.length}</span> Assessments
                  </div>
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
                  <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
                      <tr className="text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-4 px-6 font-bold">Title & Batches</th>
                      <th className="py-4 px-6 font-bold">Type</th>
                      <th className="py-4 px-6 font-bold">Difficulty</th>
                      <th className="py-4 px-6 font-bold text-right">Marks / Duration</th>
                      <th className="py-4 px-6 font-bold text-center">Status</th>
                      <th className="py-4 px-6 text-right pr-6 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 bg-white dark:bg-neutral-900">
                    {filteredAssessments.length === 0 ?
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-neutral-500 dark:text-neutral-400 font-medium bg-neutral-50/50 dark:bg-neutral-900/50">
                          No assessments match your filters.
                        </td>
                      </tr> :

                      filteredAssessments.map((as) => {
                        const batchNames = as.batches.map((bId) => batches.find((b) => b.id === bId)?.name || bId).join(', ');

                        const statusColor = {
                          published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                          draft: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                          archived: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                        }[as.status];

                        const difficultyColor = {
                          Easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50',
                          Medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50',
                          Hard: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50'
                        }[as.difficulty];

                        return (
                          <tr 
                            key={as.id} 
                            onClick={() => navigate(`/assessment-builder/${as.id}`)}
                            className="even:bg-neutral-50/50 dark:even:bg-neutral-800/20 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                          >
                            <td className="py-4 px-6">
                              <div className="font-bold text-neutral-900 dark:text-white truncate max-w-[250px]">{as.title}</div>
                              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 truncate max-w-[250px]">
                                {batchNames ? `Assigned to: ${batchNames}` : 'Not assigned'}
                              </div>
                            </td>
                            <td className="py-4 px-6 capitalize font-semibold text-neutral-600 dark:text-neutral-300">
                              {as.type.replace('_', ' ')}
                            </td>
                            <td className="py-4 px-6">
                               <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${difficultyColor}`}>
                                  {as.difficulty}
                               </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                               <div className="font-mono font-black text-[#6C1D5F] dark:text-purple-400">{as.marks} pts</div>
                               <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">{as.duration} min</div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm ${statusColor}`}>
                                {as.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right pr-6 shrink-0">
                               <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                                  {as.status === 'draft' &&
                                    <button
                                      onClick={(e) => handlePublishNow(e, as.id, as.title)}
                                      className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                                      title="Publish Now">
                                      <Send className="w-4 h-4" />
                                    </button>
                                  }
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(as); }}
                                    className="p-1.5 text-[#01AC9F] hover:bg-[#01AC9F]/10 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Assessment">
                                    <FileEdit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDuplicate(e, as.id, as.title)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Duplicate">
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(e, as.id, as.title)}
                                    className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAssessments.map((as) => {
                  const batchNames = as.batches.map((bId) => batches.find((b) => b.id === bId)?.name || bId).join(', ');

                  const statusColor = {
                    published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                    draft: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                    archived: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                  }[as.status];

                  const difficultyColor = {
                    Easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50',
                    Medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50',
                    Hard: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50'
                  }[as.difficulty];

                  return (
                    <motion.div
                      key={as.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => navigate(`/assessment-builder/${as.id}`)}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 md:p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group overflow-hidden relative cursor-pointer"
                    >
                      {/* Decorative Background Element */}
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-gradient-to-br from-[#6C1D5F]/5 to-transparent blur-2xl group-hover:bg-[#6C1D5F]/10 transition-colors pointer-events-none" />

                      {/* Header Section */}
                      <div className="flex justify-between items-start gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-black text-sm md:text-base text-neutral-800 dark:text-white leading-tight mb-1 truncate">
                            {as.title}
                          </h3>
                          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate w-full">
                            {batchNames ? `Batches: ${batchNames}` : 'Not assigned'}
                          </div>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border shadow-sm ${statusColor} shrink-0`}>
                          {as.status}
                        </span>
                      </div>

                      {/* Info Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-4 mt-2">
                        <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded text-[10px] font-bold capitalize">
                          {as.type.replace('_', ' ')}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${difficultyColor}`}>
                          {as.difficulty}
                        </span>
                        <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-[#6C1D5F] dark:text-purple-400 rounded text-[10px] font-bold font-mono">
                          {as.marks} pts
                        </span>
                        <span className="px-1.5 py-0.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 rounded text-[10px] font-bold">
                          {as.duration} min
                        </span>
                      </div>

                      <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        {/* Actions Row */}
                        <div className="flex items-center gap-1.5 w-full">
                          {as.status === 'draft' &&
                            <button
                              onClick={(e) => handlePublishNow(e, as.id, as.title)}
                              className="flex-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 border border-emerald-200/50 rounded-lg transition-colors font-bold text-[11px] flex items-center justify-center gap-1"
                            >
                              <Send className="w-3 h-3" /> Publish
                            </button>
                          }
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(as); }}
                            className="flex-1 px-2.5 py-1.5 bg-[#01AC9F]/10 hover:bg-[#01AC9F]/20 text-[#01AC9F] border border-[#01AC9F]/20 rounded-lg transition-colors font-bold text-[11px] flex items-center justify-center gap-1"
                          >
                            <FileEdit className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={(e) => handleDuplicate(e, as.id, as.title)}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 rounded-lg transition-colors border border-blue-200/50 shrink-0"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, as.id, as.title)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-red-200/50 shrink-0"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div> :

          <EnterpriseBuilderLayout key="wizard" onBack={() => setActiveTab('list')} />
        }
      </AnimatePresence>

    </div>);

};
