import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DateTimePicker = ({ type = 'date', value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Basic states for the clock
  const [clockMode, setClockMode] = useState('hours'); // 'hours' or 'minutes'
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [period, setPeriod] = useState('AM');

  // Calendar logic
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDateSelect = (day) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onChange(d.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const handleTimeSelect = () => {
    let h = selectedHour;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const timeStr = `${h.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onChange(timeStr);
    setIsOpen(false);
  };

  // Clock generation
  const renderClockFace = () => {
    const isHours = clockMode === 'hours';
    const totalItems = isHours ? 12 : 12; // For minutes we only show multiples of 5 on the face for simplicity
    const items = [];
    
    for (let i = 1; i <= totalItems; i++) {
      const val = isHours ? i : (i === 12 ? 0 : i * 5);
      const displayVal = isHours ? i : val.toString().padStart(2, '0');
      
      const angle = (i * 30) - 90; // Start at top (12 o'clock)
      const rad = angle * (Math.PI / 180);
      const radius = 90; // radius of the circle
      const x = Math.cos(rad) * radius + 110;
      const y = Math.sin(rad) * radius + 110;
      
      const isSelected = isHours ? (selectedHour === (val === 0 ? 12 : val)) : (selectedMinute === val);

      items.push(
        <button
          key={i}
          onClick={() => {
            if (isHours) {
              setSelectedHour(val === 0 ? 12 : val);
              setTimeout(() => setClockMode('minutes'), 300);
            } else {
              setSelectedMinute(val);
            }
          }}
          className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isSelected ? 'bg-[#6C1D5F] text-white shadow-md' : 'text-neutral-700 dark:text-neutral-300 hover:bg-purple-100 dark:hover:bg-purple-900/50'}`}
          style={{ left: x, top: y }}
        >
          {displayVal}
        </button>
      );
    }
    return (
      <div className="relative w-[220px] h-[220px] rounded-full bg-neutral-100 dark:bg-neutral-800 mx-auto mt-4 border border-neutral-200 dark:border-neutral-700">
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -ml-0.75 -mt-0.75 bg-[#6C1D5F] rounded-full" />
        {items}
      </div>
    );
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(true)}
        className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm flex items-center gap-2 cursor-pointer hover:border-[#6C1D5F] transition-colors"
      >
        {type === 'date' ? <CalendarIcon className="w-4 h-4 text-[#6C1D5F]" /> : <Clock className="w-4 h-4 text-[#6C1D5F]" />}
        <span className={value ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}>
          {value || `Select ${type}`}
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-2 z-50 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-4 w-[280px]"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-neutral-800 dark:text-white capitalize flex items-center gap-2">
                  {type === 'date' ? <CalendarIcon className="w-4 h-4 text-[#6C1D5F]" /> : <Clock className="w-4 h-4 text-[#6C1D5F]" />}
                  Select {type}
                </h4>
                <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
              </div>

              {type === 'date' ? (
                <div>
                  <div className="flex justify-between items-center mb-4 px-2">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-neutral-800 dark:text-white">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                      <div key={d} className="text-[10px] font-bold text-neutral-400">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {blanks.map(b => <div key={`blank-${b}`} />)}
                    {days.map(d => (
                      <button 
                        key={d} 
                        onClick={() => handleDateSelect(d)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-[#6C1D5F] hover:text-white transition-colors"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex gap-2 text-2xl font-black font-mono text-[#6C1D5F] dark:text-purple-400 mb-2">
                    <button onClick={() => setClockMode('hours')} className={`hover:opacity-80 transition-opacity ${clockMode === 'hours' ? 'underline decoration-2' : ''}`}>{selectedHour.toString().padStart(2, '0')}</button>
                    <span>:</span>
                    <button onClick={() => setClockMode('minutes')} className={`hover:opacity-80 transition-opacity ${clockMode === 'minutes' ? 'underline decoration-2' : ''}`}>{selectedMinute.toString().padStart(2, '0')}</button>
                    <div className="flex flex-col text-[10px] ml-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                      <button onClick={() => setPeriod('AM')} className={`px-2 py-1 ${period === 'AM' ? 'bg-[#6C1D5F] text-white' : 'text-neutral-500'}`}>AM</button>
                      <button onClick={() => setPeriod('PM')} className={`px-2 py-1 border-t border-neutral-200 dark:border-neutral-700 ${period === 'PM' ? 'bg-[#6C1D5F] text-white' : 'text-neutral-500'}`}>PM</button>
                    </div>
                  </div>
                  
                  {renderClockFace()}
                  
                  <button 
                    onClick={handleTimeSelect}
                    className="w-full mt-6 py-2 bg-gradient-to-r from-[#6C1D5F] to-[#84117C] text-white rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 transition-transform"
                  >
                    Confirm Time
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
