import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Play, Save, Calendar, Copy, Archive, Download, LayoutTemplate, X, Check, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfigPanel } from './ConfigPanel';
import { QuestionBuilderPanel } from './QuestionBuilderPanel';
import { initialAssessments, initialBatches } from '../../data/dummyData';
import { toast } from '../Toast';
import { useLMS } from '../../context/LMSContext';

export const EnterpriseBuilderLayout = ({ onBack }) => {
  const { createAssessment } = useLMS();
  const [saveState, setSaveState] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const [questions, setQuestions] = useState([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    topic: '',
    course: '',
    batch: '',
    type: '',
    difficulty: 'Easy',
    duration: '',
    marks: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    description: '',
    aiCount: 5,
    aiTaxonomy: 'Understanding'
  });

  // Dummy auto-save simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setSaveState('saving');
      setTimeout(() => setSaveState('saved'), 1000);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -mt-6 -mx-6 bg-neutral-100 dark:bg-black overflow-hidden">
      
      {/* Header Removed */}

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative bg-neutral-100 dark:bg-[#050505]">
        <ConfigPanel config={config} setConfig={setConfig} />
        <QuestionBuilderPanel questions={questions} setQuestions={setQuestions} config={config} />
      </main>

      <footer className="h-16 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end px-6 shrink-0 z-20">

        <div className="flex items-center gap-3">
          <button className="px-5 py-2 text-sm font-bold text-white bg-[#6C1D5F] hover:bg-[#84117C] rounded-xl flex items-center gap-2 shadow-sm transition-colors">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={() => {
            const isConfigComplete = config && config.title && config.topic && config.course && config.batch && config.difficulty && config.duration && config.marks;
            if (!isConfigComplete) {
              toast.add('Please fill all mandatory configuration fields before publishing.', 'error');
              return;
            }
            if (questions.length === 0) {
              toast.add('Please add at least one question before publishing.', 'error');
              return;
            }
            setShowPublishModal(true);
          }} className="px-8 py-2 text-sm font-bold text-white bg-[#6C1D5F] hover:bg-[#84117C] rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
            Publish
          </button>
        </div>
      </footer>

      {/* Pre-Publish Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl w-[95%] max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800"
            >
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/10 dark:to-neutral-900 flex justify-between items-center shrink-0">
                <h3 className="font-display font-black text-xl text-neutral-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" /> Pre-Publish Review
                </h3>
                <button onClick={() => setShowPublishModal(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="bg-neutral-50 dark:bg-neutral-950/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-[#6C1D5F]" /> Assessment Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Questions</span><span className="font-mono font-bold text-neutral-900 dark:text-white">{questions.length}</span></div>
                    <div><span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Marks</span><span className="font-mono font-bold text-[#6C1D5F] dark:text-purple-400">{questions.reduce((acc, q) => acc + (q.marks || 0), 0)}</span></div>
                    <div><span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Status</span><span className="font-bold text-amber-600">Draft</span></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-600" /> Questions Preview ({questions.length})
                  </h4>
                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 text-sm">No questions added yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((q, idx) => (
                        <div key={q.id || idx} className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-start gap-3">
                          <div className="w-6 h-6 shrink-0 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-bold text-neutral-500">{idx + 1}</div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{q.text}</p>
                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-neutral-100 dark:bg-neutral-800 text-neutral-500">{q.type.replace('_', ' ')}</span>
                          </div>
                          <div className="shrink-0 text-xs font-bold text-[#6C1D5F]">{q.marks} pts</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end gap-3 shrink-0">
                <button onClick={() => setShowPublishModal(false)} className="px-5 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={() => { 
                  // Save assessment
                  const nowStr = new Date().toISOString().split('T')[0];
                  const newAssessment = {
                    title: config.title,
                    subject: config.course || config.topic,
                    type: config.type === 'Mixed Types (All)' ? 'mixed' : config.type,
                    status: 'published',
                    questions: questions,
                    duration: `${config.duration} mins`,
                    marks: parseInt(config.marks) || questions.reduce((sum, q) => sum + (q.marks || 1), 0),
                    difficulty: config.difficulty || 'Easy',
                    startDate: config.startDate || nowStr,
                    endDate: config.endDate || '2099-12-31',
                    dueDate: config.endDate || '2099-12-31',
                    batches: config.batch ? [config.batch] : [],
                    submissions: 0,
                    averageScore: 0,
                    negativeMarking: config.quickSettings?.negativeMarking || false,
                    negativeMarksValue: config.quickSettings?.negativeMarksValue || 25
                  };
                  createAssessment(newAssessment);
                  
                  toast.add('Assessment published successfully!', 'success');
                  setShowPublishModal(false); 
                  onBack(); 
                }} className="px-6 py-2 text-sm font-bold text-white bg-[#6C1D5F] hover:bg-[#84117C] rounded-xl flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-all">
                  <Check className="w-4 h-4" /> Confirm & Publish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
