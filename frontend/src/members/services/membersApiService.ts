import { membersApi } from "@/members/api/membersApi";
import type { Member } from "@/members/types/member";

type MembersApiService = {
  list: (projectId: string) => Promise<Member[]>;
  remove: (projectId: string, memberId: string) => Promise<void>;
};

export const membersApiService: MembersApiService = {
  list: membersApi.list,
  remove: membersApi.remove,
};
