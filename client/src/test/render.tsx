import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";
import { resetApi, seed } from "./server";
import type { User } from "../api";

export async function renderApp(users: User[] = []) {
  resetApi();
  seed(users);
  const user = userEvent.setup();
  render(<App />);
  if (users.length) await screen.findByRole("list", { name: "People" });
  return user;
}
