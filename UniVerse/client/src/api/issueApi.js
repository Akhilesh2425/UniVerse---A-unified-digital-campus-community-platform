import api from './axios';

export const issueApi = {
  getIssues: async (params = {}) => {
    const res = await api.get('/issues', { params });
    return res.data;
  },

  getIssueById: async (issueId) => {
    const res = await api.get(`/issues/${issueId}`);
    return res.data;
  },

  createIssue: async (data) => {
    const res = await api.post('/issues', data);
    return res.data;
  },

  getMyReports: async (params = {}) => {
    const res = await api.get('/issues/my-reports', { params });
    return res.data;
  },

  supportIssue: async (issueId) => {
    const res = await api.post(`/issues/${issueId}/support`);
    return res.data;
  },

  removeSupport: async (issueId) => {
    const res = await api.delete(`/issues/${issueId}/support`);
    return res.data;
  },

  getComments: async (issueId) => {
    const res = await api.get(`/issues/${issueId}/comments`);
    return res.data;
  },

  createComment: async (issueId, data) => {
    const res = await api.post(`/issues/${issueId}/comments`, data);
    return res.data;
  },

  updateComment: async (issueId, commentId, data) => {
    const res = await api.patch(`/issues/${issueId}/comments/${commentId}`, data);
    return res.data;
  },

  deleteComment: async (issueId, commentId) => {
    const res = await api.delete(`/issues/${issueId}/comments/${commentId}`);
    return res.data;
  },

  submitFeedback: async (issueId, data) => {
    const res = await api.post(`/issues/${issueId}/feedback`, data);
    return res.data;
  },

  createReopenRequest: async (issueId, data) => {
    const res = await api.post(`/issues/${issueId}/reopen-requests`, data);
    return res.data;
  },

  getAdminIssues: async (params = {}) => {
    const res = await api.get('/admin/issues', { params });
    return res.data;
  },

  getAdminStatistics: async () => {
    const res = await api.get('/admin/issues/statistics');
    return res.data;
  },

  updateStatus: async (issueId, data) => {
    const res = await api.patch(`/admin/issues/${issueId}/status`, data);
    return res.data;
  },

  updatePriority: async (issueId, priority) => {
    const res = await api.patch(`/admin/issues/${issueId}/priority`, { priority });
    return res.data;
  },

  assignDepartment: async (issueId, data) => {
    const res = await api.patch(`/admin/issues/${issueId}/assignment`, data);
    return res.data;
  },

  addUpdate: async (issueId, data) => {
    const res = await api.post(`/admin/issues/${issueId}/updates`, data);
    return res.data;
  },

  resolveIssue: async (issueId, data) => {
    const res = await api.post(`/admin/issues/${issueId}/resolve`, data);
    return res.data;
  },

  closeIssue: async (issueId, data) => {
    const res = await api.post(`/admin/issues/${issueId}/close`, data);
    return res.data;
  },

  getReopenRequests: async (params = {}) => {
    const res = await api.get('/admin/issues/reopen-requests', { params });
    return res.data;
  },

  reviewReopenRequest: async (issueId, requestId, data) => {
    const res = await api.patch(
      `/admin/issues/${issueId}/reopen-requests/${requestId}`,
      data
    );
    return res.data;
  },

  getIssueAuditHistory: async (issueId) => {
    const res = await api.get(`/admin/issues/${issueId}/history`);
    return res.data;
  },
};

export default issueApi;
