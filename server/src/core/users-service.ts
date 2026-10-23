import { ProviderUnavailable, UserNotFound, ZipNotFound } from "./errors.js";
import type { Clock, LocationProvider, UsersRepo } from "./ports.js";
import {
  PENDING_LOCATION,
  newUserSchema,
  userPatchSchema,
  type LocationFields,
  type NewUser,
  type User,
  type UserPatch,
} from "./user.js";

export interface UsersServiceDeps {
  repo: UsersRepo;
  locationProvider: LocationProvider;
  clock: Clock;
  newId: () => string;
}

export type UsersService = ReturnType<typeof createUsersService>;

export function createUsersService({ repo, locationProvider, clock, newId }: UsersServiceDeps) {
  async function resolve(zip: string): Promise<LocationFields> {
    const location = await locationProvider.lookupZip(zip);
    return { ...location, locationUpdatedAt: clock.now().toISOString() };
  }

  // On create and on a zip change a failed lookup still saves the person;
  // the card shows them as "location pending" until a refresh succeeds.
  async function resolveOrPending(zip: string): Promise<LocationFields> {
    try {
      return await resolve(zip);
    } catch (error) {
      if (error instanceof ZipNotFound || error instanceof ProviderUnavailable) return PENDING_LOCATION;
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
      const user: User = { id: newId(), name, zip, ...(await resolveOrPending(zip)) };
      await repo.create(user);
      return user;
    },

    async update(id: string, patch: UserPatch): Promise<User> {
      const changes = userPatchSchema.parse(patch);
      const current = await mustGet(id);
      const zip = changes.zip ?? current.zip;
      const location = zip === current.zip ? pickLocation(current) : await resolveOrPending(zip);
      const user: User = { id, name: changes.name ?? current.name, zip, ...location };
      await repo.update(user);
      return user;
    },

    async refreshLocation(id: string): Promise<User> {
      const current = await mustGet(id);
      const user: User = { ...current, ...(await resolve(current.zip)) };
      await repo.update(user);
      return user;
    },

    async remove(id: string): Promise<void> {
      if (!(await repo.delete(id))) throw new UserNotFound(id);
    },

    lookupZip(zip: string) {
      return locationProvider.lookupZip(zip);
    },
  };
}

function pickLocation(user: User): LocationFields {
  const { city, lat, lon, utcOffsetSeconds, locationUpdatedAt } = user;
  return { city, lat, lon, utcOffsetSeconds, locationUpdatedAt } as LocationFields;
}
