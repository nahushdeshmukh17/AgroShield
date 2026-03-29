const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  city:       { type: String, required: true },
  risk_level: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
  peak_day:   { type: String, required: true },
  read:       { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Alert", alertSchema);
