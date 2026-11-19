import api from './axios';

export const formApi = {
  getForms: async (params = {}) => {
    const res = await api.get('/forms', { params });
    return res.data;
  },

  getFormById: async (id) => {
    const res = await api.get(`/forms/${id}`);
    return res.data;
  },

  createForm: async (formData) => {
    const res = await api.post('/forms', formData);
    return res.data;
  },

  updateForm: async (id, formData) => {
    const res = await api.patch(`/forms/${id}`, formData);
    return res.data;
  },

  deleteForm: async (id) => {
    const res = await api.delete(`/forms/${id}`);
    return res.data;
  },

  getMyWishlist: async () => {
    const res = await api.get('/forms/wishlist');
    return res.data;
  },

  addToWishlist: async (id, data = {}) => {
    const res = await api.post(`/forms/${id}/wishlist`, data);
    return res.data;
  },

  removeFromWishlist: async (id) => {
    const res = await api.delete(`/forms/${id}/wishlist`);
    return res.data;
  },

  toggleWishlistReminder: async (id, reminderEnabled) => {
    const res = await api.patch(`/forms/${id}/wishlist/reminder`, { reminderEnabled });
    return res.data;
  },

  runRemindersManual: async () => {
    const res = await api.post('/forms/reminders/run');
    return res.data;
  },
};

