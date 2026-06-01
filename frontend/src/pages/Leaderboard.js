import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const SAMPLE = [
  { id: 1, name: "Anonymous Fresher",       quote: "You listed MS Word as a skill in 2024. My grandmother knows MS Word. You expect 15 LPA with this resume?",                                              verdict: "entry",   ats: 28, votes: 234 },
  { id: 2, name: "CS Student",              quote: "Your projects section is a YouTube tutorial graveyard. Todo App, Weather App, Calculator — the holy trinity of doing absolutely nothing original.",   verdict: "startup", ats: 45, votes: 189 },
  { id: 3, name: "Placement Warrior",       quote: "You imported NumPy once and called yourself an AI/ML Enthusiast. That's like taking an Uber once and calling yourself a transport entrepreneur.",     verdict: "entry",   ats: 32, votes: 156 },
  { id: 4, name: "Anonymous Developer",     quote: "Hobbies: Listening to music, watching movies, reading books. You've described every human being on planet Earth.",                                     verdict: "startup", ats: 51, votes: 134 },
  { id: 5, name: "Final Year Student",      quote: "Objective: 'seeking a challenging position to utilize my skills'. That's not an objective, that's a statement of obvious desire.",                    verdict: "product", ats: 67, votes: 98 },
  { id: 6, name: "CS Student",             quote: "CGPA 6.2 and targeting FAANG. I respect the confidence. The universe does not.",                                                                        verdict: "entry",   ats: 24, votes: 87 },
  { id: 7, name: "Placement Warrior",      quote: "Listed React, Node, Python, Rust, Go, Kubernetes, and Docker. Built a static HTML page. Pick a struggle.",                                             verdict: "startup", ats: 55, votes: 71 },
];

const MEDAL = ["🥇", "🥈", "🥉"];

function verdictBadge(v) {
  const map = {
    entry:   { label: "Entry Level", cls: "entry"   },
    startup: { label: "Startup Ready", cls: "startup" },
    product: { label: "Product Co.",   cls: "product" },
    faang:   { label: "FAANG Possible",cls: "faang"   },
  };
  const m = map[v] || map.entry;
  return <span className={`vbadge ${m.cls}`}>{m.label}</span>;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [voted, setVoted]     = useState({});

  useEffect(() => {
    const v = JSON.parse(localStorage.getItem("lb_voted") || "{}");
    setVoted(v);
    setEntries([...SAMPLE].sort((a, b) => b.votes - a.votes));
  }, []);

  const vote = (id) => {
    if (voted[id]) return;
    setEntries(e => e.map(x => x.id === id ? { ...x, votes: x.votes + 1 } : x).sort((a,b) => b.votes - a.votes));
    const nv = { ...voted, [id]: true };
    setVoted(nv);
    localStorage.setItem("lb_voted", JSON.stringify(nv));
  };

  return (
    <div className="page-wrap">
      <div className="lb-page">
        {/* Hero */}
        <div className="lb-hero">
          <div className="lb-eyebrow">🏆 COMMUNITY FAVORITES</div>

          <h1 className="lb-title">
            BEST <br />
            <span>RESUME ROASTS</span>
          </h1>

          <p className="lb-sub">
            The funniest, most brutal, and most relatable resume roasts chosen by the community.
          </p>

          <div className="lb-stats">
            <div className="lb-stat">🔥 1300+ Resumes Roasted</div>
            <div className="lb-stat">🌍 10+ Countries</div>
            <div className="lb-stat">🏆 Community Picks</div>
          </div>

          <div className="lb-prizes">
            <div className="lb-prize-chip">🔥 Most Brutal Roast</div>
            <div className="lb-prize-chip">😂 Funniest Roast</div>
            <div className="lb-prize-chip">📈 Biggest Resume Glow-Up</div>
          </div>

          <div className="lb-note">
            ⚠️ All names are anonymized. No personal resume data is displayed.
          </div>

          <Link to="/" className="lb-cta">
            🔥 Roast My Resume
          </Link>
        </div>

        {/* Entries */}
        <div className="lb-list">
          {entries.map((e, i) => (
            <div key={e.id} className={`lb-entry${i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : ""}`}>
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
                  disabled={voted[e.id]}
                >
                  🔥 {e.votes} {voted[e.id] ? "Voted!" : "Vote"}
                </button>
                <button className="share-btn">
                  📸 Share Roast
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="lb-reset-note">
          🔥 Updated weekly based on community votes.
        </p>
      </div>
    </div>
  );
}
