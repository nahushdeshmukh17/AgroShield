const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  city:       { type: String, required: true },
  risk_level: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
  peak_day:   { type: String, required: true },
  advice:     { type: String },
  forecast:   [{ date: String, probability: Number }],
  weather:    [{ date: String, temp: Number, humidity: Number, rain: Number, wind: Number, condition: String }],
}, { timestamps: true });

module.exports = mongoose.model("Analysis", analysisSchema);
