import React, { useState, useRef } from 'react';
import { Plus, Wand2, Sparkles, Trash2, Code2, Text, FileText, CheckCircle, Brain, Library, Loader2, ListChecks, GripVertical, Monitor, Tablet, Smartphone, UserCheck, Edit, Upload, Download, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { generateQuestions, parseExcelToQuestions } from '../../utils/aiService';
import { toast } from '../Toast';

export const QuestionBuilderPanel = ({ questions, setQuestions, config, isDesktopConfigOpen, setIsDesktopConfigOpen }) => {
  const [addingManual, setAddingManual] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const fileInputRef = useRef(null);

  // Manual Question Draft State
  const [draftText, setDraftText] = useState('');
  const [draftOptions, setDraftOptions] = useState(['', '', '', '']);
  
  // Enforce configuration completeness
  const isConfigComplete = config && config.title && config.topic && config.batches?.length > 0 && config.type && config.difficulty && config.duration && config.marks;

  // Filter available question types based on config
  const questionTypes = [
    { id: 'mcq', label: 'Single Choice (MCQ)', icon: CheckCircle },
    { id: 'true_false', label: 'True / False', icon: CheckCircle },
    { id: 'multiple_select', label: 'Multiple Choice (Multiple Select)', icon: ListChecks },
    { id: 'short_answer', label: 'Short Answer / Plain text', icon: Text },
    { id: 'paragraph', label: 'Paragraph response', icon: Text },
    { id: 'file_upload', label: 'File Upload submission', icon: FileText },
    { id: 'coding', label: 'Coding Challenge Question', icon: Code2 }
  ];
  
  const availableQuestionTypes = config?.type === 'Mixed Types (All)' || !config?.type 
    ? questionTypes 
    : questionTypes.filter(t => t.id === config.type);


  const handleGenerateQuestions = async () => {
    if (!config?.topic) {
      toast.add('Please enter a topic in the configuration panel first.', 'error');
      return;
    }
    const targetCount = Number(config?.aiCount) || 5;
    const remainingToGenerate = Math.max(0, targetCount - questions.length);
    
    if (remainingToGenerate === 0) {
      toast.add(`You already have ${questions.length} questions. Remove some to generate more.`, 'info');
      return;
    }

    const taxonomy = config?.aiTaxonomy || 'Understanding';
    const type = config?.type || 'mcq';
    
    setIsGeneratingAi(true);
    toast.add(`Generating ${remainingToGenerate} questions...`, 'info');
    try {
      const generated = await generateQuestions(config.topic, remainingToGenerate, taxonomy, type);
      if (generated && generated.length > 0) {
        const perQuestionMarks = Math.max(1, Math.round((Number(config.marks) || targetCount) / (questions.length + generated.length)));
        const mappedQuestions = generated.map(q => ({ ...q, marks: perQuestionMarks }));
        setQuestions([...questions, ...mappedQuestions]);
        toast.add(`Generated ${generated.length} fresh questions successfully!`, 'success');
      } else {
        toast.add('Failed to generate questions. Try a different topic.', 'error');
      }
    } catch (err) {
      toast.add('Error generating questions. Check API key.', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };


  const handleDelete = (index) => {
    const newQs = [...questions];
    newQs.splice(index, 1);
    setQuestions(newQs);
  };

  const handleEdit = (index) => {
    const q = questions[index];
    setDraftText(q.text);
    if (q.options) {
      setDraftOptions(q.options.concat(['', '', '', '']).slice(0, 4));
    }
    setAddingManual(true);
    handleDelete(index);
    setTimeout(() => document.querySelector('.overflow-y-auto')?.scrollTo({top: 0, behavior: 'smooth'}), 100);
  };

  const handleSaveManual = () => {
    if (!draftText.trim()) {
      toast.add('Question text cannot be empty', 'error');
      return;
    }
    const newQuestion = {
      id: `q_manual_${Date.now()}`,
      type: config?.type || 'mcq',
      question: draftText,
      marks: 1,
      options: ['mcq', 'multiple_select', 'true_false'].includes(config?.type) 
        ? draftOptions.filter(o => o.trim() !== '') 
        : undefined,
    };
    setQuestions([...questions, newQuestion]);
    setAddingManual(false);
    setDraftText('');
    setDraftOptions(['', '', '', '']);
    toast.add('Question added successfully', 'success');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsGeneratingAi(true);
        toast.add('Parsing Excel file using AI...', 'info');

        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.add('No data found in the Excel file.', 'error');
          setIsGeneratingAi(false);
          return;
        }

        const parsedQuestions = await parseExcelToQuestions(data);

        setQuestions([...questions, ...parsedQuestions]);
        toast.add(`Successfully imported ${parsedQuestions.length} questions!`, 'success');
      } catch (error) {
        console.error("Excel Parsing Error: ", error);
        toast.add('Failed to parse Excel file. Please ensure it follows the template format.', 'error');
      } finally {
        setIsGeneratingAi(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Type': 'mcq',
        'Question Text': 'What is the capital of France?',
        'Option 1': 'London',
        'Option 2': 'Berlin',
        'Option 3': 'Paris',
        'Option 4': 'Madrid',
        'Correct Answer': 'Paris',
        'Marks': 2
      },
      {
        'Type': 'multiple_select',
        'Question Text': 'Which of these are programming languages?',
        'Option 1': 'Python',
        'Option 2': 'HTML',
        'Option 3': 'Java',
        'Option 4': 'CSS',
        'Correct Answer': 'Python, Java',
        'Marks': 3
      },
      {
        'Type': 'true_false',
        'Question Text': 'The earth is flat.',
        'Option 1': '',
        'Option 2': '',
        'Option 3': '',
        'Option 4': '',
        'Correct Answer': 'False',
        'Marks': 1
      },
      {
        'Type': 'short_answer',
        'Question Text': 'What does CPU stand for?',
        'Option 1': '',
        'Option 2': '',
        'Option 3': '',
        'Option 4': '',
        'Correct Answer': 'Central Processing Unit',
        'Marks': 5
      },
      {
        'Type': 'coding',
        'Problem Description': 'Write a function that returns the sum of a and b.',
        'Starter Code': 'function add(a, b) {\n  \n}',
        'Test Input': '1, 2',
        'Test Output': '3',
        'Marks': 15
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Assessment_Template_Complete.xlsx");
  };

  const handleExportQuestions = () => {
    if (!questions || questions.length === 0) {
      toast.add('No questions to export.', 'info');
      return;
    }

    const exportData = questions.map(q => {
      const row = {
        'Type': q.type || 'mcq',
        'Question Text': q.question || q.text || q.questionText || q['Question Text'] || '',
      };

      if (q.options && Array.isArray(q.options)) {
        q.options.forEach((opt, idx) => {
          row[`Option ${idx + 1}`] = opt;
        });
      }

      if (q.type === 'coding') {
        row['Problem Description'] = q.description || '';
        row['Starter Code'] = q.starterCode || '';
        row['Test Input'] = q.testInput || '';
        row['Test Output'] = q.testOutput || '';
      } else {
        if (Array.isArray(q.correctAnswer)) {
          row['Correct Answer'] = q.correctAnswer.join(', ');
        } else if (q.correctAnswer) {
          row['Correct Answer'] = q.correctAnswer;
        }
      }

      row['Marks'] = q.marks || 1;
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, `${config?.title?.replace(/[^a-z0-9]/gi, '_') || 'Assessment'}_Questions.xlsx`);
    toast.add('Questions exported successfully!', 'success');
  };

  return (
    <div className="h-full w-full flex flex-col bg-neutral-50 dark:bg-[#0a0a0a] overflow-hidden relative">
      
      {/* Header */}
      <div className="px-4 xl:px-6 py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur shrink-0 z-10">
        <div className="shrink-0">
          <h2 className="font-display font-black text-lg text-neutral-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
            <Library className="w-5 h-5 text-[#6C1D5F]" /> Question Builder
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">Build your assessment.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
          <button
            onClick={() => setIsDesktopConfigOpen(!isDesktopConfigOpen)}
            className="hidden lg:flex items-center justify-center p-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            title={isDesktopConfigOpen ? "Hide Assessment Details" : "Show Assessment Details"}
          >
            {isDesktopConfigOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase font-bold text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700">
              Marks: {questions.reduce((acc, q) => acc + (q.marks || 0), 0)}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700">
              Qs: {questions.length}
            </span>
          </div>
          <div className="hidden sm:block h-6 w-px bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => { setAddingManual(true); setTimeout(() => document.querySelector('.overflow-y-auto')?.scrollTo({top: 0, behavior: 'smooth'}), 100); }}
              disabled={!isConfigComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6C1D5F] hover:bg-[#84117C] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload} 
              className="hidden" 
              ref={fileInputRef} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-bold transition-colors"
              title="Upload Excel or CSV"
            >
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-bold transition-colors"
              title="Download Excel Template"
            >
              <Download className="w-3.5 h-3.5" /> Template
            </button>
            <button 
              onClick={handleExportQuestions}
              disabled={questions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-colors"
              title="Export Current Questions"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button 
              onClick={() => setQuestions([])}
              disabled={questions.length === 0}
              className="flex items-center justify-center p-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              title="Remove All"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={handleGenerateQuestions}
              disabled={!isConfigComplete || isGeneratingAi}
              className={`flex items-center justify-center p-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-300 ${isGeneratingAi ? 'bg-fuchsia-600 scale-110' : 'bg-[#6C1D5F] hover:bg-fuchsia-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-fuchsia-900/30'}`}
              title="Generate with AI"
            >
              <Wand2 className={`w-4 h-4 ${isGeneratingAi ? 'animate-bounce text-pink-200' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col bg-neutral-100/50 dark:bg-[#050505] relative">
        {!isConfigComplete && (
          <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-xl max-w-sm text-center space-y-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <Library className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-white">Configuration Required</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Please complete all mandatory fields in the Configuration panel (Title, Topic, Course, Batches, Type, Difficulty, Duration, Marks) before adding questions.
              </p>
            </div>
          </div>
        )}
        <div className="w-full max-w-4xl mx-auto space-y-4 pb-32">
          
          {questions.length === 0 && !addingManual && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Brain className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-4" />
                <h3 className="text-lg font-bold text-neutral-400">Your Canvas is Empty</h3>
                <p className="text-sm text-neutral-500 mt-1 max-w-xs">Add questions using the buttons below to see them appear here instantly.</p>
              </div>
            )}

            {questions.map((q, idx) => (
              <div key={q.id || idx} className="space-y-2 group relative border-b border-neutral-100 dark:border-neutral-800 pb-4">
                
                {/* Floating Actions for each question */}
                <div className="absolute -right-4 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 translate-x-full z-10">
                   <button onClick={() => handleEdit(idx)} className="p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm text-neutral-500 hover:text-[#6C1D5F]"><Edit className="w-4 h-4" /></button>
                   <button onClick={() => handleDelete(idx)} className="p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm text-neutral-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    <span className="text-[#6C1D5F] font-bold mr-2">{idx + 1}.</span>
                    {q.text || q.questionText || q['Question Text'] || q.question || "Untitled Question"}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                      {q.marks || 1} pts
                    </span>
                    <button onClick={() => handleEdit(idx)} className="p-1.5 text-neutral-400 hover:text-blue-500 bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(idx)} className="p-1.5 text-neutral-400 hover:text-red-500 bg-neutral-100 dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                {(q.type === 'mcq' || q.type === 'true_false') && q.options && (
                  <div className="space-y-1 pl-6">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = q.correctAnswer === opt || (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt));
                      return (
                        <div key={oIdx} className={`flex items-center gap-2 p-1.5 rounded-lg border transition-colors cursor-pointer text-sm ${isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500' : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300'}`}>
                          <input type="radio" disabled checked={isCorrect} className="w-4 h-4 text-emerald-600" />
                          <span className="flex-1">{opt}</span>
                          {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'multiple_select' && q.options && (
                  <div className="space-y-1 pl-6">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = q.correctAnswer === opt || (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt));
                      return (
                        <div key={oIdx} className={`flex items-center gap-2 p-1.5 rounded-lg border transition-colors cursor-pointer text-sm ${isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500' : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300'}`}>
                          <input type="checkbox" disabled checked={isCorrect} className="w-4 h-4 text-emerald-600 rounded" />
                          <span className="flex-1">{opt}</span>
                          {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div className="pl-6">
                    <input type="text" disabled placeholder="Short answer text..." className="w-full h-12 px-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sm" />
                  </div>
                )}
                
                {q.type === 'paragraph' && (
                  <div className="pl-6">
                    <textarea disabled placeholder="Long paragraph response..." className="w-full h-32 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sm resize-none" />
                  </div>
                )}

                {q.type === 'file_upload' && (
                  <div className="pl-6 relative">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="w-full h-32 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center gap-2 text-neutral-400">
                      <FileText className="w-6 h-6" />
                      <span className="text-sm font-bold">Drag and drop file here</span>
                    </div>
                  </div>
                )}

                {q.type === 'coding' && (
                  <div className="pl-6">
                    <div className="w-full h-48 bg-neutral-100 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                      <code className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">function solution() {'{ ... }'}</code>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Manual Addition Form */}
            <AnimatePresence>
              {addingManual && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-neutral-900 border-2 border-[#6C1D5F]/30 dark:border-[#6C1D5F]/50 rounded-2xl p-6 shadow-xl relative mt-8"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#6C1D5F] rounded-l-2xl" />
                  
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white">New Question</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-bold text-neutral-600 dark:text-neutral-300">
                        {questionTypes.find(t => t.id === config?.type)?.label || 'Question Type'}
                      </span>
                      <button onClick={() => setAddingManual(false)} className="p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1.5">Question Text</label>
                      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                        <div className="flex gap-1 p-2 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                          {['B', 'I', 'U', '{}', '∑'].map((tool, i) => (
                            <button key={i} className="w-6 h-6 flex items-center justify-center text-xs font-bold text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded">{tool}</button>
                          ))}
                        </div>
                        <textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} rows={3} className="w-full p-3 text-sm focus:outline-none dark:bg-neutral-900" placeholder="Type your question here..."></textarea>
                      </div>
                    </div>

                    {(config?.type === 'mcq' || config?.type === 'multiple_select' || config?.type === 'true_false') && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-neutral-500 mb-1.5">Options</label>
                        {draftOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <input type={config?.type === 'multiple_select' ? 'checkbox' : 'radio'} disabled className="w-4 h-4 text-[#6C1D5F]" />
                            <input type="text" value={opt} onChange={(e) => {
                               const newOpts = [...draftOptions];
                               newOpts[i] = e.target.value;
                               setDraftOptions(newOpts);
                            }} placeholder={`Option ${i + 1}`} className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm" />
                          </div>
                        ))}
                        <button onClick={() => setDraftOptions([...draftOptions, ''])} className="text-xs font-bold text-[#6C1D5F] mt-2">+ Add Option</button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-6">
                      <div className="flex gap-3">
                        <label className="text-xs font-bold text-neutral-500 flex items-center gap-1.5">
                          Marks: <input type="number" defaultValue={config.marks || 1} className="w-16 px-2 py-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg" />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setAddingManual(false)} className="px-4 py-2 text-xs font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl">Cancel</button>
                        <button onClick={handleSaveManual} className="px-4 py-2 bg-[#6C1D5F] hover:bg-[#84117C] text-white text-xs font-bold rounded-xl shadow-md">Save Question</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
