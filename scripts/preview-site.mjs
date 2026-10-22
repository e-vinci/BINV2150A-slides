// Sert dist/ en local sous le même chemin que sur GitHub Pages.
// Usage : npm run preview:site   puis ouvrir http://localhost:4173/BINV2150A-slides/

import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const DIST = resolve(import.meta.dirname, "..", "dist");
const BASE = `/${(process.env.SITE_BASE ?? "/BINV2150A-slides/").replace(/^\/+|\/+$/g, "")}/`.replace("//", "/");
const PORT = Number(process.env.PORT ?? 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json",
  ".woff2": "font/woff2", ".ico": "image/x-icon",
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (!path.startsWith(BASE)) {
    res.writeHead(302, { Location: BASE }).end();
    return;
  }
  let file = join(DIST, path.slice(BASE.length));
  if (!file.startsWith(DIST)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) return res.writeHead(404).end("404");
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}`));
