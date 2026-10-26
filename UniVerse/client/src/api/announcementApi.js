import api from './axios';

export const announcementApi = {
  getAnnouncements: async (params = {}) => {
    const res = await api.get('/announcements', { params });
    return res.data;
  },

  getAnnouncementById: async (id) => {
    const res = await api.get(`/announcements/${id}`);
    return res.data;
  },

  createAnnouncement: async (data) => {
    const res = await api.post('/announcements', data);
    return res.data;
  },

  updateAnnouncement: async (id, data) => {
    const res = await api.patch(`/announcements/${id}`, data);
    return res.data;
  },

  deleteAnnouncement: async (id) => {
    const res = await api.delete(`/announcements/${id}`);
    return res.data;
  },
};
