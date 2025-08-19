import { useState } from "react"

export default function App() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  const [input, setInput] = useState("")

  async function sendMessage() {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    })
    const data = await res.json()
    setMessages([...messages, { role: "user", content: input }, { role: "assistant", content: data.reply }])
    setInput("")
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="border rounded-lg p-2 h-96 overflow-y-auto bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-blue-600" : "text-green-600"}>
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          className="border rounded p-2 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="bg-blue-500 text-white rounded px-4" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  )
}
