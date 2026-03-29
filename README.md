# 🌾 AgroShield — AI-Powered Crop Pest Prediction System

AgroShield is a full-stack web application that predicts crop pest outbreak risk for the next 7 days using real-time weather data and a machine learning model. Farmers enter their city and crop type and receive a risk level, likely pest identification, and crop-specific treatment advice.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [System Architecture](#system-architecture)
- [ML Model](#ml-model)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [File Structure](#file-structure)
- [Auth Flow](#auth-flow)
- [Feature Engineering](#feature-engineering)

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | HTML, Tailwind CSS, Chart.js        |
| Backend     | Node.js, Express.js v5              |
| ML Service  | Python, Flask, scikit-learn         |
| Database    | MongoDB, Mongoose                   |
| Auth        | JWT, httpOnly Cookies, bcrypt       |
| Weather API | WeatherAPI.com                      |

---

## Prerequisites

Make sure the following are installed on your machine before proceeding:

- **Node.js** v18 or higher — https://nodejs.org
- **Python** 3.9 or higher — https://python.org
- **MongoDB** Community Edition (local) — https://www.mongodb.com/try/download/community
  - OR a free MongoDB Atlas cluster — https://cloud.mongodb.com
- **pip** (comes with Python)
- **Git** (optional)

Verify installations:
```bash
node -v
python --version
pip --version
mongod --version
```

---

## Installation

### 1. Clone or download the project

```bash
git clone https://github.com/yourname/agroshield.git
cd agroshield
```

### 2. Install Node.js dependencies

```bash
cd server
npm install
```

This installs:
- `express` — web framework
- `mongoose` — MongoDB ODM
- `jsonwebtoken` — JWT signing/verification
- `bcrypt` — password hashing
- `cookie-parser` — httpOnly cookie parsing
- `axios` — HTTP client for weather API and ML service
- `dotenv` — environment variable loader
- `cors` — cross-origin resource sharing

### 3. Install Python dependencies

```bash
cd ../ml-service
pip install flask scikit-learn numpy joblib
```

### 4. Train the ML model

This step generates `model.pkl` which the Flask server loads on startup. You must run this before starting the ML service.

```bash
cd ml-service
python train.py
```

Expected output:
```
Dataset: 5000 samples | Pest outbreak rate: 30.4%

Model evaluation:
              precision    recall  f1-score   support
           0       0.99      0.99      0.99       686
           1       0.98      0.98      0.98       314
    accuracy                           0.99      1000

Model saved to model.pkl
```

If you accidentally delete `model.pkl`, just run `python train.py` again.

### 5. Set up environment variables

Create a `.env` file inside the `server/` folder (already exists if you cloned):

```
API_KEY=your_weatherapi_key
MONGO_URI=mongodb://localhost:27017/agroshield
JWT_SECRET=your_secret_key_here
```

- Get a free WeatherAPI key at https://www.weatherapi.com (free plan gives 7-day forecast)
- `MONGO_URI` — use `mongodb://localhost:27017/agroshield` for local MongoDB, or your Atlas connection string
- `JWT_SECRET` — any long random string, e.g. `agroshield_super_secret_2024`

### 6. Start MongoDB

If using local MongoDB:
```bash
# Windows
net start MongoDB

# Or start manually
mongod --dbpath C:\data\db
```

---

## Running the Project

You need **two terminals** running simultaneously.

### Terminal 1 — ML Service (Python/Flask)

```bash
cd agroshield/ml-service
python app.py
```

Expected output:
```
 * Running on http://127.0.0.1:8000
```

Keep this running. The Node server calls this internally on every prediction request.

### Terminal 2 — Node.js Server

```bash
cd agroshield/server
node index.js
```

Expected output:
```
MongoDB connected
Server running on port 5000
```

The browser will automatically open `http://localhost:5000` which serves the login page.

---

## Environment Variables

| Variable    | Description                              | Example                                      |
|-------------|------------------------------------------|----------------------------------------------|
| `API_KEY`   | WeatherAPI.com API key                   | `d06cd1bc86d44680a0052657262903`             |
| `MONGO_URI` | MongoDB connection string                | `mongodb://localhost:27017/agroshield`        |
| `JWT_SECRET`| Secret key for signing JWT tokens        | `agroshield_super_secret_2024`               |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                        │
│                                                                 │
│  login.html ──► home.html ──► dashboard.html                   │
│                                    │                            │
│              Tailwind CSS + Chart.js + Vanilla JS               │
└────────────────────────┬────────────────────────────────────────┘
                         │  HTTP requests (cookies for auth)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS SERVER  (port 5000)                  │
│                         Express.js v5                           │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Page Routes│  │  API Routes  │  │  Middleware            │  │
│  │             │  │              │  │                        │  │
│  │ GET /       │  │ POST         │  │ cookie-parser          │  │
│  │ → login.html│  │ /api/auth    │  │ express.json()         │  │
│  │             │  │ /register    │  │ express.static()       │  │
│  │ GET /home   │  │ /login       │  │ auth middleware (JWT)  │  │
│  │ → guard →   │  │ /logout      │  │                        │  │
│  │   home.html │  │              │  └───────────────────────┘  │
│  │             │  │ GET          │                              │
│  │ GET /dash   │  │ /api/weather │                              │
│  │ → guard →   │  │ ?city=&crop= │                              │
│  │   dash.html │  │              │                              │
│  └─────────────┘  │ GET          │                              │
│                   │ /api/history │                              │
│                   │ /api/alerts  │                              │
│                   └──────┬───────┘                              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│  WEATHERAPI  │  │   MONGODB    │  │  PYTHON ML SERVICE       │
│  (External)  │  │  (Local/     │  │  (port 8000)             │
│              │  │   Atlas)     │  │                          │
│ 7-day        │  │              │  │  Flask + scikit-learn    │
│ forecast for │  │  Collections:│  │                          │
│ any city     │  │  - users     │  │  POST /predict           │
│              │  │  - analyses  │  │  → GradientBoosting      │
│ Returns:     │  │  - alerts    │  │    Classifier            │
│ temp,        │  │              │  │  → returns probability   │
│ humidity,    │  │  Stores:     │  │    per day [0.0 - 1.0]   │
│ rain,        │  │  - user auth │  │                          │
│ wind,        │  │  - all past  │  │  GET /health             │
│ condition    │  │    analyses  │  │  → { status: "ok" }      │
└──────────────┘  │  - alerts    │  └──────────────────────────┘
                  └──────────────┘
```

### Request Flow — Prediction

```
User types city + selects crop → clicks Analyze
        │
        ▼
GET /api/weather?city=Pune&crop=rice
        │
        ▼
weatherController.js
        │
        ├─► weatherService.js
        │       │
        │       ├─ Check in-memory cache (1 hour TTL)
        │       │   └─ HIT  → return cached data
        │       │   └─ MISS → call WeatherAPI → cache → return
        │       │
        │       └─ Returns: [{ date, temp, humidity, rain, wind, condition, icon }] × 7
        │
        ├─► featureEngine.js
        │       │
        │       └─ For each day, compute 9 features:
        │           [temp, humidity, rain_mm, wind_kph, consec_rain,
        │            temp_variance, season, rain_flag, stress_index]
        │
        ├─► mlService.js
        │       │
        │       └─ POST http://127.0.0.1:8000/predict
        │               { features: [[...], [...], ...] }  ← 7 arrays
        │               Returns: { probabilities: [0.12, 0.67, ...] }
        │
        ├─► outputFormatter.js
        │       │
        │       ├─ Find peak probability day
        │       ├─ Assign risk level: >0.65=HIGH, >0.35=MEDIUM, else LOW
        │       ├─ Detect likely pest from weather pattern
        │       └─ Select crop-specific advice string
        │
        ├─► Save Analysis to MongoDB (if user logged in)
        ├─► Save Alert to MongoDB (if risk is HIGH or MEDIUM)
        │
        └─► Return JSON response to browser
```

---

## ML Model

### Algorithm
**GradientBoostingClassifier** (scikit-learn)
- 200 estimators
- Learning rate: 0.05
- Max depth: 4
- Trained on 5000 synthetic samples with agronomic pest logic

### Input Features (9 total)

| # | Feature         | Description                                      |
|---|-----------------|--------------------------------------------------|
| 1 | `temp`          | Average temperature (°C)                         |
| 2 | `humidity`      | Average relative humidity (%)                    |
| 3 | `rain_mm`       | Total precipitation (mm)                         |
| 4 | `wind_kph`      | Max wind speed (km/h)                            |
| 5 | `consec_rain`   | Consecutive rainy days up to this forecast day   |
| 6 | `temp_variance` | Estimated day/night temperature difference       |
| 7 | `season`        | 0=Winter, 1=Spring, 2=Summer, 3=Monsoon          |
| 8 | `rain_flag`     | 1 if rain > 2mm, else 0                          |
| 9 | `stress_index`  | Combined stress score (temp + humidity + rain)   |

### Pest Logic (Training Labels)

| Pest Type              | Trigger Conditions                                      |
|------------------------|---------------------------------------------------------|
| Aphids                 | Temp 22–32°C, Humidity 55–80%, Wind < 20 km/h          |
| Whitefly               | Temp > 30°C, Humidity < 55%, No rain                   |
| Fungal (Blight/Mildew) | Humidity > 75%, Rain present, Temp 20–35°C             |
| Bollworm               | Monsoon season, Temp > 28°C, Humidity > 60%            |
| Thrips                 | Temp > 32°C, Wind < 10 km/h, Humidity < 50%            |
| Suppressed             | Wind > 45 km/h OR Temp < 18°C → pest = 0               |

### Output
- Probability per day: `0.0` (no risk) to `1.0` (certain outbreak)
- Risk level: `HIGH` (>0.65), `MEDIUM` (>0.35), `LOW` (≤0.35)

### Retrain
```bash
cd ml-service
python train.py
```

---

## API Reference

### Auth

| Method | Endpoint              | Body                          | Description              |
|--------|-----------------------|-------------------------------|--------------------------|
| POST   | `/api/auth/register`  | `{ name, email, password }`   | Register, sets cookie    |
| POST   | `/api/auth/login`     | `{ email, password }`         | Login, sets cookie       |
| POST   | `/api/auth/logout`    | —                             | Clears cookie            |
| GET    | `/api/auth/me`        | —                             | Get current user (auth)  |

### Weather / Prediction

| Method | Endpoint         | Query Params         | Description                        |
|--------|------------------|----------------------|------------------------------------|
| GET    | `/api/weather`   | `city`, `crop`       | Run prediction for city + crop     |


### Analyses
```
{
  user:       ObjectId → User
  city:       String
  risk_level: "LOW" | "MEDIUM" | "HIGH"
  peak_day:   String (YYYY-MM-DD)
  advice:     String
  forecast:   [{ date, probability }]
  weather:    [{ date, temp, humidity, rain, wind, condition }]
  createdAt:  Date
}
```

### Alerts
```
{
  user:       ObjectId → User
  city:       String
  risk_level: "MEDIUM" | "HIGH"
  peak_day:   String
  read:       Boolean (default: false)
  createdAt:  Date
}
```

---

## File Structure

```
agroshield/
│
├── ml-service/
│   ├── app.py          # Flask server — exposes /predict and /health
│   ├── train.py        # Model training script — generates model.pkl
│   ├── model.pkl       # Trained GradientBoosting model (generated)
│   └── utils.py        # (reserved for future helpers)
│
└── server/
    ├── config/
    │   └── config.js           # MongoDB connection (connectDB)
    │
    ├── controllers/
    │   ├── authController.js   # register, login, logout, me
    │   └── weatherController.js# prediction pipeline + DB save
    │
    ├── middleware/
    │   └── auth.js             # JWT verification from httpOnly cookie
    │
    ├── models/
    │   ├── User.js             # User schema + bcrypt hooks
    │   ├── Analysis.js         # Prediction result schema
    │   └── Alert.js            # Risk alert schema
    │
    ├── routes/
    │   ├── authRoutes.js       # /api/auth/*
    │   ├── weatherRoutes.js    # /api/weather
    │   └── historyRoutes.js    # /api/history, /api/history/alerts
    │
    ├── services/
    │   ├── weatherService.js   # WeatherAPI call + 1hr in-memory cache
    │   └── mlService.js        # HTTP call to Python Flask /predict
    │
    ├── utils/
    │   ├── featureEngine.js    # Raw weather → 9 ML features
    │   └── outputFormatter.js  # Probabilities → risk level + advice
    │
    ├── public/
    │   ├── login.html          # Login page
    │   ├── register.html       # Register page
    │   ├── home.html           # Landing/main screen
    │   ├── dashboard.html      # App shell with 7 tabs
    │   ├── dashboard.js        # All tab logic + predict function
    │   └── styles.css          # Shared component styles
    │
    ├── .env                    # API_KEY, MONGO_URI, JWT_SECRET
    ├── index.js                # Server entry — routes, guards, DB connect
    └── package.json
```

---

## Auth Flow

```
1. User visits localhost:5000
        │
        └─► Server serves login.html directly (no redirect)

2. User registers / logs in
        │
        └─► Server creates JWT → sets as httpOnly cookie (7 days)
            Browser cannot access this cookie via JavaScript
            └─► Redirect to /home.html

3. User clicks "Launch App"
        │
        └─► GET /dashboard.html
            Server checks cookie → valid JWT → serve dashboard
            No valid JWT → redirect to /login.html

4. User logs out
        │
        └─► POST /api/auth/logout
            Server clears cookie
            └─► Redirect to /home.html

5. Direct URL access attempt (e.g. /dashboard.html without login)
        │
        └─► Server-side guard rejects → redirect to /login.html
            No client-side JS needed for protection
```

---

## Feature Engineering Detail

For each of the 7 forecast days, `featureEngine.js` computes:

```
consec_rain   = count backwards from current day while rain > 2mm
temp_variance = min(wind * 0.25 + 3, 18)   ← wind as proxy for day/night diff
season        = derived from month:
                  Dec/Jan/Feb → 0 (Winter)
                  Mar/Apr/May → 1 (Spring)
                  Jun/Jul     → 2 (Summer)
                  Aug–Nov     → 3 (Monsoon)
rain_flag     = 1 if rain > 2mm else 0
stress_index  = (temp × 0.4) + (humidity × 0.35) + (consec_rain × 2.5) + (rain_flag × 8)
```

These 9 values are sent to the Python ML service as a flat array per day.





---

Made by Nahush with a cup of chai ☕… but where’s the bottle of rum? 🏴‍☠️