import api from './axios';

export const eventApi = {
  getEvents: async (params = {}) => {
    const res = await api.get('/events', { params });
    return res.data;
  },

  getEventById: async (id) => {
    const res = await api.get(`/events/${id}`);
    return res.data;
  },

  getMyRegistrations: async () => {
    const res = await api.get('/events/my-registrations');
    return res.data;
  },

  registerForEvent: async (id) => {
    const res = await api.post(`/events/${id}/register`);
    return res.data;
  },

  cancelRegistration: async (id) => {
    const res = await api.delete(`/events/${id}/register`);
    return res.data;
  },

  createEvent: async (eventData) => {
    const res = await api.post('/events', eventData);
    return res.data;
  },

  updateEvent: async (id, eventData) => {
    const res = await api.patch(`/events/${id}`, eventData);
    return res.data;
  },

  deleteEvent: async (id) => {
    const res = await api.delete(`/events/${id}`);
    return res.data;
  },

  getEventAttendees: async (id) => {
    const res = await api.get(`/events/${id}/registrations`);
    return res.data;
  },
};
