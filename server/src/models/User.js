import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  clientName: { type: String, default: "Alex Morgan" },
  account: { provider: String, lastSync: Date }
}, { timestamps: true });
export default mongoose.model("User", userSchema);
