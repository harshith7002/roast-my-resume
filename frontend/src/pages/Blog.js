import React from "react";
import { Link } from "react-router-dom";

const POSTS = [
  { title: "How to Write a Resume That Won't Get Roasted", date: "May 30, 2026", read: "5 min" },
  { title: "What is ATS and Why Your Resume Keeps Getting Rejected", date: "May 28, 2026", read: "7 min" },
  { title: "Top 10 Resume Mistakes Indian CS Freshers Make", date: "May 26, 2026", read: "6 min" },
  { title: "FAANG vs Startup vs Service Company — Which Resume Do You Need?", date: "May 24, 2026", read: "8 min" },
  { title: "How to Beat ATS in 2026 — Complete Guide", date: "May 22, 2026", read: "10 min" },
];

export default function Blog() {
  return (
    <div className="page-wrap">
      <div className="static-wrap">
        <Link to="/" className="back-link">← Back</Link>
        <h1>RESUME TIPS</h1>
        <p className="blog-intro">Actionable advice to stop getting roasted by AI — and start getting hired. <strong>Articles are on the way</strong> — here's what's coming.</p>
        <div className="blog-grid">
          {POSTS.map((p, i) => (
            <div key={i} className="blog-card">
              <div className="blog-meta">
                <span className="blog-read">⏱ {p.read} read</span>
                <span className="blog-soon">Coming soon</span>
              </div>
              <h2 className="blog-title">{p.title}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
