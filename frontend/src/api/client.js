const DEFAULT_API_BASE_URL = 'http://localhost:8082/api/v1';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

export const AUTH_STORAGE_KEYS = {
  accessToken: 'xebia_access_token',
  refreshToken: 'xebia_refresh_token',
  currentUser: 'xebia_current_user',
  legacySession: 'session'
};

const parseStoredJson = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const authStorage = {
  getAccessToken: () => localStorage.getItem(AUTH_STORAGE_KEYS.accessToken),
  getRefreshToken: () => localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken),
  getCurrentUser: () => {
    return parseStoredJson(localStorage.getItem(AUTH_STORAGE_KEYS.currentUser));
  },
  setTokens: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
    if (refreshToken) localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
  },
  setCurrentUser: (user) => {
    if (!user) {
      localStorage.removeItem(AUTH_STORAGE_KEYS.currentUser);
      localStorage.removeItem(AUTH_STORAGE_KEYS.legacySession);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(user));
    localStorage.removeItem(AUTH_STORAGE_KEYS.legacySession);
  },
  setSession: ({ accessToken, refreshToken, user }) => {
    authStorage.setTokens({ accessToken, refreshToken });
    authStorage.setCurrentUser(user);
  },
  clearSession: () => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
    localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
    localStorage.removeItem(AUTH_STORAGE_KEYS.currentUser);
    localStorage.removeItem(AUTH_STORAGE_KEYS.legacySession);
  }
};

export class ApiClientError extends Error {
  constructor(message, { status, errors, response } = {}) {
    super(message || 'Request failed');
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors || [];
    this.response = response;
  }
}

const buildUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const parseJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const unwrapResponse = (payload, status) => {
  if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'success')) {
    if (!payload.success) {
      throw new ApiClientError(payload.message || 'Request failed', {
        status,
        errors: payload.errors || [],
        response: payload
      });
    }

    return payload.data ?? null;
  }

  return payload;
};

const request = async (path, { method = 'GET', body, headers = {}, auth = true } = {}) => {
  const requestHeaders = {
    Accept: 'application/json',
    ...headers
  };

  const token = authStorage.getAccessToken();
  if (auth && token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const options = {
    method,
    headers: requestHeaders
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(buildUrl(path), options);
  } catch (error) {
    throw new ApiClientError('Unable to reach backend API. Confirm Spring Boot is running on the configured URL.', {
      errors: [error.message]
    });
  }

  const payload = await parseJsonResponse(response);

  if (response.status === 401) {
    authStorage.clearSession();
    window.dispatchEvent(new Event('xebia-auth-unauthorized'));
  }

  if (!response.ok) {
    const wrapperMessage = payload && typeof payload === 'object' ? payload.message : null;
    const wrapperErrors = payload && typeof payload === 'object' ? payload.errors : [];
    throw new ApiClientError(wrapperMessage || `Request failed with status ${response.status}`, {
      status: response.status,
      errors: wrapperErrors || [],
      response: payload
    });
  }

  return unwrapResponse(payload, response.status);
};

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' })
};

export const authApi = {
  login: ({ email, password, role }) => api.post('/auth/login', { email, password, role }, { auth: false }),
  refresh: async () => {
    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) {
      throw new ApiClientError('No refresh token is available.');
    }

    const tokenResponse = await api.post('/auth/refresh', { refreshToken }, { auth: false });
    if (tokenResponse?.accessToken) {
      authStorage.setTokens({ accessToken: tokenResponse.accessToken });
    }
    return tokenResponse;
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST', auth: true });
    } finally {
      authStorage.clearSession();
    }
  }
};

export const userApi = {
  getMe: async () => mapUserFromBackend(await api.get('/users/me')),
  listStudents: async () => {
    const users = await api.get('/users?role=STUDENT');
    return (users || []).map(mapUserFromBackend);
  }
};

const titleCaseEnum = (value) => {
  const normalized = String(value || '').toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '';
};

