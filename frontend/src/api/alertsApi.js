import axiosInstance from '../utils/axiosInstance';

// Get all alerts
export const getAllAlerts = async (adminId) => {
  const response = await axiosInstance.get(`/alerts?admin_id=${adminId}`);
  return response.data;
};

// Get alerts summary for badge
export const getAlertsSummary = async (adminId) => {
  const response = await axiosInstance.get(`/alerts/summary?admin_id=${adminId}`);
  return response.data;
};

// Mark alert as read
export const markAlertRead = async (alertId, adminId) => {
  const response = await axiosInstance.post('/alerts/read', { 
    alert_id: alertId, 
    admin_id: adminId 
  });
  return response.data;
};
