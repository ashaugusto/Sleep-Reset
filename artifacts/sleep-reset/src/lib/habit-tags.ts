// ─── What the evening field collects, and what it stopped collecting ─────────
// Until FLU-242 the evening form ended in a free textarea labelled "Notes
// (optional)" whose placeholder asked "What's on your mind?". That is not a
// field, it is an invitation, put in front of somebody who is not sleeping, at
// the hour they are least guarded. What comes back is medication names,
// diagnoses, bereavements, and occasionally worse. None of it is needed to
// recalculate a sleep window, none of it had a retention rule, and from the
// seventh rung onwards all of it would land in front of a human reviewer who
// is not a healthcare professional and holds no professional secrecy.
//
// So the field is a closed list now. Six habits, each one of which actually
// moves a sleep window, and nothing that can carry a sentence. It is also a
// better field: a reviewer reads six ticks in two seconds and does not read
// seventy paragraphs.
//
// The values are stored in the same `evening_notes` column, comma separated,
// because they are still notes about the evening and a new column would have
// bought nothing. Anything in that column that is not one of these ids is
// free text from before the change: see
// artifacts/api-server/src/scripts/purge-evening-notes.ts.

export const HABIT_TAGS = [
  { id: "caffeine_pm", label: "Caffeine after 2pm" },
  { id: "alcohol", label: "Alcohol" },
  { id: "nap", label: "Napped today" },
  { id: "screen_last_hour", label: "Screen in the last hour" },
  { id: "late_exercise", label: "Exercise late" },
  { id: "heavy_meal", label: "Heavy meal late" },
] as const;

export type HabitTagId = (typeof HABIT_TAGS)[number]["id"];

const VALID = new Set<string>(HABIT_TAGS.map((t) => t.id));

/** Ticks to column value. Nothing ticked is null, not an empty string. */
export function encodeHabitTags(ids: string[]): string | null {
  const kept = HABIT_TAGS.filter((t) => ids.includes(t.id)).map((t) => t.id);
  return kept.length ? kept.join(",") : null;
}

/** Column value to ticks. Free text from before the change decodes to nothing. */
export function decodeHabitTags(value: string | null | undefined): HabitTagId[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is HabitTagId => VALID.has(s));
}
