import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../utils/api";
import { getVisitorId } from "../utils/storage";

const QUICK_PROMPTS = [
  "Why is my ATS score low?",
  "How can I improve my project bullet points?",
  "What skills should I add to impress recruiters?",
  "Suggest a good project to build for my profile.",
];

export default function ResumeChat({ analysisId, resumeText }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 I'm your AI Career Copilot. Ask me anything about your resume, suggestions, or how to target specific roles!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(text) {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;

    if (!text) setInput("");

    // Add user message to state
    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setLoading(true);

    try {
      const data = await apiFetch("/api/resume/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis_id: analysisId,
          resume_text: resumeText,
          question: messageText,
          user_id: getVisitorId(),
        }),
      });

      if (data.success && data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Sorry, I had trouble parsing the resume context. Please try again." },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Error: ${err.message || "Failed to reach AI Copilot server."}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: "32px",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(255, 107, 0, 0.05)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>💬</span>
        <div>
          <h3 style={{ margin: 0, fontSize: "0.95rem", color: "var(--cream)", fontWeight: 700 }}>
            AI Resume Copilot Chat
          </h3>
          <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--cream-60)" }}>
            Ask questions, ask for bullet rewrites, or request mock questions
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          padding: "20px",
          maxHeight: "350px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              background: msg.role === "user" ? "var(--fire)" : "rgba(255, 255, 255, 0.04)",
              color: msg.role === "user" ? "#fff" : "var(--cream)",
              padding: "12px 16px",
              borderRadius: msg.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
              fontSize: "0.88rem",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "rgba(255, 255, 255, 0.02)",
              padding: "12px 16px",
              borderRadius: "14px 14px 14px 2px",
              fontSize: "0.85rem",
              color: "var(--cream-60)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span className="pulsing-dot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--fire)" }} />
            <span>AI Copilot is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <div style={{ padding: "0 20px 14px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border)",
                color: "var(--cream-60)",
                padding: "8px 12px",
                borderRadius: "100px",
                fontSize: "0.78rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--fire)";
                e.currentTarget.style.color = "var(--cream)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--cream-60)";
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: "flex",
          borderTop: "1px solid var(--border)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question about your resume..."
          disabled={loading}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            padding: "16px 20px",
            color: "#fff",
            fontSize: "0.88rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            background: "none",
            border: "none",
            borderLeft: "1px solid var(--border)",
            color: input.trim() && !loading ? "var(--fire)" : "var(--cream-30)",
            padding: "0 24px",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: input.trim() && !loading ? "pointer" : "default",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
