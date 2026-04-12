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

  const container = document.getElementById('glowCode');
  if (!container) return;

  const isSmall = window.matchMedia('(max-width:640px)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const REPEAT = isSmall ? 220 : 500;
  const RADIUS = isSmall ? 16 : 20;
  const COLOR_ON = '#3BF8FB';
  const COLOR_OFF = '#EDEDED';

  const code = Array.from({ length: REPEAT }, () => {
    const line = LINES[(Math.random() * LINES.length) | 0];
    return line + "\n";
  }).join('');

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
    z-index: 0;
  `;

  const frag = document.createDocumentFragment();
  const spans = [];
  for (let i = 0; i < code.length; i++) {
    const span = document.createElement('span');
    span.textContent = code[i];
    span.style.transition = "color 0.06s linear, text-shadow 0.06s linear";
    span.dataset.glow = "0";
    frag.appendChild(span);
    spans.push(span);
  }
  container.textContent = '';
  container.appendChild(frag);

  let centers = [];
  const recalcCenters = () => {
    centers = spans.map(s => {
      const r = s.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    });
  };
  requestAnimationFrame(recalcCenters);

  const debounce = (fn, d = 120) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), d); };
  };
  const debouncedRecalc = debounce(() => requestAnimationFrame(recalcCenters), 120);
  window.addEventListener('resize', debouncedRecalc, { passive: true });
  window.addEventListener('orientationchange', debouncedRecalc, { passive: true });
  window.addEventListener('scroll', debouncedRecalc, { passive: true });

  const pointer = { x: -9999, y: -9999 };
  const setPointer = (e) => {
    const p = e.touches ? e.touches[0] : e;
    pointer.x = p.clientX;
    pointer.y = p.clientY;
  };
  window.addEventListener('pointermove', setPointer, { passive: true });
  window.addEventListener('pointerdown', setPointer, { passive: true });

  function animate() {
    if (prefersReduced) {
      for (let i = 0; i < spans.length; i += 40) {
        const s = spans[i];
        if (!s) continue;
        s.style.color = COLOR_ON;
        s.style.textShadow = `0 0 2px ${COLOR_ON}`;
      }
      return;
    }

    for (let i = 0; i < spans.length; i++) {
      const [cx, cy] = centers[i] || [Infinity, Infinity];
      const dx = pointer.x - cx;
      const dy = pointer.y - cy;
      const dist = Math.hypot(dx, dy);
      const target = dist < RADIUS ? 1 : 0;

      let glow = parseFloat(spans[i].dataset.glow) || 0;
      glow += (target - glow) * 0.6;
      spans[i].dataset.glow = glow;

      if (target > 0 || glow > 0.01) {
        spans[i].style.color = target > 0 ? COLOR_ON : COLOR_OFF;
        spans[i].style.textShadow = glow > 0.01 ? `0 0 ${8 * glow}px ${COLOR_ON}` : 'none';
      } else if (spans[i].style.color !== COLOR_OFF) {
        spans[i].style.color = COLOR_OFF;
        spans[i].style.textShadow = 'none';
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
});
