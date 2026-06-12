import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getUser } from "../utils/storage";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!user?.user_id) { setLoading(false); return; }
    fetch(`${BACKEND}/api/dashboard?user_id=${user.user_id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!user) return (
    <div className="page-wrap">
      <div className="dashboard-empty">
      <div className="de-icon">📊</div>
      <h2>Your Dashboard</h2>
      <p>Upload a resume to start tracking your progress.</p>
      </div>
    </div>
  );

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
      <p className="dashboard-email">{user.email}</p>

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
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#666" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
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
