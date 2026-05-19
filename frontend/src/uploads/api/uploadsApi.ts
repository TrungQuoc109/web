import { httpClient } from "@/shared/api/http-client";

export type UploadedAttachment = {
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
};

type BackendUploadedAttachment = UploadedAttachment;

export const uploadsApi = {
  async uploadTaskReportAttachments(
    files: File[]
  ): Promise<UploadedAttachment[]> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await httpClient.post<BackendUploadedAttachment[]>(
      "/uploads/task-report-attachments",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },
};
