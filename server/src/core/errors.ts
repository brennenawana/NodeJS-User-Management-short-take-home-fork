// The only failures a location provider may report. Providers map everything
// they can go wrong with (HTTP errors, bad payloads, timeouts) onto these two.
export class ZipNotFound extends Error {
  constructor(readonly zip: string) {
    super(`No location for zip ${zip}`);
    this.name = "ZipNotFound";
  }
}

export class ProviderUnavailable extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ProviderUnavailable";
  }
}

/** The zip isn't a real US zip, so there's nothing to look up. */
export class InvalidZip extends Error {
  constructor(readonly zip: string) {
    super(`${zip} is not a US zip code`);
    this.name = "InvalidZip";
  }
}

export class UserNotFound extends Error {
  constructor(readonly id: string) {
    super(`No user with id ${id}`);
    this.name = "UserNotFound";
  }
}
