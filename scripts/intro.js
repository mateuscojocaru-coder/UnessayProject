const intro = document.getElementById("navbar");

window.scrollTo(0, 0);

function handleScroll() {
  const vh = window.innerHeight;
  const y = Math.min(1, window.scrollY / vh);

  intro.style.opacity = `${1 - y}`;
  intro.style.transform = `scale(${1 - y * 0.08})`;

  if (y >= 0.5) {
    intro.classList.add("is-gone");
  } else {
    intro.classList.remove("is-gone");
  }
}

window.addEventListener("scroll", handleScroll, { passive: true });
handleScroll();