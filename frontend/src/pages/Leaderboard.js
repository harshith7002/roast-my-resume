import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function FireParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
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

// Sample leaderboard data
const SAMPLE_ENTRIES = [
  { id: 1, name: "TCS Waala Bhai 😂", roastSnippet: "You listed MS Word as a skill in 2024. My grandmother knows MS Word. You expect 15 LPA with this resume?", verdict: "🏭 Entry Level", atsScore: 28, votes: 234 },
  { id: 2, name: "Anonymous Fresher", roastSnippet: "Your projects section is a YouTube tutorial graveyard. Todo App, Weather App, Calculator — the holy trinity of doing absolutely nothing original.", verdict: "🚀 Startup Ready", atsScore: 45, votes: 189 },
  { id: 3, name: "import numpy enjoyer", roastSnippet: "You imported NumPy once and called yourself an AI/ML Enthusiast. Please stop. That's like taking a Uber once and calling yourself a transport entrepreneur.", verdict: "🏭 Entry Level", atsScore: 32, votes: 156 },
  { id: 4, name: "Placement Padega 🔥", roastSnippet: "Hobbies: Listening to music, watching movies, reading books. Groundbreaking. You've described every human being on planet Earth.", verdict: "🚀 Startup Ready", atsScore: 51, votes: 134 },
  { id: 5, name: "Rahul from IIT", roastSnippet: "Your objective says 'seeking a challenging position to utilize my skills'. Everyone wants that Rahul. That's not an objective, that's a statement of obvious desire.", verdict: "💰 Product Co.", atsScore: 67, votes: 98 },
];

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [voted, setVoted] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    const combined = [...stored, ...SAMPLE_ENTRIES].sort((a, b) => b.votes - a.votes);
    setEntries(combined.slice(0, 20));
    const v = JSON.parse(localStorage.getItem("lb_voted") || "{}");
    setVoted(v);
  }, []);

  const handleVote = (id) => {
    if (voted[id]) return;
    const updated = entries.map(e => e.id === id ? { ...e, votes: e.votes + 1 } : e);
    setEntries(updated.sort((a, b) => b.votes - a.votes));
    const newVoted = { ...voted, [id]: true };
    setVoted(newVoted);
    localStorage.setItem("lb_voted", JSON.stringify(newVoted));
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="page-content">
      <FireParticles />
      <div className="lb-page">
        <div className="lb-header">
          <h1 className="lb-title">🏆 Roast Leaderboard</h1>
          <p className="lb-subtitle">The funniest roasts of the week — voted by the community!</p>
          <div className="lb-prizes">
            <div className="lb-prize">🥇 <strong>1st Place</strong> — Free Resume Correction</div>
            <div className="lb-prize">🥈 <strong>2nd Place</strong> — Deep ATS Analysis</div>
            <div className="lb-prize">🥉 <strong>3rd Place</strong> — Priority Roast</div>
          </div>
          <Link to="/" className="lb-roast-btn">🔥 Get Roasted & Submit!</Link>
        </div>

        <div className="lb-entries">
          {entries.map((entry, idx) => (
            <div key={entry.id} className={`lb-entry${idx < 3 ? " lb-top" : ""}`}>
              <div className="lb-rank">
                {idx < 3 ? medals[idx] : `#${idx + 1}`}
              </div>
              <div className="lb-content">
                <div className="lb-entry-header">
                  <span className="lb-name">{entry.name}</span>
                  <span className={`verdict-badge ${getVerdictClass(entry.verdict)}`}>
                    {getVerdictLabel(entry.verdict)}
                  </span>
                  <span className="lb-ats">ATS: {entry.atsScore}/100</span>
                </div>
                <p className="lb-roast-text">"{entry.roastSnippet}"</p>
                <button
                  className={`lb-vote-btn${voted[entry.id] ? " voted" : ""}`}
                  onClick={() => handleVote(entry.id)}
                  disabled={voted[entry.id]}
                >
                  🔥 {entry.votes} {voted[entry.id] ? "Voted!" : "Vote"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lb-footer-note">
          🔄 Leaderboard resets every Monday • Top 3 win prizes!
        </div>
      </div>
    </div>
  );
}
