import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLMS } from '../context/LMSContext';
import { toast } from '../components/Toast';
import { ShieldCheck, GraduationCap, ArrowRight, KeyRound, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Login = () => {
  const { login, authLoading, theme, toggleTheme } = useLMS();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      toast.add('Please enter your email address', 'warning');
      return;
    }

    if (!password) {
      toast.add('Please enter your password', 'warning');
      return;
    }

    try {
      const user = await login(email, password, role);
      toast.add('Login Successful! Welcome back.', 'success');
      navigate(user.role === 'teacher' ? '/trainer-dashboard' : '/student-dashboard', { replace: true });
    } catch (loginError) {
      const message = loginError.message || 'Login failed. Please check your credentials and try again.';
      setError(message);
      toast.add(message, 'error');
    }
  };

  const handleQuickLogin = (quickEmail, quickRole, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setRole(quickRole);
  };

  const demoAccounts = {
    teacher: [
      {
        id: 'seed-teacher',
        name: 'Seed Teacher',
        email: 'teacher@example.com',
        password: 'password123',
        label: 'Trainer'
      }
    ],
    student: [
      {
        id: 'seed-student',
        name: 'Seed Student',
        email: 'student@example.com',
        password: 'password123',
        label: 'Student'
      }
    ]
  };

  return (
    <div className={`min-h-screen w-full relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'dark bg-neutral-950' : 'bg-[#f8f9fb]'}`}>

      {/* 3D Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#6C1D5F]/20 to-[#84117C]/30 dark:from-[#6C1D5F]/30 dark:to-purple-900/30 blur-[100px]"
        />
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-[#01AC9F]/20 to-emerald-400/20 dark:from-[#01AC9F]/20 dark:to-teal-900/30 blur-[120px]"
        />
      </div>

      {/* Theme Toggle - Fixed Visibility */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-3.5 rounded-full bg-white/40 dark:bg-black/40 hover:bg-white/60 dark:hover:bg-black/60 text-neutral-800 dark:text-purple-300 shadow-xl backdrop-blur-xl border border-white/50 dark:border-white/10 transition-colors cursor-pointer"
        title="Toggle Theme"
      >
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <motion.div key="sun" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
              <Sun className="w-5 h-5 text-amber-400" />
            </motion.div>
          ) : (
            <motion.div key="moon" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
              <Moon className="w-5 h-5 text-indigo-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="container mx-auto min-h-screen flex items-center justify-center p-6 relative z-10 perspective-[1000px]">

        {/* Animated Border Light Layer */}
        <div className="absolute inset-[-3px] bg-gradient-to-r from-emerald-400 via-purple-500 to-[#01AC9F] rounded-[2.6rem] opacity-30 dark:opacity-50 blur-sm animate-spin" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', zIndex: -1, animationDuration: '8s' }} />

        {/* Main Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="w-full max-w-5xl flex flex-col md:flex-row bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl dark:shadow-purple-900/10 border border-white/60 dark:border-white/10 overflow-hidden transform-gpu relative z-10"
        >

          {/* Branding Column with 3D Depth */}
          <div className="md:w-5/12 bg-gradient-to-br from-[#4A1E47] via-[#6C1D5F] to-[#84117C] text-white p-10 md:p-14 relative overflow-hidden flex flex-col justify-between shadow-[inset_-20px_0_40px_rgba(0,0,0,0.1)] gap-16 md:gap-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#01AC9F]/30 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 relative z-10"
            >
              <img src="/logo-dark.png" alt="Xebia" className="h-12 transform hover:scale-105 transition-transform" />
              <div>
                <h1 className="font-display font-extrabold text-2xl tracking-tight leading-none text-white drop-shadow-md">Xebia LMS</h1>
                <p className="text-[10px] text-purple-200 mt-1 uppercase font-mono tracking-wider font-bold">Assessment System</p>
              </div>
            </motion.div>

            <div className="relative z-10 flex flex-col justify-center flex-grow">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black leading-[1.1] tracking-tight drop-shadow-xl mt-8">
                  Evaluate. Learn. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">Excel.</span>
                </h2>
                <p className="text-purple-100/90 mt-6 max-w-sm leading-relaxed text-sm md:text-base font-medium">
                  Deliver secure, scalable, and intelligent assessments with automated grading, real-time analytics, and seamless learning experiences—all from one enterprise platform.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Login Interaction Column */}
          <div className="md:w-7/12 p-8 md:p-14 flex items-center justify-center relative">
            <div className="w-full max-w-md space-y-8 relative z-10">

              <div className="text-center md:text-left">
                <h3 className="text-3xl md:text-4xl font-display font-black text-neutral-900 dark:text-white tracking-tight">
                  Welcome Back
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
                  Select your portal and enter your credentials to continue.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                {/* Role Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-neutral-200/50 dark:bg-black/30 backdrop-blur-md rounded-2xl border border-white/50 dark:border-neutral-800 shadow-inner">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer relative overflow-hidden ${role === 'teacher' ? 'text-[#6C1D5F] dark:text-purple-300 shadow-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-white dark:bg-neutral-800' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-neutral-800/40'}`}
                  >
                    <ShieldCheck className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Trainer</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer relative overflow-hidden ${role === 'student' ? 'text-[#01AC9F] dark:text-emerald-400 shadow-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-white dark:bg-neutral-800' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-white/40 dark:hover:bg-neutral-800/40'}`}
                  >
                    <GraduationCap className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Student</span>
                  </motion.button>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 ml-1">Institutional Email</label>
                  <div className="relative group">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role === 'teacher' ? 'teacher@example.com' : 'student@example.com'}
                      className="w-full px-5 py-4 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-300/80 dark:border-neutral-700 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-[#6C1D5F]/20 dark:focus:ring-purple-500/20 focus:border-[#6C1D5F] dark:focus:border-purple-500 dark:text-white transition-all shadow-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 ml-1">Password</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-600" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="password123"
                      className="w-full pl-12 pr-5 py-4 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-300/80 dark:border-neutral-700 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-[#6C1D5F]/20 dark:focus:ring-purple-500/20 focus:border-[#6C1D5F] dark:focus:border-purple-500 dark:text-white transition-all shadow-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-medium"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#6C1D5F] to-[#84117C] text-white rounded-2xl text-sm font-black uppercase tracking-wide transition-all shadow-[0_8px_30px_rgb(108,29,95,0.3)] flex items-center justify-center gap-2 cursor-pointer overflow-hidden relative group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10">{authLoading ? 'Signing In...' : 'Access Portal'}</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1.5 transition-transform" />
                </motion.button>
              </form>

              {/* Demo Accounts Slider */}
              <div className="pt-8 space-y-4">
                <h4 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 flex items-center gap-3 uppercase tracking-[0.2em]">
                  <div className="h-px bg-neutral-300 dark:bg-neutral-800 flex-1"></div>
                  Quick Access
                  <div className="h-px bg-neutral-300 dark:bg-neutral-800 flex-1"></div>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Teachers Column */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-500 font-extrabold uppercase tracking-wider ml-1">Trainers</p>
                    {demoAccounts.teacher.map((t, idx) => (
                      <motion.button
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (idx * 0.1) }}
                        key={t.id}
                        onClick={() => handleQuickLogin(t.email, 'teacher', t.password)}
                        className="w-full text-left p-2.5 rounded-2xl bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/60 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-800 hover:border-[#6C1D5F] dark:hover:border-purple-500 hover:shadow-md transition-all duration-300 text-xs cursor-pointer flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-full shadow-sm bg-[#6C1D5F] text-white flex items-center justify-center font-black">T</div>
                        <div className="truncate flex-1">
                          <p className="font-extrabold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-[#6C1D5F] dark:group-hover:text-purple-400 transition-colors">{t.label}</p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-500 truncate font-medium">{t.email}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Students Column */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-500 font-extrabold uppercase tracking-wider ml-1">Students</p>
                    {demoAccounts.student.map((s, idx) => (
                      <motion.button
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (idx * 0.1) }}
                        key={s.id}
                        onClick={() => handleQuickLogin(s.email, 'student', s.password)}
                        className="w-full text-left p-2.5 rounded-2xl bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/60 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-800 hover:border-[#01AC9F] dark:hover:border-emerald-500 hover:shadow-md transition-all duration-300 text-xs cursor-pointer flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-full shadow-sm bg-[#01AC9F] text-white flex items-center justify-center font-black">S</div>
                        <div className="truncate flex-1">
                          <p className="font-extrabold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-[#01AC9F] dark:group-hover:text-emerald-400 transition-colors">{s.label}</p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-500 truncate font-medium">{s.email}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
