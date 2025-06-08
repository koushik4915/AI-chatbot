import { useState, useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
import axios from "axios";

export type Message = {
  text: string;
  sender: "user" | "bot";
};

export const useCharcterGenerater = (token: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const socket = useRef<Socket | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (!token || !baseUrl) return;

    const socketInstance = io(baseUrl, { auth: { token } });
    socket.current = socketInstance;

    socketInstance.on("character-chunk", (data: { chunk: string }) => {
      const chunk = data.chunk
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.sender === "bot") {
          if (last.text.includes(chunk)) {
            return prev; 
          }
          const maxOverlapLength = Math.min(chunk.length, last.text.length);
          let overlapSize = 0;
          
          for (let i = 1; i <= maxOverlapLength; i++) {
            const endOfExisting = last.text.slice(-i);
            const startOfChunk = chunk.slice(0, i);
            
            if (endOfExisting === startOfChunk) {
              overlapSize = i;
            }
          }
          
          const updated = [...prev];
          
          if (overlapSize > 0) {
            updated[updated.length - 1].text += chunk.slice(overlapSize);
          } else {
            updated[updated.length - 1].text += chunk;
          }
          
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
    if (!story) return;

    setMessages((prev) => [
      ...prev,
      {
        text: `Story: ${story}`,
        sender: "user",
      },
    ]);

    try {
      await axios.post(
        `${baseUrl}/api/character/generate-character-data`,
        { story },
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
    setMessages,
    sendMessage,
    story,
    setStory,
    loading,
  };
};
