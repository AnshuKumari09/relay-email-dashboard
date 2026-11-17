import jwt from "jsonwebtoken";
export default function auth(req, res, next) {
  const h = req.headers.authorization || "";
  try {
    req.userId = jwt.verify(h.replace("Bearer ", ""), process.env.JWT_SECRET || "dev_secret").id;
    next();
  } catch {
    res.status(401).json({ error: "Please log in again" });
  }
}
