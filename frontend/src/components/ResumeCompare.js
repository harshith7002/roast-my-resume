import React, { useState } from "react";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function ResumeCompare() {
  const [oldFile, setOldFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCompare() {
    if (!oldFile || !newFile) { setError("Upload both resumes"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("resume_old", oldFile);
      fd.append("resume_new", newFile);
      const res = await fetch(`${BACKEND}/api/compare`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.error || "Comparison failed");
    } catch { setError("Network error"); }
    setLoading(false);
  }

  function DeltaBadge({ val }) {
    if (val === 0) return <span className="delta-neutral">→ No change</span>;
    return val > 0
      ? <span className="delta-up">▲ +{val} pts</span>
      : <span className="delta-down">▼ {val} pts</span>;
  }

  return (
    <div className="page-wrap">
    <div className="compare-page">
      <div className="compare-hero">
        <h1>⚖️ Resume Version Comparison</h1>
        <p>Upload your old and new resume to see exactly what improved.</p>
      </div>

      {!result ? (
        <>
          <div className="compare-upload-grid">
            {[
              { label: "Old Resume", file: oldFile, set: setOldFile, id: "cmp-old" },
              { label: "New Resume", file: newFile, set: setNewFile, id: "cmp-new" },
            ].map(({ label, file, set, id }) => (
              <div key={id} className="compare-upload-card">
                <h3>{label}</h3>
                <div className="drop-zone small" onClick={() => document.getElementById(id).click()}>
                  {file ? (
                    <><div className="drop-icon">✅</div><p>{file.name}</p></>
                  ) : (
                    <><div className="drop-icon">📤</div><p>Click to upload PDF</p></>
                  )}
                </div>
                <input id={id} type="file" accept=".pdf" style={{ display: "none" }}
                  onChange={e => set(e.target.files[0])} />
              </div>
            ))}
          </div>

          {error && <div className="jd-error">{error}</div>}

          <div className="jd-actions">
            <button className="btn-primary btn-large" onClick={handleCompare} disabled={loading}>
              {loading ? <><span className="spinner" /> Comparing...</> : "⚖️ Compare Resumes"}
            </button>
          </div>
        </>
      ) : (
        <div className="compare-results">
          <div className="compare-scores">
            <div className="cs-box">
              <div className="cs-label">Old ATS Score</div>
              <div className="cs-score old">{result.old_ats}%</div>
              <div className="cs-verdict">{result.old_verdict}</div>
            </div>
            <div className="cs-arrow">
              <DeltaBadge val={result.ats_delta} />
            </div>
            <div className="cs-box">
              <div className="cs-label">New ATS Score</div>
              <div className="cs-score new">{result.new_ats}%</div>
              <div className="cs-verdict">{result.new_verdict}</div>
            </div>
          </div>

          <div className="compare-panels">
            <div className="compare-panel green">
              <h3>✅ Improvements ({(result.improvements || []).length})</h3>
              <ul>{(result.improvements || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
            <div className="compare-panel red">
              <h3>⬇️ Regressions ({(result.regressions || []).length})</h3>
              {result.regressions?.length ? (
                <ul>{result.regressions.map((x, i) => <li key={i}>{x}</li>)}</ul>
              ) : <p className="no-issues">No regressions detected 🎉</p>}
            </div>
          </div>

          {result.recommendation && (
            <div className="compare-rec">
              <strong>💡 Recommendation:</strong> {result.recommendation}
            </div>
          )}

          <div className="jd-actions">
            <button className="btn-secondary" onClick={() => { setResult(null); setOldFile(null); setNewFile(null); }}>
              🔄 Compare Again
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
