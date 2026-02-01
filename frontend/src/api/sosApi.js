import axiosInstance from '../utils/axiosInstance';

/**
 * SOS API Service
 * Handles all SOS-related API calls for the admin dashboard
 */

/**
 * Get SOS requests summary (counts by status)
 * @param {string|number} adminId - The admin's user ID
 * @returns {Promise<Object>} - { total, pending, inProgress, assigned, completed, cancelled }
 */
export const getSosSummary = async (adminId) => {
    try {
        const response = await axiosInstance.get(`/sos/summary?admin_id=${adminId}`);
        if (response.data.status === 'success') {
            return {
                success: true,
                data: response.data.data
            };
        }
        return { success: false, error: response.data.message };
    } catch (error) {
        console.error('Error fetching SOS summary:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Network error'
        };
    }
};

/**
 * Get recent SOS requests list
 * @param {string|number} adminId - The admin's user ID
 * @param {number} limit - Number of records to fetch (default: 10)
 * @returns {Promise<Object>} - Array of recent SOS requests
 */
export const getRecentSosRequests = async (adminId, limit = 10) => {
    try {
        const response = await axiosInstance.get(`/sos/recent?admin_id=${adminId}&limit=${limit}`);
        if (response.data.status === 'success') {
            return {
                success: true,
                data: response.data.data,
                count: response.data.count
            };
        }
        return { success: false, error: response.data.message };
    } catch (error) {
        console.error('Error fetching recent SOS requests:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Network error'
        };
    }
};

/**
 * Get SOS requests breakdown by severity
 * @param {string|number} adminId - The admin's user ID
 * @returns {Promise<Object>} - { critical, severe, moderate, mild, unknown }
 */
export const getSosBySeverity = async (adminId) => {
    try {
        const response = await axiosInstance.get(`/sos/severity?admin_id=${adminId}`);
        if (response.data.status === 'success') {
            return {
                success: true,
                data: response.data.data
            };
        }
        return { success: false, error: response.data.message };
    } catch (error) {
        console.error('Error fetching SOS by severity:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Network error'
        };
    }
};
