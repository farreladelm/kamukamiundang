CREATE TABLE "MusicLibraryTrack" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "storagePath" TEXT NOT NULL,
    "byteSize" BIGINT NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "failureCode" TEXT,
    "uploadedByAdminId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "MusicLibraryTrack_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MusicLibraryTrack_storagePath_key" UNIQUE ("storagePath")
);

CREATE INDEX "MusicLibraryTrack_status_idx" ON "MusicLibraryTrack"("status");
CREATE INDEX "MusicLibraryTrack_uploadedByAdminId_idx" ON "MusicLibraryTrack"("uploadedByAdminId");
ALTER TABLE "MusicLibraryTrack" ADD CONSTRAINT "MusicLibraryTrack_uploadedByAdminId_fkey" FOREIGN KEY ("uploadedByAdminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
