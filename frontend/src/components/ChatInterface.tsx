"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import axios from "axios";
import Toast from "@/components/ui/Toast";

export default function ChatInterface({ datasets = [] }: { datasets?: any[] }) {
  const [messages, setMessages] = useState<{role: "user" | "bot", text: string}[]>([
    { role: "bot", text: "Hello! I'm your Data Agent. Upload some CSV files, and ask me anything about the data." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [toastMessage, setToastMessage] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize session ID and load history from Checkpointer
  useEffect(() => {
    let currentSession = localStorage.getItem("chat_session_id");
    if (!currentSession) {
      currentSession = `session_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("chat_session_id", currentSession);
    }
    setSessionId(currentSession);

    const loadHistory = async (sid: string) => {
      try {
        const res = await axios.get(`http://localhost:8000/api/chat/history/${sid}`);
        if (res.data.messages && res.data.messages.length > 0) {
            setMessages(res.data.messages);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    
    if (currentSession) {
        loadHistory(currentSession);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-expand logic based on scrollHeight
    if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        const scrollH = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${scrollH}px`;
        
        // Approx 4 lines max before scrolling (96px - 100px)
        setShowScrollbar(scrollH > 100);
    }
  };

  const resetTextareaHeight = () => {
      if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          setShowScrollbar(false);
      }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    resetTextareaHeight();
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/chat/", { 
          message: userMessage,
          session_id: sessionId,
          data_schemas: datasets
      });
      setMessages(prev => [...prev, { role: "bot", text: res.data.response }]);
    } catch (e) {
      console.error(e);
      setToastMessage("Network connection failed or server is unavailable.");
      setTimeout(() => setToastMessage(""), 4000);
      setMessages(prev => [...prev, { role: "bot", text: "I encountered an error trying to process your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-zinc-800 border-l">
      <div className="p-5 border-b border-zinc-800 shrink-0">
        <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
          <Bot className="w-5 h-5 text-violet-500" />
          AI Analyst
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-violet-600" : "bg-zinc-800"}`}>
              {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-violet-400" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-200"}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 flex-row">
             <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 shrink-0">
                <Bot className="w-4 h-4 text-violet-400" />
             </div>
             <div className="bg-zinc-800 rounded-2xl px-4 py-3 flex items-center">
                 <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 shrink-0">
        <div className="relative flex items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your data..."
            className={`w-full bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-2xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none min-h-[48px] max-h-[140px] block ${showScrollbar ? 'overflow-y-auto' : 'overflow-hidden'}`}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 h-8 w-8 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 rounded-full flex items-center justify-center transition-colors text-white"
          >
            <Send className="w-4 h-4 ml-[-2px]" />
          </button>
        </div>
      </div>

      <Toast message={toastMessage} type="error" position="top" />
    </div>
  );
}
