-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'ACTIVATED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'AUDIO');

-- CreateEnum
CREATE TYPE "SessionActorType" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RsvpAttendance" AS ENUM ('ATTENDING', 'NOT_ATTENDING', 'UNDECIDED');

-- CreateEnum
CREATE TYPE "WishVisibility" AS ENUM ('VISIBLE', 'HIDDEN');

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "templateKey" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "contentSchemaVersion" INTEGER NOT NULL,
    "paletteKey" TEXT NOT NULL,
    "priceInRupiah" INTEGER NOT NULL,
    "photoLimit" INTEGER NOT NULL,
    "storageQuotaBytes" BIGINT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "templateKey" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "contentSchemaVersion" INTEGER NOT NULL,
    "paletteKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'DRAFT',
    "editingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationContent" (
    "id" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "content" JSONB NOT NULL,
    "contentVersion" INTEGER NOT NULL DEFAULT 0,
    "contentSchemaVersion" INTEGER NOT NULL,
    "updatedByActorType" "SessionActorType" NOT NULL,
    "updatedByActorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedSnapshot" (
    "id" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "templateKey" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "contentSchemaVersion" INTEGER NOT NULL,
    "paletteKey" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishedSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnapshotAsset" (
    "snapshotId" UUID NOT NULL,
    "assetId" UUID NOT NULL,

    CONSTRAINT "SnapshotAsset_pkey" PRIMARY KEY ("snapshotId","assetId")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "type" "AssetType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "storagePath" TEXT NOT NULL,
    "byteSize" BIGINT NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "failureCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "actorType" "SessionActorType" NOT NULL,
    "customerId" UUID,
    "adminId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "attendance" "RsvpAttendance" NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "eventKey" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wish" (
    "id" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "visibility" "WishVisibility" NOT NULL DEFAULT 'VISIBLE',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Wish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "actorType" "SessionActorType",
    "actorId" UUID,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_orderId_key" ON "Invitation"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_slug_key" ON "Invitation"("slug");

-- CreateIndex
CREATE INDEX "Invitation_customerId_idx" ON "Invitation"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationContent_invitationId_key" ON "InvitationContent"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedSnapshot_invitationId_key" ON "PublishedSnapshot"("invitationId");

-- CreateIndex
CREATE INDEX "SnapshotAsset_assetId_idx" ON "SnapshotAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_storagePath_key" ON "Asset"("storagePath");

-- CreateIndex
CREATE INDEX "Asset_invitationId_status_idx" ON "Asset"("invitationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_customerId_idx" ON "Session"("customerId");

-- CreateIndex
CREATE INDEX "Session_adminId_idx" ON "Session"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_tokenHash_key" ON "MagicLink"("tokenHash");

-- CreateIndex
CREATE INDEX "MagicLink_invitationId_idx" ON "MagicLink"("invitationId");

-- CreateIndex
CREATE INDEX "Rsvp_invitationId_createdAt_idx" ON "Rsvp"("invitationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Rsvp_invitationId_idempotencyKey_key" ON "Rsvp"("invitationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "Wish_invitationId_createdAt_idx" ON "Wish"("invitationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Wish_invitationId_idempotencyKey_key" ON "Wish"("invitationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationContent" ADD CONSTRAINT "InvitationContent_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedSnapshot" ADD CONSTRAINT "PublishedSnapshot_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnapshotAsset" ADD CONSTRAINT "SnapshotAsset_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "PublishedSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnapshotAsset" ADD CONSTRAINT "SnapshotAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Admin" ADD CONSTRAINT "Admin_email_normalized_check" CHECK ("email" = lower("email"));
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_email_key" UNIQUE ("email");
ALTER TABLE "Order" ADD CONSTRAINT "Order_snapshot_nonnegative_check" CHECK ("templateVersion" >= 0 AND "contentSchemaVersion" >= 0 AND "priceInRupiah" >= 0 AND "photoLimit" >= 0 AND "storageQuotaBytes" >= 0);
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_normalized_slug_check" CHECK ("slug" = lower("slug"));
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_version_nonnegative_check" CHECK ("templateVersion" >= 0 AND "contentSchemaVersion" >= 0);
ALTER TABLE "InvitationContent" ADD CONSTRAINT "InvitationContent_version_nonnegative_check" CHECK ("contentVersion" >= 0 AND "contentSchemaVersion" >= 0);
ALTER TABLE "PublishedSnapshot" ADD CONSTRAINT "PublishedSnapshot_version_nonnegative_check" CHECK ("templateVersion" >= 0 AND "contentSchemaVersion" >= 0);
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_byte_size_nonnegative_check" CHECK ("byteSize" >= 0);
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_guest_count_nonnegative_check" CHECK ("guestCount" >= 0);
ALTER TABLE "Session" ADD CONSTRAINT "Session_actor_scope_check" CHECK (("actorType" = 'CUSTOMER' AND "customerId" IS NOT NULL AND "adminId" IS NULL) OR ("actorType" = 'ADMIN' AND "adminId" IS NOT NULL AND "customerId" IS NULL));
CREATE UNIQUE INDEX "MagicLink_active_invitation_key" ON "MagicLink"("invitationId") WHERE "consumedAt" IS NULL AND "revokedAt" IS NULL;

CREATE FUNCTION enforce_order_transition() RETURNS trigger AS $$
BEGIN
  IF NEW."status" = OLD."status" THEN
    RETURN NEW;
  END IF;
  IF (OLD."status" = 'PENDING' AND NEW."status" IN ('PAID', 'CANCELLED'))
    OR (OLD."status" = 'PAID' AND NEW."status" = 'ACTIVATED')
    OR (OLD."status" = 'PAID' AND NEW."status" = 'REFUNDED')
    OR (OLD."status" = 'ACTIVATED' AND NEW."status" = 'REFUNDED') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'invalid order status transition from % to %', OLD."status", NEW."status";
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Order_enforce_transition" BEFORE UPDATE OF "status" ON "Order"
FOR EACH ROW EXECUTE FUNCTION enforce_order_transition();

CREATE FUNCTION enforce_invitation_transition() RETURNS trigger AS $$
BEGIN
  IF NEW."status" = OLD."status" THEN
    RETURN NEW;
  END IF;
  IF (OLD."status" = 'DRAFT' AND NEW."status" IN ('PUBLISHED', 'ARCHIVED'))
    OR (OLD."status" = 'PUBLISHED' AND NEW."status" IN ('DRAFT', 'ARCHIVED')) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'invalid invitation status transition from % to %', OLD."status", NEW."status";
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Invitation_enforce_transition" BEFORE UPDATE OF "status" ON "Invitation"
FOR EACH ROW EXECUTE FUNCTION enforce_invitation_transition();

CREATE FUNCTION enforce_asset_transition() RETURNS trigger AS $$
BEGIN
  IF NEW."status" = OLD."status" THEN
    RETURN NEW;
  END IF;
  IF (OLD."status" = 'PENDING' AND NEW."status" IN ('PROCESSING', 'FAILED'))
    OR (OLD."status" = 'PROCESSING' AND NEW."status" IN ('READY', 'FAILED'))
    OR (OLD."status" IN ('READY', 'FAILED') AND NEW."status" = 'DELETED') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'invalid asset status transition from % to %', OLD."status", NEW."status";
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Asset_enforce_transition" BEFORE UPDATE OF "status" ON "Asset"
FOR EACH ROW EXECUTE FUNCTION enforce_asset_transition();

CREATE FUNCTION enforce_paid_activation() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Order" WHERE "id" = NEW."orderId" AND "status" = 'PAID') THEN
    RAISE EXCEPTION 'only paid orders can activate an invitation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Invitation_enforce_paid_activation" BEFORE INSERT ON "Invitation"
FOR EACH ROW EXECUTE FUNCTION enforce_paid_activation();

CREATE FUNCTION enforce_content_version_increment() RETURNS trigger AS $$
BEGIN
  IF NEW."contentVersion" <> OLD."contentVersion" + 1 THEN
    RAISE EXCEPTION 'content version must increment by one';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "InvitationContent_enforce_version_increment" BEFORE UPDATE ON "InvitationContent"
FOR EACH ROW EXECUTE FUNCTION enforce_content_version_increment();

CREATE FUNCTION enforce_snapshot_asset_ownership() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "PublishedSnapshot" snapshot
    JOIN "Asset" asset ON asset."id" = NEW."assetId"
    WHERE snapshot."id" = NEW."snapshotId" AND snapshot."invitationId" = asset."invitationId"
  ) THEN
    RAISE EXCEPTION 'snapshot asset must belong to the same invitation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "SnapshotAsset_enforce_ownership" BEFORE INSERT ON "SnapshotAsset"
FOR EACH ROW EXECUTE FUNCTION enforce_snapshot_asset_ownership();

CREATE FUNCTION enforce_published_asset_protection() RETURNS trigger AS $$
BEGIN
  IF NEW."status" = 'DELETED' AND EXISTS (SELECT 1 FROM "SnapshotAsset" WHERE "assetId" = NEW."id") THEN
    RAISE EXCEPTION 'published snapshot asset cannot be deleted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Asset_protect_published_reference" BEFORE UPDATE OF "status" ON "Asset"
FOR EACH ROW EXECUTE FUNCTION enforce_published_asset_protection();

CREATE FUNCTION enforce_ready_asset_quota() RETURNS trigger AS $$
DECLARE
  quota BIGINT;
  used_bytes BIGINT;
BEGIN
  IF NEW."status" <> 'READY' THEN
    RETURN NEW;
  END IF;
  SELECT orders."storageQuotaBytes" INTO quota
  FROM "Invitation" invitation
  JOIN "Order" orders ON orders."id" = invitation."orderId"
  WHERE invitation."id" = NEW."invitationId";
  SELECT COALESCE(SUM("byteSize"), 0) INTO used_bytes
  FROM "Asset"
  WHERE "invitationId" = NEW."invitationId" AND "status" = 'READY' AND "id" <> NEW."id";
  IF used_bytes + NEW."byteSize" > quota THEN
    RAISE EXCEPTION 'ready asset quota exceeded';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Asset_enforce_ready_quota" BEFORE INSERT OR UPDATE OF "status", "byteSize" ON "Asset"
FOR EACH ROW EXECUTE FUNCTION enforce_ready_asset_quota();
