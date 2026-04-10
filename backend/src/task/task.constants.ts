export const taskAssignmentSelect = {
  id: true,
  role: true,
  assignedById: true,
  assignedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  },
} as const;

export const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  assignments: {
    select: taskAssignmentSelect,
  },
} as const;
