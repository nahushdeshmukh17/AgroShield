const axios = require("axios");

const getPrediction = async (features) => {
  try {
    const response = await axios.post("http://127.0.0.1:8000/predict", {
      features: features
    });

    return response.data.probabilities;

  } catch (error) {
    console.error("ML Error:", error.message);
    throw error;
  }
};

module.exports = { getPrediction };