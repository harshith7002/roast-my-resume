import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Blog from "./Blog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const LOADING_MESSAGES = [
  "Judging your life choices...",
  "Consulting senior engineers...",
  "Preparing savage feedback...",
  "Laughing at your project names...",
  "Counting your buzzwords...",
  "Crying at your skill section...",
  "Wondering why you listed MS Word...",
  "Asking ChatGPT to roast harder...",
  "Checking if recursion is explained...",
  "Reviewing your 4 tutorials listed as projects...",
];

const FAQS = [
  { q: "Is my resume stored anywhere?", a: "Nope. Your PDF is processed in memory and immediately discarded. We don't store, log, or sell your resume. Pinky promise." },
  { q: "How is the roast generated?", a: "We use Groq AI to analyze your resume and generate brutally honest, yet actionable feedback. It's like having a senior engineer friend with zero filter." },
  { q: "Why is the feedback so harsh?", a: "Because sugarcoating doesn't get you jobs. The roast format makes the feedback memorable and actually useful. Every criticism comes with an implicit fix." },
  { q: "What's the difference between English and Hindi+English mode?", a: "Hinglish mode delivers the roast in a mix of Hindi and English — perfect for desi freshers who want the feedback to hit different. Bilkul seedha." },
  { q: "How accurate is the score?", a: "The score is an AI-generated heuristic based on resume quality signals. It's directionally correct — a 30 is genuinely worse than an 80 — but don't treat it as gospel." },
];

const SAMPLE_SECTIONS = [
  { emoji: "🔥", title: "THE ROAST", color: "#ff4444", content: "Your Projects section lists a Todo App, a Weather App, and a Calculator. Congratulations, you've recreated every YouTube tutorial. At least add a README so we know you opened VS Code at some point." },
  { emoji: "✅", title: "OKAY FINE", color: "#00e676", content: "The contact section is clean and your GitHub link actually works. That puts you ahead of 40% of submissions." },
  { emoji: "📈", title: "GLOW UP GUIDE", color: "#448aff", content: "Replace tutorial projects with something that solves a real problem. Add metrics: '200 users', '50ms response time'. Ditch the Objective section — everyone knows you want a job." },
];

function parseRoast(text) {
  const sections = [];
  const patterns = [
    { key: "roast", emoji: "🔥", title: "THE ROAST", color: "#ff4444" },
    { key: "shame", emoji: "💀", title: "HALL OF SHAME", color: "#ff8c00" },
    { key: "decent", emoji: "✅", title: "OKAY FINE, THIS IS DECENT", color: "#00e676" },
    { key: "glowup", emoji: "📈", title: "GLOW UP GUIDE", color: "#448aff" },
    { key: "verdict", emoji: "🎯", title: "FINAL VERDICT", color: "#9c27b0" },
  ];
  patterns.forEach(({ key, emoji, title, color }, i) => {
    const nextEmoji = patterns[i + 1]?.emoji;
    const regex = nextEmoji
      ? new RegExp(`${emoji}[\\s\\S]*?(?=${nextEmoji})`, "g")
      : new RegExp(`${emoji}[\\s\\S]*$`, "g");
    const match = text.match(regex);
    if (match) sections.push({ key, title, color, content: match[0].trim() });
  });
  return sections.length > 0 ? sections : [{ key: "full", title: "ROAST RESULTS", color: "#ff4444", content: text }];
}

function extractScore(text) {
  const m = text.match(/(?:score[:\s]+)?(\d{1,3})\s*\/\s*100/i) || text.match(/(\d{1,3})\s*out of\s*100/i);
  if (m) return Math.min(100, Math.max(0, parseInt(m[1])));
  if (/faang/i.test(text)) return 74 + Math.floor(Math.random() * 18);
  if (/product co/i.test(text)) return 55 + Math.floor(Math.random() * 16);
  if (/startup/i.test(text)) return 40 + Math.floor(Math.random() * 16);
  return 18 + Math.floor(Math.random() * 24);
}

function extractVerdict(text) {
  const verdictSection = text.split("🎯").pop() || text;
  if (/faang possible/i.test(verdictSection)) return "FAANG Possible";
  if (/faang/i.test(verdictSection)) return "FAANG Possible";
  if (/product company ready/i.test(verdictSection)) return "Product Co.";
  if (/product co/i.test(verdictSection)) return "Product Co.";
  if (/startup ready/i.test(verdictSection)) return "Startup Ready";
  if (/startup/i.test(verdictSection)) return "Startup Ready";
  return "Entry Level";
}

function Toast({ toasts }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{t.icon}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function CircularScore({ score, animate }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (!animate) return;
    let start = null;
    const duration = 1400;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setDisplayed(Math.round(p * score));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [animate, score]);
  const offset = circ - (displayed / 100) * circ;
  const color = score >= 70 ? "#00e676" : score >= 45 ? "#ffd700" : score >= 28 ? "#ff8c00" : "#ff4444";
  return (
    <div className="circular-score">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dashoffset 0.04s linear", filter: `drop-shadow(0 0 10px ${color})` }} />
      </svg>
      <div className="score-center">
        <span className="score-number" style={{ color }}>{displayed}</span>
        <span className="score-label">/100</span>
      </div>
    </div>
  );
}

function Confetti({ active }) {
  const COLORS = ["#ff4444","#ff8c00","#ffd700","#00e676","#448aff","#ce93d8","#ff69b4"];
  if (!active) return null;
  const pieces = Array.from({ length: 90 }, (_, i) => ({
    id: i, x: Math.random() * 100, color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.9, dur: 1.6 + Math.random() * 1.6,
    size: 7 + Math.random() * 9, drift: (Math.random() - 0.5) * 120, shape: Math.random() > 0.45,
  }));
  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.x}%`, background: p.color, width: p.size,
          height: p.shape ? p.size : p.size * 0.4, borderRadius: p.shape ? "50%" : "2px",
          animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, "--drift": `${p.drift}px`,
        }} />
      ))}
    </div>
  );
}

function FireParticles() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 6,
    dur: 5 + Math.random() * 5, size: 5 + Math.random() * 14, drift: (Math.random() - 0.5) * 70,
  }));
  return (
    <div className="fire-particles" aria-hidden="true">
      {particles
