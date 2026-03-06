import axiosInstance from '../utils/axiosInstance';

export const loginUser = async (username, password) => {
  try {
    const res = await axiosInstance.post('/login', {username, password});
    return res.data;
  } catch (err) {
    return {error: err.response ? err.response.data : 'Network Error'};
  }
};

export const registerAdmin = async (data) => {
  try {
    const res = await axiosInstance.post('/registeradmin', data);
    return res.data;
  } catch (err) {
    return {
      status: 'fail',
      message: err.response ? err.response.data : 'Network Error'
    };
  }
};