const toBackendBatchStatus = (status) => {
  return String(status || 'active').toUpperCase();
};

const toFrontendBatchStatus = (status) => {
  return String(status || 'ACTIVE').toLowerCase();
};

const toBackendAssessmentStatus = (status) => {
  const normalized = String(status || 'draft').toUpperCase();
  if (normalized === 'PUBLISHED') return 'PUBLISHED';
  if (normalized === 'CLOSED' || normalized === 'ARCHIVED') return 'CLOSED';
  return 'DRAFT';
};

const toFrontendAssessmentStatus = (status) => {
  const normalized = String(status || 'DRAFT').toUpperCase();
  if (normalized === 'PUBLISHED') return 'published';
  if (normalized === 'CLOSED') return 'closed';
  return 'draft';
};

const toBackendAssessmentType = (type, questions = []) => {
  const normalized = String(type || '').toLowerCase();
  if (normalized === 'coding') return 'CODING';
  if (normalized === 'mixed' || normalized === 'mixed types (all)') return 'MIXED';
  if (questions.some((question) => String(question.type || '').toLowerCase() === 'coding')) {
    return questions.every((question) => String(question.type || '').toLowerCase() === 'coding') ? 'CODING' : 'MIXED';
  }
  return 'QUIZ';
};

const toBackendDifficulty = (difficulty) => {
  return String(difficulty || 'Medium').toUpperCase();
};

const toBackendQuestionType = (type) => {
  const normalized = String(type || 'mcq').toLowerCase();
  const map = {
    mcq: 'MCQ',
    true_false: 'TRUE_FALSE',
    multiple_select: 'MULTIPLE_SELECT',
    multi_select: 'MULTIPLE_SELECT',
    short_answer: 'SHORT_ANSWER',
    paragraph: 'PARAGRAPH',
    file_upload: 'FILE_UPLOAD',
    coding: 'CODING'
  };
  return map[normalized] || 'MCQ';
};

const toFrontendQuestionType = (type) => {
  const normalized = String(type || 'MCQ').toUpperCase();
  const map = {
    MCQ: 'mcq',
    TRUE_FALSE: 'true_false',
    MULTIPLE_SELECT: 'multiple_select',
    SHORT_ANSWER: 'short_answer',
    PARAGRAPH: 'paragraph',
    FILE_UPLOAD: 'file_upload',
    CODING: 'coding'
  };
  return map[normalized] || 'mcq';
};

