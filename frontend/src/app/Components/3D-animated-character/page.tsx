"use client";
import { useCharcterGenerater } from "@/app/hooks/use3D-animated";
import { useStory } from "@/app/hooks/useStory";
import { getToken } from "@/app/lib/authUtils";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function CustomInteractionPage() {
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) setToken(storedToken);
  }, []);

  const {
    messages,
    sendMessage,
    story,
    setStory,
    loading,
  } = useCharcterGenerater(token);

  return (
    <div className="flex h-screen pt-16 bg-[#f7f7f8]">
      <div className="w-1/3 flex items-center justify-center border-r border-gray-300 bg-white">
        <div className="w-[70%] max-w-md flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Generate 3D-Animated Character</h1>

          <div className="flex items-center gap-4">
            <label className="w-30 text-gray-700 text-sm font-medium">Enter the Story</label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="flex-1 px-3 py-1 border rounded-md text-sm text-black"
            />
          </div>

          <button
            onClick={sendMessage}
            className="mt-4 px-4 py-1.5 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-900 self-center w-full"
          >
            {loading ? "Generating..." : "Generate 3D-Animated Character"}
          </button>
        </div>
      </div>
      <div className="w-2/3 p-8 overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Responses</h2>
        <div className="space-y-4">
          {messages
            .filter((msg) => msg.sender !== "user")
            .map((msg, idx) => (
              <div
                key={idx}
                className="p-4 rounded-md shadow-sm text-black bg-gray-100"
              >
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{msg.text || " "}</ReactMarkdown>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
