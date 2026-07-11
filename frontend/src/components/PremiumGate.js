import React from "react";
import { Link } from "react-router-dom";
import { getUser } from "../utils/storage";

export default function PremiumGate({ children, featureName = "this premium tool" }) {
  const user = getUser();
  const isPremium = user?.tier && user.tier !== "free";

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div style={{ position: "relative", minHeight: "65vh", borderRadius: "16px", overflow: "hidden" }}>
      {/* Blurred mock preview of the actual content */}
      <div style={{ filter: "blur(12px)", pointerEvents: "none", opacity: 0.25, userSelect: "none" }}>
        {children}
      </div>

      {/* Floating Glassmorphism Gate Card */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 10,
          background: "rgba(10, 10, 12, 0.4)",
          backdropFilter: "blur(4px)"
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(28, 30, 38, 0.8) 0%, rgba(18, 19, 26, 0.95) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 138, 61, 0.25)",
            borderRadius: "24px",
            padding: "48px 36px",
            maxWidth: "480px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 138, 61, 0.08)",
          }}
        >
          {/* Animated Glowing Lock Circle */}
          <div style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(255, 138, 61, 0.1)",
            border: "1px solid rgba(255, 138, 61, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 0 20px rgba(255, 138, 61, 0.15)"
          }}>
            <span style={{ fontSize: "1.6rem" }}>🔒</span>
          </div>

          <span
            style={{
              display: "inline-block",
              background: "rgba(255, 138, 61, 0.12)",
              color: "var(--fire)",
              fontSize: "0.72rem",
              fontWeight: 800,
              padding: "6px 14px",
              borderRadius: "100px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: 16,
              border: "1px solid rgba(255,138,61,0.2)"
            }}
          >
            PRO UPGRADE REQUIRED
          </span>
          <h2 style={{ fontSize: "1.75rem", color: "#fff", marginBottom: 12, fontWeight: 850, letterSpacing: "-0.5px" }}>
            Unlock {featureName}
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--cream-60)", lineHeight: 1.6, marginBottom: 32 }}>
            Supercharge your hiring conversion. Unlock AI cover letters, resume matches, mock interviews, and your personal AI career coach.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
            <Link
              to="/pricing"
              className="fire-btn"
              style={{
                display: "block",
                padding: "16px",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: 750,
                fontSize: "1rem",
                boxShadow: "0 8px 24px rgba(255, 138, 61, 0.35)",
                transition: "transform 0.2s"
              }}
            >
              Get Instant Access (₹299 Lifetime)
            </Link>
            <Link
              to="/"
              style={{
                color: "var(--cream-60)",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
                transition: "color 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.color = "#fff"}
              onMouseOut={(e) => e.currentTarget.style.color = "var(--cream-60)"}
            >
              ← Back to Free Resume Roast
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 20,
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--cream-60)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ color: "var(--emerald)" }}>✔</span> One-Time Payment
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ color: "var(--emerald)" }}>✔</span> Unlimited Usage
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
