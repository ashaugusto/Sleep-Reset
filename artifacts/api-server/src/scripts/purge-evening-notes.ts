/**
 * Sleep Wired: clearing the free text the evening form used to invite.
 *
 * FLU-242 replaced the "Notes (optional) / What's on your mind?" textarea with
 * six habit checkboxes. That stops the collection, and stopping the collection
 * is most of the job, but it does nothing about what is already in the column.
 * Those rows are the ones the legal opinion was actually worried about:
 * medication names, diagnoses, bereavements, written at 2am by somebody who was
 * not sleeping, with no retention rule attached and no defined purpose, which
 * under GDPR art. 9 is data we should never have held. From the seventh rung
 * onwards they would also be sitting in front of a human reviewer who is not a
 * healthcare professional.
 *
 * There is no version of this where we keep them. They cannot be anonymised
 * (they are attached to the log they describe), they are not needed for the
 * sleep window (every number that feeds it lives in its own column), and asking
 * each account for consent to hold text we cannot even see the shape of is
 * worse than deleting it. So: delete.
 *
 * What survives is anything that decodes to the new vocabulary, so this is safe
 * to run after the change has been live for a while and idempotent afterwards.
 *
 * Dry run by default. It prints how many rows it would touch and their lengths,
 * never their contents: reading them to decide whether to delete them is the
 * exact thing being fixed.
 *
 *   pnpm --filter @workspace/api-server run script purge-evening-notes
 *   APPLY=1 pnpm --filter @workspace/api-server run script purge-evening-notes
 */
import { and, inArray, isNotNull, ne } from "drizzle-orm";
import { db, sleepLogsTable } from "@workspace/db";

/** Kept in step by hand with artifacts/sleep-reset/src/lib/habit-tags.ts. */
const HABIT_TAG_IDS = [
  "caffeine_pm",
  "alcohol",
  "nap",
  "screen_last_hour",
  "late_exercise",
  "heavy_meal",
] as const;

function isTagList(value: string): boolean {
  const parts = value.split(",").map((s) => s.trim());
  return parts.every((p) => (HABIT_TAG_IDS as readonly string[]).includes(p));
}

async function main(): Promise<void> {
  const apply = process.env.APPLY === "1";

  const rows = await db
    .select({ id: sleepLogsTable.id, notes: sleepLogsTable.eveningNotes })
    .from(sleepLogsTable)
    .where(and(isNotNull(sleepLogsTable.eveningNotes), ne(sleepLogsTable.eveningNotes, "")));

  const freeText = rows.filter((r) => r.notes && !isTagList(r.notes));

  console.log(`evening_notes rows with something in them: ${rows.length}`);
  console.log(`of those, free text from before FLU-242:  ${freeText.length}`);
  if (freeText.length) {
    const lengths = freeText.map((r) => r.notes!.length).sort((a, b) => a - b);
    console.log(`  lengths: min ${lengths[0]}, median ${lengths[Math.floor(lengths.length / 2)]}, max ${lengths[lengths.length - 1]}`);
  }

  if (!freeText.length) {
    console.log("Nothing to do.");
    return;
  }
  if (!apply) {
    console.log("\nDry run. Set APPLY=1 to clear them.");
    return;
  }

  const ids = freeText.map((r) => r.id);
  for (let i = 0; i < ids.length; i += 500) {
    const batch = ids.slice(i, i + 500);
    await db
      .update(sleepLogsTable)
      .set({ eveningNotes: null })
      .where(inArray(sleepLogsTable.id, batch));
  }
  console.log(`Cleared ${ids.length} rows.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
