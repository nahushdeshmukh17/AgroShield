const jwt = require("jsonwebtoken");
const User = require("../models/User");

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const signToken = (user) =>
  jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const user = await User.create({ name, email, password });
    res.cookie("token", signToken(user), COOKIE_OPTS);
    res.status(201).json({ ok: true, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: "Invalid credentials" });

    res.cookie("token", signToken(user), COOKIE_OPTS);
    res.json({ ok: true, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
};

const me = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};

module.exports = { register, login, logout, me };
