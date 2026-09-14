import { io } from "socket.io-client";

import {
  API_URL,
} from "../constants/config";

const SOCKET_URL =
  API_URL.replace(/\/api\/?$/, "");

export function createNoteSocket(token) {
  if (!token) {
    return null;
  }

  return io(SOCKET_URL, {
    autoConnect: true,
    transports: ["websocket"],
    auth: {
      token,
    },
  });
}