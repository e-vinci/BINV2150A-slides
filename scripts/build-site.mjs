// Construit le site web complet des slides dans dist/ :
//   dist/index.html        page d'accueil (table des matières)
//   dist/seance-XX/        une présentation Slidev par séance
//
// Usage :
//   npm run build:site        séances listées dans seances-publiees.txt
//   npm run build:site:all    toutes les séances (aperçu local)
//
// Variable d'environnement SITE_BASE : chemin du site sur le serveur.
// GitHub Pages sert le dépôt e-vinci/BINV2150A-slides sous /BINV2150A-slides/.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const BASE = withSlashes(process.env.SITE_BASE ?? "/BINV2150A-slides/");
const ALL = process.argv.includes("--all");

const PARTS = [
  { title: "Partie 1 — Backend", from: 1, to: 4 },
  { title: "Partie 2 — Frontend « old school »", from: 5, to: 6 },
  { title: "Partie 3 — React", from: 7, to: 20 },
  { title: "Partie 4 — Liaison frontend et backend", from: 21, to: 24 },
];

function withSlashes(path) {
  return `/${path.replace(/^\/+|\/+$/g, "")}/`.replace("//", "/");
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Liste des dossiers à publier
function listSessions() {
  if (ALL) {
    return readdirSync(ROOT)
      .filter((name) => name.startsWith("seance-") && existsSync(join(ROOT, name, "slides.md")))
      .sort();
  }
  return readFileSync(join(ROOT, "seances-publiees.txt"), "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
}

// "Web 2 - Séance 10 - Modules et collections" -> { label: "Séance 10", subject: "Modules et collections" }
function readTitle(dir) {
  const slides = readFileSync(join(ROOT, dir, "slides.md"), "utf-8");
  const headmatter = slides.match(/^---\n([\s\S]*?)\n---/);
  const title = headmatter?.[1].match(/^title:\s*(.+)$/m)?.[1].trim() ?? dir;
  const parts = title.replace(/^Web 2\s*-\s*/, "").split(/\s+-\s+/);
  return { label: parts[0], subject: parts.slice(1).join(" - ") };
}

function buildSession(dir) {
  console.log(`\n=== ${dir} ===`);
  execFileSync(
    "npx",
    ["slidev", "build", join(dir, "slides.md"), "--base", `${BASE}${dir}/`, "--out", join(DIST, dir)],
    { cwd: ROOT, stdio: "inherit" },
  );
}

function sessionNumber(dir) {
  const match = dir.match(/^seance-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function renderIndex(sessions) {
  const item = ({ dir, label, subject }) =>
    `<li><a href="${BASE}${dir}/"><span class="label">${escapeHtml(label)}</span>` +
    `<span class="subject">${escapeHtml(subject)}</span></a></li>`;

  const sections = PARTS.map((part) => {
    const items = sessions.filter((s) => {
      const n = sessionNumber(s.dir);
      return n !== null && n >= part.from && n <= part.to;
    });
    if (items.length === 0) return "";
    return `<section><h2>${escapeHtml(part.title)}</h2><ul>${items.map(item).join("")}</ul></section>`;
  });

  const extras = sessions.filter((s) => sessionNumber(s.dir) === null);
  if (extras.length > 0) {
    sections.push(`<section><h2>Pour aller plus loin</h2><ul>${extras.map(item).join("")}</ul></section>`);
  }

  const template = readFileSync(join(ROOT, "site", "index.html"), "utf-8");
  return template.replace("<!-- SEANCES -->", sections.join("\n"));
}

// ---------------------------------------------------------------------------

const dirs = listSessions();
for (const dir of dirs) {
  if (!existsSync(join(ROOT, dir, "slides.md"))) {
    console.error(`Séance introuvable : ${dir}/slides.md`);
    process.exit(1);
  }
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const sessions = dirs.map((dir) => ({ dir, ...readTitle(dir) }));
for (const { dir } of sessions) buildSession(dir);

writeFileSync(join(DIST, "index.html"), renderIndex(sessions));
console.log(`\nSite construit dans dist/ (${sessions.length} séances, base ${BASE})`);
