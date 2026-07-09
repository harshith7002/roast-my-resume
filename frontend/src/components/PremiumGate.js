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
    <div style={{ position: "relative", minHeight: "65vh" }}>
      {/* Blurred mock preview of the actual content */}
      <div style={{ filter: "blur(8px)", pointerEvents: "none", opacity: 0.3, userSelect: "none" }}>
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
        }}
      >
        <div
          style={{
            background: "rgba(10, 10, 12, 0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 107, 0, 0.25)",
            borderRadius: "24px",
            padding: "40px 32px",
            maxWidth: "460px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), 0 0 50px rgba(255, 107, 0, 0.05)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: "rgba(255, 107, 0, 0.1)",
              color: "var(--fire)",
              fontSize: "0.75rem",
              fontWeight: 800,
              padding: "6px 14px",
              borderRadius: "100px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            🔒 PRO FEATURES UNLOCKED
          </span>
          <h2 style={{ fontSize: "1.8rem", color: "#fff", marginBottom: 12, fontWeight: 800 }}>
            Unlock {featureName}
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--cream-60)", lineHeight: 1.6, marginBottom: 28 }}>
            Get unlimited access to JD matching, cover letter writing, targeted company reviews, custom interview prepping, and your AI career chat coach.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <Link
              to="/pricing"
              className="fire-btn"
              style={{
                display: "block",
                padding: "16px",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "1rem",
                boxShadow: "0 4px 20px rgba(255, 107, 0, 0.3)",
              }}
            >
              Get Instant Access (₹299 Lifetime)
            </Link>
            <Link
              to="/"
              style={{
                color: "var(--cream-60)",
                textDecoration: "underline",
                fontSize: "0.85rem",
              }}
            >
              Back to Free Resume Roast
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              borderTop: "1px solid var(--border)",
              paddingTop: 20,
              fontSize: "0.8rem",
              color: "var(--cream-60)",
            }}
          >
            <div>⚡ One-Time Payment</div>
            <div>⚡ Unlimited Usage</div>
          </div>
        </div>
      </div>
    </div>
  );
}
