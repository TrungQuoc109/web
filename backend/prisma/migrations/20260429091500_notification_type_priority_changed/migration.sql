/*
  Add NotificationType.PRIORITY_CHANGED for task priority updates.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'NotificationType'
      AND e.enumlabel = 'PRIORITY_CHANGED'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'PRIORITY_CHANGED';
  END IF;
END $$;

