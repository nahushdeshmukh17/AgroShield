const PEST_ADVICE = {
  rice:   {
    HIGH:   "High risk of Brown Planthopper and Blast disease. Apply Carbofuran or Chlorpyrifos immediately. Drain fields partially.",
    MEDIUM: "Moderate risk of stem borer. Apply neem-based spray. Monitor water levels closely.",
    LOW:    "Low risk. Maintain field hygiene and routine monitoring every 3 days.",
  },
  wheat:  {
    HIGH:   "High risk of Aphids and Yellow Rust. Apply Dimethoate 30 EC. Avoid overhead irrigation.",
    MEDIUM: "Moderate risk of Aphids. Apply neem oil spray (5ml/L). Check flag leaves daily.",
    LOW:    "Low risk. Continue routine scouting. No action needed.",
  },
  cotton: {
    HIGH:   "High risk of Bollworm and Whitefly. Apply Spinosad or Emamectin Benzoate. Set pheromone traps.",
    MEDIUM: "Moderate Whitefly risk. Apply yellow sticky traps. Spray neem oil.",
    LOW:    "Low risk. Monitor for early signs of leaf curl virus.",
  },
  tomato: {
    HIGH:   "High risk of Early Blight and Thrips. Apply Mancozeb + Imidacloprid. Remove infected leaves.",
    MEDIUM: "Moderate risk of Leaf Miner. Apply Abamectin. Ensure proper spacing for airflow.",
    LOW:    "Low risk. Maintain proper irrigation schedule.",
  },
  maize:  {
    HIGH:   "High risk of Fall Armyworm. Apply Chlorantraniliprole in whorls. Scout daily.",
    MEDIUM: "Moderate risk of Stem Borer. Apply Carbofuran granules in whorls.",
    LOW:    "Low risk. Check for egg masses on leaves weekly.",
  },
  general: {
    HIGH:   "High pest risk detected. Apply recommended pesticides immediately and increase field monitoring to twice daily.",
    MEDIUM: "Moderate risk. Start preventive measures — neem oil spray and daily monitoring.",
    LOW:    "Low risk. Regular monitoring is sufficient. No immediate action needed.",
  },
};

const detectLikelyPest = (weatherData) => {
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const avgTemp     = avg(weatherData.map(d => d.temp));
  const avgHumidity = avg(weatherData.map(d => d.humidity));
  const avgWind     = avg(weatherData.map(d => d.wind || 0));
  const rainyDays   = weatherData.filter(d => d.rain > 2).length;

  if (avgHumidity > 75 && rainyDays >= 3) return "Fungal disease (Blight/Mildew)";
  if (avgTemp > 30 && avgHumidity < 55)   return "Whitefly / Thrips";
  if (avgTemp >= 22 && avgTemp <= 32 && avgHumidity >= 55 && avgWind < 20) return "Aphids";
  if (rainyDays >= 2 && avgTemp > 28)     return "Bollworm / Stem Borer";
  return "General pest pressure";
};

const formatOutput = (weatherData, probabilities, crop = "general") => {
  const result = weatherData.map((day, i) => ({
    date: day.date,
    probability: probabilities[i],
  }));

  const maxProb   = Math.max(...probabilities);
  const peakIndex = probabilities.indexOf(maxProb);

  const riskLevel = maxProb > 0.65 ? "HIGH" : maxProb > 0.35 ? "MEDIUM" : "LOW";

  const cropKey   = PEST_ADVICE[crop] ? crop : "general";
  const advice    = PEST_ADVICE[cropKey][riskLevel];
  const likelyPest = detectLikelyPest(weatherData);

  return {
    forecast:    result,
    weather:     weatherData,
    peak_day:    weatherData[peakIndex].date,
    risk_level:  riskLevel,
    advice,
    likely_pest: likelyPest,
    crop,
  };
};

module.exports = { formatOutput };
