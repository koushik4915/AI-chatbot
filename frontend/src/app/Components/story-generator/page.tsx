"use client";
import { useStory } from "@/app/hooks/useStory";
import { getToken } from "@/app/lib/authUtils";
import { useEffect, useState } from "react";
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
    ageGroup,
    setAgeGroup,
    characters,
    setCharacters,
    theme,
    setTheme,
    moral,
    setMoral,
    loading,
  } = useStory(token);

  return (
    <div className="flex h-screen pt-16 bg-[#f7f7f8]">
      <div className="w-1/2 flex items-center justify-center border-r border-gray-300 bg-white">
        <div className="w-[70%] max-w-md flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Generate a Story</h1>

          <div className="flex items-center gap-4">
            <label className="w-24 text-gray-700 text-sm font-medium">Theme</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="flex-1 px-3 py-1 border rounded-md text-sm text-black"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="w-24 text-gray-700 text-sm font-medium">Characters</label>
            <input
              type="text"
              value={characters}
              onChange={(e) => setCharacters(e.target.value)}
              className="flex-1 px-3 py-1 border rounded-md text-sm text-black"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="w-24 text-gray-700 text-sm font-medium">Age Group</label>
            <input
              type="text"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="flex-1 px-3 py-1 border rounded-md text-sm text-black"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="w-24 text-gray-700 text-sm font-medium">Moral</label>
            <input
              type="text"
              value={moral}
              onChange={(e) => setMoral(e.target.value)}
              className="flex-1 px-3 py-1 border rounded-md text-sm text-black"
            />
          </div>

          <button
            onClick={sendMessage}
            className="mt-4 px-4 py-1.5 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-900 self-center w-full"
          >
            {loading ? "Generating..." : "Generate a Story"}
          </button>
        </div>
      </div>

      <div className="w-1/2 p-8 overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Responses</h2>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-md shadow-sm text-black ${
                msg.sender === "user"
                  ? "bg-blue-100 border border-blue-300"
                  : "bg-gray-100"
              }`}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
