import { ProjectRole, Role } from '@prisma/client';

export interface ProjectMemberView {
  id: number;
  role: ProjectRole;
  joinedAt: Date;
  user: {
    id: number;
    email: string;
    name: string | null;
    role: Role;
  };
}

export interface ProjectView {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
