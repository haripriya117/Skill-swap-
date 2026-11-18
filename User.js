const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  course: { type: String, default: "" },
  year: { type: String, default: "2nd year" },
  bio: { type: String, default: "", maxlength: 500 },
  teachSkills: [{ type: String, trim: true }],
  learnSkills: [{ type: String, trim: true }],
  availability: { type: String, default: "Flexible" },
  credits: { type: Number, default: 120, min: 0 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
module.exports = mongoose.model("User", userSchema);
