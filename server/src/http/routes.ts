import { Router, type Request } from "express";
import { UserNotFound } from "../core/errors.js";
import type { UsersService } from "../core/users-service.js";
import type { UserPatch } from "../core/user.js";
import { BadRequest } from "./errors.js";
import { nameProblem, zipProblem } from "./validation.js";

function body(req: Request): Record<string, unknown> {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) throw new BadRequest("Send a JSON object.");
  return req.body;
}

function check(problem: string | undefined, field: string) {
  if (problem) throw new BadRequest(problem, field);
}

export function usersRoutes(service: UsersService) {
  const router = Router();

  router.get("/users", async (_req, res) => {
    res.json(await service.list());
  });

  router.post("/users", async (req, res) => {
    const { name, zip } = body(req);
    check(nameProblem(name), "name");
    check(zipProblem(zip), "zip");
    res.status(201).json(await service.create({ name: name as string, zip: (zip as string).trim() }));
  });

  router.get("/users/:id", async (req, res) => {
    const user = await service.get(req.params.id);
    if (!user) throw new UserNotFound(req.params.id);
    res.json(user);
  });

  router.patch("/users/:id", async (req, res) => {
    const { name, zip } = body(req);
    const patch: UserPatch = {};
    if (name !== undefined) { check(nameProblem(name), "name"); patch.name = name as string; }
    if (zip !== undefined) { check(zipProblem(zip), "zip"); patch.zip = (zip as string).trim(); }
    if (!Object.keys(patch).length) throw new BadRequest("Nothing to change. Send a name or a zip.");
    res.json(await service.update(req.params.id, patch));
  });

  router.delete("/users/:id", async (req, res) => {
    await service.remove(req.params.id);
    res.status(204).end();
  });

  router.post("/users/:id/refresh-location", async (req, res) => {
    res.json(await service.refreshLocation(req.params.id));
  });

  router.get("/zip/:zip", async (req, res) => {
    check(zipProblem(req.params.zip), "zip");
    res.json({ zip: req.params.zip, ...(await service.lookupZip(req.params.zip)) });
  });

  return router;
}
