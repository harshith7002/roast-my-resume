import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUser, getVisitorId, setUser } from "../utils/storage";
import { apiFetch } from "../utils/api";
import { openRazorpayCheckout } from "../utils/razorpay";

export default function PremiumFeatures() {
  const [user, setLocalUser] = useState(getUser());
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTier, setActiveTier] = useState(null); // 'pro' or 'pro_plus'
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
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

    // If no user email, prompt for it
    if (!user || !user.email) {
      setShowEmailPrompt(true);
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
          // Update local session
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

  async function handleRegisterEmail(e) {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim(), source: "payment_flow" }),
      });

      if (data.success && data.user_id) {
        const newUserObj = { email: emailInput.trim(), user_id: data.user_id, tier: "free", credits: 5 };
        setUser(newUserObj);
        setLocalUser(newUserObj);
        setShowEmailPrompt(false);
        // Continue to checkout
        setTimeout(() => {
          handleCheckout(activeTier);
        }, 100);
      } else {
        setError(data.error || "Failed to register email.");
      }
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-wrap premium-page" style={{ maxWidth: 840, margin: "0 auto", padding: "60px 20px" }}>
      <div className="premium-hero" style={{ marginBottom: 40, textAlign: "center" }}>
        <span className="coming-soon" style={{ color: "var(--fire)", background: "rgba(255, 107, 0, 0.1)" }}>
          UPGRADE TO COPILOT 2.0
        </span>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "16px 0 8px", color: "var(--cream)" }}>
          Land more interviews with AI
        </h1>
        <p style={{ color: "var(--cream-60)", maxWidth: 580, margin: "0 auto" }}>
          Get unlimited resume roasts, company-specific match scoring, resume rewriters, and instant interview preps.
        </p>
      </div>

      {success ? (
        <div style={{ textAlign: "center", padding: "40px", background: "rgba(0,214,143,0.05)", border: "1px solid var(--emerald)", borderRadius: 16, marginBottom: 40 }}>
          <span style={{ fontSize: "3rem" }}>🎉</span>
          <h2 style={{ color: "var(--emerald)", marginTop: 12 }}>Payment Successful!</h2>
          <p style={{ color: "var(--cream-60)", margin: "8px 0 20px" }}>
            You have been upgraded to the <strong>{activeTier === "pro_plus" ? "Pro+" : "Pro"}</strong> tier.
            Redirecting to your Dashboard...
          </p>
        </div>
      ) : (
        <>
          {showEmailPrompt ? (
            <div style={{ maxWidth: 450, margin: "0 auto 40px", padding: 24, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
              <h3 style={{ margin: "0 0 8px", color: "var(--cream)" }}>Enter Email to Continue</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--cream-60)", margin: "0 0 16px" }}>
                We'll sync your upgrade and history to this email.
              </p>
              <form onSubmit={handleRegisterEmail}>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border)",
                    color: "#fff",
                    marginBottom: 16,
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
                {error && <p style={{ color: "#ff4757", fontSize: "0.8rem", margin: "-8px 0 12px" }}>⚠️ {error}</p>}
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowEmailPrompt(false)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.05)",
                      border: "none",
                      color: "var(--cream-60)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="fire-btn"
                    style={{ flex: 1, padding: "10px", borderRadius: 8 }}
                  >
                    {loading ? "Registering..." : "Verify & Pay"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 40 }}>
              {/* Pro Plan */}
              <article
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h2 style={{ fontSize: "1.3rem", color: "var(--cream)", margin: "0 0 4px" }}>Pro Plan</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--cream-60)", margin: "0 0 20px" }}>For active job hunters</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--fire)" }}>₹99</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--cream-60)" }}>/ one-time</span>
                </div>
                <ul style={{ paddingLeft: 18, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <li style={{ fontSize: "0.88rem", color: "var(--cream)" }}>⚡ Unlimited Resume Roasts</li>
                  <li style={{ fontSize: "0.88rem", color: "var(--cream)" }}>📊 JD Matcher (Match %)</li>
                  <li style={{ fontSize: "0.88rem", color: "var(--cream)" }}>🛠️ AI Resume Bullet Rewriter</li>
                  <li style={{ fontSize: "0.88rem", color: "var(--cream)" }}>💡 Tailored Interview Questions</li>
                  <li style={{ fontSize: "0.88rem", color: "var(--cream)" }}>📄 Recruiter-Ready PDF Export</li>
                </ul>
                <button
                  type="button"
                  onClick={() => handleCheckout("pro")}
                  className="fire-btn"
                  style={{ width: "100%", padding: "12px", borderRadius: 10, marginTop: "auto" }}
                >
                  Upgrade to Pro
                </button>
              </article>

              {/* Pro+ Plan */}
              <article
                style={{
                  background: "var(--surface)",
                  border: "2px solid var(--fire)",
                  borderRadius: 16,
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: -12,
                    right: 24,
                    background: "var(--fire)",
                    color: "#fff",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: "100px",
                    letterSpacing: 0.5,
                  }}
                >
                  POPULAR
                </span>
                <h2 style={{ fontSize: "1.3rem", color: "var(--cream)", margin: "0 0 4px" }}>Pro+ Plan</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--cream-60)", margin: "0 0 20px" }}>For career acceleration</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--fire)" }}>₹199</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--cream-60)" }}>/ one-time</span>
                </div>
                <ul style={{ paddingLeft: 18, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <li style={{ fontSize: "0.88rem", color: "var(--cream)", fontWeight: 600 }}>🌟 Everything in Pro</li>
                  <li style={{ fontSize: "0.88rem", color: "var(--cream)" }}>✍️ Cover Letter Generator</li>
                  <li style={{ fontSize: "0.88rem", color: "var(--cream)" }}>📂 Manage Multiple Resumes</li>
                  <li style={{ fontSize: "0.88rem", color: "var(--cream)" }}>⚡ Priority AI Processing</li>
                  <li style={{ fontSize: "0.88rem", color: "var(--cream)" }}>🏢 Company-Specific Fit Prep</li>
                </ul>
                <button
                  type="button"
                  onClick={() => handleCheckout("pro_plus")}
                  className="fire-btn"
                  style={{ width: "100%", padding: "12px", borderRadius: 10, marginTop: "auto" }}
                >
                  Upgrade to Pro+
                </button>
              </article>
            </div>
          )}

          {error && <div style={{ color: "#ff4757", textAlign: "center", marginBottom: 20 }}>⚠️ {error}</div>}
        </>
      )}

      <div style={{ textAlign: "center" }}>
        <Link className="nav-link" to="/" style={{ textDecoration: "underline", fontSize: "0.9rem" }}>
          Analyze a resume free
        </Link>
      </div>
    </main>
  );
}
