import { InvalidZip, ProviderUnavailable, UserNotFound, ZipNotFound } from "./errors.js";
import type { Clock, LocationProvider, UsersRepo, ZipDirectory } from "./ports.js";
import {
  newUserSchema,
  unlocated,
  userPatchSchema,
  type LocationFields,
  type NewUser,
  type User,
  type UserPatch,
} from "./user.js";

export interface UsersServiceDeps {
  repo: UsersRepo;
  locationProvider: LocationProvider;
  zipDirectory: ZipDirectory;
  clock: Clock;
  newId: () => string;
}

export type UsersService = ReturnType<typeof createUsersService>;

export function createUsersService({ repo, locationProvider, zipDirectory, clock, newId }: UsersServiceDeps) {
  function mustBeReal(zip: string) {
    if (!zipDirectory.has(zip)) throw new InvalidZip(zip);
  }

  async function resolve(zip: string): Promise<LocationFields> {
    const location = await locationProvider.lookupZip(zip);
    return { ...location, locationUpdatedAt: clock.now().toISOString(), locationStatus: "located" };
  }

  // For a real zip: a provider that can't place it flags the user, and an outage
  // saves them as pending so the client retries.
  async function resolveOrFlag(zip: string): Promise<LocationFields> {
    try {
      return await resolve(zip);
    } catch (error) {
      if (error instanceof ZipNotFound) return unlocated("cantLocate");
      if (error instanceof ProviderUnavailable) return unlocated("pending");
      throw error;
    }
  }

  async function mustGet(id: string): Promise<User> {
    const user = await repo.get(id);
    if (!user) throw new UserNotFound(id);
    return user;
  }

  return {
    async list(): Promise<User[]> {
      const users = await repo.list();
      return users.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
    },

    get(id: string): Promise<User | undefined> {
      return repo.get(id);
    },

    async create(input: NewUser): Promise<User> {
      const { name, zip } = newUserSchema.parse(input);
      mustBeReal(zip);
      const user: User = { id: newId(), name, zip, ...(await resolveOrFlag(zip)) };
      await repo.create(user);
      return user;
    },

    async update(id: string, patch: UserPatch): Promise<User> {
      const changes = userPatchSchema.parse(patch);
      const current = await mustGet(id);
      const zip = changes.zip ?? current.zip;
      if (zip !== current.zip) mustBeReal(zip);
      const location = zip === current.zip ? pickLocation(current) : await resolveOrFlag(zip);
      const user: User = { id, name: changes.name ?? current.name, zip, ...location };
      await repo.update(user);
      return user;
    },

    /** Looks the current zip up again. An outage throws and leaves the record alone; anything else is saved. */
    async refreshLocation(id: string): Promise<User> {
      const current = await mustGet(id);
      let location: LocationFields;
      if (!zipDirectory.has(current.zip)) location = unlocated("invalidZip");
      else {
        try {
          location = await resolve(current.zip);
        } catch (error) {
          if (!(error instanceof ZipNotFound)) throw error;
          location = unlocated("cantLocate");
        }
      }
      const user: User = { ...current, ...location };
      await repo.update(user);
      return user;
    },

    async remove(id: string): Promise<void> {
      if (!(await repo.delete(id))) throw new UserNotFound(id);
    },

    async lookupZip(zip: string) {
      mustBeReal(zip);
      return locationProvider.lookupZip(zip);
    },
  };
}

function pickLocation(user: User): LocationFields {
  const { city, lat, lon, utcOffsetSeconds, locationUpdatedAt, locationStatus } = user;
  return { city, lat, lon, utcOffsetSeconds, locationUpdatedAt, locationStatus } as LocationFields;
}
