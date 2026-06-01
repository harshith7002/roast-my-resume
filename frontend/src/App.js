import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import "./App.css";
import Blog from "./pages/Blog";
import Leaderboard from "./pages/Leaderboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import About from "./pages/About";

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
  { q: "How accurate is the verdict?", a: "The verdict is evaluated by AI based on your actual resume content — CGPA, projects, internships, DSA, and more. It's realistic and honest, not sugar-coated." },
];

const PERSONALITIES = [
  { id: "default", emoji: "🔥", name: "Savage Engineer", desc: "Brutally honest senior dev" },
  { id: "gordon", emoji: "👨‍🍳", name: "Gordon Ramsay", desc: "THIS RESUME IS RAW!" },
  { id: "parent", emoji: "👨‍👩‍👧", name: "Disappointed Parent", desc: "Log kya kahenge?" },
  { id: "techbro", emoji: "🤵", name: "Tech Bro Recruiter", desc: "Not disruptive enough" },
  { id: "senior", emoji: "😤", name: "Toxic Senior Dev", desc: "I rewrote this in a weekend" },
  { id: "elon", emoji: "🚀", name: "Elon Musk", desc: "Delete 90% of your resume" },
];

const BADGES = [
  { id: "survived_gordon", emoji: "👨‍🍳", label: "Survived Gordon Ramsay", condition: (p) => p === "gordon" },
  { id: "faang_aspirant", emoji: "🌟", label: "FAANG Aspirant", condition: (_, v) => v?.includes("FAANG") },
  { id: "hall_of_shame", emoji: "💀", label: "Hall of Shame", condition: (_, v) => v?.includes("Entry") },
  { id: "startup_material", emoji: "🚀", label: "Startup Material", condition: (_, v) => v?.includes("Startup") },
  { id: "roast_veteran", emoji: "🔥", label: "Roast Veteran", condition: () => (parseInt(localStorage.getItem("roastCount") || 0)) >= 5 },
];

const SAMPLE_ROAST_DATA = {
  sections: [
    { emoji: "🔥", title: "THE ROAST", color: "#ff4444", content: "Rahul has listed 'MS Word' and 'MS PowerPoint' as technical skills in 2024. Bro, my grandmother knows MS Word. You also listed 'Team Player' — congratulations, you've described every human being alive." },
    { emoji: "💀", title: "HALL OF SHAME", color: "#ff8c00", content: "1. Todo App, Weather App and Calculator — the holy trinity of tutorial projects 😂\n2. Objective: 'seeking a challenging position' — everyone wants that Rahul\n3. 'Listening to Music' as hobby — so does literally everyone on earth" },
    { emoji: "✅", title: "OKAY FINE, THIS IS DECENT", color: "#00e676", content: "GitHub link actually works and has some commits. Contact info is clean. At least you have a LinkedIn." },
    { emoji: "📈", title: "GLOW UP GUIDE", color: "#448aff", content: "1. Remove MS Word from skills immediately\n2. Replace todo app with a deployed project with real users\n3. Add numbers — '500 users', '40% faster'\n4. Delete the Objective section\n5. Add LeetCode profile and problem count" },
  ]
};

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
    const regex = nextEmoji ? new RegExp(`${emoji}[\\s\\S]*?(?=${nextEmoji})`, "g") : new RegExp(`${emoji}[\\s\\S]*$`, "g");
    const match = text.match(regex);
    if (match) sections.push({ key, title, color, content: match[0].trim() });
  });
  return sections.length > 0 ? sections : [{ key: "full", title: "ROAST RESULTS", color: "#ff4444", content: text }];
}

function getVerdictClass(verdict) {
  if (!verdict) return "tcs";
  const v = verdict.toLowerCase();
  if (v.includes("faang")) return "faang";
  if (v.includes("product")) return "product";
  if (v.includes("startup")) return "startup";
  return "tcs";
}

