from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)
model = joblib.load("model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json["features"]
    results = []
    for f in data:
        prob = float(model.predict_proba([f])[0][1])
        results.append(round(prob, 4))
    return jsonify({ "probabilities": results })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({ "status": "ok" })

if __name__ == "__main__":
    app.run(port=8000, debug=False)
