import axios from 'axios';
import { ACCESS_TOKEN } from './constants.js';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

const PUBLIC_ENDPOINTS = [
    '/api/user/password_reset/',
    '/api/user/token/',
    '/api/user/password_reset_confirm/',
    '/api/user/activate/',
];

api.interceptors.request.use(
    (config) => {
        const isPublic = PUBLIC_ENDPOINTS.some(endpoint =>
            config.url?.includes(endpoint)
        );

        if (!isPublic) {
            const token = localStorage.getItem(ACCESS_TOKEN);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
