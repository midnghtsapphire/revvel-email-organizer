// server/index.ts
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var server = createServer(app);
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "..", "dist", "public")));
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/auth/gmail/callback", (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }
  res.json({ message: "OAuth callback received", code });
});
app.get("/api/emails", (_req, res) => {
  res.json({
    message: "Use mock data from frontend for now",
    note: "Backend email sync coming soon"
  });
});
app.post("/api/emails/categorize", (req, res) => {
  const { subject, preview } = req.body;
  if (!subject || !preview) {
    return res.status(400).json({ error: "Missing subject or preview" });
  }
  res.json({
    subject,
    category: "work",
    priority: "medium",
    confidence: 0.87
  });
});
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "public", "index.html"));
});
var port = process.env.PORT || 3e3;
server.listen(port, () => {
  console.log(`\u2728 Revvel Email Organizer running on http://localhost:${port}/`);
  console.log(`\u{1F4E7} Gmail OAuth setup required for real email sync`);
  console.log(`\u{1F916} OpenRouter API key: ${process.env.OPENROUTER_API_KEY ? "\u2713 Set" : "\u2717 Missing"}`);
});
