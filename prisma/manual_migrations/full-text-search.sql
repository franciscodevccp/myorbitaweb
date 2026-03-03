-- Full-Text Search para BookFragment
-- Ejecutar después de las migraciones de Prisma:
--   psql -U myorbita_user -d myorbita_db -f prisma/manual_migrations/full-text-search.sql

ALTER TABLE "BookFragment"
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION update_fragment_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('pg_catalog.spanish', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fragment_search_update ON "BookFragment";
CREATE TRIGGER fragment_search_update
  BEFORE INSERT OR UPDATE OF content ON "BookFragment"
  FOR EACH ROW
  EXECUTE FUNCTION update_fragment_search_vector();

CREATE INDEX IF NOT EXISTS fragment_search_idx
  ON "BookFragment" USING GIN(search_vector);

UPDATE "BookFragment"
SET search_vector = to_tsvector('pg_catalog.spanish', COALESCE(content, ''))
WHERE search_vector IS NULL;
