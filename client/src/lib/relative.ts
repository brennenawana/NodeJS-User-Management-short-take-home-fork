// Where someone's clock sits relative to the viewer's. Both sides are UTC offsets in
// seconds; the viewer's comes from the browser for the current moment, so it already
// reflects their daylight saving.

/** The viewer's UTC offset in seconds at `now` (getTimezoneOffset is minutes, sign flipped). */
export function viewerOffsetSeconds(now: Date): number {
  return -now.getTimezoneOffset() * 60;
}

function span(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ");
}

/** Seconds that `offset` is ahead of the viewer (negative when behind). */
export function secondsAhead(offset: number, viewer: number): number {
  return offset - viewer;
}

/** "3h ahead of you", "2h 30m behind you", "Same time as you". */
export function relativeLabel(offset: number, viewer: number): string {
  const diff = secondsAhead(offset, viewer);
  if (diff === 0) return "Same time as you";
  return `${span(Math.abs(diff))} ${diff > 0 ? "ahead of" : "behind"} you`;
}

/** Compact form for tight spots: "+3h", "−2h 30m", "±0". Uses a real minus sign. */
export function relativeShort(offset: number, viewer: number): string {
  const diff = secondsAhead(offset, viewer);
  if (diff === 0) return "±0";
  return `${diff > 0 ? "+" : "−"}${span(Math.abs(diff))}`;
}
