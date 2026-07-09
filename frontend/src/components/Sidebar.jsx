import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLMS } from '../context/LMSContext';
import {
  LayoutDashboard,
  Users,
  FilePlus2,
  GraduationCap,
  Settings,
  BarChart3,
  LogOut,

  Trophy,

  ClipboardList
} from
  'lucide-react';





export const Sidebar = ({ onCloseMobile }) => {
  const { currentUser, logout, notifications } = useLMS();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const isTeacher = currentUser.role === 'teacher';

  const teacherLinks = [
    { to: '/trainer-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/batches', label: 'Batch Management', icon: Users },
    { to: '/assessment-builder', label: 'Assessment Builder', icon: FilePlus2 },
    { to: '/evaluation', label: 'Evaluation', icon: GraduationCap },
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/settings', label: 'Settings', icon: Settings }];


  const studentLinks = [
    { to: '/student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/assessments', label: 'Assessments', icon: ClipboardList },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/settings', label: 'Settings', icon: Settings }];


  const links = isTeacher ? teacherLinks : studentLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full w-64 bg-[#4A1E47] text-white border-r border-[#6C1D5F]/30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[#6C1D5F]/40">
        <img src="/logo-dark.png" alt="Xebia" className="h-10 transform hover:scale-105 transition-transform" />
        <div>
          <h1 className="font-display font-bold text-lg tracking-tight leading-none text-white">
            Xebia LMS
          </h1>
          <p className="text-[10px] text-purple-200 mt-1 font-mono">
            ASSESSMENT PORTAL
          </p>
        </div>
      </div>



      {/* Nav links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onCloseMobile}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150
                ${isActive ?
                  'bg-white/20 text-white font-bold shadow-md shadow-black/10' :
                  'text-white/70 hover:bg-white/10 hover:text-white'}
              `}>

              <Icon className="w-5 h-5 shrink-0" />
              <span>{link.label}</span>
            </NavLink>);

        })}
      </nav>

      {/* User Information & Logout Action */}
      <div className="p-4 border-t border-[#6C1D5F]/30 bg-[#6C1D5F]/10">
        <div className="flex items-center gap-3 mb-4 px-2">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full border-2 border-[#84117C] object-cover"
            referrerPolicy="no-referrer" />

          <div className="overflow-hidden">
            <h3 className="font-medium text-sm truncate text-white">{currentUser.name}</h3>
            <span className="inline-block px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-[#84117C] text-white mt-1">
              {currentUser.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-purple-200 hover:bg-[#6C1D5F]/40 hover:text-purple-100 transition-all duration-150 cursor-pointer">

          <LogOut className="w-5 h-5 shrink-0 text-purple-300" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>);

};
