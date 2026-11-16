/* Optics Lab — Prism · Fiber · SPR
   Lean 2D canvas bench (plain 2D canvas, no network). Snell + Cauchy dispersion with
   Fresnel/TIR in a glass prism, bend loss in an FTTH silica fiber, and Kretschmann
   surface plasmon resonance on a 50 nm gold film. */

const DEG = Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

const MODES = {
  prism: { min: -48, max: 48, step: 1, def: 8 },
  fiber: { min: 0, max: 100, step: 2, def: 30 },
  spr: { min: 38, max: 76, step: 0.5, def: 56 },
};

const STR = {
  en: {
    hint: {
      prism: "Drag the ring or use Arrow keys to tilt the prism — push past the critical angle for internal reflection",
      fiber: "Drag the fiber core or use Arrow keys to tighten the bend — bend past the critical angle to leak light",
      spr: "Sweep the laser angle onto the 50 nm gold film — find θ ≈ 62.4° to ignite surface plasmon resonance",
    },
    aria: { prism: "Prism tilt angle", fiber: "Fiber bend intensity", spr: "Laser incidence angle on gold film" },
    disp: "Cauchy dispersion", tir: "Internal reflection",
    bend: "bend", guided: "guided", tirTag: "TIR", loss: "loss",
    res: "SPR resonance ★", dec: ".",
  },
  pt: {
    hint: {
      prism: "Arraste o anel ou use as setas para inclinar o prisma — passe do ângulo crítico para reflexão interna",
      fiber: "Arraste o núcleo da fibra ou use as setas para curvar — passe do ângulo crítico para vazar luz",
      spr: "Varra o ângulo do laser no filme de ouro (50 nm) — encontre θ ≈ 62,4° para excitar o plásmon",
    },
    aria: { prism: "Ângulo de inclinação do prisma", fiber: "Intensidade de curvatura da fibra", spr: "Ângulo de incidência do laser no filme de ouro" },
    disp: "Dispersão de Cauchy", tir: "Reflexão interna",
    bend: "curva", guided: "guiado", tirTag: "TIR", loss: "perda",
    res: "Ressonância SPR ★", dec: ",",
  },
};

/* ---------- spectrum (#4f8cff → #9b72ff → #e86fc1), 420–670 nm ---------- */
const N_RAYS = 14;
const C0 = [79, 140, 255], C1 = [155, 114, 255], C2 = [232, 111, 193];
function specRGB(t) {
  const a = t < 0.5 ? C0 : C1, b = t < 0.5 ? C1 : C2, k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;
}
const RAY_COL = [], RAY_N = new Float64Array(N_RAYS);
for (let i = 0; i < N_RAYS; i++) {
  const t = i / (N_RAYS - 1), lam = 0.42 + 0.25 * t; // µm
  RAY_COL.push(specRGB(t));
  RAY_N[i] = 1.49 + 0.018 / (lam * lam); // Cauchy: n_blue > n_pink
}
const BEAM = "rgb(214,228,255)";
const ROT0 = -28; // bench orientation: beam rises into the prism, dispersed fan exits across the room

/* ---------- fiber: n_core 1.48 / n_clad 1.41, 3 guided ray modes ---------- */
const SIN_C = 1.41 / 1.48;
const FIB_A = [5 * DEG, 10 * DEG, 15 * DEG];
const FIB_W = [0.36, 0.33, 0.31];
const FIB_COL = [specRGB(0), specRGB(0.5), specRGB(1)];
const C_BEND = 0.0452; // normalised curvature → onset of leakage at ~55% bend
const fibLeak = new Float64Array(3);
function fiberGuided(b) {
  const f = 1 - C_BEND * b * b; // (R - a)/(R + a) for the outer-wall chord
  let g = 1;
  for (let m = 0; m < 3; m++) {
    const L = smooth(0, 0.008, SIN_C - f * Math.cos(FIB_A[m]));
    fibLeak[m] = L; g -= FIB_W[m] * L;
  }
  return g;
}

/* ---------- SPR: Kretschmann, θc ≈ 43.2°, θspr = 62.4° ---------- */
const TH_C = 43.2, TH_SPR = 62.4;
const sprR = (th) => (0.58 + 0.28 * smooth(TH_C - 3, TH_C + 1, th)) * (1 - 0.965 / (1 + ((th - TH_SPR) / 1.15) ** 2));

