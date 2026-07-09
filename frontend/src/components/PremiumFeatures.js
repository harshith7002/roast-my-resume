import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUser, getVisitorId, setUser } from "../utils/storage";
import { apiFetch } from "../utils/api";
import { openRazorpayCheckout } from "../utils/razorpay";
import LoginModal from "./LoginModal";

export default function PremiumFeatures() {
  const [user, setLocalUser] = useState(getUser());
  const [loading, setLoading] = useState(false);
  const [activeTier, setActiveTier] = useState(null); // 'pro' or 'pro_plus'
  const [loginOpen, setLoginOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Sync state with storage
  useEffect(() => {
    const handleUserChange = () => setLocalUser(getUser());
    window.addEventListener("mcs_user_changed", handleUserChange);
    return () => window.removeEventListener("mcs_user_changed", handleUserChange);
  }, []);

  async function handleCheckout(tier) {
    setError("");
    setActiveTier(tier);

    // If no user is logged in, open the standard login modal
    if (!user || !user.email) {
      setLoginOpen(true);
      return;
    }

    try {
      setLoading(true);
      await openRazorpayCheckout({
        tier,
        userId: user.user_id || getVisitorId(),
        email: user.email,
        onPaymentSuccess: (res) => {
          setSuccess(true);
          setUser({
            ...user,
            tier: res.tier,
            credits: res.credits,
          });
          setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
        },
        onPaymentError: (err) => {
          setError(err.message || "Payment process interrupted.");
        },
      });
    } catch (err) {
      setError(err.message || "Could not launch checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-wrap premium-page" style={{ maxWidth: 900, margin: "0 auto", padding: "60px 20px" }}>
      <div className="premium-hero" style={{ marginBottom: 48, textAlign: "center" }}>
        <span className="coming-soon" style={{ color: "var(--fire)", background: "rgba(255, 138, 61, 0.1)", padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700 }}>
          TRANSPARENT PRICING
        </span>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "16px 0 8px", color: "#fff", fontWeight: 800 }}>
          SaaS Pricing Plans
        </h1>
        <p style={{ color: "var(--cream-60)", maxWidth: 580, margin: "0 auto", fontSize: "0.95rem" }}>
          Boost your hiring conversion rate. Choose a plan that matches your goals.
        </p>
      </div>

      {success ? (
        <div style={{ textAlign: "center", padding: "40px", background: "rgba(0,214,143,0.05)", border: "1px solid var(--emerald)", borderRadius: 16, marginBottom: 40 }}>
          <span style={{ fontSize: "3rem" }}>🎉</span>
          <h2 style={{ color: "var(--emerald)", marginTop: 12 }}>Payment Successful!</h2>
          <p style={{ color: "var(--cream-60)", margin: "8px 0 20px" }}>
            You have been upgraded. Redirecting to your Dashboard...
          </p>
        </div>
      ) : (
        <>
          <div>
              {/* Plans Overview Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                {/* Free Plan */}
                <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", padding: "28px 24px", borderRadius: "12px", display: "flex", flexDirection: "column" }}>
                  <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, marginBottom: "4px" }}>Free</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--cream-60)", marginBottom: "16px" }}>Basic analysis</p>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", marginBottom: "20px" }}>₹0</div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "0 0 24px", fontSize: "0.82rem", color: "var(--cream-60)", textAlign: "left" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>ATS Score</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>AI Resume Roast (1/day)</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.35 }}><span style={{ color: "var(--fire)" }}>✕</span> <span>Company Match</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.35 }}><span style={{ color: "var(--fire)" }}>✕</span> <span>Download PDF</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.35 }}><span style={{ color: "var(--fire)" }}>✕</span> <span>Cover Letter</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.35 }}><span style={{ color: "var(--fire)" }}>✕</span> <span>Interview Questions</span></div>
                  </div>

                  <button onClick={() => navigate("/")} className="btn-secondary" style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", color: "#fff", cursor: "pointer", marginTop: "auto" }}>
                    Get Started
                  </button>
                </div>

                {/* Pro Lite Plan */}
                <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", padding: "28px 24px", borderRadius: "12px", display: "flex", flexDirection: "column" }}>
                  <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, marginBottom: "4px" }}>Pro Lite</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--cream-60)", marginBottom: "16px" }}>Detailed breakdowns</p>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", marginBottom: "20px" }}>₹49</div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "0 0 24px", fontSize: "0.82rem", color: "var(--cream-60)", textAlign: "left" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>ATS Score</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>AI Resume Roast (Unlimited)</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>Company Match</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>Download PDF</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.35 }}><span style={{ color: "var(--fire)" }}>✕</span> <span>Cover Letter</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.35 }}><span style={{ color: "var(--fire)" }}>✕</span> <span>Interview Questions</span></div>
                  </div>

                  <button onClick={() => handleCheckout("pro")} className="btn-secondary" style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", color: "#fff", cursor: "pointer", marginTop: "auto" }}>
                    Buy Pro Lite
                  </button>
                </div>

                {/* Lifetime Plan */}
                <div style={{ background: "var(--bg3)", border: "2px solid var(--fire)", padding: "28px 24px", borderRadius: "12px", display: "flex", flexDirection: "column", position: "relative", transform: "scale(1.02)", boxShadow: "0 15px 40px rgba(255, 138, 61, 0.12)" }}>
                  <span style={{ position: "absolute", top: "-12px", right: "20px", background: "var(--fire)", color: "#fff", fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px", borderRadius: "100px" }}>LIFETIME</span>
                  <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, marginBottom: "4px" }}>Pro Lifetime</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--cream-60)", marginBottom: "16px" }}>Full career prep suite</p>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--fire)", marginBottom: "20px" }}>₹299</div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "0 0 24px", fontSize: "0.82rem", color: "var(--cream-60)", textAlign: "left" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--cream)" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>ATS Score</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--cream)" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>AI Resume Roast (Unlimited)</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--cream)" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>Company Match</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--cream)" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>Download PDF</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--cream)" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>Cover Letter</span></div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--cream)" }}><span style={{ color: "var(--emerald)" }}>✔</span> <span>Interview Questions</span></div>
                  </div>

                  <button onClick={() => handleCheckout("pro_plus")} className="fire-btn" style={{ width: "100%", padding: "10px", borderRadius: "8px", cursor: "pointer", marginTop: "auto" }}>
                    Buy Lifetime
                  </button>
                </div>
              </div>

              {/* Comparison Table */}
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", padding: "16px" }}>
                <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", marginBottom: "16px", paddingLeft: "8px" }}>Compare Features</h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--cream-60)" }}>
                      <th style={{ padding: "12px 8px" }}>Feature</th>
                      <th style={{ padding: "12px 8px" }}>Free</th>
                      <th style={{ padding: "12px 8px" }}>Pro Lite</th>
                      <th style={{ padding: "12px 8px", color: "var(--fire)", fontWeight: 700 }}>Lifetime</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", color: "#fff" }}>Resume Roasting</td>
                      <td style={{ padding: "12px 8px" }}>✓ (1/day)</td>
                      <td style={{ padding: "12px 8px" }}>✓ (Unlimited)</td>
                      <td style={{ padding: "12px 8px", fontWeight: 700 }}>✓ (Unlimited)</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", color: "#fff" }}>ATS Score Gauge</td>
                      <td style={{ padding: "12px 8px" }}>✓</td>
                      <td style={{ padding: "12px 8px" }}>✓</td>
                      <td style={{ padding: "12px 8px", fontWeight: 700 }}>✓</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", color: "#fff" }}>Detailed ATS Breakdown</td>
                      <td style={{ padding: "12px 8px", color: "var(--cream-30)" }}>✕</td>
                      <td style={{ padding: "12px 8px" }}>✓</td>
                      <td style={{ padding: "12px 8px", fontWeight: 700 }}>✓</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", color: "#fff" }}>Target Company Fit Alignment</td>
                      <td style={{ padding: "12px 8px", color: "var(--cream-30)" }}>✕</td>
                      <td style={{ padding: "12px 8px" }}>✓</td>
                      <td style={{ padding: "12px 8px", fontWeight: 700 }}>✓</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", color: "#fff" }}>Download PDF Export</td>
                      <td style={{ padding: "12px 8px", color: "var(--cream-30)" }}>✕</td>
                      <td style={{ padding: "12px 8px" }}>✓</td>
                      <td style={{ padding: "12px 8px", fontWeight: 700 }}>✓</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", color: "#fff" }}>Google XYZ Rewriter</td>
                      <td style={{ padding: "12px 8px", color: "var(--cream-30)" }}>✕</td>
                      <td style={{ padding: "12px 8px", color: "var(--cream-30)" }}>✕</td>
                      <td style={{ padding: "12px 8px", fontWeight: 700 }}>✓</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", color: "#fff" }}>Job Description Matcher</td>
                      <td style={{ padding: "12px 8px", color: "var(--cream-30)" }}>✕</td>
                      <td style={{ padding: "12px 8px", color: "var(--cream-30)" }}>✕</td>
                      <td style={{ padding: "12px 8px", fontWeight: 700 }}>✓</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", color: "#fff" }}>Cover Letter Generator</td>
                      <td style={{ padding: "12px 8px", color: "var(--cream-30)" }}>✕</td>
                      <td style={{ padding: "12px 8px", color: "var(--cream-30)" }}>✕</td>
                      <td style={{ padding: "12px 8px", fontWeight: 700 }}>✓</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "12px 8px", color: "#fff" }}>Interview Prep Q&A Coach</td>
                      <td style={{ padding: "12px 8px", color: "var(--cream-30)" }}>✕</td>
                      <td style={{ padding: "12px 8px", color: "var(--cream-30)" }}>✕</td>
                      <td style={{ padding: "12px 8px", fontWeight: 700 }}>✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          {error && <div style={{ color: "#ff4757", textAlign: "center", margin: "20px 0" }}>⚠️ {error}</div>}
          <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
        </>
      )}

      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <Link className="nav-link" to="/" style={{ textDecoration: "underline", fontSize: "0.9rem", color: "var(--cream-60)" }}>
          Back to analysis
        </Link>
      </div>
    </main>
  );
}
