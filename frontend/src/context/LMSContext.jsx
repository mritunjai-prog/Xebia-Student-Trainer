import React, { createContext, useContext, useState, useEffect } from 'react';

import {
  apiClient,
  assessmentApi,
  authApi,
  authStorage,
  batchApi,
  draftApi,
  evaluationApi,
  notificationApi,
  settingsApi,
  studentAssessmentApi,
  submissionApi,
  userApi
} from '../api/client';






































const normalizeRole = (role) => {
  const value = String(role || '').toUpperCase();
  if (value === 'TEACHER' || value === 'TRAINER') return 'teacher';
  if (value === 'STUDENT') return 'student';
  return String(role || '').toLowerCase();
};

const toBackendRole = (role) => {
  return normalizeRole(role) === 'teacher' ? 'TEACHER' : 'STUDENT';
};

const normalizeUser = (user, fallbackRole) => {
  if (!user) return null;
  const backendRole = user.role || fallbackRole;
  const role = normalizeRole(backendRole);
  return {
    ...user,
    role,
    backendRole: String(backendRole || '').toUpperCase(),
    name: user.name || user.fullName || user.email || 'Xebia User',
    avatar: user.avatar || user.avatarUrl || user.profileImageUrl || ''
  };
};

const getAuthErrorMessage = (error) => {
  if (error?.errors?.length) return error.errors.join(', ');
  return error?.message || 'Login failed. Please try again.';
};

const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.errors?.length) return error.errors.join(', ');
  return error?.message || fallback;
};

const LMSContext = createContext(undefined);

