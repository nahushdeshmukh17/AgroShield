import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

np.random.seed(42)

X = []
y = []

SEASONS = ["winter", "spring", "summer", "monsoon"]

for _ in range(5000):
    temp          = np.random.uniform(15, 42)
    humidity      = np.random.uniform(25, 98)
    rain_mm       = np.random.uniform(0, 80)
    wind_kph      = np.random.uniform(0, 60)
    consec_rain   = np.random.randint(0, 8)   # consecutive rainy days
    temp_variance = np.random.uniform(2, 18)  # day/night diff
    season        = np.random.randint(0, 4)   # 0=winter,1=spring,2=summer,3=monsoon
    rain_flag     = 1 if rain_mm > 2 else 0
    stress_index  = (temp * 0.4) + (humidity * 0.35) + (consec_rain * 2.5) + (rain_flag * 8)

    X.append([temp, humidity, rain_mm, wind_kph, consec_rain,
               temp_variance, season, rain_flag, stress_index])

    # ── Realistic agronomic pest outbreak logic ──────────────
    pest = 0

    # Aphids: warm + moderate humidity
    if 22 <= temp <= 32 and 55 <= humidity <= 80 and wind_kph < 20:
        pest = 1

    # Whitefly: hot + dry
    if temp > 30 and humidity < 55 and rain_flag == 0:
        pest = 1

    # Fungal pests (blight, mildew): high humidity + rain + warm
    if humidity > 75 and rain_flag == 1 and 20 <= temp <= 35:
        pest = 1

    # Bollworm: monsoon season + high temp
    if season == 3 and temp > 28 and humidity > 60:
        pest = 1

    # Thrips: hot + low wind + dry
    if temp > 32 and wind_kph < 10 and humidity < 50:
        pest = 1

    # Consecutive rain days increase fungal risk significantly
    if consec_rain >= 3 and humidity > 65:
        pest = 1

    # Very high wind reduces pest risk (disperses insects)
    if wind_kph > 45:
        pest = 0

    # Cold suppresses most pests
    if temp < 18:
        pest = 0

    y.append(pest)

print(f"Dataset: {len(X)} samples | Pest outbreak rate: {sum(y)/len(y)*100:.1f}%")

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = GradientBoostingClassifier(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=4,
    random_state=42
)
model.fit(X_train, y_train)

print("\nModel evaluation:")
print(classification_report(y_test, model.predict(X_test)))

joblib.dump(model, "model.pkl")
print("Model saved to model.pkl")
