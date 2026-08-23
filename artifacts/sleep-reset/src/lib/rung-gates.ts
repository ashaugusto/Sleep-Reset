import type { Rung } from "@/lib/offers";

// ─── When the two in-platform rungs are allowed to ask ───────────────────────
// Rungs 6 and 7 are both sold inside the member area rather than in the funnel,
// and as written they collided. The program is seven nights. Rung 7 opens with
// seven logged nights, and rung 6 was written for "after night seven". That is
// the same instant: whoever finished the program would be shown a 39 EUR pack
// and a 79 to 149 EUR service at once, and the two would eat each other. The
// cheaper one wins that fight every time, and it wins by taking the sale the
// expensive one would have made.
//
// Sophie's resolution, which the copy is already written for (FLU-226, FLU-237):
//
//   rung 7  at the end of night seven, which is the moment the log the buyer
//           has just finished filling in is worth the most to them, and the
//           moment their attention is highest.
//   rung 6  on day fourteen, a week after the program ends, which is when
//           "what stops me sliding back" turns up on its own.
//
// That is why rung 6's eyebrow no longer says "after night seven". It says "the
// year is not flat", in all four languages.
//
// Two things keep them apart here rather than in whichever page renders them.
// They sit on different surfaces, so neither can appear on the other's screen.
// And rung 6 waits a day past the finish for anyone slow: somebody who takes
// three weeks to log seven nights reaches night seven after day fourteen, and
// without that rule the collision would come back for exactly the buyers who
// needed the most patience.
//
// The dates are calendar days, floored at local midnight. A gate that opened
// fourteen times twenty-four hours after the purchase would open at breakfast
// for one buyer and at bedtime for the next, which is a support question nobody
// can answer.

/** The program itself. Seven nights, `sleep-rewire-7night`. */
export const PROGRAM_NIGHTS = 7;

/** Rung 7 reads the log, so there has to be a log: seven nights of one. */
export const BACKEND_MIN_LOGGED_NIGHTS = 7;

/** Rung 6 opens on day fourteen, counted from the day the platform was paid. */
export const SEASON_FROM_DAY = 14;

/** Rung 6 also waits this long after the seventh night, for slower buyers. */
export const SEASON_AFTER_FINISH_DAYS = 1;

/** Where an offer is allowed to appear. One rung each, and that is the point. */
export type GateSurface = "night-end" | "library";

export interface MemberState {
  /** Nights with a sleep log behind them. */
  loggedNights: number;
  /** The night screen open right now, when one is. Rung 7 fires on the seventh. */
  night?: number | null;
  /** When the seventh night was ticked off, if it has been. */
  programFinishedAt?: Date | null;
  /** When the platform was paid for. Day one of the fourteen. */
  purchasedAt: Date | null;
  /** What the account already owns, so nothing is sold twice. */
  owned?: readonly Rung[];
  /** Today. Injected so a gate can be reasoned about on any date. */
  now?: Date;
}

/** Whole calendar days from `from` to `to`, both taken at local midnight. */
export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.floor((b - a) / 86_400_000);
}

function owns(state: MemberState, ...rungs: Rung[]): boolean {
  return rungs.some((rung) => state.owned?.includes(rung));
}

/**
 * Rung 7, The Recalibration. The end of the seventh night, and only for an
 * account with seven nights in the log, because a reading of the log is the
 * entire thing being sold. Either level already owned closes it.
 */
export function isBackendOffered(state: MemberState): boolean {
  if (owns(state, "backend", "backendLive")) return false;
  if (state.night !== PROGRAM_NIGHTS) return false;
  return state.loggedNights >= BACKEND_MIN_LOGGED_NIGHTS;
}

/**
 * Rung 6, Reset Season. Day fourteen at the earliest, and never on the same day
 * the seventh night was finished. A buyer who never finishes still gets there:
 * rung 7 was never offered to them, so there is nothing to collide with.
 */
export function isSeasonOffered(state: MemberState): boolean {
  if (owns(state, "season")) return false;
  if (!state.purchasedAt) return false;
  const now = state.now ?? new Date();
  if (daysBetween(state.purchasedAt, now) < SEASON_FROM_DAY) return false;
  if (state.programFinishedAt && daysBetween(state.programFinishedAt, now) < SEASON_AFTER_FINISH_DAYS) {
    return false;
  }
  return true;
}

/**
 * The one rung a given surface may show right now, or null.
 *
 * Pages ask this instead of writing the conditions themselves, so that the two
 * gates cannot drift back into the same moment one page at a time.
 */
export function offeredAt(surface: GateSurface, state: MemberState): Rung | null {
  if (surface === "night-end") return isBackendOffered(state) ? "backend" : null;
  if (surface === "library") {
    // The season owns this slot from day fourteen. Before that the slot is
    // rung 7's, and that is not a second gate, it is the only way back for
    // somebody who reached the end of night seven and did not decide there.
    // Without it the offer exists for one screen and is then unreachable
    // except by typing the URL, which is a worse answer than showing it.
    //
    // One slot, so they still never share a screen: the moment the season
    // opens, it takes the row. That is the whole collision rule, enforced by
    // there being one row rather than by two conditions agreeing with each
    // other.
    if (isSeasonOffered(state)) return "season";
    if (owns(state, "backend", "backendLive")) return null;
    return state.loggedNights >= BACKEND_MIN_LOGGED_NIGHTS ? "backend" : null;
  }
  return null;
}
