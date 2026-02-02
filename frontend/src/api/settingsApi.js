import axiosInstance from '../utils/axiosInstance';

// Get user profile
export const getProfile = async (userId) => {
  const response = await axiosInstance.get(`/settings/profile?user_id=${userId}`);
  return response.data;
};

// Update user profile
export const updateProfile = async (profileData) => {
  const response = await axiosInstance.put('/settings/profile', profileData);
  return response.data;
};

// Change password
export const changePassword = async (passwordData) => {
  const response = await axiosInstance.put('/settings/password', passwordData);
  return response.data;
};

// Get hospital info
export const getHospitalInfo = async (adminId) => {
  const response = await axiosInstance.get(`/settings/hospital?admin_id=${adminId}`);
  return response.data;
};

// Update hospital info
export const updateHospitalInfo = async (hospitalData) => {
  const response = await axiosInstance.put('/settings/hospital', hospitalData);
  return response.data;
};
