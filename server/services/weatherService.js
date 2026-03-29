const axios = require("axios");

const cache = new Map(); // city -> { data, expiresAt }
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const fetchWeather = async (city) => {
  const key = city.toLowerCase().trim();

  if (cache.has(key) && cache.get(key).expiresAt > Date.now()) {
    console.log(`[Cache HIT] ${city}`);
    return cache.get(key).data;
  }

  const url = `http://api.weatherapi.com/v1/forecast.json?key=${process.env.API_KEY}&q=${city}&days=7&aqi=no&alerts=no`;
  const response = await axios.get(url);

  const simplified = response.data.forecast.forecastday.map(day => ({
    date:      day.date,
    temp:      day.day.avgtemp_c,
    humidity:  day.day.avghumidity,
    rain:      day.day.totalprecip_mm,
    wind:      day.day.maxwind_kph,
    condition: day.day.condition.text,
    icon:      day.day.condition.icon,
  }));

  cache.set(key, { data: simplified, expiresAt: Date.now() + CACHE_TTL });
  console.log(`[Cache MISS] ${city} — fetched from API`);

  return simplified;
};

module.exports = { fetchWeather };
