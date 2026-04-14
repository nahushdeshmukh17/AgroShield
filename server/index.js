require("dotenv").config();
const path = require("path");
const { exec } = require("child_process");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const connectDB = require("./config/config");
const weatherRoutes = require("./routes/weatherRoutes");
const authRoutes = require("./routes/authRoutes");
const historyRoutes = require("./routes/historyRoutes");
const mlRoutes = require("./routes/mlRoutes");

const app = express();
app.use(express.json());
app.use(cookieParser());

// ── Helper ──────────────────────────────────────────────────
const isLoggedIn = (req) => {
  try {
    jwt.verify(req.cookies?.token, process.env.JWT_SECRET);
    return true;
  } catch { return false; }
};

// ── Page routes (server-side guards) ───────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/login.html", (req, res) => {
  if (isLoggedIn(req)) return res.redirect("/home.html");
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register.html", (req, res) => {
  if (isLoggedIn(req)) return res.redirect("/home.html");
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/home.html", (req, res) => {
  if (!isLoggedIn(req)) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/dashboard.html", (req, res) => {
  if (!isLoggedIn(req)) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ── Static assets (css, js) ─────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ── API routes ──────────────────────────────────────────────
app.use("/api/weather", weatherRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/ml", mlRoutes);

connectDB().then(() => {
  app.listen(5000, () => {
    console.log("Server running on port 5000");
    exec("start http://localhost:5000");
  });
});
