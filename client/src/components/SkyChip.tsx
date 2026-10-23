import type { SkyTime } from "../lib/time";

// Geometry from design/source/R2-Sky.dc.html, on a 72×36 canvas.
function rays(cx: number, cy: number, r1: number, r2: number, angles: number[]) {
  return angles.map((a) => {
    const c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180);
    return `M${(cx + r1 * c).toFixed(1)} ${(cy + r1 * s).toFixed(1)}L${(cx + r2 * c).toFixed(1)} ${(cy + r2 * s).toFixed(1)}`;
  }).join("");
}

const SUN = {
  morning: { y: 20, r: 7, rays: rays(36, 20, 10, 14, [-150, -120, -90, -60, -30]), ground: true },
  afternoon: { y: 18, r: 7, rays: rays(36, 18, 10, 14, [0, 45, 90, 135, 180, 225, 270, 315]), ground: false },
  evening: { y: 27, r: 8, rays: rays(36, 27, 11, 14, [-125, -90, -55]), ground: true },
};

const v = (time: SkyTime, part: "bg" | "disc" | "horizon") => `var(--color-sky-${time}-${part})`;

/** Figma: SkyChip. `time` is the Figma "Time" variant. */
export function SkyChip({ time, label }: { time: SkyTime; label: string }) {
  const sun = time === "night" ? null : SUN[time];
  return (
    <svg width="72" height="36" viewBox="0 0 72 36" role="img" aria-label={label} data-time={time} style={{ flex: "0 0 auto" }}>
      <rect width="72" height="36" rx="12" fill={v(time, "bg")} />
      {sun && (
        <>
          <path d={sun.rays} fill="none" stroke={v(time, "disc")} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="36" cy={sun.y} r={sun.r} fill={v(time, "disc")} />
        </>
      )}
      {time === "night" && (
        <>
          {[[14, 9, 1.3], [52, 8, 1.5], [60, 17, 1.1], [23, 21, 0.9]].map(([cx, cy, r]) => (
            <circle key={cx} cx={cx} cy={cy} r={r} fill="var(--color-sky-star)" />
          ))}
          <circle cx="35" cy="14" r="6.5" fill={v(time, "disc")} />
          <circle cx="38.2" cy="11.6" r="5.6" fill={v(time, "bg")} />
        </>
      )}
      {(sun?.ground ?? true) && <path d="M.4 27H71.6A12 12 0 0 1 60 36H12A12 12 0 0 1 .4 27Z" fill={v(time, "horizon")} />}
    </svg>
  );
}
