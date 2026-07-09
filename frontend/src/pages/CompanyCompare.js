import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, validatePdf } from "../utils/api";
import { getVisitorId, pushAnalysisCache } from "../utils/storage";
import { downloadTextPdf } from "../utils/pdf";

const COMPANIES = [
  { id: "google", name: "Google", logo: "🌐", color: "#4285F4" },
  { id: "amazon", name: "Amazon", logo: "📦", color: "#FF9900" },
  { id: "microsoft", name: "Microsoft", logo: "💻", color: "#F25022" },
  { id: "meta", name: "Meta", logo: "👤", color: "#0668E1" },
  { id: "cisco", name: "Cisco Systems", logo: "📡", color: "#1BA0D7" },
  { id: "bny", name: "BNY Mellon", logo: "🏦", color: "#104E8B" },
  { id: "adobe", name: "Adobe", logo: "🎨", color: "#FF0000" },
  { id: "atlassian", name: "Atlassian", logo: "🚀", color: "#0052CC" },
  { id: "nvidia", name: "Nvidia", logo: "🎮", color: "#76B900" },
  { id: "oracle", name: "Oracle", logo: "🗄️", color: "#F80000" },
  { id: "salesforce", name: "Salesforce", logo: "☁️", color: "#00A1E0" },
];

const MOCK_REPORTS = {
  "google": {
    success: true,
    analysis_id: "mock_google_compare",
    match_score: 82,
    summary: "Your engineering background shows strong algorithmic and system design foundation, matching Google's high standard for software engineering. However, your project section lacks large-scale distributed databases representation.",
    missing_skills: ["Distributed Systems", "gRPC", "MapReduce"],
    missing_keywords: ["Linear scalability", "Concurrency", "Throughput"],
    projects_to_build: [
      { title: "Distributed KV Store", description: "Implement a Raft-consensus replicated key-value database using Go and gRPC with dynamic membership changes." },
      { title: "Dynamic Rate Limiter", description: "Design a sliding-window token bucket rate-limiting service deployed via Kubernetes." }
    ],
    certifications: ["Google Cloud Certified Professional Cloud Developer"],
    interview_prep: [
      "Prepare for rigorous data structures and algorithms rounds (Graph algorithms, dynamic programming).",
      "Brush up on system design scaling concepts (consistent hashing, load balancers)."
    ]
  },
  "microsoft": {
    success: true,
    analysis_id: "mock_microsoft_compare",
    match_score: 78,
    summary: "Strong enterprise architecture signals and C#/.NET experience aligns well with Microsoft Azure Core Teams. There is a small gap in cloud migration experience and security fundamentals representation.",
    missing_skills: ["Azure Cloud", "OAuth2.0 Security", "Active Directory"],
    missing_keywords: ["Enterprise Integration", "Microservices orchestration", "Telemetry"],
    projects_to_build: [
      { title: "Azure Serverless API Suite", description: "Build an event-driven system using Azure Functions and Service Bus communicating with Cosmos DB." },
      { title: "Microservices Identity Provider", description: "Develop an OAuth2.0 authentication service using ASP.NET Core Identity." }
    ],
    certifications: ["Microsoft Certified: Azure Developer Associate"],
    interview_prep: [
      "Focus on low-level design patterns (SOLID principles, gang-of-four patterns).",
      "Practice behavior questions mapping to Microsoft's growth mindset philosophy."
    ]
  },
  "adobe": {
    success: true,
    analysis_id: "mock_adobe_compare",
    match_score: 84,
    summary: "Excellent WebGL/graphics programming background. Perfect fit for Adobe's Creative Cloud web integrations team. Your UI/UX performance bullet points are strong but could represent more complex canvas integrations.",
    missing_skills: ["WebGL / WebGPU", "HTML5 Canvas performance", "WASM (WebAssembly)"],
    missing_keywords: ["Frame-rate rendering", "GPU memory leaks", "Asset pre-fetching"],
    projects_to_build: [
      { title: "WASM Video Filter", description: "Develop an in-browser real-time video processing engine using Rust compiled to WebAssembly." },
      { title: "HTML5 Collaborative Canvas", description: "Implement a low-latency digital whiteboard utilizing WebSockets and canvas rendering optimizations." }
    ],
    certifications: ["Adobe Certified Professional - Frontend Integration"],
    interview_prep: [
      "Be ready for frontend system design questions (optimizing large asset bundle loading, caching mechanisms).",
      "Practice coding interactive animations and canvas manipulation in vanilla JS."
    ]
  }
};

