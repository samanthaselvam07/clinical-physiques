/* Clinical Physiques — site interactions */

/* ---------- Mobile navigation ---------- */
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("primary-nav");

function setNav(open) {
  if (!navToggle || !nav) return;
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  nav.classList.toggle("is-open", open);
  document.body.classList.toggle("nav-open", open);
}

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    setNav(navToggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setNav(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
      setNav(false);
      navToggle.focus();
    }
  });

  window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
    if (event.matches) setNav(false);
  });
}

/* ---------- Header border once scrolled ---------- */
if (header) {
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- Reveal on scroll (below-the-fold content only) ---------- */
const revealItems = document.querySelectorAll(".reveal");

if (revealItems.length > 0) {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
}

/* ---------- Lead forms (posts JSON to /api/*) ---------- */
document.querySelectorAll(".lead-form").forEach((form) => {
  const submitButton = form.querySelector("button[type='submit']");
  const status = form.querySelector("[data-form-status]");
  const defaultButtonText = submitButton?.textContent || "Submit";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const payload = {
      firstName: String(formData.get("first-name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      company: String(formData.get("company") || "").trim(),
    };
    const interest = String(formData.get("interest") || "").trim();
    if (interest) payload.interest = interest;

    const endpoint = form.getAttribute("action") || "/api/resource";

    status.textContent = "Sending…";
    status.dataset.state = "loading";
    submitButton.disabled = true;
    submitButton.textContent = "Sending…";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong. Please try again.");
      }

      form.reset();
      status.textContent = result.message || "Thank you. Please check your inbox.";
      status.dataset.state = "success";
      submitButton.textContent = "Done";
    } catch (error) {
      status.textContent = error.message;
      status.dataset.state = "error";
      submitButton.disabled = false;
      submitButton.textContent = defaultButtonText;
    }
  });
});

/* ---------- Client results: flip cards ---------- */
function setFlipped(flip, flipped, { moveFocus = true } = {}) {
  const trigger = flip.querySelector(".flip-trigger");
  const front = flip.querySelector(".flip-front");
  const back = flip.querySelector(".flip-back");
  flip.classList.toggle("is-flipped", flipped);
  trigger.setAttribute("aria-expanded", String(flipped));
  back.inert = !flipped;
  front.inert = flipped;
  if (moveFocus) {
    (flipped ? back.querySelector("[data-story]") : trigger)?.focus({ preventScroll: true });
  }
}

document.querySelectorAll("[data-flip]").forEach((flip) => {
  flip.querySelector(".flip-trigger").addEventListener("click", () => {
    // Only one card open at a time keeps the grid calm
    document.querySelectorAll("[data-flip].is-flipped").forEach((other) => {
      if (other !== flip) setFlipped(other, false, { moveFocus: false });
    });
    setFlipped(flip, true);
  });

  flip.querySelector(".flip-close").addEventListener("click", () => setFlipped(flip, false));

  flip.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && flip.classList.contains("is-flipped")) setFlipped(flip, false);
  });
});

/* ---------- Client results: full story dialog ---------- */
const story = document.querySelector("dialog.story");

if (story && typeof story.showModal === "function") {
  const storyImg = story.querySelector(".story-img");
  const storyTitle = story.querySelector(".story-title");
  const storyStats = story.querySelector(".story-stats");
  const storyQuote = story.querySelector(".story-quote-wrap");
  let returnFocus = null;

  document.querySelectorAll("[data-story]").forEach((button) => {
    button.addEventListener("click", () => {
      const result = button.closest(".result");
      const thumb = result.querySelector(".flip-front img");
      const stats = [...result.querySelectorAll(".flip-stats li")].map((li) => li.textContent);
      const name = result.querySelector(".flip-eyebrow")?.textContent.trim();
      const quote = result.querySelector("template.story-quote");

      storyImg.src = thumb.dataset.full || thumb.src;
      storyImg.alt = thumb.alt;
      storyTitle.textContent = name && name !== "Client result" ? name : stats[0] || "Client result";
      storyStats.replaceChildren(...stats.map((text) => Object.assign(document.createElement("li"), { textContent: text })));
      storyQuote.replaceChildren();
      if (quote) {
        const blockquote = document.createElement("blockquote");
        blockquote.className = "story-quote";
        blockquote.append(quote.content.cloneNode(true));
        storyQuote.append(blockquote);
      }
      story.classList.toggle("has-quote", Boolean(quote));
      returnFocus = button;
      story.showModal();
      story.scrollTop = 0;
    });
  });

  story.querySelector(".story-close").addEventListener("click", () => story.close());
  story.addEventListener("click", (event) => {
    if (event.target === story) story.close();
  });
  story.addEventListener("close", () => {
    storyImg.src = "";
    returnFocus?.focus();
  });
}

/* ---------- Rotating client proof (homepage results + quote spots) ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FADE_MS = 350;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Tracks whether a rotating block is on screen, so nothing changes out of view
function watchVisibility(element) {
  const state = { visible: false };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting;
    }, { threshold: 0.35 }).observe(element);
  } else {
    state.visible = true;
  }
  return state;
}

// Small pause/play control (WCAG 2.2.2: auto-updating content must be pausable)
function addRotateToggle(after, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "rotate-toggle";
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = '<span class="rotate-toggle-icon" aria-hidden="true"></span><span class="rotate-toggle-text">Pause</span>';
  button.setAttribute("aria-label", `Pause rotating ${label}`);
  button.addEventListener("click", () => {
    const paused = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(paused));
    button.querySelector(".rotate-toggle-text").textContent = paused ? "Play" : "Pause";
    button.setAttribute("aria-label", `${paused ? "Resume" : "Pause"} rotating ${label}`);
  });
  after.after(button);
  return () => button.getAttribute("aria-pressed") === "true";
}

function isInteracting(element) {
  return element.matches(":hover") || element.contains(document.activeElement);
}

/* Quotes: proof cards, testimonials and quote bands outside the results page */
const quoteGroups = document.querySelectorAll("[data-rotate-group]");

