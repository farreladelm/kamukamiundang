ALTER TABLE "Invitation"
  ADD CONSTRAINT "Invitation_published_slug_check"
  CHECK ("status" <> 'PUBLISHED' OR "slug" IS NOT NULL);
