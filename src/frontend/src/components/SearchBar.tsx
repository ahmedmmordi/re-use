import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { VoiceMicIcon } from "./VoiceMicIcon";
import { useNavigate } from "react-router-dom";

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

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(
    () => "webkitSpeechRecognition" in window || "SpeechRecognition" in window
  );
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [micHover, setMicHover] = useState(false);

  // Check for voice support on mount
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as SpeechWin).SpeechRecognition ?? (window as SpeechWin).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: SpeechResultEvent) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join("");

          setQuery(transcript);
        };

        recognitionRef.current.onerror = (event: Event & { error: string }) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setQuery(searchQuery);
    }
  };

  const startListening = () => {
    if (voiceSupported && recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (voiceSupported && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="relative flex-1 max-w-[600px]">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(query);
            }
          }}
          placeholder={isListening ? "" : "Search for products, categories, or sellers..."}
          className={`w-full bg-white text-gray-900 placeholder-gray-400 px-4 py-2.5 pr-24 rounded-lg border transition-all ${
            isListening
              ? "border-[#4B0082] ring-2 ring-[#4B0082]/30"
              : "border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
          }`}
        />

        {/* Listening Indicator */}
        {isListening && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="flex gap-1">
              <div
                className="w-1 h-3 bg-[#4B0082] rounded-full animate-pulse"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1 h-4 bg-[#4B0082] rounded-full animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1 h-3 bg-[#4B0082] rounded-full animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-xs text-[#4B0082] font-medium">Listening...</span>
          </div>
        )}

        {/* Search Actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Clear"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button
            onClick={() => handleSearch(query)}
            className="p-1.5 hover:bg-[#4B0082]/10 rounded transition-colors group"
            title="Search"
          >
            <Search className="w-5 h-5 text-gray-600 group-hover:text-[#4B0082]" />
          </button>
          {voiceSupported && (
            <button
              onClick={isListening ? stopListening : startListening}
              className="p-1.5 hover:bg-[#4B0082]/10 rounded transition-colors"
              title={isListening ? "Stop listening" : "Start listening"}
              onMouseEnter={() => setMicHover(true)}
              onMouseLeave={() => setMicHover(false)}
            >
              <VoiceMicIcon
                state={isListening ? "active" : micHover ? "hover" : "inactive"}
                size={20}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