const combineDateTime = (date, time, fallbackEnd = false) => {
  if (!date) return null;
  const safeTime = time || (fallbackEnd ? '23:59' : '00:00');
  const value = new Date(`${date}T${safeTime}:00`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
};

const splitDateTime = (instant) => {
  if (!instant) return { date: '', time: '' };
  const value = new Date(instant);
  if (Number.isNaN(value.getTime())) return { date: '', time: '' };
  return {
    date: value.toISOString().slice(0, 10),
    time: value.toISOString().slice(11, 16)
  };
};

const safeParseJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const mapUserFromBackend = (user) => ({
  ...user,
  id: String(user.id),
  role: String(user.role || '').toLowerCase(),
  backendRole: String(user.role || '').toUpperCase(),
  avatar: user.avatar || user.avatarUrl || '',
  averageScore: user.averageScore || 0,
  assessmentsCompleted: user.assessmentsCompleted || 0,
  batches: user.batches || []
});

export const mapBatchFromBackend = (batch) => {
  const students = (batch.studentIds || batch.students || []).map(String);
  return {
    ...batch,
    id: String(batch.id),
    status: toFrontendBatchStatus(batch.status),
    students,
    studentIds: students,
    studentCount: batch.studentCount ?? students.length,
    createdAt: batch.createdAt || new Date().toISOString()
  };
};

export const mapBatchToBackend = (batch) => ({
  name: batch.name,
  course: batch.course,
  icon: batch.icon || '',
  status: toBackendBatchStatus(batch.status),
  studentIds: batch.studentIds || batch.students || []
});

const normalizeCorrectValues = (correctAnswer) => {
  if (Array.isArray(correctAnswer)) return correctAnswer.map(String);
  if (correctAnswer == null || correctAnswer === '') return [];
  return String(correctAnswer).split(',').map((value) => value.trim()).filter(Boolean);
};

const isCorrectOption = (optionText, index, correctValues) => {
  const indexValue = String(index);
  const oneBasedIndexValue = String(index + 1);
  return correctValues.includes(optionText) || correctValues.includes(indexValue) || correctValues.includes(oneBasedIndexValue);
};

const mapQuestionToBackend = (question, index) => {
  const questionType = toBackendQuestionType(question.type);
  const sourceOptions = question.options || (questionType === 'TRUE_FALSE' ? ['True', 'False'] : []);
  const correctValues = normalizeCorrectValues(question.correctAnswer);
  const options = ['MCQ', 'TRUE_FALSE', 'MULTIPLE_SELECT'].includes(questionType)
    ? sourceOptions.map((option, optionIndex) => {
        const optionText = typeof option === 'string' ? option : option.optionText;
        return {
          optionText,
          correct: typeof option === 'object' && option.correct !== undefined
            ? Boolean(option.correct)
            : isCorrectOption(optionText, optionIndex, correctValues),
          sortOrder: option.sortOrder ?? optionIndex
        };
      }).filter((option) => option.optionText)
    : [];

  const correctAnswer = questionType === 'MULTIPLE_SELECT'
    ? options.filter((option) => option.correct).map((option) => option.optionText).join(',')
    : options.find((option) => option.correct)?.optionText || String(question.correctAnswer || '');

  return {
    id: question.id && !String(question.id).startsWith('q_') && !String(question.id).startsWith('Q-') ? question.id : null,
    type: questionType,
    questionText: question.questionText || question.question || question.text || question['Question Text'] || 'Untitled Question',
    marks: Number(question.marks) || 1,
    required: question.required !== false,
    explanation: question.explanation || question.codingExplanation || '',
    correctAnswer,
    sortOrder: question.sortOrder ?? index,
    options,
    codingDetails: questionType === 'CODING' ? mapCodingDetailsToBackend(question) : null
  };
};

const mapCodingDetailsToBackend = (question) => {
  const templates = Array.isArray(question.codingTemplates)
    ? question.codingTemplates
    : Object.entries(question.codingTemplates || {}).map(([language, starterCode]) => ({ language, starterCode }));

  return {
    difficulty: question.codingDifficulty || 'Easy',
    timeLimitMs: Number(question.codingTimeLimit) || 1000,
    memoryLimitMb: Number(question.codingMemoryLimit) || 256,
    constraintsText: question.codingConstraints || '',
    inputFormat: question.codingInputFormat || '',
    outputFormat: question.codingOutputFormat || '',
    sampleInput: question.codingSampleInput || '',
    sampleOutput: question.codingSampleOutput || '',
    notes: question.codingNotes || '',
    hintsJson: JSON.stringify(question.codingHints || []),
    tagsJson: JSON.stringify(question.codingTags || []),
    languagesAllowedJson: JSON.stringify(question.codingLanguagesAllowed || []),
    templates: templates.map((template) => ({
      language: template.language,
      starterCode: template.starterCode || template.code || ''
    })),
    testCases: (question.codingTestCases || []).map((testCase) => ({
      input: testCase.input || '',
      expectedOutput: testCase.expectedOutput || testCase.output || testCase.expected || '',
      weight: Number(testCase.weight) || Number(question.marks) || 1,
      visibility: testCase.visibility || 'public'
    }))
  };
};

export const mapAssessmentToBackend = (assessment, forcedStatus) => {
  const questions = assessment.questions || [];
  return {
    title: assessment.title,
    topic: assessment.topic || '',
    course: assessment.course || '',
    subject: assessment.subject || assessment.course || assessment.topic || '',
    description: assessment.description || '',
    type: toBackendAssessmentType(assessment.type, questions),
    difficulty: toBackendDifficulty(assessment.difficulty),
    status: toBackendAssessmentStatus(forcedStatus || assessment.status),
    duration: Number(assessment.duration) || 1,
    marks: Number(assessment.marks) || questions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0) || 1,
    passingMarks: Number(assessment.passingMarks) || 0,
    maxAttempts: Number(assessment.maxAttempts || assessment.attemptsAllowed) || 1,
    startAt: assessment.startAt || combineDateTime(assessment.startDate, assessment.startTime),
    endAt: assessment.endAt || combineDateTime(assessment.endDate || assessment.dueDate, assessment.endTime, true),
    negativeMarking: Boolean(assessment.negativeMarking),
    negativeMarksValue: Number(assessment.negativeMarksValue) || 0,
    shuffleQuestions: Boolean(assessment.shuffleQuestions),
    autoSubmit: Boolean(assessment.autoSubmit),
    batchIds: assessment.batchIds || assessment.batches || [],
    questions: questions.map(mapQuestionToBackend)
  };
};

