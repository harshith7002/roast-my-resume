import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="page-content">
      <div className="static-page">
        <Link to="/" className="back-link">← Back to Roast My Resume</Link>
        <h1>Privacy Policy</h1>
        <p className="static-date">Last updated: May 29, 2026</p>
        <h2>1. Information We Collect</h2>
        <p>macoostudy.info does not collect, store, or sell any personal information. When you upload a resume, it is processed in memory and immediately discarded. We never store your resume on our servers.</p>
        <h2>2. How We Use Information</h2>
        <p>Your resume text is sent to our AI service (Groq AI) solely to generate feedback. No data is retained after the session ends.</p>
        <h2>3. Cookies & Tracking</h2>
        <p>We use Google Analytics to understand site traffic. This may use cookies to track anonymous usage data. We also use Google AdSense which may use cookies to serve relevant ads.</p>
        <h2>4. Third Party Services</h2>
        <ul>
          <li>Google Analytics — for traffic analysis</li>
          <li>Google AdSense — for serving ads</li>
          <li>Groq AI — for generating resume feedback</li>
        </ul>
        <h2>5. Data Security</h2>
        <p>Your resume is never stored, logged, or shared with any third party other than the AI service used to generate feedback.</p>
        <h2>6. Children's Privacy</h2>
        <p>Our service is not directed to children under 13.</p>
        <h2>7. Contact</h2>
        <p>For any questions, contact us at macoostudy.info</p>
      </div>
    </div>
  );
}
