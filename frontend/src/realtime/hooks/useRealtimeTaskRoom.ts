import { useEffect } from "react";

import { useAuthStore } from "@/auth/store/authStore";
import { joinRealtimeTaskRoom } from "@/realtime/lib/realtime-actions";

export function useRealtimeTaskRoom(taskId?: string, enabled = true) {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!enabled || !taskId || !accessToken) {
      return;
    }

    void joinRealtimeTaskRoom(accessToken, taskId).catch(() => {
      return;
    });
  }, [accessToken, enabled, taskId]);
}
