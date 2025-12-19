const overlay = document.getElementById("detailOverlay");
const closeBtn = document.getElementById("detailClose");
const titleEl = document.getElementById("detailTitle");
const quoteEl = document.getElementById("detailQuote");
const reflectionEl = document.getElementById("detailReflection");

const btnFabio = document.getElementById("btnFabio");
const btnMateus = document.getElementById("btnMateus");

const selectableNodes = Array.from(document.querySelectorAll("#container > div"))
  .filter(el => !el.classList.contains("brain"));

let selectedNode = null;
let selectedKey = null;

let QUOTES = {};
let REFLECTIONS = {};

async function loadData() {
  const [qRes, rRes] = await Promise.all([
    fetch("../assets/data/quotes.json"),
    fetch("../assets/data/reflections.json")
  ]);

  QUOTES = await qRes.json();
  REFLECTIONS = await rRes.json();
}

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

  document.dispatchEvent(new CustomEvent("node:selected", { detail: el }));
}

function closeDetail() {
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");

  if (selectedNode) {
    document.dispatchEvent(new CustomEvent("node:deselected", { detail: selectedNode }));
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

  el.addEventListener("click", (e) => {
    e.stopPropagation();

    if (selectedNode && selectedNode !== el) selectedNode.classList.remove("selected");
    selectedNode = el;
    el.classList.add("selected");

    openDetail(el);
  });

  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      el.click();
    }
  });
});

closeBtn.addEventListener("click", closeDetail);

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeDetail();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDetail();
});

loadData().catch(() => {
  QUOTES = {};
  REFLECTIONS = {};
});
