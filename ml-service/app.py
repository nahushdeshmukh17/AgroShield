from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

# Load the existing pest model
try:
    model = joblib.load("model.pkl")
except Exception as e:
    model = None
    print(f"Warning: failed to load model.pkl. {e}")

# Load the new crop recommendation model
try:
    crop_model = joblib.load("crop_model.pkl")
except Exception as e:
    crop_model = None
    print(f"Warning: failed to load crop_model.pkl. Run train_crop.py to generate it. {e}")

@app.route("/predict", methods=["POST"])
def predict():
    if not model:
        return jsonify({"error": "Pest model not loaded"}), 500
    data = request.json["features"]
    results = []
    for f in data:
        prob = float(model.predict_proba([f])[0][1])
        results.append(round(prob, 4))
    return jsonify({ "probabilities": results })

@app.route("/predict/crop", methods=["POST"])
def predict_crop():
    if not crop_model:
        return jsonify({"error": "Crop model not trained yet. Please run train_crop.py first."}), 500
    
    data = request.json.get("features")
    if not data or len(data) != 9:
        return jsonify({"error": "Please provide exactly 9 features in order: N, P, K, temperature, humidity, ph, rainfall, soil_moisture, soil_type"}), 400
    
    prediction = crop_model.predict([data])[0]
    return jsonify({ "prediction": str(prediction) })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({ "status": "ok", "pest_model": model is not None, "crop_model": crop_model is not None })

if __name__ == "__main__":
    app.run(port=8000, debug=False)