const inferFrontendAssessmentType = (backendType, questions) => {
  if (String(backendType || '').toUpperCase() === 'CODING') return 'coding';
  if (String(backendType || '').toUpperCase() === 'MIXED') return 'mixed';
  if (questions.length > 0 && questions.every((question) => question.type === questions[0].type)) {
    return questions[0].type;
  }
  return 'quiz';
};

const mapQuestionFromBackend = (question) => {
  const type = toFrontendQuestionType(question.type);
  const options = (question.options || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const correctOptions = options.filter((option) => option.correct).map((option) => option.optionText);
  const codingDetails = question.codingDetails || {};
  const templates = {};
  (codingDetails.templates || []).forEach((template) => {
    templates[template.language] = template.starterCode || '';
  });

  return {
    ...question,
    id: String(question.id),
    type,
    text: question.questionText,
    question: question.questionText,
    options: options.map((option) => option.optionText),
    correctAnswer: type === 'multiple_select' ? correctOptions : correctOptions[0] || question.correctAnswer || '',
    codingDifficulty: codingDetails.difficulty,
    codingTimeLimit: codingDetails.timeLimitMs,
    codingMemoryLimit: codingDetails.memoryLimitMb,
    codingConstraints: codingDetails.constraintsText,
    codingInputFormat: codingDetails.inputFormat,
    codingOutputFormat: codingDetails.outputFormat,
    codingSampleInput: codingDetails.sampleInput,
    codingSampleOutput: codingDetails.sampleOutput,
    codingNotes: codingDetails.notes,
    codingHints: safeParseJson(codingDetails.hintsJson, []),
    codingTags: safeParseJson(codingDetails.tagsJson, []),
    codingLanguagesAllowed: safeParseJson(codingDetails.languagesAllowedJson, []),
    codingTemplates: templates,
    codingTestCases: (codingDetails.testCases || []).map((testCase) => ({
      ...testCase,
      output: testCase.expectedOutput,
      expectedOutput: testCase.expectedOutput
    }))
  };
};

export const mapAssessmentFromBackend = (assessment) => {
  const questions = (assessment.questions || []).map(mapQuestionFromBackend);
  const start = splitDateTime(assessment.startAt);
  const end = splitDateTime(assessment.endAt);
  const batches = (assessment.batchIds || assessment.batches || []).map(String);
  return {
    ...assessment,
    id: String(assessment.id),
    type: inferFrontendAssessmentType(assessment.type, questions),
    backendType: assessment.type,
    difficulty: titleCaseEnum(assessment.difficulty || 'MEDIUM'),
    status: toFrontendAssessmentStatus(assessment.status),
    batches,
    batchIds: batches,
    questions,
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    dueDate: end.date,
    attemptsAllowed: assessment.maxAttempts,
    maxAttempts: assessment.maxAttempts,
    marks: Number(assessment.marks) || 0,
    passingMarks: Number(assessment.passingMarks) || 0,
    negativeMarksValue: Number(assessment.negativeMarksValue) || 0
  };
};

export const batchApi = {
  list: async () => {
    const batches = await api.get('/batches');
    return (batches || []).map(mapBatchFromBackend);
  },
  create: async (payload) => mapBatchFromBackend(await api.post('/batches', mapBatchToBackend(payload))),
  get: async (id) => mapBatchFromBackend(await api.get(`/batches/${id}`)),
  update: async (id, payload) => mapBatchFromBackend(await api.put(`/batches/${id}`, mapBatchToBackend(payload))),
  remove: async (id) => {
    await api.delete(`/batches/${id}`);
    return true;
  },
  updateStudents: async (id, studentIds) => {
    return mapBatchFromBackend(await api.put(`/batches/${id}/students`, { studentIds }));
  }
};

export const assessmentApi = {
  list: async () => {
    const assessments = await api.get('/assessments');
    return (assessments || []).map(mapAssessmentFromBackend);
  },
  create: async (payload) => mapAssessmentFromBackend(await api.post('/assessments', mapAssessmentToBackend(payload))),
  get: async (id) => mapAssessmentFromBackend(await api.get(`/assessments/${id}`)),
  update: async (id, payload) => mapAssessmentFromBackend(await api.put(`/assessments/${id}`, mapAssessmentToBackend(payload))),
  remove: async (id) => {
    await api.delete(`/assessments/${id}`);
    return true;
  },
  publish: async (id) => mapAssessmentFromBackend(await api.put(`/assessments/${id}/publish`)),
  duplicate: async (id) => mapAssessmentFromBackend(await api.post(`/assessments/${id}/duplicate`))
};

const buildQueryString = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const toFrontendSubmissionStatus = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'STARTED') return 'in_progress';
  if (normalized === 'EVALUATED') return 'evaluated';
  if (normalized === 'SUBMITTED') return 'submitted';
  return String(status || '').toLowerCase();
};

