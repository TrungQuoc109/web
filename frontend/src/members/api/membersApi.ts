import { httpClient } from "@/shared/api/http-client";
import type { Member } from "@/members/types/member";
import type { MemberRole } from "@/shared/types/workspace";

type BackendProjectMember = {
  id: number;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: string;
  user: {
    id: number;
    email: string;
    name: string | null;
    role: string;
  };
};

function formatJoinedAt(value: string) {
  return new Date(value).toLocaleDateString();
}

function mapMember(member: BackendProjectMember): Member {
  return {
    id: String(member.id),
    userId: String(member.user.id),
    name: member.user.name ?? member.user.email,
    email: member.user.email,
    role: member.role as MemberRole,
    joinedAt: formatJoinedAt(member.joinedAt),
  };
}

export const membersApi = {
  async list(projectId: string): Promise<Member[]> {
    const response = await httpClient.get<BackendProjectMember[]>(
      `/projects/${projectId}/members`
    );
    return response.data.map(mapMember);
  },

  async remove(projectId: string, memberId: string): Promise<void> {
    await httpClient.delete(`/projects/${projectId}/members/${memberId}`);
  },
};
