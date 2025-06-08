import { useState, useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
import axios from "axios";

export type Message = {
  text: string;
  sender: "user" | "bot";
};

export const useChat = (
  token: string,
  selectedFile: File | null,
  setSelectedFile: (file: File | null) => void
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const socket = useRef<Socket | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (!token) return;

    socket.current = io(baseUrl!, { auth: { token } });

    socket.current?.on("message-chunk", (data: any) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.sender === "bot") {
          const updated = [...prev];
          updated[updated.length - 1].text += data.chunk;
          return updated;
        }
        return [...prev, { text: data.chunk, sender: "bot" }];
      });
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [token]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const chatId = sessionStorage.getItem("chatId");
  
    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setInput("");
  
    try {
      if (!selectedFile) {

        await axios.post(
          `${baseUrl}/api/chat/${chatId}/message`,
          { message: input },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        socket.current?.emit("send-message", { chatId, message: input });
        return;
      }
  
      const fileType = selectedFile.type;
  
      if (fileType === "application/pdf") {

        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);
  
        const uploadRes = await axios.post(
          `${baseUrl}/api/files/upload`,
          uploadFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "form-data",
            },
          }
        );
  
        const fileId = uploadRes.data.fileId; 
  

        await axios.post(
          `${baseUrl}/api/chat/${chatId}/message`,
          {
            message: input,
            fileIds: fileId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        socket.current?.emit("send-message", { chatId, message: input });
        setSelectedFile(null);
        return;
      }
  

      if (fileType.startsWith("image/")) {
        const formData = new FormData();
        formData.append("message", input);
        formData.append("image", selectedFile);
  
        await axios.post(
          `${baseUrl}/api/chat/${chatId}/image-message`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "form-data",
            },
          }
        );
  
        socket.current?.emit("send-message", { chatId, message: input });
        setSelectedFile(null);
        return;
      }
  
      throw new Error("Unsupported file type");
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Error getting response.", sender: "bot" },
      ]);
    }
  };
  
  

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return {
    input,
    setInput,
    messages,
    setMessages,
    handleKeyPress,
    sendMessage,
  };
};
