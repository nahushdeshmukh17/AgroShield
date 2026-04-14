const express = require('express');
const axios = require('axios');
const router = express.Router();

// Existing pest model wrapper (if they had one) or new crop wrapper
router.post('/predict/crop', async (req, res) => {
  try {
    const { features } = req.body;
    
    // Forward the request to the Flask ML service
    const response = await axios.post('http://127.0.0.1:8000/predict/crop', { features });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error connecting to ML service:', error.message);
    const status = error.response ? error.response.status : 500;
    const data = error.response ? error.response.data : { error: 'Failed to connect to ML service. Is it running?' };
    res.status(status).json(data);
  }
});

module.exports = router;
