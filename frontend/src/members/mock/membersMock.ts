import type { Member } from "@/members/types/member";

export const membersMock: Member[] = [
  {
    id: "member-1",
    name: "Quoc Duong",
    email: "duongtrungquoc@gmail.com",
    role: "OWNER",
    joinedAt: "2026-03-18",
  },
  {
    id: "member-2",
    name: "Linh Tran",
    email: "linh.tran@example.com",
    role: "ADMIN",
    joinedAt: "2026-03-21",
  },
  {
    id: "member-3",
    name: "An Nguyen",
    email: "an.nguyen@example.com",
    role: "ADMIN",
    joinedAt: "2026-03-22",
  },
  {
    id: "member-4",
    name: "Mai Le",
    email: "mai.le@example.com",
    role: "MEMBER",
    joinedAt: "2026-03-24",
  },
  {
    id: "member-5",
    name: "Bao Ho",
    email: "bao.ho@example.com",
    role: "VIEWER",
    joinedAt: "2026-03-29",
  },
];

export const emptyMembersMock: Member[] = [];
