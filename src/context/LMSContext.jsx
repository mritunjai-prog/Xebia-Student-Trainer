import React, { createContext, useContext, useState, useEffect } from 'react';

import { apiClient } from '../api/client';






































const LMSContext = createContext(undefined);

export const LMSProvider = ({ children }) => {

  // Initialize States from Backend API
  const [currentUser, setCurrentUser] = useState(() => {
    const data = sessionStorage.getItem('session') || localStorage.getItem('session');
    if (localStorage.getItem('session')) {
      sessionStorage.setItem('session', localStorage.getItem('session'));
      localStorage.removeItem('session');
    }
    return data ? JSON.parse(data) : null;
  });

  const [teachers, setTeachers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [allCertificates, setAllCertificates] = useState([]);
  
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
    const fetchBackendData = async () => {
      try {
        const users = await apiClient.getUsers();
        const b = await apiClient.getBatches();
        
        const enrichedUsers = users.map(u => {
          if (u.role === 'student') {
            const studentBatches = b.filter(batch => (batch.students || []).includes(u.id)).map(batch => batch.id);
            return { ...u, batches: studentBatches };
          }
          return u;
        });

        const newTeachers = enrichedUsers.filter(u => u.role === 'teacher');
        const newStudents = enrichedUsers.filter(u => u.role === 'student');
        
        setTeachers(prev => JSON.stringify(prev) === JSON.stringify(newTeachers) ? prev : newTeachers);
        setStudents(prev => JSON.stringify(prev) === JSON.stringify(newStudents) ? prev : newStudents);
        setBatches(prev => JSON.stringify(prev) === JSON.stringify(b) ? prev : b);

        setCurrentUser(prev => {
          if (!prev) return prev;
          const updated = enrichedUsers.find(u => u.id === prev.id);
          return updated ? (JSON.stringify(prev) === JSON.stringify(updated) ? prev : updated) : prev;
        });
        
        const a = await apiClient.getAssessments();
        setAssessments(prev => JSON.stringify(prev) === JSON.stringify(a) ? prev : a);
        
        const s = await apiClient.getSubmissions();
        setSubmissions(prev => JSON.stringify(prev) === JSON.stringify(s) ? prev : s);

        if (currentUser && currentUser.role === 'student') {
          try {
            const certs = await apiClient.getCertificatesByUser(currentUser.id);
            setCertificates(certs);
          } catch(e) { console.error('Failed to fetch certificates', e) }
        } else if (currentUser && currentUser.role === 'teacher') {
          try {
            const certs = await apiClient.getAllCertificates();
            setAllCertificates(certs);
          } catch(e) { console.error('Failed to fetch all certificates', e) }
        }
      } catch (err) {
        console.error("Backend connection failed.", err);
      }
    };
    
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 5000); // Poll every 5 seconds for instant cross-client updates
    
    return () => clearInterval(interval);
  }, [currentUser?.id]); // Depend on ID to prevent re-triggering on deep updates


  const [theme, setTheme] = useState(() => {
    const data = localStorage.getItem('settings');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.theme) return parsed.theme;
    }
    return 'light';
  });

  // Write updates to sessionStorage when states change
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('session', JSON.stringify(currentUser));
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
      sessionStorage.setItem('session', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('session');
      localStorage.removeItem('session'); // Ensure it's cleared here too
    }
  }, [currentUser]);

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

  // Fake Auth
  const login = (email, role) => {
    const cleanEmail = email.trim().toLowerCase();
    if (role === 'teacher') {
      const match = teachers.find((t) => t.email.toLowerCase() === cleanEmail);
      if (match) {
        setCurrentUser(match);
        return true;
      }
    } else {
      const match = students.find((s) => s.email.toLowerCase() === cleanEmail);
      if (match) {
        setCurrentUser(match);
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const toggleTheme = () => {
    setTheme((prev) => prev === 'light' ? 'dark' : 'light');
  };

  // Batch Operations
  const createBatch = async (name, course, icon = '📦', status = 'active') => {
    // Check for duplicates
    if (batches.some(b => b.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`A batch with the name "${name}" already exists.`);
    }

    const newBatch = {
      name,
      course,
      icon,
      studentCount: 0,
      students: [],
      status,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    try {
      const savedBatch = await apiClient.createBatch(newBatch);
      setBatches((prev) => [...prev, savedBatch]);
      addNotification('New Batch Created', `Batch ${name} for course "${course}" has been established.`, 'system', 'all_teachers');
      return savedBatch;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const revokeCertificate = async (uuid, reason) => {
    try {
      const revokedCert = await apiClient.revokeCertificate(uuid, currentUser?.name || 'System', reason);
      setAllCertificates(prev => prev.map(c => c.id === revokedCert.id ? revokedCert : c));
      return revokedCert;
    } catch(err) {
      console.error(err);
      throw err;
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

    // Optimistically update local state immediately
    setBatches((prev) => prev.map((b) => {
      if (b.id === id) {
        // Update student states in memory
        setStudents((currentStudents) => currentStudents.map((s) => {
          const isSelected = studentIds.includes(s.id);
          const hadBatch = (s.batches || []).includes(id);
          if (isSelected && !hadBatch) {
            return { ...s, batches: [...(s.batches || []), id] };
          } else if (!isSelected && hadBatch) {
            return { ...s, batches: (s.batches || []).filter((bid) => bid !== id) };
          }
          return s;
        }));
        return { ...b, ...updatedBatch };
      }
      return b;
    }));

    // Persist to backend so it survives page refresh
    try {
      await apiClient.updateBatch(id, updatedBatch);
    } catch (err) {
      console.error('Failed to persist batch update to backend:', err);
    }
  };

  const deleteBatch = async (id) => {
    // Remove batch from students in local state
    setStudents((prev) => prev.map((s) => ({
      ...s,
      batches: s.batches ? s.batches.filter((bid) => bid !== id) : []
    })));
    // Delete from local state
    setBatches((prev) => prev.filter((b) => b.id !== id));
    // Persist to backend
    try {
      await apiClient.deleteBatch(id);
    } catch (err) {
      console.error('Failed to delete batch from backend:', err);
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
    // Backend generates the ID
    const newAssessment = {
      ...newAs,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    try {
      const savedAssessment = await apiClient.createAssessment(newAssessment);
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
      throw err;
    }
  };

  const editAssessment = async (id, updated) => {
    try {
      const targetAs = assessments.find(a => a.id === id);
      if (!targetAs) return;
      
      const merged = { ...targetAs, ...updated };
      const res = await apiClient.updateAssessment(id, merged);
      
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
      throw err;
    }
  };

  const deleteAssessment = async (id) => {
    try {
      await apiClient.deleteAssessment(id);
      setAssessments((prev) => prev.filter((a) => a.id !== id));
      setSubmissions((prev) => prev.filter((s) => s.assessmentId !== id));
    } catch (err) {
      console.error("Failed to delete assessment", err);
      throw err;
    }
  };

  const duplicateAssessment = (id) => {
    const original = assessments.find((a) => a.id === id);
    if (!original) return;

    const duplicated = {
      ...original,
      id: `A-${Date.now()}`,
      title: `${original.title} (Copy)`,
      status: 'draft', // defaults to draft
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAssessments((prev) => [duplicated, ...prev]);
  };

  const archiveAssessment = (id) => {
    editAssessment(id, { status: 'archived' });
  };

  const publishAssessment = (id) => {
    editAssessment(id, { status: 'published' });
  };

  const allocateAssessment = async (id, batches, course) => {
    try {
      const res = await apiClient.allocateAssessment(id, { batches, course });
      setAssessments((prev) => prev.map((a) => (a.id === id ? res : a)));
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const getAssessmentHistory = async (assessmentId) => {
    try {
      return await apiClient.getAssessmentHistory(assessmentId);
    } catch (err) {
      console.error('Failed to fetch assessment history:', err);
      return [];
    }
  };

  // Student Assessment Taking
  const startAssessment = (assessmentId, studentId) => {
    // Check if there is already an in_progress submission
    const existing = submissions.find((s) => s.assessmentId === assessmentId && s.studentId === studentId);
    if (existing) {
      if (existing.status === 'in_progress') return existing;
    }

    const asObj = assessments.find((a) => a.id === assessmentId);
    const newSub = {
      id: `SUB-${Date.now()}`,
      assessmentId,
      studentId,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      answers: [],
      score: 0,
      percentage: 0,
      timeTaken: 0,
      isEvaluated: false
    };

    setSubmissions((prev) => [newSub, ...prev]);
    apiClient.createSubmission(newSub).catch(console.error);
    return newSub;
  };

  const submitAssessment = (submissionId, answers) => {
    let finalSubmission = null;

    setSubmissions((currentSubs) => {
      const index = currentSubs.findIndex((s) => s.id === submissionId);
      if (index === -1) return currentSubs;

      const sub = currentSubs[index];
      const asObj = assessments.find((a) => a.id === sub.assessmentId);
      if (!asObj) return currentSubs;

      // Map answers
      const submissionAnswers = answers.map((ans) => {
        return {
          questionId: ans.questionId,
          answer: ans.answer,
          marksAwarded: 0,
          remarks: ''
        };
      });

      // Calculate score if autoGrade
      let score = 0;
      let isEvaluated = false;

      if (asObj.autoGrade) {
        asObj.questions.forEach((q, qidx) => {
          const ansObj = submissionAnswers.find((sa) => sa.questionId === q.id);
          if (ansObj) {
            const hasAnswered = ansObj.answer !== undefined && ansObj.answer !== '' && (!Array.isArray(ansObj.answer) || ansObj.answer.length > 0);

            if (q.type === 'mcq' || q.type === 'true_false') {
              const studentAnswerText = (q.options && q.options[Number(ansObj.answer)] ? q.options[Number(ansObj.answer)] : ansObj.answer || '').trim().toLowerCase();
              const correctAnswerText = (q.options && q.options[Number(q.correctAnswer)] ? q.options[Number(q.correctAnswer)] : q.correctAnswer || '').trim().toLowerCase();
              
              if (studentAnswerText === correctAnswerText || (ansObj.answer || '').trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase()) {
                ansObj.marksAwarded = q.marks;
                score += q.marks;
              } else if (hasAnswered && asObj.negativeMarking) {
                const penalty = (q.marks * (asObj.negativeMarksValue || 0)) / 100;
                ansObj.marksAwarded = -penalty;
                score -= penalty;
              }
            } else if (q.type === 'multi_select') {
              const correctSet = new Set(q.correctAnswer);
              const providedSet = new Set(ansObj.answer);
              const match = correctSet.size === providedSet.size && [...correctSet].every((val) => providedSet.has(val));
              if (match) {
                ansObj.marksAwarded = q.marks;
                score += q.marks;
              } else if (hasAnswered && asObj.negativeMarking) {
                const penalty = (q.marks * (asObj.negativeMarksValue || 0)) / 100;
                ansObj.marksAwarded = -penalty;
                score -= penalty;
              }
            }
          }
        });
        isEvaluated = true;
      }

      const percentage = asObj.marks > 0 ? Math.round(score / asObj.marks * 100) : 0;
      const startedTime = sub.startedAt ? new Date(sub.startedAt).getTime() : Date.now();
      const timeTakenSecs = Math.max(1, Math.round((Date.now() - startedTime) / 1000));

      const updatedSub = {
        ...sub,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        answers: submissionAnswers,
        score,
        percentage,
        timeTaken: timeTakenSecs,
        isEvaluated
      };

      finalSubmission = updatedSub;
      apiClient.createSubmission(updatedSub).catch(console.error);

      const newSubs = [...currentSubs];
      newSubs[index] = updatedSub;
      return newSubs;
    });

    // Notify teacher of a new submission
    const asObj = assessments.find((a) => a.id === finalSubmission?.assessmentId);
    if (asObj) {
      const stud = students.find((s) => s.id === finalSubmission?.studentId);
      addNotification(
        'Assessment Submitted',
        `${stud?.name || 'A student'} completed "${asObj.title}". ${asObj.manualGrade ? 'Requires manual evaluation.' : `Score: ${finalSubmission?.score}/${asObj.marks}`}`,
        'system',
        asObj.createdBy
      );
    }

    // Sync individual student stats if autoGraded
    if (asObj?.autoGrade && finalSubmission) {
      setStudents((prevStudents) => prevStudents.map((s) => {
        if (s.id === finalSubmission?.studentId) {
          const completedCount = (s.assessmentsCompleted || 0) + 1;
          const currentAvg = s.averageScore || 80;
          const newAvg = Math.round((currentAvg * (completedCount - 1) + (finalSubmission?.percentage || 0)) / completedCount);
          return {
            ...s,
            assessmentsCompleted: completedCount,
            averageScore: newAvg
          };
        }
        return s;
      }));
    }

    return finalSubmission || {};
  };

  // Teacher manual evaluation
  const evaluateSubmission = (
  submissionId,
  questionMarks,
  questionRemarks,
  overallRemarks) =>
  {
    let finalStudentId = '';
    let finalPercentage = 0;
    let asTitle = '';

    setSubmissions((prev) => prev.map((sub) => {
      if (sub.id === submissionId) {
        const asObj = assessments.find((a) => a.id === sub.assessmentId);
        asTitle = asObj?.title || 'Assessment';
        if (!asObj) return sub;

        const updatedAnswers = sub.answers.map((ans) => {
          const qId = ans.questionId;
          const q = asObj.questions.find((quest) => quest.id === qId);
          return {
            ...ans,
            marksAwarded: questionMarks[qId] !== undefined ? questionMarks[qId] : ans.marksAwarded || 0,
            remarks: questionRemarks[qId] !== undefined ? questionRemarks[qId] : ans.remarks || '',
            isReviewed: true
          };
        });

        // Sum total manual + auto scores
        const totalScore = updatedAnswers.reduce((sum, ans) => sum + (ans.marksAwarded || 0), 0);
        const percentage = asObj.marks > 0 ? Math.round(totalScore / asObj.marks * 100) : 0;

        finalStudentId = sub.studentId;
        finalPercentage = percentage;

        return {
          ...sub,
          answers: updatedAnswers,
          score: totalScore,
          percentage,
          isEvaluated: true,
          remarks: overallRemarks,
          evaluatedBy: currentUser?.id || 'T1'
        };
      }
      return sub;
    }));

    // Update student performance averages
    if (finalStudentId) {
      setStudents((prevStudents) => prevStudents.map((s) => {
        if (s.id === finalStudentId) {
          const completedCount = (s.assessmentsCompleted || 0) + 1;
          const currentAvg = s.averageScore || 80;
          const newAvg = Math.round((currentAvg * (completedCount - 1) + finalPercentage) / completedCount);
          return {
            ...s,
            assessmentsCompleted: completedCount,
            averageScore: newAvg
          };
        }
        return s;
      }));

      // Notify the student
      addNotification(
        'Assessment Evaluated',
        `Your submission for "${asTitle}" has been graded by the trainer. Remarks: "${overallRemarks.substring(0, 35)}..."`,
        'evaluation',
        finalStudentId
      );
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const updateProfile = (updatedUser) => {
    if (!currentUser) return;
    const merged = { ...currentUser, ...updatedUser };
    setCurrentUser(merged);

    if (merged.role === 'teacher') {
      setTeachers((prev) => prev.map((t) => t.id === merged.id ? { ...t, ...updatedUser } : t));
    } else {
      setStudents((prev) => prev.map((s) => s.id === merged.id ? { ...s, ...updatedUser } : s));
    }
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
      certificates,
      allCertificates,
      revokeCertificate,
      notifications,
      currentUser,
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
      allocateAssessment,
      getAssessmentHistory,
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