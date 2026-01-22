import { SERVER_URL } from "@/lib/auth-client";
import { io } from "socket.io-client";

export const socket = io(SERVER_URL, {
  autoConnect: false,
  withCredentials: true,
});
