import { useEffect, useMemo, useRef, useState } from "react";

import { useAuthStore } from "@/auth/store/authStore";
import {
  emitRealtimeEvent,
  getRealtimeSocket,
} from "@/realtime/lib/realtime-socket";

type PresencePayload = {
  projectId: number;
  onlineUserIds: number[];
};

type TypingPayload = {
  projectId: number;
  userId: number;
  isTyping: boolean;
};

type UseProjectChatPresenceInput = {
  projectId?: string;
  draftValue: string;
  enabled: boolean;
};

export function useProjectChatPresence({
  projectId,
  draftValue,
  enabled,
}: UseProjectChatPresenceInput) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const typingActiveRef = useRef(false);
  const stopTypingTimeoutRef = useRef<number | null>(null);
  const numericProjectId = useMemo(
    () => (projectId ? Number(projectId) : null),
    [projectId]
  );

  useEffect(() => {
    if (!accessToken || !numericProjectId) {
      setOnlineUserIds([]);
      setTypingUserIds([]);
      return;
    }

    const socket = getRealtimeSocket(accessToken);

    const handlePresence = (payload: PresencePayload) => {
      if (payload.projectId !== numericProjectId) {
        return;
      }

      setOnlineUserIds(payload.onlineUserIds.map(String));
    };

    const handleTyping = (payload: TypingPayload) => {
      if (payload.projectId !== numericProjectId) {
        return;
      }

      setTypingUserIds((current) => {
        const next = new Set(current);

        if (payload.isTyping) {
          next.add(String(payload.userId));
        } else {
          next.delete(String(payload.userId));
        }

        return [...next];
      });
    };

    socket.on("project:presence", handlePresence);
    socket.on("project:typing", handleTyping);

    void emitRealtimeEvent<
      { projectId: number },
      { projectId: number; onlineUserIds: number[] }
    >(accessToken, "project:presence:get", {
      projectId: numericProjectId,
    })
      .then((payload) => {
        setOnlineUserIds(payload.onlineUserIds.map(String));
      })
      .catch(() => {
        setOnlineUserIds([]);
      });

    return () => {
      socket.off("project:presence", handlePresence);
      socket.off("project:typing", handleTyping);
      setTypingUserIds([]);
    };
  }, [accessToken, numericProjectId]);

  useEffect(() => {
    if (!accessToken || !numericProjectId || !enabled) {
      if (typingActiveRef.current && accessToken && numericProjectId) {
        getRealtimeSocket(accessToken).emit("project:typing", {
          projectId: numericProjectId,
          isTyping: false,
        });
      }

      typingActiveRef.current = false;
      return;
    }

    const socket = getRealtimeSocket(accessToken);
    const trimmedDraft = draftValue.trim();

    if (stopTypingTimeoutRef.current !== null) {
      window.clearTimeout(stopTypingTimeoutRef.current);
      stopTypingTimeoutRef.current = null;
    }

    if (!trimmedDraft) {
      if (typingActiveRef.current) {
        socket.emit("project:typing", {
          projectId: numericProjectId,
          isTyping: false,
        });
      }

      typingActiveRef.current = false;
      return;
    }

    if (!typingActiveRef.current) {
      socket.emit("project:typing", {
        projectId: numericProjectId,
        isTyping: true,
      });
      typingActiveRef.current = true;
    }

    stopTypingTimeoutRef.current = window.setTimeout(() => {
      socket.emit("project:typing", {
        projectId: numericProjectId,
        isTyping: false,
      });
      typingActiveRef.current = false;
    }, 1500);

    return () => {
      if (stopTypingTimeoutRef.current !== null) {
        window.clearTimeout(stopTypingTimeoutRef.current);
        stopTypingTimeoutRef.current = null;
      }
    };
  }, [accessToken, draftValue, enabled, numericProjectId]);

  return {
    onlineUserIds,
    typingUserIds,
  };
}
