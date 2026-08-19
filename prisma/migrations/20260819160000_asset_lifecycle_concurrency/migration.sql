DROP TRIGGER "SnapshotAsset_enforce_ownership" ON "SnapshotAsset";
DROP TRIGGER "SnapshotAsset_require_ready_asset" ON "SnapshotAsset";

CREATE TRIGGER "SnapshotAsset_enforce_ownership" BEFORE INSERT OR UPDATE OF "snapshotId", "assetId" ON "SnapshotAsset"
FOR EACH ROW EXECUTE FUNCTION enforce_snapshot_asset_ownership();

CREATE OR REPLACE FUNCTION enforce_ready_snapshot_asset() RETURNS trigger AS $$
BEGIN
  PERFORM 1
  FROM "Asset"
  WHERE "id" = NEW."assetId" AND "status" = 'READY'
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'only ready assets can enter a published snapshot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "SnapshotAsset_require_ready_asset" BEFORE INSERT OR UPDATE OF "assetId" ON "SnapshotAsset"
FOR EACH ROW EXECUTE FUNCTION enforce_ready_snapshot_asset();

CREATE OR REPLACE FUNCTION enforce_ready_asset_quota() RETURNS trigger AS $$
DECLARE
  quota BIGINT;
  used_bytes BIGINT;
BEGIN
  IF NEW."status" <> 'READY' THEN
    RETURN NEW;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(NEW."invitationId"::text));
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
