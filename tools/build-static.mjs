import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(process.cwd(), "public");

mkdirSync(publicDir, { recursive: true });

for (const file of [
  "index.html",
  "styles.css",
  "scripts.js",
  "5.png",
  "Style Board Clinical Physiques.png",
]) {
  copyFileSync(join(process.cwd(), file), join(publicDir, file));
}
