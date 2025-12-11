import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { ViteDevServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: express.Express, server: any) {
  const vite = await (
    await import("vite")
  ).createServer({
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  return vite;
}

export function serveStatic(app: express.Express) {
  const distPath = path.resolve(__dirname, "../../dist/public");
  
  if (!fs.existsSync(distPath)) {
    throw new Error(`Build directory not found at ${distPath}. Run 'npm run build' first.`);
  }

  app.use(express.static(distPath));
  
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
