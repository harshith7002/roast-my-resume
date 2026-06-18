import React from "react";
import { Link } from "react-router-dom";
import { PREMIUM_FEATURES } from "../config/premiumFeatures";

export default function PremiumFeatures() {
  return (
    <main className="page-wrap premium-page">
      <div className="premium-hero">
        <span className="section-kicker">COMING NEXT</span>
        <h1>Build a stronger application, not just a better score.</h1>
        <p>Advanced career tools are in development. Your current analysis and history remain free.</p>
      </div>
      <div className="premium-grid">
        {PREMIUM_FEATURES.map(feature => (
          <article className="premium-card" key={feature.id}>
            <span className="coming-soon">Coming soon</span>
            <h2>{feature.name}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
      <Link className="btn-primary premium-back" to="/">Analyze a resume free</Link>
    </main>
  );
}
