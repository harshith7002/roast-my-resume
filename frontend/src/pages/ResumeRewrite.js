import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../utils/api";

const SAMPLE_WEAK_BULLETS = [
  "Responsible for writing code in React.",
  "Helped with designing the homepage and database setup.",
  "Worked on fixing bugs and testing the product.",
];

export default function ResumeRewrite() {
  const [bullet, setBullet] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleRewrite(e) {
    e.preventDefault();
    if (!bullet.trim()) {
      setError("Please paste or type a bullet point to rewrite.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await apiFetch("/api/resume/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet }),
      });

      if (data.success && data.rewrite) {
        setResult(data.rewrite);
      } else {
        setError(data.error || "Failed to rewrite bullet.");
      }
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap static-page">
      <div className="static-header" style={{ textAlign: "center", marginBottom: 32 }}>
        <p className="static-eyebrow">RESUME OPTIMIZATION</p>
        <h1 className="static-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          AI BULLET <span style={{ color: "var(--fire)" }}>REWRITER</span>
        </h1>
        <p className="static-desc" style={{ maxWidth: 600, margin: "12px auto 0" }}>
          Transform weak, task-oriented descriptions into high-impact, results-driven bullets using Google's XYZ formula.
        </p>
      </div>

      <div className="form-box" style={{ maxWidth: 680, margin: "0 auto 40px", padding: 32, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
        <form onSubmit={handleRewrite}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "var(--cream-60)", fontWeight: 600 }}>
              Paste Your Resume Bullet Point
            </label>
            <textarea
              value={bullet}
              onChange={(e) => setBullet(e.target.value)}
              placeholder="e.g., I wrote React code and helped with the database."
              rows={4}
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

          {/* Quick Samples */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: "0.78rem", color: "var(--cream-60)", display: "block", marginBottom: 8 }}>
              Or click a weak sample bullet to load it:
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SAMPLE_WEAK_BULLETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBullet(b)}
                  style={{
                    textAlign: "left",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "var(--cream-60)",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--fire)")}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  "{b}"
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ color: "#ff4757", marginBottom: 16, fontSize: "0.88rem" }}>⚠️ {error}</div>}

          <button
            type="submit"
            className="fire-btn"
            disabled={loading || !bullet.trim()}
            style={{ width: "100%", padding: "16px", borderRadius: "12px", fontSize: "1rem" }}
          >
            {loading ? "Polishing with XYZ formula..." : "🔥 Rewrite Bullet Point"}
          </button>
        </form>
      </div>

      {/* Results Container */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            style={{
              maxWidth: 680,
              margin: "0 auto 60px",
              padding: 32,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
            }}
          >
            {/* Before / After */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div>
                <span className="ba-tag bad" style={{ display: "inline-block", marginBottom: 6 }}>
                  Original
                </span>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--cream-60)", textDecoration: "line-through" }}>
                  {result.original}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "center", fontSize: "1.2rem" }}>⬇️</div>

              <div>
                <span className="ba-tag good" style={{ display: "inline-block", marginBottom: 6 }}>
                  Rewritten (STAR/XYZ)
                </span>
                <p style={{ margin: 0, fontSize: "1.05rem", color: "#fff", fontWeight: 700, lineHeight: 1.5 }}>
                  {result.rewritten}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: 20,
              }}
            >
              <h3 style={{ fontSize: "0.95rem", color: "var(--cream)", marginBottom: 8 }}>
                💡 Why this version is stronger:
              </h3>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--cream-60)", lineHeight: 1.6 }}>
                {result.explanation}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                className="ra-btn primary"
                onClick={() => {
                  navigator.clipboard.writeText(result.rewritten);
                  alert("Copied rewritten bullet to clipboard! 📋");
                }}
                style={{ flex: 1, padding: "12px", borderRadius: "10px" }}
              >
                📋 Copy Bullet Point
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
