const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Session = require("../models/Session");
const Transaction = require("../models/Transaction");
const Project = require("../models/Project");
const auth = require("../middleware/auth");
const router = express.Router();

const publicUser = user => ({
  _id: user._id, name: user.name, email: user.email, course: user.course,
  year: user.year, bio: user.bio, teachSkills: user.teachSkills,
  learnSkills: user.learnSkills, availability: user.availability,
  credits: user.credits
});
const makeToken = user => jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/auth/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ message: "Enter your full name." });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
    if (!password || password.length < 8) return res.status(400).json({ message: "Password must contain at least 8 characters." });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).select("+passwordHash");
    if (!user || !await bcrypt.compare(password || "", user.passwordHash))
      return res.status(401).json({ message: "Email or password is incorrect." });
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get("/auth/me", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Account not found." });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get("/profile", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Account not found." });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.put("/profile", auth, async (req, res, next) => {
  try {
    const { name, course, year, bio } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ message: "Name must contain at least 2 characters." });
    const user = await User.findByIdAndUpdate(req.userId, {
      name: name.trim(), course: course || "", year: year || "2nd year", bio: bio || ""
    }, { new: true, runValidators: true });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.put("/profile/skills", auth, async (req, res, next) => {
  try {
    const { teachSkills = [], learnSkills = [], availability = "Flexible" } = req.body;
    if (!Array.isArray(teachSkills) || !Array.isArray(learnSkills))
      return res.status(400).json({ message: "Skills must be provided as lists." });
    const clean = arr => [...new Set(arr.map(x => String(x).trim()).filter(Boolean))].slice(0, 20);
    const user = await User.findByIdAndUpdate(req.userId, {
      teachSkills: clean(teachSkills), learnSkills: clean(learnSkills), availability
    }, { new: true });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get("/people", auth, async (req, res, next) => {
  try {
    const people = await User.find({ _id: { $ne: req.userId }, teachSkills: { $exists: true, $ne: [] } })
      .select("name course year teachSkills learnSkills availability")
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json({ people: people.map(p => ({ ...p, sessionCredits: 10 })) });
  } catch (error) { next(error); }
});

router.post("/sessions", auth, async (req, res, next) => {
  const mongoSession = await mongoose.startSession();
  try {
    const { teacherId, skill, date, time } = req.body;
    if (!mongoose.isValidObjectId(teacherId)) return res.status(400).json({ message: "Choose a valid student." });
    if (!skill || !date || !time) return res.status(400).json({ message: "Choose a skill, date and time." });
    if (teacherId === String(req.userId)) return res.status(400).json({ message: "You cannot book a session with yourself." });
    let created;
    await mongoSession.withTransaction(async () => {
      const learner = await User.findById(req.userId).session(mongoSession);
      const teacher = await User.findById(teacherId).session(mongoSession);
      if (!teacher) throw new Error("The selected student no longer exists.");
      const cost = 10;
      if (learner.credits < cost) throw new Error("You do not have enough credits. Teach a skill to earn more.");
      learner.credits -= cost;
      await learner.save({ session: mongoSession });
      created = await Session.create([{
        learner: learner._id, teacher: teacher._id, skill: String(skill).trim(),
        date, time, credits: cost
      }], { session: mongoSession });
      await Transaction.create([{
        user: learner._id, type: "spent", amount: cost,
        description: `${skill} session with ${teacher.name}`
      }], { session: mongoSession });
    });
    res.status(201).json({ session: created[0] });
  } catch (error) {
    if (error.message.includes("enough credits") || error.message.includes("no longer exists"))
      return res.status(400).json({ message: error.message });
    next(error);
  } finally { await mongoSession.endSession(); }
});

router.get("/sessions", auth, async (req, res, next) => {
  try {
    const sessions = await Session.find({ $or: [{ learner: req.userId }, { teacher: req.userId }] })
      .populate("learner", "name").populate("teacher", "name").sort({ createdAt: -1 });
    res.json({ sessions: sessions.map(s => ({
      _id: s._id, skill: s.skill, date: s.date, time: s.time, credits: s.credits,
      status: s.status, createdAt: s.createdAt, teacher: s.teacher, learner: s.learner
    })) });
  } catch (error) { next(error); }
});

router.get("/wallet", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("credits");
    const transactions = await Transaction.find({ user: req.userId }).sort({ createdAt: -1 }).limit(100);
    res.json({ balance: user.credits, transactions });
  } catch (error) { next(error); }
});

router.get("/projects", auth, async (req, res, next) => {
  try {
    const projects = await Project.find().populate("owner", "name").populate("members", "name").sort({ createdAt: -1 }).limit(100);
    res.json({ projects });
  } catch (error) { next(error); }
});

router.post("/projects", auth, async (req, res, next) => {
  try {
    const { name, description, skillsNeeded = [] } = req.body;
    if (!name || !description) return res.status(400).json({ message: "Project name and description are required." });
    const skills = Array.isArray(skillsNeeded) ? skillsNeeded.map(s => String(s).trim()).filter(Boolean).slice(0, 15) : [];
    const project = await Project.create({ name, description, skillsNeeded: skills, owner: req.userId, members: [req.userId] });
    await project.populate("owner", "name");
    await project.populate("members", "name");
    res.status(201).json({ project });
  } catch (error) { next(error); }
});

router.post("/projects/:id/join", auth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid project." });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found." });
    if (!project.members.some(id => String(id) === String(req.userId))) {
      project.members.push(req.userId);
      await project.save();
    }
    await project.populate("owner", "name");
    await project.populate("members", "name");
    res.json({ project });
  } catch (error) { next(error); }
});

module.exports = router;
