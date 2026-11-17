import { Router } from "express";
import Email from "../models/Email.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { wrap } from "../middleware/wrap.js";
import { classify } from "../services/classifier.js";
import { draftReply } from "../services/drafts.js";
import samples from "../data/sampleEmails.js";

const r = Router();
r.use(auth);

const list = (user) => Email.find({ user }).sort({ order: 1 });
const find = (req) => Email.findOne({ _id: req.params.id, user: req.userId });
const FLAGS = ["unread", "important", "archived", "done", "waiting"];

r.get("/", wrap(async (req, res) => res.json(await list(req.userId))));

// Simulated mailbox connection: loads realistic sample emails, then AI-classifies them.
r.post("/sync", wrap(async (req, res) => {
  const provider = ["Gmail", "Outlook"].includes(req.body.provider) ? req.body.provider : "Gmail";
  if (!(await Email.exists({ user: req.userId }))) {
    await Email.insertMany(samples.map((s, i) => ({
      user: req.userId, order: i, from: s.f, subject: s.s, dateLabel: s.d, meeting: s.w || "",
      unread: !!s.u, important: !!s.imp, waiting: !!s.wait,
      thread: s.th.map(([from, text]) => ({ from, text }))
    })));
  }
  const pending = await Email.find({ user: req.userId, $or: [{ cls: { $exists: false } }, { source: "rules" }] });
  await Promise.all(pending.map(async (e) => { Object.assign(e, await classify(e)); await e.save(); }));
  await User.findByIdAndUpdate(req.userId, { account: { provider, lastSync: new Date() } });
  res.json(await list(req.userId));
}));

r.patch("/:id", wrap(async (req, res) => {
  const e = await find(req);
  if (!e) return res.status(404).json({ error: "Email not found" });
  const b = req.body;
  FLAGS.forEach((k) => typeof b[k] === "boolean" && (e[k] = b[k]));
  if (["assistant", "client", "none", "review"].includes(b.cls))
    Object.assign(e, { cls: b.cls, manual: true, conf: 1, why: "Manually set by the assistant.", source: "manual" });
  if (b.reply) e.thread.push({ from: "You (sent)", text: String(b.reply).slice(0, 5000) });
  await e.save();
  res.json(e);
}));

// New message in a thread -> AI re-evaluates responsibility
r.post("/:id/messages", wrap(async (req, res) => {
  const e = await find(req);
  if (!e) return res.status(404).json({ error: "Email not found" });
  e.thread.push({ from: e.thread[0].from, text: req.body.text || "Update: this is urgent and I need your decision personally. Please approve today." });
  e.unread = true;
  Object.assign(e, await classify(e), { manual: false });
  await e.save();
  res.json(e);
}));

r.post("/:id/draft", wrap(async (req, res) => {
  const [e, u] = await Promise.all([find(req), User.findById(req.userId)]);
  if (!e) return res.status(404).json({ error: "Email not found" });
  res.json({ draft: await draftReply(e, u) });
}));

export default r;
