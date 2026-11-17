import mongoose from "mongoose";
const msg = new mongoose.Schema({ from: String, text: String, at: { type: Date, default: Date.now } }, { _id: false });
const emailSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  order: Number,
  from: String,
  subject: String,
  dateLabel: String,
  meeting: { type: String, default: "" },
  thread: [msg],
  // AI classification
  cls: { type: String, enum: ["assistant", "client", "none", "review"] },
  conf: Number,
  why: String,
  summary: String,
  source: { type: String, enum: ["groq", "rules", "manual"] },
  manual: { type: Boolean, default: false },
  // flags
  unread: { type: Boolean, default: false },
  important: { type: Boolean, default: false },
  waiting: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  done: { type: Boolean, default: false }
}, { timestamps: true });
export default mongoose.model("Email", emailSchema);
