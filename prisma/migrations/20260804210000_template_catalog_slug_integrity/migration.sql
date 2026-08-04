-- One catalog may have many historical aliases, but only one current alias.
DROP INDEX "TemplateSlugAlias_templateCatalogId_isCurrent_idx";
CREATE UNIQUE INDEX "TemplateSlugAlias_one_current_per_catalog_key"
  ON "TemplateSlugAlias"("templateCatalogId")
  WHERE "isCurrent" = true;

-- A slug exposed as an alias cannot become another catalog's canonical slug,
-- and a canonical slug cannot be assigned to another catalog's alias.
CREATE OR REPLACE FUNCTION "ensure_template_slug_not_reused"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
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

CREATE TRIGGER "TemplateCatalog_slug_no_reuse"
  BEFORE INSERT OR UPDATE OF "slug" ON "TemplateCatalog"
  FOR EACH ROW EXECUTE FUNCTION "ensure_template_slug_not_reused"();

CREATE TRIGGER "TemplateSlugAlias_slug_no_reuse"
  BEFORE INSERT OR UPDATE OF "slug", "templateCatalogId" ON "TemplateSlugAlias"
  FOR EACH ROW EXECUTE FUNCTION "ensure_template_slug_not_reused"();
