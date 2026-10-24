import { randomUUID } from "node:crypto";
import express from "express";
import type { Clock, LocationProvider, UsersRepo, ZipDirectory } from "./core/ports.js";
import { createUsersService } from "./core/users-service.js";
import { errorHandler } from "./http/errors.js";
import { usersRoutes } from "./http/routes.js";
import { product } from "./product.js";

export interface AppDeps {
  repo: UsersRepo;
  locationProvider: LocationProvider;
  zipDirectory: ZipDirectory;
  clock?: Clock;
  newId?: () => string;
}

export const systemClock: Clock = { now: () => new Date() };

export function buildApp({ repo, locationProvider, zipDirectory, clock = systemClock, newId = randomUUID }: AppDeps) {
  const service = createUsersService({ repo, locationProvider, zipDirectory, clock, newId });
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.get("/", (_req, res) => {
    res.type("text").send(`${product.name} API. Try GET /api/users.`);
  });
  app.use("/api", usersRoutes(service));
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: { code: "not_found", message: "No such endpoint." } });
  });
  app.use(errorHandler);
  return app;
}
