import { useQuery } from "@tanstack/react-query";

import { messagesApi } from "@/messages/api/messagesApi";
import type { ChatMessagesCatalog } from "@/messages/types/message";
import { messagesKeys } from "@/shared/lib/query-keys";

export type UseProjectChatCatalogInput = {
  projectId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export function useProjectChatCatalog(input: UseProjectChatCatalogInput) {
  const filters = {
    search: input.search,
    page: input.page ?? 1,
    pageSize: input.pageSize ?? 30,
  };

  return useQuery<ChatMessagesCatalog>({
    queryKey: messagesKeys.catalog(input.projectId, filters),
    queryFn: () =>
      messagesApi.listProjectMessagesCatalog({
        projectId: input.projectId!,
        ...filters,
      }),
    enabled: Boolean(input.projectId),
    staleTime: 10_000,
  });
}
