export const messageSelect = {
  id: true,
  content: true,
  senderId: true,
  projectId: true,
  isSystem: true,
  isImportant: true,
  isAnnouncement: true,
  metadata: true,
  createdAt: true,
  sender: {
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  },
} as const;
