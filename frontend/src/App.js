import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import "./App.css";
import Leaderboard from "./pages/Leaderboard";
import Blog from "./pages/Blog";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import About from "./pages/About";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

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
  { id: "default", emoji: "🔥", name: "Savage Engineer", desc: "Brutally honest senior dev" },
  { id: "gordon",  emoji: "👨‍🍳", name: "Gordon Ramsay",  desc: "THIS RESUME IS RAW!" },
  { id: "parent",  emoji: "👨‍👩‍👧", name: "Disappointed Parent", desc: "Log kya kahenge?" },
  { id: "techbro", emoji: "🤵", name: "Tech Bro",         desc: "Not disruptive enough" },
  { id: "senior",  emoji: "😤", name: "Toxic Senior",     desc: "Rewrote this in a weekend" },
  { id: "elon",    emoji: "🚀", name: "Elon Musk",        desc: "Delete 90% of your resume" },
];

const BADGES_DEF = [
  { id: "gordon",    emoji: "👨‍🍳", label: "Survived Gordon Ramsay", when: (p) => p === "gordon" },
  { id: "faang",     emoji: "🌟", label: "FAANG Aspirant",            when: (_, v) => v?.includes("FAANG") },
  { id: "shame",     emoji: "💀", label: "Hall of Shame",             when: (_, v) => v?.includes("Entry") },
  { id: "startup",   emoji: "🚀", label: "Startup Material",          when: (_, v) => v?.includes("Startup") },
  { id: "veteran",   emoji: "🔥", label: "Roast Veteran",             when: () => parseInt(localStorage.getItem("roastCount") || 0) >= 5 },
];

const ROTD_LIST = [
  "\"You listed MS Word as a skill. In 2024. Remarkable.\"",
  "\"Your projects section is a YouTube tutorial graveyard.\"",
  "\"import numpy as np = AI Engineer? Please stop.\"",
  "\"Objective: Seeking a challenging position. Everyone wants that.\"",
  "\"Hobbies: Listening to music, watching movies. Groundbreaking.\"",
  "\"4 internship applications but 0 deployed projects. Interesting.\"",
  "\"CGPA 6.2 and applying for FAANG? Respect the confidence.\"",
];

const SAMPLE_DATA = [
  { emoji: "🔥", title: "THE ROAST",   color: "#ff3d00", text: "Rahul listed 'MS Word' and 'MS PowerPoint' as technical skills in 2024. My grandmother knows MS Word. You also listed 'Team Player' — congratulations, you've described every human alive." },
  { emoji: "💀", title: "HALL OF SHAME", color: "#ff9100", text: "1. Todo App, Weather App, Calculator — the holy trinity of tutorial projects 😂\n2. Objective: 'seeking a challenging position' — everyone wants that Rahul\n3. Hobbies: Listening to Music — so does literally everyone on Earth" },
  { emoji: "✅", title: "OKAY FINE",   color: "#00e676", text: "GitHub link works and has some commits. Contact info is clean. At least you have a LinkedIn profile." },
  { emoji: "📈", title: "GLOW UP GUIDE", color: "#2979ff", text: "1. Remove MS Word from skills immediately\n2. Deploy something real with actual users\n3. Add numbers — '500 users', '40% faster'\n4. Delete the Objective section\n5. Add LeetCode problem count" },
];

/* ── Helpers ──────────────────────────────────────────────────── */
function parseRoast(text) {
  const patterns = [
    { key: "roast",  emoji: "🔥", color: "#ff3d00" },
    { key: "shame",  emoji: "💀", color: "#ff9100" },
    { key: "decent", emoji: "✅", color: "#00e676" },
    { key: "glowup", emoji: "📈", color: "#2979ff" },
    { key: "verdict",emoji: "🎯", color: "#9c27b0" },
  ];
  const sections = [];
  patterns.forEach(({ key, emoji, color }, i) => {
    const next = patterns[i + 1]?.emoji;
    const rx = next ? new RegExp(`${emoji}[\\s\\S]*?(?=${next})`, "g") : new RegExp(`${emoji}[\\s\\S]*$`, "g");
    const m = text.match(rx);
    if (m) sections.push({ key, color, content: m[0].trim() });
  });
  return sections.length ? sections : [{ key: "full", color: "#ff3d00", content: text }];
}

