import { Router } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db, usersTable } from "@workspace/db";

const router = Router();

router.post("/auth/signup", async (req, res) => {
  const { email, password, name } = req.body as {
    email: string;
    password: string;
    name?: string;
  };

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ message: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({
      id: randomUUID(),
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      passwordHash,
    })
    .returning();

  req.session.userId = user.id;

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    onboardingComplete: user.onboardingComplete,
    purchasedAt: user.purchasedAt,
  });
});

router.post("/auth/signin", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ message: "Email ou senha incorretos" });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ message: "Email ou senha incorretos" });
    return;
  }

  req.session.userId = user.id;

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    onboardingComplete: user.onboardingComplete,
    purchasedAt: user.purchasedAt,
  });
});

router.post("/auth/signout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res) => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId))
    .limit(1);

  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ message: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    onboardingComplete: user.onboardingComplete,
    purchasedAt: user.purchasedAt,
  });
});

export default router;
