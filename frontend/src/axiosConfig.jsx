import axios from 'axios';

export const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL || '';
export const API_BASE_URL = `${BACKEND_BASE_URL}/api`;
export const UPLOADS_BASE_URL = `${BACKEND_BASE_URL}/uploads`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Important for image upload:
    // If request body is FormData, do not force application/json.
    // Let the browser set multipart/form-data with the correct boundary.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;