function init() {
  const section = document.getElementById("lab");
  const wrap = document.getElementById("labCanvasWrap");
  const canvas = document.getElementById("labCanvas");
  const handle = document.getElementById("labHandle");
  const readout = document.getElementById("labReadout");
  const hintEl = document.getElementById("labHint");
  const resetBtn = document.getElementById("labReset");
  const tabs = Array.from(document.querySelectorAll('#lab [role="tab"]'));
  if (!section || !wrap || !canvas || !handle) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let W = 1, H = 1, dpr = 1, bg = null;
  let mode = "prism";
  const target = { prism: 8, fiber: 30, spr: 56 };
  const cur = { prism: 8, fiber: 30, spr: 56 };
  let lang = window.I18N?.lang === "pt" ? "pt" : "en";
  let visible = false, raf = 0, time = 0, lastTs = 0;
  let lastReadout = "", lastHX = -1, lastHY = -1, lastValNow = "";
  const G = { cx: 0, cy: 0, r: 0, y0: 0, amax: 1 }; // geometry used for pointer mapping

  const mqReduced = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  let reduced = !!(mqReduced && mqReduced.matches);

  /* ---------- buffers ---------- */
  const V = new Float64Array(6); // prism vertices
  const EN = new Float64Array(6); // outward edge normals
  const OUT = new Float64Array(2);
  const inPts = Array.from({ length: N_RAYS }, () => new Float64Array(14));
  const inLen = new Int32Array(N_RAYS);
  const outPts = Array.from({ length: N_RAYS }, () => new Float64Array(4));
  const hasOut = new Uint8Array(N_RAYS);
  const path = new Float64Array(2 * 600);
  let hitT = 0;

  function hitEdge(px, py, dx, dy, skip) {
    let best = Infinity, bi = -1;
    for (let i = 0; i < 3; i++) {
      if (i === skip) continue;
      const ax = V[2 * i], ay = V[2 * i + 1], bx = V[(2 * i + 2) % 6], by = V[(2 * i + 3) % 6];
      const ex = bx - ax, ey = by - ay, den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((ax - px) * ey - (ay - py) * ex) / den;
      const s = ((ax - px) * dy - (ay - py) * dx) / den;
      if (t > 1e-6 && s >= 0 && s <= 1 && t < best) { best = t; bi = i; }
    }
    hitT = best;
    return bi;
  }
  // n points toward the incident side; returns false on total internal reflection
  function refract(dx, dy, nx, ny, eta) {
    const ci = -(nx * dx + ny * dy), k = 1 - eta * eta * (1 - ci * ci);
    if (k < 0) { OUT[0] = dx + 2 * ci * nx; OUT[1] = dy + 2 * ci * ny; return false; }
    const f = eta * ci - Math.sqrt(k);
    OUT[0] = eta * dx + f * nx; OUT[1] = eta * dy + f * ny;
    return true;
  }

  /* ---------- drawing helpers ---------- */
  function strokeGlow(pts, n, col, a, wide, thin) {
    if (n < 2 || a <= 0.003) return;
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[2 * i], pts[2 * i + 1]);
    ctx.strokeStyle = col;
    ctx.globalAlpha = Math.min(1, a * 0.2); ctx.lineWidth = wide; ctx.stroke();
    ctx.globalAlpha = Math.min(1, a); ctx.lineWidth = thin; ctx.stroke();
  }
  function line(x0, y0, x1, y1, col, a, wide, thin) {
    path[0] = x0; path[1] = y0; path[2] = x1; path[3] = y1;
    strokeGlow(path, 2, col, a, wide, thin);
  }
  function sparks(pts, n, count, col, a, speed) {
    if (reduced || n < 2 || a <= 0.02) return;
    let len = 0;
    for (let i = 1; i < n; i++) len += Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
    if (len < 4) return;
    ctx.fillStyle = col;
    for (let k = 0; k < count; k++) {
      let d = (((time * speed) / len + k / count) % 1) * len;
      for (let i = 1; i < n; i++) {
        const sx = pts[2 * i] - pts[2 * i - 2], sy = pts[2 * i + 1] - pts[2 * i - 1], sl = Math.hypot(sx, sy);
        if (d <= sl || i === n - 1) {
          const f = sl > 0 ? Math.min(1, d / sl) : 0, x = pts[2 * i - 2] + sx * f, y = pts[2 * i - 1] + sy * f;
          ctx.globalAlpha = a * 0.22; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
          break;
        }
        d -= sl;
      }
    }
  }
  function emitter(x, y, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    ctx.fillStyle = "#151c2e"; ctx.strokeStyle = "rgba(185,195,214,0.45)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-26, -6, 26, 12, 3) : ctx.rect(-26, -6, 26, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#dfe8ff"; ctx.fillRect(-2, -2, 2, 4);
    ctx.restore();
  }
  function buildBg() {
    bg = document.createElement("canvas");
    bg.width = canvas.width; bg.height = canvas.height;
    const b = bg.getContext("2d");
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.fillStyle = "#060a13"; b.fillRect(0, 0, W, H);
    const g = b.createRadialGradient(W * 0.45, H * 0.5, 0, W * 0.45, H * 0.5, Math.max(W, H) * 0.7);
    g.addColorStop(0, "rgba(79,140,255,0.075)"); g.addColorStop(1, "rgba(79,140,255,0)");
    b.fillStyle = g; b.fillRect(0, 0, W, H);
    b.fillStyle = "rgba(185,195,214,0.075)"; // optical breadboard holes
    for (let y = 13; y < H; y += 26) for (let x = 13; x < W; x += 26) b.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
  }

  /* ---------- PRISM ---------- */
  function renderPrism(v) {
    const cx = W * 0.44, cy = H * 0.55, R = Math.min(H * 0.34, W * 0.2);
    G.cx = cx; G.cy = cy;
    for (let i = 0; i < 3; i++) {
      const a = (-90 + 120 * i + v + ROT0) * DEG;
      V[2 * i] = cx + R * Math.cos(a); V[2 * i + 1] = cy + R * Math.sin(a);
    }
    for (let i = 0; i < 3; i++) {
      const ax = V[2 * i], ay = V[2 * i + 1], bx = V[(2 * i + 2) % 6], by = V[(2 * i + 3) % 6];
      let nx = by - ay, ny = -(bx - ax); const l = Math.hypot(nx, ny); nx /= l; ny /= l;
      if (((ax + bx) / 2 - cx) * nx + ((ay + by) / 2 - cy) * ny < 0) { nx = -nx; ny = -ny; }
      EN[2 * i] = nx; EN[2 * i + 1] = ny;
    }
    // orbit ring (handle track)
    const ring = R * 1.18;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1; ctx.strokeStyle = "rgba(155,114,255,0.16)"; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
    ctx.beginPath(); ctx.arc(cx, cy, ring, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);

    // glass body
    const gg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    gg.addColorStop(0, "rgba(140,175,255,0.13)"); gg.addColorStop(1, "rgba(200,160,255,0.07)");
    ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(V[0], V[1]); ctx.lineTo(V[2], V[3]); ctx.lineTo(V[4], V[5]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(205,220,255,0.6)"; ctx.lineWidth = 1.25; ctx.lineJoin = "round"; ctx.stroke();

    // beam in
    const ldx = Math.cos(ROT0 * DEG), ldy = Math.sin(ROT0 * DEG);
    const p0x = cx + ldy * R * 0.12, p0y = cy - ldx * R * 0.12;
    const tb = Math.min((p0x - 34) / ldx, (H - 18 - p0y) / -ldy);
    const lx = p0x - ldx * tb, ly = p0y - ldy * tb;
    emitter(lx, ly, ROT0 * DEG);
    ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    const e0 = hitEdge(lx, ly, ldx, ldy, -1);
    let tir = false;
    if (e0 < 0) return false;
    const hx = lx + ldx * hitT, hy = ly + ldy * hitT, nx0 = EN[2 * e0], ny0 = EN[2 * e0 + 1];
    line(lx, ly, hx, hy, BEAM, 0.95, 7, 1.9);
    path[0] = lx; path[1] = ly; path[2] = hx; path[3] = hy;
    sparks(path, 2, 3, "#ffffff", 0.9, 120);
    // Fresnel (Schlick) entry reflection
    const ci = -(nx0 * ldx + ny0 * ldy);
    const r0 = ((1.55 - 1) / (1.55 + 1)) ** 2, Rs = r0 + (1 - r0) * (1 - ci) ** 5;
    const rdx = ldx + 2 * ci * nx0, rdy = ldy + 2 * ci * ny0, FAR = (W + H) * 1.5;
    line(hx, hy, hx + rdx * FAR, hy + rdy * FAR, BEAM, Math.min(0.55, 0.1 + Rs * 3), 5, 1);

    for (let k = 0; k < N_RAYS; k++) {
      const n = RAY_N[k], p = inPts[k];
      let px = hx, py = hy, edge = e0, cnt = 1;
      p[0] = px; p[1] = py; hasOut[k] = 0;
      refract(ldx, ldy, nx0, ny0, 1 / n);
      let dx = OUT[0], dy = OUT[1];
      for (let bounce = 0; bounce < 4; bounce++) {
        const e = hitEdge(px, py, dx, dy, edge);
        if (e < 0) break;
        px += dx * hitT; py += dy * hitT; edge = e;
        p[2 * cnt] = px; p[2 * cnt + 1] = py; cnt++;
        const ok = refract(dx, dy, -EN[2 * e], -EN[2 * e + 1], n);
        dx = OUT[0]; dy = OUT[1];
        if (ok) { const o = outPts[k]; o[0] = px; o[1] = py; o[2] = px + dx * FAR; o[3] = py + dy * FAR; hasOut[k] = 1; break; }
        tir = true;
      }
      inLen[k] = cnt;
    }
    for (let k = 0; k < N_RAYS; k++) strokeGlow(inPts[k], inLen[k], RAY_COL[k], 0.42, 4, 1.1);
    for (let k = 0; k < N_RAYS; k++) if (hasOut[k]) strokeGlow(outPts[k], 2, RAY_COL[k], 0.85, 7, 1.5);
    for (let k = 1; k < N_RAYS; k += 3) if (hasOut[k]) sparks(outPts[k], 2, 2, RAY_COL[k], 0.9, 150);

    // handle on the orbit ring at the apex direction
    const ha = (-90 + v + ROT0) * DEG;
    placeHandle(cx + ring * Math.cos(ha), cy + ring * Math.sin(ha));
    return tir;
  }

  /* ---------- FIBER ---------- */
  function renderFiber(v) {
    const b = v / 100, x0 = Math.max(W * 0.07, 34), x1 = Math.min(W * 0.93, W - 22), xm = W * 0.5;
    const y0 = H * 0.32, amax = H * 0.42, A = b * amax, sig = W * 0.15 * (1 - 0.3 * b);
    const hw = clamp(H * 0.055, 9, 15);
    G.y0 = y0; G.amax = amax; G.cx = xm;
    const guided = fiberGuided(b);
    const yc = (x) => y0 + A * Math.exp(-((x - xm) * (x - xm)) / (2 * sig * sig));
    const sl = (x) => -A * ((x - xm) / (sig * sig)) * Math.exp(-((x - xm) * (x - xm)) / (2 * sig * sig));
    const NS = Math.min(299, Math.max(60, Math.round((x1 - x0) / 3)));
    const dxs = (x1 - x0) / NS;

    // cladding + core
    ctx.globalCompositeOperation = "source-over"; ctx.lineCap = "butt"; ctx.lineJoin = "round"; ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let i = 0; i <= NS; i++) { const x = x0 + i * dxs; i ? ctx.lineTo(x, yc(x)) : ctx.moveTo(x, yc(x)); }
    ctx.strokeStyle = "rgba(150,170,225,0.09)"; ctx.lineWidth = hw * 3.6; ctx.stroke();
    ctx.strokeStyle = "rgba(110,150,255,0.12)"; ctx.lineWidth = hw * 2; ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      for (let i = 0; i <= NS; i++) {
        const x = x0 + i * dxs, m = sl(x), l = Math.hypot(1, m), px = x - (s * hw * m) / l, py = yc(x) + (s * hw) / l;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = "rgba(200,215,255,0.38)"; ctx.lineWidth = 1; ctx.stroke();
    }
    emitter(x0, yc(x0), 0);
    // receiver
    const ry = yc(x1);
    ctx.fillStyle = "#151c2e"; ctx.strokeStyle = "rgba(185,195,214,0.45)";
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x1, ry - 9, 14, 18, 3) : ctx.rect(x1, ry - 9, 14, 18); ctx.fill(); ctx.stroke();

    ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    const crest = Math.round((xm - x0) / dxs);
    for (let m = 0; m < 3; m++) {
      const period = (4 * hw * 0.82) / Math.tan(FIB_A[m]) * 0.55, ph = m * 0.37;
      let cnt = 0;
      for (let i = 0; i <= NS; i++) {
        const x = x0 + i * dxs, mm = sl(x), l = Math.hypot(1, mm);
        let f = ((x - x0) / period + ph) % 1; f = f < 0.5 ? f * 4 - 1 : 3 - f * 4; // triangle wave
        const u = hw * 0.8 * f;
        path[2 * cnt] = x - (u * mm) / l; path[2 * cnt + 1] = yc(x) + u / l; cnt++;
      }
      const L = fibLeak[m], before = crest + 1;
      strokeGlow(path, before, FIB_COL[m], 0.8, 5, 1.3);
      sparks(path, before, 2, FIB_COL[m], 0.85, 110);
      const rest = path.subarray(2 * crest);
      strokeGlow(rest, cnt - crest, FIB_COL[m], 0.8 * (1 - 0.88 * L), 5, 1.3);
      sparks(rest, cnt - crest, 2, FIB_COL[m], 0.85 * (1 - L), 110);
      if (L > 0.01) {
        // refracted leakage from the outer wall near the bend crest, nearly tangent
        const sinT = Math.min(0.999, (1.48 / 1.41) * (1 - C_BEND * b * b) * Math.cos(FIB_A[m]));
        const th = Math.asin(sinT), FAR = (W + H) * 1.5;
        for (let j = 0; j < 5; j++) {
          const x = xm + sig * (-0.32 + 0.11 * j + 0.04 * m), mm = sl(x), l = Math.hypot(1, mm);
          const tx = 1 / l, ty = mm / l, nx = -mm / l, ny = 1 / l; // tangent / outward (outer wall) normal
          const sx = x + nx * hw, sy = yc(x) + ny * hw, tt = th - (0.12 + 0.07 * j);
          const dx = tx * Math.sin(tt) + nx * Math.cos(tt), dy = ty * Math.sin(tt) + ny * Math.cos(tt);
          const col = RAY_COL[Math.min(N_RAYS - 1, (m * 5 + j * 2) % N_RAYS)];
          line(sx, sy, sx + dx * FAR, sy + dy * FAR, col, 0.62 * L, 6, 1.2);
          if (j % 2 === 0) { path[0] = sx; path[1] = sy; path[2] = sx + dx * W; path[3] = sy + dy * W; sparks(path, 2, 1, col, 0.8 * L, 130); }
        }
      }
    }
    // receiver glow ∝ guided power
    const rg = ctx.createRadialGradient(x1 + 4, ry, 0, x1 + 4, ry, 30);
    rg.addColorStop(0, `rgba(183,205,255,${(0.55 * guided).toFixed(3)})`); rg.addColorStop(1, "rgba(183,205,255,0)");
    ctx.globalAlpha = 1; ctx.fillStyle = rg; ctx.fillRect(x1 - 30, ry - 30, 64, 60);

    placeHandle(xm, yc(xm));
    return guided;
  }

  /* ---------- SPR (Kretschmann) ---------- */
  function renderSpr(v) {
    const cx = W * 0.5, yf = H * 0.62, Rp = Math.min(H * 0.5, W * 0.27), Rl = Rp * 1.2;
    G.cx = cx; G.cy = yf;
    const R = sprR(v), P = clamp(1 - R / 0.86, 0, 1), film = 5, half = Rp * 1.08;
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.lineCap = "round";
    // sensing medium below the film
    const md = ctx.createLinearGradient(0, yf, 0, H);
    md.addColorStop(0, "rgba(79,140,255,0.10)"); md.addColorStop(1, "rgba(79,140,255,0.02)");
    ctx.fillStyle = md; ctx.fillRect(cx - half, yf + film, half * 2, H - yf);
    // glass hemicylinder
    const gg = ctx.createLinearGradient(cx, yf - Rp, cx, yf);
    gg.addColorStop(0, "rgba(140,175,255,0.07)"); gg.addColorStop(1, "rgba(170,160,255,0.16)");
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, yf, Rp, Math.PI, 2 * Math.PI); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(205,220,255,0.6)"; ctx.lineWidth = 1.25; ctx.stroke();
    // emitter arc + ticks (θc, θspr)
    ctx.strokeStyle = "rgba(155,114,255,0.2)"; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
    ctx.beginPath(); ctx.arc(cx, yf, Rl, (-90 - 76) * DEG, (-90 - 38) * DEG); ctx.stroke(); ctx.setLineDash([]);
    const tick = (th, col, label) => {
      const a = (-90 - th) * DEG, c = Math.cos(a), s = Math.sin(a);
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(cx + c * (Rl - 7), yf + s * (Rl - 7)); ctx.lineTo(cx + c * (Rl + 7), yf + s * (Rl + 7)); ctx.stroke();
      if (label && W > 520) {
        ctx.fillStyle = col; ctx.font = "500 10px 'JetBrains Mono', ui-monospace, monospace"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
        ctx.fillText(label, cx + c * (Rl + 30), yf + s * (Rl + 30));
      }
    };
    tick(TH_C, "rgba(148,160,184,0.6)", "θc");
    tick(TH_SPR, "rgba(232,111,193,0.85)", lang === "pt" ? "62,4°" : "62.4°");
    // gold film 50 nm
    const au = ctx.createLinearGradient(0, yf, 0, yf + film);
    au.addColorStop(0, "#f2c464"); au.addColorStop(1, "#d99b26");
    ctx.fillStyle = au; ctx.fillRect(cx - half, yf, half * 2, film);
    if (W > 520) {
      ctx.fillStyle = "rgba(242,196,100,0.85)"; ctx.font = "500 10px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("Au · 50 nm", cx + half + 8, yf + film / 2);
    }
    // emitter & detector
    const s = Math.sin(v * DEG), c = Math.cos(v * DEG);
    const ex = cx - Rl * s, ey = yf - Rl * c, dx = cx + Rl * s, dy = yf - Rl * c;
    emitter(ex, ey, Math.atan2(yf - ey, cx - ex));
    ctx.save(); ctx.translate(dx, dy); ctx.rotate(Math.atan2(dy - yf, dx - cx));
    ctx.fillStyle = "#151c2e"; ctx.strokeStyle = "rgba(185,195,214,0.45)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, -9, 14, 18, 3) : ctx.rect(0, -9, 14, 18); ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.globalCompositeOperation = "lighter";
    line(ex, ey, cx, yf, BEAM, 0.95, 7, 1.9);
    path[0] = ex; path[1] = ey; path[2] = cx; path[3] = yf; sparks(path, 2, 3, "#ffffff", 0.9, 120);
    const ra = R / 0.86;
    line(cx, yf, dx, dy, BEAM, 0.92 * ra, 7, 1.8);
    path[0] = cx; path[1] = yf; path[2] = dx; path[3] = dy; sparks(path, 2, 3, "#ffffff", 0.9 * ra, 120);
    // detector glow ∝ Rp
    const dg = ctx.createRadialGradient(dx, dy, 0, dx, dy, 26);
    dg.addColorStop(0, `rgba(214,228,255,${(0.5 * ra).toFixed(3)})`); dg.addColorStop(1, "rgba(214,228,255,0)");
    ctx.globalAlpha = 1; ctx.fillStyle = dg; ctx.fillRect(dx - 26, dy - 26, 52, 52);

    if (P > 0.02) {
      // evanescent field decaying into the sensing medium
      const er = half * 0.8, sy = 48 / er;
      ctx.save(); ctx.translate(cx, yf + film); ctx.scale(1, sy);
      const ev = ctx.createRadialGradient(0, 0, 0, 0, 0, er);
      ev.addColorStop(0, `rgba(155,114,255,${(0.6 * P).toFixed(3)})`); ev.addColorStop(0.45, `rgba(155,114,255,${(0.22 * P).toFixed(3)})`); ev.addColorStop(1, "rgba(155,114,255,0)");
      ctx.fillStyle = ev; ctx.globalAlpha = 1; ctx.fillRect(-er, 0, er * 2, er); ctx.restore();
      // propagating surface plasmon along the gold interface
      const n = 160, k = (2 * Math.PI) / 28, w = time * 7;
      line(cx - half, yf + film + 1, cx + half, yf + film + 1, "rgb(155,114,255)", 0.55 * P, 8, 1.2);
      let cnt = 0;
      for (let i = 0; i <= n; i++) {
        const x = cx - half + (2 * half * i) / n, env = Math.exp(-(((x - cx) / (half * 0.6)) ** 2));
        path[2 * cnt] = x; path[2 * cnt + 1] = yf + film + 2 + 4.5 * P * env * Math.sin(k * (x - cx) - w); cnt++;
      }
      strokeGlow(path, cnt, "rgb(232,111,193)", 0.95 * P, 7, 1.7);
      const fg = ctx.createRadialGradient(cx, yf + film / 2, 0, cx, yf + film / 2, 34);
      fg.addColorStop(0, `rgba(232,111,193,${(0.6 * P).toFixed(3)})`); fg.addColorStop(1, "rgba(232,111,193,0)");
      ctx.fillStyle = fg; ctx.fillRect(cx - 34, yf - 34, 68, 68);
    }
    placeHandle(ex, ey);
    return R;
  }

  function placeHandle(x, y) {
    x = clamp(x, 22, W - 22); y = clamp(y, 22, H - 22);
    if (Math.abs(x - lastHX) > 0.1 || Math.abs(y - lastHY) > 0.1) {
      lastHX = x; lastHY = y;
      handle.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  }

  /* ---------- text ---------- */
  const fmt1 = (x) => x.toFixed(1).replace(".", STR[lang].dec);
  function readoutText(v, info) {
    const s = STR[lang];
    if (mode === "prism") { const d = Math.round(v); return `${d > 0 ? "+" : ""}${d}° · ${info ? s.tir : s.disp}`; }
    if (mode === "fiber") {
      const g = Math.round(info * 100);
      return `${Math.round(v)}% ${s.bend} · ${g}% ${s.guided} (${g >= 100 ? s.tirTag : s.loss})`;
    }
    const th = Math.round(v * 2) / 2;
    return Math.abs(th - TH_SPR) <= 1.2 ? `θ = ${fmt1(th)}° · ${s.res}` : `θ = ${fmt1(th)}° · Rₚ ${Math.round(info * 100)}%`;
  }
  function applyStatic() {
    const s = STR[lang], m = MODES[mode];
    if (hintEl) hintEl.textContent = s.hint[mode];
    handle.setAttribute("aria-label", s.aria[mode]);
    handle.setAttribute("aria-valuemin", String(m.min));
    handle.setAttribute("aria-valuemax", String(m.max));
    lastReadout = ""; lastValNow = "";
  }

  /* ---------- render ---------- */
  function render() {
    if (!bg) return;
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bg, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const v = cur[mode];
    const info = mode === "prism" ? renderPrism(v) : mode === "fiber" ? renderFiber(v) : renderSpr(v);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    const tv = target[mode], settled = Math.abs(tv - v) < MODES[mode].step * 0.5;
    const txt = readoutText(settled ? tv : v, info);
    if (txt !== lastReadout) {
      lastReadout = txt;
      if (readout) readout.textContent = txt;
      handle.setAttribute("aria-valuetext", txt);
    }
    const now = String(tv);
    if (now !== lastValNow) { lastValNow = now; handle.setAttribute("aria-valuenow", now); }
  }

  function shouldRun() { return visible && !reduced && !document.hidden; }
  function frame(ts) {
    raf = 0;
    if (!shouldRun()) return;
    const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
    lastTs = ts; time += dt;
    const ease = 1 - Math.pow(1 - (dragging ? 0.4 : 0.18), dt * 60);
    for (const k in cur) { const d = target[k] - cur[k]; cur[k] = Math.abs(d) < 1e-3 ? target[k] : cur[k] + d * ease; }
    render();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && shouldRun()) { lastTs = 0; raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function poke() {
    if (raf) return;
    if (reduced || !visible || document.hidden) { for (const k in cur) cur[k] = target[k]; render(); } else start();
  }

  function setValue(val) {
    const m = MODES[mode];
    target[mode] = clamp(Math.round(val / m.step) * m.step, m.min, m.max);
    poke();
  }
  function setMode(next, focus) {
    if (!MODES[next]) return;
    mode = next;
    tabs.forEach((t) => {
      const on = t.dataset.mode === next;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (on) { wrap.setAttribute("aria-labelledby", t.id); if (focus) t.focus(); }
    });
    applyStatic();
    lastHX = lastHY = -1;
    if (raf) render(); else poke();
  }

  /* ---------- pointer mapping ---------- */
  function valueFromPoint(x, y) {
    if (mode === "prism") {
      let a = Math.atan2(y - G.cy, x - G.cx) / DEG + 90 - ROT0;
      while (a > 180) a -= 360;
      while (a < -180) a += 360;
      return a;
    }
    if (mode === "fiber") return ((y - G.y0) / G.amax) * 100;
    return Math.atan2(G.cx - x, G.cy - y) / DEG;
  }
  const local = (e) => { const r = wrap.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  let dragging = false, dragId = -1;
  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    dragging = true; dragId = e.pointerId;
    try { handle.setPointerCapture(e.pointerId); } catch {}
    handle.classList.add("is-dragging");
    handle.focus({ preventScroll: true });
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== dragId) return;
    const [x, y] = local(e); setValue(valueFromPoint(x, y));
  });
  const endDrag = (e) => {
    if (!dragging || e.pointerId !== dragId) return;
    dragging = false; dragId = -1; handle.classList.remove("is-dragging");
    try { handle.releasePointerCapture(e.pointerId); } catch {}
  };
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);

  let down = null;
  canvas.addEventListener("pointerdown", (e) => {
    const [x, y] = local(e);
    down = { x, y, id: e.pointerId, mouse: e.pointerType === "mouse" };
    if (down.mouse && e.button === 0) {
      dragging = true; dragId = e.pointerId;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== dragId || !down || !down.mouse) return;
    const [x, y] = local(e);
    if (Math.hypot(x - down.x, y - down.y) >= 6) setValue(valueFromPoint(x, y));
  });
  canvas.addEventListener("pointerup", (e) => {
    if (down && down.id === e.pointerId) {
      const [x, y] = local(e);
      if (Math.hypot(x - down.x, y - down.y) < 6) setValue(valueFromPoint(x, y));
    }
    if (dragging && e.pointerId === dragId) { dragging = false; dragId = -1; try { canvas.releasePointerCapture(e.pointerId); } catch {} }
    down = null;
  });
  canvas.addEventListener("pointercancel", () => { down = null; if (dragging) { dragging = false; dragId = -1; } });

  handle.addEventListener("keydown", (e) => {
    const m = MODES[mode], step = m.step * (e.shiftKey ? 5 : 1);
    let v = target[mode];
    switch (e.key) {
      case "ArrowRight": case "ArrowUp": v += step; break;
      case "ArrowLeft": case "ArrowDown": v -= step; break;
      case "PageUp": v += m.step * 10; break;
      case "PageDown": v -= m.step * 10; break;
      case "Home": v = m.min; break;
      case "End": v = m.max; break;
      default: return;
    }
    e.preventDefault();
    setValue(v);
  });

  tabs.forEach((t, i) => {
    t.addEventListener("click", () => setMode(t.dataset.mode, false));
    t.addEventListener("keydown", (e) => {
      let j = -1;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j < 0) return;
      e.preventDefault();
      setMode(tabs[j].dataset.mode, true);
    });
  });
  if (resetBtn) resetBtn.addEventListener("click", () => { for (const k in MODES) target[k] = MODES[k].def; poke(); });

  /* ---------- lifecycle ---------- */
  function resize() {
    const r = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    const d = Math.min(window.devicePixelRatio || 1, 2);
    if (w === W && h === H && d === dpr && bg) return;
    W = w; H = h; dpr = d;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildBg();
    lastHX = lastHY = -1;
    render();
  }
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(wrap);
  window.addEventListener("resize", resize);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((en) => en.isIntersecting);
      visible ? start() : stop();
    }, { threshold: 0.05 }).observe(section);
  } else { visible = true; }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  window.addEventListener("pagehide", stop);
  window.addEventListener("pageshow", start);

  const onReduced = () => {
    reduced = !!(mqReduced && mqReduced.matches);
    if (reduced) { stop(); for (const k in cur) cur[k] = target[k]; render(); } else start();
  };
  if (mqReduced) {
    if (mqReduced.addEventListener) mqReduced.addEventListener("change", onReduced);
    else if (mqReduced.addListener) mqReduced.addListener(onReduced);
  }

  window.addEventListener("langchange", () => {
    lang = window.I18N?.lang === "pt" ? "pt" : "en";
    applyStatic();
    render();
  });

  applyStatic();
  resize();
  start();
}

init();
