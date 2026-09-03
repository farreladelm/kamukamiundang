CREATE FUNCTION enforce_ready_snapshot_asset() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Asset" WHERE "id" = NEW."assetId" AND "status" = 'READY') THEN
    RAISE EXCEPTION 'only ready assets can enter a published snapshot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "SnapshotAsset_require_ready_asset" BEFORE INSERT ON "SnapshotAsset"
FOR EACH ROW EXECUTE FUNCTION enforce_ready_snapshot_asset();
