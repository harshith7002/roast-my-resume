import React, { useState, useRef } from "react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function parseRoast(text) {
  const sections = [];
  const patterns = [
    { key: "roast", emoji: "🔥", title: "THE ROAST", color: "#ff4444" },
    { key: "shame", emoji: "💀", title: "HALL OF SHAME", color: "#ff8c00" },
    { key: "decent", emoji: "✅", title: "OKAY FINE, THIS IS DECENT", color: "#00c851" },
    { key: "glowup", emoji: "📈", title: "GLOW UP GUIDE", color: "#007bff" },
    { key: "verdict", emoji: "🎯", title: "FINAL VERDICT", color: "#9c27b0" },
  ];

  patterns.forEach(({ key, emoji, title, color }, i) => {
    const nextEmoji = patterns[i + 1]?.emoji;
    const regex = nextEmoji
      ? new RegExp(`${emoji}[\\s\\S]*?(?=${nextEmoji})`, "g")
      : new RegExp(`${emoji}[\\s\\S]*$`, "g");
    const match = text.match(regex);
    if (match) {
      sections.push({ key, title, color, content: match[0].trim() });
    }
  });

  return sections.length > 0 ? sections : [{ key: "full", title: "ROAST RESULTS", color: "#ff4444", content: text }];
}

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roast, setRoast] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [language, setLanguage] = useState("english");
  const fileRef = useRef();

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") {
      setFile(f);
      setError(null);
    } else {
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

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("language", language);

    try {
      const res = await fetch(`${BACKEND_URL}/api/roast`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setRoast(data.roast);
      } else {
        setError(data.error || "Something went wrong!");
      }
    } catch (err) {
      setError("Cannot connect to server. Make sure backend is running!");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roast);
    alert("Roast copied! Share it with your friends 😂");
  };

  const handleReset = () => {
    setFile(null);
    setRoast(null);
    setError(null);
  };

  const parsedSections = roast ? parseRoast(roast) : [];

  return (
    <div className="app">
      <div className="bg-noise" />
      <div className="bg-grid" />

      <header className="header">
        <div className="header-badge">🇮🇳 Made for Indian CS Freshers</div>
        <h1 className="title">
          <span className="title-roast">Roast</span>
          <span className="title-my"> My</span>
          <span className="title-resume"> Resume</span>
          <span className="fire-emoji">🔥</span>
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
              className={`upload-card ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileRef.current.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />

              {file ? (
                <div className="file-selected">
                  <div className="file-icon">📄</div>
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                  <button className="change-file-btn" onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}>
                    Change file
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📋</div>
                  <div className="upload-text">Drop your resume PDF here</div>
                  <div className="upload-subtext">or click to browse</div>
                  <div className="upload-hint">Only PDF files accepted</div>
                </div>
              )}
            </div>

            {error && (
              <div className="error-box">
                ⚠️ {error}
              </div>
            )}

            {/* Language Toggle */}
            <div className="language-toggle">
              <button
                className={`lang-btn ${language === "english" ? "active" : ""}`}
                onClick={() => setLanguage("english")}
              >
                🌍 English
              </button>
              <button
                className={`lang-btn ${language === "hinglish" ? "active" : ""}`}
                onClick={() => setLanguage("hinglish")}
              >
                🇮🇳 Hinglish(Hindi + English)
              </button>
            </div>

            <button
              className={`roast-btn ${loading ? "loading" : ""} ${!file ? "disabled" : ""}`}
              onClick={handleSubmit}
              disabled={!file || loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Roasting your resume...
                </span>
              ) : (
                "🔥 Roast My Resume"
              )}
            </button>

            {loading && (
              <div className="loading-messages">
                <p>☕ Grab a chai, this takes ~15 seconds...</p>
                <p>Our AI is judging you very hard right now</p>
              </div>
            )}

            <div className="sample-card">
              <div className="sample-title">Sample Verdict Types</div>
              <div className="sample-verdicts">
                <span className="verdict-badge tcs">🏭 TCS Material</span>
                <span className="verdict-badge startup">🚀 Startup Ready</span>
                <span className="verdict-badge product">💰 Product Co.</span>
                <span className="verdict-badge faang">🌟 FAANG Possible</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="results-section">
            <div className="results-header">
              <h2 className="results-title">Your Roast is Ready 😂</h2>
              <p className="results-subtitle">Brace yourself...</p>
            </div>

            <div className="roast-cards">
              {parsedSections.map((section) => (
                <div key={section.key} className="roast-card" style={{ "--card-color": section.color }}>
                  <div className="card-content">
                    {section.content.split("\n").map((line, i) => (
                      line.trim() && (
                        <p key={i} className={`card-line ${line.startsWith("🔥") || line.startsWith("💀") || line.startsWith("✅") || line.startsWith("📈") || line.startsWith("🎯") ? "card-heading" : ""}`}>
                          {line}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="results-actions">
              <button className="action-btn copy-btn" onClick={handleCopy}>
                📋 Copy & Share
              </button>
              <button className="action-btn reset-btn" onClick={handleReset}>
                🔄 Roast Another
              </button>
            </div>

            <div className="share-nudge">
              Share your roast results in your college group chat 😂
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Built for Indian CS freshers 🇮🇳 • <a href="https://macoostudy.info">macoostudy.info</a></p>
        <p className="footer-note">Your resume is not stored. Ever.</p>
      </footer>
    </div>
  );
}
