import api from './axios';

export const clubApi = {
  getClubs: async (params = {}) => {
    const res = await api.get('/clubs', { params });
    return res.data;
  },

  getClubById: async (id) => {
    const res = await api.get(`/clubs/${id}`);
    return res.data;
  },

  submitProposal: async (proposalData) => {
    const res = await api.post('/clubs/proposals', proposalData);
    return res.data;
  },

  proposeClub: async (proposalData) => {
    const res = await api.post('/clubs/proposals', proposalData);
    return res.data;
  },

  getMyProposals: async () => {
    const res = await api.get('/clubs/my-proposals');
    return res.data;
  },

  getAllProposals: async (params = {}) => {
    const res = await api.get('/clubs/admin/proposals', { params });
    return res.data;
  },

  getClubProposals: async (params = {}) => {
    const res = await api.get('/clubs/admin/proposals', { params });
    return res.data;
  },

  reviewProposal: async (proposalId, data) => {
    const res = await api.patch(`/clubs/admin/proposals/${proposalId}/review`, data);
    return res.data;
  },

  reviewClubProposal: async (proposalId, data) => {
    const res = await api.patch(`/clubs/admin/proposals/${proposalId}/review`, data);
    return res.data;
  },

  joinClub: async (id) => {
    const res = await api.post(`/clubs/${id}/join`);
    return res.data;
  },

  leaveClub: async (id) => {
    const res = await api.delete(`/clubs/${id}/membership`);
    return res.data;
  },

  getClubMembers: async (id) => {
    const res = await api.get(`/clubs/${id}/members`);
    return res.data;
  },

  updateMemberPosition: async (id, userId, position) => {
    const res = await api.patch(`/clubs/${id}/members/${userId}/position`, { position });
    return res.data;
  },

  getClubEvents: async (id) => {
    const res = await api.get(`/clubs/${id}/events`);
    return res.data;
  },

  createClubEvent: async (id, eventData) => {
    const res = await api.post(`/clubs/${id}/events`, eventData);
    return res.data;
  },
};

