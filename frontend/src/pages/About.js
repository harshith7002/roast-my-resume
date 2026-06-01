import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="page-content">
      <div className="static-page">
        <Link to="/" className="back-link">← Back to Roast My Resume</Link>
        <h1>About Roast My Resume 🔥</h1>
        <p>Roast My Resume is a free AI-powered tool that gives brutally honest resume feedback to CS freshers. No sugarcoating. No "add more action verbs." Just real, actionable feedback.</p>
        <h2>Why We Built This</h2>
        <p>Most resume feedback tools are either too expensive or too generic. We built this so every CS student gets the kind of honest feedback that only a senior engineer friend would give — for free.</p>
        <h2>How It Works</h2>
        <ol>
          <li>Upload your resume as a PDF</li>
          <li>Pick your roaster personality</li>
          <li>Our AI analyzes it in ~15 seconds</li>
          <li>Get a brutal roast + ATS score + actionable feedback</li>
          <li>Improve your resume and get hired!</li>
        </ol>
        <h2>Features</h2>
        <ul>
          <li>🎭 5 Roast Personalities</li>
          <li>📊 ATS Score</li>
          <li>🌍 34+ Languages</li>
          <li>🏆 Community Leaderboard</li>
          <li>🔥 Daily Streaks</li>
          <li>🎖️ Badges</li>
          <li>🎨 Downloadable Share Card</li>
        </ul>
        <h2>Privacy First</h2>
        <p>Your resume is never stored. It's processed in memory and immediately discarded after analysis.</p>
        <h2>Tech Stack</h2>
        <ul>
          <li>Frontend: React</li>
          <li>Backend: Flask (Python)</li>
          <li>AI: Groq AI (LLaMA)</li>
          <li>Hosting: Netlify + Render</li>
        </ul>
        <p>Built with ❤️ for CS freshers worldwide. <a href="https://macoostudy.info">macoostudy.info</a></p>
        <p>Built by <a href="https://portfolio-saiharshith.netlify.app" target="_blank" rel="noopener noreferrer">Harshith</a> 🔥</p>
      </div>
    </div>
  );
}
