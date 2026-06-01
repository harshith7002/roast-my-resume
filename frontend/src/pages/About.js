import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="page-wrap">
      <div className="static-wrap">
        <Link to="/" className="back-link">← Back</Link>
        <h1>ABOUT US</h1>
        <p>RoastMyResume is a free AI-powered tool that gives brutally honest resume feedback to CS freshers. No sugarcoating. No "add more action verbs." Just real, actionable feedback.</p>
        <h2>WHY WE BUILT THIS</h2>
        <p>Most resume feedback tools are either too expensive or too generic. We built this so every CS student gets the kind of honest feedback only a senior engineer friend would give — for free.</p>
        <h2>FEATURES</h2>
        <ul>
          <li>🎭 6 Roast Personalities — Gordon Ramsay, Elon Musk & more</li>
          <li>📊 ATS Score — real resume signal analysis</li>
          <li>🌍 34+ Languages — including Hinglish, Tanglish & all Indian regional</li>
          <li>🏆 Community Leaderboard — weekly prizes</li>
          <li>🔥 Daily Streaks — keep improving</li>
          <li>🎖️ Badges — earn them after roasting</li>
          <li>🎨 Downloadable Share Card</li>
        </ul>
        <h2>PRIVACY FIRST</h2>
        <p>Your resume is never stored. It's processed in memory and immediately discarded after analysis.</p>
        <h2>TECH STACK</h2>
        <ul>
          <li>Frontend: React</li>
          <li>Backend: Flask (Python)</li>
          <li>AI: Groq AI (LLaMA)</li>
          <li>Hosting: Netlify + Render</li>
        </ul>
        <p>Built with ❤️ by <a href="https://portfolio-saiharshith.netlify.app" target="_blank" rel="noopener noreferrer">Harshith</a> for CS freshers worldwide 🌍</p>
      </div>
    </div>
  );
}
