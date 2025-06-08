"use client";
import { useStory } from "@/app/hooks/useStory";
import { getToken } from "@/app/lib/authUtils";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function CustomInteractionPage() {
  const [token, setToken] = useState("");
  const [customSceneCount, setCustomSceneCount] = useState("");
  const [customAgeGroup, setCustomAgeGroup] = useState("");

  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) setToken(storedToken);
  }, []);

  const {
    messages,
    sendMessage,
    ageGroup,
    setAgeGroup,
    sceneCount,
    setSceneCount,
    theme,
    setTheme,
    moral,
    setMoral,
    storyFormat,
    setStoryFormat,
    storyStyle,
    setStoryStyle,
    wordCount,
    setWordCount,
    loading,
  } = useStory(token);

  const sceneOptions = ["3", "5", "7", "10", "Custom"];
  const ageGroupOptions = ["3-5", "6-8", "9-12", "13+", "Custom"];
  const formatOptions = ["Book-Style Narrative", "Animation/Dialogue-Driven"];
  const styleOptions = ["Descriptive", "Conversational", "Mixed"];
  const wordCountOptions = ["<300", "300-500", "500-800", "800+"];

  const handleGenerate = () => {
    const finalSceneCount = sceneCount === "Custom" ? customSceneCount : sceneCount;
    const finalAgeGroup = ageGroup === "Custom" ? customAgeGroup : ageGroup;

    setSceneCount(finalSceneCount);
    setAgeGroup(finalAgeGroup);

    sendMessage();
  };

  return (
    <div className="flex h-screen pt-16 bg-[#f7f7f8]">
      <div className="w-1/3 flex items-center justify-center border-r border-gray-300 bg-white">
        <div className="w-[70%] max-w-md flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Generate a Story</h1>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Story Line</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Magical forest adventure"
              className="px-3 py-2 border rounded-md text-sm text-black"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Scene Count</label>
            <select
              value={sceneCount}
              onChange={(e) => setSceneCount(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm text-black"
            >
              {sceneOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {sceneCount === "Custom" && (
              <input
                type="number"
                placeholder="Enter custom scene count"
                value={customSceneCount}
                onChange={(e) => setCustomSceneCount(e.target.value)}
                className="mt-2 px-3 py-2 border rounded-md text-sm text-black"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Age Group</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm text-black"
            >
              {ageGroupOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {ageGroup === "Custom" && (
              <input
                type="text"
                placeholder="Enter custom age group"
                value={customAgeGroup}
                onChange={(e) => setCustomAgeGroup(e.target.value)}
                className="mt-2 px-3 py-2 border rounded-md text-sm text-black"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Story Format</label>
            <select
              value={storyFormat}
              onChange={(e) => setStoryFormat(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm text-black"
            >
              {formatOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Story Style</label>
            <select
              value={storyStyle}
              onChange={(e) => setStoryStyle(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm text-black"
            >
              {styleOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Word Count</label>
            <select
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm text-black"
            >
              {wordCountOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Moral</label>
            <input
              type="text"
              value={moral}
              onChange={(e) => setMoral(e.target.value)}
              placeholder="e.g. Kindness always wins"
              className="px-3 py-2 border rounded-md text-sm text-black"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-900 self-center w-full"
          >
            {loading ? "Generating..." : "Generate a Story"}
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
