const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Analysis = require("../models/Analysis");
const Alert = require("../models/Alert");

// GET /api/history — last 20 analyses for logged-in user
router.get("/", auth, async (req, res) => {
  const analyses = await Analysis.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("city risk_level peak_day createdAt");
  res.json(analyses);
});

// GET /api/alerts — unread alerts for logged-in user
router.get("/alerts", auth, async (req, res) => {
  const alerts = await Alert.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(alerts);
});

// PATCH /api/alerts/:id/read
router.patch("/alerts/:id/read", auth, async (req, res) => {
  await Alert.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true });
  res.json({ ok: true });
});

module.exports = router;
