import React, { useState } from "react";
import { supabase, isSupabaseConfigured } from "../utils/supabase";
import { setUser } from "../utils/storage";
import { apiFetch } from "../utils/api";

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleGoogleLogin() {
    setError("");
    setMsg("");
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isSupabaseConfigured() && isLocalhost) {
      // Mock Google Login for development environment
      setLoading(true);
      setTimeout(() => {
        const mockUser = {
          email: "google.user@example.com",
          user_id: "usr_google_mock_123",
          tier: "free",
          credits: 5,
        };
        setUser(mockUser);
        setLoading(false);
        setMsg("✓ Mock Google Sign-In Successful!");
        window.dispatchEvent(new Event("mcs_user_changed"));
        setTimeout(onClose, 1500);
      }, 1000);
      return;
    }

    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (err) throw err;
    } catch (e) {
      setError(e.message || "Failed to initialize Google Login.");
    }
  }

  async function handleEmailLogin(e) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMsg("");

    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isSupabaseConfigured() || !isLocalhost) {
      try {
        const { error: err } = await supabase.auth.signInWithOtp({
          email: email.trim(),
        });
        if (err) throw err;
        setMsg("✓ Magic link sent! Check your inbox.");
      } catch (e) {
        setError(e.message || "Failed to send magic link.");
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback: Register email in local database
      try {
        const data = await apiFetch("/api/email-capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), source: "login_modal" }),
        });

        if (data.success && data.user_id) {
          const userObj = {
            email: email.trim(),
            user_id: data.user_id,
            tier: "free",
            credits: 5,
          };
          setUser(userObj);

          // Check for pending referral code to claim
          const pendingRef = localStorage.getItem("mcs_referral_code");
          if (pendingRef) {
            apiFetch("/api/referrals/claim", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: data.user_id, referral_code: pendingRef }),
            })
              .then(() => {
                localStorage.removeItem("mcs_referral_code");
              })
              .catch((err) => console.error("Referral claim error:", err));
          }

          setMsg("✓ Login Successful!");
          window.dispatchEvent(new Event("mcs_user_changed"));
          setTimeout(onClose, 1500);
        } else {
          setError(data.error || "Failed to sign in.");
        }
      } catch (err) {
        setError(err.message || "Failed to connect to backend.");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", zIndex: 1000 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 32, borderRadius: 16, maxWidth: 400, width: "90%", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--cream-60)", fontSize: "1.2rem", cursor: "pointer" }}>×</button>
        <h2 style={{ fontSize: "1.4rem", color: "#fff", marginBottom: 8, textAlign: "center" }}>🔐 Access Your Account</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--cream-60)", marginBottom: 24, textAlign: "center" }}>
          Sync your credits, dashboard analytics, and resume history across devices.
        </p>

        {msg && <p style={{ color: "var(--emerald)", fontSize: "0.9rem", textAlign: "center", marginBottom: 16 }}>{msg}</p>}
        {error && <p style={{ color: "#ff4757", fontSize: "0.85rem", textAlign: "center", marginBottom: 16 }}>⚠️ {error}</p>}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            background: "#fff",
            color: "#000",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 20,
            fontSize: "0.92rem",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.8-1.5 2.1l-.01.01v2.54h2.4c1.4-1.3 2.2-3.2 2.2-5.5z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-2.4-2.54c-.67.45-1.52.72-2.56.72-1.97 0-3.64-1.32-4.24-3.09H1.42v2.62C3.39 21.87 7.39 24 12 24z"/>
            <path fill="#FBBC05" d="M7.76 16.18a7.2 7.2 0 0 1 0-4.36V9.2H1.42a12 12 0 0 0 0 5.6l6.34-4.82z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.97 1.19 15.24 0 12 0 7.39 0 3.39 2.13 1.42 5.62l6.34 4.82c.6-1.77 2.27-3.09 4.24-3.09z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", margin: "20px 0", color: "var(--cream-60)", fontSize: "0.8rem" }}>
          <hr style={{ flex: 1, border: "0.5px solid var(--border)", marginRight: 10 }} />
          OR EMAIL
          <hr style={{ flex: 1, border: "0.5px solid var(--border)", marginLeft: 10 }} />
        </div>

        <form onSubmit={handleEmailLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.2)",
              border: "1px solid var(--border)",
              color: "#fff",
              marginBottom: 16,
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="fire-btn"
            disabled={loading}
            style={{ width: "100%", padding: "12px", borderRadius: 8, fontSize: "0.92rem" }}
          >
            {loading ? "Sending link..." : "Send Magic Sign-In Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
