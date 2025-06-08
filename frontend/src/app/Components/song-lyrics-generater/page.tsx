"use client";

import { useLyrics } from "@/app/hooks/useLyrics";
import { getToken } from "@/app/lib/authUtils";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function CustomInteractionPage() {
  const [token, setToken] = useState("");

  const [customGenre, setCustomGenre] = useState("");
  const [customVerses, setCustomVerses] = useState("");
  const [customMood, setCustomMood] = useState("");
  const [customTone, setCustomTone] = useState("");

  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) setToken(storedToken);
  }, []);

  const {
    messages,
    setMessages,
    sendMessage,
    concept,
    setConcept,
    genre,
    setGenre,
    verses,
    setVerses,
    referenceTone,
    setReferenceTone,
    mood,
    setMood,
    loading,
  } = useLyrics(token);

  const genreOptions = ["Pop", "Rock", "Jazz", "Hip-Hop", "Classical", "Custom"];
  const versesOptions = ["2", "3", "4", "5", "Custom"];
  const moodOptions = ["Happy", "Sad", "Inspirational", "Romantic", "Energetic", "Custom"];
  const referenceToneOptions = [
    "mystical like LOTR", "cinematic orchestral", "lofi indie heartbreak", "Custom",
  ];

  const handleGenerate = () => {
    const finalGenre = genre === "Custom" ? customGenre : genre;
    const finalVerses = verses === "Custom" ? customVerses : verses;
    const finalMood = mood === "Custom" ? customMood : mood;
    const finalTone = referenceTone === "Custom" ? customTone : referenceTone;
  
    sendMessage({
      genre: finalGenre,
      verses: finalVerses,
      mood: finalMood,
      referenceTone: finalTone,
    });
  };
  

  return (
    <div className="flex h-screen pt-16 bg-[#f7f7f8]">
      <div className="w-1/3 flex items-center justify-center border-r border-gray-300 bg-white">
        <div className="w-[70%] max-w-md flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Generate Song Lyrics</h1>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Concept</label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. Overcoming challenges"
              className="px-3 py-2 border rounded-md text-sm text-black"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm text-black"
            >
              {genreOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {genre === "Custom" && (
              <input
                type="text"
                placeholder="Enter custom genre"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                className="mt-2 px-3 py-2 border rounded-md text-sm text-black"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Verses</label>
            <select
              value={verses}
              onChange={(e) => setVerses(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm text-black"
            >
              {versesOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {verses === "Custom" && (
              <input
                type="number"
                placeholder="Enter number of verses"
                value={customVerses}
                onChange={(e) => setCustomVerses(e.target.value)}
                className="mt-2 px-3 py-2 border rounded-md text-sm text-black"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm text-black"
            >
              {moodOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {mood === "Custom" && (
              <input
                type="text"
                placeholder="Enter custom mood"
                value={customMood}
                onChange={(e) => setCustomMood(e.target.value)}
                className="mt-2 px-3 py-2 border rounded-md text-sm text-black"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Reference Tone</label>
            <select
              value={referenceTone}
              onChange={(e) => setReferenceTone(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm text-black"
            >
              {referenceToneOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {referenceTone === "Custom" && (
              <input
                type="text"
                placeholder="Enter custom tone"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                className="mt-2 px-3 py-2 border rounded-md text-sm text-black"
              />
            )}
          </div>

          <button
            onClick={handleGenerate}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-900 self-center w-full"
          >
            {loading ? "Generating..." : "Generate Song Lyrics"}
          </button>
        </div>
      </div>

      <div className="w-2/3 p-8 overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Responses</h2>
        <div className="space-y-4">
          {messages.filter((msg) => msg.sender !== "user").map((msg, idx) => (
            <div key={idx} className="p-4 rounded-md shadow-sm text-black bg-gray-100">
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
