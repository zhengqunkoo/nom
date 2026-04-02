export type TimePreset = "24h" | "7d" | "30d" | "all";

export const TIME_PRESETS: { value: TimePreset; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "all", label: "All time" },
];

export function presetToDateRange(preset: TimePreset | string): {
  from?: string;
  to?: string;
} {
  const now = new Date();
  switch (preset) {
    case "24h":
      return {
        from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      };
    case "7d":
      return {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    case "30d":
      return {
        from: new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    case "all":
    default:
      return {};
  }
}