function verdictMeta(v = "") {
  const l = v.toLowerCase();
  if (l.includes("faang"))   return { cls: "faang",   label: "FAANG Possible",       icon: "🌟", desc: "Genuinely impressive. Apply everywhere." };
  if (l.includes("product")) return { cls: "product", label: "Product Co.",           icon: "💰", desc: "Solid resume. Polish the gaps." };
  if (l.includes("startup")) return { cls: "startup", label: "Startup Ready",         icon: "🚀", desc: "Good bones. Show more impact." };
  return                              { cls: "entry",   label: "Entry Level",           icon: "🏭", desc: "Needs serious work. Read the guide carefully." };
}

/* ── Ember Particles ─────────────────────────────────────────── */
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

/* ── Toast ───────────────────────────────────────────────────── */
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

/* ── Confetti ────────────────────────────────────────────────── */
function Confetti({ on }) {
  const COLS = ["#ff3d00","#ff9100","#ffc400","#00e676","#2979ff","#ce93d8","#ff69b4"];
  if (!on) return null;
  const ps = Array.from({ length: 80 }, (_, i) => ({
    id: i, x: Math.random() * 100, color: COLS[i % COLS.length],
    delay: Math.random() * 0.9, dur: 1.6 + Math.random() * 1.6,
    size: 7 + Math.random() * 9, drift: (Math.random() - 0.5) * 120, circle: Math.random() > 0.5,
  }));
  return (
    <div className="confetti-wrap" aria-hidden="true">
      {ps.map(p => (
        <div key={p.id} className="confetti-p" style={{
          left: `${p.x}%`, background: p.color, width: p.size,
          height: p.circle ? p.size : p.size * 0.4,
          borderRadius: p.circle ? "50%" : "2px",
          animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, "--drift": `${p.drift}px`,
        }} />
      ))}
    </div>
  );
}