const parseAnswerValue = (answer) => {
  if (answer?.answerJson) {
    try {
      return JSON.parse(answer.answerJson);
    } catch {
      return answer.answerJson;
    }
  }
  return answer?.answerText || '';
};

export const mapSubmissionFromBackend = (submission) => ({
  ...submission,
  id: String(submission.id),
  assessmentId: String(submission.assessmentId),
  studentId: String(submission.studentId),
  status: toFrontendSubmissionStatus(submission.status),
  backendStatus: submission.status,
  isEvaluated: submission.evaluated || submission.status === 'EVALUATED',
  score: Number(submission.score) || 0,
  percentage: Number(submission.percentage) || 0,
  answers: (submission.answers || []).map((answer) => ({
    ...answer,
    id: answer.id ? String(answer.id) : undefined,
    questionId: String(answer.questionId),
    answer: parseAnswerValue(answer),
    marksAwarded: Number(answer.marksAwarded) || 0,
    isCorrect: Boolean(answer.correct),
    isReviewed: Boolean(answer.reviewed)
  }))
});

const mapAnswerToBackend = (answer) => {
  const value = answer.answer !== undefined ? answer.answer : answer.value;
  const isJson = Array.isArray(value) || (value && typeof value === 'object');
  return {
    questionId: answer.questionId,
    answerText: isJson ? null : String(value ?? ''),
    answerJson: isJson ? JSON.stringify(value) : null
  };
};

