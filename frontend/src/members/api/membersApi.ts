import { httpClient } from "@/shared/api/http-client";
import type { Member } from "@/members/types/member";
import type { MemberRole } from "@/shared/types/workspace";

type BackendProjectMember = {
  id: number;
  role: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
  joinedAt: string;
  user: {
    id: number;
    email: string;
    name: string | null;
    role: string;
  };
};

export type AddMemberPayload = {
  projectId: string;
  email: string;
  role: MemberRole;
};

function mapMember(member: BackendProjectMember): Member {
  return {
    id: String(member.id),
    userId: String(member.user.id),
    name: member.user.name,
    email: member.user.email,
    role: member.role as MemberRole,
    joinedAt: member.joinedAt,
  };
}

export const membersApi = {
  async list(projectId: string): Promise<Member[]> {
    const response = await httpClient.get<BackendProjectMember[]>(
      `/projects/${projectId}/members`
    );
    return response.data.map(mapMember);
  },

  async add(payload: AddMemberPayload): Promise<Member> {
    const response = await httpClient.post<BackendProjectMember>(
      `/projects/${payload.projectId}/members`,
      {
        email: payload.email,
        role: payload.role,
      }
    );

    return mapMember(response.data);
  },

  async remove(projectId: string, memberId: string): Promise<void> {
    await httpClient.delete(`/projects/${projectId}/members/${memberId}`);
  },
};
