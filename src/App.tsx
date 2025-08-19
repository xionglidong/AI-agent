import React, { useState } from "react";
import { createRoot } from "react-dom/client";

function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  async function handleAsk() {
    const res = await fetch(`/api?q=${encodeURIComponent(input)}`);
    const data = await res.json();
    setResponse(JSON.stringify(data, null, 2));
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🤖 Mastra Agent on Cloudflare Pages</h1>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入你的问题"
        style={{ padding: "0.5rem", width: "300px" }}
      />
      <button onClick={handleAsk} style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>
        提问
      </button>
      <pre style={{ marginTop: "2rem", whiteSpace: "pre-wrap" }}>{response}</pre>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
