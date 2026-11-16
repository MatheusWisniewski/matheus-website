(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Year ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Nav: scroll state, mobile menu, active link ---------- */
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const links = $("#navLinks");

  const setMenu = (open) => {
    links.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  $$("a", links).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 921px)").addEventListener("change", (e) => {
    if (e.matches && links.classList.contains("open")) setMenu(false);
  });

  const sections = $$("main section[id]");
  const navMap = new Map($$("a[href^='#']", links).map((a) => [a.getAttribute("href").slice(1), a]));
  const activeObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          navMap.forEach((a) => a.classList.remove("active"));
          navMap.get(e.target.id)?.classList.add("active");
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => activeObs.observe(s));

  /* ---------- Scroll progress + timeline fill ---------- */
  const progress = $(".scroll-progress");
  const timeline = $(".timeline");
  let ticking = false;
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progress.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    nav.classList.toggle("scrolled", h.scrollTop > 20);

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      timeline.style.setProperty("--progress", p.toFixed(4));
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll (with stagger) ---------- */
  const groups = new Map();
  $$(".reveal").forEach((el) => {
    const parent = el.parentElement;
    const idx = groups.get(parent) ?? 0;
    groups.set(parent, idx + 1);
    el.style.setProperty("--stagger", `${Math.min(idx, 6) * 0.08}s`);
  });

  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add("visible");
        // language bars
        if (el.dataset.level) $(".bar i", el).style.width = el.dataset.level + "%";
        // counters
        $$("[data-count]", el).forEach(countUp);
        revealObs.unobserve(el);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => revealObs.observe(el));

  function countUp(el) {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    // calendar years (e.g. 2024) are dates, not quantities: show them as-is
    if (prefersReduced || target >= 1900) { el.textContent = target + suffix; return; }
    const dur = 1600;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(target * eased) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Typing effect (localised via i18n.js) ---------- */
  const phrasesFor = () => (window.I18N ? window.I18N.t("typed") : ["Building UIs for Google AI Studio"]);
  const typedEl = $("#typed");
  if (prefersReduced) {
    typedEl.textContent = phrasesFor()[0];
    window.addEventListener("langchange", () => { typedEl.textContent = phrasesFor()[0]; });
  } else {
    let phrases = phrasesFor(), pi = 0, ci = 0, deleting = false, timer;
    const tick = () => {
      const word = phrases[pi];
      ci += deleting ? -1 : 1;
      typedEl.textContent = word.slice(0, ci);
      let delay = deleting ? 28 : 55 + Math.random() * 45;
      if (!deleting && ci === word.length) { delay = 1900; deleting = true; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 350; }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 1100);
    window.addEventListener("langchange", () => {
      clearTimeout(timer);
      phrases = phrasesFor(); pi = 0; ci = 0; deleting = false;
      typedEl.textContent = "";
      timer = setTimeout(tick, 250);
    });
  }

  /* ---------- "Hello" in his languages ---------- */
  const hellos = ["Hello", "Olá", "Bonjour", "Hola", "こんにちは", "Ciao", "Cześć"];
  const helloEl = $("#hello");
  if (helloEl && !prefersReduced) {
    let hi = 0;
    setInterval(() => {
      helloEl.classList.add("out");
      setTimeout(() => {
        hi = (hi + 1) % hellos.length;
        helloEl.textContent = hellos[hi];
        helloEl.classList.remove("out");
      }, 450);
    }, 2200);
  }

  /* ---------- Card spotlight + tilt ---------- */
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer) {
    $$(".card, .skill-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
    if (!prefersReduced) {
      $$(".tilt").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
          if (!card.classList.contains("visible")) return;
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`;
        });
        card.addEventListener("pointerleave", () => (card.style.transform = ""));
      });
    }

    const glow = $(".cursor-glow");
    let gx = 0, gy = 0, tx = 0, ty = 0, gliding = false;
    // the glow eases toward the pointer, then the loop sleeps until the pointer moves again
    const follow = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx - 260}px, ${gy - 260}px)`;
      if (Math.hypot(tx - gx, ty - gy) < 0.5) { gliding = false; return; }
      requestAnimationFrame(follow);
    };
    glow.style.left = glow.style.top = "0";
    glow.style.transform = "translate(-9999px,-9999px)";
    if (!prefersReduced) {
      window.addEventListener("pointermove", (e) => {
        tx = e.clientX; ty = e.clientY;
        if (!gliding) { gliding = true; requestAnimationFrame(follow); }
      }, { passive: true });
    }
  }

  /* ---------- 2D neural network canvas (fallback when WebGL is unavailable) ---------- */
  window.startNeural2D = () => {
  const canvas = $("#neural");
  if (!canvas) return;
  canvas.style.display = "block";
  const ctx = canvas.getContext("2d");
  let W, H, DPR, nodes = [], pulses = [];
  const mouse = { x: -9999, y: -9999 };
  const colors = ["79,140,255", "155,114,255", "232,111,193"];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.round(Math.min(110, Math.max(35, (W * H) / 14000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.8,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    pulses = [];
  }

  const LINK = 140;
  function frame() {
    ctx.clearRect(0, 0, W, H);

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      const dx = n.x - mouse.x, dy = n.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 22000) { // gentle repulsion around the cursor
        const f = (1 - d2 / 22000) * 0.6;
        const d = Math.sqrt(d2) || 1;
        n.x += (dx / d) * f; n.y += (dy / d) * f;
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK) {
          const alpha = (1 - d / LINK) * 0.28;
          ctx.strokeStyle = `rgba(${a.c},${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          // occasionally fire a signal along this edge
          if (Math.random() < 0.0009 && pulses.length < 18) pulses.push({ a, b, t: 0, c: b.c });
        }
      }
      // connections to cursor
      const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (md < 180) {
        ctx.strokeStyle = `rgba(155,114,255,${(1 - md / 180) * 0.5})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }

    for (const n of nodes) {
      ctx.fillStyle = `rgba(${n.c},0.85)`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }

    // signal pulses travelling between neurons
    pulses = pulses.filter((p) => p.t <= 1);
    for (const p of pulses) {
      p.t += 0.02;
      const x = p.a.x + (p.b.x - p.a.x) * p.t;
      const y = p.a.y + (p.b.y - p.a.y) * p.t;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
      g.addColorStop(0, `rgba(${p.c},0.95)`);
      g.addColorStop(1, `rgba(${p.c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    }

    if (running) requestAnimationFrame(frame);
  }

  let running = false;
  const heroObs = new IntersectionObserver(([e]) => {
    const should = e.isIntersecting && !prefersReduced;
    if (should && !running) { running = true; requestAnimationFrame(frame); }
    else if (!should) running = false;
  });

  resize();
  if (prefersReduced) { running = false; frame(); }
  heroObs.observe(canvas);

  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  if (!prefersReduced) {
    const hero = $(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  }
  };
})();
