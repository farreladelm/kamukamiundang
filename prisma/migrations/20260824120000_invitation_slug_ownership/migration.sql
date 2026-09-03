ALTER TABLE "Order" ADD COLUMN "requestedInvitationSlug" TEXT;

ALTER TABLE "Invitation" ALTER COLUMN "slug" DROP NOT NULL;

CREATE UNIQUE INDEX "Order_requestedInvitationSlug_key" ON "Order"("requestedInvitationSlug");

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_normalized_requested_invitation_slug_check"
  CHECK ("requestedInvitationSlug" = lower("requestedInvitationSlug"));
