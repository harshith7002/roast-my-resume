import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getLbEntries } from "../App";

const MEDAL = ["🥇", "🥈", "🥉"];

function verdictBadge(v) {
  const map = {
    entry:   { label: "Entry Level",   cls: "entry"   },
    startup: { label: "Startup Ready", cls: "startup" },
    product: { label: "Product Co.",   cls: "product" },
    faang:   { label: "FAANG Possible",cls: "faang"   },
  };
  const m = map[v] || map.entry;
  return <span className={`vbadge ${m.cls}`}>{m.label}</span>;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [voted,   setVoted]   = useState({});

  const load = () => {
    const v = JSON.parse(localStorage.getItem("lb_voted") || "{}");
    setVoted(v);
    setEntries(getLbEntries());
  };

  useEffect(() => {
    load();
    // Re-render when a new entry is submitted from the main page
    window.addEventListener("lb_updated", load);
    return () => window.removeEventListener("lb_updated", load);
  }, []);

  const vote = (id) => {
    if (voted[id]) return;
    // Update entries in state
    setEntries(prev => {
      const updated = prev.map(x => x.id === id ? { ...x, votes: x.votes + 1 } : x)
                         .sort((a, b) => b.votes - a.votes);
      // Persist vote delta for real user entries
      try {
        const stored = JSON.parse(localStorage.getItem("lb_entries") || "[]");
        const patched = stored.map(x => x.id === id ? { ...x, votes: x.votes + 1 } : x);
        localStorage.setItem("lb_entries", JSON.stringify(patched));
      } catch {}
      return updated;
    });
    const nv = { ...voted, [id]: true };
    setVoted(nv);
    localStorage.setItem("lb_voted", JSON.stringify(nv));
  };

  const userEntries = entries.filter(e => e.id.startsWith("u_"));
  const hasRealEntries = userEntries.length > 0;

  return (
    <div className="page-wrap">
      <div className="lb-page">

        {/* ── Hero ── */}
        <div className="lb-hero">
          <div className="lb-eyebrow">🏆 WEEKLY RANKINGS</div>
          <h1 className="lb-title">ROAST<br /><span>LEADERBOARD</span></h1>
          <p className="lb-sub">
            The most brutally honest — and funniest — roasts of the week,<br />voted by the community.
          </p>

          <div className="lb-prizes">
            <div className="lb-prize-chip">🥇 <strong>1st</strong> — Free Resume Correction</div>
            <div className="lb-prize-chip">🥈 <strong>2nd</strong> — Deep ATS Analysis</div>
            <div className="lb-prize-chip">🥉 <strong>3rd</strong> — Priority Roast</div>
          </div>

          <Link to="/" className="lb-cta">🔥 Get Roasted &amp; Compete</Link>
        </div>

        {/* ── Live entry count ── */}
        {hasRealEntries && (
          <div className="lb-live-badge">
            <span className="lb-live-dot" />
            {userEntries.length} real {userEntries.length === 1 ? "submission" : "submissions"} this week
          </div>
        )}

        {/* ── Entries ── */}
        <div className="lb-list">
          {entries.map((e, i) => {
            const isReal = e.id.startsWith("u_");
            return (
              <div
                key={e.id}
                className={[
                  "lb-entry",
                  i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : "",
                  isReal ? "lb-entry-real" : "",
                ].filter(Boolean).join(" ")}
              >
                <div className="lb-rank">{i < 3 ? MEDAL[i] : `#${i + 1}`}</div>

                <div className="lb-body">
                  <div className="lb-top-row">
                    <span className="lb-name">
                      {e.name}
                      {isReal && <span className="lb-real-tag">NEW</span>}
                    </span>
                    {verdictBadge(e.verdict)}
                    <span className="lb-ats">ATS: {e.ats}/100</span>
                  </div>

                  <p className="lb-quote">{e.quote}</p>

                  <button
                    className={`vote-btn${voted[e.id] ? " voted" : ""}`}
                    onClick={() => vote(e.id)}
                    disabled={!!voted[e.id]}
                  >
                    🔥 {e.votes} {voted[e.id] ? "Voted!" : "Vote"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="lb-reset-note">
          // leaderboard resets every monday • vote once per entry • top 3 win prizes
        </p>
      </div>
    </div>
  );
}