if (quoteGroups.length > 0) {
  fetch("assets/quotes.json")
    .then((response) => (response.ok ? response.json() : []))
    .then((quotes) => {
      if (!Array.isArray(quotes) || quotes.length < 2) return;

      const slots = [...document.querySelectorAll("[data-rotate-quote]")];
      const nameOf = (slot) => (slot.querySelector(".proof-meta strong, figcaption")?.firstChild?.textContent || "").trim();
      const onPage = () => new Set(slots.map(nameOf));
      let queue = [];

      const nextQuote = () => {
        const showing = onPage();
        for (let tries = 0; tries < 2; tries += 1) {
          const index = queue.findIndex((q) => !showing.has(q.name));
          if (index !== -1) return queue.splice(index, 1)[0];
          queue = shuffle(quotes);
        }
        return null;
      };

      const render = (slot, q) => {
        const text = slot.querySelector("blockquote p");
        const marks = slot.matches(".proof, .quote-inline");
        text.textContent = marks ? `“${q.quote}”` : q.quote;
        const meta = slot.querySelector(".proof-meta");
        if (meta) {
          const strong = document.createElement("strong");
          strong.textContent = q.name;
          meta.replaceChildren(strong, document.createTextNode(` ${q.meta}`));
        } else {
          const caption = slot.querySelector("figcaption");
          const span = document.createElement("span");
          span.textContent = q.meta || "Clinical Physiques client";
          caption.replaceChildren(document.createTextNode(q.name), span);
        }
      };

      const swap = async (slot) => {
        const q = nextQuote();
        if (!q) return;
        const quote = slot.querySelector("blockquote");
        // Never let the block shrink mid-read, so content below does not jump up and down
        quote.style.minHeight = `${quote.offsetHeight}px`;
        slot.classList.add("is-swapping");
        await wait(FADE_MS);
        render(slot, q);
        quote.style.minHeight = `${Math.max(quote.offsetHeight, parseFloat(quote.style.minHeight))}px`;
        slot.classList.remove("is-swapping");
      };

      if (reduceMotion) {
        // No movement: show a fresh selection on each visit instead
        queue = shuffle(quotes);
        slots.forEach((slot) => {
          const q = nextQuote();
          if (q) render(slot, q);
        });
        return;
      }

      queue = shuffle(quotes);
      quoteGroups.forEach((group, groupIndex) => {
        const groupSlots = group.matches("[data-rotate-quote]") ? [group] : [...group.querySelectorAll("[data-rotate-quote]")];
        if (groupSlots.length === 0) return;
        const seen = watchVisibility(group);
        const isPaused = addRotateToggle(group, groupSlots.length > 1 ? "client quotes" : "client quote");
        let turn = 0;
        const tick = () => {
          if (seen.visible && !document.hidden && !isPaused() && !isInteracting(group)) {
            swap(groupSlots[turn % groupSlots.length]);
            turn += 1;
          }
        };
        // Stagger groups so the page never changes all at once
        setTimeout(() => setInterval(tick, groupSlots.length > 1 ? 6000 : 9000), groupIndex * 1500);
      });
    })
    .catch(() => {});
}

/* Homepage result cards: swap one card at a time through the full set */
const resultsGrid = document.querySelector("[data-rotate-results]");

if (resultsGrid && resultsGrid.querySelector("[data-pool]")) {
  const pool = [...resultsGrid.querySelectorAll(".result[data-pool]")];
  let queue = shuffle(pool);
  let slot = 0;

  const preload = (card) => {
    const img = card.querySelector(".flip-front img");
    img.loading = "eager";
    return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  };

  const swapCard = async () => {
    const shown = [...resultsGrid.querySelectorAll(".result:not([hidden])")];
    if (shown.length === 0) return;
    if (queue.length === 0) queue = shuffle([...resultsGrid.querySelectorAll(".result[hidden]")]);
    const incoming = queue.shift();
    const outgoing = shown[slot % shown.length];
    slot += 1;
    if (!incoming || !outgoing) return;

    await preload(incoming);
    outgoing.classList.add("is-swapping");
    await wait(FADE_MS);
    incoming.classList.add("is-visible", "is-swapping");
    incoming.hidden = false;
    outgoing.replaceWith(incoming);
    outgoing.hidden = true;
    outgoing.classList.remove("is-swapping");
    resultsGrid.append(outgoing);
    queue.push(outgoing);
    requestAnimationFrame(() => requestAnimationFrame(() => incoming.classList.remove("is-swapping")));
  };

  if (reduceMotion) {
    // No movement: a different set of four on each visit
    const shown = [...resultsGrid.querySelectorAll(".result:not([hidden])")];
    shuffle(pool).slice(0, shown.length).forEach((card, i) => {
      card.hidden = false;
      shown[i].replaceWith(card);
      shown[i].hidden = true;
      resultsGrid.append(shown[i]);
    });
  } else {
    const seen = watchVisibility(resultsGrid);
    const isPaused = addRotateToggle(resultsGrid, "client results");
    setInterval(() => {
      const busy = resultsGrid.querySelector(".is-flipped") || document.querySelector("dialog.story[open]");
      if (seen.visible && !document.hidden && !isPaused() && !busy && !isInteracting(resultsGrid)) swapCard();
    }, 5000);
  }
}
