"use client";

import { useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ToolLogEntry = { name: string; input: unknown; result: unknown };

export default function KenAgentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastToolLog, setLastToolLog] = useState<ToolLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ken-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      setLastToolLog(data.toolLog ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "60px auto", padding: "0 24px", color: "#0a2540" }}>
      <a href="/" style={{ color: "#0a7a6d", fontSize: 14 }}>
        &larr; Back to demo
      </a>
      <h1 style={{ fontSize: 24 }}>Ken — unified agent (experimental)</h1>
      <p style={{ color: "#555", fontSize: 14 }}>
        Runs the Claude API directly in this app, with all 6 Delhivery + Gnani mock tools plus a real Gmail
        send_email tool available in one agent — testing whether a single combined Ken experience works, since Pine
        Labs&apos; platform currently blocks a multi-connector agent for the same tools, and its Gmail connector
        vault is separately broken.
      </p>
      <p style={{ fontSize: 14 }}>
        <a href="/api/auth/gmail" style={{ color: "#0a7a6d" }}>
          Connect Gmail mailbox &rarr;
        </a>
        <span style={{ color: "#999" }}> (one-time OAuth link; see docs/setup-gmail-bypass.md)</span>
      </p>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          marginTop: 24,
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#999", fontSize: 14 }}>
            Try: &ldquo;Get the renewal quote for policy POL-12345&rdquo; or &ldquo;What hospitals are in the
            network for POL-12345 in Mumbai?&rdquo;
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#0a7a6d" : "#f1f1f1",
              color: m.role === "user" ? "#fff" : "#0a2540",
              padding: "8px 12px",
              borderRadius: 8,
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
              fontSize: 14,
            }}
          >
            {m.content}
          </div>
        ))}
        {loading && <p style={{ color: "#999", fontSize: 14 }}>Ken is thinking…</p>}
        {error && <p style={{ color: "#c0392b", fontSize: 14 }}>Error: {error}</p>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: "#0a7a6d",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>

      {lastToolLog.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 14, color: "#777" }}>Tool calls (last turn)</h3>
          {lastToolLog.map((t, i) => (
            <pre
              key={i}
              style={{
                background: "#f8f8f8",
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
                overflowX: "auto",
                marginTop: 8,
              }}
            >
              {t.name}({JSON.stringify(t.input)})
              {"\n→ "}
              {JSON.stringify(t.result, null, 2)}
            </pre>
          ))}
        </div>
      )}
    </main>
  );
}
