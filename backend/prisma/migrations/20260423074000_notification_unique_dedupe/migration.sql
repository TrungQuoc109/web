/*
  This migration makes Notification.createMany({ skipDuplicates: true }) effective by
  enforcing uniqueness at the DB level.

  We dedupe existing rows first to avoid failing on pre-existing duplicates.
*/

DELETE FROM "Notification" AS n
USING "Notification" AS dup
WHERE n.id > dup.id
  AND n."recipientId" = dup."recipientId"
  AND n."activityId" = dup."activityId"
  AND n."type" = dup."type";

CREATE UNIQUE INDEX "Notification_recipientId_activityId_type_key"
  ON "Notification"("recipientId", "activityId", "type");

