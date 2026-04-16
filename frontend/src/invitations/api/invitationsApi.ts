import { httpClient } from "@/shared/api/http-client";
import type { ProjectInvitation } from "@/invitations/types/invitation";

type BackendInvitation = {
  id: number;
  email: string;
  token: string;
  projectId: number;
  senderId: number;
  status: ProjectInvitation["status"];
  expiresAt: string;
  createdAt: string;
};

function mapInvitation(invitation: BackendInvitation): ProjectInvitation {
  return {
    id: String(invitation.id),
    email: invitation.email,
    token: invitation.token,
    projectId: String(invitation.projectId),
    senderId: String(invitation.senderId),
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
  };
}

export const invitationsApi = {
  async listProjectInvitations(projectId: string): Promise<ProjectInvitation[]> {
    const response = await httpClient.get<BackendInvitation[]>(
      `/projects/${projectId}/invitations`
    );
    return response.data.map(mapInvitation);
  },

  async createInvitation(projectId: string, email: string): Promise<ProjectInvitation> {
    const response = await httpClient.post<BackendInvitation>(
      `/projects/${projectId}/invitations`,
      { email }
    );
    return mapInvitation(response.data);
  },

  async acceptInvitation(token: string): Promise<void> {
    await httpClient.post(`/invitations/${token}/accept`);
  },
};
