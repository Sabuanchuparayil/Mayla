-- Align profiles with PostGIS geography columns (location + travelLocation)

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS not available — geo queries will use latitude/longitude only';
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326);
    ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "travelLocation" geography(Point, 4326);

    UPDATE "profiles"
    SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
    WHERE "location" IS NULL
      AND "latitude" IS NOT NULL
      AND "longitude" IS NOT NULL;

    UPDATE "profiles"
    SET "travelLocation" = ST_SetSRID(ST_MakePoint("travelLongitude", "travelLatitude"), 4326)::geography
    WHERE "travelLocation" IS NULL
      AND "travelLatitude" IS NOT NULL
      AND "travelLongitude" IS NOT NULL;

    CREATE INDEX IF NOT EXISTS "profiles_location_idx" ON "profiles" USING GIST ("location");
    CREATE INDEX IF NOT EXISTS "profiles_travelLocation_idx" ON "profiles" USING GIST ("travelLocation");
  END IF;
END $$;
