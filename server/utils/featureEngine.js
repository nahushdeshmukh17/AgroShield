const SEASON_MAP = { 12: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 3, 9: 3, 10: 3, 11: 3 };
// 0=winter, 1=spring, 2=summer, 3=monsoon

const generateFeatures = (weatherData) => {
  return weatherData.map((day, i) => {
    const temp     = day.temp;
    const humidity = day.humidity;
    const rain     = day.rain;
    const wind     = day.wind || 0;

    // Consecutive rainy days up to this point in the forecast
    let consecRain = 0;
    for (let j = i; j >= 0; j--) {
      if (weatherData[j].rain > 2) consecRain++;
      else break;
    }

    // Temp variance approximation: use wind as proxy (higher wind = more variance)
    const tempVariance = Math.min(wind * 0.25 + 3, 18);

    // Season from date
    const month  = new Date(day.date).getMonth() + 1;
    const season = SEASON_MAP[month] ?? 2;

    const rainFlag   = rain > 2 ? 1 : 0;
    const stressIndex = (temp * 0.4) + (humidity * 0.35) + (consecRain * 2.5) + (rainFlag * 8);

    return {
      date: day.date,
      features: [
        temp,
        humidity,
        rain,
        wind,
        consecRain,
        tempVariance,
        season,
        rainFlag,
        stressIndex,
      ]
    };
  });
};

module.exports = { generateFeatures };
