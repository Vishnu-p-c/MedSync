import axiosInstance from '../utils/axiosInstance';

/**
 * Doctor Registration API Service
 * Handles all API calls for registering new doctors by admin
 */

/**
 * Register a new doctor
 * @param {Object} doctorData - Doctor registration data
 * @returns {Promise<Object>} - Registration result
 */
export const registerNewDoctor = async (doctorData) => {
  try {
    const response = await axiosInstance.post('/admin/doctor-registration/add', doctorData);
    if (response.data.status === 'success') {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    }
    return { 
      success: false, 
      error: response.data.message,
      missing: response.data.missing 
    };
  } catch (error) {
    console.error('Error registering doctor:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'network_error',
      missing: error.response?.data?.missing
    };
  }
};

/**
 * Get list of hospitals for dropdown
 * @param {string|number} adminId - The admin's user ID
 * @returns {Promise<Object>} - List of hospitals
 */
export const getHospitalsForRegistration = async (adminId) => {
  try {
    const response = await axiosInstance.get(`/admin/doctor-registration/hospitals?admin_id=${adminId}`);
    if (response.data.status === 'success') {
      return {
        success: true,
        data: response.data.data
      };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'network_error'
    };
  }
};

/**
 * Get list of clinics for dropdown
 * @param {string|number} adminId - The admin's user ID
 * @returns {Promise<Object>} - List of clinics
 */
export const getClinicsForRegistration = async (adminId) => {
  try {
    const response = await axiosInstance.get(`/admin/doctor-registration/clinics?admin_id=${adminId}`);
    if (response.data.status === 'success') {
      return {
        success: true,
        data: response.data.data
      };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'network_error'
    };
  }
};

/**
 * Get list of departments for dropdown
 * @param {string|number} adminId - The admin's user ID
 * @returns {Promise<Object>} - List of departments
 */
export const getDepartmentsForRegistration = async (adminId) => {
  try {
    const response = await axiosInstance.get(`/admin/doctor-registration/departments?admin_id=${adminId}`);
    if (response.data.status === 'success') {
      return {
        success: true,
        data: response.data.data
      };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Error fetching departments:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'network_error'
    };
  }
};

/**
 * Validate if MRN is unique
 * @param {string} mrn - Medical Record Number
 * @returns {Promise<Object>} - Validation result
 */
export const validateDoctorMrn = async (mrn) => {
  try {
    const response = await axiosInstance.post('/admin/doctor-registration/validate-mrn', { mrn });
    return {
      success: true,
      isUnique: response.data.isUnique
    };
  } catch (error) {
    console.error('Error validating MRN:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'network_error'
    };
  }
};

/**
 * Validate if username is unique
 * @param {string} username - Username to validate
 * @returns {Promise<Object>} - Validation result
 */
export const validateDoctorUsername = async (username) => {
  try {
    const response = await axiosInstance.post('/admin/doctor-registration/validate-username', { username });
    return {
      success: true,
      isUnique: response.data.isUnique
    };
  } catch (error) {
    console.error('Error validating username:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'network_error'
    };
  }
};

/**
 * Validate if email is unique
 * @param {string} email - Email to validate
 * @returns {Promise<Object>} - Validation result
 */
export const validateDoctorEmail = async (email) => {
  try {
    const response = await axiosInstance.post('/admin/doctor-registration/validate-email', { email });
    return {
      success: true,
      isUnique: response.data.isUnique
    };
  } catch (error) {
    console.error('Error validating email:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'network_error'
    };
  }
};

export default {
  registerNewDoctor,
  getHospitalsForRegistration,
  getClinicsForRegistration,
  getDepartmentsForRegistration,
  validateDoctorMrn,
  validateDoctorUsername,
  validateDoctorEmail
};