export const mapResultFromBackend = (result) => ({
  ...result,
  id: String(result.id),
  assessment: result.assessment ? {
    ...result.assessment,
    id: String(result.assessment.id),
    type: String(result.assessment.type || '').toLowerCase(),
    status: toFrontendAssessmentStatus(result.assessment.status)
  } : null,
  student: result.student ? { ...result.student, id: String(result.student.id) } : null,
  status: toFrontendSubmissionStatus(result.status),
  score: Number(result.score) || 0,
  percentage: Number(result.percentage) || 0,
  isEvaluated: result.status === 'EVALUATED',
  answers: (result.answers || []).map((answer) => ({
    ...answer,
    id: answer.id ? String(answer.id) : undefined,
    questionId: String(answer.questionId),
    question: answer.questionText,
    type: toFrontendQuestionType(answer.questionType),
    answer: answer.answerJson ? safeParseJson(answer.answerJson, answer.answerJson) : answer.answerText,
    marksAwarded: Number(answer.marksAwarded) || 0,
    maxMarks: Number(answer.maxMarks) || 0,
    isCorrect: Boolean(answer.correct),
    isReviewed: Boolean(answer.reviewed),
    options: (answer.options || []).map((option) => option.optionText),
    optionDetails: answer.options || []
  }))
});

export const mapNotificationFromBackend = (notification) => ({
  ...notification,
  id: String(notification.id),
  recipientUserId: notification.recipientUserId ? String(notification.recipientUserId) : null,
  recipientBatchId: notification.recipientBatchId ? String(notification.recipientBatchId) : null,
  recipientId: notification.recipientUserId
    ? String(notification.recipientUserId)
    : notification.recipientBatchId
      ? String(notification.recipientBatchId)
      : notification.recipientRole
        ? `all_${String(notification.recipientRole).toLowerCase()}s`
        : 'all',
  isRead: Boolean(notification.read)
});

export const mapLeaderboardFromBackend = (entry) => ({
  ...entry,
  studentId: String(entry.studentId),
  avatar: entry.avatarUrl || entry.avatar || '',
  score: Number(entry.totalScore) || 0,
  average: Number(entry.averageScore) || 0,
  bestScore: Number(entry.bestScore) || 0,
  completedAssessments: Number(entry.completedAssessments) || 0
});

export const mapTeacherDashboardFromBackend = (dashboard = {}) => ({
  ...dashboard,
  totalStudents: Number(dashboard.totalStudents) || 0,
  totalBatches: Number(dashboard.totalBatches) || 0,
  totalAssessments: Number(dashboard.totalAssessments) || 0,
  totalSubmissions: Number(dashboard.totalSubmissions) || 0,
  pendingEvaluations: Number(dashboard.pendingEvaluations) || 0,
  averageScore: Number(dashboard.averageScore) || 0,
  recentSubmissions: (dashboard.recentSubmissions || []).map((item) => ({
    ...item,
    id: String(item.id),
    assessmentId: String(item.assessmentId),
    studentId: String(item.studentId),
    percentage: Number(item.percentage) || 0,
    isEvaluated: String(item.status || '').toUpperCase() === 'EVALUATED'
  })),
  activeAssessments: (dashboard.activeAssessments || []).map((item) => ({
    ...item,
    id: String(item.id),
    percentage: item.percentage == null ? null : Number(item.percentage),
    evaluated: Boolean(item.evaluated)
  })),
  submissionTrend: (dashboard.submissionTrend || []).map((item) => ({
    name: item.label,
    label: item.label,
    count: Number(item.value) || 0,
    value: Number(item.value) || 0
  }))
});

export const mapStudentDashboardFromBackend = (dashboard = {}) => ({
  ...dashboard,
  activeAssessments: Number(dashboard.activeAssessments) || 0,
  upcomingAssessments: Number(dashboard.upcomingAssessments) || 0,
  completedAssessments: Number(dashboard.completedAssessments) || 0,
  pendingEvaluations: Number(dashboard.pendingEvaluations) || 0,
  averageScore: Number(dashboard.averageScore) || 0,
  bestScore: Number(dashboard.bestScore) || 0,
  leaderboardRank: dashboard.leaderboardRank,
  recentScores: (dashboard.recentScores || []).map((item) => ({
    ...item,
    id: String(item.id),
    percentage: item.percentage == null ? 0 : Number(item.percentage),
    isEvaluated: Boolean(item.evaluated)
  })),
  assignedAssessments: (dashboard.assignedAssessments || []).map((item) => ({
    ...item,
    id: String(item.id),
    percentage: item.percentage == null ? null : Number(item.percentage),
    evaluated: Boolean(item.evaluated)
  }))
});

