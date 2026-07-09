import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../utils/api";
import { getUser, getVisitorId } from "../utils/storage";

export default function CoverLetter() {
  const [file, setFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!file) {
      setError("Please upload your resume PDF.");
      return;
    }

    setLoading(true);
    setError("");
    setCoverLetter("");

    const fd = new FormData();
    fd.append("resume", file);
    fd.append("jd_text", jdText);
    fd.append("user_id", getUser()?.user_id || getVisitorId());

    try {
      const data = await apiFetch("/api/cover-letter/generate", {
        method: "POST",
        body: fd,
      });

      if (data.success && data.cover_letter) {
        setCoverLetter(data.cover_letter);
      } else {
        setError(data.error || "Failed to generate cover letter.");
      }
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap static-page" style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px" }}>
      <div className="static-header" style={{ textAlign: "center", marginBottom: 32 }}>
        <span className="static-eyebrow">COPILOT WRITING TOOLS</span>
        <h1 className="static-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "8px 0" }}>
          AI Cover Letter <span style={{ color: "var(--fire)" }}>Generator</span>
        </h1>
        <p className="static-desc" style={{ maxWidth: 580, margin: "0 auto", color: "var(--cream-60)" }}>
          Create a personalized, compelling cover letter mapping your actual experience directly to any job description.
        </p>
      </div>

      <div className="form-box" style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 32, borderRadius: 16, marginBottom: 32 }}>
        <form onSubmit={handleGenerate}>
          {/* File Upload */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: "0.88rem", color: "var(--cream)", fontWeight: 600 }}>
              Upload Resume (PDF)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--border)",
                color: "var(--cream-60)",
                fontSize: "0.88rem",
              }}
            />
            {file && <p style={{ fontSize: "0.82rem", color: "var(--emerald)", marginTop: 6 }}>✓ Loaded: {file.name}</p>}
          </div>

          {/* Job Description Text */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: "0.88rem", color: "var(--cream)", fontWeight: 600 }}>
              Paste Job Description or Role Details
            </label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="e.g. Seeking a Frontend Engineer with React, TypeScript, and state-management experience..."
              rows={6}
              required
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid var(--border)",
                color: "#fff",
                fontSize: "0.92rem",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </div>

          {error && <p style={{ color: "#ff4757", fontSize: "0.88rem", marginBottom: 16 }}>⚠️ {error}</p>}

          <button
            type="submit"
            disabled={loading || !file || !jdText.trim()}
            className="fire-btn"
            style={{ width: "100%", padding: "14px", borderRadius: 10, fontSize: "1rem" }}
          >
            {loading ? "Aligning experience & writing..." : "✍️ Generate Tailored Cover Letter"}
          </button>
        </form>
      </div>

      {/* Result Card */}
      <AnimatePresence>
        {coverLetter && (
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 32,
              marginBottom: 40,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
              <h3 style={{ margin: 0, color: "var(--cream)", fontSize: "1.1rem" }}>✍️ Tailored Cover Letter</h3>
              <button
                className="ra-btn primary"
                onClick={() => {
                  navigator.clipboard.writeText(coverLetter);
                  alert("Cover Letter copied to clipboard! 📋");
                }}
                style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.82rem" }}
              >
                📋 Copy Letter
              </button>
            </div>

            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={16}
              style={{
                width: "100%",
                padding: "20px",
                borderRadius: "12px",
                background: "rgba(0, 0, 0, 0.25)",
                border: "1px solid var(--border)",
                color: "#fff",
                fontSize: "0.95rem",
                fontFamily: "monospace",
                lineHeight: 1.6,
                outline: "none",
                resize: "vertical",
              }}
            />
          </motion.article>
        )}
      </AnimatePresence>
    </div>
  );
}
