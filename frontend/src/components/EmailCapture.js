import React, { useState } from "react";
import { setUser } from "../utils/storage";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function EmailCapture({ onDone, source = "pre_analysis" }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.includes("@")) { setError("Enter a valid email"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/api/email-capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (data.success) {
        setUser({ email, user_id: data.user_id });
        onDone && onDone({ email, user_id: data.user_id });
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="email-capture-overlay">
      <div className="email-capture-modal">
        <div className="ec-emoji">📬</div>
        <h2>One quick step</h2>
        <p>Enter your email to get your analysis.<br/>No spam. Ever.</p>
        <form onSubmit={handleSubmit} className="ec-form">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "..." : "Get My Analysis →"}
          </button>
        </form>
        {error && <p className="ec-error">{error}</p>}
        <p className="ec-fine-print">We store your email to save your reports. Unsubscribe anytime.</p>
      </div>
    </div>
  );
}
