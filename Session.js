const mongoose = require("mongoose");
const sessionSchema = new mongoose.Schema({
  learner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skill: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  credits: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ["Requested","Accepted","Completed","Cancelled"], default: "Requested" }
}, { timestamps: true });
module.exports = mongoose.model("Session", sessionSchema);
