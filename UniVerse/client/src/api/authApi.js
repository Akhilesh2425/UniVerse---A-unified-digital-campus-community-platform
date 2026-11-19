import api from './axios';

export const authApi = {
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  forgotPassword: async (data) => {
    const email = typeof data === 'object' && data !== null ? data.email : data;
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  verifyOtp: async (data, maybeOtp) => {
    const payload =
      typeof data === 'object' && data !== null
        ? data
        : { email: data, otp: maybeOtp };
    const res = await api.post('/auth/verify-otp', payload);
    return res.data;
  },

  resetPassword: async (resetData) => {
    const res = await api.post('/auth/reset-password', resetData);
    return res.data;
  },
};
