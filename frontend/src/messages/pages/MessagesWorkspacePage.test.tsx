import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MessagesWorkspacePage } from "@/messages/pages/MessagesWorkspacePage";

const setSelectedProjectId = vi.fn();
const setMemberSearch = vi.fn();
const setMessageSearch = vi.fn();
const setInput = vi.fn();
const setIsAnnouncement = vi.fn();
const setPage = vi.fn();
const sendMessage = vi.fn();

vi.mock("@/i18n/useI18n", () => ({
  useI18n: () => ({
    language: "en",
    setLanguage: vi.fn(),
    t: (key: string) => key,
  }),
}));

vi.mock("@/messages/hooks/useMessagesWorkspaceController", () => ({
  useMessagesWorkspaceController: () => ({
    projectsQuery: {
      isPending: false,
      isError: false,
      data: [
        { id: "1", name: "Alpha", description: null, memberCount: 3, progress: 60, status: "ACTIVE", updatedAt: "2026-04-21T00:00:00.000Z" },
        { id: "2", name: "Beta", description: null, memberCount: 2, progress: 20, status: "PLANNING", updatedAt: "2026-04-21T00:00:00.000Z" },
      ],
      refetch: vi.fn(),
    },
    membersQuery: {
      isLoading: false,
      isError: false,
      data: [
        {
          id: "m1",
          userId: "7",
          name: "Alex",
          email: "alex@example.com",
          role: "OWNER",
          joinedAt: "2026-04-20T00:00:00.000Z",
        },
      ],
      refetch: vi.fn(),
    },
    chatQuery: {
      isPending: false,
      isError: false,
      data: {
        items: [
          {
            id: "msg-1",
            author: { name: "Alex", email: "alex@example.com" },
            content: "Kickoff update",
            createdAt: "2026-04-21T00:00:00.000Z",
            type: "normal",
            senderId: "7",
            isCurrentUser: true,
          },
        ],
        page: 1,
        totalPages: 2,
        total: 1,
        pageSize: 30,
      },
      refetch: vi.fn(),
    },
    sendProjectMessage: {
      isPending: false,
    },
    currentUser: { id: 7, name: "Alex", email: "alex@example.com", role: "ADMIN" },
    selectedProjectId: "1",
    setSelectedProjectId,
    selectedProject: { id: "1", name: "Alpha" },
    input: "Ship the update",
    setInput,
    isAnnouncement: false,
    setIsAnnouncement,
    memberSearch: "",
    setMemberSearch,
    messageSearch: "",
    setMessageSearch,
    setPage,
    members: [
      {
        id: "m1",
        userId: "7",
        name: "Alex",
        email: "alex@example.com",
        role: "OWNER",
        joinedAt: "2026-04-20T00:00:00.000Z",
      },
    ],
    filteredMembers: [
      {
        id: "m1",
        userId: "7",
        name: "Alex",
        email: "alex@example.com",
        role: "OWNER",
        joinedAt: "2026-04-20T00:00:00.000Z",
      },
    ],
    messages: [
      {
        id: "msg-1",
        author: { name: "Alex", email: "alex@example.com" },
        content: "Kickoff update",
        createdAt: "2026-04-21T00:00:00.000Z",
        type: "normal",
        senderId: "7",
        isCurrentUser: true,
      },
    ],
    summary: {
      total: 1,
      announcements: 0,
      unread: 0,
    },
    memberSummary: {
      total: 1,
      elevated: 1,
      viewers: 0,
      online: 1,
    },
    typingMembers: [],
    canSendMessages: true,
    canSendAnnouncements: true,
    onlineUserIds: ["7"],
    sendMessage,
  }),
}));

describe("MessagesWorkspacePage", () => {
  it("renders chat workspace and wires user actions", () => {
    render(<MessagesWorkspacePage />);

    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Kickoff update")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Alpha"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByPlaceholderText("Search messages in this project"), {
      target: { value: "kickoff" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(setSelectedProjectId).toHaveBeenCalledWith("2");
    expect(setMessageSearch).toHaveBeenCalledWith("kickoff");
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });
});
