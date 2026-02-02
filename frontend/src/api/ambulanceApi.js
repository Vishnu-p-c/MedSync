import axiosInstance from '../utils/axiosInstance';

/**
 * Fetch all ambulance drivers near the admin's hospital
 * @param {string|number} adminId - The admin's user ID
 * @param {number} maxDistance - Optional maximum distance in km
 * @returns {Promise<Object>} Response containing drivers data
 */
export const getDriversNearHospital = async (adminId, maxDistance = 50) => {
    try {
        const response = await axiosInstance.get('/admin/ambulance/drivers', {
            params: {
                admin_id: adminId,
                max_distance: maxDistance
            }
        });

        if (response.data.status === 'success') {
            return {
                success: true,
                data: response.data.data,
                hospitalName: response.data.hospital_name,
                totalDrivers: response.data.total_drivers,
                activeDrivers: response.data.active_drivers,
                inactiveDrivers: response.data.inactive_drivers
            };
        }

        return {
            success: false,
            message: response.data.message || 'Failed to fetch drivers'
        };
    } catch (error) {
        console.error('Error fetching drivers near hospital:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Network error occurred'
        };
    }
};

/**
 * Fetch summary statistics for ambulance drivers
 * @param {string|number} adminId - The admin's user ID
 * @returns {Promise<Object>} Response containing summary data
 */
export const getDriversSummary = async (adminId) => {
    try {
        const response = await axiosInstance.get('/admin/ambulance/summary', {
            params: { admin_id: adminId }
        });

        if (response.data.status === 'success') {
            return {
                success: true,
                data: response.data.data
            };
        }

        return {
            success: false,
            message: response.data.message || 'Failed to fetch summary'
        };
    } catch (error) {
        console.error('Error fetching drivers summary:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Network error occurred'
        };
    }
};

/**
 * Update a driver's active/inactive status
 * @param {string|number} driverId - The driver's ID
 * @param {boolean} isActive - The new active status
 * @returns {Promise<Object>} Response containing update result
 */
export const updateDriverStatus = async (driverId, isActive) => {
    try {
        const response = await axiosInstance.put('/admin/ambulance/driver-status', {
            driver_id: driverId,
            is_active: isActive
        });

        if (response.data.status === 'success') {
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        }

        return {
            success: false,
            message: response.data.message || 'Failed to update driver status'
        };
    } catch (error) {
        console.error('Error updating driver status:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Network error occurred'
        };
    }
};
