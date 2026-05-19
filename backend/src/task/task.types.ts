import { Role, TaskAssignmentRole, TaskPriority, TaskStatus } from '@prisma/client';

export interface TaskAssignmentView {
  id: number;
  role: TaskAssignmentRole;
  assignedById: number | null;
  assignedAt: Date;
  user: {
    id: number;
    email: string;
    name: string | null;
    role: Role;
  };
}

export interface TaskView {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: number;
  createdAt: Date;
  updatedAt: Date;
  assignments: TaskAssignmentView[];
}

export interface TaskCatalogView {
  items: TaskView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
