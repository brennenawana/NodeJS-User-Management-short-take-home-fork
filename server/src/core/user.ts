import { z } from "zod";

export const MAX_NAME_LENGTH = 80;

export const zipSchema = z.string().regex(/^\d{5}$/);

export const nameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);

// What a location provider hands back for a zip. The offset is in seconds and
// is the only notion of time zone the app keeps.
export const locationSchema = z.object({
  city: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  utcOffsetSeconds: z.number().int().min(-14 * 3600).max(14 * 3600),
});

export type Location = z.infer<typeof locationSchema>;

/**
 * Why a user does or doesn't have a location:
 * - located: the provider placed the zip.
 * - pending: the provider was unreachable; the client retries.
 * - cantLocate: the zip is real but the provider can't place it. Retrying won't help.
 * - invalidZip: the zip isn't (or is no longer) a real US zip.
 */
export const UNLOCATED_STATUSES = ["pending", "cantLocate", "invalidZip"] as const;
export type UnlocatedStatus = (typeof UNLOCATED_STATUSES)[number];
export type LocationStatus = "located" | UnlocatedStatus;

const locatedFields = locationSchema.extend({
  locationUpdatedAt: z.string().datetime(),
  locationStatus: z.literal("located"),
});

const unlocatedFields = z.object({
  city: z.null(),
  lat: z.null(),
  lon: z.null(),
  utcOffsetSeconds: z.null(),
  locationUpdatedAt: z.null(),
  locationStatus: z.enum(UNLOCATED_STATUSES),
});

export type LocationFields = z.infer<typeof locatedFields> | z.infer<typeof unlocatedFields>;

export function unlocated(locationStatus: UnlocatedStatus): LocationFields {
  return { city: null, lat: null, lon: null, utcOffsetSeconds: null, locationUpdatedAt: null, locationStatus };
}

const baseUser = z.object({
  id: z.string().min(1),
  name: nameSchema,
  zip: zipSchema,
});

// Records saved before locationStatus existed get it from whether they have a location.
function withStatus(raw: unknown) {
  if (!raw || typeof raw !== "object" || "locationStatus" in raw) return raw;
  const located = (raw as { utcOffsetSeconds?: unknown }).utcOffsetSeconds != null;
  return { ...raw, locationStatus: located ? "located" : "pending" };
}

// A stored user either has a full location or none at all, with the reason why.
export const userSchema = z.preprocess(withStatus, z.union([baseUser.merge(locatedFields), baseUser.merge(unlocatedFields)]));

export type User = z.infer<typeof userSchema>;

export const newUserSchema = z.object({ name: nameSchema, zip: zipSchema });
export type NewUser = z.infer<typeof newUserSchema>;

export const userPatchSchema = newUserSchema.partial();
export type UserPatch = z.infer<typeof userPatchSchema>;
