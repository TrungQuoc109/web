import { useProjectChatCatalog, type UseProjectChatCatalogInput } from "@/messages/hooks/useProjectChatCatalog";

export function useMessagesByProject(input: UseProjectChatCatalogInput) {
  return useProjectChatCatalog(input);
}