/* ── FAQ Item ────────────────────────────────────────────────── */
function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " open" : ""}`} onClick={() => setOpen(o => !o)}>
      <div className="faq-q">
        <span>{q}</span>
        <span className="faq-arrow">{open ? "×" : "+"}</span>
      </div>
      <div className="faq-a">{a}</div>
    </div>
  );
}

/* ── Navbar ──────────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const active = (p) => loc.pathname === p ? "nav-link active" : "nav-link";
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
        <div className="brand-icon">🔥</div>
        <span className="brand-name">Roast<span>My</span>Resume</span>
      </Link>
      <div className={`navbar-center${open ? " open" : ""}`}>
        <Link to="/"            className={active("/")}            onClick={() => setOpen(false)}>Roast</Link>
        <Link to="/leaderboard" className={active("/leaderboard")} onClick={() => setOpen(false)}>Leaderboard</Link>
        <Link to="/blog"        className={active("/blog")}        onClick={() => setOpen(false)}>Blog</Link>
        <Link to="/about"       className={active("/about")}       onClick={() => setOpen(false)}>About</Link>
      </div>
      <div className="navbar-right">
        <Link to="/leaderboard" className="nav-lb-btn" onClick={() => setOpen(false)}>🏆 Top Roasts</Link>
        <a href="https://buymeacoffee.com/macoostudy" target="_blank" rel="noopener noreferrer" className="nav-cta">☕ Coffee</a>
        <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}

/* ── Footer ──────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <span className="fb-logo">🔥 RoastMyResume</span>
          <p className="fb-tag">Brutal honesty. Actionable fixes. Zero sugarcoating. Built for CS freshers worldwide.</p>
          <a href="https://buymeacoffee.com/macoostudy" target="_blank" rel="noopener noreferrer" className="footer-coffee">☕ Buy me a coffee</a>
        </div>
        <div className="footer-cols">
          <div className="fcol">
            <h4>Tool</h4>
            <Link to="/">Roast My Resume</Link>
            <Link to="/leaderboard">Leaderboard</Link>
          </div>
          <div className="fcol">
            <h4>Info</h4>
            <Link to="/blog">Blog</Link>
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
          <div className="fcol">
            <h4>Connect</h4>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://github.com/harshith7002" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://portfolio-saiharshith.netlify.app" target="_blank" rel="noopener noreferrer">Portfolio</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 RoastMyResume • 10 countries & counting 🌍</span>
        <span>Built by <a href="https://portfolio-saiharshith.netlify.app" target="_blank" rel="noopener noreferrer">Harshith</a> 🔥</span>
      </div>
    </footer>
  );
}

/* ── Personality Modal ───────────────────────────────────────── */
function PersonalityModal({ onSelect, onClose }) {
  const [sel, setSel] = useState("default");
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">WHO'S ROASTING YOU?</h2>
        <p className="modal-sub">Pick your roaster before we begin</p>
        <div className="personality-grid">
          {PERSONALITIES.map(p => (
            <button key={p.id} className={`p-btn${sel === p.id ? " sel" : ""}`} onClick={() => setSel(p.id)}>
              <span className="p-emoji">{p.emoji}</span>
              <span className="p-name">{p.name}</span>
              <span className="p-desc">{p.desc}</span>
            </button>
          ))}
        </div>
        <button className="modal-fire-btn" onClick={() => onSelect(sel)}>🔥 START ROASTING</button>
        <button className="modal-cancel" onClick={onClose}>maybe later</button>
      </div>
    </div>
  );
}

/* ── Roast Counter ───────────────────────────────────────────── */
const BASE = 1247;
function RoastCounter() {
  const [n, setN] = useState(BASE);
  useEffect(() => { const s = localStorage.getItem("roastCount"); if (s) setN(parseInt(s)); }, []);
  return (
    <div className="roast-counter">
      <span className="rc-num">{n.toLocaleString()}</span>
      <span className="rc-lbl">resumes roasted</span>
    </div>
  );
}

/* ── Streak ──────────────────────────────────────────────────── */
function StreakBadge() {
  const s = parseInt(localStorage.getItem("streak") || "0");
  if (!s) return null;
  return <div className="streak-pill">🔥 {s} day streak</div>;
}

/* ── Main App ────────────────────────────────────────────────── */
function MainApp() {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [roast, setRoast]     = useState(null);
  const [verdict, setVerdict] = useState("");
  const [ats, setAts]         = useState(0);
  const [err, setErr]         = useState(null);
  const [over, setOver]       = useState(false);
  const [lang, setLang]       = useState("english");
  const [personality, setP]   = useState("default");
  const [modal, setModal]     = useState(false);
  const [toasts, setToasts]   = useState([]);
  const [confetti, setConfetti] = useState(false);
  const [burst, setBurst]     = useState(false);
  const [msgIdx, setMsgIdx]   = useState(0);
  const [showSample, setShowSample] = useState(false);
  const [badges, setBadges]   = useState([]);
  const fileRef = useRef();
  const resultsRef = useRef();

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
    if (f?.type === "application/pdf") {
      setFile(f); setErr(null); setBurst(true);
      setTimeout(() => setBurst(false), 600);
      toast(`${f.name} loaded!`, "📄");
    } else {
      toast("PDF files only, genius.", "⚠️");
      setErr("Please upload a PDF file only!");
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files[0]); };
  const onRoastClick = () => { if (!file) return; setModal(true); };

  const onPersonalitySelect = async (p) => {
    setModal(false); setP(p);
    await submit(p);
  };

  const submit = async (p = personality) => {
    if (!file) return;
    setLoading(true); setRoast(null); setErr(null); setMsgIdx(0);
    const fd = new FormData();
    fd.append("resume", file); fd.append("language", lang); fd.append("personality", p);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/roast`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setRoast(data.roast);
        setVerdict(data.verdict || "🏭 Entry Level");
        setAts(data.ats_score || 0);
        const earned = BADGES_DEF.filter(b => b.when(p, data.verdict));
        setBadges(earned);
        // Streak
        const today = new Date().toDateString();
        const last  = localStorage.getItem("lastRoast");
        const streak = parseInt(localStorage.getItem("streak") || "0");
        if (last === new Date(Date.now() - 86400000).toDateString()) {
          localStorage.setItem("streak", streak + 1);
        } else if (last !== today) {
          localStorage.setItem("streak", 1);
        }
        localStorage.setItem("lastRoast", today);
        // Counter
        localStorage.setItem("roastCount", parseInt(localStorage.getItem("roastCount") || BASE) + 1);
        if (data.verdict?.toLowerCase().includes("faang")) {
          setConfetti(true); setTimeout(() => setConfetti(false), 4500);
          toast("FAANG Possible! You might actually get hired!", "🌟");
        } else {
          toast("Your roast is ready. Brace yourself...", "🔥");
        }
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
      } else {
        setErr(data.error || "Something went wrong!"); toast(data.error || "Error", "💀");
      }
    } catch {
      setErr("Cannot reach server."); toast("Server unreachable", "🔌");
    } finally { setLoading(false); }
  };

  const copyRoast = () => { navigator.clipboard.writeText(roast); toast("Copied! Send it to your rivals 😂", "📋"); };

  const reset = () => {
    setFile(null); setRoast(null); setErr(null); setVerdict(""); setAts(0); setBadges([]); setConfetti(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shareImage = () => {
    toast("Generating share card...", "🎨");
    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 460;
    const ctx = canvas.getContext("2d");
    const bg = ctx.createLinearGradient(0, 0, 800, 460);
    bg.addColorStop(0, "#050508"); bg.addColorStop(1, "#1a0808");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 800, 460);
    ctx.strokeStyle = "rgba(255,61,0,0.4)"; ctx.lineWidth = 2; ctx.strokeRect(1,1,798,458);
    ctx.fillStyle = "#ff3d00"; ctx.font = "bold 38px sans-serif"; ctx.fillText("🔥 ROAST MY RESUME", 40, 70);
    ctx.fillStyle = "#404060"; ctx.font = "16px monospace"; ctx.fillText("macoostudy.info", 40, 96);
    const vm = verdictMeta(verdict);
    ctx.fillStyle = "#ffc400"; ctx.font = "bold 26px sans-serif"; ctx.fillText(`${vm.icon} ${vm.label}`, 40, 148);
    ctx.fillStyle = "#2979ff"; ctx.font = "16px sans-serif"; ctx.fillText(`ATS Score: ${ats}/100`, 40, 182);
    const ps = parseRoast(roast); const first = ps.find(s => s.key === "roast");
    if (first) {
      ctx.fillStyle = "#8888aa"; ctx.font = "15px sans-serif";
      const words = first.content.replace(/^🔥[^\n]*\n?/, "").split(" ");
      let line = "", y = 228;
      for (const w of words) {
        const t = line + w + " ";
        if (ctx.measureText(t).width > 720 && line) {
          ctx.fillText(line.trim(), 40, y); line = w + " "; y += 28;
          if (y > 370) { ctx.fillText("...", 40, y); break; }
        } else line = t;
      }
      if (y <= 370) ctx.fillText(line.trim(), 40, y);
    }
    ctx.fillStyle = "rgba(255,61,0,0.5)"; ctx.font = "13px monospace";
    ctx.fillText("Try it free → macoostudy.info", 40, 434);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "roast-card.png"; a.click();
      URL.revokeObjectURL(url); toast("Card downloaded!", "🎉");
    });
  };

  const sections = roast ? parseRoast(roast) : [];
  const vm = verdictMeta(verdict);
  const rotd = ROTD_LIST[new Date().getDay() % ROTD_LIST.length];

  return (
    <div className="page-wrap">
      <Embers />
      <Confetti on={confetti} />
      <Toasts items={toasts} />
      {modal && <PersonalityModal onSelect={onPersonalitySelect} onClose={() => setModal(false)} />}

      {/* ── Hero ── */}
      <header className="hero">
        <div className="header-badges-row" style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:20, flexWrap:"wrap" }}>
          <RoastCounter />
          <StreakBadge />
          <div className="streak-pill" style={{ background:"rgba(41,121,255,0.1)", borderColor:"rgba(41,121,255,0.2)", color:"#6699ff" }}>🌍 10 Countries</div>
        </div>
        <div className="hero-eyebrow">
          <span className="eyebrow-dot" />
          Free • No Signup • AI Powered
        </div>
        <h1 className="hero-title">
          <span className="ht-roast">ROAST</span>
          <span className="ht-my">MY</span>
          <span className="ht-resume">RESUME</span>
        </h1>
        <p className="hero-sub">
          Upload your resume. Get <strong>brutally honest feedback</strong> in 15 seconds.<br />
          No sugarcoating. No generic advice. Just truth.
        </p>
        <div className="hero-cta-row">
          <button className="btn-primary" onClick={() => fileRef.current?.click()}>📂 Upload Resume</button>
          <a href="#sample" className="btn-secondary" onClick={e => { e.preventDefault(); setShowSample(true); }}>👀 See Sample</a>
        </div>
        <div className="hero-stats">
          <div className="hstat"><span className="hstat-num">5</span><span className="hstat-label">Personalities</span></div>
          <div className="hstat"><span className="hstat-num">34+</span><span className="hstat-label">Languages</span></div>
          <div className="hstat"><span className="hstat-num">ATS</span><span className="hstat-label">Score</span></div>
          <div className="hstat"><span className="hstat-num">🆓</span><span className="hstat-label">Always Free</span></div>
        </div>
      </header>

      {/* ── Roast of the Day ── */}
      <div className="rotd-banner">
        <div className="rotd-inner">
          <span className="rotd-tag">ROAST OF THE DAY</span>
          <p className="rotd-text"><strong>AI says:</strong> {rotd}</p>
        </div>
      </div>

      {/* ── Sample Preview ── */}
      <div className="sample-preview" id="sample">
        <div className="sample-toggle-row" onClick={() => setShowSample(s => !s)}>
          <div className="stl-left">
            <span className="stl-title">👀 See a real roast</span>
            <span className="stl-sub">This is exactly what your result looks like</span>
          </div>
          <span className={`stl-arrow${showSample ? " open" : ""}`}>▼</span>
        </div>
        {showSample && (
          <div className="sample-body">
            <div className="verdict-card">
              <div className="verdict-pill startup" style={{ margin:"0 auto" }}>🚀 STARTUP READY</div>
              <p className="verdict-desc" style={{ marginTop:8 }}>Good bones. Show more impact.</p>
            </div>
            <div className="ats-card">
              <div className="ats-info">
                <span className="ats-title">📊 ATS Score</span>
                <span className="ats-subtitle">❌ ATS will likely filter you out</span>
              </div>
              <div>
                <span className="ats-number" style={{ color:"#ff3d00" }}>42</span>
                <span className="ats-denom">/100</span>
              </div>
            </div>
            {SAMPLE_DATA.map((s, i) => (
              <div key={i} className="roast-card" style={{ "--rc-color": s.color, animationDelay:`${i*0.1}s` }}>
                <div className="rc-lines">
                  <p className="rc-line rc-heading">{s.emoji} {s.title}</p>
                  {s.text.split("\n").map((l, j) => <p key={j} className="rc-line">{l}</p>)}
                </div>
              </div>
            ))}
            <button className="fire-btn" onClick={() => { fileRef.current?.click(); setShowSample(false); }}>
              🔥 GET MY RESUME ROASTED
            </button>
          </div>
        )}
      </div>

      {/* ── Upload ── */}
      {!roast && (
        <div className="upload-zone">
          <input ref={fileRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
          <div
            className={`dropzone${over ? " over" : ""}${file ? " has-file" : ""}${burst ? " burst" : ""}`}
            onDragOver={e => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={handleDrop}
            onClick={() => !file && fileRef.current.click()}
          >
            {file ? (
              <div className="file-card">
                <span className="file-card-icon">📄</span>
                <span className="file-card-name">{file.name}</span>
                <span className="file-card-size">{(file.size/1024).toFixed(1)} KB</span>
                <button className="file-change" onClick={e => { e.stopPropagation(); fileRef.current.click(); }}>Change file</button>
              </div>
            ) : (
              <>
                <span className="dz-icon">📋</span>
                <p className="dz-title">Drop your resume PDF here</p>
                <p className="dz-sub">or click to browse</p>
                <button className="dz-btn">📂 Upload PDF</button>
                <p className="dz-hint">PDF only • Max 10MB</p>
              </>
            )}
          </div>

          {err && <div className="err-box">⚠️ {err}</div>}

          <div className="lang-block">
            <span className="lang-label">🌐 ROAST LANGUAGE</span>
            <select className="lang-select" value={lang} onChange={e => setLang(e.target.value)}>
              <option value="english">🌍 English (Default)</option>
              <optgroup label="🇮🇳 Indian Languages">
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
            onClick={onRoastClick} disabled={!file || loading}
          >
            {loading
              ? <span className="btn-load-inner"><span className="spin">🔥</span>ROASTING...</span>
              : "🔥 ROAST MY RESUME"}
          </button>

          {loading && (
            <div className="loading-box">
              <p className="loading-msg" key={msgIdx}>{MSGS[msgIdx]}</p>
              <div className="progress-track">
                <div className="progress-fill" style={{ animationDuration:"15s" }} />
              </div>
              <p className="loading-sub">☕ grab a coffee, ~15 seconds...</p>
            </div>
          )}
        </div>
      )}

      {/* ── Verdict Types ── */}
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

      {/* ── Results ── */}
      {roast && (
        <div className="results-wrap" ref={resultsRef}>
          <div className="results-hero">
            <span className="rh-tag">ROAST COMPLETE</span>
            <h2 className="rh-title">YOUR VERDICT 😂</h2>
          </div>

          <div className="verdict-card" style={{ "--vc-color": vm.cls === "faang" ? "#00e676" : vm.cls === "product" ? "#ffc400" : vm.cls === "startup" ? "#6699ff" : "#9090bb" }}>
            <div className={`verdict-pill ${vm.cls}`}>{vm.icon} {vm.label.toUpperCase()}</div>
            <p className="verdict-desc">{vm.desc}</p>
          </div>

          <div className="ats-card">
            <div className="ats-info">
              <span className="ats-title">📊 ATS Score</span>
              <span className="ats-subtitle">
                {ats >= 80 ? "✅ ATS Friendly — passes most filters" :
                 ats >= 60 ? "⚠️ Needs more keywords to pass ATS" :
                 "❌ ATS will likely filter you out"}
              </span>
            </div>
            <div>
              <span className="ats-number" style={{ color: ats >= 80 ? "#00e676" : ats >= 60 ? "#ffc400" : "#ff3d00" }}>{ats}</span>
              <span className="ats-denom">/100</span>
            </div>
          </div>

          {badges.length > 0 && (
            <div className="badges-section">
              <p className="badges-title">🎖️ Badges Earned</p>
              <div className="badges-grid">
                {badges.map(b => (
                  <div key={b.id} className="badge-chip">
                    <span>{b.emoji}</span><span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="roast-cards">
            {sections.map((s, i) => (
              <div key={s.key} className="roast-card" style={{ "--rc-color": s.color, animationDelay:`${i*0.14}s` }}>
                <div className="rc-lines">
                  {s.content.split("\n").map((l, j) =>
                    l.trim() && <p key={j} className={`rc-line${/^[🔥💀✅📈🎯]/.test(l) ? " rc-heading" : ""}`}>{l}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="result-actions">
            <button className="ra-btn" onClick={copyRoast}>📋 Copy Roast</button>
            <button className="ra-btn" onClick={shareImage}>🎨 Share Card</button>
            <button className="ra-btn gold"><a href="/leaderboard" style={{ color:"inherit", textDecoration:"none" }}>🏆 Leaderboard</a></button>
            <button className="ra-btn" onClick={reset}>🔄 Roast Another</button>
            <button className="ra-btn full" onClick={reset}>+ Upload New Resume</button>
          </div>

          <p className="coffee-row">Loved the roast? <a href="https://buymeacoffee.com/macoostudy" target="_blank" rel="noopener noreferrer">☕ Buy me a coffee!</a></p>
          <p className="share-hint">// share your roast in college group chat 😂</p>
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

/* ── Root ────────────────────────────────────────────────────── */
export default function App() {
  return (
    <Router>
      <div className="app">
        <div className="bg-canvas" aria-hidden="true" />
        <div className="bg-grid" aria-hidden="true" />
        <Navbar />
        <Routes>
          <Route path="/"            element={<MainApp />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/blog"        element={<Blog />} />
          <Route path="/privacy"     element={<PrivacyPolicy />} />
          <Route path="/about"       element={<About />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}
