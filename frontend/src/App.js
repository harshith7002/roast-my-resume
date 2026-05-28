import React, { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";

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
  if (/faang possible/i.test(text)) return "FAANG Possible";
  if (/faang/i.test(text)) return "FAANG Possible";
  if (/product co/i.test(text)) return "Product Co.";
  if (/startup ready/i.test(text)) return "Startup Ready";
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
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dashoffset 0.04s linear", filter: `drop-shadow(0 0 10px ${color})` }}
        />
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
    id: i,
    x: Math.random() * 100,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.9,
    dur: 1.6 + Math.random() * 1.6,
    size: 7 + Math.random() * 9,
    rot: Math.random() * 360,
    drift: (Math.random() - 0.5) * 120,
    shape: Math.random() > 0.45,
  }));
  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            background: p.color,
            width: p.size,
            height: p.shape ? p.size : p.size * 0.4,
            borderRadius: p.shape ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

function FireParticles() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 6,
    dur: 5 + Math.random() * 5,
    size: 5 + Math.random() * 14,
    drift: (Math.random() - 0.5) * 70,
  }));
  return (
    <div className="fire-particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="fire-particle"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? "open" : ""}`} onClick={() => setOpen(o => !o)}>
      <div className="faq-q">
        <span>{q}</span>
        <span className="faq-arrow">{open ? "−" : "+"}</span>
      </div>
      <div className="faq-a">{a}</div>
    </div>
  );
}

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

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roast, setRoast] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [language, setLanguage] = useState("english");
  const [toasts, setToasts] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [scoreAnimate, setScoreAnimate] = useState(false);
  const [fileDropped, setFileDropped] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [showSample, setShowSample] = useState(false);
  const fileRef = useRef();
  const resultsRef = useRef();

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 2200);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (roast) setTimeout(() => setScoreAnimate(true), 500);
    else setScoreAnimate(false);
  }, [roast]);

  const addToast = useCallback((message, type = "info", icon = "ℹ️") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") {
      setFile(f);
      setError(null);
      setFileDropped(true);
      setTimeout(() => setFileDropped(false), 900);
      addToast(`${f.name} loaded!`, "success", "📄");
    } else {
      addToast("PDF files only, genius.", "error", "⚠️");
      setError("Please upload a PDF file only!");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setRoast(null);
    setError(null);
    setLoadingMsgIdx(0);

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("language", language);

    try {
      const res = await fetch(`${BACKEND_URL}/api/roast`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setRoast(data.roast);
        const v = extractVerdict(data.roast);
        if (v === "FAANG Possible") {
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
    setFile(null);
    setRoast(null);
    setError(null);
    setShowConfetti(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShareImage = () => {
    addToast("Generating share card...", "info", "🎨");
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 460;
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, 800, 460);
    bg.addColorStop(0, "#0a0a0f");
    bg.addColorStop(1, "#1a0808");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 460);

    ctx.strokeStyle = "rgba(255,68,68,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 798, 458);

    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("🔥 Roast My Resume", 40, 66);

    ctx.fillStyle = "#9090a8";
    ctx.font = "16px sans-serif";
    ctx.fillText("macoostudy.info", 40, 92);

    const sc = extractScore(roast);
    const vd = extractVerdict(roast);
    const scoreColor = sc >= 70 ? "#00e676" : sc >= 45 ? "#ffd700" : "#ff4444";

    ctx.fillStyle = scoreColor;
    ctx.font = "bold 60px sans-serif";
    ctx.fillText(`${sc}`, 690, 90);
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#9090a8";
    ctx.fillText("/100", 710, 112);

    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`Verdict: ${vd}`, 40, 148);

    const ps = parseRoast(roast);
    const first = ps.find(s => s.key === "roast");
    if (first) {
      ctx.fillStyle = "#e0e0ea";
      ctx.font = "15px sans-serif";
      const words = first.content.replace(/^🔥[^\n]*\n?/, "").split(" ");
      let line = "", y = 205;
      for (const w of words) {
        const test = line + w + " ";
        if (ctx.measureText(test).width > 720 && line) {
          ctx.fillText(line.trim(), 40, y);
          line = w + " ";
          y += 26;
          if (y > 360) { ctx.fillText("...", 40, y); break; }
        } else line = test;
      }
      if (y <= 360) ctx.fillText(line.trim(), 40, y);
    }

    ctx.fillStyle = "rgba(255,68,68,0.6)";
    ctx.font = "13px sans-serif";
    ctx.fillText("Try it free → macoostudy.info", 40, 430);

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "roast-result.png";
      a.click();
      URL.revokeObjectURL(url);
      addToast("Share card downloaded!", "success", "🎉");
    });
  };

  const parsedSections = roast ? parseRoast(roast) : [];
  const score = roast ? extractScore(roast) : 0;
  const verdict = roast ? extractVerdict(roast) : "";
  const verdictClass = verdict === "FAANG Possible" ? "faang" : verdict === "Product Co." ? "product" : verdict === "Startup Ready" ? "startup" : "tcs";

  return (
    <div className="app">
      <Confetti active={showConfetti} />
      <Toast toasts={toasts} />
      <div className="bg-mesh" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />
      <FireParticles />

      <header className="header">
        <div className="header-badges-row">
          <RoastCounter />
          <div className="header-badge">🌍 Made for CS Freshers</div>
        </div>
        <h1 className="title" aria-label="Roast My Resume">
          {"Roast".split("").map((l, i) => (
            <span key={`r${i}`} className="title-letter title-roast" style={{ animationDelay: `${i * 0.07}s` }}>{l}</span>
          ))}
          <span className="title-letter title-space"> </span>
          {"My".split("").map((l, i) => (
            <span key={`m${i}`} className="title-letter title-my" style={{ animationDelay: `${0.38 + i * 0.07}s` }}>{l}</span>
          ))}
          <span className="title-letter title-space"> </span>
          {"Resume".split("").map((l, i) => (
            <span key={`re${i}`} className="title-letter title-resume" style={{ animationDelay: `${0.56 + i * 0.07}s` }}>{l}</span>
          ))}
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

            <div className="language-toggle">
              <button className={`lang-btn${language === "english" ? " active" : ""}`} onClick={() => setLanguage("english")}>🌍 English</button>
              <button className={`lang-btn${language === "hinglish" ? " active" : ""}`} onClick={() => setLanguage("hinglish")}>IND Hindi + English</button>
            </div>

            <button
              className={`roast-btn${loading ? " loading" : ""}${!file ? " disabled" : ""}`}
              onClick={handleSubmit}
              disabled={!file || loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="fire-spinner">🔥</span>
                  Roasting...
                </span>
              ) : "🔥 Roast My Resume"}
            </button>

            {loading && (
              <div className="loading-state">
                <div className="loading-msg" key={loadingMsgIdx}>{LOADING_MESSAGES[loadingMsgIdx]}</div>
                <p className="loading-hint">☕ Grab a chai, this takes ~15 seconds...</p>
              </div>
            )}

            <div className="sample-section">
              <div className="sample-card">
                <div className="sample-title">Sample Verdict Types</div>
                <div className="sample-verdicts">
                  <span className="verdict-badge tcs">🏭 Entry Level</span>
                  <span className="verdict-badge startup">🚀 Startup Ready</span>
                  <span className="verdict-badge product">💰 Product Co.</span>
                  <span className="verdict-badge faang">🌟 FAANG Possible</span>
                </div>
              </div>
              <button className="sample-toggle-btn" onClick={() => setShowSample(s => !s)}>
                {showSample ? "▲ Hide sample" : "👀 See a sample roast"}
              </button>
              {showSample && (
                <div className="sample-roast-preview">
                  <div className="sample-roast-header">
                    <span className="sample-roast-label">SAMPLE ROAST</span>
                    <span className="sample-roast-score">Score: 34/100</span>
                  </div>
                  {SAMPLE_SECTIONS.map((s, i) => (
                    <div key={i} className="roast-card sample-roast-card" style={{ "--card-color": s.color, animationDelay: `${i * 0.1}s` }}>
                      <p className="card-heading">{s.emoji} {s.title}</p>
                      <p className="card-line">{s.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="results-section" ref={resultsRef}>
            <div className="results-header">
              <h2 className="results-title">Your Roast is Ready 😂</h2>
              <p className="results-subtitle">Brace yourself...</p>
            </div>

            <div className="score-verdict-row">
              <CircularScore score={score} animate={scoreAnimate} />
              <div className="verdict-info">
                <div className={`verdict-badge-large ${verdictClass}`}>
                  {verdictClass === "faang" ? "🌟" : verdictClass === "product" ? "💰" : verdictClass === "startup" ? "🚀" : "🏭"} {verdict}
                </div>
                <p className="verdict-description">
                  {verdictClass === "faang" ? "Genuinely impressive. Apply everywhere." :
                   verdictClass === "product" ? "Solid resume. Polish the gaps." :
                   verdictClass === "startup" ? "Good bones. Show more impact." :
                   "Needs serious work. Read the guide carefully."}
                </p>
              </div>
            </div>

            <div className="roast-cards">
              {parsedSections.map((section, idx) => (
                <div key={section.key} className="roast-card" style={{ "--card-color": section.color, animationDelay: `${idx * 0.14}s` }}>
                  <div className="card-content">
                    {section.content.split("\n").map((line, i) =>
                      line.trim() && (
                        <p key={i} className={`card-line${/^[🔥💀✅📈🎯]/.test(line) ? " card-heading" : ""}`}>{line}</p>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="results-actions">
              <button className="action-btn copy-btn" onClick={handleCopy}>📋 Copy & Share</button>
              <button className="action-btn share-img-btn" onClick={handleShareImage}>🎨 Share as Image</button>
              <button className="action-btn reset-btn" onClick={handleReset}>🔄 Roast Another</button>
            </div>

            <div className="share-nudge">Share your roast in your college group chat 😂</div>
          </div>
        )}

        <section className="faq-section">
          <h3 className="faq-heading">Frequently Asked Questions</h3>
          {FAQS.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </section>
      </main>

      <footer className="footer">
        <p>Built for CS freshers • <a href="https://macoostudy.info">macoostudy.info</a></p>
        <p className="footer-note">Your resume is not stored.</p>
      </footer>
    </div>
  );
}
