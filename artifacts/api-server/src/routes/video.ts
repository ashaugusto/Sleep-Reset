import { Router, type IRouter, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

function findWorkspaceRoot(dir: string): string {
  if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
  const parent = path.dirname(dir);
  if (parent === dir) return dir;
  return findWorkspaceRoot(parent);
}

const WORKSPACE_ROOT = findWorkspaceRoot(process.cwd());
const VIDEO_PATH = path.join(WORKSPACE_ROOT, "artifacts/sleep-reset/public/videos/vsl.mp4");

const COMMON_HEADERS = {
  "Content-Type": "video/mp4",
  "Accept-Ranges": "bytes",
  "Cache-Control": "public, max-age=86400",
};

router.get("/video/vsl.mp4", (req: Request, res: Response) => {
  if (!fs.existsSync(VIDEO_PATH)) {
    res.status(404).json({ message: "Video not found" });
    return;
  }

  const stat = fs.statSync(VIDEO_PATH);
  const fileSize = stat.size;
  const rawRange = req.headers.range;

  let start = 0;
  let end = fileSize - 1;

  if (rawRange) {
    const parts = rawRange.replace(/bytes=/, "").split("-");
    start = parseInt(parts[0], 10) || 0;
    end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  } else {
    end = Math.min(65535, fileSize - 1);
  }

  const chunkSize = end - start + 1;

  res.writeHead(206, {
    ...COMMON_HEADERS,
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Content-Length": chunkSize,
  });

  const stream = fs.createReadStream(VIDEO_PATH, { start, end });
  stream.on("error", () => res.end());
  req.on("close", () => stream.destroy());
  stream.pipe(res);
});

export default router;
