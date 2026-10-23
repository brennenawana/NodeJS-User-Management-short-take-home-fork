export function hueOf(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

/** Avatar colours come in 12 buckets of 30°, one token pair each (--color-avatar-{hue}-bg/-fg). */
export function avatarHue(name: string): number {
  return (Math.round(hueOf(name || "New person") / 30) * 30) % 360;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return "?";
  const last = parts.length > 1 ? parts[parts.length - 1]! : "";
  return (first[0]! + (last[0] ?? "")).toUpperCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
