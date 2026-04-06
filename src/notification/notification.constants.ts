export const notificationSelect = {
  id: true,
  recipientId: true,
  activityId: true,
  isRead: true,
  readAt: true,
  type: true,
  createdAt: true,
  activity: {
    select: {
      id: true,
      content: true,
      projectId: true,
      taskId: true,
      isSystem: true,
      isAnnouncement: true,
      metadata: true,
      createdAt: true,
    },
  },
} as const;
