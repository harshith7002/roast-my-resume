import React, { useEffect, useState } from "react";
import { getUser, getAnalysisCache } from "../utils/storage";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function ResumeHistory() {
  const [analyses, setAnalyses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const user = getUser();

  useEffect(() => {
    if (!user?.user_id) {
      // fall back to local cache
      setAnalyses(getAnalysisCache());
      setLoading(false);
      return;
    }
    fetch(`${BACKEND}/api/history?user_id=${user.user_id}&search=${encodeURIComponent(search)}`)
      .then(r => r.json())
      .then(d => { setAnalyses(d.analyses || []); setLoading(false); })
      .catch(() => { setAnalyses(getAnalysisCache()); setLoading(false); });
  }, [search]);

  function getTypeEmoji(type) {
    return type === "jd_match" ? "🎯" : type === "roast" ? "🔥" : "📄";
  }

  function getScoreColor(score) {
    if (!score) return "#666";
    if (score >= 70) return "#00d68f";
    if (score >= 50) return "#ffaa00";
    return "#ff4757";
  }

  const filtered = analyses.filter(a =>
    !search ||
    (a.filename || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.verdict || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return (
    <div className="page-wrap">
      <div className="history-empty">
      <div className="he-icon">📂</div>
      <h2>Resume History</h2>
      <p>Your past analyses will appear here after you enter your email.</p>
      </div>
    </div>
  );

  return (
    <div className="page-wrap">
    <div className="history-page">
      <div className="history-header">
        <h1>📂 Resume History</h1>
        <div className="history-search">
          <input
            type="text"
            placeholder="🔍 Search by filename or verdict..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && <div className="history-loading">Loading history...</div>}

      {!loading && filtered.length === 0 && (
        <div className="history-empty-state">
          <p>No analyses found{search ? " for that search" : " yet"}.</p>
        </div>
      )}

      <div className="history-list">
        {filtered.map((a, i) => {
          const parsed = (() => { try { return JSON.parse(a.result_json || "{}"); } catch { return a.result || {}; } })();
          const isExpanded = expanded === i;
          return (
            <div key={i} className={`history-item ${isExpanded ? "expanded" : ""}`}>
              <div className="hi-header" onClick={() => setExpanded(isExpanded ? null : i)}>
                <div className="hi-left">
                  <span className="hi-type">{getTypeEmoji(a.type)}</span>
                  <div>
                    <div className="hi-filename">{a.filename || "Resume"}</div>
                    <div className="hi-date">{(a.created_at || a.cached_at || "").slice(0, 16).replace("T", " ")}</div>
                  </div>
                </div>
                <div className="hi-right">
                  {a.ats_score != null && (
                    <span className="hi-score" style={{ color: getScoreColor(a.ats_score) }}>
                      ATS {a.ats_score}%
                    </span>
                  )}
                  {a.verdict && <span className="hi-verdict">{a.verdict}</span>}
                  <span className="hi-chevron">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="hi-body">
                  {a.type === "jd_match" && parsed.summary && (
                    <div className="hi-detail">
                      <strong>Match: {parsed.match_score}%</strong>
                      <p>{parsed.summary}</p>
                      {parsed.missing_skills?.length > 0 && (
                        <div>
                          <strong>Missing:</strong>{" "}
                          {parsed.missing_skills.slice(0, 5).map(s => s.skill).join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                  {a.type === "roast" && parsed.roast && (
                    <pre className="hi-roast-text">{parsed.roast.slice(0, 600)}...</pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}
