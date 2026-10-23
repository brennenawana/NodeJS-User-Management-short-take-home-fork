import type { Location, User } from "./user.js";

export interface LocationProvider {
  /** Resolves a US zip, or throws ZipNotFound / ProviderUnavailable. */
  lookupZip(zip: string): Promise<Location>;
}

export interface UsersRepo {
  list(): Promise<User[]>;
  get(id: string): Promise<User | undefined>;
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<boolean>;
}

export interface Clock {
  now(): Date;
}
