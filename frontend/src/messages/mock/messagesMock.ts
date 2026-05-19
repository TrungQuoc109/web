import type { ChatMessage } from "@/messages/types/message";

export const messagesMock: ChatMessage[] = [
  {
    id: "message-1",
    author: {
      name: "Linh Tran",
      email: "linh.tran@example.com",
    },
    content:
      "The updated checkout mock is ready. I pushed the annotated screens to the shared workspace.",
    createdAt: "9:12 AM",
    type: "normal",
  },
  {
    id: "message-2",
    author: null,
    content: "Project Phoenix status changed from PLANNING to ACTIVE.",
    createdAt: "9:18 AM",
    type: "system",
  },
  {
    id: "message-3",
    author: {
      name: "Quoc Duong",
      email: "duongtrungquoc@gmail.com",
    },
    content:
      "Please keep the sidebar polish inside this sprint so we can show it in Friday's walkthrough.",
    createdAt: "9:26 AM",
    type: "announcement",
    isCurrentUser: true,
  },
  {
    id: "message-4",
    author: {
      name: "An Nguyen",
      email: "an.nguyen@example.com",
    },
    content:
      "I can take the final responsive pass after lunch and connect the motion states in the same PR.",
    createdAt: "9:31 AM",
    type: "normal",
  },
];

export const emptyMessagesMock: ChatMessage[] = [];

