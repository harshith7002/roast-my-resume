import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
}) {
  const cats = categories || {};
  const [showBA, setShowBA] = useState(false);
  const baRef = useRef();

  return (
    <motion.div
      className="report"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="report-hero">
        <span className="rh-tag">{preview ? "👀 SAMPLE REPORT" : "✅ ANALYSIS COMPLETE"}</span>
        <h2 className="rh-title">{preview ? "This is what you'll get" : "Your Resume Report"}</h2>
      </div>

      {/* ── Top: gauge + verdict ── */}
      <div className="report-top">
        <ScoreGauge value={overall} />
        <div className="report-verdict">
          <div className={`verdict-pill ${verdictMeta.cls}`}>{verdictMeta.icon} {verdictMeta.label.toUpperCase()}</div>
          <p className="rv-desc">{verdictMeta.desc}</p>
          <p className="rv-line">{scoreVerdictLine(overall)}</p>
          {badges.length > 0 && (
            <div className="rv-badges">
              {badges.map(b => (
                <span key={b.id} className="badge-chip"><span>{b.emoji}</span><span>{b.label}</span></span>
              ))}
            </div>
          )}
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
        </>
      )}
    </motion.div>
  );
}
