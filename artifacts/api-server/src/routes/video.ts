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

console.log(`[video] workspace root: ${WORKSPACE_ROOT}`);
console.log(`[video] video path: ${VIDEO_PATH} — exists: ${fs.existsSync(VIDEO_PATH)}`);

router.get("/video/vsl.mp4", (req: Request, res: Response) => {
  if (!fs.existsSync(VIDEO_PATH)) {
    res.status(404).json({ message: "Video not found", path: VIDEO_PATH });
    return;
  }

  const stat = fs.statSync(VIDEO_PATH);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
      "Cache-Control": "public, max-age=86400",
    });

    fs.createReadStream(VIDEO_PATH, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400",
    });

    fs.createReadStream(VIDEO_PATH).pipe(res);
  }
});

export default router;
