import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: `${BASE}/api`,
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cig_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Helper: absolute base for non-axios fetches (e.g. download links)
export const apiBase = `${BASE}/api`;
export const fileBase = BASE;
