import React, { useState } from 'react';
import { useLMS } from '../context/LMSContext';
import { motion } from 'motion/react';
import { Trophy, Search, Star, CheckCircle2 } from 'lucide-react';

export const Leaderboard = () => {
  const { getLeaderboard } = useLMS();
  const [searchQuery, setSearchQuery] = useState('');

  const leaderboardEntries = getLeaderboard();

  // Filter search
  const filteredEntries = leaderboardEntries.filter((entry) =>
  entry.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split into Top 3 podium performers and other performers
  const podiumEntries = leaderboardEntries.slice(0, 3);
  const tableEntries = filteredEntries.slice(3); // display filtered list in table below

  // Medal configurations for 1st, 2nd, 3rd
  const medalStyles = {
    first: {
      coinBg: 'bg-gradient-to-br from-[#FFE14D] via-[#FFD700] to-[#B8860B]',
      coinBorder: 'border-[#FFEC8B]',
      innerRing: 'border-[#8B6508]',
      text: 'text-[#B8860B]',
      wreath: 'border-[#FFD700]',
      ribbonBg: 'bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B]',
      ribbonTailBg: 'bg-[#996515]',
      ribbonText: 'text-[#5C4000]',
      scale: 'scale-110 md:scale-125 z-30 -translate-y-4 md:-translate-y-8',
      order: 'order-2'
    },
    second: {
      coinBg: 'bg-gradient-to-br from-[#FFFFFF] via-[#E0E0E0] to-[#A9A9A9]',
      coinBorder: 'border-white',
      innerRing: 'border-[#808080]',
      text: 'text-[#808080]',
      wreath: 'border-[#C0C0C0]',
      ribbonBg: 'bg-gradient-to-r from-[#808080] via-[#C0C0C0] to-[#808080]',
      ribbonTailBg: 'bg-[#696969]',
      ribbonText: 'text-[#2D2D2D]',
      scale: 'scale-90 md:scale-100 z-20',
      order: 'order-1'
    },
    third: {
      coinBg: 'bg-gradient-to-br from-[#FFA07A] via-[#CD7F32] to-[#8B4513]',
      coinBorder: 'border-[#FFF5EE]',
      innerRing: 'border-[#5C2E0B]',
      text: 'text-[#8B4513]',
      wreath: 'border-[#CD7F32]',
      ribbonBg: 'bg-gradient-to-r from-[#8B4513] via-[#CD7F32] to-[#8B4513]',
      ribbonTailBg: 'bg-[#5C2E0B]',
      ribbonText: 'text-white',
      scale: 'scale-90 md:scale-100 z-10',
      order: 'order-3'
    }
  };

  const podiumLayout = [];
  if (podiumEntries[1]) podiumLayout.push({ entry: podiumEntries[1], rank: 2, config: medalStyles.second });
  if (podiumEntries[0]) podiumLayout.push({ entry: podiumEntries[0], rank: 1, config: medalStyles.first });
  if (podiumEntries[2]) podiumLayout.push({ entry: podiumEntries[2], rank: 3, config: medalStyles.third });

  return (
    <div className="space-y-6">
      
      {/* Page description */}
      <div>
        <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-orange animate-bounce" /> LMS Academic Leaderboard
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Honoring the top academic performers, completed assessments, and average grades</p>
      </div>

      {/* Medals container */}
      {podiumEntries.length > 0 &&
        <div className="flex flex-row justify-center items-end gap-2 md:gap-16 pt-24 md:pt-32 pb-12 px-4 bg-transparent dark:bg-[#0a0a0a]/50 rounded-3xl shadow-none dark:shadow-inner mt-4">
          {podiumLayout.map(({ entry, rank, config }) =>
            <div key={entry.studentId} className={`flex flex-col items-center w-28 md:w-40 ${config.order}`}>
              
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                className={`relative flex flex-col items-center ${config.scale} transition-all duration-300`}
              >
                
                {/* 3D Medal Container */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  
                  {/* Faux Laurel Wreaths using dashed borders */}
                  <div className={`absolute inset-0 rounded-full border-[4px] border-dashed ${config.wreath} scale-[1.12] opacity-60 rotate-45`}></div>
                  <div className={`absolute inset-0 rounded-full border-[1px] ${config.wreath} scale-[1.20] opacity-30`}></div>
                  <div className={`absolute inset-0 rounded-full border-[2px] border-dotted ${config.wreath} scale-[1.28] opacity-20`}></div>

                  {/* Stars Arch */}
                  <div className={`absolute -top-7 flex gap-1 justify-center w-full ${config.text} drop-shadow-md`}>
                    <Star className="w-3 h-3 translate-y-3" fill="currentColor" strokeWidth={0} />
                    <Star className="w-4 h-4 translate-y-1" fill="currentColor" strokeWidth={0} />
                    <Star className="w-6 h-6 -translate-y-1" fill="currentColor" strokeWidth={0} />
                    <Star className="w-4 h-4 translate-y-1" fill="currentColor" strokeWidth={0} />
                    <Star className="w-3 h-3 translate-y-3" fill="currentColor" strokeWidth={0} />
                  </div>

                  {/* The Coin */}
                  <div className={`relative w-28 h-28 rounded-full ${config.coinBg} shadow-[0_0_20px_rgba(0,0,0,0.5)] border-[6px] ${config.coinBorder} flex items-center justify-center z-10`}>
                      {/* Inner Detail */}
                      <div className={`absolute inset-2 rounded-full border-[2px] border-dashed ${config.innerRing} opacity-40`}></div>
                      <div className={`absolute inset-1 rounded-full border-[1px] ${config.innerRing} opacity-20`}></div>
                      
                      {/* Number */}
                      <span className={`text-6xl font-black ${config.text} drop-shadow-sm`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                        {rank}
                      </span>
                  </div>

                  {/* Ribbon */}
                  <div className="absolute -bottom-5 z-20 flex flex-col items-center w-[120%]">
                      {/* Ribbon tails */}
                      <div 
                        className={`absolute -left-2 top-2 w-10 h-8 ${config.ribbonTailBg} -z-10 shadow-lg`} 
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 25% 50%)' }}
                      ></div>
                      <div 
                        className={`absolute -right-2 top-2 w-10 h-8 ${config.ribbonTailBg} -z-10 shadow-lg`} 
                        style={{ clipPath: 'polygon(0 0, 100% 0, 75% 50%, 100% 100%, 0 100%)' }}
                      ></div>
                      
                      {/* Ribbon main body */}
                      <div className={`relative px-4 py-1.5 w-full ${config.ribbonBg} shadow-[0_4px_10px_rgba(0,0,0,0.3)] z-20 flex justify-center items-center rounded-sm`}>
                        <div className="absolute inset-0 border-y border-white/20 pointer-events-none"></div>
                        <span className={`${config.ribbonText} font-black text-[10px] md:text-xs uppercase tracking-wider truncate drop-shadow-sm`}>
                          {entry.studentName}
                        </span>
                      </div>
                  </div>
                </div>

                {/* User Info below medal */}
                <div className="mt-12 flex flex-col items-center">
                  <img src={entry.avatar} className={`w-10 h-10 rounded-full border-2 ${config.wreath} shadow-lg object-cover bg-white`} alt={entry.studentName} />
                  <p className="font-mono font-black text-neutral-800 dark:text-white mt-2 text-sm">{entry.score} pts</p>
                </div>

              </motion.div>
            </div>
          )}
        </div>
      }

      {/* Rest of the Leaderboard Players Table */}
      <div className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-700 dark:border-neutral-800 p-5 rounded-2xl space-y-4">
        
        {/* Search controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Honor Roll Rankings</h4>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search rankings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-brand-border dark:border-neutral-800 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-velvet dark:text-white" />
            
          </div>
        </div>

        {/* Standings Table */}
        <div className="overflow-x-auto">
          <div className="overflow-x-auto w-full"><table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-brand-border dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wide">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Total Points</th>
                <th className="pb-3">Assessments Done</th>
                <th className="pb-3 text-right pr-2">Avg Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
              {tableEntries.length === 0 ?
              <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No matching rankings.
                  </td>
                </tr> :

              tableEntries.map((entry, idx) =>
              <tr key={entry.studentId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors">
                    <td className="py-3.5 pl-2 font-mono font-bold text-neutral-500 dark:text-neutral-400">
                      #{entry.rank}
                    </td>
                    <td className="py-3.5 flex items-center gap-2">
                      <img src={entry.avatar} className="w-5.5 h-5.5 rounded-full" alt="" />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{entry.studentName}</span>
                    </td>
                    <td className="py-3.5 font-mono font-semibold text-neutral-600 dark:text-neutral-300">
                      {entry.score} pts
                    </td>
                    <td className="py-3.5 text-neutral-500 dark:text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {entry.completedAssessments} exams
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-neutral-800 dark:text-white pr-2">
                      {entry.average}%
                    </td>
                  </tr>
              )
              }
            </tbody>
          </table></div>
        </div>

      </div>

    </div>);

};

