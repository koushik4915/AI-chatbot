import { useState, useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
import axios from "axios";

export type Message = {
  text: string;
  sender: "user" | "bot";
};

interface Character {
  name: string;
  age: string;
  description: string;
}

export const useVideo = (token: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [story, setStory] = useState<string>("");
  const [characters, setCharacters] = useState<Character[]>([{ name: "", age: "", description: "" }]);
  const [sceneDescription, setSceneDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);

  const socket = useRef<Socket | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (!token || !baseUrl) return;

    const socketInstance = io(baseUrl, {
      auth: { token },
    });
    socket.current = socketInstance;

    socketInstance.on("prompt-chunk", (data: { chunk: string }) => {
      const chunk = data.chunk;

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.sender === "bot") {
          const maxOverlapLength = Math.min(chunk.length, last.text.length);
          let overlapSize = 0;

          for (let i = 1; i <= maxOverlapLength; i++) {
            if (last.text.slice(-i) === chunk.slice(0, i)) {
              overlapSize = i;
            }
          }

          const updated = [...prev];
          updated[updated.length - 1].text += chunk.slice(overlapSize);
          return updated;
        }

        return [...prev, { text: chunk, sender: "bot" }];
      });
    });

    socketInstance.on("processing", (data: { status: string }) => {
      if (data.status === "started") {
        setLoading(true);
        setMessages((prev) => [...prev, { text: "", sender: "bot" }]);
      } else if (data.status === "completed") {
        setLoading(false);
        socketInstance.disconnect();
      }
    });

    socketInstance.on("error", (err: { error: string }) => {
      setLoading(false);
      setMessages((prev) => [...prev, { text: `Error: ${err.error}`, sender: "bot" }]);
    });

    socketInstance.on("disconnect", () => {
      setLoading(false);
    });

    return () => {
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, [token, baseUrl]);

  const sendMessage = async () => {
    if (!story.trim() || !characters.length || characters.some((c) => !c.name.trim() || !c.age.trim() || !c.description.trim())) {
      alert("Please fill in the story and all character fields.");
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        text: `Story: ${story}\nCharacters: ${characters.map((c) => `${c.name} (Age: ${c.age})`).join(", ")}`,
        sender: "user",
      },
    ]);

    const videoPromptData = {
      story,
      characters,
      sceneDescription,
    };

    try {
      await axios.post(`${baseUrl}/api/video/generate`, videoPromptData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { text: "Failed to send the video prompt. Please try again.", sender: "bot" },
      ]);
      setLoading(false);
    }
  };

  return {
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
  };
};
