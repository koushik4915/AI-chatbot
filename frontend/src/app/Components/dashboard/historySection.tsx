"use client";
import axios from "axios";
import { useEffect, useState, forwardRef } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useHistory } from "../../context/historyContext";

type Message = {
  text: string;
  sender: "user" | "bot";
};

type ChatItem = {
  _id: string;
  title: string;
};

type Props = {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
};

const HistorySection = forwardRef<HTMLDivElement, Props>(({ setMessages }, ref) => {
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { setShowHistory } = useHistory(); // Global context
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const token = sessionStorage.getItem("Token") || "";

  const fetchChatHistory = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const history = await axios.get(`${baseUrl}/api/chat/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatHistory(history.data);
    } catch (err) {
      console.log("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const deleteHistory = async (id: string) => {
    try {
      await axios.delete(`${baseUrl}/api/chat/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchChatHistory();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    const existingId = sessionStorage.getItem("chatId");
    if (existingId === id) {
      await deleteHistory(id);
      try {
        const idResponse = await axios.post(
          `${baseUrl}/api/chat/start`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages([]);
        sessionStorage.setItem("chatId", idResponse.data.chatId);
      } catch (err) {
        console.log(err);
      }
    } else {
      await deleteHistory(id);
    }
  };

  const handleEditHistory = async (id: string, title: string) => {
    try {
      await axios.patch(
        `${baseUrl}/api/chat/${id}/title`,
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchChatHistory();
    } catch (err) {
      console.log(err);
    }
  };

  const historyChat = async (id: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/chat/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const loadedMessages: Message[] = response.data.messages.map((msg: any) => ({
        text: msg.content || msg.message || "Message",
        sender: msg.sender === "user" ? "user" : "bot",
      }));

      setMessages([{ text: "Loading...", sender: "bot" }]);
      setTimeout(() => {
        setMessages(loadedMessages);
      }, 300);

      sessionStorage.setItem("chatId", id);
      setShowHistory(false);
    } catch (err) {
      console.error("Error loading chat history", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} className="w-full h-full overflow-y-auto p-4 bg-[#ffffff]">
      <h2 className="text-black font-bold text-lg mb-2">Chat History</h2>
      <ul className="space-y-2 pl-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <li
              key={index}
              className="animate-pulse bg-gray-200 rounded h-6 w-3/4"
            />
          ))
        ) : chatHistory.length > 0 ? (
          chatHistory.map((item, index) => (
            <li key={index} className="cursor-pointer group text-black list-inside">
              <div className="flex justify-between items-center">
                {editingId === item._id ? (
                  <input
                    autoFocus
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => {
                      handleEditHistory(item._id, newTitle);
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEditHistory(item._id, newTitle);
                        setEditingId(null);
                      }
                    }}
                    className="border border-gray-300 rounded px-1 text-sm w-full"
                  />
                ) : (
                  <span
                    className="hover:underline truncate"
                    onClick={() => historyChat(item._id)}
                  >
                    {item.title || `Chat #${index + 1}`}
                  </span>
                )}
                <div className="flex gap-1 ml-2">
                  <FaEdit
                    className="text-blue-500 hover:text-blue-700 text-sm"
                    title="Edit Title"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(item._id);
                      setNewTitle(item.title || "");
                    }}
                  />
                  <FaTrash
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Delete Chat"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistory(item._id);
                    }}
                  />
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="list-none text-black">No previous chats</li>
        )}
      </ul>
    </div>
  );
});

HistorySection.displayName = "HistorySection";
export default HistorySection;
