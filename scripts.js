document.addEventListener("DOMContentLoaded", () => {
  const LINES = [
    "BLURRD studio likes to create dope shit with code.",
    "function buildSomethingCool() { return true; }",
    "console.log('Pixels are our playground.');",
    "const mindset = 'bold + intentional';",
    "while (inspired) { create(); }",
    "BLURRD !== boring;",
    "// clean. intentional. custom."
  ];

  const container = document.getElementById("glowCode");
  if (!container) return;

  const isSmall = window.matchMedia("(max-width:640px)").matches;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const REPEAT = isSmall ? 90 : 180;
  const RADIUS = isSmall ? 16 : 20;
  const R2 = RADIUS * RADIUS;
  const cellSize = RADIUS * 2;
  const COLOR_ON = "#3BF8FB";
  const COLOR_OFF = "#EDEDED";

  const code = Array.from({ length: REPEAT }, () => {
    const line = LINES[(Math.random() * LINES.length) | 0];
    return line + "\n";
  }).join("");

  container.style.cssText = `
    position: fixed; inset: 0;
    display: flex; flex-wrap: wrap;
    white-space: pre-wrap;
    font-size: ${isSmall ? 14 : 16}px;
    line-height: 1.4;
    color: ${COLOR_OFF};
    font-family: 'JetBrains Mono', monospace;
    background-color: #FBFAF6;
    pointer-events: none;
  `;

  const frag = document.createDocumentFragment();
  const spans = [];
  for (let i = 0; i < code.length; i++) {
    const span = document.createElement("span");
    span.textContent = code[i];
    frag.appendChild(span);
    spans.push(span);
  }
  container.textContent = "";
  container.appendChild(frag);

  if (prefersReduced) {
    requestAnimationFrame(() => {
      for (let i = 0; i < spans.length; i += 40) {
        const s = spans[i];
        if (!s) continue;
        s.style.color = COLOR_ON;
        s.style.textShadow = `0 0 2px ${COLOR_ON}`;
      }
    });
    return;
  }

  const glows = new Float32Array(spans.length);
  const active = new Set();
  let centers = [];
  let grid = new Map();

  const recalcCenters = () => {
    centers = new Array(spans.length);
    grid = new Map();
    for (let i = 0; i < spans.length; i++) {
      const r = spans[i].getBoundingClientRect();
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.5;
      centers[i] = [cx, cy];
      const gx = Math.floor(cx / cellSize);
      const gy = Math.floor(cy / cellSize);
      const key = gx + "," + gy;
      let bucket = grid.get(key);
      if (!bucket) {
        bucket = [];
        grid.set(key, bucket);
      }
      bucket.push(i);
    }
    wake();
  };

  requestAnimationFrame(recalcCenters);

  const debounce = (fn, d = 120) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), d);
    };
  };
  const debouncedRecalc = debounce(() => requestAnimationFrame(recalcCenters), 120);
  window.addEventListener("resize", debouncedRecalc, { passive: true });

  const pointer = { x: -9999, y: -9999 };
  const setPointer = (e) => {
    const p = e.touches ? e.touches[0] : e;
    pointer.x = p.clientX;
    pointer.y = p.clientY;
  };

  const getBucketIndices = (px, py) => {
    const gcx = Math.floor(px / cellSize);
    const gcy = Math.floor(py / cellSize);
    const out = [];
    for (let dgx = -1; dgx <= 1; dgx++) {
      for (let dgy = -1; dgy <= 1; dgy++) {
        const arr = grid.get(gcx + dgx + "," + (gcy + dgy));
        if (!arr) continue;
        for (let k = 0; k < arr.length; k++) out.push(arr[k]);
      }
    }
    return out;
  };

  const updateSpan = (i, target) => {
    const span = spans[i];
    let glow = glows[i];
    glow += (target - glow) * 0.6;
    glows[i] = glow;

    if (target > 0 || glow > 0.01) {
      span.style.color = target > 0 ? COLOR_ON : COLOR_OFF;
      span.style.textShadow = glow > 0.01 ? `0 0 ${8 * glow}px ${COLOR_ON}` : "none";
    } else if (span.style.color !== COLOR_OFF) {
      span.style.color = COLOR_OFF;
      span.style.textShadow = "none";
    }

    if (glow > 0.01) active.add(i);
    else active.delete(i);
  };

  let animating = false;
  let lastPx = NaN;
  let lastPy = NaN;

  function wake() {
    if (animating) return;
    animating = true;
    requestAnimationFrame(animate);
  }

  function animate() {
    const bucketList = getBucketIndices(pointer.x, pointer.y);
    const processed = new Set();

    for (let b = 0; b < bucketList.length; b++) {
      const i = bucketList[b];
      processed.add(i);
      const c = centers[i];
      if (!c) continue;
      const cx = c[0];
      const cy = c[1];
      const dx = pointer.x - cx;
      const dy = pointer.y - cy;
      const target = dx * dx + dy * dy < R2 ? 1 : 0;
      updateSpan(i, target);
    }

    for (const i of active) {
      if (!processed.has(i)) updateSpan(i, 0);
    }

    if (active.size === 0 && pointer.x === lastPx && pointer.y === lastPy) {
      animating = false;
      return;
    }

    lastPx = pointer.x;
    lastPy = pointer.y;
    requestAnimationFrame(animate);
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      setPointer(e);
      wake();
    },
    { passive: true }
  );

  wake();
});
