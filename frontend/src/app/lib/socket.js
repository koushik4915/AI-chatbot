// utils/socket.js
import { io } from "socket.io-client";

let socket;

export const initiateSocket = (token) => {
  socket = io(process.env.NEXT_PUBLIC_API_BASE_URL, {
    auth: { token: `Bearer ${token}` },
    transports: ["websocket"],
  });

  return socket;
};

export const getSocket = () => socket;
