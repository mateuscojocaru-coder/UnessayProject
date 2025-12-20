const overlay = document.getElementById("detailOverlay");
const closeBtn = document.getElementById("detailClose");
const titleEl = document.getElementById("detailTitle");
const quoteEl = document.getElementById("detailQuote");
const reflectionEl = document.getElementById("detailReflection");

const btnFabio = document.getElementById("btnFabio");
const btnMateus = document.getElementById("btnMateus");

const selectableNodes = Array.from(
  document.querySelectorAll("#container > div")
).filter(el => !el.classList.contains("brain"));

let selectedNode = null;
let selectedKey = null;

// Embedded JSON data
const QUOTES = {
  "innocence": "\"Alas! I could not foresee that those sweet hours of instruction would be followed by such bitter days\" (Duras 19)",
  "recognition": "\"I do not have friends, Madame, I have protectors, and that is quite a different matter\" (Duras 27)",
  "exclusion": "\"She has entered society without its permission; society will have its revenge\" (Duras 20)",
  "isolation": "\"I needed those I loved; it did not occur to me that those I loved did not need me\" (Duras 20)",
  "desire": "\"The picture of this young mother with her son moved everyone. (...) My heart devoured this image of a happiness that would always be foreign to me, and envy, like a vulture, fed in my breast\" (Duras 27)",
  "resignation": "\"Let me go, Charles, to the only place where I may think of you constantly\" (Duras 29)"
};

const REFLECTIONS = {
  "innocence": {
    "fabio": "This quote defines innocence as a state of ignorance because she has no idea that the same lessons would later make her loneliness so much harder to handle.",
    "mateus": "This highlights the tragic irony of her \"rescue\": her innocence becomes a weapon forged against her future self as that very education will later lead to her suffering."
  },
  "recognition": {
    "fabio": "Ourika faces the harsh truth: the people she thought were her friends don't treat her like one. They look after her, but they don't see her as an equal.",
    "mateus": "Ourika realizes that her social position, defined by her race, limits her from forming true friendships, reflecting her doll-like treatment."
  },
  "exclusion": {
    "fabio": "The word \"revenge\" makes it clear this isn't an accident, it's a punishment for being where she doesn't belong.",
    "mateus": "Exclusion is framed here not as indifference, but as an active retaliation by society against Ourika for daring to step outside the boundaries set for her."
  },
  "isolation": {
    "fabio": "This shows her loneliness isn't just about being alone, but about feeling invisible in the hearts of the only family she's ever known.",
    "mateus": "This moment reveals the painful understanding that her emotional bonds were an illusion, and her love existed without reciprocity."
  },
  "desire": {
    "fabio": "The \"vulture\" image represents her repressed internal envy which is destroying her from the inside out.",
    "mateus": "Her desire reflects romantic feelings for Charles, maternal responsibilities, and social belonging; all embodying a domestic life from which she is racially excluded."
  },
  "resignation": {
    "fabio": "Her final choice is to lock herself away with all her pain because it's too hard to stay and watch Charles live his full life without her.",
    "mateus": "Resignation here is presented not as spiritual peace, but as a retreat to a place where she may may quietly degrade, away from her cruel world."
  }
};

function getKey(el) {
  return [...el.classList].find(c => c !== "selected") || "node";
}

function openDetail(el) {
  selectedKey = getKey(el);
  const header = el.querySelector("h3")?.textContent?.trim() || selectedKey;

  titleEl.textContent = header;
  quoteEl.textContent = QUOTES[selectedKey] ?? "No quote yet.";
  reflectionEl.textContent = "Choose a reflection.";

  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");

  document.dispatchEvent(
    new CustomEvent("node:selected", { detail: el })
  );
}

function closeDetail() {
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");

  if (selectedNode) {
    document.dispatchEvent(
      new CustomEvent("node:deselected", { detail: selectedNode })
    );
    selectedNode.classList.remove("selected");
    selectedNode = null;
  }

  selectedKey = null;
  reflectionEl.textContent = "";
  quoteEl.textContent = "";
}

function showReflection(who) {
  if (!selectedKey) return;

  const nodeData = REFLECTIONS[selectedKey];
  if (!nodeData) {
    reflectionEl.textContent = "No reflections for this node yet.";
    return;
  }

  const text = nodeData[who];
  reflectionEl.textContent = text ?? `No ${who} reflection yet.`;
}

btnFabio.addEventListener("click", () => showReflection("fabio"));
btnMateus.addEventListener("click", () => showReflection("mateus"));

selectableNodes.forEach(el => {
  el.tabIndex = 0;

  el.addEventListener("click", e => {
    e.stopPropagation();

    if (selectedNode && selectedNode !== el) {
      selectedNode.classList.remove("selected");
    }

    selectedNode = el;
    el.classList.add("selected");

    openDetail(el);
  });

  el.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      el.click();
    }
  });
});

closeBtn.addEventListener("click", closeDetail);

overlay.addEventListener("click", e => {
  if (e.target === overlay) closeDetail();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeDetail();
});