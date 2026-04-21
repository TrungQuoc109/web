-- AlterEnum
ALTER TYPE "InvitationStatus" ADD VALUE 'CANCELED';

-- AlterTable
ALTER TABLE "Invitation"
ADD COLUMN "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE INDEX "Invitation_projectId_role_status_idx" ON "Invitation"("projectId", "role", "status");
