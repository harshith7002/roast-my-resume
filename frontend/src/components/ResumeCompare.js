import React, { useId, useState } from "react";
import { apiFetch, validatePdf } from "../utils/api";
import { trackEvent } from "../utils/analytics";
import { getUser, getVisitorId, pushAnalysisCache } from "../utils/storage";

function ResumePicker({ label, hint, file, onChange }) {
  const id = useId();
  const [dragging, setDragging] = useState(false);

  function choose(nextFile) {
    const error = validatePdf(nextFile);
    onChange(error ? null : nextFile, error);
  }

  return (
    <section className="compare-upload-card" aria-labelledby={`${id}-label`}>
      <h2 id={`${id}-label`}>{label}</h2>
      <p className="upload-card-hint">{hint}</p>
      <label
        className={`drop-zone small ${dragging ? "dragover" : ""} ${file ? "has-file" : ""}`}
        htmlFor={id}
        onDragOver={event => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); }}
      >
        <span className="drop-icon" aria-hidden="true">{file ? "✓" : "↑"}</span>
        <strong>{file ? file.name : "Choose or drop a PDF"}</strong>
        <span className="drop-sub">PDF only · 10 MB maximum</span>
      </label>
      <input id={id} className="sr-only" type="file" accept="application/pdf,.pdf" onChange={event => choose(event.target.files[0])} />
    </section>
  );
}

export default function ResumeCompare() {
  const [oldFile, setOldFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateFile(setter, file, validationError) {
    setter(file);
    setError(validationError || "");
  }

  async function handleCompare(event) {
    event.preventDefault();
    if (!oldFile || !newFile) return setError("Add both the previous and updated resume.");
    if (oldFile.name === newFile.name && oldFile.size === newFile.size) return setError("Choose two different resume versions.");
    setLoading(true); setError(""); setResult(null);
    trackEvent("compare_started");
    try {
      const fd = new FormData();
      fd.append("resume_old", oldFile);
      fd.append("resume_new", newFile);
      fd.append("user_id", getUser()?.user_id || getVisitorId());
      const data = await apiFetch("/api/compare", { method: "POST", body: fd, timeout: 60000 });
      setResult(data);
      pushAnalysisCache({
        id: data.analysis_id,
        type: "compare",
        filename: `${oldFile.name} → ${newFile.name}`,
        ats_score: data.new_ats,
        verdict: data.new_verdict,
        result: data,
      });
      trackEvent("compare_completed", { ats_delta: data.ats_delta });
    } catch (requestError) {
      setError(requestError.message);
      trackEvent("compare_failed", { reason: requestError.message });
    } finally { setLoading(false); }
  }

  const reset = () => { setResult(null); setOldFile(null); setNewFile(null); setError(""); };

  return (
    <main className="page-wrap">
      <div className="compare-page">
        <header className="compare-hero">
          <span className="section-kicker">VERSION TRACKING</span>
          <h1>Did your resume actually improve?</h1>
          <p>Compare two PDF versions for ATS score changes, improvements, and regressions.</p>
          <div className="safety-note">🔒 Files are analyzed in memory and are never stored.</div>
        </header>

        {!result ? (
          <form onSubmit={handleCompare}>
            <div className="compare-upload-grid">
              <ResumePicker label="1. Previous resume" hint="Your baseline version" file={oldFile} onChange={(f, e) => updateFile(setOldFile, f, e)} />
              <ResumePicker label="2. Updated resume" hint="The version you want to validate" file={newFile} onChange={(f, e) => updateFile(setNewFile, f, e)} />
            </div>
            {error && <div className="jd-error" role="alert">{error}</div>}
            <div className="jd-actions">
              <button className="btn-primary btn-large" type="submit" disabled={loading || !oldFile || !newFile}>
                {loading ? <><span className="spinner" /> Comparing securely…</> : "Compare resume versions"}
              </button>
            </div>
          </form>
        ) : (
          <section className="compare-results" aria-live="polite">
            <div className="compare-scores">
              <div className="cs-box"><div className="cs-label">Previous ATS score</div><div className="cs-score old">{result.old_ats}</div><div className="cs-verdict">{result.old_verdict}</div></div>
              <div className={`delta-badge ${result.ats_delta > 0 ? "positive" : result.ats_delta < 0 ? "negative" : "neutral"}`}>
                {result.ats_delta > 0 ? `+${result.ats_delta}` : result.ats_delta} points
              </div>
              <div className="cs-box"><div className="cs-label">Updated ATS score</div><div className="cs-score new">{result.new_ats}</div><div className="cs-verdict">{result.new_verdict}</div></div>
            </div>
            <div className="compare-panels">
              <div className="compare-panel green"><h2>Improvements</h2><ul>{(result.improvements || []).map(item => <li key={item}>{item}</li>)}</ul></div>
              <div className="compare-panel red"><h2>Regressions</h2>{result.regressions?.length ? <ul>{result.regressions.map(item => <li key={item}>{item}</li>)}</ul> : <p className="no-issues">No regressions detected.</p>}</div>
            </div>
            {!!result.unchanged?.length && <div className="compare-panel unchanged"><h2>Unchanged</h2><ul>{result.unchanged.map(item => <li key={item}>{item}</li>)}</ul></div>}
            <div className="compare-rec"><strong>Next best action:</strong> {result.recommendation}</div>
            <div className="jd-actions"><button className="btn-secondary" type="button" onClick={reset}>Compare another pair</button></div>
          </section>
        )}
      </div>
    </main>
  );
}
