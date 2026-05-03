import { useState } from "react";
import axios from "axios";

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/ai/chat",
        { message: input }
      );

      const aiMsg = { role: "ai", text: res.data.reply };

      setMessages((prev) => [...prev, aiMsg]);
      setInput("");
    } catch {
      alert("AI error");
    }

    setLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100">

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-md ${
              msg.role === "user"
                ? "bg-blue-500 text-white ml-auto"
                : "bg-white"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 flex gap-2 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="Ask anything..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AIAssistantPage;