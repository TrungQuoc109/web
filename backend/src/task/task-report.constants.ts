export const taskReportSelect = {
  id: true,
  content: true,
  attachments: true,
  status: true,
  feedback: true,
  taskId: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  },
} as const;
