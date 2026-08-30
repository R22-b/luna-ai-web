import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
});

api.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

export const chatAPI = {
  send: (message, history, taskType, model) => api.post('/chat', { message, history, taskType, model }),
  health: () => api.get('/chat/health'),
  models: () => api.get('/chat/models'),
};

export const imageAPI = {
  generate: (prompt, style, width, height) => api.post('/image/generate', { prompt, style, width, height }),
  styles: () => api.get('/image/styles'),
};

export const documentAPI = {
  generate: (type, topic, instructions, pages) =>
    api.post('/documents/generate', { type, topic, instructions, pages }, { responseType: 'blob' }),
};

export const researchAPI = {
  search: (query, depth, sources) => api.post('/research', { query, depth, sources }),
};

export const settingsAPI = {
  getKeys: () => api.get('/settings/keys'),
  saveKeys: (keys, clear = []) => api.post('/settings/keys', { keys, clear }),
  getProfile: () => api.get('/settings/profile'),
  saveProfile: (profile) => api.post('/settings/profile', profile),
};

export const studentAPI = {
  pdf: (file) => { const fd = new FormData(); fd.append('pdf', file); return api.post('/student/pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  youtube: (url) => api.post('/student/youtube', { url }),
  feynman: (topic) => api.post('/student/feynman', { topic }),
  flashcards: (topic) => api.post('/student/flashcards', { topic }),
  quiz: (topic) => api.post('/student/quiz', { topic }),
  link: (url) => api.post('/student/link', { url }),
};

export default api;
