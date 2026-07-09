import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../utils/api";
import { getUser, getVisitorId } from "../utils/storage";

export default function InterviewPrep() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("Software Engineer");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
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
      setError("Please upload your resume PDF first.");
      return;
    }

    setLoading(true);
    setError("");
    setQuestions([]);
    setExpandedId(null);

    const fd = new FormData();
    fd.append("resume", file);
    fd.append("role", role);
    fd.append("company", company);
    fd.append("user_id", getUser()?.user_id || getVisitorId());

    try {
      const data = await apiFetch("/api/interview/generate", {
        method: "POST",
        body: fd,
      });

      if (data.success && data.questions) {
        setQuestions(data.questions);
      } else {
        setError(data.error || "Failed to generate interview questions.");
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
        <span className="static-eyebrow">COPILOT INTERVIEW PREP</span>
        <h1 className="static-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "8px 0" }}>
          AI Interview <span style={{ color: "var(--emerald)" }}>Questions</span>
        </h1>
        <p className="static-desc" style={{ maxWidth: 580, margin: "0 auto", color: "var(--cream-60)" }}>
          Get 5 highly personalized technical and behavioral questions mapped to your resume, role, and target company.
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Target Role */}
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: "0.88rem", color: "var(--cream)", fontWeight: 600 }}>
                Target Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Frontend Engineer"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--border)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Target Company */}
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: "0.88rem", color: "var(--cream)", fontWeight: 600 }}>
                Target Company (Optional)
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Cisco"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--border)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {error && <p style={{ color: "#ff4757", fontSize: "0.88rem", marginBottom: 16 }}>⚠️ {error}</p>}

          <button
            type="submit"
            disabled={loading || !file}
            className="fire-btn"
            style={{ width: "100%", padding: "14px", borderRadius: 10, fontSize: "1rem" }}
          >
            {loading ? "Analyzing resume & crafting questions..." : "💡 Generate Interview Prep Questions"}
          </button>
        </form>
      </div>

      {/* Questions List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {questions.map((q, idx) => {
          const isOpen = expandedId === q.id;
          return (
            <article
              key={q.id || idx}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => setExpandedId(isOpen ? null : q.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: q.type === "technical" ? "rgba(85,153,255,0.1)" : "rgba(255,170,0,0.1)",
                    color: q.type === "technical" ? "#5599ff" : "#ffaa00"
                  }}>
                    {q.type}
                  </span>
                  <h3 style={{ margin: 0, fontSize: "0.98rem", color: "var(--cream)" }}>Question {idx + 1}</h3>
                </div>
                <span style={{ fontSize: "1.1rem", color: "var(--cream-60)" }}>{isOpen ? "▲" : "▼"}</span>
              </div>
              <p style={{ margin: "12px 0 0", color: "#fff", fontSize: "1.02rem", fontWeight: 600, lineHeight: 1.5 }}>
                {q.question}
              </p>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden", borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16 }}
                  >
                    <h4 style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--emerald)", fontWeight: 700 }}>
                      🔑 ANSWER RUBRIC & KEYWORDS:
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--cream-60)", lineHeight: 1.6 }}>
                      {q.rubric}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </article>
          );
        })}
      </div>
    </div>
  );
}
