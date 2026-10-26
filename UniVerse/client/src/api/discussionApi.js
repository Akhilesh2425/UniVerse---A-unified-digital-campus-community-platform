import api from './axios';

export const discussionApi = {
  // Discovery & Feed
  getDiscussions: async (params = {}) => {
    const res = await api.get('/discussions', { params });
    return res.data;
  },

  getDiscussionById: async (id) => {
    const res = await api.get(`/discussions/${id}`);
    return res.data;
  },

  createDiscussion: async (data) => {
    const res = await api.post('/discussions', data);
    return res.data;
  },

  updateDiscussion: async (id, data) => {
    const res = await api.patch(`/discussions/${id}`, data);
    return res.data;
  },

  deleteDiscussion: async (id) => {
    const res = await api.delete(`/discussions/${id}`);
    return res.data;
  },

  getMyDiscussions: async (params = {}) => {
    const res = await api.get('/discussions/my-posts', { params });
    return res.data;
  },

  getSavedDiscussions: async (params = {}) => {
    const res = await api.get('/discussions/saved', { params });
    return res.data;
  },

  // Comments & Answers
  getComments: async (postId) => {
    const res = await api.get(`/discussions/${postId}/comments`);
    return res.data;
  },

  createComment: async (postId, data) => {
    const res = await api.post(`/discussions/${postId}/comments`, data);
    return res.data;
  },

  updateComment: async (postId, commentId, data) => {
    const res = await api.patch(`/discussions/${postId}/comments/${commentId}`, data);
    return res.data;
  },

  deleteComment: async (postId, commentId) => {
    const res = await api.delete(`/discussions/${postId}/comments/${commentId}`);
    return res.data;
  },

  setAcceptedAnswer: async (postId, commentId) => {
    const res = await api.patch(`/discussions/${postId}/accepted-answer`, { commentId });
    return res.data;
  },

  // Upvotes
  upvoteDiscussion: async (postId) => {
    const res = await api.post(`/discussions/${postId}/vote`);
    return res.data;
  },

  removeUpvote: async (postId) => {
    const res = await api.delete(`/discussions/${postId}/vote`);
    return res.data;
  },

  // Saved / Bookmarks
  saveDiscussion: async (postId) => {
    const res = await api.post(`/discussions/${postId}/save`);
    return res.data;
  },

  unsaveDiscussion: async (postId) => {
    const res = await api.delete(`/discussions/${postId}/save`);
    return res.data;
  },

  // Reports
  reportContent: async (postId, data, commentId = null) => {
    const url = commentId
      ? `/discussions/${postId}/comments/${commentId}/report`
      : `/discussions/${postId}/report`;
    const res = await api.post(url, data);
    return res.data;
  },

  // Moderation (Admin / Moderator)
  getModerationReports: async (params = {}) => {
    const res = await api.get('/moderation/reports', { params });
    return res.data;
  },

  resolveReport: async (reportId, data) => {
    const res = await api.patch(`/moderation/reports/${reportId}`, data);
    return res.data;
  },
};

export default discussionApi;
