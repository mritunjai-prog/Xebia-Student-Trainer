import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useLMS } from '../context/LMSContext';
import {
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  Check,
  Menu
} from
  'lucide-react';
import { motion, AnimatePresence } from 'motion/react';





export const Header = ({ onToggleMobileSidebar }) => {
  const { currentUser, theme, toggleTheme, notifications, markNotificationAsRead, markAllNotificationsAsRead, logout } = useLMS();
  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!currentUser) return null;

  // Derive page name from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/batches')) return 'Batch Management';
    if (path.startsWith('/builder')) return 'Assessment Builder';
    if (path.startsWith('/submissions')) return 'Evaluation Queue';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/leaderboard')) return 'Leaderboard';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/assessments')) return 'My Assessments';
    if (path.startsWith('/take/')) return 'Assessment Active Exam';
    if (path.startsWith('/results/')) return 'Review Performance';
    return 'LMS Assessment Portal';
  };

  // Filter notifications for active user
  const isTeacher = currentUser.role === 'teacher';
  const userNotifications = notifications.filter((n) => {
    if (n.recipientId === 'all') return true;
    if (isTeacher && n.recipientId === 'all_teachers') return true;
    if (!isTeacher && n.recipientId === 'all_students') return true;
    if (n.recipientId === currentUser.id) return true;
    // Check if notification is for a batch the student is enrolled in
    if (!isTeacher && currentUser.batches?.includes(n.recipientId)) return true;
    return false;
  });

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-20 px-6 lg:px-10 bg-white/95 backdrop-blur-md border-b border-brand-border dark:bg-neutral-900/95 dark:border-neutral-700/60 transition-colors duration-300 shadow-md">

      {/* Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-neutral-500 dark:text-neutral-400">

          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-display font-extrabold tracking-tight text-neutral-800 dark:text-white">
          {getPageTitle()}
        </h2>
      </div>

      {/* Action Tray */}
      <div className="flex items-center gap-4">

        {/* Dark/Light Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-2xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-500 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-all duration-150 cursor-pointer"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>

          {theme === 'light' ?
            <Moon className="w-5 h-5 text-brand-velvet" /> :

            <Sun className="w-5 h-5 text-brand-orange" />
          }
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-2xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-500 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-all duration-150 cursor-pointer">

            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            {unreadCount > 0 &&
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-900 animate-pulse">
                {unreadCount}
              </span>
            }
          </button>

          <AnimatePresence>
            {showNotifications &&
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-2xl border border-brand-border dark:border-neutral-800 shadow-xl overflow-hidden glass-panel">

                <div className="flex items-center justify-between px-4 py-3 bg-[#6C1D5F]/5 dark:bg-neutral-800/50 border-b border-brand-border dark:border-neutral-800">
                  <span className="font-display font-semibold text-sm text-brand-velvet dark:text-purple-300">Notifications</span>
                  {unreadCount > 0 &&
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} Unread
                      </span>
                      <button onClick={markAllNotificationsAsRead} className="text-xs text-[#01AC9F] hover:underline font-semibold" title="Mark all as read">
                        Mark all as read
                      </button>
                    </div>
                  }
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                  {userNotifications.length === 0 ?
                    <div className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
                      No notifications yet.
                    </div> :

                    userNotifications.map((n) =>
                      <div
                        key={n.id}
                        className={`p-3.5 text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40 relative ${!n.isRead ? 'bg-purple-50/40 dark:bg-purple-950/10' : ''}`}>

                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">{n.title}</h4>
                          {!n.isRead &&
                            <button
                              onClick={() => markNotificationAsRead(n.id)}
                              className="p-0.5 rounded-full bg-[#01AC9F]/10 hover:bg-[#01AC9F]/20 text-[#01AC9F] transition-colors"
                              title="Mark as read">

                              <Check className="w-3.5 h-3.5" />
                            </button>
                          }
                        </div>
                        <p className="text-neutral-500 dark:text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">{n.message}</p>
                        <span className="block text-[10px] text-neutral-500 dark:text-neutral-400 mt-1.5">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  }
                </div>
                <div className="px-4 py-2 border-t border-brand-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 text-center">
                  <Link
                    to="/settings"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-[#6C1D5F] dark:text-purple-400 hover:underline font-semibold">

                    Configure notification settings
                  </Link>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 cursor-pointer">

            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border border-brand-border object-cover"
              referrerPolicy="no-referrer" />

            <span className="hidden md:block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {currentUser.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          </button>

          <AnimatePresence>
            {showProfileMenu &&
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-2xl border border-brand-border dark:border-neutral-800 shadow-xl overflow-hidden glass-panel">

                <div className="px-4 py-3 border-b border-brand-border dark:border-neutral-800">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Signed in as</p>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-white truncate">{currentUser.name}</p>
                </div>
                <div className="p-1.5 divide-y divide-neutral-100 dark:divide-neutral-800">
                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">

                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">

                    <SettingsIcon className="w-4 h-4 text-slate-500" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer">

                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

      </div>
    </header>);

};