function getVerdictLabel(verdict) {
  if (!verdict) return "Entry Level";
  const v = verdict.toLowerCase();
  if (v.includes("faang")) return "FAANG Possible";
  if (v.includes("product")) return "Product Co.";
  if (v.includes("startup")) return "Startup Ready";
  return "Entry Level";
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-fire">🔥</span>
        <span className="brand-text">RoastMyResume</span>
      </Link>
      <div className={`navbar-links${menuOpen ? " open" : ""}`}>
        <Link to="/" className={`nav-link${isActive("/") ? " active" : ""}`} onClick={() => setMenuOpen(false)}>Roast</Link>
        <Link to="/leaderboard" className={`nav-link${isActive("/leaderboard") ? " active" : ""}`} onClick={() => setMenuOpen(false)}>🏆 Leaderboard</Link>
        <Link to="/blog" className={`nav-link${isActive("/blog") ? " active" : ""}`} onClick={() => setMenuOpen(false)}>Blog</Link>
        <Link to="/about" className={`nav-link${isActive("/about") ? " active" : ""}`} onClick={() => setMenuOpen(false)}>About</Link>
        <a href="https://buymeacoffee.com/macoostudy" target="_blank" rel="noopener noreferrer" className="nav-chai-btn" onClick={() => setMenuOpen(false)}>☕ Chai</a>
      </div>
      <button className="navbar-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
        <span /><span /><span />
      </button>
    </nav>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer-v2">
      <div className="footer-top">
        <div className="footer-brand">
          <span className="footer-logo">🔥 RoastMyResume</span>
          <p className="footer-tagline">Brutal honesty. Actionable fixes. Zero sugarcoating.</p>
          <a href="https://buymeacoffee.com/macoostudy" target="_blank" rel="noopener noreferrer" className="footer-chai-btn">☕ Buy me a chai</a>
        </div>
        <div className="footer-links-grid">
          <div className="footer-col">
            <h4>Tool</h4>
            <Link to="/">Roast My Resume</Link>
            <Link to="/leaderboard">Leaderboard</Link>
          </div>
          <div className="footer-col">
            <h4>Info</h4>
            <Link to="/blog">Blog</Link>
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://github.com/harshith7002" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 RoastMyResume • Built for CS freshers worldwide 🌍</p>
        <p>Built with ❤️ by <a href="https://portfolio-saiharshith.netlify.app" target="_blank" rel="noopener noreferrer">Harshith</a></p>
      </div>
    </footer>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
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

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const COLORS = ["#ff4444", "#ff8c00", "#ffd700", "#00e676", "#448aff", "#ce93d8", "#ff69b4"];
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

// ── Fire Particles ────────────────────────────────────────────────────────────
function FireParticles() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 6,
    dur: 5 + Math.random() * 5, size: 5 + Math.random() * 14, drift: (Math.random() - 0.5) * 70,
  }));
  return (
    <div className="fire-particles" aria-hidden="true">
      {particles.map(p => (
        <div key={p.id} className="fire-particle" style={{
          left: `${p.x}%`, width: p.size, height: p.size,
          animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, "--drift": `${p.drift}px`,
        }} />
      ))}
    </div>
  );
}

// ── FAQ Item ──────────────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? "open" : ""}`} onClick={() => setOpen(o => !o)}>
      <div className="faq-q"><span>{q}</span><span className="faq-arrow">{open ? "−" : "+"}</span></div>
      <div className="faq-a">{a}</div>
    </div>
  );
}

// ── Personality Modal ─────────────────────────────────────────────────────────
function PersonalityModal({ onSelect, onClose }) {
  const [selected, setSelected] = useState("default");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">🎭 Who's roasting your resume?</h2>
        <p className="modal-subtitle">Pick your roaster before we begin</p>
        <div className="modal-personality-grid">
          {PERSONALITIES.map(p => (
            <button key={p.id} className={`personality-btn${selected === p.id ? " active" : ""}`} onClick={() => setSelected(p.id)}>
              <span className="personality-emoji">{p.emoji}</span>
              <span className="personality-name">{p.name}</span>
              <span className="personality-desc">{p.desc}</span>
            </button>
          ))}
        </div>
        <button className="modal-confirm-btn" onClick={() => onSelect(selected)}>🔥 Start Roasting!</button>
        <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ── Streak Widget ─────────────────────────────────────────────────────────────
function StreakWidget() {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    const s = parseInt(localStorage.getItem("streak") || "0");
    setStreak(s);
  }, []);
  if (streak === 0) return null;
  return (
    <div className="streak-widget">
      <span className="streak-fire">🔥</span>
      <span className="streak-count">{streak}</span>
      <span className="streak-label">day streak!</span>
    </div>
  );
}

