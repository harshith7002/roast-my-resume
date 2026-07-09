import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ResumeChat from "./ResumeChat";
import { apiFetch } from "../utils/api";

/* Category metadata — order is intentional (recruiters scan ATS → impact). */
const CATS = [
  { key: "ats",        label: "ATS",        icon: "📊", hint: "How cleanly an applicant-tracking system can parse you." },
  { key: "projects",   label: "Projects",   icon: "🛠️", hint: "Depth, count and whether anything is actually shipped." },
  { key: "skills",     label: "Skills",     icon: "🧠", hint: "Breadth of relevant, recognisable technical keywords." },
  { key: "experience", label: "Experience", icon: "💼", hint: "Internships, brand names and academic signal." },
  { key: "impact",     label: "Impact",     icon: "📈", hint: "Quantified results — numbers, %, scale, achievements." },
];

/* Curated, high-signal rewrites. Framed as patterns, not resume-specific,
   so they're honest about what they are while still being genuinely useful. */
const BEFORE_AFTER = [
  {
    before: "Worked on a web application using React.",
    after:  "Built a React + Node app serving 500+ users; cut page load time 40% via code-splitting.",
  },
  {
    before: "Good knowledge of Python and machine learning.",
    after:  "Shipped 3 Flask APIs (2k+ req/day) and an XGBoost model at 92% F1, deployed on Render.",
  },
  {
    before: "Team player, hardworking and quick learner.",
    after:  "Led a 4-person team to ship the MVP in 2 weeks; owned auth + payments end-to-end.",
  },
];

function scoreColor(v) {
  if (v >= 75) return "var(--emerald)";
  if (v >= 50) return "var(--gold)";
  return "var(--fire)";
}
function scoreVerdictLine(v) {
  if (v >= 80) return "Strong — recruiters will keep reading.";
  if (v >= 60) return "Decent bones. Tighten the weak categories below.";
  if (v >= 40) return "Risky. A real recruiter skims this in 6 seconds.";
  return "This gets filtered before a human sees it.";
}

/* Lightweight count-up so the gauge number animates without extra deps. */
function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function ScoreGauge({ value }) {
  const display = useCountUp(value);
  const R = 78, C = 2 * Math.PI * R;
  const color = scoreColor(value);
  return (
    <div className="gauge-wrap">
      <svg className="gauge-svg" viewBox="0 0 180 180" role="img" aria-label={`Overall score ${value} out of 100`}>
        <circle cx="90" cy="90" r={R} className="gauge-track" />
        <motion.circle
          cx="90" cy="90" r={R}
          className="gauge-fill"
          stroke={color}
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (C * value) / 100 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div className="gauge-center">
        <span className="gauge-num" style={{ color }}>{display}</span>
        <span className="gauge-denom">/ 100</span>
        <span className="gauge-label">Overall</span>
      </div>
    </div>
  );
}

function CategoryBar({ cat, value, index }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <motion.div
      className="catbar"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="catbar-head">
        <span className="catbar-label"><span className="catbar-icon">{cat.icon}</span>{cat.label}</span>
        <span className="catbar-val" style={{ color: scoreColor(v) }}>{v}</span>
      </div>
      <div className="catbar-track">
        <motion.div
          className="catbar-fill"
          style={{ background: scoreColor(v) }}
          initial={{ width: 0 }}
          whileInView={{ width: `${v}%` }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 + index * 0.06, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <p className="catbar-hint">{cat.hint}</p>
    </motion.div>
  );
}

