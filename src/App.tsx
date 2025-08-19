import React, { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  async function sendMessage() {
    if (!input.trim()) return;

    // 添加用户消息
    setMessages([...messages, { role: "user", text: input }]);

    // GraphQL 请求
    const query = `{ ask(query: "${input}") }`;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();

    // 添加 AI 回复
    setMessages((prev) => [...prev, { role: "assistant", text: json.data.ask }]);
    setInput("");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white shadow-md rounded-xl p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg ${
                m.role === "user"
                  ? "bg-blue-500 text-white self-end text-right"
                  : "bg-gray-200 text-black self-start"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 border rounded-lg p-2"
            placeholder="输入问题，例如: 帮我查东京天气并翻译成英文"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 rounded-lg"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
