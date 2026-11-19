import api from './axios';

export const searchApi = {
  searchGlobal: async (params = {}) => {
    const response = await api.get('/search', { params });
    return response.data;
  },

  getDiscovery: async () => {
    const response = await api.get('/discover');
    return response.data;
  },
};