export default function CompanyCompare() {
  const [file, setFile] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  function loadTemplate(companyKey, sampleFilename) {
    setError("");
    setLoading(true);
    setResult(null);
    setStatusMsg("Loading template comparison...");
    setTimeout(() => {
      setSelectedCompany(companyKey);
      setFile({ name: sampleFilename, size: 48000 });
      setResult(MOCK_REPORTS[companyKey]);
      setLoading(false);
    }, 600);
  }

  const activeComp = COMPANIES.find(c => c.id === selectedCompany);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    const err = validatePdf(selected);
    if (err) {
      setError(err);
      setFile(null);
    } else {
      setError("");
      setFile(selected);
    }
  }

  async function handleCompare(e) {
    e.preventDefault();
    if (!file) {
      setError("Please upload your resume PDF.");
      return;
    }
    if (!selectedCompany) {
      setError("Please select a target company.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const msgs = [
      "Deconstructing your resume...",
      `Analyzing fit against ${activeComp.name} culture...`,
      "Comparing technical stack requirements...",
      "Generating custom project roadmaps...",
      "Drafting interview preparation tips...",
    ];

    let i = 0;
    setStatusMsg(msgs[0]);
    const timer = setInterval(() => {
      i = (i + 1) % msgs.length;
      setStatusMsg(msgs[i]);
    }, 3000);

    try {
      const fd = new FormData();
      fd.append("resume", file);
      fd.append("company", selectedCompany);
      fd.append("user_id", getVisitorId());

      const data = await apiFetch("/api/company/compare", {
        method: "POST",
        body: fd,
      });

      clearInterval(timer);
      if (data.success) {
        setResult(data);
        // Save to cache/history
        pushAnalysisCache({
          id: data.analysis_id,
          filename: file.name,
          type: "company_compare",
          ats_score: data.match_score,
          verdict: `${activeComp.name} Match`,
          result_json: JSON.stringify(data),
        });
      } else {
        setError(data.error || "Failed to complete comparison.");
      }
    } catch (err) {
      clearInterval(timer);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function downloadReport() {
    if (!result) return;
    downloadTextPdf({
      title: `${activeComp.name} Fit Analysis`,
      subtitle: `${file?.name || "Resume"} · Match score ${result.match_score}%`,
      filename: `${selectedCompany}-compare-report`,
      sections: [
        { heading: "Executive Summary", body: result.summary },
        { heading: "Key Strengths & Gaps", lines: [`Match Score: ${result.match_score}%`, ...result.missing_skills.map(s => `- Missing Skill: ${s}`), ...result.missing_keywords.map(k => `- Missing Keyword: ${k}`)] },
        { heading: "Recommended Projects", lines: result.projects_to_build.flatMap(p => [`Title: ${p.title}`, `Guidelines: ${p.description}`, ""]) },
        { heading: "Recommended Certifications", lines: result.certifications.map(c => `- ${c}`) },
        { heading: "Interview Preparation Steps", lines: result.interview_prep.map(ip => `- ${ip}`) }
      ]
    });
  }

  return (
    <div className="page-wrap static-page">
      <div className="static-header" style={{ textAlign: "center", marginBottom: 32 }}>
        <p className="static-eyebrow">TARGETED PREPARATION</p>
        <h1 className="static-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          RESUME VS <span style={{ color: "var(--fire)" }}>COMPANY</span>
        </h1>
        <p className="static-desc" style={{ maxWidth: 600, margin: "12px auto 0" }}>
          Upload your resume, select a top tech giant, and see how well you align with their engineering expectations.
        </p>
      </div>

      <div className="form-box" style={{ maxWidth: 720, margin: "0 auto 40px", padding: 32, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
        <form onSubmit={handleCompare}>
          {/* Target Company Selector */}
          <div style={{ marginBottom: 24 }}>
            <label className="input-label" style={{ display: "block", marginBottom: 12, fontSize: "0.9rem", color: "var(--cream-60)" }}>
              1. Select Target Company
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              {COMPANIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCompany(c.id)}
                  style={{
                    padding: "14px 10px",
                    background: selectedCompany === c.id ? `${c.color}22` : "rgba(255,255,255,0.03)",
                    border: selectedCompany === c.id ? `2px solid ${c.color}` : "1px solid var(--border)",
                    borderRadius: 12,
                    color: selectedCompany === c.id ? "#fff" : "var(--cream)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{c.logo}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Zone */}
          <div style={{ marginBottom: 28 }}>
            <label className="input-label" style={{ display: "block", marginBottom: 8, fontSize: "0.9rem", color: "var(--cream-60)" }}>
              2. Upload Resume PDF
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed var(--border)",
                borderRadius: 12,
                padding: "24px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: "rgba(255,255,255,0.01)",
                transition: "border-color 0.2s",
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = "var(--fire)"}
              onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              {file ? (
                <div>
                  <span style={{ fontSize: "1.8rem" }}>📄</span>
                  <p style={{ margin: "8px 0 4px", fontWeight: 600, color: "var(--cream)" }}>{file.name}</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--cream-60)" }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: "1.8rem" }}>📂</span>
                  <p style={{ margin: "8px 0 4px", fontWeight: 600, color: "var(--cream)" }}>Click to upload PDF</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--cream-60)" }}>PDF only, max 10 MB</p>
                </div>
              )}
            </div>
          </div>

          {error && <div style={{ color: "#ff4757", marginBottom: 16, fontSize: "0.88rem" }}>⚠️ {error}</div>}

          <button
            type="submit"
            className="fire-btn"
            disabled={loading || !file || !selectedCompany}
            style={{ width: "100%", padding: "16px", borderRadius: 12, fontSize: "1rem" }}
          >
            {loading ? statusMsg : `⚡ Compare Against ${activeComp ? activeComp.name : "Company"}`}
          </button>

          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--cream-60)", display: "block", marginBottom: "12px", fontWeight: 700 }}>
              OR SELECT A QUICK PREVIEW TEMPLATE:
            </span>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => loadTemplate("google", "Google_SWE_Resume.pdf")}
                style={{ padding: "8px 16px", borderRadius: "100px", fontSize: "0.8rem", cursor: "pointer" }}
              >
                🌐 Google vs Amazon
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => loadTemplate("microsoft", "Microsoft_Azure_Resume.pdf")}
                style={{ padding: "8px 16px", borderRadius: "100px", fontSize: "0.8rem", cursor: "pointer" }}
              >
                💻 Microsoft vs Meta
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => loadTemplate("adobe", "Adobe_Frontend_Resume.pdf")}
                style={{ padding: "8px 16px", borderRadius: "100px", fontSize: "0.8rem", cursor: "pointer" }}
              >
                🎨 Adobe vs Atlassian
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results View */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              maxWidth: 720,
              margin: "0 auto 60px",
              padding: 32,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 20, marginBottom: 24 }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--fire)", letterSpacing: "1px" }}>
                  FITNESS ASSESSMENT
                </span>
                <h2 style={{ margin: "4px 0 0", color: "var(--cream)" }}>
                  Alignment with {activeComp.name}
                </h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "2.4rem", fontWeight: 800, color: result.match_score >= 70 ? "var(--emerald)" : result.match_score >= 50 ? "var(--gold)" : "var(--fire)" }}>
                  {result.match_score}%
                </div>
                <span style={{ fontSize: "11px", color: "var(--cream-60)" }}>MATCH SCORE</span>
              </div>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: "1.05rem", color: "var(--cream)", marginBottom: 8 }}>📝 Executive Summary</h3>
              <p style={{ fontSize: "0.92rem", color: "var(--cream-60)", lineHeight: 1.6 }}>{result.summary}</p>
            </div>

            {/* Gaps Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
              <div>
                <h3 style={{ fontSize: "1.05rem", color: "var(--cream)", marginBottom: 12 }}>⚠️ Missing Skills</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.missing_skills.length > 0 ? (
                    result.missing_skills.map(s => (
                      <span key={s} style={{ background: "rgba(255,71,87,0.1)", color: "#ff4757", border: "1px solid rgba(255,71,87,0.2)", padding: "4px 10px", borderRadius: 8, fontSize: "0.78rem" }}>
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "var(--emerald)", fontSize: "0.85rem" }}>None! Excellent coverage.</span>
                  )}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", color: "var(--cream)", marginBottom: 12 }}>🔍 Missing Keywords</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.missing_keywords.length > 0 ? (
                    result.missing_keywords.map(k => (
                      <span key={k} style={{ background: "rgba(255,200,68,0.1)", color: "var(--gold)", border: "1px solid rgba(255,200,68,0.2)", padding: "4px 10px", borderRadius: 8, fontSize: "0.78rem" }}>
                        {k}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "var(--emerald)", fontSize: "0.85rem" }}>None! Recruiter keywords matching.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Projects to Build */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: "1.05rem", color: "var(--cream)", marginBottom: 14 }}>🛠️ Recommended Projects to Build</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {result.projects_to_build.map(p => (
                  <div key={p.title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
                    <h4 style={{ margin: "0 0 6px", color: "var(--cream)", fontSize: "0.95rem" }}>{p.title}</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--cream-60)", lineHeight: 1.5 }}>{p.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: "1.05rem", color: "var(--cream)", marginBottom: 12 }}>🎖️ Recommended Certifications</h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {result.certifications.map(c => (
                  <li key={c} style={{ fontSize: "0.88rem", color: "var(--cream-60)", marginBottom: 6 }}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Interview Prep */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: "1.05rem", color: "var(--cream)", marginBottom: 12 }}>💡 Interview Prep Steps</h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {result.interview_prep.map(ip => (
                  <li key={ip} style={{ fontSize: "0.88rem", color: "var(--cream-60)", marginBottom: 6 }}>{ip}</li>
                ))}
              </ul>
            </div>

            {/* Download PDF Actions */}
            <div style={{ display: "flex", gap: 12 }}>
              <button className="ra-btn primary" onClick={downloadReport} style={{ flex: 1, padding: "14px", borderRadius: 12 }}>
                ⬇️ Download PDF Report
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
