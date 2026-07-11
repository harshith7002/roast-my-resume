import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../utils/api";
import { getVisitorId } from "../utils/storage";

const QUICK_PROMPTS = [
  "How do I improve my experience bullet points?",
  "How do I prepare for Google?",
  "What projects should I build next?",
  "How do I tailor my resume for Cisco?",
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
  const textareaRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Adjust textarea height dynamically based on input length
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        marginTop: "40px",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 24px",
          borderBottom: "1px solid var(--border)",
          background: "linear-gradient(90deg, rgba(255, 107, 0, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "rgba(255, 107, 0, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255, 107, 0, 0.2)"
        }}>
          <span style={{ fontSize: "1.1rem" }}>🤖</span>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#fff", fontWeight: 750 }}>
            AI Resume Copilot Chat
          </h3>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--cream-60)", marginTop: "2px" }}>
            Ask questions, request bullet rewrites, or request mock interview practice
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          padding: "24px",
          maxHeight: "380px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          background: "rgba(0,0,0,0.1)"
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              width: "100%"
            }}
          >
            <div style={{ display: "flex", gap: "10px", maxWidth: "80%", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-end" }}>
              {/* Profile Avatar indicator */}
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: msg.role === "user" ? "rgba(255,255,255,0.08)" : "rgba(255, 107, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
                border: msg.role === "user" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,107,0,0.25)"
              }}>
                {msg.role === "user" ? "YO" : "AI"}
              </div>
              <div
                style={{
                  background: msg.role === "user" ? "linear-gradient(135deg, var(--fire) 0%, var(--fire-dark) 100%)" : "rgba(255, 255, 255, 0.03)",
                  border: msg.role === "user" ? "none" : "1px solid var(--border)",
                  color: msg.role === "user" ? "#fff" : "var(--cream)",
                  padding: "12px 18px",
                  borderRadius: msg.role === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                  fontSize: "0.88rem",
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                }}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(255, 107, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                border: "1px solid rgba(255,107,0,0.25)"
              }}>
                AI
              </div>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border)",
                  padding: "12px 18px",
                  borderRadius: "16px 16px 16px 2px",
                  fontSize: "0.88rem",
                  color: "var(--cream-60)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                }}
              >
                <span className="pulsing-dot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--fire)" }} />
                <span>AI Copilot is composing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <div style={{ padding: "16px 24px", display: "flex", flexWrap: "wrap", gap: "10px", background: "rgba(0,0,0,0.05)" }}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border)",
                color: "var(--cream-60)",
                padding: "8px 14px",
                borderRadius: "100px",
                fontSize: "0.78rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--fire)";
                e.currentTarget.style.color = "var(--cream)";
                e.currentTarget.style.background = "rgba(255,138,61,0.05)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--cream-60)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid var(--border)",
          background: "rgba(0,0,0,0.2)",
          alignItems: "flex-end",
          padding: "6px 12px"
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question, ask to rewrite a section..."
          disabled={loading}
          rows={1}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            padding: "12px 10px",
            color: "#fff",
            fontSize: "0.88rem",
            outline: "none",
            resize: "none",
            maxHeight: "140px",
            fontFamily: "inherit",
            lineHeight: "1.4"
          }}
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          style={{
            background: input.trim() && !loading ? "var(--fire)" : "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            color: input.trim() && !loading ? "#fff" : "var(--cream-30)",
            padding: "8px 18px",
            fontSize: "0.85rem",
            fontWeight: 700,
            borderRadius: "8px",
            cursor: input.trim() && !loading ? "pointer" : "default",
            marginBottom: "6px",
            transition: "all 0.25s",
            boxShadow: input.trim() && !loading ? "0 4px 12px rgba(255,138,61,0.25)" : "none"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
