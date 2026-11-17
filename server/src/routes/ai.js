import { Router } from "express";
import Email from "../models/Email.js";
import auth from "../middleware/auth.js";
import { wrap } from "../middleware/wrap.js";
import { chat } from "../services/groq.js";

const r = Router();
r.use(auth);

// "Ask AI" over the user's open inbox
r.post("/ask", wrap(async (req, res) => {
  const { question = "", selectedId } = req.body;
  const emails = await Email.find({ user: req.userId, archived: false, done: false }).sort({ order: 1 });
  const ctx = emails.map((e) => ({
    id: String(e._id), from: e.from, subject: e.subject, replyBy: e.cls, waitingForResponse: e.waiting,
    important: e.important, meeting: e.meeting, summary: e.summary, why: e.why
  }));
  const sel = emails.find((e) => String(e._id) === selectedId);
  try {
    const out = JSON.parse(await chat({
      system: `You answer questions about a personal assistant's inbox. replyBy: assistant = assistant replies, client = client replies personally, none = no reply, review = needs human review.
Answer concisely using ONLY the data given. Refer to emails by their subject, never write ids in the answer text. Put the ids only in emailIds. Respond ONLY with JSON: {"answer":"...","emailIds":["ids of the emails you refer to"]}.`,      user: `Inbox: ${JSON.stringify(ctx)}\n${sel ? `Selected conversation: ${JSON.stringify({ subject: sel.subject, thread: sel.thread.map((m) => `${m.from}: ${m.text}`) })}\n` : ""}Question: ${question}`,
      json: true
    }));
    res.json({ answer: String(out.answer), emailIds: (out.emailIds || []).filter((id) => ctx.some((c) => c.id === id)) });
  } catch (err) {
    console.warn("AI ask fell back:", err.message);
    const n = (k) => ctx.filter((c) => c.replyBy === k).length;
    res.json({ answer: `(AI offline) ${ctx.length} open emails: ${n("client")} for the client, ${n("assistant")} for you, ${n("review")} need review.`, emailIds: [] });
  }
}));

export default r;
