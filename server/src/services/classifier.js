import { chat } from "./groq.js";

const CLASSES = ["assistant", "client", "none", "review"];
const SYSTEM = `You triage emails for a personal assistant who manages email for a client.
Decide who must reply. Respond ONLY with JSON:
{"cls":"assistant"|"client"|"none"|"review","conf":0-1,"why":"one short sentence","summary":"one sentence summary of the latest state"}
assistant = scheduling/rescheduling, routine business, follow-ups, general admin.
client = personal decisions, approvals, sensitive or confidential matters, anything asking for the client's own input.
none = newsletters, receipts, notifications, informational or already-resolved threads. Do not over-assign replies.
review = you cannot decide confidently (use conf below 0.6).
Use the whole thread; the latest message matters most.`;

// ---- Offline fallback so the app still works without Groq ----
const RULES = {
  none: ["unsubscribe", "newsletter", "no-reply", "receipt", "digest", "resolved", "all set"],
  client: ["approve", "approval", "your decision", "sign off", "confidential", "personally", "board", "legal", "your input"],
  assistant: ["reschedule", "schedule", "availability", "invoice", "follow up", "booking", "calendar", "reminder"]
};
const WHY = {
  assistant: "Routine scheduling or admin request the assistant can handle.",
  client: "Needs a personal decision, approval or sensitive input.",
  none: "Informational or automated, so no response is expected."
};
const firstSentence = (e) => (e.thread.at(-1)?.text || "").split(/(?<=\.)\s/)[0];

export function ruleClassify(e) {
  const t = (e.subject + " " + e.thread.map((m) => m.text).join(" ")).toLowerCase();
  const hits = Object.fromEntries(Object.entries(RULES).map(([k, ws]) => [k, ws.filter((w) => t.includes(w))]));
  const ranked = Object.entries(hits).map(([k, h]) => [k, h.length]).sort((a, b) => b[1] - a[1]);
  const [k, v] = ranked[0];
  const summary = firstSentence(e);
  if (!v || v === ranked[1][1]) return { cls: "review", conf: 0.42, why: "Signals are mixed or missing, so this needs your review.", summary, source: "rules" };
  return { cls: k, conf: Math.min(0.97, 0.68 + v * 0.1), why: `${WHY[k]} Signals: ${hits[k].join(", ")}.`, summary, source: "rules" };
}

export async function classify(e) {
  try {
    const convo = e.thread.map((m) => `${m.from}: ${m.text}`).join("\n");
    const out = JSON.parse(await chat({ system: SYSTEM, user: `From: ${e.from}\nSubject: ${e.subject}\n\n${convo}`, json: true }));
    if (!CLASSES.includes(out.cls)) throw new Error("invalid class from model");
    let conf = Number(out.conf);
    if (!(conf >= 0 && conf <= 1)) conf = 0.5;
    return { cls: conf < 0.6 ? "review" : out.cls, conf, why: String(out.why || ""), summary: String(out.summary || firstSentence(e)), source: "groq" };
  } catch (err) {
    console.warn("AI classify fell back to rules:", err.message);
    return ruleClassify(e);
  }
}
