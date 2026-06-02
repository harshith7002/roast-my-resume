import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import "./App.css";
import Leaderboard from "./pages/Leaderboard";
import Blog from "./pages/Blog";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import About from "./pages/About";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const BASE_COUNT  = 1247;

/* ── Static data ──────────────────────────────────────────────── */
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

/* ── Leaderboard seed data (shown if no real entries yet) ──────── */
export const LB_SEED = [
  { id: "s1", name: "TCS Waala Bhai 😂",   quote: "You listed MS Word as a skill in 2024. My grandmother knows MS Word. You expect 15 LPA with this?", verdict: "entry",   ats: 28, votes: 234, ts: 0 },
  { id: "s2", name: "Anonymous Fresher",    quote: "Your projects section is a YouTube tutorial graveyard. Todo App, Weather App — the holy trinity of doing absolutely nothing original.", verdict: "startup", ats: 45, votes: 189, ts: 0 },
  { id: "s3", name: "import numpy enjoyer", quote: "You imported NumPy once and called yourself an AI/ML Enthusiast. That's like taking an Uber once and calling yourself a transport entrepreneur.", verdict: "entry",   ats: 32, votes: 156, ts: 0 },
  { id: "s4", name: "Placement Padega 🔥",  quote: "Hobbies: Listening to music, watching movies, reading books. You've described every human being on planet Earth.", verdict: "startup", ats: 51, votes: 134, ts: 0 },
  { id: "s5", name: "Rahul from DTU",       quote: "Objective: 'seeking a challenging position to utilize my skills'. That's not an objective, that's a statement of obvious desire.", verdict: "product", ats: 67, votes: 98,  ts: 0 },
  { id: "s6", name: "CGPA 6.2 ka Don",      quote: "CGPA 6.2 and targeting FAANG. I respect the confidence. The universe does not.", verdict: "entry",   ats: 24, votes: 87,  ts: 0 },
  { id: "s7", name: "Full Stack Faker",      quote: "Listed React, Node, Python, Rust, Go, Kubernetes, and Docker. Built a static HTML page. Pick a struggle.", verdict: "startup", ats: 55, votes: 71,  ts: 0 },
];

/* ── localStorage helpers ─────────────────────────────────────── */
export function getLbEntries() {
  try {
    const stored = JSON.parse(localStorage.getItem("lb_entries") || "[]");
    // Merge: real entries first, then seeds not already displaced
    const realIds = new Set(stored.map(e => e.id));
    const seeds   = LB_SEED.filter(s => !realIds.has(s.id));
    return [...stored, ...seeds].sort((a, b) => b.votes - a.votes);
  } catch { return [...LB_SEED]; }
}

export function saveLbEntry(entry) {
  try {
    const stored = JSON.parse(localStorage.getItem("lb_entries") || "[]");
    localStorage.setItem("lb_entries", JSON.stringify([entry, ...stored]));
    // Bump global roast count display
    window.dispatchEvent(new Event("lb_updated"));
  } catch {}
}

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
    <div className={`faq-item${open ? " open" : ""}`} onClick={() => setOpen(o => !o)}>
      <div className="faq-q">
        <span>{q}</span>
        <span className="faq-arrow">{open ? "×" : "+"}</span>
      </div>
      <div className="faq-a">{a}</div>
    </div>
  );
}

