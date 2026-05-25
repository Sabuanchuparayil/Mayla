import { db } from '@/lib/db';

export type NearbyProfile = {
  userId: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  country: string;
  distanceMeters: number;
  latitude: number | null;
  longitude: number | null;
};

export type ProfileCoords = { lat: number; lng: number };

let postgisAvailable: boolean | null = null;

async function hasPostGIS(): Promise<boolean> {
  if (postgisAvailable !== null) return postgisAvailable;

  try {
    const rows = await db.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'postgis'
      ) AS exists
    `;
    postgisAvailable = rows[0]?.exists ?? false;
  } catch {
    postgisAvailable = false;
  }

  return postgisAvailable;
}

/** Resolve effective search coordinates (travel mode overrides home location). */
export async function getEffectiveProfileCoords(userId: string): Promise<ProfileCoords | null> {
  if (await hasPostGIS()) {
    const rows = await db.$queryRaw<
      { lat: number | null; lng: number | null; travelLat: number | null; travelLng: number | null; travelModeEnabled: boolean }[]
    >`
      SELECT
        p."travelModeEnabled" AS "travelModeEnabled",
        ST_Y(p."travelLocation"::geometry) AS "travelLat",
        ST_X(p."travelLocation"::geometry) AS "travelLng",
        ST_Y(p.location::geometry) AS lat,
        ST_X(p.location::geometry) AS lng
      FROM profiles p
      WHERE p."userId" = ${userId}
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) return null;

    if (row.travelModeEnabled && row.travelLat != null && row.travelLng != null) {
      return { lat: row.travelLat, lng: row.travelLng };
    }
    if (row.lat != null && row.lng != null) {
      return { lat: row.lat, lng: row.lng };
    }
  }

  const rows = await db.$queryRaw<
    { lat: number | null; lng: number | null; travelLat: number | null; travelLng: number | null; travelModeEnabled: boolean }[]
  >`
    SELECT
      p."travelModeEnabled" AS "travelModeEnabled",
      p."travelLatitude" AS "travelLat",
      p."travelLongitude" AS "travelLng",
      p.latitude AS lat,
      p.longitude AS lng
    FROM profiles p
    WHERE p."userId" = ${userId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  if (row.travelModeEnabled && row.travelLat != null && row.travelLng != null) {
    return { lat: row.travelLat, lng: row.travelLng };
  }
  if (row.lat != null && row.lng != null) {
    return { lat: row.lat, lng: row.lng };
  }

  return null;
}

/** Update profile coordinates; uses PostGIS geography when available. */
export async function syncProfileLocation(
  profileId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  if (await hasPostGIS()) {
    await db.$executeRaw`
      UPDATE profiles
      SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          latitude = ${latitude},
          longitude = ${longitude},
          "updatedAt" = NOW()
      WHERE id = ${profileId}
    `;
    return;
  }

  await db.$executeRaw`
    UPDATE profiles
    SET latitude = ${latitude},
        longitude = ${longitude},
        "updatedAt" = NOW()
    WHERE id = ${profileId}
  `;
}

/** Update travel-mode coordinates; uses PostGIS geography when available. */
export async function syncTravelLocation(
  profileId: string,
  latitude: number | null,
  longitude: number | null,
): Promise<void> {
  if (latitude == null || longitude == null) {
    if (await hasPostGIS()) {
      await db.$executeRaw`
        UPDATE profiles
        SET "travelLocation" = NULL,
            "travelLatitude" = NULL,
            "travelLongitude" = NULL,
            "updatedAt" = NOW()
        WHERE id = ${profileId}
      `;
      return;
    }

    await db.$executeRaw`
      UPDATE profiles
      SET "travelLatitude" = NULL,
          "travelLongitude" = NULL,
          "updatedAt" = NOW()
      WHERE id = ${profileId}
    `;
    return;
  }

  if (await hasPostGIS()) {
    await db.$executeRaw`
      UPDATE profiles
      SET "travelLocation" = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          "travelLatitude" = ${latitude},
          "travelLongitude" = ${longitude},
          "updatedAt" = NOW()
      WHERE id = ${profileId}
    `;
    return;
  }

  await db.$executeRaw`
    UPDATE profiles
    SET "travelLatitude" = ${latitude},
        "travelLongitude" = ${longitude},
        "updatedAt" = NOW()
    WHERE id = ${profileId}
  `;
}

/** Haversine fallback for local dev without PostGIS. */
async function findNearbyProfilesHaversine(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  excludeUserId: string,
  limit: number,
): Promise<NearbyProfile[]> {
  return db.$queryRaw<NearbyProfile[]>`
    SELECT
      p."userId" AS "userId",
      p."displayName" AS "displayName",
      p.bio AS bio,
      p.city AS city,
      p.country AS country,
      COALESCE(
        CASE WHEN p."travelModeEnabled" = true THEN p."travelLatitude" ELSE NULL END,
        p.latitude
      ) AS latitude,
      COALESCE(
        CASE WHEN p."travelModeEnabled" = true THEN p."travelLongitude" ELSE NULL END,
        p.longitude
      ) AS longitude,
      (
        6371000 * acos(
          LEAST(
            1.0,
            GREATEST(
              -1.0,
              cos(radians(${latitude})) * cos(radians(
                COALESCE(
                  CASE WHEN p."travelModeEnabled" = true THEN p."travelLatitude" ELSE NULL END,
                  p.latitude
                )
              ))
              * cos(radians(
                COALESCE(
                  CASE WHEN p."travelModeEnabled" = true THEN p."travelLongitude" ELSE NULL END,
                  p.longitude
                )
              ) - radians(${longitude}))
              + sin(radians(${latitude})) * sin(radians(
                COALESCE(
                  CASE WHEN p."travelModeEnabled" = true THEN p."travelLatitude" ELSE NULL END,
                  p.latitude
                )
              ))
            )
          )
        )
      ) AS "distanceMeters"
    FROM profiles p
    INNER JOIN users u ON u.id = p."userId"
    WHERE COALESCE(
            CASE WHEN p."travelModeEnabled" = true THEN p."travelLatitude" ELSE NULL END,
            p.latitude
          ) IS NOT NULL
      AND COALESCE(
            CASE WHEN p."travelModeEnabled" = true THEN p."travelLongitude" ELSE NULL END,
            p.longitude
          ) IS NOT NULL
      AND p."userId" != ${excludeUserId}
      AND u."onboardingCompleted" = true
      AND (
        6371000 * acos(
          LEAST(
            1.0,
            GREATEST(
              -1.0,
              cos(radians(${latitude})) * cos(radians(
                COALESCE(
                  CASE WHEN p."travelModeEnabled" = true THEN p."travelLatitude" ELSE NULL END,
                  p.latitude
                )
              ))
              * cos(radians(
                COALESCE(
                  CASE WHEN p."travelModeEnabled" = true THEN p."travelLongitude" ELSE NULL END,
                  p.longitude
                )
              ) - radians(${longitude}))
              + sin(radians(${latitude})) * sin(radians(
                COALESCE(
                  CASE WHEN p."travelModeEnabled" = true THEN p."travelLatitude" ELSE NULL END,
                  p.latitude
                )
              ))
            )
          )
        )
      ) <= ${radiusMeters}
    ORDER BY "distanceMeters" ASC
    LIMIT ${limit}
  `;
}

/** Find profiles within radius (meters); PostGIS in prod, haversine fallback locally. */
export async function findNearbyProfiles(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  excludeUserId: string,
  limit = 20,
): Promise<NearbyProfile[]> {
  if (!(await hasPostGIS())) {
    return findNearbyProfilesHaversine(
      latitude,
      longitude,
      radiusMeters,
      excludeUserId,
      limit,
    );
  }

  try {
    return await db.$queryRaw<NearbyProfile[]>`
      SELECT
        p."userId" AS "userId",
        p."displayName" AS "displayName",
        p.bio AS bio,
        p.city AS city,
        p.country AS country,
        ST_Y(COALESCE(
          CASE WHEN p."travelModeEnabled" = true THEN p."travelLocation" ELSE NULL END,
          p.location
        )::geometry) AS latitude,
        ST_X(COALESCE(
          CASE WHEN p."travelModeEnabled" = true THEN p."travelLocation" ELSE NULL END,
          p.location
        )::geometry) AS longitude,
        ST_Distance(
          COALESCE(
            CASE WHEN p."travelModeEnabled" = true THEN p."travelLocation" ELSE NULL END,
            p.location
          ),
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) AS "distanceMeters"
      FROM profiles p
      INNER JOIN users u ON u.id = p."userId"
      WHERE COALESCE(
              CASE WHEN p."travelModeEnabled" = true THEN p."travelLocation" ELSE NULL END,
              p.location
            ) IS NOT NULL
        AND p."userId" != ${excludeUserId}
        AND u."onboardingCompleted" = true
        AND ST_DWithin(
          COALESCE(
            CASE WHEN p."travelModeEnabled" = true THEN p."travelLocation" ELSE NULL END,
            p.location
          ),
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY "distanceMeters" ASC
      LIMIT ${limit}
    `;
  } catch {
    return findNearbyProfilesHaversine(
      latitude,
      longitude,
      radiusMeters,
      excludeUserId,
      limit,
    );
  }
}
