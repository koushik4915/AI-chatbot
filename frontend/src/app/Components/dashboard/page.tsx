"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { IoIosSend } from "react-icons/io";
import { FiPaperclip, FiMic, FiX } from "react-icons/fi";
import HistorySection from "./historySection";
import { useChat } from "@/app/hooks/useChat";
import { useHistory } from "@/app/context/historyContext";
import { useAuth } from "@/app/context/authContext";
import { getToken } from "@/app/lib/authUtils";
import { useAutoScroll } from "@/app/hooks/useAutoScroll";

const LoadingSpinner = () => (
  <div className="animate-spin border-t-4 border-b-4 border-blue-600 rounded-full w-6 h-6 mx-auto"></div>
);

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function DashboardPage() {
  const { isLoggedin } = useAuth();
  const { showHistory } = useHistory();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) setToken(storedToken);
  }, []);

  const {
    input,
    setInput,
    messages,
    setMessages,
    handleKeyPress,
    sendMessage,
  } = useChat(token, selectedFile, setSelectedFile);

  useAutoScroll(messageEndRef, [messages]);

  const SpeechRecognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const recognition = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = "en-US";

      recognition.current.onstart = () => setIsListening(true);
      recognition.current.onend = () => setIsListening(false);
      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + " " + transcript);
      };
    }
  }, [SpeechRecognition]);

  const handleMicClick = () => {
    if (recognition.current) {
      recognition.current.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  if (!isLoggedin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-black">
        <h2 className="text-xl font-semibold">
          You need to log in to use the chat
        </h2>
        <button
          onClick={() => router.push("/Components/signin")}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen pt-16">
      {showHistory && (
        <div className="w-[260px] border-r border-gray-300 bg-white">
          <HistorySection setMessages={setMessages} />
        </div>
      )}

      <div className="flex flex-col flex-1 bg-[#f7f7f8]">
        <div
          className={`flex-1 overflow-y-auto px-4 py-2 ${messages.length === 0 ? "flex items-center justify-center" : ""
            }`}
        >
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center text-lg">
              Start the conversation...
            </p>
          ) : (
            <div className="w-full max-w-3xl mx-auto">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                    } py-2`}
                >
                  <div
                    className={`max-w-[90%] overflow-x-auto whitespace-pre-wrap break-words rounded-large px-4 py-3 text-sm shadow ${msg.sender === "user"
                      ? "bg-[#f7f7f8] text-black rounded-2xl rounded-br-none leading-snug"
                      : "bg-[#f7f7f8] text-black rounded-2xl rounded-bl-none leading-light"
                      }`}
                    style={{ wordBreak: "break-word" }}
                  >
                    {msg.sender === "bot" && msg.text === "" ? (
                      <LoadingSpinner />
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{msg.text || " "}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-300 p-4 bg-white">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">

            <label htmlFor="fileUpload" className="cursor-pointer text-2xl text-gray-700 hover:text-blue-600">
              <FiPaperclip />
            </label>
            <input
              type="file"
              id="fileUpload"
              className="hidden"
              accept=".jpeg,.jpg,.png,.webp,.pdf,.txt,image/jpeg,image/png,image/webp,application/pdf,text/plain"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500 truncate max-w-[150px]">{selectedFile.name}</p>
                <button onClick={removeFile} className="text-xs text-red-600">
                  <FiX />
                </button>
              </div>
            )}


            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="text-black flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />


            <button onClick={handleMicClick} className="text-xl text-gray-700 hover:text-blue-600">
              <FiMic />
            </button>


            <IoIosSend
              className={`text-3xl text-gray-900 cursor-pointer ${!input.trim()
                ? "opacity-50"
                : "text-blue-600 hover:text-blue-800"
                }`}
              onClick={sendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