/* ── Navbar ───────────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const loc  = useLocation();
  const active = (p) => loc.pathname === p ? "nav-link active" : "nav-link";
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
        <div className="brand-icon">🔥</div>
        <span className="brand-name">Roast<span>My</span>Resume</span>
      </Link>

      <div className={`navbar-center${open ? " open" : ""}`}>
        <Link to="/"            className={active("/")}            onClick={() => setOpen(false)}>Roast</Link>
        <Link to="/blog"        className={active("/blog")}        onClick={() => setOpen(false)}>Blog</Link>
        <Link to="/about"       className={active("/about")}       onClick={() => setOpen(false)}>About</Link>
        <Link to="/leaderboard" className={active("/leaderboard")} onClick={() => setOpen(false)}>Leaderboard</Link>
      </div>

      <div className="navbar-right">
        <a href="https://portfolio-saiharshith.netlify.app" target="_blank" rel="noopener noreferrer" className="nav-built-by">
          Built by Sai ↗
        </a>
        <a href="https://buymeacoffee.com/macoostudy" target="_blank" rel="noopener noreferrer" className="nav-cta">
          ☕ Buy Me a Coffee
        </a>
        <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
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
          <a href="https://buymeacoffee.com/macoostudy" target="_blank" rel="noopener noreferrer" className="footer-coffee">
            ☕ Buy me a coffee
          </a>
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
function MainApp() {
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [roast, setRoast]         = useState(null);
  const [verdict, setVerdict]     = useState("");
  const [ats, setAts]             = useState(0);
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
  const [showSample, setShowSample] = useState(false);
  const [badges, setBadges]       = useState([]);
  const [roastSnippet, setRoastSnippet] = useState("");
  const fileRef    = useRef();
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
        setVerdict(data.verdict || "Entry Level");
        setAts(data.ats_score || 0);

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
    } catch {
      setErr("Cannot reach server. Is the backend running?"); toast("Server unreachable", "🔌");
    } finally { setLoading(false); }
  };

  const copyRoast = () => { navigator.clipboard.writeText(roast); toast("Copied! Send it to your rivals 😂", "📋"); };

  const reset = () => {
    setFile(null); setRoast(null); setErr(null); setVerdict(""); setAts(0);
    setBadges([]); setConfetti(false); setLbModal(false); setRoastSnippet("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <header className="hero">
        <div className="header-badges-row">
          <RoastCounter />
          <div className="trust-pill">🌍 10 Countries</div>
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
          Get a <strong>resume score, ATS analysis, top mistakes,</strong> and{" "}
          <strong>5 actionable fixes</strong> in 15 seconds.
        </p>

        <div className="feature-chips">
          <span className="fchip">🔥 Brutal Roast</span>
          <span className="fchip">📊 ATS Score</span>
          <span className="fchip fchip-hot">🎯 5 Specific Fixes</span>
          <span className="fchip">🌍 34+ Languages</span>
          <span className="fchip">📸 Share as Image</span>
        </div>

        <div className="hero-cta-row">
          <button className="btn-primary" onClick={() => fileRef.current?.click()}>
            📂 Upload Resume — It's Free
          </button>
          <a href="#sample" className="btn-secondary" onClick={e => { e.preventDefault(); setShowSample(true); }}>
            👀 See Sample
          </a>
        </div>
      </header>

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
            onDragOver={e => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={handleDrop}
            onClick={() => !file && fileRef.current.click()}
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
                <button className="dz-btn">📂 Upload PDF</button>
                <p className="dz-hint">PDF only • Max 10MB</p>
              </>
            )}
          </div>

          {err && <div className="err-box">⚠️ {err}</div>}

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

      {/* ── Roast of the Day ── */}
      {!roast && (
        <div className="rotd-banner">
          <div className="rotd-inner">
            <span className="rotd-tag">ROAST OF THE DAY</span>
            <p className="rotd-text"><strong>AI says:</strong> {rotd}</p>
          </div>
        </div>
      )}

      {/* ── Sample Preview ── */}
      {!roast && (
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
                <div className="verdict-pill startup" style={{ margin: "0 auto" }}>🚀 STARTUP READY</div>
                <p className="verdict-desc" style={{ marginTop: 8 }}>Good bones. Show more impact.</p>
              </div>
              <div className="ats-card">
                <div className="ats-info">
                  <span className="ats-title">📊 ATS Score</span>
                  <span className="ats-subtitle">❌ ATS will likely filter you out</span>
                </div>
                <div>
                  <span className="ats-number" style={{ color: "#ff6b00" }}>42</span>
                  <span className="ats-denom">/100</span>
                </div>
              </div>
              {SAMPLE_DATA.map((s, i) => (
                <div key={i} className="roast-card" style={{ "--rc-color": s.color, animationDelay: `${i * 0.1}s` }}>
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
      )}

      {/* ── Results ── */}
      {roast && (
        <div className="results-wrap" ref={resultsRef}>
          <div className="results-hero">
            <span className="rh-tag">ROAST COMPLETE</span>
            <h2 className="rh-title">Your Verdict 😂</h2>
          </div>

          <div className="verdict-card" style={{ "--vc-color": vm.cls === "faang" ? "#00d68f" : vm.cls === "product" ? "#ffc844" : vm.cls === "startup" ? "#5599ff" : "rgba(255,245,224,0.3)" }}>
            <div className={`verdict-pill ${vm.cls}`}>{vm.icon} {vm.label.toUpperCase()}</div>
            <p className="verdict-desc">{vm.desc}</p>
          </div>

          <div className="ats-card">
            <div className="ats-info">
              <span className="ats-title">📊 ATS Score</span>
              <span className="ats-subtitle">
                {ats >= 80 ? "✅ ATS Friendly — passes most filters"
                           : ats >= 60 ? "⚠️ Needs more keywords to pass ATS"
                           : "❌ ATS will likely filter you out"}
              </span>
            </div>
            <div>
              <span className="ats-number" style={{ color: ats >= 80 ? "#00d68f" : ats >= 60 ? "#ffc844" : "#ff6b00" }}>
                {ats}
              </span>
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
              <div key={s.key} className="roast-card" style={{ "--rc-color": s.color, animationDelay: `${i * 0.14}s` }}>
                <div className="rc-lines">
                  {s.content.split("\n").map((l, j) =>
                    l.trim() && (
                      <p key={j} className={`rc-line${/^[🔥💀✅📈🎯]/.test(l) ? " rc-heading" : ""}`}>{l}</p>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Leaderboard invite banner */}
          <div className="lb-invite-banner" onClick={() => setLbModal(true)}>
            <span className="lib-icon">🏆</span>
            <div>
              <p className="lib-title">Enter the Leaderboard</p>
              <p className="lib-sub">Community votes. Top 3 win weekly prizes.</p>
            </div>
            <span className="lib-arrow">→</span>
          </div>

          <div className="result-actions">
            <button className="ra-btn" onClick={copyRoast}>📋 Copy Roast</button>
            <button className="ra-btn" onClick={shareImage}>📸 Share Card</button>
            <button className="ra-btn gold" onClick={() => setLbModal(true)}>🏆 Leaderboard</button>
            <button className="ra-btn" onClick={reset}>🔄 Roast Another</button>
            <button className="ra-btn full" onClick={reset}>+ Upload New Resume</button>
          </div>

          <p className="coffee-row">
            Loved the roast?{" "}
            <a href="https://buymeacoffee.com/macoostudy" target="_blank" rel="noopener noreferrer">
              ☕ Buy me a coffee!
            </a>
          </p>
          <p className="share-hint">// share your roast in the college group chat 😂</p>
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
  return (
    <Router>
      <div className="app">
        <div className="bg-canvas" aria-hidden="true" />
        <div className="bg-grid"   aria-hidden="true" />
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
