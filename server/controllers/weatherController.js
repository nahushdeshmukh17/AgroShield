const { fetchWeather } = require("../services/weatherService");
const { generateFeatures } = require("../utils/featureEngine");
const { getPrediction } = require("../services/mlService");
const { formatOutput } = require("../utils/outputFormatter");
const Analysis = require("../models/Analysis");
const Alert = require("../models/Alert");
const jwt = require("jsonwebtoken");

const getWeather = async (req, res) => {
  try {
    const city = (req.query.city || "").trim();
    const crop = (req.query.crop || "general").trim();

    if (!city) return res.status(400).json({ error: "City is required" });

    const weatherData  = await fetchWeather(city);
    const featureData  = generateFeatures(weatherData);
    const probabilities = await getPrediction(featureData.map(f => f.features));
    const finalOutput  = formatOutput(weatherData, probabilities, crop);

    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await Analysis.create({
          user:        decoded.id,
          city,
          risk_level:  finalOutput.risk_level,
          peak_day:    finalOutput.peak_day,
          advice:      finalOutput.advice,
          forecast:    finalOutput.forecast,
          weather:     finalOutput.weather,
        });
        if (finalOutput.risk_level !== "LOW") {
          await Alert.create({
            user:       decoded.id,
            city,
            risk_level: finalOutput.risk_level,
            peak_day:   finalOutput.peak_day,
          });
        }
      } catch { /* skip saving if token invalid */ }
    }

    res.json(finalOutput);
  } catch (error) {
    const msg = error.response?.status === 400
      ? "City not found. Please enter a valid city name."
      : "Failed to fetch weather data. Try again.";
    res.status(400).json({ error: msg });
  }
};

module.exports = { getWeather };
