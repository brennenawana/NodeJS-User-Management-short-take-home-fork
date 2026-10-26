import type { Location } from "../../../core/user.js";

// The first eight match the responses recorded in server/fixtures/openweathermap.
// The rest come from the design sources (R2-Main.dc.html) so the add sheet has
// more than the sample team to resolve.
export const ZIPS: Record<string, Location> = {
  "10001": { city: "New York", lat: 40.7484, lon: -73.9967, utcOffsetSeconds: -14400 },
  "94103": { city: "San Francisco", lat: 37.7725, lon: -122.4147, utcOffsetSeconds: -25200 },
  "60601": { city: "Chicago", lat: 41.8858, lon: -87.6181, utcOffsetSeconds: -18000 },
  "98101": { city: "Seattle", lat: 47.6114, lon: -122.3305, utcOffsetSeconds: -25200 },
  "80202": { city: "Denver", lat: 39.7491, lon: -104.9946, utcOffsetSeconds: -21600 },
  "33131": { city: "Miami", lat: 25.7629, lon: -80.1895, utcOffsetSeconds: -14400 },
  "02108": { city: "Boston", lat: 42.3576, lon: -71.0684, utcOffsetSeconds: -14400 },
  "78701": { city: "Austin", lat: 30.2713, lon: -97.7426, utcOffsetSeconds: -18000 },
  "97205": { city: "Portland", lat: 45.5209, lon: -122.6832, utcOffsetSeconds: -25200 },
  "30303": { city: "Atlanta", lat: 33.7528, lon: -84.3915, utcOffsetSeconds: -14400 },
  "85004": { city: "Phoenix", lat: 33.4512, lon: -112.0703, utcOffsetSeconds: -25200 },
  "55401": { city: "Minneapolis", lat: 44.9841, lon: -93.2708, utcOffsetSeconds: -18000 },
  "19103": { city: "Philadelphia", lat: 39.9525, lon: -75.1741, utcOffsetSeconds: -14400 },
  "96813": { city: "Honolulu", lat: 21.3118, lon: -157.8615, utcOffsetSeconds: -36000 },
  "99501": { city: "Anchorage", lat: 61.2176, lon: -149.8997, utcOffsetSeconds: -28800 },
};
