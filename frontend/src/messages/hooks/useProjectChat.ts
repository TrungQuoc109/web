import { useQuery } from "@tanstack/react-query";

import { messagesApi } from "@/messages/api/messagesApi";
import type { ChatMessage } from "@/messages/types/message";
import { messagesKeys } from "@/shared/lib/query-keys";

export function useProjectChat(projectId?: string) {
  return useQuery<ChatMessage[]>({
    queryKey: messagesKeys.project(projectId),
    queryFn: () => messagesApi.listProjectMessages(projectId!),
    enabled: Boolean(projectId),
    staleTime: 10_000,
  });
}
