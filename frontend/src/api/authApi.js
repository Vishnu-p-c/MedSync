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

export const forgotPassword = async (identifier) => {
  try {
    const res = await axiosInstance.post('/password/forgot', { identifier });
    return res.data;
  } catch (err) {
    return {
      status: 'fail',
      message: err.response ? err.response.data?.message : 'Network Error',
    };
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const res = await axiosInstance.post('/password/reset', { token, newPassword });
    return res.data;
  } catch (err) {
    return {
      status: 'fail',
      message: err.response ? err.response.data?.message : 'Network Error',
    };
  }
};

export const verifyResetToken = async (token) => {
  try {
    const res = await axiosInstance.get(`/password/verify-token?token=${token}`);
    return res.data;
  } catch (err) {
    return {
      status: 'fail',
      message: err.response ? err.response.data?.message : 'Network Error',
    };
  }
};