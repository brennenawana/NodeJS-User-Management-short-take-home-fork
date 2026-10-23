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

const locatedFields = locationSchema.extend({
  locationUpdatedAt: z.string().datetime(),
});

const pendingFields = z.object({
  city: z.null(),
  lat: z.null(),
  lon: z.null(),
  utcOffsetSeconds: z.null(),
  locationUpdatedAt: z.null(),
});

export type LocationFields = z.infer<typeof locatedFields> | z.infer<typeof pendingFields>;

export const PENDING_LOCATION: LocationFields = {
  city: null,
  lat: null,
  lon: null,
  utcOffsetSeconds: null,
  locationUpdatedAt: null,
};

const baseUser = z.object({
  id: z.string().min(1),
  name: nameSchema,
  zip: zipSchema,
});

// A stored user either has a full location or none at all ("pending location").
export const userSchema = z.union([baseUser.merge(locatedFields), baseUser.merge(pendingFields)]);

export type User = z.infer<typeof userSchema>;

export const newUserSchema = z.object({ name: nameSchema, zip: zipSchema });
export type NewUser = z.infer<typeof newUserSchema>;

export const userPatchSchema = newUserSchema.partial();
export type UserPatch = z.infer<typeof userPatchSchema>;
