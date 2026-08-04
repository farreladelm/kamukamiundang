CREATE TABLE "TemplateVisibility" (
    "id" UUID NOT NULL,
    "templateKey" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "updatedByAdminId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateVisibility_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TemplateVisibility_templateKey_templateVersion_key"
  ON "TemplateVisibility"("templateKey", "templateVersion");
CREATE INDEX "TemplateVisibility_updatedByAdminId_idx"
  ON "TemplateVisibility"("updatedByAdminId");

ALTER TABLE "TemplateVisibility"
  ADD CONSTRAINT "TemplateVisibility_updatedByAdminId_fkey"
  FOREIGN KEY ("updatedByAdminId") REFERENCES "Admin"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
