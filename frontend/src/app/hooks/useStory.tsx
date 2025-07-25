import { useState, useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
import axios from "axios";

export type Message = {
  text: string;
  sender: "user" | "bot";
};

export const useStory = (token: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [theme, setTheme] = useState("");
  const [storyFormat, setStoryFormat] = useState("");
  const [storyStyle, setStoryStyle] = useState("");
  const [wordCount, setWordCount] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [sceneCount, setSceneCount] = useState("");
  const [moral, setMoral] = useState("");
  const [loading, setLoading] = useState(false);

  const socket = useRef<Socket | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (!token || !baseUrl) return;

    const socketInstance = io(baseUrl, { auth: { token } });
    socket.current = socketInstance;


    socketInstance.on("story-chunk", (data: { chunk: string }) => {
      const chunk = data.chunk;
      
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.sender === "bot") {
          if (last.text.endsWith(chunk)) {
            return prev;
          }

          const updated = [...prev];
          updated[updated.length - 1].text += chunk;

          return updated;
        }

        return [...prev, { text: chunk, sender: "bot" }];
      });
    });

    socketInstance.on("processing", (data) => {
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

    return () => {
      socketInstance.disconnect();
    };
  }, [token, baseUrl]);

  const sendMessage = async () => {
    if (!theme || !ageGroup || !sceneCount) return;

    setMessages((prev) => [
      ...prev,
      {
        text: `Theme: ${theme}, Scene Count: ${sceneCount}, Age Group: ${ageGroup}, Moral: ${moral}`,
        sender: "user",
      },
    ]);

    try {
      await axios.post(
        `${baseUrl}/api/stories/generate`,
        {
          theme,
          storyFormat,
          storyStyle,
          wordCount,
          ageGroup,
          sceneCount,
          moral,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { text: "Failed to send request to server.", sender: "bot" },
      ]);
      setLoading(false);
    }
  };

  return {
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
  };
};
