-- Full-Text Search (FTS) Setup for Complaints
-- White-hat: Using PostgreSQL native FTS with pg_trgm for fuzzy matching

-- Add tsvector column for full-text search
ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Initial populate
UPDATE "complaints"
SET search_vector = to_tsvector('simple',
  coalesce("title",'') || ' ' || coalesce("body",'') || ' ' || coalesce("searchText",'')
);

-- Trigger function for automatic tsvector update
CREATE OR REPLACE FUNCTION complaint_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title,'') || ' ' || coalesce(NEW.body,'') || ' ' || coalesce(NEW.searchText,'')
  );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (idempotent)
DROP TRIGGER IF EXISTS complaint_tsvector_trigger ON "complaints";

-- Create trigger
CREATE TRIGGER complaint_tsvector_trigger
BEFORE INSERT OR UPDATE OF title, body, "searchText" ON "complaints"
FOR EACH ROW EXECUTE FUNCTION complaint_tsvector_update();

-- GIN indexes for FTS and fuzzy search
CREATE INDEX IF NOT EXISTS idx_complaint_searchvector
  ON "complaints" USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_brand_name_trgm
  ON "brands" USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_product_name_trgm
  ON "products" USING GIN (name gin_trgm_ops);

-- Evidence integrity constraint
ALTER TABLE "evidence_packs"
  DROP CONSTRAINT IF EXISTS evidence_merkle_len;

ALTER TABLE "evidence_packs"
  ADD CONSTRAINT evidence_merkle_len
  CHECK (char_length("merkleRoot") BETWEEN 16 AND 128);

-- Rating score constraints (white-hat: data integrity)
ALTER TABLE "ratings"
  DROP CONSTRAINT IF EXISTS rating_score_range;

ALTER TABLE "ratings"
  ADD CONSTRAINT rating_score_range
  CHECK (score >= 1 AND score <= 5);

ALTER TABLE "ratings"
  DROP CONSTRAINT IF EXISTS rating_nps_range;

ALTER TABLE "ratings"
  ADD CONSTRAINT rating_nps_range
  CHECK (nps IS NULL OR (nps >= -100 AND nps <= 100));

-- SLA hours constraint (white-hat: business logic validation)
ALTER TABLE "brands"
  DROP CONSTRAINT IF EXISTS brand_sla_positive;

ALTER TABLE "brands"
  ADD CONSTRAINT brand_sla_positive
  CHECK ("slaHours" > 0 AND "slaHours" <= 720); -- Max 30 days

-- Solution rate constraint (white-hat: valid percentage)
ALTER TABLE "brands"
  DROP CONSTRAINT IF EXISTS brand_solution_rate_range;

ALTER TABLE "brands"
  ADD CONSTRAINT brand_solution_rate_range
  CHECK ("solutionRate" IS NULL OR ("solutionRate" >= 0 AND "solutionRate" <= 1));

-- Comment for audit
COMMENT ON COLUMN "complaints"."search_vector" IS 'Auto-generated tsvector for full-text search';
COMMENT ON CONSTRAINT evidence_merkle_len ON "evidence_packs" IS 'Ensures merkle root is valid SHA-256/512 length';
COMMENT ON CONSTRAINT rating_score_range ON "ratings" IS 'Enforces 1-5 star rating range';
COMMENT ON CONSTRAINT rating_nps_range ON "ratings" IS 'Enforces NPS score range -100 to 100';
