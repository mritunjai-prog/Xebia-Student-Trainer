import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLMS } from '../context/LMSContext';
import { toast } from '../components/Toast';
import { ArrowLeft, Users, Calendar, LayoutTemplate, BookOpen, Clock, FileText, CheckCircle, Edit, Trash2, Power, MoreVertical, Plus, X, Search, Smile, LinkIcon, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { batches, students, assessments, getBatchProgress, editBatch, deleteBatch } = useLMS();
  
  const [isAddStudentsModalOpen, setIsAddStudentsModalOpen] = useState(false);
  const [tempStudentIds, setTempStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Icon State
  const [iconTab, setIconTab] = useState('emoji');
  const [batchIconEmoji, setBatchIconEmoji] = useState('📦');
  const [batchIconUrl, setBatchIconUrl] = useState('');
  const [batchIconUpload, setBatchIconUpload] = useState(null);
  
  const EMOJI_OPTIONS = ['📦', '🚀', '🔥', '⭐', '💻', '📈', '🎓', '🎨'];

  const batch = useMemo(() => batches.find((b) => b.name === decodeURIComponent(id)), [batches, id]);

  // Pre-calculate stats
  const enrolledStudents = useMemo(() => {
    return (batch?.students || []).map(sId => students.find(s => s.id === sId)).filter(Boolean);
  }, [batch?.students, students]);

  const avgScore = useMemo(() => {
    if (enrolledStudents.length === 0) return 0;
    const total = enrolledStudents.reduce((sum, s) => sum + (s.averageScore || 0), 0);
    return Math.round(total / enrolledStudents.length);
  }, [enrolledStudents]);

  const assignedAssessments = useMemo(() => {
    return assessments.filter(a => a.batches && a.batches.includes(batch?.id));
  }, [assessments, batch?.id]);

  const progress = batch ? getBatchProgress(batch.id) : 0;

  const renderIcon = (icon) => {
    if (!icon) return <span className="text-4xl">📦</span>;
    if (icon.startsWith('http') || icon.startsWith('data:image') || icon.startsWith('www.') || icon.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i)) {
      const imgSrc = icon.startsWith('www.') ? `https://${icon}` : icon;
      return <img src={imgSrc} alt="" className="w-full h-full object-contain rounded-[28px] p-2" />;
    }
    return <span className="text-4xl">{icon}</span>;
  };

  const handleToggleStatus = () => {
    editBatch(batch.id, batch.name, batch.course, batch.students || [], batch.icon, batch.status === 'active' ? 'inactive' : 'active');
    toast.add(`Batch marked as ${batch.status === 'active' ? 'Inactive' : 'Active'}`, 'success');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${batch.name}?`)) {
      navigate('/batches');
      setTimeout(() => {
        deleteBatch(batch.id);
        toast.add('Batch deleted', 'error');
      }, 0);
    }
  };

  const handleOpenAddStudents = () => {
    setTempStudentIds([...(batch.students || [])]);
    setStudentSearch('');
    setIsAddStudentsModalOpen(true);
  };

  const toggleStudent = (sId) => {
    setTempStudentIds((prev) => 
      prev.includes(sId) ? prev.filter(id => id !== sId) : [...prev, sId]
    );
  };

  const handleSaveStudents = () => {
    editBatch(batch.id, batch.name, batch.course, tempStudentIds, batch.icon, batch.status);
    toast.add('Students updated successfully!', 'success');
    setIsAddStudentsModalOpen(false);
  };

  const handleSelectAll = () => {
    if (!studentSearch) {
      if (tempStudentIds.length === students.length) {
        setTempStudentIds([]);
      } else {
        setTempStudentIds(students.map(s => s.id));
      }
    } else {
      const filteredIds = students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase())).map(s => s.id);
      
      const areAllFilteredSelected = filteredIds.every(id => tempStudentIds.includes(id));
      
      if (areAllFilteredSelected && filteredIds.length > 0) {
        // Remove filtered from temp
        setTempStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
      } else {
        // Add filtered to temp
        setTempStudentIds(prev => {
          const newIds = [...prev];
          filteredIds.forEach(id => {
            if (!newIds.includes(id)) newIds.push(id);
          });
          return newIds;
        });
      }
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    return students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase()));
  }, [students, studentSearch]);

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

  const getFinalIcon = () => {
    if (iconTab === 'upload' && batchIconUpload) return batchIconUpload;
    if (iconTab === 'url' && batchIconUrl) return batchIconUrl;
    return batchIconEmoji;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024) {
      toast.add('Image must be less than 100KB to save in local storage.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setBatchIconUpload(event.target.result);
    reader.readAsDataURL(file);
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
              <input type="text" value={batchIconEmoji} onChange={(e) => setBatchIconEmoji(e.target.value)} maxLength={2} className="w-12 h-10 text-xl text-center bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] shadow-sm" />
            </div>
          </div>
        )}
        {iconTab === 'url' && (
          <div className="w-full space-y-3">
            <input type="url" placeholder="https://example.com/icon.png" value={batchIconUrl} onChange={(e) => setBatchIconUrl(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white" />
            {batchIconUrl && <img src={batchIconUrl} alt="Preview" className="w-16 h-16 mx-auto object-cover rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 mt-2 bg-white" onError={(e) => e.target.style.display='none'} />}
          </div>
        )}
        {iconTab === 'upload' && (
          <div className="w-full space-y-3 flex flex-col items-center">
            <label className="cursor-pointer bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-[#6C1D5F] dark:hover:border-[#6C1D5F] px-4 py-3 rounded-xl flex items-center gap-2 transition-colors text-sm font-bold text-neutral-700 dark:text-neutral-300 w-full justify-center">
              <UploadCloud className="w-5 h-5 text-[#01AC9F]" /> Choose Image (Max 100KB)
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            {batchIconUpload && <img src={batchIconUpload} alt="Preview" className="w-16 h-16 object-cover rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 bg-white" />}
          </div>
        )}
      </div>
    </div>
  );

  const handleOpenEdit = () => {
    setEditName(batch.name);
    setEditCourse(batch.course);
    setEditStatus(batch.status);
    setInitialIconState(batch.icon);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editCourse.trim()) {
      toast.add('Please enter all required fields', 'warning');
      return;
    }
    
    // Check duplicate name ONLY if the name changed
    if (editName.trim().toLowerCase() !== batch.name.toLowerCase()) {
      if (batches.some(b => b.name.toLowerCase() === editName.trim().toLowerCase())) {
        toast.add(`A batch with the name "${editName}" already exists.`, 'error');
        return;
      }
    }

    const finalIcon = getFinalIcon();
    editBatch(batch.id, editName.trim(), editCourse.trim(), batch.students || [], finalIcon, editStatus);
    toast.add('Batch updated successfully!', 'success');
    setIsEditModalOpen(false);
    
    // If name changed, we need to navigate to the new URL to avoid "Batch Not Found"
    if (editName.trim() !== batch.name) {
      navigate(`/batches/${encodeURIComponent(editName.trim())}`);
    }
  };

  if (!batch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-500">
        <h2 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">Batch Not Found</h2>
        <button 
          onClick={() => navigate('/batches')}
          className="px-4 py-2 bg-[#6C1D5F] hover:bg-[#4A1E47] transition-colors text-white rounded-xl font-bold"
        >
          Back to Batches
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6 pb-10"
    >
      {/* Header Back Navigation */}
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => navigate('/batches')}
          className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-[#6C1D5F] dark:hover:text-[#6C1D5F] transition-colors cursor-pointer font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Batches
        </button>
      </div>

      {/* Main Detail Header Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">
        
        {/* Top Section: Icon, Title & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
          
          {/* Left: Icon and Title Info */}
          <div className="flex items-center gap-5">
            {/* Icon */}
            <div className="w-20 h-20 shrink-0 bg-purple-50 dark:bg-purple-950/30 rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-purple-100 dark:border-purple-900/50 overflow-hidden">
              {renderIcon(batch.icon)}
            </div>

            {/* Title Block */}
            <div className="flex flex-col items-start justify-center h-20">
              {/* Title */}
              <h1 className="font-display font-black text-2xl md:text-3xl text-neutral-900 dark:text-white leading-tight">
                {batch.name}
              </h1>
              
              {/* Course & Badge */}
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" /> {batch.course}
                </p>
                <span className={`inline-block px-2 py-0.5 font-extrabold rounded text-[10px] uppercase font-mono ${
                  batch.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                }`}>
                  {batch.status}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            <button
              onClick={handleToggleStatus}
              className="px-4 py-2 bg-[#6C1D5F] hover:bg-[#4A1E47] text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Power className="w-4 h-4" /> {batch.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
            </button>
            <button
              onClick={handleOpenAddStudents}
              className="px-4 py-2 bg-[#6C1D5F] hover:bg-[#4A1E47] text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Students
            </button>
            <button
              onClick={handleOpenEdit}
              className="px-4 py-2 bg-[#6C1D5F] hover:bg-[#4A1E47] text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
              title="Edit Batch"
            >
              <Edit className="w-4 h-4" /> Edit Batch
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-[#6C1D5F] hover:bg-[#4A1E47] text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
              title="Delete Batch"
            >
              <Trash2 className="w-4 h-4" /> Delete Batch
            </button>
          </div>
        </div>

        {/* Bottom Section: Metadata Row */}
        <div className="w-full bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl p-4 sm:p-5 flex flex-wrap gap-x-12 gap-y-6 items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">Duration</span>
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              {new Date(batch.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - Ongoing
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">Students Enrolled</span>
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 font-mono">{batch.studentCount}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">Assessments</span>
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 font-mono">{assignedAssessments.length}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">Created On</span>
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              {new Date(batch.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Enrolled */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-start gap-4">
          <div className="w-12 h-12 shrink-0 bg-[#01AC9F]/10 text-[#01AC9F] rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-start">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Enrolled</p>
            <p className="text-xl font-black text-neutral-800 dark:text-white font-mono leading-none">
              {batch.studentCount} <span className="text-sm font-bold text-neutral-400 dark:text-neutral-500 font-sans tracking-normal ml-1">Students</span>
            </p>
          </div>
        </div>
        
        {/* KPI: Overall Progress */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-start gap-4">
          <div className="w-12 h-12 shrink-0 bg-purple-100 dark:bg-purple-900/30 text-[#6C1D5F] dark:text-purple-400 rounded-xl flex items-center justify-center">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-start">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Overall Progress</p>
            <p className="text-xl font-black text-neutral-800 dark:text-white font-mono leading-none flex items-baseline gap-1.5">
              {progress}% <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 font-sans tracking-normal hidden sm:inline-block">Average Completion</span>
            </p>
          </div>
        </div>

        {/* KPI: Assessments */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-start gap-4">
          <div className="w-12 h-12 shrink-0 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-start">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Assessments</p>
            <p className="text-xl font-black text-neutral-800 dark:text-white font-mono leading-none">
              {assignedAssessments.length} <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 font-sans tracking-normal hidden sm:inline-block ml-1">Total Created</span>
            </p>
          </div>
        </div>

        {/* KPI: Avg Score */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-start gap-4">
          <div className="w-12 h-12 shrink-0 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-start">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Avg Score</p>
            <p className="text-xl font-black text-neutral-800 dark:text-white font-mono leading-none flex items-baseline gap-1.5">
              {avgScore}% <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 font-sans tracking-normal hidden sm:inline-block">Class Average</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Student Roster */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
              <h2 className="font-display font-extrabold text-xl text-neutral-800 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#01AC9F]" />
                Student Roster
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                  {enrolledStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-neutral-500 font-medium bg-neutral-50/50 dark:bg-neutral-900/30">
                        No students are currently enrolled in this batch.
                      </td>
                    </tr>
                  ) : (
                    enrolledStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={student.avatar} alt="" className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm" referrerPolicy="no-referrer" />
                            <div>
                               <span className="font-bold text-neutral-800 dark:text-white block">{student.name}</span>
                               <span className="text-xs text-neutral-500 font-medium">{student.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                                {student.assessmentsCompleted || 0} / {assignedAssessments.length} Completed
                              </span>
                              <div className="w-24 bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-[#01AC9F] h-full rounded-full" style={{ width: `${assignedAssessments.length ? ((student.assessmentsCompleted || 0) / assignedAssessments.length) * 100 : 0}%` }}></div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono font-black text-[#01AC9F] bg-[#01AC9F]/10 px-2.5 py-1 rounded-lg">
                            {student.averageScore || 0}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Assessments */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
             <h2 className="font-display font-extrabold text-xl text-neutral-800 dark:text-white flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-amber-500" />
                Assigned Assessments
             </h2>
             
             <div className="space-y-3">
                {assignedAssessments.length === 0 ? (
                   <div className="text-center py-8 text-neutral-500 text-sm font-medium bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                      No assessments assigned yet.
                   </div>
                ) : (
                   assignedAssessments.map(asmt => (
                      <div key={asmt.id} className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/assessment-builder/${asmt.id}`)}>
                         <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-neutral-800 dark:text-neutral-200 leading-tight">{asmt.title}</h3>
                            <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-[10px] font-bold uppercase shrink-0">{asmt.status}</span>
                         </div>
                         <div className="flex items-center gap-3 text-xs font-semibold text-neutral-500">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {asmt.duration}m</span>
                            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {asmt.type}</span>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Add Students Modal */}
      <AnimatePresence>
        {isAddStudentsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsAddStudentsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden max-h-[85vh]">
              
              <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <h3 className="text-xl font-black text-neutral-900 dark:text-white">Manage Students</h3>
                  <p className="text-sm font-medium text-neutral-500 mt-1">Select students to enroll in {batch.name}</p>
                </div>
                <button onClick={() => setIsAddStudentsModalOpen(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C1D5F]"
                  />
                </div>
                {filteredStudents.length > 0 && (
                  <label className="flex items-center gap-3 cursor-pointer w-fit group select-none ml-1">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={filteredStudents.length > 0 && filteredStudents.every(s => tempStudentIds.includes(s.id))} 
                        onChange={handleSelectAll} 
                        className="peer sr-only" 
                      />
                      <div className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600 peer-checked:bg-[#01AC9F] peer-checked:border-[#01AC9F] transition-colors flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">Select All {studentSearch ? 'Filtered' : ''}</span>
                  </label>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-10 text-neutral-500 text-sm">No students found.</div>
                ) : (
                  <div className="space-y-1">
                    {filteredStudents.map(student => (
                      <label key={student.id} className="flex items-center gap-4 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700/50 group">
                        <div className="relative flex items-center justify-center">
                          <input type="checkbox" checked={tempStudentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} className="peer sr-only" />
                          <div className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600 peer-checked:bg-[#01AC9F] peer-checked:border-[#01AC9F] transition-colors flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-full bg-[#6C1D5F]/10 text-[#6C1D5F] flex items-center justify-center font-bold text-xs">
                            {student.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{student.name}</p>
                            <p className="text-xs text-neutral-500">{student.email}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-end gap-3">
                <button onClick={() => setIsAddStudentsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveStudents} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#6C1D5F] hover:bg-[#4A1E47] text-white transition-colors flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Save Students ({tempStudentIds.length})
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Batch Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-neutral-900/60 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-8 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="font-display font-extrabold text-2xl text-neutral-800 dark:text-white flex items-center gap-3">
                  <Edit className="w-6 h-6 text-[#6C1D5F]" /> Edit Batch
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-5 text-sm">
                <div className="space-y-2">
                  <label className="block font-bold text-neutral-600 dark:text-neutral-300">Batch Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white transition-all shadow-inner font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-neutral-600 dark:text-neutral-300">Course / Core Focus <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editCourse}
                    onChange={(e) => setEditCourse(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white transition-all shadow-inner font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-neutral-600 dark:text-neutral-300">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C1D5F] dark:text-white transition-all shadow-inner font-bold cursor-pointer"
                  >
                    <option value="active">🟢 Active</option>
                    <option value="inactive">🔴 Inactive</option>
                  </select>
                </div>

                {renderIconSelector()}

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-3 bg-[#6C1D5F] hover:bg-[#4A1E47] text-white font-bold rounded-xl transition-colors shadow-lg">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

