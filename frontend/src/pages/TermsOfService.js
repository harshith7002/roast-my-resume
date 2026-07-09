import React from "react";

export default function TermsOfService() {
  return (
    <main className="page-wrap" style={{ maxWidth: "800px", margin: "40px auto", padding: "40px 20px", color: "var(--cream-60)", lineHeight: 1.6 }}>
      <h1 style={{ color: "#fff", marginBottom: "24px", fontWeight: 800 }}>Terms of Service</h1>
      <p style={{ marginBottom: "16px" }}>Welcome to Macoostudy. By using our website and services, you agree to comply with the following terms:</p>
      
      <h3 style={{ color: "#fff", marginTop: "24px", marginBottom: "8px", fontWeight: 700 }}>1. In-Memory Processing</h3>
      <p style={{ marginBottom: "16px" }}>Our platform is designed for privacy. Resume files and text content are parsed in-memory only to perform real-time ATS analysis and career coaching. We do not persist, log, or resell candidate resumes or PDFs.</p>
      
      <h3 style={{ color: "#fff", marginTop: "24px", marginBottom: "8px", fontWeight: 700 }}>2. Pricing and Payments</h3>
      <p style={{ marginBottom: "16px" }}>All purchases made for Pro Lite (₹49) and Pro Lifetime (₹299) options are processed securely via Razorpay. We offer a 7-day money-back guarantee if you are unsatisfied with the quality of the premium upgrades.</p>
      
      <h3 style={{ color: "#fff", marginTop: "24px", marginBottom: "8px", fontWeight: 700 }}>3. Disclaimer of Liability</h3>
      <p style={{ marginBottom: "16px" }}> Macoostudy provides AI-powered feedback and suggestions for career preparation. While we aim to optimize screening chances, we do not guarantee employment, interviews, or hiring placement.</p>
      
      <h3 style={{ color: "#fff", marginTop: "24px", marginBottom: "8px", fontWeight: 700 }}>4. Termination of Use</h3>
      <p>We reserve the right to suspend or block usage if any fraudulent activity, bot usage, or abuse of the AI generation APIs is detected.</p>
    </main>
  );
}
