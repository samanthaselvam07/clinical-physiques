// Renders client result flip cards from content/results.json into the HTML pages,
// between <!-- results:start --> and <!-- results:end --> markers.
//   results.html          -> every result
//   index.html (homepage) -> results marked "featured" shown first; the rest are
//                            hidden and rotated in by scripts.js
//   assets/quotes.json    -> short highlight quotes rotated through quote spots
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const root = process.cwd();
const { results, otherQuotes = [] } = JSON.parse(readFileSync(join(root, "content/results.json"), "utf8"));

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Short content hash appended to image URLs so replaced photos are never served from cache
const version = (file) => createHash("md5").update(readFileSync(join(root, file))).digest("hex").slice(0, 8);

function paragraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");
}

function card(result, index, { eager = false, pooled = false } = {}) {
  const id = `${result.image}-back`;
  const hasQuote = Boolean(result.quote && result.quote.trim());
  const name = result.name?.trim();
  const headline = result.stats[0] || "Client result";
  const alt = `Client before and after: ${result.stats.join("; ")}`;
  const thumb = `assets/results/${result.image}-600.webp`;
  const full = `assets/results/${result.image}.webp`;
  const thumbUrl = `${thumb}?v=${version(thumb)}`;
  const fullUrl = `${full}?v=${version(full)}`;
  const firstParagraph = hasQuote ? result.quote.trim().split(/\n\s*\n/)[0] : "";

  return `            <li class="result reveal"${pooled ? " hidden data-pool" : ""}>
              <div class="flip" data-flip>
                <div class="flip-inner">
                  <div class="flip-front">
                    <img src="${thumbUrl}" data-full="${fullUrl}" alt="${esc(alt)}" width="600" height="800"${eager ? "" : ' loading="lazy"'} decoding="async">
                    <button class="flip-trigger" type="button" aria-expanded="false" aria-controls="${id}">
                      <span class="visually-hidden">Show details: ${esc(headline)}</span>
                      <span class="flip-chip" aria-hidden="true"><span class="flip-chip-label">${hasQuote ? `Read ${result.pronoun === "his" ? "his" : "her"} story` : "See the details"}</span></span>
                    </button>
                  </div>
                  <div class="flip-back" id="${id}" inert>
                    <p class="flip-eyebrow">${name ? esc(name) : "Client result"}</p>
                    <ul class="flip-stats">
${result.stats.map((s) => `                      <li>${esc(s)}</li>`).join("\n")}
                    </ul>
${hasQuote ? `                    <blockquote class="flip-quote"><p>${esc(firstParagraph)}</p></blockquote>\n` : ""}                    <div class="flip-actions">
                      <button class="button button-small" type="button" data-story>${hasQuote ? "Read full testimonial" : "View full photo"}</button>
                      <button class="flip-close" type="button" aria-label="Flip card back">&#8634;</button>
                    </div>
                  </div>
                </div>
              </div>
${hasQuote ? `              <template class="story-quote">${paragraphs(result.quote)}</template>\n` : ""}            </li>
`;
}

function inject(file, cards) {
  const path = join(root, file);
  const html = readFileSync(path, "utf8");
  const pattern = /(<!-- results:start -->\n)[\s\S]*?(\s*<!-- results:end -->)/;
  if (!pattern.test(html)) {
    throw new Error(`${file} is missing the <!-- results:start --> / <!-- results:end --> markers`);
  }
  writeFileSync(path, html.replace(pattern, `$1${cards}$2`));
}

inject("results.html", results.map((r, i) => card(r, i, { eager: i < 3 })).join(""));
const featured = results.filter((r) => r.featured);
const rest = results.filter((r) => !r.featured);
inject("index.html", [...featured.map((r, i) => card(r, i)), ...rest.map((r, i) => card(r, i, { pooled: true }))].join(""));

const quotes = [
  ...results.filter((r) => r.highlight && r.name).map((r) => ({ name: r.name.trim(), quote: r.highlight.trim(), meta: (r.highlightMeta || "").trim() })),
  ...otherQuotes.map((q) => ({ name: q.name.trim(), quote: q.quote.trim(), meta: (q.meta || "").trim() })),
];
writeFileSync(join(root, "assets/quotes.json"), JSON.stringify(quotes, null, 2) + "\n");

console.log(`Rendered ${results.length} results (${featured.length} featured) and ${quotes.length} rotating quotes.`);
