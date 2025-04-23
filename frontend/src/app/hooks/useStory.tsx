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
  const [ageGroup, setAgeGroup] = useState("");
  const [characters, setCharacters] = useState("");
  const [moral, setMoral] = useState("");
  const [loading, setLoading] = useState(false);

  const socket = useRef<Socket | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (!token || !baseUrl) return;

    const socketInstance = io(baseUrl, { auth: { token } });
    socket.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log(socketInstance.id)
      console.log("Socket connected");
    });

    socketInstance.on("story-chunk", (data: { chunk: string }) => {
      console.log("hello")
      console.log("Received chunk:", data.chunk);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.sender === "bot") {
          const updated = [...prev];
          updated[updated.length - 1].text += data.chunk;
          console.log(data.chunk)
          return updated;
        }
        return [...prev, { text: data.chunk, sender: "bot" }];
      });
    });

    socketInstance.on("processing", (data) => {
      console.log("processing")
      if (data.status === "started") {
        setLoading(true);
        setMessages((prev) => [...prev, { text: "", sender: "bot" }]);
      } else if (data.status === "completed") {
        setLoading(false);
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
    if (!theme || !ageGroup || !characters) return;

    setMessages((prev) => [
      ...prev,
      {
        text: `Theme: ${theme}, Characters: ${characters}, Age Group: ${ageGroup}, Moral: ${moral}`,
        sender: "user",
      },
    ]);

    try {
      await axios.post(
        `${baseUrl}/api/stories/generate`,
        {
          theme,
          ageGroup,
          characters,
          moral,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      socket.current?.emit("send-message", {
        theme,
        ageGroup,
        characters,
        moral,
      });
    } catch (error: any) {
      console.error("Error sending story request:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Failed to send request to server.", sender: "bot" },
      ]);
      setLoading(false);
    }
  };

  return {
    messages,
    setMessages,
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
  };
};
