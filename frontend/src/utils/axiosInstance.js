import axios from 'axios';

const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseURL = envBaseUrl && !String(envBaseUrl).includes('localhost') &&
        !String(envBaseUrl).includes('127.0.0.1') ?
    envBaseUrl :
    'https://medsync-android-backend.onrender.com';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
