import React, { useState } from "react";
import { getUser } from "../utils/storage";
import { pushAnalysisCache } from "../utils/storage";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function ScoreRing({ score }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 70 ? "#00d68f" : score >= 50 ? "#ffaa00" : "#ff4757";
  return (
    <div className="score-ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#2a2a2a" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="70" y="65" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="700">{score}%</text>
        <text x="70" y="85" textAnchor="middle" fill="#888" fontSize="12">Match</text>
      </svg>
    </div>
  );
}

function ImportanceBadge({ level }) {
  const map = {
    critical: { color: "#ff4757", label: "Critical" },
    important: { color: "#ffaa00", label: "Important" },
    "nice-to-have": { color: "#5599ff", label: "Nice to have" },
  };
  const m = map[level] || map["nice-to-have"];
  return <span className="importance-badge" style={{ background: m.color + "22", color: m.color, border: `1px solid ${m.color}44` }}>{m.label}</span>;
}

export default function JDMatcher() {
  const [file, setFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const user = getUser();

  async function handleAnalyze() {
    if (!file) { setError("Please upload your resume PDF"); return; }
    if (!jdText.trim() || jdText.trim().length < 50) { setError("Please paste a job description (at least 50 characters)"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      fd.append("jd_text", jdText);
      if (user?.user_id) fd.append("user_id", user.user_id);

      const res = await fetch(`${BACKEND}/api/jd-match`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        pushAnalysisCache({ type: "jd_match", score: data.match_score, filename: file.name, result: data });
      } else {
        setError(data.error || "Analysis failed");
      }
    } catch {
      setError("Network error — is the backend running?");
    }
    setLoading(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".pdf")) setFile(f);
    else setError("Only PDF files are supported");
  }

  function downloadReport() {
    if (!result) return;
    const lines = [
      `JD Match Report — ${new Date().toLocaleString()}`,
      `Resume: ${file?.name || ""}`,
      ``,
      `MATCH SCORE: ${result.match_score}%`,
      ``,
      `SUMMARY`,
      result.summary,
      ``,
      `STRENGTHS`,
      ...(result.strengths || []).map((s, i) => `${i + 1}. ${s.point}: ${s.detail}`),
      ``,
      `MISSING SKILLS`,
      ...(result.missing_skills || []).map(s => `• [${s.importance.toUpperCase()}] ${s.skill}`),
      ``,
      `YOUR KEYWORDS NOT IN JD`,
      ...(result.resume_keywords_missing_from_jd || []).map(k => `• ${k}`),
      ``,
      `IMPROVEMENT SUGGESTIONS`,
      ...(result.improvements || []).map((imp, i) => `${i + 1}. ${imp.action}\n   Why: ${imp.why}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `jd-match-report-${Date.now()}.txt`;
    a.click();
  }

  return (
    <div className="jd-matcher-page">
      <div className="jd-hero">
        <h1>🎯 JD Matcher</h1>
        <p>See exactly how well your resume matches a job description — and what to fix.</p>
      </div>

      {!result ? (
        <div className="jd-input-grid">
          {/* Left: Resume upload */}
          <div className="jd-card">
            <h3>📄 Your Resume</h3>
            <div
              className={`drop-zone ${dragOver ? "dragover" : ""} ${file ? "has-file" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("jd-resume-input").click()}
            >
              {file ? (
                <>
                  <div className="drop-icon">✅</div>
                  <p className="drop-filename">{file.name}</p>
                  <p className="drop-sub">Click to change</p>
                </>
              ) : (
                <>
                  <div className="drop-icon">📤</div>
                  <p>Drag & drop your PDF here</p>
                  <p className="drop-sub">or click to browse</p>
                </>
              )}
            </div>
            <input
              id="jd-resume-input"
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={e => setFile(e.target.files[0])}
            />
          </div>

          {/* Right: JD paste */}
          <div className="jd-card">
            <h3>💼 Job Description</h3>
            <textarea
              className="jd-textarea"
              placeholder="Paste the full job description here...&#10;&#10;The more detail you include, the better the match analysis."
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              rows={12}
            />
            <p className="jd-char-count">{jdText.length} characters {jdText.length < 50 ? "(need at least 50)" : "✓"}</p>
          </div>
        </div>
      ) : null}

      {error && <div className="jd-error">{error}</div>}

      {!result && (
        <div className="jd-actions">
          <button
            className="btn-primary btn-large"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" /> Analyzing match...</>
            ) : "🎯 Analyze Match"}
          </button>
        </div>
      )}

      {loading && (
        <div className="jd-loading">
          <div className="loading-steps">
            {["Parsing resume...", "Parsing job description...", "Comparing skills & keywords...", "Generating insights..."].map((s, i) => (
              <div key={i} className="loading-step">
                <div className="step-dot" style={{ animationDelay: `${i * 0.4}s` }} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="jd-results">
          {/* Header row */}
          <div className="jd-results-header">
            <div>
              <h2>Match Analysis</h2>
              <p className="jd-filename">{file?.name}</p>
            </div>
            <div className="jd-header-actions">
              <button className="btn-secondary" onClick={() => { setResult(null); setFile(null); setJdText(""); }}>
                🔄 New Analysis
              </button>
              <button className="btn-primary" onClick={downloadReport}>
                📥 Download Report
              </button>
            </div>
          </div>

          {/* Score + summary */}
          <div className="jd-score-row">
            <ScoreRing score={result.match_score} />
            <div className="jd-summary-box">
              <h3>Summary</h3>
              <p>{result.summary}</p>
            </div>
          </div>

          {/* 4-panel grid */}
          <div className="jd-panels">

            <div className="jd-panel jd-panel-green">
              <h3>✅ Strengths</h3>
              <ul>
                {(result.strengths || []).map((s, i) => (
                  <li key={i}>
                    <strong>{s.point}</strong>
                    <p>{s.detail}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="jd-panel jd-panel-red">
              <h3>⚠️ Missing Skills</h3>
              <ul>
                {(result.missing_skills || []).map((s, i) => (
                  <li key={i} className="missing-skill-row">
                    <span>{s.skill}</span>
                    <ImportanceBadge level={s.importance} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="jd-panel jd-panel-blue">
              <h3>🔑 Your Keywords Not in JD</h3>
              <div className="keyword-chips">
                {(result.resume_keywords_missing_from_jd || []).map((k, i) => (
                  <span key={i} className="keyword-chip">{k}</span>
                ))}
              </div>
            </div>

            <div className="jd-panel jd-panel-orange">
              <h3>📈 Improvement Suggestions</h3>
              <ol>
                {(result.improvements || []).map((imp, i) => (
                  <li key={i}>
                    <strong>{imp.action}</strong>
                    <p>{imp.why}</p>
                  </li>
                ))}
              </ol>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
