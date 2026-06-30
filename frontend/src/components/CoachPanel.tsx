import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, Task } from "../types";
import { MessageSquareCode, Send, Sparkles, AlertCircle, Trash2 } from "lucide-react";

interface CoachPanelProps {
  tasks: Task[];
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => void;
  onClearChat: () => void;
  isThinking: boolean;
  apiKey?: string;
}

const STARTER_PROMPTS = [
  "What should I do right now?",
  "I'm feeling completely overwhelmed, help me.",
  "Give me a tough-love push to start my high priority task.",
  "How can I better handle my overdue work?",
];

export default function CoachPanel({
  tasks,
  chatHistory,
  onSendMessage,
  onClearChat,
  isThinking,
}: CoachPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isThinking]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleStarterClick = (prompt: string) => {
    if (isThinking) return;
    onSendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] glass-card rounded-2xl overflow-hidden">
      {/* HEADER */}
      <div className="p-4 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-indigo/20 text-accent-indigo flex items-center justify-center">
            <MessageSquareCode size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">AI Tough-Love Coach</h2>
            <p className="text-[10px] text-accent-mint flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-mint animate-pulse" />
              <span>Analyzing {tasks.filter((t) => !t.completed).length} active tasks</span>
            </p>
          </div>
        </div>
        {chatHistory.length > 1 && (
          <button
            onClick={onClearChat}
            className="p-1.5 text-gray-400 hover:text-accent-red rounded-lg hover:bg-gray-800/80 transition"
            title="Clear Chat History"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* CHAT MESSAGES BODY */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-accent-indigo text-black rounded-tr-none font-medium"
                  : "bg-gray-800/80 text-gray-100 border border-gray-700/60 rounded-tl-none leading-relaxed"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="p-3 bg-gray-800/80 border border-gray-700/60 rounded-2xl rounded-tl-none flex items-center gap-1 text-gray-400">
              <Sparkles size={12} className="animate-pulse text-accent-indigo" />
              <span>Coach is typing</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce [animation-delay:0.2s]">.</span>
              <span className="animate-bounce [animation-delay:0.4s]">.</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* STARTER PROMPTS BAR */}
      {chatHistory.length <= 1 && !isThinking && (
        <div className="px-4 pb-1 space-y-2">
          <div className="flex items-center gap-1 text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
            <AlertCircle size={12} />
            <span>Struggling to make progress? Try a prompt:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-2">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleStarterClick(prompt)}
                className="p-2 text-left rounded-xl border border-gray-800 bg-gray-900/40 text-gray-300 hover:text-white hover:border-accent-indigo/40 hover:bg-accent-indigo/5 text-[11px] transition duration-150 truncate"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INPUT FORM */}
      <form onSubmit={handleSend} className="p-3 bg-gray-900/50 border-t border-gray-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Respond to your coach or ask for direction..."
          className="flex-1 px-4 py-2 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="p-2 rounded-xl bg-accent-indigo text-black hover:bg-accent-indigo/90 disabled:opacity-50 cursor-pointer flex items-center justify-center transition"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
