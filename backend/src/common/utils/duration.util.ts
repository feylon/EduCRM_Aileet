const UNITS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

/** Converts "15m", "7d", "3600" style durations to seconds. */
export function durationToSeconds(value: string | number): number {
  if (typeof value === 'number') return value;
  const match = /^(\d+)\s*([smhd])?$/.exec(value.trim());
  if (!match) throw new Error(`Invalid duration: ${value}`);
  return parseInt(match[1], 10) * (UNITS[match[2] || 's'] || 1);
}
