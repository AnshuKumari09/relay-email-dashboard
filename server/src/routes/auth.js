import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { wrap } from "../middleware/wrap.js";

const r = Router();
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, clientName: u.clientName, account: u.account });
const fail = (res, code, error) => res.status(code).json({ error });

r.post("/signup", wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return fail(res, 400, "Name, email and a 6+ character password are required");
  if (await User.exists({ email: email.toLowerCase() })) return fail(res, 409, "Email already registered");
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.json({ token: sign(u), user: pub(u) });
}));

r.post("/login", wrap(async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || "").toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || "", u.password))) return fail(res, 401, "Wrong email or password");
  res.json({ token: sign(u), user: pub(u) });
}));

// One-click demo account for reviewers
r.post("/demo", wrap(async (_req, res) => {
  let u = await User.findOne({ email: "demo@relay.app" });
  if (!u) u = await User.create({ name: "Priya", email: "demo@relay.app", password: await bcrypt.hash("demo-" + Date.now(), 10) });
  res.json({ token: sign(u), user: pub(u) });
}));

r.get("/me", auth, wrap(async (req, res) => {
  const u = await User.findById(req.userId);
  if (!u) return fail(res, 401, "User not found");
  res.json(pub(u));
}));

export default r;
