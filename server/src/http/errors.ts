import type { ErrorRequestHandler, Response } from "express";
import { InvalidZip, ProviderUnavailable, UserNotFound, ZipNotFound } from "../core/errors.js";

export class BadRequest extends Error {
  constructor(message: string, readonly field?: string) {
    super(message);
    this.name = "BadRequest";
  }
}

function send(res: Response, status: number, code: string, message: string, field?: string) {
  res.status(status).json({ error: { code, message, ...(field && { field }) } });
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof BadRequest) return send(res, 400, "invalid", error.message, error.field);
  if (error instanceof UserNotFound) return send(res, 404, "user_not_found", "We couldn't find that person. They may have been removed.");
  if (error instanceof InvalidZip) {
    return send(res, 400, "invalid_zip", `We couldn't find ${error.zip}. Check the zip and try again.`, "zip");
  }
  if (error instanceof ZipNotFound) {
    return send(res, 404, "zip_not_found", `We can't place ${error.zip} on the map. You can still save; their card will be flagged.`);
  }
  if (error instanceof ProviderUnavailable) {
    return send(res, 503, "provider_unavailable", "We could not look up that zip right now. You can still save and we will retry.");
  }
  if (error?.type === "entity.parse.failed") return send(res, 400, "invalid", "The request body isn't valid JSON.");
  console.error(error);
  send(res, 500, "internal", "Something went wrong on our side.");
};
