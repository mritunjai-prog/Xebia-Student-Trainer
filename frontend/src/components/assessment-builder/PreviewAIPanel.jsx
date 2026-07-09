import React, { useState } from 'react';
import { Monitor, Tablet, Smartphone, UserCheck, Bot, CheckSquare, Layers } from 'lucide-react';
import { motion } from 'motion/react';

export const PreviewAIPanel = ({ questions = [] }) => {
  const [device, setDevice] = useState('desktop');
  const [evalMode, setEvalMode] = useState('hybrid');

  return (
    <div className="w-[320px] shrink-0 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col h-full">
      
      {/* Header Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-2 gap-2 sticky top-0">
        <div className="flex-1 py-2 px-3 bg-white dark:bg-neutral-900 rounded-xl shadow-sm text-xs font-bold text-[#6C1D5F] dark:text-purple-400 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" /> Live Preview
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Device Simulator Controls */}
        <div className="flex justify-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
          {[
            { id: 'desktop', icon: Monitor, label: 'Desktop' },
            { id: 'tablet', icon: Tablet, label: 'Tablet' },
            { id: 'mobile', icon: Smartphone, label: 'Mobile' },
            { id: 'student', icon: UserCheck, label: 'Student View' }
          ].map(d => (
            <button 
              key={d.id}
              onClick={() => setDevice(d.id)}
              title={d.label}
              className={`flex-1 flex justify-center p-2 rounded-lg transition-colors ${device === d.id ? 'bg-white dark:bg-neutral-900 shadow-sm text-[#6C1D5F]' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              <d.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Live Preview Pane Placeholder */}
        <div className="flex flex-col items-center">
          <div className={`transition-all duration-300 border-2 border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden bg-neutral-50 dark:bg-[#0a0a0a] shadow-inner relative flex flex-col ${device === 'mobile' ? 'w-[280px] h-[550px]' : device === 'tablet' ? 'w-[360px] h-[550px]' : 'w-full h-[350px]'}`}>
            
            {/* Fake Browser Chrome */}
            <div className="h-8 bg-neutral-200/50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-3 gap-1.5 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>

            {/* Simulated Content */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {questions.length === 0 ? (
                <>
                  <div className="w-3/4 h-6 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
                  <div className="w-full h-20 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                  
                  <div className="space-y-2 pt-4">
                    <div className="w-1/2 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                    <div className="w-full h-10 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700" />
                    <div className="w-full h-10 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700" />
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={q.id || idx} className="space-y-3">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {idx + 1}. {q.text}
                      </p>
                      
                      {(q.type === 'mcq' || q.type === 'true_false') && q.options && (
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-600 dark:text-neutral-300">
                              <input type="radio" disabled className="w-3 h-3" />
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'multiple_select' && q.options && (
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-600 dark:text-neutral-300">
                              <input type="checkbox" disabled className="w-3 h-3 rounded" />
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'short_answer' && (
                        <div className="w-full h-10 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800" />
                      )}
                      
                      {q.type === 'paragraph' && (
                        <div className="w-full h-24 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800" />
                      )}

                      {q.type === 'file_upload' && (
                        <div className="w-full h-20 bg-white dark:bg-neutral-900 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center gap-1">
                          <span className="text-xs text-neutral-400 font-bold">Upload File</span>
                        </div>
                      )}

                      {q.type === 'coding' && (
                        <div className="w-full h-32 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center justify-center">
                          <code className="text-xs text-neutral-600">Code Editor</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 pointer-events-none" />
          </div>
          <p className="text-[10px] text-neutral-400 mt-3 font-bold uppercase tracking-wider text-center">Live Preview updates as you type</p>
        </div>



      </div>
    </div>
  );
};
