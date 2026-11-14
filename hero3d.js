/*
 * Hero "neural core" — a Three.js scene of a breathing, glowing network of
 * neurons that orbits Matheus' portrait, with signals firing along synapses.
 * Falls back to the lightweight 2D canvas animation if WebGL is unavailable.
 */
const canvas = document.getElementById("hero3d");
const hero = document.querySelector(".hero");
const photo = document.querySelector(".photo-ring");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function fallback() {
  canvas?.remove();
  window.startNeural2D?.();
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

if (!canvas || !webglAvailable()) {
  fallback();
} else {
  import("./vendor/three.module.min.js").then(init).catch(fallback);
}

function init(THREE) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const PALETTE = [new THREE.Color("#4f8cff"), new THREE.Color("#9b72ff"), new THREE.Color("#e86fc1")];
  const isSmall = () => window.innerWidth < 760;

  /* ---------------- Shared shader chunks ---------------- */
  const breathe = /* glsl */ `
    uniform float uTime;
    attribute float aRand;
    vec3 breathe(vec3 p) {
      float w = sin(uTime * 1.1 + aRand * 6.2831 + p.y * 2.2) * 0.055
              + sin(uTime * 0.7 + p.x * 3.0) * 0.03;
      return p * (1.0 + w);
    }
  `;

  /* ---------------- Neurons (fibonacci sphere) ---------------- */
  const N = isSmall() ? 260 : 420;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const rnd = new Float32Array(N);
  const size = new Float32Array(N);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    const jitter = 1 + (Math.random() - 0.5) * 0.12;
    pos.set([Math.cos(t) * r * jitter, y * jitter, Math.sin(t) * r * jitter], i * 3);
    // vertical gradient blue -> violet -> pink
    const k = (y + 1) / 2;
    const c = k < 0.5 ? PALETTE[0].clone().lerp(PALETTE[1], k * 2) : PALETTE[1].clone().lerp(PALETTE[2], (k - 0.5) * 2);
    col.set([c.r, c.g, c.b], i * 3);
    rnd[i] = Math.random();
    size[i] = Math.random() < 0.08 ? 2.4 : 0.8 + Math.random() * 0.9;
  }

  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  nodeGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  nodeGeo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
  nodeGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uScale: { value: 1 },
  };

  const nodeMat = new THREE.ShaderMaterial({
    uniforms,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      ${breathe}
      uniform float uPixelRatio;
      uniform float uScale;
      attribute float aSize;
      varying vec3 vColor;
      varying float vDepth;
      void main() {
        vec4 mv = modelViewMatrix * vec4(breathe(position), 1.0);
        gl_Position = projectionMatrix * mv;
        float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + aRand * 40.0);
        gl_PointSize = aSize * twinkle * 38.0 * uScale * uPixelRatio / -mv.z;
        vColor = color;
        vDepth = smoothstep(-13.0, -7.0, mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.5, 0.0, d);
        float a = pow(core, 1.6);
        gl_FragColor = vec4(vColor * (0.9 + core), a * mix(0.25, 1.0, vDepth));
      }
    `,
  });
  const nodes = new THREE.Points(nodeGeo, nodeMat);

  /* ---------------- Synapses (nearest-neighbour edges) ---------------- */
  const edges = [];
  const MAX_D = isSmall() ? 0.34 : 0.27;
  for (let i = 0; i < N; i++) {
    let links = 0;
    for (let j = i + 1; j < N && links < 4; j++) {
      const dx = pos[i * 3] - pos[j * 3], dy = pos[i * 3 + 1] - pos[j * 3 + 1], dz = pos[i * 3 + 2] - pos[j * 3 + 2];
      if (dx * dx + dy * dy + dz * dz < MAX_D * MAX_D) { edges.push([i, j]); links++; }
    }
  }
  const lPos = new Float32Array(edges.length * 6);
  const lCol = new Float32Array(edges.length * 6);
  const lRnd = new Float32Array(edges.length * 2);
  edges.forEach(([a, b], e) => {
    lPos.set(pos.subarray(a * 3, a * 3 + 3), e * 6);
    lPos.set(pos.subarray(b * 3, b * 3 + 3), e * 6 + 3);
    lCol.set(col.subarray(a * 3, a * 3 + 3), e * 6);
    lCol.set(col.subarray(b * 3, b * 3 + 3), e * 6 + 3);
    lRnd[e * 2] = rnd[a]; lRnd[e * 2 + 1] = rnd[b];
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(lPos, 3));
  lineGeo.setAttribute("color", new THREE.BufferAttribute(lCol, 3));
  lineGeo.setAttribute("aRand", new THREE.BufferAttribute(lRnd, 1));
  const lineMat = new THREE.ShaderMaterial({
    uniforms,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      ${breathe}
      varying vec3 vColor;
      varying float vDepth;
      void main() {
        vec4 mv = modelViewMatrix * vec4(breathe(position), 1.0);
        gl_Position = projectionMatrix * mv;
        vColor = color;
        vDepth = smoothstep(-13.0, -7.0, mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vDepth;
      void main() { gl_FragColor = vec4(vColor, mix(0.03, 0.26, vDepth)); }
    `,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);

  /* ---------------- Signals travelling along synapses ---------------- */
  const P = isSmall() ? 14 : 26;
  const sigPos = new Float32Array(P * 3);
  const sigCol = new Float32Array(P * 3);
  const sigRnd = new Float32Array(P);
  const sigSize = new Float32Array(P).fill(3.2);
  const signals = Array.from({ length: P }, () => ({ e: 0, t: Math.random(), speed: 0 }));
  const resetSignal = (s) => {
    s.e = (Math.random() * edges.length) | 0;
    s.t = 0;
    s.speed = 0.008 + Math.random() * 0.014;
    s.dir = Math.random() < 0.5;
  };
  signals.forEach((s, i) => { resetSignal(s); s.t = Math.random(); const c = PALETTE[i % 3]; sigCol.set([c.r * 1.4, c.g * 1.4, c.b * 1.4], i * 3); });
  const sigGeo = new THREE.BufferGeometry();
  sigGeo.setAttribute("position", new THREE.BufferAttribute(sigPos, 3));
  sigGeo.setAttribute("color", new THREE.BufferAttribute(sigCol, 3));
  sigGeo.setAttribute("aRand", new THREE.BufferAttribute(sigRnd, 1));
  sigGeo.setAttribute("aSize", new THREE.BufferAttribute(sigSize, 1));
  const sigPoints = new THREE.Points(sigGeo, nodeMat);

  // CPU copy of breathe() so signals stay glued to the moving synapses
  const breatheCPU = (x, y, z, r, time) => {
    const w = Math.sin(time * 1.1 + r * 6.2831 + y * 2.2) * 0.055 + Math.sin(time * 0.7 + x * 3.0) * 0.03;
    return 1 + w;
  };

  /* ---------------- Orbit halo ---------------- */
  const H = isSmall() ? 180 : 320;
  const hPos = new Float32Array(H * 3), hCol = new Float32Array(H * 3), hRnd = new Float32Array(H), hSize = new Float32Array(H);
  for (let i = 0; i < H; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.32 + Math.random() * 0.22 + (Math.random() < 0.15 ? Math.random() * 0.35 : 0);
    hPos.set([Math.cos(a) * r, (Math.random() - 0.5) * 0.05, Math.sin(a) * r], i * 3);
    const c = PALETTE[(Math.random() * 3) | 0];
    hCol.set([c.r, c.g, c.b], i * 3);
    hRnd[i] = Math.random(); hSize[i] = 0.4 + Math.random() * 0.7;
  }
  const haloGeo = new THREE.BufferGeometry();
  haloGeo.setAttribute("position", new THREE.BufferAttribute(hPos, 3));
  haloGeo.setAttribute("color", new THREE.BufferAttribute(hCol, 3));
  haloGeo.setAttribute("aRand", new THREE.BufferAttribute(hRnd, 1));
  haloGeo.setAttribute("aSize", new THREE.BufferAttribute(hSize, 1));
  const halo = new THREE.Points(haloGeo, nodeMat);
  halo.rotation.x = 1.15;
  halo.rotation.z = -0.35;

  /* ---------------- Ambient dust ---------------- */
  const D = isSmall() ? 220 : 500;
  const dPos = new Float32Array(D * 3), dCol = new Float32Array(D * 3), dRnd = new Float32Array(D), dSize = new Float32Array(D);
  for (let i = 0; i < D; i++) {
    dPos.set([(Math.random() - 0.5) * 26, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10 - 2], i * 3);
    const c = PALETTE[(Math.random() * 3) | 0];
    dCol.set([c.r * 0.7, c.g * 0.7, c.b * 0.7], i * 3);
    dRnd[i] = Math.random(); dSize[i] = 0.3 + Math.random() * 0.6;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  dustGeo.setAttribute("color", new THREE.BufferAttribute(dCol, 3));
  dustGeo.setAttribute("aRand", new THREE.BufferAttribute(dRnd, 1));
  dustGeo.setAttribute("aSize", new THREE.BufferAttribute(dSize, 1));
  const dust = new THREE.Points(dustGeo, nodeMat);
  scene.add(dust);

  /* ---------------- Assemble the core ---------------- */
  const core = new THREE.Group();     // positioned around the photo
  const spinner = new THREE.Group();  // rotates
  spinner.add(lines, nodes, sigPoints);
  core.add(spinner, halo);
  scene.add(core);

  /* ---------------- Layout: anchor the core to the portrait ---------------- */
  const tmp = new THREE.Vector3();
  function screenToWorld(x, y) {
    tmp.set((x / hero.clientWidth) * 2 - 1, -(y / hero.clientHeight) * 2 + 1, 0.5).unproject(camera);
    tmp.sub(camera.position).normalize();
    const dist = -camera.position.z / tmp.z;
    return camera.position.clone().add(tmp.multiplyScalar(dist));
  }
  let baseScale = 1;
  function layout() {
    const w = hero.clientWidth, h = hero.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uPixelRatio.value = dpr;
    uniforms.uScale.value = Math.min(1.25, Math.max(0.7, h / 900));

    const heroRect = hero.getBoundingClientRect();
    const r = photo.getBoundingClientRect();
    const cx = r.left + r.width / 2 - heroRect.left;
    const cy = r.top + r.height / 2 - heroRect.top;
    const center = screenToWorld(cx, cy);
    const edge = screenToWorld(cx + r.width / 2, cy);
    const worldRadius = edge.distanceTo(center);
    core.position.copy(center);
    baseScale = worldRadius * (isSmall() ? 1.5 : 1.55);
    core.scale.setScalar(baseScale);
  }

  /* ---------------- Interaction ---------------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  hero.addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  });
  hero.addEventListener("pointerleave", () => { pointer.tx = pointer.ty = 0; });

  /* ---------------- Loop ---------------- */
  const clock = new THREE.Clock();
  let running = false;
  let scrollK = 0;

  function render() {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    spinner.rotation.y = t * 0.12 + pointer.x * 0.5;
    spinner.rotation.x = Math.sin(t * 0.2) * 0.15 + pointer.y * 0.35;
    halo.rotation.y = -t * 0.18;
    dust.rotation.y = t * 0.01 + pointer.x * 0.05;
    dust.position.y = scrollK * 2;

    // fade & push back gently as the user scrolls away
    core.scale.setScalar(baseScale * (1 + scrollK * 0.25));
    const intro = reduced ? 1 : Math.min(1, t / 1.6);
    renderer.domElement.style.opacity = String(intro * intro * (3 - 2 * intro) * (1 - scrollK * 0.9));

    // advance signals
    for (let i = 0; i < P; i++) {
      const s = signals[i];
      s.t += s.speed;
      if (s.t >= 1) resetSignal(s);
      const [a, b] = s.dir ? edges[s.e] : [edges[s.e][1], edges[s.e][0]];
      const k = s.t;
      const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
      const bx = pos[b * 3], by = pos[b * 3 + 1], bz = pos[b * 3 + 2];
      const fa = breatheCPU(ax, ay, az, rnd[a], t), fb = breatheCPU(bx, by, bz, rnd[b], t);
      sigPos[i * 3] = ax * fa + (bx * fb - ax * fa) * k;
      sigPos[i * 3 + 1] = ay * fa + (by * fb - ay * fa) * k;
      sigPos[i * 3 + 2] = az * fa + (bz * fb - az * fa) * k;
      sigSize[i] = 3.2 * Math.sin(Math.PI * k) + 0.2;
    }
    sigGeo.attributes.position.needsUpdate = true;
    sigGeo.attributes.aSize.needsUpdate = true;
    // signals use aRand = 0 -> no breathing in shader (already applied on CPU)

    renderer.render(scene, camera);
    if (running) requestAnimationFrame(render);
  }

  // Make signals ignore shader breathing by giving them their own material clone
  sigPoints.material = nodeMat.clone();
  sigPoints.material.uniforms = uniforms;
  sigPoints.material.vertexShader = nodeMat.vertexShader.replace("breathe(position)", "position");

  layout();
  canvas.classList.add("ready");
  document.documentElement.classList.add("has-webgl");

  const io = new IntersectionObserver(([e]) => {
    const should = e.isIntersecting && !reduced;
    if (should && !running) { running = true; requestAnimationFrame(render); }
    else if (!should) running = false;
  });
  io.observe(hero);
  if (reduced) render();

  window.addEventListener("scroll", () => {
    scrollK = Math.min(1, Math.max(0, window.scrollY / hero.clientHeight));
  }, { passive: true });

  let rt;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { layout(); if (!running) render(); }, 120); };
  window.addEventListener("resize", onResize);
  // the portrait animates in, so re-anchor once fonts/layout settle
  window.addEventListener("load", onResize);
  document.fonts?.ready.then(onResize);
}
