import { setupServer } from "msw/node";
import { handlers } from "../mocks/fake-api";

export * from "../mocks/fake-api";
export const server = setupServer(...handlers);
