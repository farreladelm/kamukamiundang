-- CreateEnum
CREATE TYPE "TemplateCatalogStatus" AS ENUM ('DRAFT', 'VISIBLE', 'HIDDEN', 'RETIRED');

-- CreateTable
CREATE TABLE "TemplateCategory" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateCatalog" (
    "id" UUID NOT NULL,
    "templateKey" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "priceInRupiah" INTEGER NOT NULL,
    "marketingThumbnail" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "status" "TemplateCatalogStatus" NOT NULL DEFAULT 'DRAFT',
    "updatedByAdminId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateSlugAlias" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "templateCatalogId" UUID NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateSlugAlias_pkey" PRIMARY KEY ("id")
);

-- Constraints and indexes
CREATE UNIQUE INDEX "TemplateCategory_key_key" ON "TemplateCategory"("key");
CREATE UNIQUE INDEX "TemplateCatalog_slug_key" ON "TemplateCatalog"("slug");
CREATE UNIQUE INDEX "TemplateCatalog_templateKey_templateVersion_key"
  ON "TemplateCatalog"("templateKey", "templateVersion");
CREATE UNIQUE INDEX "TemplateSlugAlias_slug_key" ON "TemplateSlugAlias"("slug");
CREATE INDEX "TemplateCategory_isActive_displayOrder_idx"
  ON "TemplateCategory"("isActive", "displayOrder");
CREATE INDEX "TemplateCatalog_categoryId_status_displayOrder_idx"
  ON "TemplateCatalog"("categoryId", "status", "displayOrder");
CREATE INDEX "TemplateCatalog_updatedByAdminId_idx"
  ON "TemplateCatalog"("updatedByAdminId");
CREATE INDEX "TemplateSlugAlias_templateCatalogId_isCurrent_idx"
  ON "TemplateSlugAlias"("templateCatalogId", "isCurrent");

ALTER TABLE "TemplateCategory"
  ADD CONSTRAINT "TemplateCategory_displayOrder_nonnegative"
  CHECK ("displayOrder" >= 0);
ALTER TABLE "TemplateCatalog"
  ADD CONSTRAINT "TemplateCatalog_templateVersion_nonnegative"
  CHECK ("templateVersion" >= 0),
  ADD CONSTRAINT "TemplateCatalog_priceInRupiah_nonnegative"
  CHECK ("priceInRupiah" >= 0),
  ADD CONSTRAINT "TemplateCatalog_displayOrder_nonnegative"
  CHECK ("displayOrder" >= 0);

ALTER TABLE "TemplateCatalog"
  ADD CONSTRAINT "TemplateCatalog_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "TemplateCategory"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TemplateCatalog"
  ADD CONSTRAINT "TemplateCatalog_updatedByAdminId_fkey"
  FOREIGN KEY ("updatedByAdminId") REFERENCES "Admin"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TemplateSlugAlias"
  ADD CONSTRAINT "TemplateSlugAlias_templateCatalogId_fkey"
  FOREIGN KEY ("templateCatalogId") REFERENCES "TemplateCatalog"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Approved launch categories.
INSERT INTO "TemplateCategory" ("id", "key", "name", "displayOrder", "isActive", "updatedAt")
VALUES
  ('11111111-1111-4111-8111-111111111111', 'klasik', 'Klasik', 10, true, CURRENT_TIMESTAMP),
  ('11111111-1111-4111-8111-111111111112', 'modern', 'Modern', 20, true, CURRENT_TIMESTAMP),
  ('11111111-1111-4111-8111-111111111113', 'botanical', 'Botanical', 30, true, CURRENT_TIMESTAMP);

-- Bootstrap current business metadata while preserving legacy visibility overrides.
INSERT INTO "TemplateCatalog" (
  "id", "templateKey", "templateVersion", "slug", "name", "categoryId",
  "description", "priceInRupiah", "marketingThumbnail", "displayOrder", "status",
  "updatedByAdminId", "createdAt", "updatedAt"
)
SELECT
  seed."id", seed."templateKey", seed."templateVersion", seed."slug", seed."name",
  category."id", seed."description", seed."priceInRupiah", NULL, seed."displayOrder",
  CASE WHEN COALESCE(visibility."isVisible", true)
    THEN 'VISIBLE'::"TemplateCatalogStatus"
    ELSE 'HIDDEN'::"TemplateCatalogStatus"
  END,
  visibility."updatedByAdminId",
  COALESCE(visibility."createdAt", CURRENT_TIMESTAMP),
  COALESCE(visibility."updatedAt", CURRENT_TIMESTAMP)
FROM (VALUES
  ('21111111-1111-4111-8111-111111111111'::uuid, 'template-1', 1, 'larasati', 'Larasati', 'klasik', 'Klasik Jawa yang tenang, dengan ritme editorial dan detail berbingkai.', 650000, 10),
  ('21111111-1111-4111-8111-111111111112'::uuid, 'template-2', 1, 'pesisir-senja', 'Pesisir Senja', 'modern', 'Modern hangat dengan garis horison, ruang lega, dan warna matahari sore.', 700000, 20),
  ('21111111-1111-4111-8111-111111111113'::uuid, 'template-3', 1, 'taman-aksara', 'Taman Aksara', 'botanical', 'Botanical kontemporer untuk perayaan intim dengan aksara yang lembut.', 750000, 30)
) AS seed("id", "templateKey", "templateVersion", "slug", "name", "categoryKey", "description", "priceInRupiah", "displayOrder")
JOIN "TemplateCategory" category ON category."key" = seed."categoryKey"
LEFT JOIN "TemplateVisibility" visibility
  ON visibility."templateKey" = seed."templateKey"
 AND visibility."templateVersion" = seed."templateVersion";

INSERT INTO "TemplateSlugAlias" ("id", "slug", "templateCatalogId", "isCurrent")
SELECT
  seed."aliasId", seed."slug", catalog."id", true
FROM (VALUES
  ('31111111-1111-4111-8111-111111111111'::uuid, 'larasati', 'template-1', 1),
  ('31111111-1111-4111-8111-111111111112'::uuid, 'pesisir-senja', 'template-2', 1),
  ('31111111-1111-4111-8111-111111111113'::uuid, 'taman-aksara', 'template-3', 1)
) AS seed("aliasId", "slug", "templateKey", "templateVersion")
JOIN "TemplateCatalog" catalog
  ON catalog."templateKey" = seed."templateKey"
 AND catalog."templateVersion" = seed."templateVersion";

-- TemplateVisibility remains during the additive transition. CAT-03..05 move
-- reads and writes before that legacy table is retired.
