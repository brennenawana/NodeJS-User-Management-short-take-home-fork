import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useTheme } from "./useTheme";

const media = (reduce: boolean) =>
  vi.fn((query: string) => ({ matches: reduce && query.includes("reduced-motion"), media: query }) as MediaQueryList);

afterEach(() => {
  vi.unstubAllGlobals();
  delete (document as Partial<Document>).startViewTransition;
});

test("crossfades the theme change through a view transition", () => {
  vi.stubGlobal("matchMedia", media(false));
  const start = vi.fn((cb: () => void) => { cb(); return {} as ViewTransition; });
  document.startViewTransition = start as unknown as Document["startViewTransition"];
  const { result } = renderHook(() => useTheme());
  act(() => result.current.toggle());
  expect(start).toHaveBeenCalledOnce();
  expect(document.documentElement.dataset.theme).toBe("dark");
});

test("skips the crossfade when motion is reduced", () => {
  vi.stubGlobal("matchMedia", media(true));
  const start = vi.fn();
  document.startViewTransition = start as unknown as Document["startViewTransition"];
  const { result } = renderHook(() => useTheme());
  act(() => result.current.toggle());
  expect(start).not.toHaveBeenCalled();
  expect(result.current.theme).toBe("dark");
});
