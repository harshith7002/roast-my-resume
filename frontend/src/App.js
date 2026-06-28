import React, { lazy, Suspense, useState, useRef, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import "./App.css";
import { getUser, getVisitorId, pushAnalysisCache } from "./utils/storage";
import { apiFetch, validatePdf } from "./utils/api";
import { trackEvent } from "./utils/analytics";
import { saveLbEntry } from "./utils/leaderboard";
import { useTheme } from "./hooks/useTheme";
import { downloadReportPdf } from "./utils/pdf";
import RoastReport from "./components/RoastReport";

/* Weighted overall score from the deterministic category scores. */
function computeOverall(c) {
  if (!c) return 0;
  return Math.round(
    0.25 * (c.ats || 0) + 0.20 * (c.projects || 0) + 0.20 * (c.skills || 0) +
    0.15 * (c.experience || 0) + 0.20 * (c.impact || 0)
  );
}

const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Blog = lazy(() => import("./pages/Blog"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const About = lazy(() => import("./pages/About"));
const JDMatcher = lazy(() => import("./components/JDMatcher"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const ResumeHistory = lazy(() => import("./components/ResumeHistory"));
const ResumeCompare = lazy(() => import("./components/ResumeCompare"));
const PremiumFeatures = lazy(() => import("./components/PremiumFeatures"));

const BASE_COUNT  = 1247;


const MSGS = [
  "Judging your life choices...",
  "Consulting senior engineers...",
  "Preparing savage feedback...",
  "Laughing at your project names...",
  "Counting your buzzwords...",
  "Crying at your skill section...",
  "Wondering why you listed MS Word...",
  "Checking if recursion is explained...",
  "Reviewing your 4 tutorials listed as projects...",
];

const FAQS = [
  { q: "Is my resume stored anywhere?", a: "Nope. Processed in memory and immediately discarded. We never store, log, or sell your resume." },
  { q: "How is the roast generated?", a: "We use Groq AI (LLaMA) to analyze your resume and generate brutally honest feedback — like a senior engineer friend with zero filter." },
  { q: "Why is the feedback so harsh?", a: "Because sugarcoating doesn't get you jobs. Every criticism comes with an implicit fix." },
  { q: "What's Hinglish mode?", a: "Hinglish delivers the roast in a mix of Hindi and English — perfect for desi freshers. Bilkul seedha." },
  { q: "How accurate is the verdict?", a: "AI evaluates your resume holistically — CGPA, projects, internships, DSA. Realistic, not sugar-coated." },
];

const PERSONALITIES = [
  { id: "default", emoji: "🔥", name: "Savage Engineer",    desc: "Brutally honest senior dev" },
  { id: "gordon",  emoji: "👨‍🍳", name: "Gordon Ramsay",     desc: "THIS RESUME IS RAW!" },
  { id: "parent",  emoji: "👨‍👩‍👧", name: "Disappointed Parent", desc: "Log kya kahenge?" },
  { id: "techbro", emoji: "🤵", name: "Tech Bro",            desc: "Not disruptive enough" },
  { id: "senior",  emoji: "😤", name: "Toxic Senior",        desc: "Rewrote this in a weekend" },
  { id: "elon",    emoji: "🚀", name: "Elon Musk",           desc: "Delete 90% of your resume" },
];

const BADGES_DEF = [
  { id: "gordon",  emoji: "👨‍🍳", label: "Survived Gordon Ramsay", when: (p)    => p === "gordon" },
  { id: "faang",   emoji: "🌟", label: "FAANG Aspirant",           when: (_, v) => v?.includes("FAANG") },
  { id: "shame",   emoji: "💀", label: "Hall of Shame",            when: (_, v) => v?.includes("Entry") },
  { id: "startup", emoji: "🚀", label: "Startup Material",         when: (_, v) => v?.includes("Startup") },
  { id: "veteran", emoji: "🔥", label: "Roast Veteran",            when: ()     => parseInt(localStorage.getItem("roastCount") || 0) >= 5 },
];

const ROTD_LIST = [
  '"You listed MS Word as a skill. In 2024. Remarkable."',
  '"Your projects section is a YouTube tutorial graveyard."',
  '"import numpy as np = AI Engineer? Please stop."',
  '"Objective: Seeking a challenging position. Everyone wants that."',
  '"Hobbies: Listening to music, watching movies. Groundbreaking."',
  '"4 internship applications but 0 deployed projects. Interesting."',
  '"CGPA 6.2 and applying for FAANG? Respect the confidence."',
];

const SAMPLE_DATA = [
  { emoji: "🔥", title: "THE ROAST",     color: "#ff6b00", text: "Rahul listed 'MS Word' and 'MS PowerPoint' as technical skills in 2024. My grandmother knows MS Word. You also listed 'Team Player' — congratulations, you've described every human alive." },
  { emoji: "💀", title: "HALL OF SHAME", color: "#ffaa00", text: "1. Todo App, Weather App, Calculator — the holy trinity of tutorial projects 😂\n2. Objective: 'seeking a challenging position' — everyone wants that Rahul\n3. Hobbies: Listening to Music — so does literally everyone on Earth" },
  { emoji: "✅", title: "OKAY FINE",     color: "#00d68f", text: "GitHub link works and has some commits. Contact info is clean. At least you have a LinkedIn profile." },
  { emoji: "📈", title: "GLOW UP GUIDE", color: "#5599ff", text: "1. Remove MS Word from skills immediately\n2. Deploy something real with actual users\n3. Add numbers — '500 users', '40% faster'\n4. Delete the Objective section\n5. Add LeetCode problem count" },
];

const SAMPLE_CATS = { ats: 42, projects: 55, skills: 60, experience: 32, impact: 48 };

const WHY_FEATURES = [
  { icon: "🎯", metric: "5", unit: "category scores", color: "#ff6b00",
    desc: "Separate scores for ATS, Skills, Projects, Experience, and Impact — so you know exactly what to improve." },
  { icon: "🌍", metric: "34+", unit: "languages", color: "#00d68f",
    desc: "Analyze and receive feedback in your preferred language. Built for students worldwide." },
  { icon: "⚡", metric: "~15", unit: "seconds", color: "#ffaa00",
    desc: "Get your complete resume analysis with scores, fixes, and a downloadable report in seconds." },
  { icon: "🔒", metric: "Privacy", unit: "first", color: "#5599ff",
    desc: "Your resume is processed securely and isn't retained after analysis. No signup required." },
  { icon: "📄", metric: "1-click", unit: "PDF export", color: "#cc77ff",
    desc: "Download a clean, recruiter-ready report with scores, insights, and actionable recommendations." },
  { icon: "🔥", metric: "6", unit: "roast personalities", color: "#ff85a1",
    desc: "Pick a personality — from Gordon Ramsay to Savage Engineer. Every roast comes with practical improvements." },
];

const ATS_FACTORS = [
  { icon: "🔑", title: "Keywords", weight: "High", color: "#ff6b00",
    desc: "ATS bots scan for the exact tech and tools a job needs. Missing keywords = auto-rejected before a human ever sees you." },
  { icon: "📐", title: "Clean formatting", weight: "High", color: "#ffaa00",
    desc: "Tables, columns, images and fancy fonts confuse parsers. Simple, single-column text with standard headings reads cleanly." },
  { icon: "📊", title: "Quantified impact", weight: "High", color: "#00d68f",
    desc: "Numbers like '500 users' or '40% faster' signal real results. Vague duties ('responsible for…') score low." },
  { icon: "🧱", title: "Standard sections", weight: "Medium", color: "#5599ff",
    desc: "Education, Experience, Projects, Skills — named plainly. Creative headings ('My Journey') trip up the parser." },
  { icon: "🔗", title: "Contact & links", weight: "Low", color: "#cc77ff",
    desc: "A parseable email, GitHub and LinkedIn. Links buried in icons or headers often get dropped entirely." },
];

/* ── Helpers ──────────────────────────────────────────────────── */
function parseRoast(text) {
  const patterns = [
    { key: "roast",  emoji: "🔥", color: "#ff6b00" },
    { key: "shame",  emoji: "💀", color: "#ffaa00" },
    { key: "decent", emoji: "✅", color: "#00d68f" },
    { key: "glowup", emoji: "📈", color: "#5599ff" },
    { key: "verdict",emoji: "🎯", color: "#cc77ff" },
  ];
  const sections = [];
  patterns.forEach(({ key, emoji, color }, i) => {
    const next = patterns[i + 1]?.emoji;
    const rx   = next
      ? new RegExp(`${emoji}[\\s\\S]*?(?=${next})`, "g")
      : new RegExp(`${emoji}[\\s\\S]*$`, "g");
    const m = text.match(rx);
    if (m) sections.push({ key, color, content: m[0].trim() });
  });
  return sections.length ? sections : [{ key: "full", color: "#ff6b00", content: text }];
}

function verdictMeta(v = "") {
  const l = v.toLowerCase();
  if (l.includes("faang"))   return { cls: "faang",   label: "FAANG Possible", icon: "🌟", desc: "Genuinely impressive. Apply everywhere." };
  if (l.includes("product")) return { cls: "product", label: "Product Co.",    icon: "💰", desc: "Solid resume. Polish the gaps." };
  if (l.includes("startup")) return { cls: "startup", label: "Startup Ready",  icon: "🚀", desc: "Good bones. Show more impact." };
  return                              { cls: "entry",   label: "Entry Level",    icon: "🏭", desc: "Needs serious work. Read the guide carefully." };
}

function verdictKey(v = "") {
  const l = v.toLowerCase();
  if (l.includes("faang"))   return "faang";
  if (l.includes("product")) return "product";
  if (l.includes("startup")) return "startup";
  return "entry";
}

/* ── Sample drawer ────────────────────────────────────────────── */
function SampleDrawer({ open, onClose, onUpload }) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else       document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="sample-drawer"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="sample-drawer-handle" />

        {/* Header */}
        <div className="sample-drawer-header">
          <div>
            <p className="sample-drawer-title">👀 Real Roast Preview</p>
            <p className="sample-drawer-sub">This is exactly what your result looks like</p>
          </div>
          <button className="sample-drawer-close" onClick={onClose}>✕</button>
        </div>

        {/* Scrollable body */}
        <div className="sample-drawer-body">
          <RoastReport
            preview
            verdict="🚀 Startup Ready"
            verdictMeta={verdictMeta("startup")}
            overall={computeOverall(SAMPLE_CATS)}
            categories={SAMPLE_CATS}
            sections={SAMPLE_DATA.map((s, i) => ({
              key: `sample-${i}`,
              color: s.color,
              content: `${s.emoji} ${s.title}\n${s.text}`,
            }))}
          />

          <button
            className="fire-btn"
            style={{ marginTop: 4 }}
            onClick={() => { onUpload(); onClose(); }}
          >
            🔥 GET MY RESUME ROASTED
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── How ATS scoring works ────────────────────────────────────── */
function AtsExplainer() {
  return (
    <section className="ats-explainer">
      <div className="atsx-head">
        <p className="atsx-eyebrow">UNDER THE HOOD</p>
        <h3 className="atsx-title">How ATS scoring actually works</h3>
        <p className="atsx-sub">
          Over 90% of companies run resumes through an <strong>Applicant Tracking System</strong> before
          a recruiter reads them. Here's what those bots check — and what your score is built from.
        </p>
      </div>
      <div className="atsx-grid">
        {ATS_FACTORS.map((f) => (
          <motion.div
            key={f.title}
            className="atsx-card"
            style={{ "--ax-color": f.color }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="atsx-card-top">
              <span className="atsx-icon">{f.icon}</span>
              <span className={`atsx-weight w-${f.weight.toLowerCase()}`}>{f.weight} impact</span>
            </div>
            <p className="atsx-card-title">{f.title}</p>
            <p className="atsx-card-desc">{f.desc}</p>
          </motion.div>
        ))}
      </div>
      <p className="atsx-foot">
        🔍 Your report breaks this into five live scores — <strong>ATS, Skills, Projects, Experience, Impact</strong> — so you know exactly where you're losing points.
      </p>
    </section>
  );
}

/* ── Why RoastMyResume ────────────────────────────────────────── */
/* Real, verifiable product features and metrics — no fabricated quotes.
   The testimonials placeholder below is intentionally left for genuine
   user stories once we have permission to publish them. */
function WhyRoastMyResume() {
  return (
    <section className="why-section">
      <div className="why-head">
        <p className="why-eyebrow">WHY ROASTMYRESUME</p>
        <h3 className="why-title">Know exactly what to fix.</h3>
        <p className="why-sub">No generic "looks good!" Every score comes with a real, specific fix — built for CS freshers who need to stand out.</p>
      </div>
      <div className="why-grid">
        {WHY_FEATURES.map((f) => (
          <motion.div
            key={f.unit}
            className="why-card"
            style={{ "--why-color": f.color }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="why-icon">{f.icon}</span>
            <p className="why-metric">{f.metric} <span className="why-unit">{f.unit}</span></p>
            <p className="why-desc">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Placeholder for real user testimonials — to be filled with
          genuine, opt-in stories. Intentionally not fabricated. */}
      <div className="why-testimonials-placeholder">
        <span className="wtp-badge">COMING SOON</span>
        <p className="wtp-title">Real stories from real users</p>
        <p className="wtp-sub">
          We don't fake reviews. Got roasted and landed something? We'd love to feature your story (with your permission).
        </p>
        <a className="wtp-link" href="mailto:hello@macoostudy.info?subject=My%20RoastMyResume%20story">
          Share your story →
        </a>
      </div>
    </section>
  );
}

/* ── Ember particles ──────────────────────────────────────────── */
function Embers() {
  const es = Array.from({ length: 18 }, (_, i) => ({
    id: i, x: Math.random() * 100,
    delay: Math.random() * 8, dur: 6 + Math.random() * 6,
    size: 4 + Math.random() * 10, drift: (Math.random() - 0.5) * 80,
  }));
  return (
    <div className="embers" aria-hidden="true">
      {es.map(e => (
        <div key={e.id} className="ember" style={{
          left: `${e.x}%`, width: e.size, height: e.size,
          animationDelay: `${e.delay}s`, animationDuration: `${e.dur}s`,
          "--drift": `${e.drift}px`,
        }} />
      ))}
    </div>
  );
}

/* ── Toast ────────────────────────────────────────────────────── */
function Toasts({ items }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map(t => (
        <div key={t.id} className="toast">
          <span className="toast-icon">{t.icon}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Confetti ─────────────────────────────────────────────────── */
function Confetti({ on }) {
  const COLS = ["#ff6b00","#ffaa00","#ffc844","#00d68f","#5599ff","#cc77ff","#ff85a1"];
  if (!on) return null;
  const ps = Array.from({ length: 80 }, (_, i) => ({
    id: i, x: Math.random() * 100, color: COLS[i % COLS.length],
    delay: Math.random() * 0.9, dur: 1.6 + Math.random() * 1.6,
    size: 7 + Math.random() * 9, drift: (Math.random() - 0.5) * 120,
    circle: Math.random() > 0.5,
  }));
  return (
    <div className="confetti-wrap" aria-hidden="true">
      {ps.map(p => (
        <div key={p.id} className="confetti-p" style={{
          left: `${p.x}%`, background: p.color, width: p.size,
          height: p.circle ? p.size : p.size * 0.4,
          borderRadius: p.circle ? "50%" : "2px",
          "--delay": `${p.delay}s`, "--dur": `${p.dur}s`, "--drift": `${p.drift}px`,
        }} />
      ))}
    </div>
  );
}

/* ── FAQ item ─────────────────────────────────────────────────── */
function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " open" : ""}`}>
      <button className="faq-q" type="button" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <span className="faq-arrow" aria-hidden="true">{open ? "×" : "+"}</span>
      </button>
      <div className="faq-a">{a}</div>
    </div>
  );
}

/* ── Navbar ───────────────────────────────────────────────────── */
function Navbar({ onUploadClick, theme, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const loc  = useLocation();
  const active = (p) => loc.pathname === p ? "nav-link active" : "nav-link";
  const toolsRef = useRef(null);

  // Close tools dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const closeAll = () => { setOpen(false); setToolsOpen(false); };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={closeAll}>
        <div className="brand-icon">🔥</div>
        <span className="brand-name">Roast<span>My</span>Resume</span>
      </Link>

      <div className={`navbar-center${open ? " open" : ""}`}>
        <Link to="/"            className={active("/")}            onClick={closeAll}>Roast</Link>
        <Link to="/jd-match"    className={active("/jd-match")}    onClick={closeAll}>JD Match</Link>
        <Link to="/leaderboard" className={active("/leaderboard")} onClick={closeAll}>Leaderboard</Link>
        <Link to="/blog"        className={active("/blog")}        onClick={closeAll}>Blog</Link>
        <Link to="/about"       className={active("/about")}       onClick={closeAll}>About</Link>

        {/* Tools Dropdown */}
        <div className="nav-dropdown" ref={toolsRef}>
          <button
            className={`nav-link nav-dropdown-trigger${toolsOpen ? " active" : ""}`}
            onClick={() => setToolsOpen(o => !o)}
            aria-expanded={toolsOpen}
            aria-haspopup="true"
          >
            Tools <span className={`nav-dropdown-arrow${toolsOpen ? " open" : ""}`}>▾</span>
          </button>
          {toolsOpen && (
            <div className="nav-dropdown-menu" role="menu">
              <Link to="/compare" className="nav-dropdown-item" onClick={closeAll} role="menuitem">
                <span className="ndi-icon">⚖️</span>
                <span>
                  <span className="ndi-label">Compare Versions</span>
                  <span className="ndi-sub">See ATS score delta</span>
                </span>
              </Link>
              <Link to="/history" className="nav-dropdown-item" onClick={closeAll} role="menuitem">
                <span className="ndi-icon">📋</span>
                <span>
                  <span className="ndi-label">History</span>
                  <span className="ndi-sub">Session-only · not saved</span>
                </span>
              </Link>
              <Link to="/dashboard" className="nav-dropdown-item" onClick={closeAll} role="menuitem">
                <span className="ndi-icon">📊</span>
                <span>
                  <span className="ndi-label">Dashboard</span>
                  <span className="ndi-sub">Your analysis overview</span>
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile-only upload CTA inside menu */}
        <button className="nav-upload-cta-mobile fire-btn" onClick={() => { closeAll(); onUploadClick?.(); }}>
          📂 Upload Resume
        </button>
      </div>

      <div className="navbar-right">
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title={theme === "light" ? "Dark mode" : "Light mode"}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <button
          className="nav-cta"
          onClick={() => { closeAll(); onUploadClick?.(); }}
          aria-label="Upload your resume"
        >
          📂 Upload Resume
        </button>
        <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle navigation" aria-expanded={open}>
          <span className={open ? "ham-open" : ""} />
          <span className={open ? "ham-open" : ""} />
          <span className={open ? "ham-open" : ""} />
        </button>
      </div>
    </nav>
  );
}

/* ── Footer ───────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <span className="fb-logo">🔥 RoastMyResume</span>
          <p className="fb-tag">Brutal honesty. Actionable fixes. Zero sugarcoating. Built for CS freshers worldwide.</p>
        
        </div>
        <div className="footer-cols">
          <div className="fcol">
            <h4>Tool</h4>
            <Link to="/">Roast My Resume</Link>
            <Link to="/jd-match">JD Matcher</Link>
            <Link to="/compare">Compare Versions</Link>
            <Link to="/history">History</Link>
            <Link to="/leaderboard">Leaderboard</Link>
          </div>
          <div className="fcol">
            <h4>Info</h4>
            <Link to="/blog">Blog</Link>
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
          <div className="fcol"><h4>Privacy</h4><span>PDFs are processed in memory</span><span>Files are never retained</span></div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 RoastMyResume • 10 countries & counting 🌍</span>
        <span>
          Built by{" "}
          <a href="https://portfolio-saiharshith.netlify.app" target="_blank" rel="noopener noreferrer">
            Sai Harshith
          </a>{" "}
          🔥
        </span>
      </div>
    </footer>
  );
}

/* ── Personality modal ────────────────────────────────────────── */
function PersonalityModal({ onSelect, onClose }) {
  const [sel, setSel] = useState("default");
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Who's Roasting You?</h2>
        <p className="modal-sub">Pick your roaster before we begin</p>
        <div className="personality-grid">
          {PERSONALITIES.map(p => (
            <button
              key={p.id}
              className={`p-btn${sel === p.id ? " sel" : ""}`}
              onClick={() => setSel(p.id)}
            >
              <span className="p-emoji">{p.emoji}</span>
              <span className="p-name">{p.name}</span>
              <span className="p-desc">{p.desc}</span>
            </button>
          ))}
        </div>
        <button className="modal-fire-btn" onClick={() => onSelect(sel)}>
          🔥 Start Roasting
        </button>
        <button className="modal-cancel" onClick={onClose}>maybe later</button>
      </div>
    </div>
  );
}

/* ── Leaderboard entry modal ──────────────────────────────────── */
function LeaderboardModal({ roastSnippet, verdict, ats, onSubmit, onClose }) {
  const [name, setName]     = useState("");
  const [step, setStep]     = useState("ask"); // ask | name | done
  const vKey = verdictKey(verdict);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const entry = {
      id:      `u_${Date.now()}`,
      name:    name.trim(),
      quote:   roastSnippet,
      verdict: vKey,
      ats,
      votes:   0,
      ts:      Date.now(),
    };
    saveLbEntry(entry);
    setStep("done");
    setTimeout(() => { onSubmit(); onClose(); }, 1800);
  };

  return (
    <div className="modal-bg" onClick={step === "ask" ? onClose : undefined}>
      <div className="modal-box lb-modal-box" onClick={e => e.stopPropagation()}>

        {step === "ask" && (
          <>
            <div className="lb-modal-icon">🏆</div>
            <h2 className="modal-title">Enter the Leaderboard?</h2>
            <p className="modal-sub">
              Your roast will be visible to the community — they'll vote on the funniest ones.
              Weekly top 3 win prizes!
            </p>
            <div className="lb-modal-prizes">
              <span>🥇 Free Resume Fix</span>
              <span>🥈 ATS Analysis</span>
              <span>🥉 Priority Roast</span>
            </div>
            <div className="lb-modal-actions">
              <button className="modal-fire-btn" onClick={() => setStep("name")}>
                🏆 Yes, Enter Me!
              </button>
              <button className="modal-cancel" onClick={onClose}>No thanks</button>
            </div>
          </>
        )}

        {step === "name" && (
          <>
            <div className="lb-modal-icon">✍️</div>
            <h2 className="modal-title">What's your name?</h2>
            <p className="modal-sub">This is how you'll appear on the leaderboard.</p>
            <input
              className="lb-name-input"
              type="text"
              placeholder="e.g. Rahul from DTU 🔥"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              maxLength={40}
              autoFocus
            />
            <div className="lb-modal-actions">
              <button
                className="modal-fire-btn"
                onClick={handleSubmit}
                disabled={!name.trim()}
              >
                🚀 Submit My Roast
              </button>
              <button className="modal-cancel" onClick={() => setStep("ask")}>← Back</button>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <div className="lb-modal-icon" style={{ fontSize: 52 }}>🎉</div>
            <h2 className="modal-title">You're on the board!</h2>
            <p className="modal-sub">Go vote for the funniest roasts and check your ranking.</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Roast counter ────────────────────────────────────────────── */
function RoastCounter() {
  const [n, setN] = useState(BASE_COUNT);
  useEffect(() => {
    const update = () => {
      const s = localStorage.getItem("roastCount");
      if (s) setN(parseInt(s));
    };
    update();
    window.addEventListener("lb_updated", update);
    return () => window.removeEventListener("lb_updated", update);
  }, []);
  return (
    <div className="roast-counter">
      <span className="rc-num">{n.toLocaleString()}</span>
      <span className="rc-lbl">resumes roasted</span>
    </div>
  );
}

/* ── Main app ─────────────────────────────────────────────────── */
function MainApp({ showSampleDrawer = () => {}, closeSampleDrawer = () => {}, registerUpload = () => {} }) {
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [roast, setRoast]         = useState(null);
  const [verdict, setVerdict]     = useState("");
  const [ats, setAts]             = useState(0);
  const [cats, setCats]           = useState(null);
  const [err, setErr]             = useState(null);
  const [over, setOver]           = useState(false);
  const [lang, setLang]           = useState("english");
  const [personality, setP]       = useState("default");
  const [modal, setModal]         = useState(false);
  const [lbModal, setLbModal]     = useState(false);
  const [toasts, setToasts]       = useState([]);
  const [confetti, setConfetti]   = useState(false);
  const [burst, setBurst]         = useState(false);
  const [msgIdx, setMsgIdx]       = useState(0);
  const [badges, setBadges]       = useState([]);
  const [roastSnippet, setRoastSnippet] = useState("");
  const fileRef    = useRef();
  const resultsRef = useRef();

  // Register upload trigger so root SampleDrawer can fire the file picker
  useEffect(() => {
    registerUpload(() => fileRef.current?.click());
  }, [registerUpload]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setMsgIdx(i => (i + 1) % MSGS.length), 2200);
    return () => clearInterval(id);
  }, [loading]);

  const toast = useCallback((msg, icon = "ℹ️") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  const handleFile = (f) => {
    const validationError = validatePdf(f);
    if (!validationError) {
      setFile(f); setErr(null); setBurst(true);
      setTimeout(() => setBurst(false), 600);
      toast(`${f.name} loaded!`, "📄");
      trackEvent("resume_selected", { size_kb: Math.round(f.size / 1024) });
    } else {
      toast(validationError, "⚠️");
      setErr(validationError);
      trackEvent("upload_rejected", { reason: validationError });
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files[0]); };
  const onRoastClick = () => {
    if (!file) return;
    trackEvent("roast_cta_clicked", { language: lang });
    setModal(true);
  };

  const onPersonalitySelect = async (p) => {
    setModal(false); setP(p);
    await submit(p);
  };

  const submit = async (p = personality) => {
    if (!file) return;
    setLoading(true); setRoast(null); setErr(null); setMsgIdx(0);
    const fd = new FormData();
    fd.append("resume", file); fd.append("language", lang); fd.append("personality", p);
    const u = getUser();
    fd.append("user_id", u?.user_id || getVisitorId());
    try {
      trackEvent("roast_started", { language: lang, personality: p });
      const data = await apiFetch("/api/roast", { method: "POST", body: fd, timeout: 60000 });
      if (data.success) {
        setRoast(data.roast);
        setVerdict(data.verdict || "Entry Level");
        trackEvent("roast_completed", { verdict: data.verdict || "unknown", ats_score: data.ats_score });
        setAts(data.ats_score || 0);
        // Fall back to deriving a single-bucket breakdown if the backend is older.
        setCats(data.category_scores || {
          ats: data.ats_score || 0, projects: 0, skills: 0, experience: 0, impact: 0,
        });
        pushAnalysisCache({
          id: data.analysis_id,
          type: "roast",
          filename: file.name,
          ats_score: data.ats_score,
          verdict: data.verdict,
          result: { roast: data.roast, category_scores: data.category_scores },
        });

        // Extract snippet for leaderboard
        const parsed  = parseRoast(data.roast);
        const roastSec = parsed.find(s => s.key === "roast") || parsed[0];
        const snippet  = roastSec
          ? roastSec.content.replace(/^🔥[^\n]*\n?/, "").trim().slice(0, 200)
          : data.roast.slice(0, 200);
        setRoastSnippet(snippet);

        const earned = BADGES_DEF.filter(b => b.when(p, data.verdict));
        setBadges(earned);

        // Update roast counter
        const newCount = parseInt(localStorage.getItem("roastCount") || BASE_COUNT) + 1;
        localStorage.setItem("roastCount", newCount);

        if (data.verdict?.toLowerCase().includes("faang")) {
          setConfetti(true); setTimeout(() => setConfetti(false), 4500);
          toast("FAANG Possible! You might actually get hired!", "🌟");
        } else {
          toast("Your roast is ready. Brace yourself...", "🔥");
        }
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
        // Show leaderboard invite after results scroll
        setTimeout(() => setLbModal(true), 2200);
      } else {
        setErr(data.error || "Something went wrong!"); toast(data.error || "Error", "💀");
      }
    } catch (requestError) {
      setErr(requestError.message); toast(requestError.message, "🔌");
      trackEvent("roast_failed", { reason: requestError.message });
    } finally { setLoading(false); }
  };

  const copyRoast = () => { navigator.clipboard.writeText(roast); toast("Copied! Send it to your rivals 😂", "📋"); };

  const reset = () => {
    setFile(null); setRoast(null); setErr(null); setVerdict(""); setAts(0); setCats(null);
    setBadges([]); setConfetti(false); setLbModal(false); setRoastSnippet("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const downloadPdf = () => {
    toast("Building your PDF report...", "📄");
    try {
      const vmeta = verdictMeta(verdict);
      downloadReportPdf({
        verdict: vmeta.label,
        verdictDesc: vmeta.desc,
        overall: computeOverall(cats),
        categories: cats,
        sections: parseRoast(roast),
        filename: file?.name || "resume",
      });
      trackEvent("pdf_downloaded", {});
    } catch (e) {
      toast("Could not build PDF. Try again.", "⚠️");
    }
  };

  const shareImage = () => {
    toast("Generating share card...", "🎨");
    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 460;
    const ctx = canvas.getContext("2d");
    const bg  = ctx.createLinearGradient(0, 0, 800, 460);
    bg.addColorStop(0, "#100b00"); bg.addColorStop(1, "#1a1000");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 800, 460);
    ctx.strokeStyle = "rgba(255,107,0,0.35)"; ctx.lineWidth = 2; ctx.strokeRect(1,1,798,458);
    ctx.fillStyle = "#ff6b00"; ctx.font = "bold 38px serif"; ctx.fillText("🔥 ROAST MY RESUME", 40, 70);
    ctx.fillStyle = "rgba(255,245,224,0.35)"; ctx.font = "15px monospace"; ctx.fillText("macoostudy.info", 40, 96);
    const vm = verdictMeta(verdict);
    ctx.fillStyle = "#ffaa00"; ctx.font = "bold 24px sans-serif"; ctx.fillText(`${vm.icon} ${vm.label}`, 40, 144);
    ctx.fillStyle = "#5599ff"; ctx.font = "15px sans-serif"; ctx.fillText(`ATS Score: ${ats}/100`, 40, 178);
    const ps    = parseRoast(roast);
    const first = ps.find(s => s.key === "roast");
    if (first) {
      ctx.fillStyle = "rgba(255,245,224,0.55)"; ctx.font = "14px sans-serif";
      const words = first.content.replace(/^🔥[^\n]*\n?/, "").split(" ");
      let line = "", y = 222;
      for (const w of words) {
        const t = line + w + " ";
        if (ctx.measureText(t).width > 720 && line) {
          ctx.fillText(line.trim(), 40, y); line = w + " "; y += 26;
          if (y > 370) { ctx.fillText("...", 40, y); break; }
        } else line = t;
      }
      if (y <= 370) ctx.fillText(line.trim(), 40, y);
    }
    ctx.fillStyle = "rgba(255,107,0,0.6)"; ctx.font = "12px monospace";
    ctx.fillText("Try it free → macoostudy.info", 40, 432);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "roast-card.png"; a.click();
      URL.revokeObjectURL(url); toast("Card downloaded!", "🎉");
    });
  };

  const sections = roast ? parseRoast(roast) : [];
  const vm   = verdictMeta(verdict);
  const rotd = ROTD_LIST[new Date().getDay() % ROTD_LIST.length];

  return (
    <div className="page-wrap">
      <Embers />
      <Confetti on={confetti} />
      <Toasts items={toasts} />
      {modal    && <PersonalityModal onSelect={onPersonalitySelect} onClose={() => setModal(false)} />}
      {lbModal  && (
        <LeaderboardModal
          roastSnippet={roastSnippet}
          verdict={verdict}
          ats={ats}
          onSubmit={() => toast("You're on the leaderboard! 🏆", "🏆")}
          onClose={() => setLbModal(false)}
        />
      )}

      {/* ── Hero ── */}
      <motion.header
        className="hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Above-the-fold trust strip */}
        <div className="hero-trust-strip">
          <span className="hts-item">✓ Private</span>
          <span className="hts-sep">·</span>
          <span className="hts-item">✓ No Signup Required</span>
          <span className="hts-sep">·</span>
          <span className="hts-item">✓ Free Analysis</span>
          <span className="hts-sep">·</span>
          <span className="hts-item">🌍 10+ Countries</span>
        </div>

        <div className="header-badges-row">
          <RoastCounter />
          <div className="trust-pill">🔒 Secure Processing</div>
        </div>

        <div className="hero-eyebrow">
          <span className="eyebrow-dot" />
          AI-Powered Resume Analysis
        </div>

        <h1 className="hero-title">
          <span className="ht-roast">ROAST</span>
          <span className="ht-my">MY</span>
          <span className="ht-resume">RESUME</span>
        </h1>

        <p className="hero-sub">
          Find out <strong>exactly why your resume gets skipped</strong> — before a real recruiter does.
        </p>

        <div className="feature-chips">
          <span className="fchip">🔥 Brutal Roast</span>
          <span className="fchip">📊 ATS Score</span>
          <span className="fchip fchip-hot">🎯 5 Specific Fixes</span>
          <span className="fchip">🌍 34+ Languages</span>
          <span className="fchip">📸 Share as Image</span>
        </div>

        <div className="hero-cta-row">
          <button
            className="btn-primary btn-hero-cta"
            id="hero-upload-btn"
            onClick={() => { closeSampleDrawer(); fileRef.current?.click(); }}
          >
            📂 Upload Resume — It's Free
          </button>
          <button className="btn-secondary" onClick={showSampleDrawer}>
            👀 See Sample Roast
          </button>
        </div>

        <p className="hero-microcopy">
          Get ATS score, resume feedback and actionable fixes in under 15 seconds.
        </p>

        <div className="hero-trust-badges" role="list" aria-label="Security and privacy guarantees">
          <span className="htb-item" role="listitem"><span className="htb-icon">🔒</span> Encrypted in transit</span>
          <span className="htb-item" role="listitem"><span className="htb-icon">🗑️</span> PDF never stored</span>
          <span className="htb-item" role="listitem"><span className="htb-icon">✓</span> No account required</span>
          <span className="htb-item" role="listitem"><span className="htb-icon">🤫</span> Never publicly shared</span>
        </div>
      </motion.header>


      {/* ── Upload — directly below hero ── */}
      {!roast && (
        <div className="upload-zone">
          <input
            ref={fileRef} type="file" accept=".pdf"
            style={{ display: "none" }}
            onChange={e => handleFile(e.target.files[0])}
          />
          <div
            className={`dropzone${over ? " over" : ""}${file ? " has-file" : ""}${burst ? " burst" : ""}`}
            role="button"
            tabIndex={file ? -1 : 0}
            aria-label={file ? `${file.name} selected` : "Upload resume PDF"}
            onDragOver={e => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={handleDrop}
            onClick={() => !file && fileRef.current.click()}
            onKeyDown={e => { if (!file && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); fileRef.current.click(); } }}
          >
            {file ? (
              <div className="file-card">
                <span className="file-card-icon">📄</span>
                <span className="file-card-name">{file.name}</span>
                <span className="file-card-size">{(file.size / 1024).toFixed(1)} KB</span>
                <button className="file-change" onClick={e => { e.stopPropagation(); fileRef.current.click(); }}>
                  Change file
                </button>
              </div>
            ) : (
              <>
                <span className="dz-icon">📋</span>
                <p className="dz-title">Drop your resume PDF here</p>
                <p className="dz-sub">or click to browse</p>
                <span className="dz-btn">📂 Upload PDF</span>
                <p className="dz-hint">PDF only • Max 10MB</p>
              </>
            )}
          </div>

          {err && <div className="err-box" role="alert">⚠️ {err}</div>}

          <div className="lang-block">
            <span className="lang-label">🌐 Roast Language</span>
            <select className="lang-select" value={lang} onChange={e => setLang(e.target.value)}>
              <option value="english">🌍 English (Default)</option>
              <optgroup label="🇮🇳 Indian Languages">
                <option value="hinglish">🇮🇳 Hindi + English (Hinglish)</option>
                <option value="tanglish">🇮🇳 Tamil + English (Tanglish)</option>
                <option value="tenglish">🇮🇳 Telugu + English (Tenglish)</option>
                <option value="benglish">🇮🇳 Bengali + English</option>
                <option value="manglish">🇮🇳 Malayalam + English (Manglish)</option>
                <option value="kanglish">🇮🇳 Kannada + English (Kanglish)</option>
                <option value="punglish">🇮🇳 Punjabi + English (Punglish)</option>
                <option value="marathish">🇮🇳 Marathi + English</option>
                <option value="gujarish">🇮🇳 Gujarati + English</option>
                <option value="orish">🇮🇳 Odia + English</option>
                <option value="assamese">🇮🇳 Assamese + English</option>
              </optgroup>
              <optgroup label="🌍 International">
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
            <div className="lang-chips">
              <span className="lang-chip">🇮🇳 11 Indian</span>
              <span className="lang-chip">🌍 23 International</span>
            </div>
          </div>

          <button
            className={`fire-btn${loading ? " fire-btn-loading" : ""}${!file ? " fire-btn-disabled" : ""}`}
            onClick={onRoastClick}
            disabled={!file || loading}
          >
            {loading
              ? <span className="btn-load-inner"><span className="spin">🔥</span> ROASTING...</span>
              : "🔥 ROAST MY RESUME"}
          </button>

          <p className="upload-privacy">By continuing, you agree to our <Link to="/privacy">privacy policy</Link>. Your PDF is processed only for this analysis and discarded immediately.</p>

          {loading && (
            <div className="loading-box">
              <p className="loading-msg" key={msgIdx}>{MSGS[msgIdx]}</p>
              <div className="progress-track">
                <div className="progress-fill" style={{ animationDuration: "15s" }} />
              </div>
              <p className="loading-sub">☕ grab a coffee, ~15 seconds...</p>
            </div>
          )}
        </div>
      )}

      {/* ── Verdict types ── */}
      {!roast && !loading && (
        <div className="verdict-types">
          <p className="vt-label">What verdict will you get?</p>
          <div className="vt-row">
            <span className="vbadge entry">🏭 Entry Level</span>
            <span className="vbadge startup">🚀 Startup Ready</span>
            <span className="vbadge product">💰 Product Co.</span>
            <span className="vbadge faang">🌟 FAANG Possible</span>
          </div>
        </div>
      )}

      {/* ── How it Works ── */}
      {!roast && (
        <section className="how-section">
          <p className="how-label">HOW IT WORKS</p>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-num">1</div>
              <div className="how-icon">📄</div>
              <p className="how-title">Upload Resume</p>
              <p className="how-desc">Drop your PDF. No sign-up, no email, no nonsense.</p>
            </div>
            <div className="how-arrow">→</div>
            <div className="how-step">
              <div className="how-num">2</div>
              <div className="how-icon">🤖</div>
              <p className="how-title">AI Analyzes It</p>
              <p className="how-desc">LLaMA reads it like a brutally honest senior engineer.</p>
            </div>
            <div className="how-arrow">→</div>
            <div className="how-step">
              <div className="how-num">3</div>
              <div className="how-icon">🔥</div>
              <p className="how-title">Get Roast + Fixes</p>
              <p className="how-desc">ATS score, top mistakes, and 5 specific fixes to act on today.</p>
            </div>
          </div>
        </section>
      )}

      {/* ── How ATS scoring works ── */}
      {!roast && <AtsExplainer />}

      {/* ── Why RoastMyResume ── */}
      {!roast && <WhyRoastMyResume />}

      {/* ── Roast of the Day ── */}
      {!roast && (
        <div className="rotd-banner">
          <div className="rotd-inner">
            <span className="rotd-tag">ROAST OF THE DAY</span>
            <p className="rotd-text"><strong>AI says:</strong> {rotd}</p>
          </div>
        </div>
      )}


      {/* ── Results ── */}
      {roast && (
        <div className="results-wrap" ref={resultsRef}>
          <RoastReport
            verdict={verdict}
            verdictMeta={vm}
            overall={computeOverall(cats)}
            categories={cats}
            sections={sections}
            badges={badges}
            onCopy={copyRoast}
            onShareCard={shareImage}
            onDownloadPdf={downloadPdf}
            onLeaderboard={() => setLbModal(true)}
            onReset={reset}
          />
        </div>
      )}

      {/* ── FAQ ── */}
      <section className="faq-section">
        <h3 className="faq-title">FAQ</h3>
        {FAQS.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)}
      </section>
    </div>
  );
}

/* ── Root ─────────────────────────────────────────────────────── */
export default function App() {
  const [showSample, setShowSample] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const uploadRef = useRef(null);
  const registerUpload = useCallback((fn) => { uploadRef.current = fn; }, []);

  const handleNavUpload = useCallback(() => {
    // If on home page, trigger the file picker; otherwise navigate to home first
    if (uploadRef.current) {
      uploadRef.current();
    } else {
      // Scroll to upload section as fallback
      const el = document.getElementById("upload-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <Router>
      <div className="app">
        <div className="bg-canvas" aria-hidden="true" />
        <div className="bg-grid"   aria-hidden="true" />
        <Navbar onUploadClick={handleNavUpload} theme={theme} onToggleTheme={toggleTheme} />

        {/* Drawer lives at root — never clipped by any child stacking context */}
        <SampleDrawer
          open={showSample}
          onClose={() => setShowSample(false)}
          onUpload={() => uploadRef.current?.()}
        />

        <Suspense fallback={<main className="page-wrap route-loading" aria-live="polite">Loading…</main>}>
        <Routes>
          <Route path="/"            element={
            <MainApp
              showSampleDrawer={() => setShowSample(true)}
              closeSampleDrawer={() => setShowSample(false)}
              registerUpload={registerUpload}
            />
          } />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/blog"        element={<Blog />} />
          <Route path="/privacy"     element={<PrivacyPolicy />} />
          <Route path="/about"       element={<About />} />
          <Route path="/jd-match"   element={<JDMatcher />} />
          <Route path="/compare"    element={<ResumeCompare />} />
          <Route path="/history"    element={<ResumeHistory />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/upcoming"   element={<PremiumFeatures />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        <Footer />
      </div>
    </Router>
  );
}