export const mapOverviewReportFromBackend = (report = {}) => ({
  ...report,
  totalAssessments: Number(report.totalAssessments) || 0,
  totalSubmissions: Number(report.totalSubmissions) || 0,
  evaluatedSubmissions: Number(report.evaluatedSubmissions) || 0,
  pendingEvaluations: Number(report.pendingEvaluations) || 0,
  averageScore: Number(report.averageScore) || 0,
  highestScore: Number(report.highestScore) || 0,
  lowestScore: Number(report.lowestScore) || 0,
  passRate: Number(report.passRate) || 0,
  scoreDistribution: report.scoreDistribution || []
});

export const mapBatchReportFromBackend = (report) => ({
  ...report,
  batchId: String(report.batchId),
  name: report.batchName,
  averageScore: Number(report.averageScore) || 0,
  submissionRate: Number(report.submissionCount) || 0,
  passingRate: Number(report.passRate) || 0,
  studentCount: Number(report.studentCount) || 0,
  assignedAssessmentCount: Number(report.assignedAssessmentCount) || 0,
  submissionCount: Number(report.submissionCount) || 0
});

export const mapStudentReportFromBackend = (report) => ({
  ...report,
  id: String(report.studentId),
  studentId: String(report.studentId),
  name: report.studentName,
  averageScore: Number(report.averageScore) || 0,
  highestScore: Number(report.highestScore) || 0,
  attemptsCount: Number(report.attemptsCount) || 0,
  completedCount: Number(report.completedCount) || 0,
  evaluatedCount: Number(report.evaluatedCount) || 0,
  pendingEvaluations: Number(report.pendingEvaluations) || 0,
  batchIds: (report.batchIds || []).map(String),
  batches: (report.batchIds || []).map(String),
  batchNames: report.batchNames || []
});

export const studentAssessmentApi = {
  listAssigned: async () => {
    const assessments = await api.get('/students/me/assessments');
    return (assessments || []).map(mapAssessmentFromBackend);
  }
};

export const submissionApi = {
  start: async (assessmentId) => mapSubmissionFromBackend(await api.post('/submissions/start', { assessmentId })),
  submit: async (submissionId, payload) => {
    const body = {
      ...payload,
      answers: (payload.answers || []).map(mapAnswerToBackend)
    };
    return mapSubmissionFromBackend(await api.post(`/submissions/${submissionId}/submit`, body));
  },
  getResult: async (submissionId) => mapResultFromBackend(await api.get(`/submissions/${submissionId}/result`)),
  list: async (params = {}) => {
    const submissions = await api.get(`/submissions${buildQueryString(params)}`);
    return (submissions || []).map(mapSubmissionFromBackend);
  }
};

export const evaluationApi = {
  listSubmissions: (params = {}) => submissionApi.list(params),
  getResult: (submissionId) => submissionApi.getResult(submissionId),
  evaluate: async (submissionId, payload) => mapSubmissionFromBackend(await api.put(`/submissions/${submissionId}/evaluation`, payload))
};

export const dashboardApi = {
  teacher: async () => mapTeacherDashboardFromBackend(await api.get('/dashboard/teacher')),
  student: async () => mapStudentDashboardFromBackend(await api.get('/dashboard/student'))
};

export const reportApi = {
  overview: async (params = {}) => mapOverviewReportFromBackend(await api.get(`/reports/overview${buildQueryString(params)}`)),
  batches: async (params = {}) => {
    const reports = await api.get(`/reports/batches${buildQueryString(params)}`);
    return (reports || []).map(mapBatchReportFromBackend);
  },
  students: async (params = {}) => {
    const reports = await api.get(`/reports/students${buildQueryString(params)}`);
    return (reports || []).map(mapStudentReportFromBackend);
  }
};

