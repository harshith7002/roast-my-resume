import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getUser, getVisitorId } from "../utils/storage";
import { apiFetch } from "../utils/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = getUser();

  useEffect(() => {
    const userId = user?.user_id || getVisitorId();
    apiFetch(`/api/dashboard?user_id=${encodeURIComponent(userId)}`, { timeout: 12000 })
      .then(d => { setData(d); setLoading(false); })
      .catch(requestError => { setError(requestError.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="page-wrap">
      <div className="dashboard-loading">Loading your stats...</div>
    </div>
  );

  const stats = [
    { label: "Resumes Analyzed", value: data?.total_analyses ?? 0, icon: "📄", color: "#5599ff" },
    { label: "Avg ATS Score", value: data?.avg_ats_score ? `${data.avg_ats_score}%` : "—", icon: "🎯", color: "#00d68f" },
    { label: "JD Matches Run", value: data?.jd_matches_count ?? 0, icon: "🎯", color: "#ffaa00" },
    { label: "Avg JD Match", value: data?.avg_jd_match ? `${data.avg_jd_match}%` : "—", icon: "💡", color: "#ff6b9d" },
  ];

  return (
    <div className="page-wrap">
    <div className="dashboard-page">
      <h1 className="dashboard-title">📊 Your Dashboard</h1>
      <p className="dashboard-email">{user?.email || "Progress saved on this device"}</p>
      {error && <div className="notice" role="status">Stats are temporarily unavailable. Your local history is still safe.</div>}

      <div className="stat-cards">
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {data?.ats_trend?.length > 1 && (
        <div className="chart-card">
          <h3>ATS Score Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.ats_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
              <XAxis dataKey="date" stroke="#999" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#999" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--cream)" }} />
              <Line type="monotone" dataKey="score" stroke="#5599ff" strokeWidth={2} dot={{ r: 4, fill: "#5599ff" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {(!data || data.total_analyses === 0) && (
        <div className="dashboard-cta">
          <p>No data yet. Run your first resume analysis or JD match to see stats here.</p>
        </div>
      )}
    </div>
    </div>
  );
}
