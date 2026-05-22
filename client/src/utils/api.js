import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api'),
  withCredentials: true,
  timeout: 60000, // Large timeout for AI processing
});

// Session APIs
export const startSession = (formData) =>
  api.post('/session/start', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getSession = (sessionId) =>
  api.get(`/session/${sessionId}`);

export const getHint = (sessionId, questionId) =>
  api.get(`/session/hint/${sessionId}/${questionId}`);

export const getHistory = () =>
  api.get('/session/history/all');

// Interview APIs
export const submitAnswer = (data) =>
  api.post('/interview/submit-answer', data);

export const completeSession = (sessionId) =>
  api.post('/interview/complete', { sessionId });

// Resume APIs
export const analyzeResume = (formData) =>
  api.post('/resume/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const buildResume = (prompt) =>
  api.post('/resume/build', { prompt });

export default api;
