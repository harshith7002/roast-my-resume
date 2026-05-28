import React from 'react';

export default function About() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px', color: '#f0f0f5', fontFamily: 'sans-serif', lineHeight: 1.8 }}>
      <h1 style={{ color: '#ff4444' }}>About Roast My Resume 🔥</h1>

      <p>Roast My Resume is a free AI-powered tool that gives brutally honest resume feedback to CS freshers. No sugarcoating. No "add more action verbs." Just real, actionable feedback.</p>

      <h2>Why We Built This</h2>
      <p>Most resume feedback tools are either too expensive or too generic. We built this to give every CS student access to the kind of honest feedback that only a senior engineer friend would give you.</p>

      <h2>How It Works</h2>
      <ol>
        <li>Upload your resume as a PDF</li>
        <li>Our AI analyzes it in ~15 seconds</li>
        <li>Get a brutal roast + actionable feedback</li>
        <li>Improve your resume and get hired!</li>
      </ol>

      <h2>Privacy First</h2>
      <p>Your resume is never stored. It's processed in memory and immediately discarded after analysis. We take your privacy seriously.</p>

      <h2>Tech Stack</h2>
      <ul>
        <li>Frontend: React</li>
        <li>Backend: Flask (Python)</li>
        <li>AI: Groq AI (LLaMA)</li>
        <li>Hosting: Netlify + Render</li>
      </ul>

      <h2>Contact</h2>
      <p>Built with ❤️ for Indian CS freshers. Visit us at <a href="https://macoostudy.info" style={{ color: '#ff4444' }}>macoostudy.info</a></p>
    </div>
  );
}
