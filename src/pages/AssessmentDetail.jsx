import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLMS } from '../context/LMSContext';
import { ArrowLeft, Edit, Clock, Star, Users, CheckCircle, FileText, Code2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const AssessmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { assessments, batches } = useLMS();

  const assessment = assessments.find((a) => a.id === id);

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="w-16 h-16 text-neutral-400" />
        <h2 className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">Assessment Not Found</h2>
        <button 
          onClick={() => navigate('/assessment-builder')}
          className="px-6 py-2 bg-[#6C1D5F] text-white rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-transform"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  const batchNames = assessment.batches.map(bId => batches.find(b => b.id === bId)?.name || bId).join(', ');

  const statusColor = {
    published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    draft: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    archived: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
  }[assessment.status];

  const difficultyColor = {
    Easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50',
    Medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50',
    Hard: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50'
  }[assessment.difficulty];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header with Back Button */}
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => navigate('/assessment-builder')}
          className="flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-[#6C1D5F] dark:hover:text-purple-400 transition-colors px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assessments
        </button>
      </div>

      {/* Main Details Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br from-[#6C1D5F]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm ${statusColor}`}>
                {assessment.status}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-bold border ${difficultyColor}`}>
                {assessment.difficulty}
              </span>
            </div>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white font-display mb-2">{assessment.title}</h1>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 max-w-2xl">{assessment.description || "No description provided."}</p>
          </div>
          
          <button 
            onClick={() => {
              navigate('/assessment-builder', { state: { editAssessmentId: assessment.id } }); 
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#4A1E47] hover:bg-[#6C1D5F] text-white rounded-xl font-bold transition-colors shrink-0 shadow-md shadow-[#4A1E47]/20"
          >
            <Edit className="w-4 h-4" /> Edit Assessment
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 text-[#6C1D5F] rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-400">Type</p>
              <p className="font-bold text-neutral-800 dark:text-neutral-200 capitalize">{assessment.type.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-xl">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-400">Total Marks</p>
              <p className="font-bold text-neutral-800 dark:text-neutral-200">{assessment.marks} pts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-400">Duration</p>
              <p className="font-bold text-neutral-800 dark:text-neutral-200">{assessment.duration} min</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-400">Assigned Batches</p>
              <p className="font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[120px]">{batchNames || 'None'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Questions List */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-xl text-neutral-800 dark:text-white flex items-center gap-2">
          Questions ({assessment.questions.length})
        </h3>
        
        {assessment.questions.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center text-neutral-500">
            No questions added to this assessment yet.
          </div>
        ) : (
          assessment.questions.map((q, index) => (
            <div key={q.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2.5 py-0.5 rounded text-xs font-bold">
                      Q{index + 1}
                    </span>
                    <span className="text-xs font-bold text-[#6C1D5F] uppercase tracking-wide">
                      {q.type.replace('_', ' ')}
                    </span>
                    {q.required && <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded">Required</span>}
                  </div>
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-base">{q.question}</h4>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-black font-mono text-[#01AC9F] bg-[#01AC9F]/10 px-3 py-1 rounded-xl">
                    {q.marks} pts
                  </span>
                </div>
              </div>

              {/* Options rendering for MCQ / Multi Select */}
              {(q.type === 'mcq' || q.type === 'true_false' || q.type === 'multi_select') && q.options && (
                <div className="space-y-2 mt-4">
                  {q.options.map((opt, optIdx) => {
                    let isCorrect = false;
                    if (q.type === 'multi_select') {
                      isCorrect = Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIdx.toString());
                    } else {
                      isCorrect = parseInt(q.correctAnswer) === optIdx;
                    }

                    return (
                      <div 
                        key={optIdx} 
                        className={`flex items-center gap-3 p-3 rounded-xl border ${isCorrect ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950'}`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-transparent'}`}>
                          <CheckCircle className="w-3 h-3" />
                        </div>
                        <span className={`text-sm font-medium ${isCorrect ? 'text-emerald-900 dark:text-emerald-300' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Coding Details */}
              {q.type === 'coding' && (
                <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="flex items-center gap-4 text-xs font-bold text-neutral-500">
                    <span className="flex items-center gap-1"><Code2 className="w-4 h-4" /> Languages: {q.codingLanguagesAllowed?.join(', ') || 'Any'}</span>
                    <span>Time: {q.codingTimeLimit}ms</span>
                    <span>Memory: {q.codingMemoryLimit}MB</span>
                  </div>
                  {q.codingTestCases && (
                    <div>
                      <p className="text-xs font-bold text-neutral-500 mb-2">Test Cases ({q.codingTestCases.length})</p>
                      <div className="space-y-2">
                        {q.codingTestCases.map((tc, tcIdx) => (
                          <div key={tcIdx} className="text-xs font-mono bg-white dark:bg-neutral-900 p-2 rounded border border-neutral-200 dark:border-neutral-800 flex justify-between">
                            <span><span className="text-neutral-400">In:</span> {tc.input}</span>
                            <span><span className="text-neutral-400">Out:</span> {tc.output}</span>
                            <span className="text-[#6C1D5F]">{tc.weight}pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {q.explanation && (
                <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-bold">Explanation:</span> {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