// ── Badge Display ─────────────────────────────────────────────────────────────
function BadgeDisplay({ earned }) {
  if (!earned || earned.length === 0) return null;
  return (
    <div className="badges-row">
      <p className="badges-label">🎖️ Badges Earned:</p>
      <div className="badges-list">
        {earned.map(b => (
          <div key={b.id} className="badge-item">
            <span className="badge-emoji">{b.emoji}</span>
            <span className="badge-label">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Roast of the Day ──────────────────────────────────────────────────────────
function RoastOfTheDay() {
  const roasts = [
    "\"You listed MS Word as a skill. In 2024. Remarkable.\"",
    "\"Your projects section is a YouTube tutorial graveyard.\"",
    "\"import numpy as np = AI Engineer? Please stop.\"",
    "\"Objective: Seeking a challenging position. Everyone wants that bro.\"",
    "\"Hobbies: Listening to music, watching movies. Groundbreaking.\"",
  ];
  const today = new Date().getDay();
  return (
    <div className="rotd-section">
      <div className="rotd-header">
        <span className="rotd-badge">🔥 ROAST OF THE DAY</span>
      </div>
      <p className="rotd-text">{roasts[today]}</p>
      <p className="rotd-cta">Upload your resume to get your own roast! 👆</p>
    </div>
  );
}

// ── Sample Roast ──────────────────────────────────────────────────────────────
function SampleRoastSection() {
  const [show, setShow] = useState(false);
  return (
    <div className="sample-roast-section">
      <div className="sample-roast-header-row">
        <div>
          <h3 className="sample-roast-heading">👀 See a real roast</h3>
          <p className="sample-roast-subheading">This is exactly what your resume roast looks like</p>
        </div>
        <button className="sample-toggle-btn" onClick={() => setShow(s => !s)}>
          {show ? "▲ Hide" : "▼ Show sample"}
        </button>
      </div>
      {show && (
        <div className="sample-roast-body">
          <div className="verdict-only-row">
            <div className="verdict-badge-large startup">🚀 Startup Ready</div>
            <p className="verdict-description">Good bones. Show more impact.</p>
          </div>
          <div className="ats-score-box">
            <div className="ats-left">
              <span className="ats-label">📊 ATS Score</span>
              <span className="ats-hint">❌ ATS will likely filter you out</span>
            </div>
            <div className="ats-right">
              <span className="ats-value" style={{ color: "#ff4444" }}>42</span>
              <span className="ats-max">/100</span>
            </div>
          </div>
          {SAMPLE_ROAST_DATA.sections.map((s, i) => (
            <div key={i} className="roast-card" style={{ "--card-color": s.color, animationDelay: `${i * 0.1}s` }}>
              <div className="card-content">
                <p className="card-line card-heading">{s.emoji} {s.title}</p>
                {s.content.split("\n").map((line, j) => line.trim() && <p key={j} className="card-line">{line}</p>)}
              </div>
            </div>
          ))}
          <button className="roast-btn" style={{ marginTop: "8px" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            🔥 Get My Resume Roasted!
          </button>
        </div>
      )}
    </div>
  );
}

// ── Roast Counter ─────────────────────────────────────────────────────────────
const BASE_COUNT = 1247;
function RoastCounter() {
  const [count, setCount] = useState(BASE_COUNT);
  useEffect(() => {
    const stored = localStorage.getItem("roastCount");
    if (stored) setCount(parseInt(stored));
  }, []);
  return (
    <div className="roast-counter">
      <span className="counter-flame">🔥</span>
      <span className="counter-number">{count.toLocaleString()}</span>
      <span className="counter-label">resumes roasted</span>
    </div>
  );
}

// ── Submit to Leaderboard Modal ───────────────────────────────────────────────
function LeaderboardSubmitModal({ roastText, verdict, atsScore, onClose }) {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const entry = {
      id: Date.now(),
      name: name.trim() || "Anonymous Fresher",
      roastSnippet: roastText.slice(0, 200),
      verdict,
      atsScore,
      votes: 0,
      date: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    existing.unshift(entry);
    localStorage.setItem("leaderboard", JSON.stringify(existing.slice(0, 50)));
    setSubmitted(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {!submitted ? (
          <>
            <h2 className="modal-title">🏆 Submit to Leaderboard</h2>
            <p className="modal-subtitle">Share your roast with the community!</p>
            <input
              className="lb-name-input"
              placeholder="Your name or nickname (e.g. TCS Waala Bhai 😂)"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
            />
            <button className="modal-confirm-btn" onClick={handleSubmit}>🏆 Submit!</button>
            <button className="modal-cancel-btn" onClick={onClose}>Maybe later</button>
          </>
        ) : (
          <>
            <h2 className="modal-title">🎉 Submitted!</h2>
            <p className="modal-subtitle">Your roast is now on the leaderboard!</p>
            <Link to="/leaderboard" className="modal-confirm-btn" style={{ textDecoration: "none", textAlign: "center" }} onClick={onClose}>
              View Leaderboard 🏆
            </Link>
            <button className="modal-cancel-btn" onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function MainApp() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roast, setRoast] = useState(null);
  const [verdict, setVerdict] = useState("");
  const [atsScore, setAtsScore] = useState(0);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [language, setLanguage] = useState("english");
  const [personality, setPersonality] = useState("default");
  const [showModal, setShowModal] = useState(false);
  const [showLBModal, setShowLBModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fileDropped, setFileDropped] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [usedPersonality, setUsedPersonality] = useState("default");
  const fileRef = useRef();
  const resultsRef = useRef();

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 2200);
    return () => clearInterval(id);
  }, [loading]);

  const addToast = useCallback((message, type = "info", icon = "ℹ️") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") {
      setFile(f); setError(null); setFileDropped(true);
      setTimeout(() => setFileDropped(false), 900);
      addToast(`${f.name} loaded!`, "success", "📄");
    } else {
      addToast("PDF files only, genius.", "error", "⚠️");
      setError("Please upload a PDF file only!");
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const handleRoastClick = () => { if (!file) return; setShowModal(true); };

  const handlePersonalitySelect = async (selectedPersonality) => {
    setShowModal(false);
    setPersonality(selectedPersonality);
    setUsedPersonality(selectedPersonality);
    await handleSubmit(selectedPersonality);
  };

  const handleSubmit = async (selectedPersonality = personality) => {
    if (!file) return;
    setLoading(true); setRoast(null); setError(null); setLoadingMsgIdx(0);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("language", language);
    formData.append("personality", selectedPersonality);
    try {
      const res = await fetch(`${BACKEND_URL}/api/roast`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setRoast(data.roast);
        setVerdict(data.verdict || "🏭 Entry Level");
        setAtsScore(data.ats_score || 0);

        // Calculate badges
        const earned = BADGES.filter(b => b.condition(selectedPersonality, data.verdict));
        setEarnedBadges(earned);

        // Update streak
        const lastRoast = localStorage.getItem("lastRoastDate");
        const today = new Date().toDateString();
        const streak = parseInt(localStorage.getItem("streak") || "0");
        if (lastRoast === today) {
          // same day, no change
        } else if (lastRoast === new Date(Date.now() - 86400000).toDateString()) {
          localStorage.setItem("streak", streak + 1);
        } else {
          localStorage.setItem("streak", 1);
        }
        localStorage.setItem("lastRoastDate", today);

        const verdictLabel = getVerdictLabel(data.verdict || "");
        if (verdictLabel === "FAANG Possible") {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4500);
          addToast("FAANG Possible! You might actually get hired!", "success", "🌟");
        } else {
          addToast("Your roast is ready. Brace yourself...", "fire", "🔥");
        }
        const cur = parseInt(localStorage.getItem("roastCount") || BASE_COUNT);
        localStorage.setItem("roastCount", cur + 1);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
      } else {
        setError(data.error || "Something went wrong!");
        addToast(data.error || "Something went wrong!", "error", "💀");
      }
    } catch {
      setError("Cannot connect to server. Make sure backend is running!");
      addToast("Server unreachable. Backend down?", "error", "🔌");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roast);
    addToast("Roast copied! Send it to your rivals 😂", "success", "📋");
  };

  const handleReset = () => {
    setFile(null); setRoast(null); setError(null);
    setVerdict(""); setAtsScore(0); setEarnedBadges([]);
    setShowConfetti(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShareImage = () => {
    addToast("Generating share card...", "info", "🎨");
    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 460;
    const ctx = canvas.getContext("2d");
    const bg = ctx.createLinearGradient(0, 0, 800, 460);
    bg.addColorStop(0, "#0a0a0f"); bg.addColorStop(1, "#1a0808");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 800, 460);
    ctx.strokeStyle = "rgba(255,68,68,0.5)"; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 798, 458);
    ctx.fillStyle = "#ff4444"; ctx.font = "bold 34px sans-serif"; ctx.fillText("🔥 Roast My Resume", 40, 66);
    ctx.fillStyle = "#9090a8"; ctx.font = "16px sans-serif"; ctx.fillText("macoostudy.info", 40, 92);
    ctx.fillStyle = "#ffd700"; ctx.font = "bold 28px sans-serif";
    ctx.fillText(`Verdict: ${getVerdictLabel(verdict)}`, 40, 140);
    ctx.fillStyle = "#448aff"; ctx.font = "18px sans-serif";
    ctx.fillText(`ATS Score: ${atsScore}/100`, 40, 175);
    const ps = parseRoast(roast); const first = ps.find(s => s.key === "roast");
    if (first) {
      ctx.fillStyle = "#e0e0ea"; ctx.font = "15px sans-serif";
      const words = first.content.replace(/^🔥[^\n]*\n?/, "").split(" ");
      let line = "", y = 220;
      for (const w of words) {
        const test = line + w + " ";
        if (ctx.measureText(test).width > 720 && line) {
          ctx.fillText(line.trim(), 40, y); line = w + " "; y += 26;
          if (y > 370) { ctx.fillText("...", 40, y); break; }
        } else line = test;
      }
      if (y <= 370) ctx.fillText(line.trim(), 40, y);
    }
    ctx.fillStyle = "rgba(255,68,68,0.6)"; ctx.font = "13px sans-serif";
    ctx.fillText("Try it free → macoostudy.info", 40, 430);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "roast-result.png"; a.click();
      URL.revokeObjectURL(url); addToast("Share card downloaded!", "success", "🎉");
    });
  };

  const parsedSections = roast ? parseRoast(roast) : [];
  const verdictLabel = getVerdictLabel(verdict);
  const verdictClass = getVerdictClass(verdict);

  return (
    <div className="page-content">
      <Confetti active={showConfetti} />
      <Toast toasts={toasts} />
      <FireParticles />

      {showModal && <PersonalityModal onSelect={handlePersonalitySelect} onClose={() => setShowModal(false)} />}
      {showLBModal && <LeaderboardSubmitModal roastText={roast} verdict={verdict} atsScore={atsScore} onClose={() => setShowLBModal(false)} />}

      <header className="header">
        <div className="header-badges-row">
          <RoastCounter />
          <StreakWidget />
          <div className="header-badge">🌍 Made for CS Freshers</div>
        </div>
        <h1 className="title" aria-label="Roast My Resume">
          {"Roast".split("").map((l, i) => <span key={`r${i}`} className="title-letter title-roast" style={{ animationDelay: `${i * 0.07}s` }}>{l}</span>)}
          <span className="title-letter title-space"> </span>
          {"My".split("").map((l, i) => <span key={`m${i}`} className="title-letter title-my" style={{ animationDelay: `${0.38 + i * 0.07}s` }}>{l}</span>)}
          <span className="title-letter title-space"> </span>
          {"Resume".split("").map((l, i) => <span key={`re${i}`} className="title-letter title-resume" style={{ animationDelay: `${0.56 + i * 0.07}s` }}>{l}</span>)}
          <span className="fire-emoji" style={{ animationDelay: "1.05s" }}>🔥</span>
        </h1>
        <p className="subtitle">
          Upload your resume. Get brutally honest feedback.<br />
          <span className="subtitle-accent">No sugarcoating. Just truth (and some roasting).</span>
        </p>
        <div className="stats-row">
          <div className="stat">😤 Savage feedback</div>
          <div className="stat-divider">•</div>
          <div className="stat">🎯 Actionable fixes</div>
          <div className="stat-divider">•</div>
          <div className="stat">🆓 100% Free</div>
        </div>
      </header>

      <main className="main">
        {!roast ? (
          <div className="upload-section">
            <RoastOfTheDay />
            <SampleRoastSection />

            <div
              className={`upload-card${dragOver ? " drag-over" : ""}${file ? " has-file" : ""}${fileDropped ? " fire-burst" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileRef.current.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
              {file ? (
                <div className="file-selected">
                  <div className="file-icon">📄</div>
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                  <button className="change-file-btn" onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}>Change file</button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📋</div>
                  <div className="upload-text">Drop your resume PDF here</div>
                  <div className="upload-subtext">or click the button below</div>
                  <div className="upload-hint">Only PDF files accepted</div>
                  <button className="upload-trigger-btn" onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}>📂 Upload PDF</button>
                </div>
              )}
            </div>

            {error && <div className="error-box">⚠️ {error}</div>}

            <div className="language-section">
              <p className="language-label">🌐 Choose your roast language</p>
              <p className="language-hint">✨ 34+ languages — including all Indian regional languages!</p>
              <div className="language-select-wrap">
                <select className="language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="english">🌍 English (Default)</option>
                  <optgroup label="━━━ 🇮🇳 Indian Languages + English ━━━">
                    <option value="hinglish">🇮🇳 Hindi + English</option>
                    <option value="tanglish">🇮🇳 Tamil + English</option>
                    <option value="tenglish">🇮🇳 Telugu + English</option>
                    <option value="benglish">🇮🇳 Bengali + English</option>
                    <option value="manglish">🇮🇳 Malayalam + English</option>
                    <option value="kanglish">🇮🇳 Kannada + English</option>
                    <option value="punglish">🇮🇳 Punjabi + English</option>
                    <option value="marathish">🇮🇳 Marathi + English</option>
                    <option value="gujarish">🇮🇳 Gujarati + English</option>
                    <option value="orish">🇮🇳 Odia + English</option>
                    <option value="assamese">🇮🇳 Assamese + English</option>
                  </optgroup>
                  <optgroup label="━━━ 🌍 International Languages ━━━">
                    <option value="spanish">🇪🇸 Spanish</option>
                    <option value="french">🇫🇷 French</option>
                    <option value="german">🇩🇪 German</option>
                    <option value="portuguese">🇧🇷 Portuguese</option>
                    <option value="arabic">🇸🇦 Arabic</option>
                    <option value="japanese">🇯🇵 Japanese</option>
                    <option value="korean">🇰🇷 Korean</option>
                    <option value="italian">🇮🇹 Italian</option>
                    <option value="dutch">🇳🇱 Dutch</option>
                    <option value="turkish">🇹🇷 Turkish</option>
                    <option value="polish">🇵🇱 Polish</option>
                    <option value="swedish">🇸🇪 Swedish</option>
                    <option value="norwegian">🇳🇴 Norwegian</option>
                    <option value="danish">🇩🇰 Danish</option>
                    <option value="finnish">🇫🇮 Finnish</option>
                    <option value="greek">🇬🇷 Greek</option>
                    <option value="thai">🇹🇭 Thai</option>
                    <option value="vietnamese">🇻🇳 Vietnamese</option>
                    <option value="indonesian">🇮🇩 Indonesian</option>
                    <option value="malay">🇲🇾 Malay</option>
                    <option value="filipino">🇵🇭 Filipino</option>
                    <option value="swahili">🇰🇪 Swahili</option>
                  </optgroup>
                </select>
              </div>
              <div className="language-stats">
                <span>🇮🇳 11 Indian languages</span>
                <span className="lang-dot">•</span>
                <span>🌍 23 International languages</span>
              </div>
              <button
                className={`roast-btn${loading ? " loading" : ""}${!file ? " disabled" : ""}`}
                onClick={handleRoastClick} disabled={!file || loading}
              >
                {loading ? <span className="btn-loading"><span className="fire-spinner">🔥</span>Roasting...</span> : "🔥 Roast My Resume"}
              </button>
            </div>

            {loading && (
              <div className="loading-state">
                <div className="loading-msg" key={loadingMsgIdx}>{LOADING_MESSAGES[loadingMsgIdx]}</div>
                <div className="progress-bar-container"><div className="progress-bar-fill" style={{ animationDuration: "15s" }} /></div>
                <p className="loading-hint">☕ Grab a chai, this takes ~15 seconds...</p>
              </div>
            )}

            <div className="sample-card" style={{ marginTop: "16px" }}>
              <div className="sample-title">What verdict will you get?</div>
              <div className="sample-verdicts">
                <span className="verdict-badge tcs">🏭 Entry Level</span>
                <span className="verdict-badge startup">🚀 Startup Ready</span>
                <span className="verdict-badge product">💰 Product Co.</span>
                <span className="verdict-badge faang">🌟 FAANG Possible</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="results-section" ref={resultsRef}>
            <div className="results-header">
              <h2 className="results-title">Your Roast is Ready 😂</h2>
              <p className="results-subtitle">Brace yourself...</p>
            </div>

            <div className="verdict-only-row">
              <div className={`verdict-badge-large ${verdictClass}`}>
                {verdictClass === "faang" ? "🌟" : verdictClass === "product" ? "💰" : verdictClass === "startup" ? "🚀" : "🏭"} {verdictLabel}
              </div>
              <p className="verdict-description">
                {verdictClass === "faang" ? "Genuinely impressive. Apply everywhere." :
                 verdictClass === "product" ? "Solid resume. Polish the gaps." :
                 verdictClass === "startup" ? "Good bones. Show more impact." :
                 "Needs serious work. Read the guide carefully."}
              </p>
            </div>

            <div className="ats-score-box">
              <div className="ats-left">
                <span className="ats-label">📊 ATS Score</span>
                <span className="ats-hint">
                  {atsScore >= 80 ? "✅ ATS Friendly — will pass most filters" :
                   atsScore >= 60 ? "⚠️ Needs more keywords to pass ATS" :
                   "❌ ATS will likely filter you out"}
                </span>
              </div>
              <div className="ats-right">
                <span className="ats-value" style={{ color: atsScore >= 80 ? "#00e676" : atsScore >= 60 ? "#ffd700" : "#ff4444" }}>{atsScore}</span>
                <span className="ats-max">/100</span>
              </div>
            </div>

            <BadgeDisplay earned={earnedBadges} />

            <div className="roast-cards">
              {parsedSections.map((section, idx) => (
                <div key={section.key} className="roast-card" style={{ "--card-color": section.color, animationDelay: `${idx * 0.14}s` }}>
                  <div className="card-content">
                    {section.content.split("\n").map((line, i) =>
                      line.trim() && <p key={i} className={`card-line${/^[🔥💀✅📈🎯]/.test(line) ? " card-heading" : ""}`}>{line}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="results-actions">
              <button className="action-btn copy-btn" onClick={handleCopy}>📋 Copy</button>
              <button className="action-btn share-img-btn" onClick={handleShareImage}>🎨 Share Card</button>
              <button className="action-btn lb-btn" onClick={() => setShowLBModal(true)}>🏆 Leaderboard</button>
              <button className="action-btn reset-btn" onClick={handleReset}>🔄 Roast Another</button>
            </div>

            <div className="chai-nudge">
              Loved the roast? <a href="https://buymeacoffee.com/macoostudy" target="_blank" rel="noopener noreferrer">☕ Buy me a chai!</a>
            </div>
            <div className="share-nudge">Share your roast in your college group chat 😂</div>
          </div>
        )}

        <section className="faq-section">
          <h3 className="faq-heading">Frequently Asked Questions</h3>
          {FAQS.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </section>
      </main>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Router>
      <div className="app">
        <div className="bg-mesh" aria-hidden="true" />
        <div className="bg-grid" aria-hidden="true" />
        <Navbar />
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about" element={<About />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}
