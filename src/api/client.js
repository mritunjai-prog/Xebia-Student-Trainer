const API_GATEWAY = '/api/v1';

export const apiClient = {
  // Users
  getUsers: async (role) => {
    const res = await fetch(`${API_GATEWAY}/users${role ? '?role=' + role : ''}`);
    return res.json();
  },
  createUser: async (userData) => {
    const res = await fetch(`${API_GATEWAY}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  // Batches
  getBatches: async () => {
    const res = await fetch(`${API_GATEWAY}/batches`);
    return res.json();
  },
  createBatch: async (batchData) => {
    const res = await fetch(`${API_GATEWAY}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData)
    });
    return res.json();
  },
  updateBatch: async (id, batchData) => {
    const res = await fetch(`${API_GATEWAY}/batches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData)
    });
    return res.json();
  },
  deleteBatch: async (id) => {
    const res = await fetch(`${API_GATEWAY}/batches/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete batch');
    return true;
  },

  // Assessments
  getAssessments: async () => {
    const res = await fetch(`${API_GATEWAY}/assessments`);
    return res.json();
  },
  createAssessment: async (assessmentData) => {
    const res = await fetch(`${API_GATEWAY}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessmentData)
    });
    return res.json();
  },
  deleteAssessment: async (id) => {
    const res = await fetch(`${API_GATEWAY}/assessments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete assessment');
    return true;
  },
  updateAssessment: async (id, assessmentData) => {
    const res = await fetch(`${API_GATEWAY}/assessments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessmentData)
    });
    return res.json();
  },
  allocateAssessment: async (id, allocationData) => {
    const res = await fetch(`${API_GATEWAY}/assessments/${id}/allocate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allocationData)
    });
    return res.json();
  },

  // Submissions
  getSubmissions: async (studentId) => {
    const res = await fetch(`${API_GATEWAY}/submissions${studentId ? '?studentId=' + studentId : ''}`);
    const data = await res.json();
    return data.map(sub => ({
      ...sub,
      answers: sub.answers?.map(a => {
        let parsed = a.answer;
        try {
          if (parsed && typeof parsed === 'string' && (parsed.startsWith('[') || parsed.startsWith('{'))) {
            parsed = JSON.parse(parsed);
          }
        } catch(e) {}
        return { ...a, answer: parsed };
      })
    }));
  },
  createSubmission: async (submissionData) => {
    const payload = {
      ...submissionData,
      answers: submissionData.answers?.map(a => ({
        ...a,
        answer: typeof a.answer === 'object' ? JSON.stringify(a.answer) : String(a.answer || '')
      }))
    };
    const res = await fetch(`${API_GATEWAY}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Redis Drafts
  saveDraft: async (studentId, assessmentId, draftData) => {
    await fetch(`${API_GATEWAY}/assessments/drafts/${studentId}/${assessmentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftData)
    });
  },
  getDraft: async (studentId, assessmentId) => {
    const res = await fetch(`${API_GATEWAY}/assessments/drafts/${studentId}/${assessmentId}`);
    if (res.ok) return res.json();
    return null;
  },

  // AI Description Generation
  generateDescription: async (topic) => {
    const res = await fetch(`${API_GATEWAY}/assessments/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    return res.json();
  },

  // Certificates
  getCertificatesByUser: async (userId) => {
    const res = await fetch(`${API_GATEWAY}/certificates/user/${userId}`);
    if (res.ok) return res.json();
    return [];
  }
};
