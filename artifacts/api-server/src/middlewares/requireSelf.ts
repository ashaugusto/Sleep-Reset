import type { Request, Response, NextFunction } from "express";

/**
 * Second half of the pair that guards the `/users/:userId` routes.
 *
 * `requireAuth` answers "is there a session"; this answers "is the session the
 * one this row belongs to". Both are needed: the ids in these paths are v4
 * UUIDs, which means they are not guessable, but they are also not secret —
 * they travel in query keys, in logs and in every URL the client builds. An id
 * identifies a row, it does not prove anything about who is asking.
 *
 * Must be mounted after `requireAuth`, which is what puts `req.userId` there.
 */
export function requireSelf(req: Request, res: Response, next: NextFunction) {
  if (req.params.userId !== req.userId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}
