import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import sleepLogsRouter from "./sleep-logs";
import nightCompletionsRouter from "./night-completions";
import progressRouter from "./progress";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(sleepLogsRouter);
router.use(nightCompletionsRouter);
router.use(progressRouter);
router.use(paymentsRouter);

export default router;
