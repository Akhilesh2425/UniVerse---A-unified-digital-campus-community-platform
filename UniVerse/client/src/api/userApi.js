import api from './axios';

export const userApi = {
  getProfile: async () => {
    const res = await api.get('/users/me');
    return res.data;
  },

  updateProfile: async (updates) => {
    const res = await api.patch('/users/me', updates);
    return res.data;
  },
};
