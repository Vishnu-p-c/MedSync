const express = require('express');
const router = express.Router();

/**
 * GET /config/frontend
 * Returns frontend configuration including API keys
 */
router.get('/frontend', (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        googleMapsApiKey: process.env.VITE_API_MAP || '',
        apiUrl: process.env.API_URL || 'http://localhost:5000'
      }
    });
  } catch (error) {
    console.error('Error fetching frontend config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration'
    });
  }
});

module.exports = router;
