require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error("Missing MONGODB_URI or JWT_SECRET. Create a .env file from .env.example.");
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/api", apiRoutes);
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.get("/api/health", (req, res) => res.json({ status: "ok", message: "SkillSwap API is running." }));
app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: "This email is already registered." });
  res.status(500).json({ message: "Server error. Check the terminal for details." });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB.");
    app.listen(PORT, () => console.log(`SkillSwap is running at http://localhost:${PORT}`));
  })
  .catch(error => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
