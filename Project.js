const mongoose = require("mongoose");
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  skillsNeeded: [{ type: String, trim: true }],
  category: { type: String, default: "Student project" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });
module.exports = mongoose.model("Project", projectSchema);