function SuggestionCard({ section, index, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const lines = (section.content || "").split("\n").filter(l => l.trim());
  const heading = lines[0] || "Feedback";
  const body = lines.slice(1);
  return (
    <motion.div
      className={`sg-card${open ? " open" : ""}`}
      style={{ "--sg-color": section.color }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: index * 0.05, duration: 0.45 }}
    >
      <button className="sg-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="sg-heading">{heading}</span>
        <span className="sg-arrow" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="sg-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="sg-body-inner">
              {body.length
                ? body.map((l, j) => <p key={j} className="sg-line">{l}</p>)
                : <p className="sg-line">{heading}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RoastReport({
  verdict, verdictMeta, overall, categories, sections, badges = [],
  onCopy, onShareCard, onDownloadPdf, onLeaderboard, onReset, preview = false,
  analysisId, resumeText,
}) {
  const cats = categories || {};
  const [showBA, setShowBA] = useState(false);
  const baRef = useRef();

  const [timeline, setTimeline] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    if (!resumeText || preview) return;
    setLoadingTimeline(true);
    apiFetch("/api/resume/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_text: resumeText }),
    })
      .then((data) => {
        if (data.success && data.timeline) {
          setTimeline(data.timeline);
        }
        setLoadingTimeline(false);
      })
      .catch((e) => {
        console.error("Timeline error:", e);
        setLoadingTimeline(false);
      });
  }, [resumeText, preview]);

  const strengths = [];
  const weaknesses = [];

  if (cats) {
    if ((cats.ats || 0) >= 70) strengths.push("Clean ATS structure");
    else weaknesses.push("Optimize ATS formatting");

    if ((cats.impact || 0) >= 75) strengths.push("Quantified metrics & results");
    else weaknesses.push("Needs impact metrics");

    if ((cats.projects || 0) >= 75) strengths.push("Strong technical projects");
    else weaknesses.push("Detail project structures");

    if ((cats.skills || 0) >= 70) strengths.push("Good keyword densities");
    else weaknesses.push("Missing target keywords");
  }

  if (strengths.length === 0) strengths.push("Standard section layout", "Contact details clear");
  if (weaknesses.length === 0) weaknesses.push("Detail technical frameworks", "Increase active verbs");

  return (
    <motion.div
      className="report"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div className="report-hero" style={{ textAlign: "left" }}>
          <span className="rh-tag">{preview ? "👀 SAMPLE REPORT" : "✅ ANALYSIS COMPLETE"}</span>
          <h2 className="rh-title" style={{ margin: "4px 0 0" }}>{preview ? "This is what you'll get" : "Your Resume Report"}</h2>
        </div>
        {!preview && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="ra-btn primary" onClick={onDownloadPdf} style={{ padding: "8px 16px", fontSize: "0.85rem", height: "auto" }}>⬇️ Download PDF</button>
            <button className="ra-btn" onClick={onShareCard} style={{ padding: "8px 16px", fontSize: "0.85rem", height: "auto" }}>📸 Share Results</button>
          </div>
        )}
      </div>

      {/* ── Top: gauge + verdict ── */}
      <div className="report-top" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", padding: "28px" }}>
        
        {/* Left Side: Score Gauges */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center", justifyContent: "center" }}>
          <ScoreGauge value={overall} />
          <div style={{ borderLeft: "1px solid var(--border)", height: "80px" }} />
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--cream-60)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, display: "block" }}>ATS Score</span>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, color: scoreColor(cats?.ats || overall), fontFamily: "monospace", margin: "4px 0" }}>
              {cats?.ats || overall}<span style={{ fontSize: "1rem", color: "var(--cream-60)" }}>/100</span>
            </div>
            <span style={{ fontSize: "0.68rem", color: "var(--emerald)", fontWeight: 700 }}>🟢 Passing Grade</span>
          </div>
        </div>

        {/* Right Side: FAANG Readiness, Strengths, Weaknesses */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--cream-60)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, display: "block", marginBottom: "4px" }}>FAANG READINESS</span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <div className={`verdict-pill ${verdictMeta.cls}`} style={{ margin: 0, padding: "4px 10px", fontSize: "0.76rem" }}>
                {verdictMeta.icon} {verdictMeta.label.toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--cream-60)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, display: "block", marginBottom: "6px" }}>🏆 STRENGTHS</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {strengths.slice(0, 2).map((s, idx) => (
                  <span key={idx} style={{ fontSize: "0.78rem", color: "var(--cream)", display: "flex", alignItems: "center", gap: "4px" }}>
                    🟢 <span style={{ fontWeight: 600 }}>{s}</span>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--cream-60)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, display: "block", marginBottom: "6px" }}>⚠️ WEAKNESSES</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {weaknesses.slice(0, 2).map((w, idx) => (
                  <span key={idx} style={{ fontSize: "0.78rem", color: "var(--cream)", display: "flex", alignItems: "center", gap: "4px" }}>
                    🔴 <span style={{ fontWeight: 600 }}>{w}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category breakdown ── */}
      <div className="report-section">
        <p className="report-section-label">Category Breakdown</p>
        <div className="catbars">
          {CATS.map((c, i) => <CategoryBar key={c.key} cat={c} value={cats[c.key]} index={i} />)}
        </div>
      </div>

      {/* ── Expandable suggestions ── */}
      <div className="report-section">
        <p className="report-section-label">The Feedback <span className="rsl-hint">tap to expand</span></p>
        <div className="sg-cards">
          {sections.map((s, i) => (
            <SuggestionCard key={s.key} section={s} index={i} defaultOpen={i === 0} />
          ))}
        </div>
      </div>

      {/* ── Before vs After ── */}
      <div className="report-section">
        <button className="ba-toggle" onClick={() => { setShowBA(s => !s); }}>
          ✍️ {showBA ? "Hide" : "Show"} Before → After rewrites
        </button>
        <AnimatePresence initial={false}>
          {showBA && (
            <motion.div
              ref={baRef}
              className="ba-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="ba-list-inner">
                <p className="ba-caption">Common weak lines and how to fix them — apply the same pattern to yours.</p>
                {BEFORE_AFTER.map((ex, i) => (
                  <div key={i} className="ba-row">
                    <div className="ba-before"><span className="ba-tag bad">Before</span><p>{ex.before}</p></div>
                    <div className="ba-arrow">→</div>
                    <div className="ba-after"><span className="ba-tag good">After</span><p>{ex.after}</p></div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── AI Resume Timeline / Roadmap ── */}
      {!preview && (
        <div className="report-section" style={{ borderTop: "1px solid var(--border)", paddingTop: 32, marginBottom: 32 }}>
          <p className="report-section-label">🎯 Your 4-Week Career Roadmap</p>
          {loadingTimeline ? (
            <p style={{ color: "var(--cream-60)", fontSize: "0.9rem" }}>Analyzing skill gaps and building roadmap...</p>
          ) : timeline ? (
            <div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24, padding: 16, background: "rgba(0,214,143,0.05)", borderRadius: 10, border: "1px solid var(--emerald)" }}>
                <span style={{ fontSize: "1.8rem" }}>🚀</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>
                    Interview Readiness Timeline
                  </p>
                  <p style={{ margin: "2px 0 0", color: "var(--cream-60)", fontSize: "0.85rem" }}>
                    Current Score: <strong>{overall}%</strong> → Expected score after Week 4: <strong>{timeline.estimated_ready_score || 85}%</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative", paddingLeft: 20 }}>
                {/* Vertical Line */}
                <div style={{ position: "absolute", left: 6, top: 10, bottom: 10, width: 2, background: "var(--border)" }} />

                {timeline.weeks.map((w, idx) => (
                  <div key={idx} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Circle Bullet */}
                    <div style={{ position: "absolute", left: -19, top: 4, width: 10, height: 10, borderRadius: "50%", background: "var(--fire)", border: "2px solid var(--bg)" }} />
                    
                    <div style={{ paddingLeft: 12 }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--fire)", letterSpacing: "0.5px" }}>
                        WEEK {w.week} · {w.focus.toUpperCase()}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                        {w.items.map((item, itemIdx) => (
                          <div key={itemIdx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, color: "#fff", fontSize: "0.9rem" }}>{item.title}</span>
                              <span style={{
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: item.difficulty === "Easy" ? "rgba(0,214,143,0.1)" : item.difficulty === "Medium" ? "rgba(255,170,0,0.1)" : "rgba(255,71,87,0.1)",
                                color: item.difficulty === "Easy" ? "var(--emerald)" : item.difficulty === "Medium" ? "#ffaa00" : "#ff4757"
                              }}>
                                {item.difficulty}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--cream-60)", lineHeight: 1.5 }}>
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--cream-60)", fontSize: "0.85rem" }}>Upload resume to see custom career roadmap.</p>
          )}
        </div>
      )}

      {!preview && (
        <>
          {/* ── Leaderboard invite ── */}
          <div className="lb-invite-banner" onClick={onLeaderboard}>
            <span className="lib-icon">🏆</span>
            <div>
              <p className="lib-title">Add to the Leaderboard</p>
              <p className="lib-sub">Share your roast for fun — saved on this device.</p>
            </div>
            <span className="lib-arrow">→</span>
          </div>

          {/* ── Actions ── */}
          <div className="result-actions">
            <button className="ra-btn primary" onClick={onDownloadPdf}>⬇️ Download PDF</button>
            <button className="ra-btn" onClick={onCopy}>📋 Copy Roast</button>
            <button className="ra-btn" onClick={onShareCard}>📸 Share Card</button>
            <button className="ra-btn gold" onClick={onLeaderboard}>🏆 Leaderboard</button>
            <button className="ra-btn full" onClick={onReset}>+ Roast Another Resume</button>
          </div>
          <p className="share-hint">// share your roast in the college group chat 😂</p>

          {/* ── AI Resume Chat ── */}
          {analysisId && <ResumeChat analysisId={analysisId} resumeText={resumeText} />}
        </>
      )}
    </motion.div>
  );
}
