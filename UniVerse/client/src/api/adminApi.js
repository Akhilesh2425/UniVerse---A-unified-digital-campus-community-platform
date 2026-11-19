import api from './axios';

export const adminApi = {
  getDashboardOverview: async () => {
    const response = await api.get('/admin/dashboard/overview');
    return response.data;
  },

  getDashboardActivity: async () => {
    const response = await api.get('/admin/dashboard/activity');
    return response.data;
  },

  getDashboardAnalytics: async () => {
    const response = await api.get('/admin/dashboard/analytics');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId, data) => {
    const response = await api.patch(`/admin/users/${userId}/status`, data);
    return response.data;
  },

  updateUserRole: async (userId, data) => {
    const response = await api.patch(`/admin/users/${userId}/role`, data);
    return response.data;
  },

  getAuditLogs: async (params = {}) => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },
};
