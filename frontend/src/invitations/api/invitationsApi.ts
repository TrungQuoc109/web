import { httpClient } from "@/shared/api/http-client";
import type { ProjectInvitation } from "@/invitations/types/invitation";

type BackendInvitation = {
  id: number;
  email: string;
  token?: string;
  tokenPreview?: string | null;
  projectId: number;
  senderId: number;
  status: ProjectInvitation["status"];
  role: ProjectInvitation["role"];
  expiresAt: string;
  createdAt: string;
  sentAt?: string;
};

function mapInvitation(invitation: BackendInvitation): ProjectInvitation {
  return {
    id: String(invitation.id),
    email: invitation.email,
    token: invitation.token,
    tokenPreview: invitation.tokenPreview ?? null,
    projectId: String(invitation.projectId),
    senderId: String(invitation.senderId),
    status: invitation.status,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
    sentAt: invitation.sentAt,
  };
}

export const invitationsApi = {
  async listProjectInvitations(projectId: string): Promise<ProjectInvitation[]> {
    const response = await httpClient.get<BackendInvitation[]>(
      `/projects/${projectId}/invitations`
    );
    return response.data.map(mapInvitation);
  },

  async createInvitation(
    projectId: string,
    email: string,
    role: ProjectInvitation["role"]
  ): Promise<ProjectInvitation> {
    const response = await httpClient.post<BackendInvitation>(
      `/projects/${projectId}/invitations`,
      { email, role }
    );
    return mapInvitation(response.data);
  },

  async resendInvitation(
    projectId: string,
    invitationId: string
  ): Promise<ProjectInvitation> {
    const response = await httpClient.post<BackendInvitation>(
      `/projects/${projectId}/invitations/${invitationId}/resend`
    );
    return mapInvitation(response.data);
  },

  async cancelInvitation(
    projectId: string,
    invitationId: string
  ): Promise<ProjectInvitation> {
    const response = await httpClient.patch<BackendInvitation>(
      `/projects/${projectId}/invitations/${invitationId}/cancel`
    );
    return mapInvitation(response.data);
  },

  async acceptInvitation(token: string): Promise<void> {
    await httpClient.post(`/invitations/${token}/accept`);
  },
};
