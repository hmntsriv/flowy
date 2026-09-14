import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { createNoteSocket } from "../services/socket";

export default function useNoteRealtime(onNoteUpdated) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = createNoteSocket(token);

    if (!socket) {
      return undefined;
    }

    const handleUpdated = (updatedNote) => {
      onNoteUpdated?.(updatedNote);
    };

    socket.on("note:updated", handleUpdated);

    return () => {
      socket.off("note:updated", handleUpdated);
      socket.disconnect();
    };
  }, [token, onNoteUpdated]);
}