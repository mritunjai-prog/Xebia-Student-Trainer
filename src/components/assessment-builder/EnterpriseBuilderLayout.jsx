import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Play, Save, Calendar, Copy, Archive, Download, LayoutTemplate, X, Check, CheckSquare, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfigPanel } from './ConfigPanel';
import { QuestionBuilderPanel } from './QuestionBuilderPanel';

import { toast } from '../Toast';
import { useLMS } from '../../context/LMSContext';

export const EnterpriseBuilderLayout = ({ onBack, initialAssessment }) => {
  const { createAssessment, editAssessment, batches } = useLMS();
  const [saveState, setSaveState] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const [questions, setQuestions] = useState(initialAssessment?.questions || []);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showConfigMobile, setShowConfigMobile] = useState(false);
  const [isDesktopConfigOpen, setIsDesktopConfigOpen] = useState(true);
  
  const initialCourse = initialAssessment?.batches?.length > 0
    ? batches.find(b => b.id === initialAssessment.batches[0])?.course || ''
    : '';

  const [config, setConfig] = useState({
    title: initialAssessment?.title || '',
    topic: initialAssessment?.topic || '',
    course: initialCourse,
    batches: initialAssessment?.batches || [],
    type: initialAssessment?.type || '',
    difficulty: initialAssessment?.difficulty || 'Easy',
    duration: initialAssessment?.duration ? parseInt(initialAssessment.duration) : '',
    marks: initialAssessment?.marks || '',
    startDate: initialAssessment?.startDate || '',
    startTime: initialAssessment?.startTime || '',
    endDate: initialAssessment?.endDate || '',
    endTime: initialAssessment?.endTime || '',
    description: initialAssessment?.description || '',
    aiCount: 5,
    aiTaxonomy: 'Understanding',
    quickSettings: {
      negativeMarking: initialAssessment?.negativeMarking || false,
      negativeMarksValue: initialAssessment?.negativeMarksValue || 25,
      shuffleQuestions: initialAssessment?.shuffleQuestions || false,
      autoSubmit: initialAssessment?.autoSubmit || false
    },
    scoreReleasePolicy: initialAssessment?.scoreReleasePolicy || 'IMMEDIATE_ON_SUBMISSION'
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
        
        {/* Desktop Config Panel */}
        <AnimatePresence>
          {isDesktopConfigOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="hidden lg:block shrink-0 border-r border-neutral-200 dark:border-neutral-800 h-full overflow-hidden"
            >
              <div className="w-[320px] lg:w-[340px] xl:w-[360px] h-full">
                <ConfigPanel config={config} setConfig={setConfig} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Config Drawer */}
        <AnimatePresence>
          {showConfigMobile && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 0.5 }} 
                exit={{ opacity: 0 }}
                onClick={() => setShowConfigMobile(false)}
                className="fixed inset-0 bg-black z-40 lg:hidden" 
              />
              {/* Drawer */}
              <motion.div 
                initial={{ x: '-100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed inset-y-0 left-0 w-[85%] max-w-[400px] bg-white dark:bg-neutral-900 z-50 lg:hidden shadow-2xl flex flex-col h-full"
              >
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Assessment Details</h3>
                  <button onClick={() => setShowConfigMobile(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
                    <X className="w-5 h-5"/>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                   <ConfigPanel config={config} setConfig={setConfig} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0 h-full flex flex-col">
          <QuestionBuilderPanel 
            questions={questions} 
            setQuestions={setQuestions} 
            config={config} 
            isDesktopConfigOpen={isDesktopConfigOpen}
            setIsDesktopConfigOpen={setIsDesktopConfigOpen}
          />
        </div>
      </main>

      <footer className="h-16 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between lg:justify-end px-4 lg:px-6 shrink-0 z-20">
        
        <button 
          onClick={() => setShowConfigMobile(true)}
          className="lg:hidden px-4 py-2 text-sm font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Settings className="w-4 h-4" /> Config
        </button>

        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              const nowStr = new Date().toISOString().split('T')[0];
              const draftAssessment = {
                title: config.title || 'Untitled Assessment',
                topic: config.topic || '',
                course: config.course || '',
                subject: config.course || config.topic,
                description: config.description || '',
                type: config.type === 'Mixed Types (All)' ? 'mixed' : config.type || 'mcq',
                status: 'DRAFT',
                questions: questions.map(({ id, ...q }) => {
                  return { id: id || `q_${Date.now()}_${Math.random()}`, ...q };
                }),
                duration: parseInt(config.duration) || 0,
                marks: parseInt(config.marks) || questions.reduce((sum, q) => sum + (q.marks || 1), 0),
                difficulty: config.difficulty || 'Easy',
                startDate: config.startDate || nowStr,
                startTime: config.startTime || '',
                endDate: config.endDate || '2099-12-31',
                endTime: config.endTime || '',
                dueDate: config.endDate || '2099-12-31',
                batches: config.batches || [],
                maxAttempts: parseInt(config.maxAttempts) || 1,
                negativeMarking: config.quickSettings?.negativeMarking || false,
                negativeMarksValue: config.quickSettings?.negativeMarksValue || 25,
                shuffleQuestions: config.quickSettings?.shuffleQuestions || false,
                autoSubmit: config.quickSettings?.autoSubmit || false,
                scoreReleasePolicy: config.scoreReleasePolicy || 'IMMEDIATE_ON_SUBMISSION'
              };
              try {
                if (initialAssessment) {
                  await editAssessment(initialAssessment.id, draftAssessment);
                } else {
                  await createAssessment(draftAssessment);
                }
                toast.add('Draft saved successfully!', 'success');
                onBack();
              } catch (err) {
                toast.add('Failed to save draft', 'error');
              }
            }}
            className="px-5 py-2 text-sm font-bold text-neutral-700 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 rounded-xl flex items-center gap-2 shadow-sm transition-colors border border-neutral-200 dark:border-neutral-700"
          >
            <Save className="w-4 h-4" /> Save Draft
          </button>
          
          <button 
            onClick={async () => {
              const nowStr = new Date().toISOString().split('T')[0];
              const unallocatedAssessment = {
                title: config.title || 'Untitled Assessment',
                topic: config.topic || '',
                course: config.course || '',
                subject: config.course || config.topic,
                description: config.description || '',
                type: config.type === 'Mixed Types (All)' ? 'mixed' : config.type || 'mcq',
                status: 'UNALLOCATED',
                questions: questions.map(({ id, ...q }) => {
                  return { id: id || `q_${Date.now()}_${Math.random()}`, ...q };
                }),
                duration: parseInt(config.duration) || 0,
                marks: parseInt(config.marks) || questions.reduce((sum, q) => sum + (q.marks || 1), 0),
                difficulty: config.difficulty || 'Easy',
                startDate: config.startDate || nowStr,
                startTime: config.startTime || '',
                endDate: config.endDate || '2099-12-31',
                endTime: config.endTime || '',
                dueDate: config.endDate || '2099-12-31',
                batches: [],
                maxAttempts: parseInt(config.maxAttempts) || 1,
                negativeMarking: config.quickSettings?.negativeMarking || false,
                negativeMarksValue: config.quickSettings?.negativeMarksValue || 25,
                shuffleQuestions: config.quickSettings?.shuffleQuestions || false,
                autoSubmit: config.quickSettings?.autoSubmit || false,
                scoreReleasePolicy: config.scoreReleasePolicy || 'IMMEDIATE_ON_SUBMISSION'
              };
              try {
                if (initialAssessment) {
                  await editAssessment(initialAssessment.id, unallocatedAssessment);
                } else {
                  await createAssessment(unallocatedAssessment);
                }
                toast.add('Assessment saved as Unallocated!', 'success');
                onBack();
              } catch (err) {
                toast.add('Failed to save assessment', 'error');
              }
            }}
            className="px-5 py-2 text-sm font-bold text-[#6C1D5F] bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 rounded-xl flex items-center gap-2 shadow-sm transition-colors border border-purple-200 dark:border-purple-800"
          >
            <Archive className="w-4 h-4" /> Unallocated
          </button>
          {/* Original Save Draft button replaced above */}
          <button onClick={() => {
            const isConfigComplete = config && config.title && config.topic && config.course && config.difficulty && config.duration && config.marks;
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
                <button onClick={async () => { 
                  // Save assessment
                  const nowStr = new Date().toISOString().split('T')[0];
                  const newAssessment = {
                    title: config.title,
                    topic: config.topic || '',
                    course: config.course || '',
                    subject: config.course || config.topic,
                    description: config.description || '',
                    type: config.type === 'Mixed Types (All)' ? 'mixed' : config.type,
                    status: 'PUBLISHED',
                    questions: questions.map(({ id, ...q }) => {
                      return { id: id || `q_${Date.now()}_${Math.random()}`, ...q };
                    }),
                    duration: parseInt(config.duration) || 0,
                    marks: parseInt(config.marks) || questions.reduce((sum, q) => sum + (q.marks || 1), 0),
                    difficulty: config.difficulty || 'Easy',
                    startDate: config.startDate || nowStr,
                    startTime: config.startTime || '',
                    endDate: config.endDate || '2099-12-31',
                    endTime: config.endTime || '',
                    dueDate: config.endDate || '2099-12-31',
                    batches: config.batches || [],
                    maxAttempts: parseInt(config.maxAttempts) || 1,
                    negativeMarking: config.quickSettings?.negativeMarking || false,
                    negativeMarksValue: config.quickSettings?.negativeMarksValue || 25,
                    shuffleQuestions: config.quickSettings?.shuffleQuestions || false,
                    autoSubmit: config.quickSettings?.autoSubmit || false,
                    scoreReleasePolicy: config.scoreReleasePolicy || 'IMMEDIATE_ON_SUBMISSION'
                  };

                  try {
                    if (!initialAssessment) {
                      newAssessment.submissions = 0;
                      newAssessment.averageScore = 0;
                    }
                    if (initialAssessment) {
                      editAssessment(initialAssessment.id, newAssessment);
                    } else {
                      await createAssessment(newAssessment);
                    }
                    
                    toast.add(initialAssessment ? 'Assessment updated successfully!' : 'Assessment published successfully!', 'success');
                    setShowPublishModal(false); 
                    onBack(); 
                  } catch (err) {
                    toast.add('Failed to publish assessment', 'error');
                  }
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
