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

  const { setShowHistory } = useHistory();
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
      console.log(err)
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

  const handleNewChat = async () => {
    try {
      const idResponse = await axios.post(
        `${baseUrl}/api/chat/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages([]);
      sessionStorage.setItem("chatId", idResponse.data.chatId);
      fetchChatHistory();
      setShowHistory(false);
    } catch (err) {
      console.error("Failed to start new chat:", err);
    }
  }
  return (
    <div ref={ref} className="w-full h-full overflow-y-auto p-4 bg-[#ffffff]">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-black font-bold text-lg ml-2">Chat History</h2>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" onClick={handleNewChat} xmlns="http://www.w3.org/2000/svg" className="icon-xl-heavy cursor-pointer"><path d="M15.6729 3.91287C16.8918 2.69392 18.8682 2.69392 20.0871 3.91287C21.3061 5.13182 21.3061 7.10813 20.0871 8.32708L14.1499 14.2643C13.3849 15.0293 12.3925 15.5255 11.3215 15.6785L9.14142 15.9899C8.82983 16.0344 8.51546 15.9297 8.29289 15.7071C8.07033 15.4845 7.96554 15.1701 8.01005 14.8586L8.32149 12.6785C8.47449 11.6075 8.97072 10.615 9.7357 9.85006L15.6729 3.91287ZM18.6729 5.32708C18.235 4.88918 17.525 4.88918 17.0871 5.32708L11.1499 11.2643C10.6909 11.7233 10.3932 12.3187 10.3014 12.9613L10.1785 13.8215L11.0386 13.6986C11.6812 13.6068 12.2767 13.3091 12.7357 12.8501L18.6729 6.91287C19.1108 6.47497 19.1108 5.76499 18.6729 5.32708ZM11 3.99929C11.0004 4.55157 10.5531 4.99963 10.0008 5.00007C9.00227 5.00084 8.29769 5.00827 7.74651 5.06064C7.20685 5.11191 6.88488 5.20117 6.63803 5.32695C6.07354 5.61457 5.6146 6.07351 5.32698 6.63799C5.19279 6.90135 5.10062 7.24904 5.05118 7.8542C5.00078 8.47105 5 9.26336 5 10.4V13.6C5 14.7366 5.00078 15.5289 5.05118 16.1457C5.10062 16.7509 5.19279 17.0986 5.32698 17.3619C5.6146 17.9264 6.07354 18.3854 6.63803 18.673C6.90138 18.8072 7.24907 18.8993 7.85424 18.9488C8.47108 18.9992 9.26339 19 10.4 19H13.6C14.7366 19 15.5289 18.9992 16.1458 18.9488C16.7509 18.8993 17.0986 18.8072 17.362 18.673C17.9265 18.3854 18.3854 17.9264 18.673 17.3619C18.7988 17.1151 18.8881 16.7931 18.9393 16.2535C18.9917 15.7023 18.9991 14.9977 18.9999 13.9992C19.0003 13.4469 19.4484 12.9995 20.0007 13C20.553 13.0004 21.0003 13.4485 20.9999 14.0007C20.9991 14.9789 20.9932 15.7808 20.9304 16.4426C20.8664 17.116 20.7385 17.7136 20.455 18.2699C19.9757 19.2107 19.2108 19.9756 18.27 20.455C17.6777 20.7568 17.0375 20.8826 16.3086 20.9421C15.6008 21 14.7266 21 13.6428 21H10.3572C9.27339 21 8.39925 21 7.69138 20.9421C6.96253 20.8826 6.32234 20.7568 5.73005 20.455C4.78924 19.9756 4.02433 19.2107 3.54497 18.2699C3.24318 17.6776 3.11737 17.0374 3.05782 16.3086C2.99998 15.6007 2.99999 14.7266 3 13.6428V10.3572C2.99999 9.27337 2.99998 8.39922 3.05782 7.69134C3.11737 6.96249 3.24318 6.3223 3.54497 5.73001C4.02433 4.7892 4.78924 4.0243 5.73005 3.54493C6.28633 3.26149 6.88399 3.13358 7.55735 3.06961C8.21919 3.00673 9.02103 3.00083 9.99922 3.00007C10.5515 2.99964 10.9996 3.447 11 3.99929Z" fill="currentColor"></path>
        </svg>
      </div>

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
                    className="hover:bg-gray-200 truncate"
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
