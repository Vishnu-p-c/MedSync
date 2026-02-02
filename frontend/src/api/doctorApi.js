import axiosInstance from '../utils/axiosInstance';

/**
 * Doctor API Service
 * Handles all doctor-related API calls for the admin dashboard
 */

/**
 * Get all doctors for the admin's hospital/clinic
 * @param {string|number} adminId - The admin's user ID
 * @returns {Promise<Object>} - Array of doctors with their details
 */
export const getDoctorsForAdmin = async (adminId) => {
    try {
        const response = await axiosInstance.get(`/admin/dashboard/doctors?admin_id=${adminId}`);
        if (response.data.status === 'success') {
            return {
                success: true,
                data: response.data.data,
                count: response.data.count
            };
        }
        return { success: false, error: response.data.message };
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Network error'
        };
    }
};

/**
 * Search doctors by name, department, or status
 * @param {string|number} adminId - The admin's user ID
 * @param {string} searchQuery - The search query
 * @param {string} filterBy - Filter by 'department' or 'status'
 * @param {string} filterValue - The filter value
 * @returns {Promise<Object>} - Filtered array of doctors
 */
export const searchDoctors = async (adminId, searchQuery = '', filterBy = '', filterValue = '') => {
    try {
        let url = `/admin/dashboard/doctors?admin_id=${adminId}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        if (filterBy && filterValue) url += `&filterBy=${filterBy}&filterValue=${encodeURIComponent(filterValue)}`;
        
        const response = await axiosInstance.get(url);
        if (response.data.status === 'success') {
            return {
                success: true,
                data: response.data.data,
                count: response.data.count
            };
        }
        return { success: false, error: response.data.message };
    } catch (error) {
        console.error('Error searching doctors:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Network error'
        };
    }
};

/**
 * Get unique departments for filtering
 * @param {string|number} adminId - The admin's user ID
 * @returns {Promise<Object>} - Array of unique department names
 */
export const getDepartments = async (adminId) => {
    try {
        const response = await axiosInstance.get(`/admin/dashboard/doctors/departments?admin_id=${adminId}`);
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
            error: error.response?.data?.message || 'Network error'
        };
    }
};

/**
 * Add a new doctor to the admin's hospital/clinic
 * @param {Object} doctorData - The doctor data to add
 * @returns {Promise<Object>} - Result of the operation
 */
export const addDoctor = async (doctorData) => {
    try {
        const response = await axiosInstance.post('/admin/dashboard/doctors/add', doctorData);
        if (response.data.status === 'success') {
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        }
        return { 
            success: false, 
            error: response.data.message 
        };
    } catch (error) {
        console.error('Error adding doctor:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Network error'
        };
    }
};

export default {
    getDoctorsForAdmin,
    searchDoctors,
    getDepartments,
    addDoctor
};
