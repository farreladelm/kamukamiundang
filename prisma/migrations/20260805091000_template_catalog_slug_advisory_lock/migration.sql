CREATE OR REPLACE FUNCTION "ensure_template_slug_not_reused"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Serialize canonical and alias claims for same candidate slug across tables.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW."slug", 0));

  IF TG_TABLE_NAME = 'TemplateCatalog' THEN
    IF EXISTS (
      SELECT 1
      FROM "TemplateSlugAlias"
      WHERE "slug" = NEW."slug"
        AND "templateCatalogId" <> NEW."id"
    ) THEN
      RAISE EXCEPTION 'template slug is already an alias for another catalog: %', NEW."slug"
        USING ERRCODE = '23505';
    END IF;
  ELSIF EXISTS (
    SELECT 1
    FROM "TemplateCatalog"
    WHERE "slug" = NEW."slug"
      AND "id" <> NEW."templateCatalogId"
  ) THEN
    RAISE EXCEPTION 'template slug is already canonical for another catalog: %', NEW."slug"
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;
