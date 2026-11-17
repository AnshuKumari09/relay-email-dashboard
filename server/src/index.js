import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import emailRoutes from "./routes/emails.js";
import aiRoutes from "./routes/ai.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, groq: !!process.env.GROQ_API_KEY }));
app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/ai", rateLimit({ windowMs: 60_000, max: 30 }), aiRoutes);

// Serve the built React app in production (single-service deploy)
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
app.use(express.static(dist));
app.get("*", (req, res, next) => (req.path.startsWith("/api") ? next() : res.sendFile(path.join(dist, "index.html"))));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const port = process.env.PORT || 5000;
connectDB().then(() => app.listen(port, () => console.log(`Relay API on :${port}`))).catch((e) => {
  console.error("Startup failed:", e.message);
  process.exit(1);
});
