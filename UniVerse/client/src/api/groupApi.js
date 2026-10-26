import api from './axios';

export const groupApi = {
  // Discovery & Details
  getGroups: async (params = {}) => {
    const res = await api.get('/groups', { params });
    return res.data;
  },

  getGroupById: async (id) => {
    const res = await api.get(`/groups/${id}`);
    return res.data;
  },

  createGroup: async (groupData) => {
    const res = await api.post('/groups', groupData);
    return res.data;
  },

  updateGroup: async (id, groupData) => {
    const res = await api.patch(`/groups/${id}`, groupData);
    return res.data;
  },

  deleteGroup: async (id) => {
    const res = await api.delete(`/groups/${id}`);
    return res.data;
  },

  // Membership & Requests
  joinGroup: async (id) => {
    const res = await api.post(`/groups/${id}/join`);
    return res.data;
  },

  leaveGroup: async (id) => {
    const res = await api.delete(`/groups/${id}/membership`);
    return res.data;
  },

  getMyGroups: async () => {
    const res = await api.get('/groups/my');
    return res.data;
  },

  getGroupMembers: async (id) => {
    const res = await api.get(`/groups/${id}/members`);
    return res.data;
  },

  getJoinRequests: async (id) => {
    const res = await api.get(`/groups/${id}/join-requests`);
    return res.data;
  },

  reviewJoinRequest: async (id, requestId, status) => {
    const res = await api.patch(`/groups/${id}/join-requests/${requestId}`, { status });
    return res.data;
  },

  updateMemberRole: async (id, userId, role) => {
    const res = await api.patch(`/groups/${id}/members/${userId}/role`, { role });
    return res.data;
  },

  removeMember: async (id, userId) => {
    const res = await api.delete(`/groups/${id}/members/${userId}`);
    return res.data;
  },

  // Posts / Discussions
  getGroupPosts: async (id) => {
    const res = await api.get(`/groups/${id}/posts`);
    return res.data;
  },

  createGroupPost: async (id, postData) => {
    const res = await api.post(`/groups/${id}/posts`, postData);
    return res.data;
  },

  updateGroupPost: async (id, postId, postData) => {
    const res = await api.patch(`/groups/${id}/posts/${postId}`, postData);
    return res.data;
  },

  deleteGroupPost: async (id, postId) => {
    const res = await api.delete(`/groups/${id}/posts/${postId}`);
    return res.data;
  },

  // Comments
  getPostComments: async (id, postId) => {
    const res = await api.get(`/groups/${id}/posts/${postId}/comments`);
    return res.data;
  },

  createPostComment: async (id, postId, commentData) => {
    const res = await api.post(`/groups/${id}/posts/${postId}/comments`, commentData);
    return res.data;
  },

  updatePostComment: async (id, postId, commentId, commentData) => {
    const res = await api.patch(`/groups/${id}/posts/${postId}/comments/${commentId}`, commentData);
    return res.data;
  },

  deletePostComment: async (id, postId, commentId) => {
    const res = await api.delete(`/groups/${id}/posts/${postId}/comments/${commentId}`);
    return res.data;
  },
};
