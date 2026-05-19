export const projectMemberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  },
} as const;
