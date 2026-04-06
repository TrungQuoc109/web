import { ReportStatus, Role } from '@prisma/client';

export interface TaskReportView {
  id: number;
  content: string;
  attachments: string[];
  status: ReportStatus;
  feedback: string | null;
  taskId: number;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    email: string;
    name: string | null;
    role: Role;
  };
}
