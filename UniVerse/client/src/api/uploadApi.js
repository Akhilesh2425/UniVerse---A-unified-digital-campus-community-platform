import api from './axios';

export const uploadApi = {
  uploadImage: async (base64DataUrl, name = 'image') => {
    if (typeof base64DataUrl === 'string' && (base64DataUrl.startsWith('http://') || base64DataUrl.startsWith('https://'))) {
      return { success: true, url: base64DataUrl };
    }

    try {
      const res = await api.post('/upload/image', {
        image: base64DataUrl,
        name,
      });
      return res.data;
    } catch (error) {
      console.warn('Backend upload returned error, falling back to inline data URL:', error.message);
      return {
        success: true,
        url: base64DataUrl,
        fallback: true,
      };
    }
  },
};

