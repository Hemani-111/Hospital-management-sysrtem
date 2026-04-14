import api from '../lib/api';

export const searchService = {
  globalSearch: async (query) => {
    if (!query || query.length < 2) return [];
    const response = await api.get(`/search/global?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};