export const LMSProvider = ({ children }) => {

  // Initialize States from Backend API
  const [teachers, setTeachers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  // Local coding states
  const [codingSubmissions, setCodingSubmissions] = useState(() => {
    const data = localStorage.getItem('codingSubmissions');
    return data ? JSON.parse(data) : [];
  });

  const [codingLeaderboard, setCodingLeaderboard] = useState(() => {
    const data = localStorage.getItem('codingLeaderboard');
    return data ? JSON.parse(data) : [];
  });

  const [notifications, setNotifications] = useState(() => {
    const data = localStorage.getItem('notifications');
    return data ? JSON.parse(data) : [];
  });

  useEffect(() => {
    // Phase 1 connects authentication only. Domain data stays local/mock until
    // the batch, assessment, submission, and dashboard flows are integrated.
  }, []);

  const [currentUser, setCurrentUser] = useState(() => {
    return normalizeUser(authStorage.getCurrentUser());
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [teacherCoreLoading, setTeacherCoreLoading] = useState(false);
  const [teacherCoreError, setTeacherCoreError] = useState('');
  const [studentCoreLoading, setStudentCoreLoading] = useState(false);
  const [studentCoreError, setStudentCoreError] = useState('');
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');

  const [theme, setTheme] = useState(() => {
    const data = localStorage.getItem('settings');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.theme) return parsed.theme;
    }
    return 'light';
  });

  const refreshTeacherCoreData = async () => {
    if (!authStorage.getAccessToken()) return;
    setTeacherCoreLoading(true);
    setTeacherCoreError('');

    try {
      const [studentList, batchList, assessmentList] = await Promise.all([
        userApi.listStudents(),
        batchApi.list(),
        assessmentApi.list()
      ]);

      setStudents(studentList);
      setBatches(batchList);
      setAssessments(assessmentList);
      return { students: studentList, batches: batchList, assessments: assessmentList };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load teacher core data.');
      setTeacherCoreError(message);
      throw error;
    } finally {
      setTeacherCoreLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'teacher') {
      refreshTeacherCoreData().catch((error) => {
        console.error('Failed to load teacher core data.', error);
      });
    }
  }, [currentUser?.id, currentUser?.role]);

  const refreshStudentCoreData = async () => {
    if (!authStorage.getAccessToken()) return;
    setStudentCoreLoading(true);
    setStudentCoreError('');

    try {
      const [assignedAssessments, studentSubmissions] = await Promise.all([
        studentAssessmentApi.listAssigned(),
        submissionApi.list()
      ]);

      setAssessments(assignedAssessments);
      setSubmissions(studentSubmissions);
      return { assessments: assignedAssessments, submissions: studentSubmissions };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load student assessments.');
      setStudentCoreError(message);
      throw error;
    } finally {
      setStudentCoreLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'student') {
      refreshStudentCoreData().catch((error) => {
        console.error('Failed to load student core data.', error);
      });
    }
  }, [currentUser?.id, currentUser?.role]);

  const refreshNotifications = async () => {
    if (!authStorage.getAccessToken() || !currentUser) return [];
    setNotificationLoading(true);
    setNotificationError('');

    try {
      const list = await notificationApi.list();
      setNotifications(list);
      return list;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load notifications.');
      setNotificationError(message);
      console.warn('Failed to load notifications.', error);
      return [];
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshNotifications();
    } else {
      setNotifications([]);
    }
  }, [currentUser?.id, currentUser?.role]);

  // Write updates to LocalStorage when states change
  useEffect(() => {
    if (currentUser) {
      authStorage.setCurrentUser(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('teachers', JSON.stringify(teachers));

    // Sync currentUser if they are a teacher
    if (currentUser?.role === 'teacher') {
      const updated = teachers.find(t => t.id === currentUser.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
      }
    }
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
    
    // Sync currentUser if they are a student
    if (currentUser?.role === 'student') {
      const updated = students.find(s => s.id === currentUser.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
      }
    }
  }, [students]);

  useEffect(() => {
    localStorage.setItem('assessments', JSON.stringify(assessments));

    // Synchronize codingAssessments, codingProblems, codingTemplates, codingTestCases
    const codAs = assessments.filter((a) => a.type === 'coding');
    localStorage.setItem('codingAssessments', JSON.stringify(codAs));

    const problems = [];
    const templates = {};
    const testCases = {};

    codAs.forEach((a) => {
      if (Array.isArray(a.questions)) {
        a.questions.forEach((q) => {
          if (q.type === 'coding') {
            problems.push(q);
            if (q.codingTemplates) {
              templates[q.id] = q.codingTemplates;
            }
            if (q.codingTestCases) {
              testCases[q.id] = q.codingTestCases;
            }
          }
        });
      }
    });

    localStorage.setItem('codingProblems', JSON.stringify(problems));
    localStorage.setItem('codingTemplates', JSON.stringify(templates));
    localStorage.setItem('codingTestCases', JSON.stringify(testCases));
  }, [assessments]);

  useEffect(() => {
    localStorage.setItem('submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('codingSubmissions', JSON.stringify(codingSubmissions));

    // Sync codingResults
    const codingResults = codingSubmissions.map((sub) => ({
      submissionId: sub.id,
      problemId: sub.problemId,
      studentId: sub.studentId,
      score: sub.score,
      status: sub.status,
      submittedAt: sub.submittedAt,
      testCasesResult: [
      { input: 'Sample Case', expected: 'Output', actual: 'Output', passed: sub.status === 'Accepted' || sub.status === 'Partially Accepted', timeTaken: sub.timeTaken / 1000 || 0.05, memoryUsed: sub.memoryUsed || 15.2, visibility: 'public' }]

    }));
    localStorage.setItem('codingResults', JSON.stringify(codingResults));
  }, [codingSubmissions]);

  useEffect(() => {
    localStorage.setItem('codingLeaderboard', JSON.stringify(codingLeaderboard));
  }, [codingLeaderboard]);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (currentUser) {
      authStorage.setCurrentUser(currentUser);
    } else {
      authStorage.setCurrentUser(null);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };

    window.addEventListener('xebia-auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('xebia-auth-unauthorized', handleUnauthorized);
  }, []);

  // Apply theme class to document
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('settings', JSON.stringify({ theme }));
  }, [theme]);

  // Helpers
  const addNotification = (title, message, type, recipientId) => {
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      isRead: false,
      recipientId
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Backend Auth
  const login = async (email, password, role) => {
    const cleanEmail = email.trim().toLowerCase();
    const backendRole = toBackendRole(role);
    setAuthLoading(true);

    try {
      const authResponse = await authApi.login({
        email: cleanEmail,
        password,
        role: backendRole
      });

      if (!authResponse?.accessToken) {
        throw new Error('Login succeeded but no access token was returned.');
      }

      authStorage.setTokens({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken
      });

      let nextUser = normalizeUser(authResponse.user, backendRole);
      if (!nextUser) {
        nextUser = normalizeUser(await userApi.getMe(), backendRole);
      }

      if (!nextUser) {
        throw new Error('Login succeeded but no user profile was returned.');
      }

      authStorage.setSession({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        user: nextUser
      });
      setCurrentUser(nextUser);
      return nextUser;
    } catch (error) {
      authStorage.clearSession();
      setCurrentUser(null);
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Backend logout failed; local session was cleared.', error);
    } finally {
      authStorage.clearSession();
      setCurrentUser(null);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => prev === 'light' ? 'dark' : 'light');
  };

  // Batch Operations
  const createBatch = async (name, course, icon = '📦', status = 'active') => {
    const newBatch = {
      name,
      course,
      icon,
      status,
      students: []
    };
    
    try {
      const savedBatch = await batchApi.create(newBatch);
      setBatches((prev) => [...prev, savedBatch]);
      addNotification('New Batch Created', `Batch ${name} for course "${course}" has been established.`, 'system', 'all_teachers');
      return savedBatch;
    } catch (err) {
      console.error(err);
      throw new Error(getApiErrorMessage(err, 'Failed to create batch.'));
    }
  };

  const editBatch = async (id, name, course, studentIds, icon, status) => {
    const updatedBatch = {
      name,
      course,
      icon: icon || '📦',
      status: status || 'active',
      students: studentIds,
      studentCount: studentIds.length
    };

    try {
      let savedBatch = await batchApi.update(id, updatedBatch);
      if (Array.isArray(studentIds)) {
        savedBatch = await batchApi.updateStudents(id, studentIds);
      }

      setBatches((prev) => prev.map((b) => b.id === id ? savedBatch : b));
      setStudents((currentStudents) => currentStudents.map((student) => {
        const isSelected = studentIds.includes(student.id);
        const currentBatches = student.batches || [];
        if (isSelected && !currentBatches.includes(id)) {
          return { ...student, batches: [...currentBatches, id] };
        }
        if (!isSelected && currentBatches.includes(id)) {
          return { ...student, batches: currentBatches.filter((batchId) => batchId !== id) };
        }
        return student;
      }));
      return savedBatch;
    } catch (err) {
      console.error('Failed to persist batch update to backend:', err);
      throw new Error(getApiErrorMessage(err, 'Failed to update batch.'));
    }
  };

  const deleteBatch = async (id) => {
    try {
      await batchApi.remove(id);
      setStudents((prev) => prev.map((s) => ({
        ...s,
        batches: s.batches ? s.batches.filter((bid) => bid !== id) : []
      })));
      setBatches((prev) => prev.filter((b) => b.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete batch from backend:', err);
      throw new Error(getApiErrorMessage(err, 'Failed to delete batch.'));
    }
  };

  const getBatchProgress = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch || !batch.students || batch.students.length === 0) return 0;
    
    // Find all assessments assigned to this batch
    const batchAssessments = assessments.filter(a => a.batches && a.batches.includes(batchId));
    if (batchAssessments.length === 0) return 0;
    
    // Find all submitted submissions by these students for these assessments
    const batchAssIds = batchAssessments.map(a => a.id);
    const validSubs = submissions.filter(s => 
      batchAssIds.includes(s.assessmentId) && 
      batch.students.includes(s.studentId) && 
      (s.status === 'submitted' || s.isEvaluated)
    );
    
    const maxPossible = batchAssessments.length * batch.students.length;
    if (maxPossible === 0) return 0;
    return Math.round((validSubs.length / maxPossible) * 100);
  };

  // Assessment Operations
  const createAssessment = async (newAs) => {
    try {
      const shouldPublish = newAs.status === 'published';
      const savedDraft = await assessmentApi.create({ ...newAs, status: 'draft' });
      const savedAssessment = shouldPublish ? await assessmentApi.publish(savedDraft.id) : savedDraft;
      setAssessments((prev) => [savedAssessment, ...prev]);

      if (savedAssessment.status === 'published') {
        savedAssessment.batches.forEach((bId) => {
          addNotification(
            'Assessment Published',
            `New assessment "${savedAssessment.title}" published for your batch. Duration: ${savedAssessment.duration}m.`,
            'publish',
            bId
          );
        });
      }
      return savedAssessment;
    } catch (err) {
      console.error(err);
      throw new Error(getApiErrorMessage(err, 'Failed to create assessment.'));
    }
  };

  const editAssessment = async (id, updated) => {
    try {
      const targetAs = assessments.find(a => a.id === id);
      if (!targetAs) return;
      
      const merged = { ...targetAs, ...updated };
      const shouldPublish = updated.status === 'published' && targetAs.status !== 'published';
      const res = shouldPublish
        ? await assessmentApi.publish((await assessmentApi.update(id, { ...merged, status: 'draft' })).id)
        : await assessmentApi.update(id, merged);
      
      setAssessments((prev) => prev.map((a) => {
        if (a.id === id) {
          // If changing status from draft to published, send notification
          if (a.status !== 'published' && updated.status === 'published') {
            merged.batches.forEach((bId) => {
              addNotification(
                'Assessment Published',
                `New assessment "${merged.title}" is now available. Complete it soon!`,
                'publish',
                bId
              );
            });
          } else if (updated.status === 'published') {
            merged.batches.forEach((bId) => {
              addNotification(
                'Assessment Updated',
                `Assessment "${merged.title}" has been updated by the trainer.`,
                'update',
                bId
              );
            });
          }
          return res;
        }
        return a;
      }));
      return res;
    } catch (err) {
      console.error(err);
      throw new Error(getApiErrorMessage(err, 'Failed to update assessment.'));
    }
  };

  const deleteAssessment = async (id) => {
    try {
      await assessmentApi.remove(id);
      setAssessments((prev) => prev.filter((a) => a.id !== id));
      setSubmissions((prev) => prev.filter((s) => s.assessmentId !== id));
      return true;
    } catch (err) {
      console.error("Failed to delete assessment", err);
      throw new Error(getApiErrorMessage(err, 'Failed to delete assessment.'));
    }
  };

  const duplicateAssessment = async (id) => {
    try {
      const duplicated = await assessmentApi.duplicate(id);
      setAssessments((prev) => [duplicated, ...prev]);
      return duplicated;
    } catch (err) {
      console.error("Failed to duplicate assessment", err);
      throw new Error(getApiErrorMessage(err, 'Failed to duplicate assessment.'));
    }
  };

  const archiveAssessment = (id) => {
    editAssessment(id, { status: 'closed' });
  };

  const publishAssessment = async (id) => {
    try {
      const published = await assessmentApi.publish(id);
      setAssessments((prev) => prev.map((a) => a.id === id ? published : a));
      return published;
    } catch (err) {
      console.error("Failed to publish assessment", err);
      throw new Error(getApiErrorMessage(err, 'Failed to publish assessment.'));
    }
  };

  // Student Assessment Taking
  const startAssessment = async (assessmentId) => {
    try {
      const started = await submissionApi.start(assessmentId);
      setSubmissions((prev) => {
        const exists = prev.some((submission) => submission.id === started.id);
        return exists
          ? prev.map((submission) => submission.id === started.id ? started : submission)
          : [started, ...prev];
      });
      return started;
    } catch (err) {
      console.error('Failed to start assessment', err);
      throw new Error(getApiErrorMessage(err, 'Failed to start assessment.'));
    }
  };

  const submitAssessment = async (submissionId, answers, timeTaken = 0) => {
    try {
      const completed = await submissionApi.submit(submissionId, { answers, timeTaken });
      setSubmissions((prev) => prev.map((submission) => submission.id === submissionId ? completed : submission));
      return completed;
    } catch (err) {
      console.error('Failed to submit assessment', err);
      throw new Error(getApiErrorMessage(err, 'Failed to submit assessment.'));
    }
  };

  // Teacher manual evaluation
  const evaluateSubmission = async (
  submissionId,
  questionMarks,
  questionRemarks,
  overallRemarks) =>
  {
    const questionEvaluations = Object.entries(questionMarks).map(([questionId, marksAwarded]) => ({
      questionId,
      marksAwarded,
      remarks: questionRemarks[questionId] || ''
    }));

    try {
      const evaluated = await evaluationApi.evaluate(submissionId, { questionEvaluations, overallRemarks });
      setSubmissions((prev) => {
        const exists = prev.some((submission) => submission.id === evaluated.id);
        return exists
          ? prev.map((submission) => submission.id === evaluated.id ? evaluated : submission)
          : [evaluated, ...prev];
      });
      refreshNotifications();
      return evaluated;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to publish evaluation.'));
    }
  };

  const markNotificationAsRead = async (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true, read: true } : n));
    try {
      const updated = await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? updated : n));
      return updated;
    } catch (error) {
      refreshNotifications();
      throw new Error(getApiErrorMessage(error, 'Failed to mark notification as read.'));
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
    try {
      await notificationApi.markAllRead();
      return refreshNotifications();
    } catch (error) {
      refreshNotifications();
      throw new Error(getApiErrorMessage(error, 'Failed to mark notifications as read.'));
    }
  };

  const updateProfile = async (updatedUser) => {
    if (!currentUser) return;
    const saved = await settingsApi.updateProfile({
      name: updatedUser.name ?? currentUser.name,
      email: updatedUser.email ?? currentUser.email,
      phone: updatedUser.phone ?? currentUser.phone,
      bio: updatedUser.bio ?? currentUser.bio,
      avatarUrl: updatedUser.avatarUrl ?? updatedUser.avatar ?? currentUser.avatar
    });
    const merged = normalizeUser({ ...currentUser, ...saved }, currentUser.backendRole);
    setCurrentUser(merged);

    if (merged.role === 'teacher') {
      setTeachers((prev) => prev.map((t) => t.id === merged.id ? { ...t, ...merged } : t));
    } else {
      setStudents((prev) => prev.map((s) => s.id === merged.id ? { ...s, ...merged } : s));
    }
    return merged;
  };

  // Fetch compiled Leaderboard
  const getLeaderboard = () => {
    // Generate leaderboard based on student avgScore and completed count
    const entries = students.map((s) => {
      // Find matching submissions for student points calculation
      const studentSubs = submissions.filter((sub) => sub.studentId === s.id && sub.status === 'submitted');
      const totalPoints = studentSubs.reduce((sum, sub) => sum + sub.score, 0);

      return {
        rank: 1, // calculated below
        studentId: s.id,
        studentName: s.name,
        avatar: s.avatar,
        score: totalPoints || Math.round((s.averageScore || 80) * 0.8 * (s.assessmentsCompleted || 1)), // estimation for filler
        average: s.averageScore || 80,
        completedAssessments: s.assessmentsCompleted || 10,
        topPerformer: false
      };
    });

    // Sort by score first, then average percentage
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.average - a.average;
    });

    // Assign Ranks and top performer flag
    return entries.map((entry, idx) => {
      return {
        ...entry,
        rank: idx + 1,
        topPerformer: idx < 3 // Top 3 are top performers
      };
    });
  };

  const submitCodingSubmission = (submission) => {
    setCodingSubmissions((prev) => {
      // Remove any duplicate submission for same student-problem-attempt to avoid keys duplicates
      const filtered = prev.filter((s) => s.id !== submission.id);
      return [submission, ...filtered];
    });

    // Update Coding Leaderboard dynamically based on student submission
    setCodingLeaderboard((prev) => {
      const existsIdx = prev.findIndex((item) => item.studentId === submission.studentId);
      if (existsIdx !== -1) {
        const updated = [...prev];
        const entry = updated[existsIdx];

        const passedIncrement = submission.status === 'Accepted' ? 1 : 0;
        const scoreIncrement = submission.score;

        updated[existsIdx] = {
          ...entry,
          score: entry.score + scoreIncrement,
          problemsSolved: entry.problemsSolved + passedIncrement,
          totalAttempts: entry.totalAttempts + 1,
          averageTime: Math.round((entry.averageTime + submission.timeTaken) / 2),
          highestScore: Math.max(entry.highestScore, submission.score),
          badge: entry.score + scoreIncrement >= 300 ? 'Gold' : entry.score + scoreIncrement >= 200 ? 'Silver' : 'Bronze'
        };
        updated.sort((a, b) => b.score - a.score);
        return updated.map((item, idx) => ({ ...item, rank: idx + 1 }));
      } else {
        const newEntry = {
          id: `CL-${Date.now()}`,
          rank: prev.length + 1,
          studentId: submission.studentId,
          studentName: submission.studentName,
          score: submission.score,
          problemsSolved: submission.status === 'Accepted' ? 1 : 0,
          totalAttempts: 1,
          averageTime: submission.timeTaken,
          highestScore: submission.score,
          badge: submission.score >= 40 ? 'Bronze' : 'Rising Star'
        };
        const updated = [...prev, newEntry];
        updated.sort((a, b) => b.score - a.score);
        return updated.map((item, idx) => ({ ...item, rank: idx + 1 }));
      }
    });
  };

  return (
    <LMSContext.Provider value={{
      teachers,
      students,
      batches,
      assessments,
      submissions,
      notifications,
      currentUser,
      authLoading,
      teacherCoreLoading,
      teacherCoreError,
      refreshTeacherCoreData,
      studentCoreLoading,
      studentCoreError,
      refreshStudentCoreData,
      notificationLoading,
      notificationError,
      refreshNotifications,
      theme,
      login,
      logout,
      createBatch,
      editBatch,
      deleteBatch,
      getBatchProgress,
      createAssessment,
      editAssessment,
      deleteAssessment,
      duplicateAssessment,
      archiveAssessment,
      publishAssessment,
      startAssessment,
      submitAssessment,
      evaluateSubmission,
      toggleTheme,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addNotification,
      updateProfile,
      getLeaderboard,

      // Coding exports
      codingSubmissions,
      setCodingSubmissions,
      codingLeaderboard,
      setCodingLeaderboard,
      submitCodingSubmission
    }}>
      {children}
    </LMSContext.Provider>);

};

export const useLMS = () => {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error('useLMS must be used within an LMSProvider');
  }
  return context;
};
