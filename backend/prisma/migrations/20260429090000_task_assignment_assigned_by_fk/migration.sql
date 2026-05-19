/*
  Ensure TaskAssignment.assignedById points to User(id) when present.
  This improves auditability and prevents orphaned references.
*/

CREATE INDEX IF NOT EXISTS "TaskAssignment_assignedById_idx"
  ON "TaskAssignment"("assignedById");

ALTER TABLE "TaskAssignment"
  ADD CONSTRAINT "TaskAssignment_assignedById_fkey"
  FOREIGN KEY ("assignedById")
  REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

