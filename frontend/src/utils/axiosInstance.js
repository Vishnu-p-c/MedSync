import axios from 'axios';

// Always use production backend URL
const baseURL = 'https://medsync-android-backend.onrender.com';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