export const leaderboardApi = {
  list: async (params = {}) => {
    const entries = await api.get(`/leaderboard${buildQueryString(params)}`);
    return (entries || []).map(mapLeaderboardFromBackend);
  }
};

export const notificationApi = {
  list: async () => {
    const notifications = await api.get('/notifications');
    return (notifications || []).map(mapNotificationFromBackend);
  },
  markRead: async (id) => mapNotificationFromBackend(await api.put(`/notifications/${id}/read`)),
  markAllRead: () => api.put('/notifications/read-all')
};

export const settingsApi = {
  getMe: () => userApi.getMe(),
  updateProfile: async (payload) => mapUserFromBackend(await api.put('/users/me', {
    name: payload.name,
    email: payload.email,
    phone: payload.phone || '',
    bio: payload.bio || '',
    avatarUrl: payload.avatarUrl || payload.avatar || ''
  })),
  updatePassword: (payload) => api.put('/users/me/password', {
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword
  }),
  updateNotificationSettings: (payload) => api.put('/users/me/notification-settings', payload)
};

export const draftApi = {
  save: (studentId, assessmentId, draftData) => {
    return api.post(`/assessments/drafts/${studentId}/${assessmentId}`, { draftData });
  },
  get: (studentId, assessmentId) => api.get(`/assessments/drafts/${studentId}/${assessmentId}`)
};

export const codingApi = {
  run: (payload) => api.post('/coding-submissions/run', payload),
  submit: (payload) => api.post('/coding-submissions', payload),
  list: (params = {}) => api.get(`/coding-submissions${buildQueryString(params)}`)
};

export const apiClient = {
  // Users
  getUsers: (role) => role === 'STUDENT' || role === 'student' ? userApi.listStudents() : api.get(`/users${role ? `?role=${encodeURIComponent(role)}` : ''}`),
  createUser: (userData) => api.post('/users', userData),

  // Batches
  getBatches: () => batchApi.list(),
  createBatch: (batchData) => batchApi.create(batchData),
  updateBatch: (id, batchData) => batchApi.update(id, batchData),
  deleteBatch: (id) => batchApi.remove(id),

  // Assessments
  getAssessments: () => assessmentApi.list(),
  createAssessment: (assessmentData) => assessmentApi.create(assessmentData),
  deleteAssessment: (id) => assessmentApi.remove(id),
  updateAssessment: (id, assessmentData) => assessmentApi.update(id, assessmentData),

  // Submissions
  getSubmissions: async (studentId) => {
    const data = await api.get(`/submissions${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`);
    return (data || []).map((sub) => ({
      ...sub,
      answers: sub.answers?.map((answer) => {
        let parsed = answer.answer;
        try {
          if (parsed && typeof parsed === 'string' && (parsed.startsWith('[') || parsed.startsWith('{'))) {
            parsed = JSON.parse(parsed);
          }
        } catch {
          // Keep the original answer when it is not JSON.
        }
        return { ...answer, answer: parsed };
      })
    }));
  },
  createSubmission: (submissionData) => {
    const payload = {
      ...submissionData,
      answers: submissionData.answers?.map((answer) => ({
        ...answer,
        answer: typeof answer.answer === 'object' ? JSON.stringify(answer.answer) : String(answer.answer || '')
      }))
    };
    return api.post('/submissions', payload);
  },

  // Assessment drafts
  saveDraft: (studentId, assessmentId, draftData) => {
    return api.post(`/assessments/drafts/${studentId}/${assessmentId}`, { draftData });
  },
  getDraft: (studentId, assessmentId) => api.get(`/assessments/drafts/${studentId}/${assessmentId}`),

  // AI Description Generation
  generateDescription: (topic) => api.post('/assessments/ai/generate-description', { topic })
};
