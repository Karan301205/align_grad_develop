-- Candidate skills as rows, for recruiter search and ranking (GET/POST /recruiter/candidates…).
-- Profile.skills (JSON) stays the source of truth; the trigger below rewrites a profile's rows
-- whenever its skills change, from any code path (main app, admin app, scripts). A failure in
-- the trigger is logged as a WARNING and never blocks the profile save.

-- CreateTable
CREATE TABLE "CandidateSkill" (
    "profileId" TEXT NOT NULL,
    "normKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "verifiedRating" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CandidateSkill_pkey" PRIMARY KEY ("profileId","normKey")
);

-- CreateIndex
CREATE INDEX "CandidateSkill_normKey_score_idx" ON "CandidateSkill"("normKey", "score");

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Skill rows of one Profile.skills value. normKey follows the skill registry's normalizeToken
-- (lower case; . _ - / & , ( ) become spaces; spaces collapsed). score = verifiedRating when above
-- 0, else the self rating. Odd entries (no name, text ratings) are skipped, never raised.
CREATE OR REPLACE FUNCTION candidate_skill_rows(skills jsonb)
RETURNS TABLE (norm_key text, name text, score integer, verified_rating integer)
LANGUAGE sql IMMUTABLE AS $$
  WITH entries AS (
    SELECT CASE jsonb_typeof(s) WHEN 'object' THEN s->>'name' WHEN 'string' THEN s #>> '{}' END AS raw_name,
           CASE WHEN jsonb_typeof(s) = 'object' THEN s->>'rating' END AS raw_rating,
           CASE WHEN jsonb_typeof(s) = 'object' THEN s->>'verifiedRating' END AS raw_verified
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(skills) = 'array' THEN skills ELSE '[]'::jsonb END) AS s
  ),
  parsed AS (
    SELECT btrim(raw_name) AS name,
           btrim(regexp_replace(regexp_replace(lower(raw_name), '[._/&,()-]+', ' ', 'g'), '[[:space:]]+', ' ', 'g')) AS norm_key,
           CASE WHEN btrim(coalesce(raw_rating, '')) ~ '^[0-9]{1,4}(\.[0-9]+)?$' THEN round(btrim(raw_rating)::numeric)::int ELSE 0 END AS rating,
           CASE WHEN btrim(coalesce(raw_verified, '')) ~ '^[0-9]{1,4}(\.[0-9]+)?$' THEN round(btrim(raw_verified)::numeric)::int ELSE 0 END AS verified
    FROM entries
    WHERE raw_name IS NOT NULL
  )
  SELECT norm_key, max(name), max(CASE WHEN verified > 0 THEN verified ELSE rating END), max(verified)
  FROM parsed
  WHERE norm_key <> ''
  GROUP BY norm_key
$$;

-- Rewrites one profile's rows. Table and helper are qualified with the trigger's own schema,
-- so it works whatever search_path the writing connection has.
CREATE OR REPLACE FUNCTION candidate_skills_sync() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE format('DELETE FROM %I."CandidateSkill" WHERE "profileId" = $1', TG_TABLE_SCHEMA) USING NEW."id";
    EXECUTE format(
      'INSERT INTO %I."CandidateSkill" ("profileId", "normKey", "name", "score", "verifiedRating")
       SELECT $1, r.norm_key, r.name, r.score, r.verified_rating FROM %I.candidate_skill_rows($2) AS r',
      TG_TABLE_SCHEMA, TG_TABLE_SCHEMA
    ) USING NEW."id", NEW."skills";
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'candidate_skills_sync: skills of profile % were not indexed: %', NEW."id", SQLERRM;
  END;
  RETURN NEW;
END
$$;

CREATE TRIGGER candidate_skills_on_insert
  AFTER INSERT ON "Profile"
  FOR EACH ROW EXECUTE FUNCTION candidate_skills_sync();

CREATE TRIGGER candidate_skills_on_update
  AFTER UPDATE OF "skills" ON "Profile"
  FOR EACH ROW WHEN (OLD."skills" IS DISTINCT FROM NEW."skills")
  EXECUTE FUNCTION candidate_skills_sync();

-- Fill the table from every existing profile.
INSERT INTO "CandidateSkill" ("profileId", "normKey", "name", "score", "verifiedRating")
SELECT p."id", r.norm_key, r.name, r.score, r.verified_rating
FROM "Profile" p
CROSS JOIN LATERAL candidate_skill_rows(p."skills") AS r;
