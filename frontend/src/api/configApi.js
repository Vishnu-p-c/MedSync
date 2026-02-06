import axiosInstance from '../utils/axiosInstance';

/**
 * Fetches frontend configuration from backend
 * Includes Google Maps API key and other runtime configs
 * @returns {Promise<{success: boolean, config: object}>}
 */
export const getFrontendConfig = async () => {
  try {
    const response = await axiosInstance.get('/config/frontend');
    return response.data;
  } catch (error) {
    console.error('Error fetching frontend config:', error);
    return {success: false, config: {googleMapsApiKey: '', apiUrl: ''}};
  }
};
