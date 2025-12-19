let interactionPaused = false;

document.addEventListener("node:selected", () => {
    interactionPaused = true;
});

document.addEventListener("node:deselected", () => {
    interactionPaused = false;
});


const container = document.getElementById("container");
const center = container.querySelector(".brain");
const nodes = Array.from(container.children).filter(el => el !== center);

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "100%");
svg.style.position = "absolute";
svg.style.inset = "0";
svg.style.pointerEvents = "none";
container.prepend(svg);

const paths = nodes.map(() => document.createElementNS("http://www.w3.org/2000/svg", "path"));
paths.forEach(p => {
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#555");
    p.setAttribute("stroke-width", "2");
    svg.appendChild(p);
});

const basePos = nodes.map(() => ({ x: 0, y: 0 }));
const state = nodes.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));
const target = nodes.map(() => ({ x: 0, y: 0 }));
const elastic = nodes.map(() => 0);

let followIndex = null;
let raf = null;
let lastT = 0;

const DRAG_RADIUS = 140;

const SPRING_K = 160;
const DAMPING = 26;

const SPEED_ON = 12;
const SPEED_FULL = 900;
const ELASTIC_EASE = 0.12;

const SETTLE_DIST = 0.6;
const SETTLE_SPEED = 10;

const clampToRadius = (bx, by, x, y, r) => {
    const dx = x - bx;
    const dy = y - by;
    const d = Math.hypot(dx, dy);
    if (d <= r || d === 0) return { x, y };
    const k = r / d;
    return { x: bx + dx * k, y: by + dy * k };
};

const getNodePos = (el) => ({
    x: parseFloat(el.style.left) || 0,
    y: parseFloat(el.style.top) || 0
});

function setNodePos(el, x, y) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
}

function layoutMindMap() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const cx = w / 2;
    const cy = h / 2;

    setNodePos(center, cx, cy);

    const baseR = Math.min(w, h) * 0.38;
    const n = nodes.length;

    for (let i = 0; i < n; i++) {
        const angle = (-Math.PI / 2) + (i * (2 * Math.PI / n));
        const x = cx + baseR * Math.cos(angle);
        const y = cy + baseR * Math.sin(angle);

        basePos[i].x = x;
        basePos[i].y = y;

        if (followIndex !== i) {
            setNodePos(nodes[i], x, y);
            state[i].x = x; state[i].y = y;
            state[i].vx = 0; state[i].vy = 0;
            target[i].x = x; target[i].y = y;
            elastic[i] = 0;
        }
    }

    drawAllPaths();
}

function drawElasticPath(cx, cy, x, y, strength) {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy) || 1;

    const mx = (cx + x) / 2;
    const my = (cy + y) / 2;

    const px = -dy / dist;
    const py = dx / dist;

    const c1x = mx + px * strength;
    const c1y = my + py * strength;

    return `M ${cx} ${cy} Q ${c1x} ${c1y} ${x} ${y}`;
}

function drawAllPaths() {
    const cx = parseFloat(center.style.left) || container.clientWidth / 2;
    const cy = parseFloat(center.style.top) || container.clientHeight / 2;

    for (let i = 0; i < nodes.length; i++) {
        const p = (followIndex === i) ? state[i] : getNodePos(nodes[i]);
        const dist = Math.hypot(p.x - cx, p.y - cy);
        const strength = dist * elastic[i];
        paths[i].setAttribute("d", drawElasticPath(cx, cy, p.x, p.y, strength));
    }
}

function needsAnimating() {
    for (let i = 0; i < nodes.length; i++) {
        const dx = target[i].x - state[i].x;
        const dy = target[i].y - state[i].y;
        const dist = Math.hypot(dx, dy);
        const speed = Math.hypot(state[i].vx, state[i].vy);
        if (dist > SETTLE_DIST || speed > SETTLE_SPEED || elastic[i] > 0.002) return true;
    }
    return false;
}

function startRAF() {
    if (raf) return;
    lastT = performance.now();

    const tick = (now) => {
        const dt = Math.min(0.03, (now - lastT) / 1000);
        lastT = now;

        for (let i = 0; i < nodes.length; i++) {
            const dx = target[i].x - state[i].x;
            const dy = target[i].y - state[i].y;

            const ax = SPRING_K * dx - DAMPING * state[i].vx;
            const ay = SPRING_K * dy - DAMPING * state[i].vy;

            state[i].vx += ax * dt;
            state[i].vy += ay * dt;

            state[i].x += state[i].vx * dt;
            state[i].y += state[i].vy * dt;

            const speed = Math.hypot(state[i].vx, state[i].vy);

            const desiredElastic =
                (followIndex === i && speed > SPEED_ON)
                    ? Math.min(0.22, 0.22 * (speed / SPEED_FULL))
                    : 0;

            elastic[i] += (desiredElastic - elastic[i]) * (1 - Math.pow(1 - ELASTIC_EASE, dt * 60));

            if (followIndex === i) {
                setNodePos(nodes[i], state[i].x, state[i].y);
            } else {
                setNodePos(nodes[i], state[i].x, state[i].y);
            }
        }

        drawAllPaths();

        if (!needsAnimating()) {
            raf = null;
            return;
        }

        raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
}

nodes.forEach((el, i) => {
    el.addEventListener("mouseenter", () => {
        if (interactionPaused) return;
        followIndex = i;

        const p = getNodePos(el);
        state[i].x = p.x; state[i].y = p.y;
        state[i].vx = 0; state[i].vy = 0;

        target[i].x = p.x;
        target[i].y = p.y;

        startRAF();
    });

    el.addEventListener("mouseleave", () => {
        if (interactionPaused) return;

        target[i].x = basePos[i].x;
        target[i].y = basePos[i].y;

        followIndex = null;

        startRAF();
    });

});

container.addEventListener("mousemove", (e) => {
    if (interactionPaused || followIndex === null) return;

    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const bx = basePos[followIndex].x;
    const by = basePos[followIndex].y;

    const clamped = clampToRadius(bx, by, mx, my, DRAG_RADIUS);
    target[followIndex].x = clamped.x;
    target[followIndex].y = clamped.y;

    startRAF();
});

window.addEventListener("resize", () => {
    const oldFollow = followIndex;
    followIndex = null;
    layoutMindMap();
    followIndex = oldFollow;
    if (followIndex !== null) {
        const p = getNodePos(nodes[followIndex]);
        state[followIndex].x = p.x; state[followIndex].y = p.y;
        state[followIndex].vx = 0; state[followIndex].vy = 0;
        target[followIndex].x = p.x; target[followIndex].y = p.y;
        startRAF();
    }
});

layoutMindMap();
