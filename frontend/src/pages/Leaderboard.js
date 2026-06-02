import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const MEDAL = ["🥇", "🥈", "🥉"];

function verdictBadge(v) {
  const map = {
    entry:   { label: "Entry Level",    cls: "entry"   },
    startup: { label: "Startup Ready",  cls: "startup" },
    product: { label: "Product Co.",    cls: "product" },
    faang:   { label: "FAANG Possible", cls: "faang"   },
  };
  const m = map[v] || map.entry;
  return <span className={`vbadge ${m.cls}`}>{m.label}</span>;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [voted,   setVoted]   = useState({});

  const load = () => {
    const v      = JSON.parse(localStorage.getItem("lb_voted")   || "{}");
    const stored = JSON.parse(localStorage.getItem("lb_entries") || "[]");
    setVoted(v);
    setEntries(stored.sort((a, b) => b.votes - a.votes));
  };

  useEffect(() => {
    load();
    window.addEventListener("lb_updated", load);
    return () => window.removeEventListener("lb_updated", load);
  }, []);

  const vote = (id) => {
    if (voted[id]) return;
    setEntries(prev => {
      const updated = prev
        .map(x => x.id === id ? { ...x, votes: x.votes + 1 } : x)
        .sort((a, b) => b.votes - a.votes);
      try {
        localStorage.setItem("lb_entries", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    const nv = { ...voted, [id]: true };
    setVoted(nv);
    localStorage.setItem("lb_voted", JSON.stringify(nv));
  };

  return (
    <div className="page-wrap">
      <div className="lb-page">

        {/* Hero */}
        <div className="lb-hero">
          <div className="lb-eyebrow">🏆 COMMUNITY RANKINGS</div>
          <h1 className="lb-title">ROAST<br /><span>LEADERBOARD</span></h1>
          <p className="lb-sub">
            The most brutally honest — and funniest — roasts,<br />
            voted by the community.
          </p>
          <Link to="/" className="lb-cta">🔥 Get Roasted &amp; Compete</Link>
        </div>

        {/* Live count */}
        {entries.length > 0 && (
          <div className="lb-live-badge">
            <span className="lb-live-dot" />
            {entries.length} {entries.length === 1 ? "submission" : "submissions"} from real users
          </div>
        )}

        {/* Empty state or list */}
        {entries.length === 0 ? (
          <div className="lb-empty">
            <p className="lb-empty-icon">🔥</p>
            <p className="lb-empty-title">No roasts yet!</p>
            <p className="lb-empty-sub">
              Be the first to get roasted and enter the leaderboard!
            </p>
            <Link to="/" className="lb-cta">🔥 Get Roasted First</Link>
          </div>
        ) : (
          <div className="lb-list">
            {entries.map((e, i) => (
              <div
                key={e.id}
                className={[
                  "lb-entry",
                  i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : "",
                ].filter(Boolean).join(" ")}
              >
                <div className="lb-rank">{i < 3 ? MEDAL[i] : `#${i + 1}`}</div>
                <div className="lb-body">
                  <div className="lb-top-row">
                    <span className="lb-name">{e.name}</span>
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
            ))}
          </div>
        )}

        <p className="lb-reset-note">// vote once per entry • community powered</p>
      </div>
    </div>
  );
}
