import { useMutation } from "@tanstack/react-query";

import { uploadsApi } from "@/uploads/api/uploadsApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { useToastStore } from "@/shared/lib/toast-store";

export function useUploadTaskReportAttachmentsMutation() {
  return useMutation({
    mutationFn: (files: File[]) => uploadsApi.uploadTaskReportAttachments(files),
    onError: (error) => {
      useToastStore.getState().push({
        title: "Attachment upload failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
