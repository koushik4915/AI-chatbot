"use client";
import { useState, useEffect } from "react";
import { useVideo } from "@/app/hooks/useVideo";
import { getToken } from "@/app/lib/authUtils";
import ReactMarkdown from "react-markdown";

interface Character {
  name: string;
  age: string;
  description: string;
}

export default function CustomInteractionPage() {
  const [token, setToken] = useState<string>("");
  const [customAgeInputs, setCustomAgeInputs] = useState<{ [key: number]: string }>({});
  const [customSceneDescription, setCustomSceneDescription] = useState<string>("");

  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) setToken(storedToken);
  }, []);

  const {
    messages,
    setMessages,
    sendMessage,
    story,
    setStory,
    characters,
    setCharacters,
    sceneDescription,
    setSceneDescription,
    response,
    setResponse,
    loading,
  } = useVideo(token);

  const ageOptions = ["3", "5", "8", "10", "12", "Custom"];
  const sceneDescOptions = ["Short", "Medium", "Long", "Custom"];

  const handleCharacterChange = (index: number, field: keyof Character, value: string) => {
    const updatedCharacters = [...characters];
    updatedCharacters[index][field] = value;
    setCharacters(updatedCharacters);
  };

  const handleAddCharacter = () => {
    setCharacters([...characters, { name: "", age: "", description: "" }]);
  };

  const handleRemoveCharacter = (index: number) => {
    const updatedCharacters = characters.filter((_, i) => i !== index);
    setCharacters(updatedCharacters);


    setCustomAgeInputs((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const handleSubmit = () => {
    if (characters.some((c) => !c.name || !c.age || !c.description)) {
      alert("Please fill out all character fields.");
      return;
    }
    sendMessage();
  };

  return (
    <div className="flex h-screen pt-16 bg-[#f7f7f8]">
      <div className="w-1/3 flex items-center justify-center border-r border-gray-300 bg-white overflow-y-auto max-h-screen">
        <div className="w-[70%] max-w-md flex flex-col gap-4 py-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Generate a Video Prompt</h1>

          <div className="flex flex-col gap-1">
            <label className="text-gray-700 text-sm font-medium">Story</label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm text-black"
              rows={4}
            />
          </div>

          {characters.map((character, index) => (
            <div key={index} className="border p-4 rounded-md bg-gray-50 space-y-3">
              <h3 className="font-semibold text-gray-700">Character {index + 1}</h3>

              <div className="flex flex-col gap-1">
                <label className="text-gray-700 text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => handleCharacterChange(index, "name", e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm text-black"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-700 text-sm font-medium">Age</label>
                <select
                  value={ageOptions.includes(character.age) ? character.age : "Custom"}
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected === "Custom") {
                      handleCharacterChange(index, "age", "");
                    } else {
                      handleCharacterChange(index, "age", selected);
                      setCustomAgeInputs((prev) => ({ ...prev, [index]: "" }));
                    }
                  }}
                  className="px-3 py-2 border rounded-md text-sm text-black"
                >
                  {ageOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>

                {(!ageOptions.includes(character.age)) && (
                  <input
                    type="text"
                    placeholder="Enter custom age"
                    value={customAgeInputs[index] ?? character.age}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomAgeInputs((prev) => ({ ...prev, [index]: value }));
                      handleCharacterChange(index, "age", value);
                    }}
                    className="mt-2 px-3 py-2 border rounded-md text-sm text-black"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-700 text-sm font-medium">Description</label>
                <textarea
                  value={character.description}
                  onChange={(e) => handleCharacterChange(index, "description", e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm text-black"
                  rows={2}
                />
              </div>

              {characters.length > 1 && (
                <button
                  onClick={() => handleRemoveCharacter(index)}
                  className="text-red-600 text-sm"
                >
                  Remove Character
                </button>
              )}
            </div>
          ))}

          <button
            onClick={handleAddCharacter}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-900"
          >
            Add Another Character
          </button>

          <div className="flex flex-col gap-1 mt-4">
            <label className="text-gray-700 text-sm font-medium">Scene Description</label>
            <select
              value={sceneDescOptions.includes(sceneDescription) ? sceneDescription : "Custom"}
              onChange={(e) => {
                const selected = e.target.value;
                if (selected === "Custom") {
                  setSceneDescription("");
                  setCustomSceneDescription("");
                } else {
                  setSceneDescription(selected);
                  setCustomSceneDescription("");
                }
              }}
              className="px-3 py-2 border rounded-md text-sm text-black"
            >
              {sceneDescOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>


            {(!sceneDescOptions.includes(sceneDescription)) && (
              <textarea
                placeholder="Enter custom scene description"
                value={customSceneDescription || sceneDescription}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomSceneDescription(value);
                  setSceneDescription(value);
                }}
                className="mt-2 px-3 py-2 border rounded-md text-sm text-black"
                rows={3}
              />
            )}
          </div>


          <button
            onClick={handleSubmit}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-900 self-center w-full"
          >
            {loading ? "Generating..." : "Generate Video Prompt"}
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
