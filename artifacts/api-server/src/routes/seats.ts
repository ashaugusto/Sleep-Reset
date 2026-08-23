import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/requireAuth";
import { claimInvite, createInviteFor, inviteByToken, seatStateFor } from "../lib/seats";

const router: IRouter = Router();

// ─── The second seat, both ends of it ────────────────────────────────────────
// Two audiences on four routes, and they are not the same audience, which is
// why the guards are not the same either.
//
//   GET  /seats                      the buyer. Signed in. How many, who has them.
//   POST /seats/invite               the buyer. Spends one seat, returns a link.
//   GET  /seats/invite/:token        the partner. Public: they have no account yet.
//   POST /seats/invite/:token/claim  the partner. Public: this is where they get one.
//
// The two public routes are reachable by anyone holding a 256 bit token, and
// nothing else about them is public: the lookup answers with the owner's first
// name and no email at all, so a token cannot be turned into an address, and
// the claim never says whether the address given already has an account.

/** Enumeration brake. The token is 256 bits, so this is belt and braces. */
const attempts = new Map<string, { count: number; resetAt: number }>();
const ATTEMPT_LIMIT = 30;
const ATTEMPT_WINDOW_MS = 60 * 60 * 1000;

function overLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    if (attempts.size > 5000) {
      for (const [key, value] of attempts) if (now > value.resetAt) attempts.delete(key);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > ATTEMPT_LIMIT;
}

function clientIp(req: Request): string {
  const xfwd = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return xfwd || req.socket.remoteAddress || "unknown";
}

/** `partner@gmail.com` → `p***r@gmail.com`. What the owner's own page shows. */
function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

/** The link the buyer sends their partner. */
function inviteUrl(token: string): string {
  const base = (process.env.APP_URL || "https://sleepwired.com").replace(/\/$/, "");
  return `${base}/seat/${token}`;
}

async function emailOf(userId: string): Promise<string | null> {
  const [user] = await db.select({ email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return user?.email ?? null;
}

// ─── GET /seats ──────────────────────────────────────────────────────────────
router.get("/seats", requireAuth, async (req: Request, res: Response) => {
  const email = await emailOf(req.userId!);
  if (!email) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const state = await seatStateFor(email);
  res.json({
    owned: state.owned,
    available: state.available,
    seats: state.slots.map((s) => ({
      purchasedAt: s.purchasedAt,
      invited: !!s.invite,
      url: s.invite ? inviteUrl(s.invite.token) : null,
      redeemedAt: s.invite?.redeemedAt ?? null,
      // The owner sees who took the seat, but not well enough to reuse the
      // address for anything: they typed it into a chat window, not into us.
      redeemedBy: s.invite?.redeemedByEmail ? maskEmail(s.invite.redeemedByEmail) : null,
    })),
  });
});

// ─── POST /seats/invite ──────────────────────────────────────────────────────
router.post("/seats/invite", requireAuth, async (req: Request, res: Response) => {
  const email = await emailOf(req.userId!);
  if (!email) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  try {
    const invite = await createInviteFor({ email, userId: req.userId! });
    if (!invite) {
      res.status(409).json({ message: "No seat available.", available: 0 });
      return;
    }
    res.status(201).json({ url: inviteUrl(invite.token), createdAt: invite.createdAt });
  } catch (err) {
    logger.error({ err, email }, "Seat: invite creation failed");
    res.status(500).json({ message: "Could not create the invitation." });
  }
});

// ─── GET /seats/invite/:token ────────────────────────────────────────────────
// The partner opening the link, with no account and nothing to authenticate
// with. 404 covers every way this can be dead — never existed, seat refunded —
// because telling the difference is only useful to somebody guessing.
router.get("/seats/invite/:token", async (req: Request, res: Response) => {
  if (overLimit(clientIp(req))) {
    res.status(429).json({ message: "Too many attempts. Please wait a moment." });
    return;
  }
  const view = await inviteByToken(String(req.params.token || ""));
  if (!view) {
    res.status(404).json({ message: "This invitation is no longer valid." });
    return;
  }
  res.json({
    valid: true,
    redeemed: !!view.invite.redeemedAt,
    /** First name only, so the partner knows who sent it. Never the address. */
    from: view.ownerName ? view.ownerName.split(/\s+/)[0] : null,
  });
});

// ─── POST /seats/invite/:token/claim ─────────────────────────────────────────
router.post("/seats/invite/:token/claim", async (req: Request, res: Response) => {
  if (overLimit(clientIp(req))) {
    res.status(429).json({ message: "Too many attempts. Please wait a moment." });
    return;
  }
  const { email, name, password } = req.body as { email?: string; name?: string; password?: string };

  let result;
  try {
    result = await claimInvite(String(req.params.token || ""), { email, name, password });
  } catch (err) {
    logger.error({ err, token: String(req.params.token).slice(0, 8) }, "Seat: claim failed");
    res.status(500).json({ message: "Could not open the account. Please try again." });
    return;
  }

  if (!result.ok) {
    const status = result.code === "invalid" ? 404 : result.code === "taken" ? 409 : 400;
    res.status(status).json({ message: result.message });
    return;
  }

  // They already had a password, so the seat is theirs and the door is not
  // opened for them. Signing somebody in off a forwarded link would make the
  // invite a password reset.
  if (!result.signIn) {
    res.json({ ok: true, signedIn: false, message: "Your access is ready. Sign in with your existing password." });
    return;
  }

  req.session.userId = result.userId;
  req.session.save((err) => {
    if (err) {
      // The grant is written either way. Worst case they sign in by hand.
      res.status(200).json({ ok: true, signedIn: false, message: "Your access is ready. Please sign in." });
      return;
    }
    res.json({ ok: true, signedIn: true, email: result.email });
  });
});

export default router;
