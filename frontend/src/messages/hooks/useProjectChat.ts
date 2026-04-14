import { useQuery } from "@tanstack/react-query";

import { messagesService } from "@/messages/services/messagesService";
import type { ChatMessage } from "@/messages/types/message";

export function useProjectChat(projectId?: string) {
  return useQuery<ChatMessage[]>({
    queryKey: ["messages", "project", projectId],
    queryFn: () => messagesService.listProjectMessages(projectId!),
    enabled: Boolean(projectId),
    staleTime: 10_000,
  });
}
