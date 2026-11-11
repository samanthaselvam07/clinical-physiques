import { cpSync, copyFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");

rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });

// resources.html and blog.html are drafts and are left out until their content is ready
for (const file of [
  "index.html",
  "about.html",
  "privacy.html",
  "results.html",
  "styles.css",
  "scripts.js",
  "robots.txt",
  "sitemap.xml",
]) {
  copyFileSync(join(root, file), join(publicDir, file));
}

cpSync(join(root, "assets"), join(publicDir, "assets"), { recursive: true });
