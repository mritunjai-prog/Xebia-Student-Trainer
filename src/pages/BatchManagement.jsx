import React, { useState, useMemo, useRef } from 'react';
import { useLMS } from '../context/LMSContext';
import { toast } from '../components/Toast';
import {
  Plus, Edit, Trash2, Users, BookOpen, Check, X, Search,
  Info, Calendar, LayoutGrid, List, Filter, Download,
  RefreshCw, MoreVertical, ChevronDown, ArrowUpDown, Clock, 
  UploadCloud, Link as LinkIcon, Smile, Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const EMOJI_OPTIONS = ['📦', '🚀', '💻', '📊', '🌐', '🧠', '⚡', '🏆', '🎨', '🔥', '🛡️', '⚙️', '📈', '🎓', '🎯', '💡', '🤖', '🧪'];

export const BatchManagement = () => {
  const { batches, students, createBatch, editBatch, deleteBatch, getBatchProgress, currentUser } = useLMS();

  // Toolbar & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  // Unique courses for filter
  const uniqueCourses = useMemo(() => {
    const courses = batches.map(b => b.course).filter(Boolean);
    return [...new Set(courses)];
  }, [batches]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Form fields
  const [batchName, setBatchName] = useState('');
  const [course, setCourse] = useState('');
  
  // Icon Uploader State
  const [iconTab, setIconTab] = useState('emoji'); // 'emoji', 'url', 'upload'
  const [batchIconEmoji, setBatchIconEmoji] = useState('📦');
  const [batchIconUrl, setBatchIconUrl] = useState('');
  const [batchIconUpload, setBatchIconUpload] = useState('');
  
  const [batchStatus, setBatchStatus] = useState('active');
  const [enrolledStudentIds, setEnrolledStudentIds] = useState([]);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Derived / Filtered Data
  const filteredBatches = useMemo(() => {
    let result = batches;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.name.toLowerCase().includes(q) || 
        b.course.toLowerCase().includes(q)
      );
    }

    // Status Filter (Archived completely removed)
    result = result.filter(b => b.status !== 'archived' && b.status !== 'completed');
    if (statusFilter !== 'All') {
      result = result.filter(b => b.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Course Filter
    if (courseFilter !== 'All') {
      result = result.filter(b => b.course === courseFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'Oldest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'A-Z') return a.name.localeCompare(b.name);
      if (sortBy === 'Z-A') return b.name.localeCompare(a.name);
      if (sortBy === 'Students') return b.studentCount - a.studentCount;
      return 0;
    });

    return result;
  }, [batches, searchQuery, statusFilter, courseFilter, sortBy]);


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Strict 100KB limit for local storage
    if (file.size > 100 * 1024) {
      toast.add('Image must be less than 100KB to save in local storage.', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setBatchIconUpload(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const getFinalIcon = () => {
    if (iconTab === 'upload' && batchIconUpload) return batchIconUpload;
    if (iconTab === 'url' && batchIconUrl) return batchIconUrl;
    return batchIconEmoji;
  };

  const setInitialIconState = (iconString) => {
    if (!iconString) {
      setIconTab('emoji');
      setBatchIconEmoji('📦');
      return;
    }
    if (iconString.startsWith('data:image')) {
      setIconTab('upload');
      setBatchIconUpload(iconString);
    } else if (iconString.startsWith('http')) {
      setIconTab('url');
      setBatchIconUrl(iconString);
    } else {
      setIconTab('emoji');
      setBatchIconEmoji(iconString);
    }
  };

  const handleOpenCreateModal = () => {
    setBatchName('');
    setCourse('');
    setBatchIconEmoji('📦');
    setBatchIconUrl('');
    setBatchIconUpload('');
    setIconTab('emoji');
    setBatchStatus('active');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!batchName.trim() || !course.trim()) {
      toast.add('Please enter all required fields', 'warning');
      return;
    }
    try {
      const finalIcon = getFinalIcon();
      const created = createBatch(batchName.trim(), course.trim(), finalIcon, batchStatus);
      toast.add(`Batch "${created.name}" created successfully!`, 'success');
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.add(error.message, 'error');
    }
  };

  const handleOpenEditModal = (e, batch) => {
    e.stopPropagation(); // prevent navigation
    setSelectedBatch(batch);
    setBatchName(batch.name);
    setCourse(batch.course);
    setInitialIconState(batch.icon);
    setBatchStatus(batch.status || 'active');
    setEnrolledStudentIds(batch.students);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    if (!batchName.trim() || !course.trim()) {
      toast.add('Please enter all required fields', 'warning');
      return;
    }

    const finalIcon = getFinalIcon();
    editBatch(selectedBatch.id, batchName.trim(), course.trim(), enrolledStudentIds, finalIcon, batchStatus);
    toast.add(`Batch "${batchName}" updated successfully!`, 'success');
    setIsEditModalOpen(false);
  };

  const handleDeleteClick = (e, batchId, name) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to permanently delete batch "${name}"? This will detach all students.`)) {
      deleteBatch(batchId);
      toast.add(`Batch "${name}" deleted.`, 'info');
    }
  };

  const handleToggleStatus = (e, batch) => {
    e.stopPropagation();
    const newStatus = batch.status === 'active' ? 'inactive' : 'active';
    editBatch(batch.id, batch.name, batch.course, batch.students || [], batch.icon, newStatus);
    toast.add(`Batch marked as ${newStatus === 'active' ? 'Active' : 'Inactive'}`, 'success');
  };

  const toggleStudentEnrollment = (studentId) => {
    setEnrolledStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setCourseFilter('All');
    setSortBy('Newest');
  };

  const renderIconSelector = () => (
    <div className="space-y-4">
      <label className="block font-bold text-neutral-600 dark:text-neutral-300">Batch Icon</label>
      <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
        <button type="button" onClick={() => setIconTab('emoji')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${iconTab === 'emoji' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
          <Smile className="w-4 h-4" /> Emoji
        </button>
        <button type="button" onClick={() => setIconTab('url')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${iconTab === 'url' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
          <LinkIcon className="w-4 h-4" /> URL
        </button>
        <button type="button" onClick={() => setIconTab('upload')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${iconTab === 'upload' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
          <UploadCloud className="w-4 h-4" /> Upload
        </button>
      </div>

      <div className="p-4 bg-neutral-50 dark:bg-neutral-950/50 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-inner flex flex-col items-center justify-center min-h-[140px]">
        {iconTab === 'emoji' && (
          <div className="w-full space-y-3">
            <div className="flex flex-wrap justify-center gap-2">
              {EMOJI_OPTIONS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setBatchIconEmoji(em)}
                  className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${batchIconEmoji === em ? 'bg-purple-100 dark:bg-purple-900/40 ring-2 ring-[#6C1D5F]' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700'}`}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs font-bold text-neutral-500">Custom:</span>
              <input
                type="text"
                value={batchIconEmoji}
                onChange={(e) => setBatchIconEmoji(e.target.value)}
                maxLength={2}
                className="w-12 h-10 text-xl text-center bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] shadow-sm"
              />
            </div>
          </div>
        )}
        {iconTab === 'url' && (
          <div className="w-full space-y-4">
            <input
              type="url"
              value={batchIconUrl}
              onChange={(e) => setBatchIconUrl(e.target.value)}
              placeholder="https://example.com/icon.png"
              className="w-full px-4 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]"
            />
            {batchIconUrl && (
              <img src={batchIconUrl} alt="Preview" className="w-16 h-16 object-cover rounded-2xl mx-auto shadow-md" onError={(e) => e.target.style.display='none'} />
            )}
          </div>
        )}
        {iconTab === 'upload' && (
          <div className="w-full text-center flex flex-col items-center gap-3">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-sm font-bold shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2">
              <UploadCloud className="w-4 h-4" /> Browse File (Max 100KB)
            </button>
            {batchIconUpload && (
              <img src={batchIconUpload} alt="Preview" className="w-16 h-16 object-cover rounded-2xl shadow-md" />
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderIcon = (icon) => {
    if (!icon) return <span className="text-2xl">📦</span>;
    if (icon.startsWith('http') || icon.startsWith('data:image') || icon.startsWith('www.') || icon.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i)) {
      const imgSrc = icon.startsWith('www.') ? `https://${icon}` : icon;
      return <img src={imgSrc} alt="" className="w-full h-full object-contain rounded-xl p-1" />;
    }
    return <span className="text-2xl">{icon}</span>;
  };

  return (
    <div className="space-y-6 w-full relative">
        
        {/* Advanced Toolbar */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
            
            {/* Search */}
            <div className="relative flex-1 w-full group">
              <Search className="w-5 h-5 text-neutral-500 absolute left-4 top-3.5 group-focus-within:text-[#6C1D5F] transition-colors" />
              <input
                type="text"
                placeholder="Search batches, courses, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] focus:border-transparent transition-all shadow-sm"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleOpenCreateModal}
                className="py-2.5 px-5 bg-gradient-to-r from-[#6C1D5F] to-[#84117C] hover:from-[#84117C] hover:to-[#4A1E47] text-white rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>New Batch</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-brand-border/40 dark:border-neutral-800 mt-2">

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
              <option value="Inactive">Inactive</option>
            </select>

            <select 
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] cursor-pointer shadow-sm min-w-[150px] max-w-[200px]"
            >
              <option value="All">Course: All</option>
              {uniqueCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
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
              <option value="Students">Sort: Most Students</option>
            </select>

            {(searchQuery || statusFilter !== 'All' || courseFilter !== 'All' || sortBy !== 'Newest') && (
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
                <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-200 font-bold">{filteredBatches.length}</span> Batches Found
              </div>
            </div>
          </div>
        </div>

        {/* Content Display */}
        {filteredBatches.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-brand-border/60 dark:border-neutral-700/60 rounded-3xl p-16 text-center text-neutral-500 shadow-sm flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-full">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <div>
              <p className="font-bold text-lg text-neutral-700 dark:text-neutral-300">No batches found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters to find what you're looking for.</p>
            </div>
            <button onClick={handleClearFilters} className="mt-2 text-sm font-bold text-[#6C1D5F] hover:underline cursor-pointer">
              Clear all filters
            </button>
          </div>
        ) : (
          viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBatches.map((batch) => {
                const progress = getBatchProgress(batch.id);
                return (
                  <div
                    key={batch.id}
                    onClick={() => navigate(`/batches/${encodeURIComponent(batch.name)}`)}
                    className="relative group p-4 pt-8 bg-white dark:bg-neutral-900 border transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 rounded-xl border-neutral-200 dark:border-neutral-800 shadow-sm cursor-pointer overflow-hidden"
                  >
                    {/* Absolute Status Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`inline-block px-2 py-0.5 font-bold rounded-md text-[9px] uppercase font-mono shadow-sm ${
                        batch.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' 
                          : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                      }`}>
                        {batch.status}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-start gap-3 mt-2 pr-16">
                        <div className="w-10 h-10 shrink-0 bg-purple-50 dark:bg-purple-950/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 shadow-sm text-sm">
                          {renderIcon(batch.icon)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display font-black text-sm md:text-base text-neutral-900 dark:text-white leading-tight truncate">
                            {batch.name}
                          </h3>
                          <div className="mt-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400 truncate">
                            {batch.course}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-[10px] text-neutral-600 dark:text-neutral-400">
                        <span className="flex items-center gap-1 font-bold"><Users className="w-3.5 h-3.5 text-[#01AC9F]" /> {batch.studentCount} Enrolled</span>
                        <span className="flex items-center gap-1 font-semibold"><Calendar className="w-3.5 h-3.5 text-neutral-500" /> {batch.createdAt}</span>
                      </div>
                    </div>

                    {/* Footer Actions & Progress */}
                    <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800/60">
                      
                      {/* Real Progress */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-2">
                          <span className="font-bold text-neutral-700 dark:text-neutral-300">Course Progress</span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[#6C1D5F] dark:text-purple-400 font-mono">{progress}%</span>
                            <div className="relative group/menu" onClick={e => e.stopPropagation()}>
                              <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              <div className="absolute right-0 bottom-full mb-1 w-36 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 py-1">
                                <button onClick={(e) => handleToggleStatus(e, batch)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer">
                                  {batch.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
                                </button>
                                <button onClick={(e) => handleOpenEditModal(e, batch)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer">
                                  Edit Batch
                                </button>
                                <div className="my-1 border-t border-neutral-100 dark:border-neutral-700"></div>
                                <button onClick={(e) => handleDeleteClick(e, batch.id, batch.name)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 cursor-pointer">
                                  Delete Batch
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-[#6C1D5F] to-[#84117C] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white dark:bg-neutral-900 border border-brand-border/60 dark:border-neutral-700/60 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <div className="overflow-x-auto w-full"><table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                  <thead className="bg-neutral-50/50 dark:bg-neutral-950/30 border-b border-brand-border/60 dark:border-neutral-700/60 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    <tr>
                      <th className="px-6 py-4">Batch Name</th>
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Students</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40 dark:divide-neutral-800">
                    {filteredBatches.map((batch) => {
                      const progress = getBatchProgress(batch.id);
                      return (
                      <tr 
                        key={batch.id} 
                        className={`group hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors cursor-pointer`}
                        onClick={() => navigate(`/batches/${encodeURIComponent(batch.name)}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-neutral-800 dark:text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                              {renderIcon(batch.icon)}
                            </div>
                            {batch.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-neutral-600 dark:text-neutral-300">
                          {batch.course}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 font-bold rounded-lg text-[10px] uppercase font-mono ${
                            batch.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' 
                              : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                          }`}>
                            {batch.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Users className="w-4 h-4 text-[#01AC9F]" /> {batch.studentCount}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 w-32">
                             <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
                               <div className="bg-gradient-to-r from-[#6C1D5F] to-[#84117C] h-full rounded-full" style={{ width: `${progress}%` }}></div>
                             </div>
                             <span className="font-mono font-bold text-[#6C1D5F] text-xs">{progress}%</span>
                           </div>
                        </td>
                        <td className="py-4 px-6 text-right pr-6 shrink-0" onClick={(e) => e.stopPropagation()}>
                           <div className="flex items-center justify-end gap-1 transition-opacity">
                              <button
                                onClick={(e) => handleToggleStatus(e, batch)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${batch.status === 'active' ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950/40' : 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/40'}`}
                                title="Toggle Status"
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleOpenEditModal(e, batch)}
                                className="p-1.5 text-[#01AC9F] hover:bg-[#01AC9F]/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit Batch"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(e, batch.id, batch.name)}
                                className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Delete Batch"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table></div>
              </div>
            </div>
          )
        )}

      {/* CREATE BATCH MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg p-8 relative z-10 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="font-display font-extrabold text-2xl text-neutral-800 dark:text-white">Create New Batch</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-bold text-neutral-600 dark:text-neutral-300">Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="e.g. Batch-2026K"
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white transition-all shadow-inner font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-bold text-neutral-600 dark:text-neutral-300">Status</label>
                    <select
                      value={batchStatus}
                      onChange={(e) => setBatchStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white transition-all shadow-inner font-bold cursor-pointer"
                    >
                      <option value="active">🟢 Active</option>
                      <option value="inactive">🔴 Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-neutral-600 dark:text-neutral-300">Course / Core Focus <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. Advanced Cybersecurity Audits"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white transition-all shadow-inner font-semibold"
                  />
                </div>

                {renderIconSelector()}

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-[#6C1D5F] to-[#84117C] hover:from-[#84117C] hover:to-[#4A1E47] text-white font-extrabold rounded-xl shadow-lg cursor-pointer transition-all hover:-translate-y-1 text-base flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Establish Batch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT BATCH MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl p-8 relative z-10 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="font-display font-extrabold text-2xl text-neutral-800 dark:text-white flex items-center gap-3">
                  <Edit className="w-6 h-6 text-[#01AC9F]" /> Configure Batch
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6 text-sm">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block font-bold text-neutral-600 dark:text-neutral-300">Title <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={batchName}
                          onChange={(e) => setBatchName(e.target.value)}
                          className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01AC9F] dark:text-white transition-all shadow-inner font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block font-bold text-neutral-600 dark:text-neutral-300">Status</label>
                        <select
                          value={batchStatus}
                          onChange={(e) => setBatchStatus(e.target.value)}
                          className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01AC9F] dark:text-white transition-all shadow-inner font-bold cursor-pointer"
                        >
                          <option value="active">🟢 Active</option>
                          <option value="inactive">🔴 Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-bold text-neutral-600 dark:text-neutral-300">Course / Core Focus <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01AC9F] dark:text-white transition-all shadow-inner font-semibold"
                      />
                    </div>

                    {renderIconSelector()}
                  </div>

                  {/* Right Column (Students) */}
                  <div className="space-y-2 flex flex-col h-full">
                    <label className="block font-bold text-neutral-600 dark:text-neutral-300 flex justify-between items-end pb-1 border-b border-neutral-200 dark:border-neutral-700">
                      <span>Enroll Students</span>
                      <span className="text-xs bg-[#01AC9F]/10 text-[#01AC9F] px-2.5 py-1 rounded-lg font-black">{enrolledStudentIds.length} Selected</span>
                    </label>
                    
                    <div className="flex-1 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-2xl divide-y divide-neutral-100 dark:divide-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 p-2 space-y-1 custom-scrollbar shadow-inner min-h-[300px]">
                      {students.map((student) => {
                        const isChecked = enrolledStudentIds.includes(student.id);
                        return (
                          <div
                            key={student.id}
                            onClick={() => toggleStudentEnrollment(student.id)}
                            className={`p-2.5 flex items-center justify-between rounded-xl cursor-pointer transition-all ${isChecked ? 'bg-white dark:bg-neutral-800 shadow-md border border-neutral-200 dark:border-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-transparent'}`}
                          >
                            <div className="flex items-center gap-3 max-w-[80%]">
                              <img src={student.avatar} alt="" className="w-9 h-9 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm" />
                              <div className="truncate">
                                <p className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{student.name}</p>
                                <p className="text-[10px] text-neutral-400 truncate font-semibold">{student.email}</p>
                              </div>
                            </div>
                            
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shadow-sm ${isChecked ? 'bg-[#01AC9F] border-[#01AC9F] text-white' : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'}`}>
                              {isChecked && <Check className="w-4 h-4 font-black" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-[#01AC9F] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold rounded-xl shadow-lg cursor-pointer transition-all hover:-translate-y-1 text-base flex justify-center items-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Save Configuration
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

