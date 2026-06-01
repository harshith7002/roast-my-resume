import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="page-wrap">
      <div className="static-wrap">
        <Link to="/" className="back-link">← Back</Link>
        <h1>PRIVACY POLICY</h1>
        <span className="static-date">Last updated: May 29, 2026</span>
        <h2>1. Information We Collect</h2>
        <p>macoostudy.info does not collect, store, or sell any personal information. Your resume is processed in memory and immediately discarded.</p>
        <h2>2. How We Use Information</h2>
        <p>Your resume text is sent to Groq AI solely to generate feedback. No data is retained after the session ends.</p>
        <h2>3. Cookies & Tracking</h2>
        <p>We use Google Analytics for traffic analysis and Google AdSense for ads. Both may use cookies.</p>
        <h2>4. Third Party Services</h2>
        <ul>
          <li>Google Analytics — traffic analysis</li>
          <li>Google AdSense — serving ads</li>
          <li>Groq AI — generating resume feedback</li>
        </ul>
        <h2>5. Data Security</h2>
        <p>Your resume is never stored or shared with any third party beyond the AI service used to generate feedback.</p>
        <h2>6. Contact</h2>
        <p>Questions? Reach us at macoostudy.info</p>
      </div>
    </div>
  );
}
