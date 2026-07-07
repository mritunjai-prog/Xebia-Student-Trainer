import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LMSProvider, useLMS } from './context/LMSContext';
import { Login } from './pages/Login';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { BatchManagement } from './pages/BatchManagement';
import { BatchDetail } from './pages/BatchDetail';
import { AssessmentBuilder } from './pages/AssessmentBuilder';
import { AssessmentDetail } from './pages/AssessmentDetail';
import { Evaluation } from './pages/Evaluation';
import { Reports } from './pages/Reports';
import { Leaderboard } from './pages/Leaderboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { TakeQuiz } from './pages/TakeQuiz';
import { TakeCoding } from './pages/TakeCoding';
import { Results } from './pages/Results';
import { Settings } from './pages/Settings';
import { StudentAssessments } from './pages/StudentAssessments';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer, toast } from './components/Toast';
import { motion, AnimatePresence } from 'motion/react';

// Wrapper for role-based layouts
const AppContent = () => {
  const { currentUser, theme } = useLMS();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Handle Loading/Login state
  if (!currentUser) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen bg-brand-bg-light dark:bg-neutral-950 transition-colors duration-300">
          <Login />
        </div>
      </div>);

  }

  // Check if we are inside the active TakeQuiz/TakeCoding screen (hide standard sidebar and header)
  const isTakingQuiz = location.pathname.startsWith('/take/') || location.pathname.startsWith('/take-coding/');

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="h-screen w-full bg-brand-bg-light dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-300 flex overflow-hidden">
        
        {/* Render sidebar only if not taking quiz */}
        {!isTakingQuiz &&
        <>
            {/* Desktop Sidebar (permanently fixed on the left) */}
            <div className="hidden lg:flex lg:flex-col lg:w-64 lg:h-full lg:shrink-0">
              <Sidebar />
            </div>

            {/* Mobile Sidebar (Collapsible drawer overlays) */}
            <AnimatePresence>
              {isMobileSidebarOpen &&
            <>
                  {/* Backdrop */}
                  <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 bg-black z-50 lg:hidden" />
              
                  {/* Sliding Sidebar Panel */}
                  <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed inset-y-0 left-0 w-64 bg-[#4A1E47] text-white z-50 lg:hidden shadow-2xl flex flex-col h-full">
                
                    <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
                  </motion.div>
                </>
            }
            </AnimatePresence>
          </>
        }

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Render header only if not taking quiz */}
          {!isTakingQuiz &&
          <Header onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
          }

          {/* Render Active View Canvas */}
          <main className={isTakingQuiz ? 'p-0 h-full overflow-hidden' : 'p-6 md:p-8 flex-1 overflow-y-auto'}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="min-h-full flex flex-col">
                
                <Routes location={location}>
                  {currentUser.role === 'teacher' ?
                  <>
                      <Route path="/trainer-dashboard" element={<TeacherDashboard />} />
                      <Route path="/" element={<Navigate to="/trainer-dashboard" replace />} />
                      <Route path="/batches" element={<BatchManagement />} />
                      <Route path="/batches/:id" element={<BatchDetail />} />
                      <Route path="/assessment-builder" element={<AssessmentBuilder />} />
                      <Route path="/assessment-builder/:id" element={<AssessmentDetail />} />
                      <Route path="/evaluation" element={<Evaluation />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/trainer-dashboard" replace />} />
                    </> :

                  <>
                      <Route path="/student-dashboard" element={<StudentDashboard />} />
                      <Route path="/" element={<Navigate to="/student-dashboard" replace />} />
                      <Route path="/assessments" element={<StudentAssessments />} />
                      <Route path="/take/:slug" element={<TakeQuiz />} />
                      <Route path="/take-coding/:slug" element={<TakeCoding />} />
                      <Route path="/results/:slug/:id" element={<Results />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/student-dashboard" replace />} />
                    </>
                  }
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

      </div>
    </div>);

};

export default function App() {
  const [toasts, setToasts] = useState([]);

  React.useEffect(() => {
    const unsubscribe = toast.subscribe((newToasts) => {
      setToasts(newToasts);
    });
    return () => unsubscribe();
  }, []);

  return (
    <LMSProvider>
      <Router>
        <AppContent />
        <ToastContainer toasts={toasts} onClose={(id) => toast.remove(id)} />
      </Router>
    </LMSProvider>
  );
}