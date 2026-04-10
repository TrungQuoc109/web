import { useQuery } from "@tanstack/react-query";

import {
  emptyMessagesMock,
  messagesMock,
} from "@/messages/mock/messagesMock";
import type { ChatMessage } from "@/messages/types/message";
import { mockDelay } from "@/shared/api/mockDelay";

export function useProjectChat() {
  return useQuery<ChatMessage[]>({
    queryKey: ["messages", "project-chat"],
    queryFn: async () => {
      await mockDelay(350);

      return import.meta.env.VITE_MESSAGES_EMPTY === "1"
        ? emptyMessagesMock
        : messagesMock;
    },
    staleTime: Infinity,
  });
}
