import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, Send } from "lucide-react";
import { VoiceMicIcon } from "./VoiceMicIcon";
import { chatWithAssistant, type AssistantTurn } from "../services/assistantService";
import type { ProductResponse } from "../services/productService";

interface SpeechRecognitionResult {
  transcript: string;
}
interface SpeechRecognitionResultItem {
  0: SpeechRecognitionResult;
  isFinal: boolean;
}
interface SpeechResultEvent extends Event {
  results: SpeechRecognitionResultItem[] & { length: number };
}
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechWin = Window & {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: ProductResponse[];
}

function formatPrice(p: ProductResponse): string {
  if (p.type === "Wanted") {
    if (p.minPrice != null && p.maxPrice != null) return `$${p.minPrice} - $${p.maxPrice}`;
    if (p.maxPrice != null) return `Up to $${p.maxPrice}`;
    return "Wanted";
  }
  if (p.type === "Swap") return "Swap";
  return p.price != null ? `$${p.price}` : "—";
}

export function AssistantWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [micHover, setMicHover] = useState(false);
  const [voiceSupported] = useState(
    () => "webkitSpeechRecognition" in window || "SpeechRecognition" in window
  );
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-grow the textarea so the full typed message stays visible.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    const SpeechRecognition =
      (window as SpeechWin).SpeechRecognition ?? (window as SpeechWin).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechResultEvent) => {
      const results = Array.from(event.results);
      setInput(results.map((r) => r[0].transcript).join(""));
    };
    recognition.onerror = (event: Event & { error: string }) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  function startListening() {
    if (voiceSupported && recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  function stopListening() {
    if (voiceSupported && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const history: AssistantTurn[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await chatWithAssistant({ message: text, history });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, products: res.products },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, ${message}. Please try again.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI assistant"
          className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 flex flex-col w-full h-full sm:w-[400px] sm:h-[600px] sm:max-h-[85vh] bg-white sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              className="p-1 rounded-md hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 text-sm mt-8 px-4">
                Ask me to find products. For example: "I want a smart mobile under $900".
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className="space-y-3">
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#7C3AED] text-white rounded-br-sm"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>

                {m.products && m.products.length > 0 && (
                  <div className="space-y-2">
                    {m.products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          navigate(`/product/${p.id}`);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-[#7C3AED]/40 transition-all text-left"
                      >
                        <img
                          src={p.coverImageUrl}
                          alt={p.title}
                          className="w-14 h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                          <p className="text-xs text-gray-500 truncate">{p.categoryName}</p>
                          <p className="text-sm font-semibold text-[#7C3AED]">{formatPrice(p)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-2xl rounded-bl-sm">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-200 bg-white">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Ask for a product..."}
              disabled={isLoading}
              className="flex-1 resize-none break-words px-3 py-2 text-sm leading-snug rounded-2xl border border-gray-300 max-h-[120px] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] disabled:opacity-60 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            />
            {voiceSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                onMouseEnter={() => setMicHover(true)}
                onMouseLeave={() => setMicHover(false)}
                disabled={isLoading}
                aria-label={isListening ? "Stop listening" : "Start voice search"}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#7C3AED]/10 disabled:opacity-50 disabled:pointer-events-none transition-colors flex-shrink-0"
              >
                <VoiceMicIcon
                  state={isListening ? "active" : micHover ? "hover" : "inactive"}
                  size={20}
                />
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#7C3AED] text-white hover:bg-[#6D28D9] disabled:opacity-50 disabled:pointer-events-none transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
