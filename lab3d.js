/* Interactive 3D Hill-Climbing Eval Landscape & LLM-as-a-Judge Workbench + Live Hugging Face Daily Papers Feed */
import * as THREE from "./vendor/three.module.min.js";

(() => {
  const wrap = document.getElementById("labCanvasWrap");
  let canvas = document.getElementById("labCanvas");
  const labSec = document.getElementById("lab");
  if (!canvas || !wrap || !labSec) return;

  const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Verified Nov 2026 Hugging Face Daily Papers Fallback Snapshot ---------- */
  const HF_FALLBACK = [
    {
      id: "2611.17878",
      title: "DySENSE: Dynamic Spatiotemporal ENergy Synthesis and Emulation with Satellite Imagery",
      publishedAt: "2026-11-12",
      upvotes: 20,
      org: "MIT",
    },
    {
      id: "2611.14505",
      title: "Continual-ARC: Measuring Skill Acquisition over a Working Lifetime",
      publishedAt: "2026-11-10",
      upvotes: 8,
      org: "Unify",
    },
    {
      id: "2611.17955",
      title: "WebArena-Pro: A Heterogeneous, Multimodal, Reproducible Benchmark for Web Agents",
      publishedAt: "2026-11-12",
      upvotes: 8,
      org: "McGill NLP",
    },
    {
      id: "2611.17440",
      title: "Interpreting Coding Agents Through Their Behavioral Trajectories",
      publishedAt: "2026-11-11",
      upvotes: 2,
      org: "Nebius",
    },
  ];

  /* ---------- 7 Candidate Coordinates on the θ₁ × θ₂ Quality Manifold ---------- */
  // Indices 0..3 form the hill-climbing ascent path; 4..6 sit in trapped / regressive basins.
  const CANDIDATE_COORDS = [
    { x: -2.05, z: 1.25, code: "v0" },
    { x: -1.05, z: 0.70, code: "v1" },
    { x: -0.05, z: 0.10, code: "v2" },
    { x: 1.55, z: -0.95, code: "v3" },
    { x: -0.60, z: -1.25, code: "r1" }, // Deceptive UX-heavy trap (fails compile/runtime!)
    { x: 1.30, z: 1.15, code: "r2" },
    { x: -1.75, z: -0.65, code: "r3" },
  ];

  /* ---------- 4 AI Studio Build Benchmark Suites ---------- */
  const SUITES = {
    vibe: {
      dx: 0,
      dz: 0,
      ridgeBoost: 1.0,
      prompt: {
        en: "ai.dev/build · Angular + Signals Gemini workflow UI",
        pt: "ai.dev/build · UI de fluxos Gemini em Angular + Signals",
      },
      builds: [
        {
          short: "v0 Zero-shot",
          delta: { en: "v0 → baseline app generated (raw prompt, brittle layout)", pt: "v0 → app base gerado (prompt direto, layout frágil)" },
          verdict: { en: "Weak edge cases & missing types", pt: "Casos de borda fracos e tipagem ausente" },
        },
        {
          short: "v1 +Signals",
          delta: { en: "v1 → +Angular Signals state graph & typed inputs", pt: "v1 → +grafo reativo Angular Signals e inputs tipados" },
          verdict: { en: "Compiles cleanly; minor focus gaps", pt: "Compila limpo; pequenos ajustes de foco" },
        },
        {
          short: "v2 +Kotlin AST",
          delta: { en: "v2 → +Kotlin AST sandbox verifier & responsive grid", pt: "v2 → +validador AST em Kotlin e grid responsivo" },
          verdict: { en: "Strong end-to-end build, passes ship gate", pt: "Build sólido ponta a ponta, passa no corte" },
        },
        {
          short: "v3 +Judge loop",
          delta: { en: "v3 → +LLM-as-a-judge self-critique & a11y polish (Peak)", pt: "v3 → +autocrítica LLM-as-a-judge e a11y (Pico)" },
          verdict: { en: "Shippable SOTA build across all axes", pt: "Build de ponta pronto para produção" },
        },
        {
          short: "r1 Flashy CSS",
          delta: { en: "r1 ✕ glossy gradients hide broken TS bindings (Trap)", pt: "r1 ✕ gradientes bonitos escondem erro de TS (Armadilha)" },
          verdict: { en: "Pretty UI, fails strict TS compile", pt: "UI chamativa, mas falha na compilação TS" },
        },
        {
          short: "r2 Loop drift",
          delta: { en: "r2 ✕ unbounded agent edits break routing", pt: "r2 ✕ edições sem limite quebram as rotas" },
          verdict: { en: "Regressed routing stability", pt: "Regressão na estabilidade das rotas" },
        },
        {
          short: "r3 Dead API",
          delta: { en: "r3 ✕ hallucinated SDK import breaks bundle", pt: "r3 ✕ import de SDK inexistente quebra o build" },
          verdict: { en: "Runtime bundler crash", pt: "Falha crítica de empacotamento" },
        },
      ],
    },
    fullstack: {
      dx: 0.14,
      dz: -0.08,
      ridgeBoost: 1.05,
      prompt: {
        en: "ai.dev/build · Kotlin backend + WebSocket live UI",
        pt: "ai.dev/build · Backend Kotlin + interface WebSocket",
      },
      builds: [
        {
          short: "v0 Naive poll",
          delta: { en: "v0 → naive 2s polling with untyped JSON blobs", pt: "v0 → polling simples de 2s com JSON sem tipagem" },
          verdict: { en: "Drops frames under load", pt: "Perde pacotes sob carga" },
        },
        {
          short: "v1 +Kotlin DTO",
          delta: { en: "v1 → +Kotlin kotlinx.serialization schemas & retries", pt: "v1 → +schemas Kotlin tipados e política de retry" },
          verdict: { en: "Clean contract validation", pt: "Validação de contrato consistente" },
        },
        {
          short: "v2 +Backpress.",
          delta: { en: "v2 → +streaming backpressure & Python eval harness", pt: "v2 → +controle de fluxo streaming e harness Python" },
          verdict: { en: "Low-latency pipeline passes gate", pt: "Pipeline estável passa no corte" },
        },
        {
          short: "v3 +E2E judge",
          delta: { en: "v3 → +end-to-end LLM contract judge verified (Peak)", pt: "v3 → +juiz LLM E2E validando todo o fluxo (Pico)" },
          verdict: { en: "Production-grade full-stack build", pt: "Build full-stack pronto para produção" },
        },
        {
          short: "r1 Mocked UI",
          delta: { en: "r1 ✕ polished shell backed by hardcoded mock arrays (Trap)", pt: "r1 ✕ visual polido com dados falsos e HTTP 500 (Armadilha)" },
          verdict: { en: "Visual illusion — backend 500s", pt: "Ilusão visual — backend retorna 500" },
        },
        {
          short: "r2 Thread block",
          delta: { en: "r2 ✕ blocking IO call stalls coroutine pool", pt: "r2 ✕ chamada bloqueante trava o pool de coroutines" },
          verdict: { en: "High tail latency regression", pt: "Regressão severa de latência" },
        },
        {
          short: "r3 Open JSON",
          delta: { en: "r3 ✕ unvalidated payload leaks 400 errors", pt: "r3 ✕ payload sem validação gera erros 400" },
          verdict: { en: "Schema assertion failed", pt: "Falha de validação de schema" },
        },
      ],
    },
    optics: {
      dx: -0.1,
      dz: 0.1,
      ridgeBoost: 1.03,
      prompt: {
        en: "ai.dev/build · WebGL Fourier & SPR physics sim",
        pt: "ai.dev/build · Simulador WebGL de óptica Fourier & SPR",
      },
      builds: [
        {
          short: "v0 Static plot",
          delta: { en: "v0 → blurry 2D static curve missing angle sweep", pt: "v0 → gráfico 2D estático sem varredura angular" },
          verdict: { en: "Non-interactive approximation", pt: "Aproximação estática limitada" },
        },
        {
          short: "v1 +FFT kernel",
          delta: { en: "v1 → +exact Fresnel reflectance & 2D Fourier transform", pt: "v1 → +refletância de Fresnel exata e FFT 2D" },
          verdict: { en: "Accurate math; coarse canvas", pt: "Matemática exata; canvas simples" },
        },
        {
          short: "v2 +DPR shader",
          delta: { en: "v2 → +HiDPI WebGL beam propagation & responsive sliders", pt: "v2 → +shader WebGL HiDPI e controles responsivos" },
          verdict: { en: "Crisp physical fidelity + UX", pt: "Alta fidelidade física e boa UX" },
        },
        {
          short: "v3 +60fps pass",
          delta: { en: "v3 → +Python visual rubric confirms 60fps & physics (Peak)", pt: "v3 → +rubrica visual em Python confirma 60fps (Pico)" },
          verdict: { en: "Zero-defect physics workbench", pt: "Simulador físico sem falhas" },
        },
        {
          short: "r1 Neon wrong λ",
          delta: { en: "r1 ✕ vibrant glow waves ignore dispersion law (Trap)", pt: "r1 ✕ ondas neon ignoram lei de dispersão física (Armadilha)" },
          verdict: { en: "Looks slick, physically wrong", pt: "Estético, mas fisicamente incorreto" },
        },
        {
          short: "r2 Frame drop",
          delta: { en: "r2 ✕ per-frame CPU FFT drops mobile below 12fps", pt: "r2 ✕ FFT na CPU reduz FPS abaixo de 12" },
          verdict: { en: "Performance budget exceeded", pt: "Orçamento de desempenho violado" },
        },
        {
          short: "r3 NaN phase",
          delta: { en: "r3 ✕ zero-division at critical incidence crashes canvas", pt: "r3 ✕ divisão por zero no ângulo crítico trava o canvas" },
          verdict: { en: "Numerical singularity crash", pt: "Erro numérico em ângulo crítico" },
        },
      ],
    },
    polyglot: {
      dx: -0.06,
      dz: -0.1,
      ridgeBoost: 1.02,
      prompt: {
        en: "ai.dev/build · Zero-flash 7-lang i18n switcher",
        pt: "ai.dev/build · Seletor instantâneo para 7 idiomas",
      },
      builds: [
        {
          short: "v0 En-only",
          delta: { en: "v0 → hardcoded English strings; broken PT-BR layout", pt: "v0 → strings fixas em inglês; quebra layout em PT-BR" },
          verdict: { en: "Missing locale dictionary", pt: "Dicionário de idiomas ausente" },
        },
        {
          short: "v1 +ICU dates",
          delta: { en: "v1 → +ICU plural rules & localized date formats", pt: "v1 → +regras ICU e datas localizadas antes da pintura" },
          verdict: { en: "Natural phrasing; minor nav wrap", pt: "Texto natural; ajuste fino na barra" },
        },
        {
          short: "v2 +CJK & font",
          delta: { en: "v2 → +pre-paint locale lock & CJK/Polish glyph safety", pt: "v2 → +detecção pré-paint e suporte pleno CJK/Polonês" },
          verdict: { en: "Zero FOUC across 7 locales", pt: "Zero flash entre os 7 idiomas" },
        },
        {
          short: "v3 +Judge pass",
          delta: { en: "v3 → +native idiomatic judge passes EN & PT-BR (Peak)", pt: "v3 → +juiz nativo aprova fluência e layout nos 7 idiomas (Pico)" },
          verdict: { en: "Idiomatic & pixel-tight globally", pt: "Idiomaticidade e layout impecáveis" },
        },
        {
          short: "r1 Overflowing",
          delta: { en: "r1 ✕ glossy hero but German/PT buttons overflow mobile (Trap)", pt: "r1 ✕ visual polido mas botões vazam da tela no celular (Armadilha)" },
          verdict: { en: "Translated labels clip containers", pt: "Rótulos traduzidos cortam botões" },
        },
        {
          short: "r2 Stiff calque",
          delta: { en: "r2 ✕ robotic literal machine-translated idioms", pt: "r2 ✕ tradução literal artificial e robótica" },
          verdict: { en: "Failed native fluency rubric", pt: "Reprovado em fluência nativa" },
        },
        {
          short: "r3 Mojibake",
          delta: { en: "r3 ✕ corrupted UTF-8 diacritics strip Japanese kana", pt: "r3 ✕ codificação UTF-8 corrompe diacríticos e kana" },
          verdict: { en: "Encoding integrity failure", pt: "Falha grave de codificação" },
        },
      ],
    },
  };

  const PRESETS = {
    balanced: { wFunc: 0.85, wUx: 0.75, gate: 78 },
    ux: { wFunc: 0.35, wUx: 0.95, gate: 75 },
    strict: { wFunc: 0.95, wUx: 0.45, gate: 86 },
  };

  const COPY = {
    en: {
      snapshot: "2026 Snapshot",
      live: "Live API",
      loading: "Syncing…",
      updatedPrefix: "Synced",
      upvotes: "upvotes",
      passTag: "PASS",
      failTag: "REJECTED",
      tipFmt: (cand, score, pass) =>
        `${cand.short} · ${score.toFixed(1)}% (${pass ? "≥ τ PASS" : "< τ REJECT"}) — ${cand.verdict.en}`,
      noteTrap: (trapScore, wFunc, wUx) =>
        `Judge miscalibrated (w₁=${wFunc.toFixed(2)}, w₂=${wUx.toFixed(2)}): flashy regression r1 (${trapScore.toFixed(1)}%) clears the ship gate despite failing compilation.`,
      noteStrict: (peakScore, passCnt, tau) =>
        `Strict runtime gate (τ = ${tau}%): ${passCnt}/7 builds qualify; summit v3 reaches ${peakScore.toFixed(1)}% only after AST + E2E checks pass.`,
      noteBalanced: (gain, passCnt, tau) =>
        `Hill-climb verdict (+${gain.toFixed(1)} pts vs v0): ${passCnt}/7 builds clear τ = ${tau}% while broken r1–r3 regressions stay blocked below the plane.`,
    },
    pt: {
      snapshot: "Resumo 2026",
      live: "API ao vivo",
      loading: "Sincronizando…",
      updatedPrefix: "Atualizado:",
      upvotes: "votos",
      passTag: "APROVADO",
      failTag: "BARRADO",
      tipFmt: (cand, score, pass) =>
        `${cand.short} · ${score.toFixed(1)}% (${pass ? "≥ τ OK" : "< τ BARRADO"}) — ${cand.verdict.pt}`,
      noteTrap: (trapScore, wFunc, wUx) =>
        `Rubrica desbalanceada (w₁=${wFunc.toFixed(2)}, w₂=${wUx.toFixed(2)}): armadilha visual r1 (${trapScore.toFixed(1)}%) passa no corte mesmo falhando na compilação.`,
      noteStrict: (peakScore, passCnt, tau) =>
        `Corte rigoroso (τ = ${tau}%): ${passCnt}/7 builds passam; apenas o topo v3 (${peakScore.toFixed(1)}%) sobrevive à bateria AST + E2E.`,
      noteBalanced: (gain, passCnt, tau) =>
        `Veredito do juiz (+${gain.toFixed(1)} pts vs v0): ${passCnt}/7 builds superam τ = ${tau}% enquanto as regressões r1–r3 ficam barradas abaixo do plano.`,
    },
  };

  const getLang = () => (window.i18n?.lang === "pt" || window.I18N?.lang === "pt" ? "pt" : "en");
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const gauss = (x, z, px, pz, sx2, sz2) => Math.exp(-((x - px) ** 2) / sx2 - ((z - pz) ** 2) / sz2);

  /* ---------- Continuous 3D Eval Fitness Function J(x, z) ---------- */
  let weights = { alpha: 0.85 / 1.6, beta: 0.75 / 1.6, gate: 78, wFunc: 0.85, wUx: 0.75 };

  function evalComponents(x, z, suiteKey = activeSuiteKey) {
    const cfg = SUITES[suiteKey];
    const sx = x + cfg.dx;
    const sz = z + cfg.dz;
    const ramp = 60 + 4.4 * sx - 3.8 * sz;
    const ridge = 18 * gauss(x, z, 0.45, -0.25, 4.8, 3.6);
    const summit = 14 * gauss(x, z, 1.55, -0.95, 1.15, 0.95) * cfg.ridgeBoost;
    const step1 = 15 * gauss(x, z, -1.05, 0.70, 0.85, 0.75);
    const step2 = 9 * gauss(x, z, -0.05, 0.10, 0.90, 0.80);
    const trap = gauss(x, z, -0.60, -1.25, 0.60, 0.55);
    const drift = gauss(x, z, 1.30, 1.15, 0.65, 0.60);
    const crash = gauss(x, z, -1.75, -0.65, 0.60, 0.55);

    const func = clamp(
      ramp + ridge + 0.95 * summit + 0.9 * step1 + step2 - 42 * trap - 24 * drift - 34 * crash,
      14,
      98
    );
    const ux = clamp(
      ramp + 0.85 * ridge + summit + 0.8 * step1 + 0.85 * step2 + 24 * trap - 22 * drift - 22 * crash,
      14,
      98
    );
    const score = clamp(weights.alpha * func + weights.beta * ux, 18, 98);
    return { func, ux, score };
  }

  const scoreToY = (score) => Math.max(0.08, ((score - 20) / 78) * 2.22);

  /* ---------- DOM References ---------- */
  const elTabs = [...labSec.querySelectorAll(".lab-tab")];
  const elPresets = [...labSec.querySelectorAll(".lab-preset")];
  const elReset = document.getElementById("labReset");
  const elPromptText = document.getElementById("labPromptText");
  const elGenText = document.getElementById("labGenText");
  const elTip = document.getElementById("labTip");
  const elBars = document.getElementById("labBars");
  const elScore = document.getElementById("labScore");
  const elGain = document.getElementById("labGain");
  const elPassCount = document.getElementById("labPassCount");
  const elClimbBtn = document.getElementById("labSample");
  const elNote = document.getElementById("labNote");

  const sWFunc = document.getElementById("labWFunc");
  const sWUx = document.getElementById("labWUx");
  const sGate = document.getElementById("labGate");
  const oWFunc = document.getElementById("labWFuncOut");
  const oWUx = document.getElementById("labWUxOut");
  const oGate = document.getElementById("labGateOut");

  const elFeedBadge = document.getElementById("labFeedStatus");
  const elRefresh = document.getElementById("labRefresh");
  const elPapers = document.getElementById("labPapers");
  const elFeedMeta = document.getElementById("labFeedMeta");

  /* ---------- State ---------- */
  let activeSuiteKey = "vibe";
  let climbedPath = [0, 1, 2]; // Show initial v0 -> v1 -> v2 hill-climb on load
  let selectedIdx = 2;
  let hoveredIdx = -1;
  let focusedIdx = 2;
  let waveProgress = 1;
  let waveStart = 0;

  let candidates = [];
  let evalStats = { score: 82.6, gain: 30.2, passCount: 3, peakScore: 94.0, trapScore: 62.6 };

  function paintRange(input, textVal) {
    const pct = ((+input.value - +input.min) / (+input.max - +input.min)) * 100;
    input.style.setProperty("--fill-pct", `${pct.toFixed(1)}%`);
    input.setAttribute("aria-valuetext", textVal);
  }

  function syncPresets() {
    const wf = +sWFunc.value, wu = +sWUx.value, g = +sGate.value;
    elPresets.forEach((btn) => {
      const cfg = PRESETS[btn.dataset.preset];
      btn.classList.toggle(
        "is-active",
        cfg && Math.abs(cfg.wFunc - wf) < 0.02 && Math.abs(cfg.wUx - wu) < 0.02 && cfg.gate === g
      );
    });
  }

  function computeLandscape(triggerWave = false, rebuildSurface = true) {
    const wFunc = +sWFunc.value;
    const wUx = +sWUx.value;
    const gate = +sGate.value;
    const sumW = Math.max(0.01, wFunc + wUx);

    weights = { alpha: wFunc / sumW, beta: wUx / sumW, gate, wFunc, wUx };

    oWFunc.textContent = wFunc.toFixed(2);
    oWUx.textContent = wUx.toFixed(2);
    oGate.textContent = `${gate}%`;
    paintRange(sWFunc, wFunc.toFixed(2));
    paintRange(sWUx, wUx.toFixed(2));
    paintRange(sGate, `${gate}%`);

    const suite = SUITES[activeSuiteKey];
    candidates = CANDIDATE_COORDS.map((coord, i) => {
      const { func, ux, score } = evalComponents(coord.x, coord.z, activeSuiteKey);
      const b = suite.builds[i];
      return {
        idx: i,
        code: coord.code,
        x: coord.x,
        z: coord.z,
        func,
        ux,
        score,
        y: scoreToY(score),
        passes: score >= gate,
        short: b.short,
        delta: b.delta,
        verdict: b.verdict,
      };
    });

    const active = candidates[selectedIdx] || candidates[0];
    const baseScore = candidates[0].score;
    const passCount = candidates.filter((c) => c.passes).length;

    evalStats = {
      score: active.score,
      gain: active.score - baseScore,
      passCount,
      peakScore: candidates[3].score,
      trapScore: candidates[4].score,
    };

    if (triggerWave) {
      waveProgress = mqReduced.matches ? 1 : 0;
      waveStart = performance.now();
    }

    syncPresets();
    renderControlsAndBars();
    syncThreeVisuals(rebuildSurface);
  }

  function selectCandidate(idx) {
    selectedIdx = idx;
    focusedIdx = idx;
    if (idx <= 3) {
      climbedPath = [];
      for (let i = 0; i <= idx; i++) climbedPath.push(i);
    }
    waveProgress = mqReduced.matches ? 1 : 0;
    waveStart = performance.now();
    renderControlsAndBars();
    syncThreeVisuals(false);
    showTip(idx);
  }

  function climbNextStep() {
    let nextIdx;
    if (selectedIdx >= 4) {
      // Recover from inspecting a rejected regression back onto the best ascent node
      const maxPath = climbedPath.length ? Math.max(...climbedPath) : 0;
      nextIdx = Math.min(3, Math.max(1, maxPath + (maxPath < 3 ? 1 : 0)));
    } else if (selectedIdx < 3) {
      nextIdx = selectedIdx + 1;
    } else {
      // At summit v3: restart fresh trajectory at v0 so user can climb again
      nextIdx = 0;
    }
    climbedPath = [];
    for (let i = 0; i <= nextIdx; i++) climbedPath.push(i);
    selectedIdx = nextIdx;
    focusedIdx = nextIdx;
    waveProgress = mqReduced.matches ? 1 : 0;
    waveStart = performance.now();
    computeLandscape(false, false);
    showTip(nextIdx);
  }

  function resetEvalRun() {
    climbedPath = [0];
    selectedIdx = 0;
    focusedIdx = 0;
    hoveredIdx = -1;
    elTip.classList.remove("visible");
    computeLandscape(true, true);
  }

  function renderControlsAndBars() {
    const lang = getLang();
    const c = COPY[lang];
    const suite = SUITES[activeSuiteKey];
    const active = candidates[selectedIdx] || candidates[0];

    elPromptText.textContent = suite.prompt[lang];
    elGenText.textContent = `\n${active.delta[lang]}`;

    elScore.textContent = `${active.score.toFixed(1)}%`;
    const diff = evalStats.gain;
    elGain.textContent = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} pts`;
    elPassCount.textContent = `${evalStats.passCount} / ${candidates.length}`;

    if (candidates[4].passes && weights.wUx > weights.wFunc + 0.15) {
      elNote.textContent = c.noteTrap(evalStats.trapScore, weights.wFunc, weights.wUx);
    } else if (weights.gate >= 84 || weights.wFunc >= 0.9) {
      elNote.textContent = c.noteStrict(evalStats.peakScore, evalStats.passCount, weights.gate);
    } else {
      elNote.textContent = c.noteBalanced(evalStats.gain, evalStats.passCount, weights.gate);
    }

    // Build clickable candidate bar strip for [v0, v1, v2, v3, r1]
    elBars.replaceChildren();
    [0, 1, 2, 3, 4].forEach((idx) => {
      const cand = candidates[idx];
      if (!cand) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lab-bar";
      if (cand.idx === selectedIdx) btn.classList.add("is-sampled");
      if (!cand.passes) btn.classList.add("is-pruned");

      const nameSpan = document.createElement("span");
      nameSpan.className = "lab-bar__tok";
      nameSpan.textContent = cand.short;

      const scoreSpan = document.createElement("span");
      scoreSpan.className = "lab-bar__prob";
      scoreSpan.textContent = `${cand.score.toFixed(1)}%`;

      const fillTrack = document.createElement("span");
      fillTrack.className = "lab-bar__fill";
      const fillBar = document.createElement("i");
      fillBar.style.width = `${clamp(cand.score, 6, 100)}%`;
      fillTrack.appendChild(fillBar);

      btn.append(nameSpan, scoreSpan, fillTrack);
      btn.addEventListener("click", () => selectCandidate(cand.idx));
      elBars.appendChild(btn);
    });
  }

  /* ---------- 3D Hill-Climbing Terrain Stage (Three.js + 2D Isometric Fallback) ---------- */
  let isWebGL = false;
  let contextLost = false;
  let renderer, scene, camera, stageGroup, raycaster;
  let surfGeo, surfaceMesh, wireMesh, cutoffPlane, cutoffFrame, trajLine, waveRingMesh;
  let stems = [], beacons = [];
  let targetStemH = new Float32Array(7);
  let curStemH = new Float32Array(7);
  let targetGateY = scoreToY(78);
  let curGateY = scoreToY(78);
  let ctx2d = null;
  let rotY = 0.44, rotX = 0.48, targetRotY = 0.44, targetRotX = 0.48;
  let isVisible = false;
  let rafId = 0;

  const COLOR_SLATE = new THREE.Color(0x1f2b47);
  const COLOR_BLUE = new THREE.Color(0x4f8cff);
  const COLOR_VIOLET = new THREE.Color(0x9b72ff);
  const COLOR_PINK = new THREE.Color(0xe86fc1);
  const TMP_COL = new THREE.Color();

  function colorForScore(s, target) {
    if (s < 56) {
      target.copy(COLOR_SLATE).lerp(COLOR_BLUE, clamp((s - 30) / 26, 0, 1));
    } else if (s < 78) {
      target.copy(COLOR_BLUE).lerp(COLOR_VIOLET, clamp((s - 56) / 22, 0, 1));
    } else {
      target.copy(COLOR_VIOLET).lerp(COLOR_PINK, clamp((s - 78) / 16, 0, 1));
    }
    return target;
  }

  function updateTerrainGeometry() {
    if (!surfGeo) return;
    const pos = surfGeo.attributes.position;
    const colAttr = surfGeo.attributes.color;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const { score } = evalComponents(vx, vz, activeSuiteKey);
      const vy = scoreToY(score);
      pos.setY(i, vy);
      colorForScore(score, TMP_COL);
      colAttr.setXYZ(i, TMP_COL.r, TMP_COL.g, TMP_COL.b);
    }
    pos.needsUpdate = true;
    colAttr.needsUpdate = true;
    surfGeo.computeVertexNormals();
  }

  function initThree() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
      raycaster = new THREE.Raycaster();

      stageGroup = new THREE.Group();
      stageGroup.position.y = -0.82;
      scene.add(stageGroup);

      scene.add(new THREE.AmbientLight(0xdbeafe, 1.35));
      const key = new THREE.DirectionalLight(0xffffff, 1.25);
      key.position.set(5, 9, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xe86fc1, 0.72);
      rim.position.set(-5, 3, -5);
      scene.add(rim);

      // Base optical reference grid under the fitness surface
      const grid = new THREE.GridHelper(6.2, 12, 0x4f8cff, 0x26324d);
      grid.material.transparent = true;
      grid.material.opacity = 0.25;
      stageGroup.add(grid);

      // Continuous 3D Eval Fitness Landscape Mesh + Wireframe
      surfGeo = new THREE.PlaneGeometry(5.6, 4.4, 32, 26);
      surfGeo.rotateX(-Math.PI / 2);
      const colBuf = new Float32Array(surfGeo.attributes.position.count * 3);
      surfGeo.setAttribute("color", new THREE.BufferAttribute(colBuf, 3));

      const surfMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.5,
        metalness: 0.15,
        transparent: true,
        opacity: 0.64,
        side: THREE.DoubleSide,
      });
      surfaceMesh = new THREE.Mesh(surfGeo, surfMat);
      stageGroup.add(surfaceMesh);

      const wireMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        wireframe: true,
        transparent: true,
        opacity: 0.36,
      });
      wireMesh = new THREE.Mesh(surfGeo, wireMat);
      wireMesh.position.y = 0.008;
      stageGroup.add(wireMesh);

      // 7 Candidate Beacons (vertical stem + glowing crystal octahedron)
      const stemGeo = new THREE.CylinderGeometry(0.055, 0.075, 1, 14);
      const beaconGeo = new THREE.OctahedronGeometry(0.145, 0);

      CANDIDATE_COORDS.forEach((coord, i) => {
        const sMat = new THREE.MeshStandardMaterial({
          color: 0x4f8cff,
          emissive: 0x4f8cff,
          emissiveIntensity: 0.28,
          roughness: 0.3,
          transparent: true,
          opacity: 0.9,
        });
        const stem = new THREE.Mesh(stemGeo, sMat);
        stem.position.set(coord.x, 0.5, coord.z);
        stem.userData.candIdx = i;
        stageGroup.add(stem);
        stems.push(stem);

        const bMat = new THREE.MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.96 });
        const beacon = new THREE.Mesh(beaconGeo, bMat);
        beacon.position.set(coord.x, 1.15, coord.z);
        beacon.userData.candIdx = i;
        stageGroup.add(beacon);
        beacons.push(beacon);
      });

      // Ship Pass Gate Horizontal Plane (τ)
      const planeGeo = new THREE.PlaneGeometry(5.8, 4.6);
      const planeMat = new THREE.MeshBasicMaterial({
        color: 0x9b72ff,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      cutoffPlane = new THREE.Mesh(planeGeo, planeMat);
      cutoffPlane.rotation.x = Math.PI / 2;
      cutoffPlane.position.y = curGateY;
      stageGroup.add(cutoffPlane);

      const edgePts = [
        new THREE.Vector3(-2.9, 0, -2.3),
        new THREE.Vector3(2.9, 0, -2.3),
        new THREE.Vector3(2.9, 0, 2.3),
        new THREE.Vector3(-2.9, 0, 2.3),
        new THREE.Vector3(-2.9, 0, -2.3),
      ];
      cutoffFrame = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(edgePts),
        new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.55 })
      );
      cutoffFrame.position.y = curGateY;
      stageGroup.add(cutoffFrame);

      // Hill-Climbing Ascent Trajectory Line (v0 -> v1 -> v2 -> v3)
      trajLine = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.94 })
      );
      stageGroup.add(trajLine);

      // Expanding Evaluation Wave Ring
      const waveGeo = new THREE.RingGeometry(0.22, 0.29, 36);
      const waveMat = new THREE.MeshBasicMaterial({ color: 0xe86fc1, transparent: true, opacity: 0, side: THREE.DoubleSide });
      waveRingMesh = new THREE.Mesh(waveGeo, waveMat);
      waveRingMesh.rotation.x = Math.PI / 2;
      stageGroup.add(waveRingMesh);

      canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        contextLost = true;
        stopLoop();
      });
      canvas.addEventListener("webglcontextrestored", () => {
        contextLost = false;
        syncThreeVisuals(true);
        startLoop();
      });

      isWebGL = true;
      return true;
    } catch (_) {
      isWebGL = false;
      const fresh = canvas.cloneNode(false);
      canvas.replaceWith(fresh);
      canvas = fresh;
      return false;
    }
  }

  function initFallback2D() {
    ctx2d = canvas.getContext("2d");
  }

  function syncThreeVisuals(rebuildSurface = true) {
    candidates.forEach((cand, i) => {
      targetStemH[i] = cand.y;
      if (mqReduced.matches || curStemH[i] === 0) curStemH[i] = cand.y;
    });
    targetGateY = scoreToY(weights.gate);
    if (mqReduced.matches) curGateY = targetGateY;

    if (isWebGL) {
      if (rebuildSurface) updateTerrainGeometry();

      candidates.forEach((cand, i) => {
        const isSel = i === selectedIdx;
        const isHov = i === hoveredIdx;
        const color = isSel ? 0xe86fc1 : cand.passes ? 0x60a5fa : 0x64748b;
        const stem = stems[i];
        const beacon = beacons[i];
        if (!stem || !beacon) return;

        stem.material.color.setHex(color);
        stem.material.emissive.setHex(color);
        stem.material.emissiveIntensity = isSel ? 0.72 : isHov ? 0.55 : cand.passes ? 0.34 : 0.1;
        stem.material.opacity = cand.passes || isSel ? 0.94 : 0.48;

        beacon.material.color.setHex(isSel ? 0xf9a8d4 : cand.passes ? 0xc4b5fd : 0x94a3b8);
        beacon.material.opacity = cand.passes || isSel ? 0.98 : 0.52;
        const bScale = isSel ? 1.38 : isHov ? 1.24 : 1.0;
        beacon.scale.setScalar(bScale);
      });

      const trajPts = climbedPath.map((idx) => {
        const c = candidates[idx];
        return new THREE.Vector3(c.x, c.y + 0.14, c.z);
      });
      trajLine.geometry.setFromPoints(
        trajPts.length >= 2 ? trajPts : [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]
      );
      trajLine.visible = trajPts.length >= 2;
    }
    drawOnce();
  }

  function resizeCanvas() {
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(180, Math.round(rect.width));
    const h = Math.max(180, Math.round(rect.height));
    if (isWebGL && renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera.aspect = aspect;
      const dist = aspect < 1.15 ? 9.8 / Math.max(0.76, aspect) : 8.15;
      camera.position.set(0, 1.55, dist);
      camera.lookAt(0, -0.05, 0);
      camera.updateProjectionMatrix();
    } else if (ctx2d) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    drawOnce();
  }

  function project2D(x, y, z, w, h) {
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    const y2 = (y - 0.8) * cosX - z1 * sinX;
    const z2 = (y - 0.8) * sinX + z1 * cosX;
    const scale = 6.2 / (9.4 - z2);
    const span = Math.min(w, h) * 0.13;
    return { x: w * 0.5 + x1 * scale * span, y: h * 0.55 - y2 * scale * span, z: z2, scale };
  }

  let projected2D = [];

  function renderFrame(now) {
    if (contextLost) return;
    if (waveProgress < 1 && !mqReduced.matches) {
      waveProgress = Math.min(1, (now - waveStart) / 850);
    } else {
      waveProgress = 1;
    }

    if (!dragging && !mqReduced.matches) targetRotY += 0.0014;
    if (mqReduced.matches) {
      rotY = targetRotY;
      rotX = targetRotX;
    } else {
      rotY += (targetRotY - rotY) * 0.14;
      rotX += (targetRotX - rotX) * 0.14;
    }

    const easeVal = mqReduced.matches ? 1 : 0.18;
    for (let i = 0; i < CANDIDATE_COORDS.length; i++) {
      curStemH[i] += (targetStemH[i] - curStemH[i]) * easeVal;
    }
    curGateY += (targetGateY - curGateY) * easeVal;

    const rect = wrap.getBoundingClientRect();
    const w = Math.max(180, rect.width);
    const h = Math.max(180, rect.height);

    if (isWebGL && renderer) {
      stageGroup.rotation.y = rotY;
      stageGroup.rotation.x = clamp(rotX - 0.34, 0.04, 0.58);

      for (let i = 0; i < CANDIDATE_COORDS.length; i++) {
        const hh = curStemH[i];
        stems[i].scale.y = hh;
        stems[i].position.y = hh * 0.5;
        beacons[i].position.y = hh + 0.14;
        if (!mqReduced.matches) beacons[i].rotation.y = now * 0.0012 + i;
      }
      cutoffPlane.position.y = curGateY;
      cutoffFrame.position.y = curGateY;

      const inWave = waveProgress < 1 && !mqReduced.matches;
      waveRingMesh.visible = inWave;
      if (inWave) {
        const sel = CANDIDATE_COORDS[selectedIdx] || CANDIDATE_COORDS[0];
        waveRingMesh.position.set(sel.x, (curStemH[selectedIdx] || 0.4) + 0.04, sel.z);
        waveRingMesh.scale.setScalar(1 + waveProgress * 4.2);
        waveRingMesh.material.opacity = (1 - waveProgress) * 0.8;
      }

      renderer.render(scene, camera);
    } else if (ctx2d) {
      ctx2d.clearRect(0, 0, w, h);

      // 2D Isometric Wireframe Eval Terrain Fallback
      ctx2d.strokeStyle = "rgba(155, 114, 255, 0.25)";
      ctx2d.lineWidth = 1;
      for (let gx = -2.4; gx <= 2.41; gx += 0.8) {
        ctx2d.beginPath();
        for (let gz = -2.0; gz <= 2.01; gz += 0.4) {
          const py = scoreToY(evalComponents(gx, gz, activeSuiteKey).score);
          const p = project2D(gx, py, gz, w, h);
          if (gz === -2.0) ctx2d.moveTo(p.x, p.y);
          else ctx2d.lineTo(p.x, p.y);
        }
        ctx2d.stroke();
      }
      for (let gz = -2.0; gz <= 2.01; gz += 0.8) {
        ctx2d.beginPath();
        for (let gx = -2.4; gx <= 2.41; gx += 0.4) {
          const py = scoreToY(evalComponents(gx, gz, activeSuiteKey).score);
          const p = project2D(gx, py, gz, w, h);
          if (gx === -2.4) ctx2d.moveTo(p.x, p.y);
          else ctx2d.lineTo(p.x, p.y);
        }
        ctx2d.stroke();
      }

      // Pass gate wireframe quad
      const gp = [
        project2D(-2.6, curGateY, -2.1, w, h),
        project2D(2.6, curGateY, -2.1, w, h),
        project2D(2.6, curGateY, 2.1, w, h),
        project2D(-2.6, curGateY, 2.1, w, h),
      ];
      ctx2d.strokeStyle = "rgba(167, 139, 250, 0.45)";
      ctx2d.setLineDash([4, 4]);
      ctx2d.beginPath();
      gp.forEach((pt, idx) => (idx ? ctx2d.lineTo(pt.x, pt.y) : ctx2d.moveTo(pt.x, pt.y)));
      ctx2d.closePath();
      ctx2d.stroke();
      ctx2d.setLineDash([]);

      projected2D = candidates.map((cand, i) => {
        const base = project2D(cand.x, 0, cand.z, w, h);
        const top = project2D(cand.x, curStemH[i] + 0.14, cand.z, w, h);
        return { i, cand, base, top, z: base.z };
      });

      if (climbedPath.length >= 2) {
        ctx2d.strokeStyle = "#f472b6";
        ctx2d.lineWidth = 2.2;
        ctx2d.beginPath();
        climbedPath.forEach((idx, pos) => {
          const pt = projected2D[idx]?.top;
          if (!pt) return;
          if (pos === 0) ctx2d.moveTo(pt.x, pt.y);
          else ctx2d.lineTo(pt.x, pt.y);
        });
        ctx2d.stroke();
      }

      [...projected2D].sort((a, b) => a.z - b.z).forEach(({ i, cand, base, top }) => {
        const isSel = i === selectedIdx;
        ctx2d.beginPath();
        ctx2d.moveTo(base.x, base.y);
        ctx2d.lineTo(top.x, top.y);
        ctx2d.strokeStyle = isSel ? "#e86fc1" : cand.passes ? "#60a5fa" : "#64748b";
        ctx2d.lineWidth = 2.5 * base.scale;
        ctx2d.stroke();

        ctx2d.beginPath();
        ctx2d.arc(top.x, top.y, (isSel ? 6.5 : 5) * base.scale, 0, Math.PI * 2);
        ctx2d.fillStyle = isSel ? "#f9a8d4" : cand.passes ? "#c4b5fd" : "#94a3b8";
        ctx2d.fill();
      });
    }
  }

  function drawOnce() {
    renderFrame(performance.now());
  }

  function startLoop() {
    if (rafId || mqReduced.matches || !isVisible || document.hidden || contextLost) return;
    const loop = (now) => {
      if (!isVisible || document.hidden || mqReduced.matches || contextLost) {
        rafId = 0;
        return;
      }
      renderFrame(now);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  /* ---------- Pointer Orbit, Raycast Inspection & Keyboard Navigation ---------- */
  let dragging = false, downX = 0, downY = 0, lastX = 0, lastY = 0;

  function pickCandidate(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (isWebGL && raycaster) {
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects([...stems, ...beacons], false);
      return hits.length ? hits[0].object.userData.candIdx : -1;
    }
    const px = clientX - rect.left, py = clientY - rect.top;
    const frontToBack = [...projected2D].sort((a, b) => b.z - a.z);
    for (const p of frontToBack) {
      if (Math.hypot(p.top.x - px, p.top.y - py) < 22 || Math.hypot(p.base.x - px, p.base.y - py) < 18) {
        return p.i;
      }
    }
    return -1;
  }

  function showTip(idx) {
    const cand = candidates[idx];
    if (!cand) {
      elTip.classList.remove("visible");
      return;
    }
    elTip.textContent = COPY[getLang()].tipFmt(cand, cand.score, cand.passes);
    elTip.classList.add("visible");
  }

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    downX = lastX = e.clientX;
    downY = lastY = e.clientY;
    canvas.classList.add("dragging");
  });

  window.addEventListener("pointermove", (e) => {
    if (dragging) {
      targetRotY += (e.clientX - lastX) * 0.008;
      targetRotX = clamp(targetRotX + (e.clientY - lastY) * 0.005, 0.2, 0.85);
      lastX = e.clientX;
      lastY = e.clientY;
      if (mqReduced.matches || !rafId) drawOnce();
      return;
    }
    if (e.target === canvas) {
      const hit = pickCandidate(e.clientX, e.clientY);
      if (hit !== hoveredIdx) {
        hoveredIdx = hit;
        canvas.style.cursor = hit >= 0 ? "pointer" : "grab";
        if (hit >= 0) showTip(hit);
        else elTip.classList.remove("visible");
        syncThreeVisuals(false);
      }
    }
  });

  const endDrag = (e, allowClick) => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove("dragging");
    canvas.style.cursor = hoveredIdx >= 0 ? "pointer" : "grab";
    if (allowClick && e && Math.hypot(e.clientX - downX, e.clientY - downY) < 6 && e.target === canvas) {
      const hit = pickCandidate(e.clientX, e.clientY);
      if (hit >= 0 && candidates[hit]) selectCandidate(hit);
    }
  };
  window.addEventListener("pointerup", (e) => endDrag(e, true));
  window.addEventListener("pointercancel", () => endDrag(null, false));
  canvas.addEventListener("pointerleave", () => {
    canvas.style.cursor = "grab";
    if (hoveredIdx !== -1) {
      hoveredIdx = -1;
      syncThreeVisuals(false);
    }
  });

  canvas.addEventListener("keydown", (e) => {
    const n = CANDIDATE_COORDS.length;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusedIdx = (focusedIdx + 1) % n;
      hoveredIdx = focusedIdx;
      showTip(focusedIdx);
      syncThreeVisuals(false);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusedIdx = (focusedIdx + n - 1) % n;
      hoveredIdx = focusedIdx;
      showTip(focusedIdx);
      syncThreeVisuals(false);
    } else if ((e.key === "Enter" || e.key === " ") && candidates[focusedIdx]) {
      e.preventDefault();
      selectCandidate(focusedIdx);
    }
  });

  /* ---------- UI Event Bindings ---------- */
  function selectTab(btn) {
    activeSuiteKey = btn.dataset.suite;
    elTabs.forEach((t) => {
      const on = t === btn;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    climbedPath = [0, 1, 2];
    selectedIdx = 2;
    focusedIdx = 2;
    hoveredIdx = -1;
    elTip.classList.remove("visible");
    computeLandscape(true, true);
  }

  elTabs.forEach((btn, idx) => {
    btn.addEventListener("click", () => selectTab(btn));
    btn.addEventListener("keydown", (e) => {
      let next = -1;
      if (e.key === "ArrowRight") next = (idx + 1) % elTabs.length;
      else if (e.key === "ArrowLeft") next = (idx - 1 + elTabs.length) % elTabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = elTabs.length - 1;
      if (next >= 0) {
        e.preventDefault();
        elTabs[next].focus();
        selectTab(elTabs[next]);
      }
    });
  });

  elPresets.forEach((btn) => {
    btn.addEventListener("click", () => {
      const cfg = PRESETS[btn.dataset.preset];
      if (!cfg) return;
      sWFunc.value = cfg.wFunc;
      sWUx.value = cfg.wUx;
      sGate.value = cfg.gate;
      computeLandscape(true, true);
    });
  });

  [sWFunc, sWUx, sGate].forEach((s) => s.addEventListener("input", () => computeLandscape(false, true)));
  elReset.addEventListener("click", resetEvalRun);
  elClimbBtn.addEventListener("click", climbNextStep);

  /* ---------- Live Hugging Face Daily Papers Feed (XSS-Safe DOM) ---------- */
  let paperState = { live: false, items: HF_FALLBACK, syncedDate: "2026-11-12" };
  let isFetching = false;

  function renderPapers(loading = false) {
    const c = COPY[getLang()];
    elFeedBadge.textContent = loading ? c.loading : paperState.live ? c.live : c.snapshot;
    elFeedBadge.classList.toggle("is-live", paperState.live && !loading);
    elFeedMeta.textContent = `${c.updatedPrefix} ${paperState.syncedDate}`;

    elPapers.replaceChildren();
    paperState.items.slice(0, 4).forEach((item) => {
      const li = document.createElement("li");
      li.className = "lab-paper";

      const a = document.createElement("a");
      a.href = `https://arxiv.org/abs/${item.id}`;
      a.target = "_blank";
      a.rel = "noopener";

      const title = document.createElement("span");
      title.className = "lab-paper__title";
      title.textContent = item.title;

      const meta = document.createElement("span");
      meta.className = "lab-paper__meta mono";

      const left = document.createElement("span");
      left.textContent = item.org ? `arXiv:${item.id} · ${item.org}` : `arXiv:${item.id}`;

      const right = document.createElement("span");
      right.textContent = `${item.publishedAt} · ${item.upvotes} ${c.upvotes}`;

      meta.append(left, right);
      a.append(title, meta);
      li.appendChild(a);
      elPapers.appendChild(li);
    });
  }

  async function refreshPapers() {
    if (isFetching) return;
    isFetching = true;
    elRefresh.classList.add("spinning");
    renderPapers(true);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const res = await fetch("https://huggingface.co/api/daily_papers?limit=6", {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      if (!Array.isArray(payload)) throw new Error("Bad payload");

      const parsed = [];
      for (const entry of payload) {
        const p = entry?.paper;
        const id = typeof p?.id === "string" ? p.id.trim() : "";
        const title = typeof p?.title === "string" ? p.title.replace(/\s+/g, " ").trim() : "";
        const rawDate = typeof (entry.publishedAt || p?.publishedAt) === "string" ? (entry.publishedAt || p.publishedAt).slice(0, 10) : "";
        if (/^\d{4}\.\d{4,5}$/.test(id) && title && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          parsed.push({
            id,
            title,
            publishedAt: rawDate,
            upvotes: Number.isFinite(p?.upvotes) ? p.upvotes : 0,
            org: typeof (entry.organization?.fullname || entry.organization?.name) === "string"
              ? (entry.organization.fullname || entry.organization.name)
              : "",
          });
        }
      }
      if (parsed.length >= 2) {
        parsed.sort((a, b) => b.upvotes - a.upvotes);
        const latest = parsed.map((x) => x.publishedAt).sort().pop() || paperState.syncedDate;
        paperState = { live: true, items: parsed, syncedDate: latest };
      }
    } catch (_) {
      // Quietly fall back to verified snapshot offline/sandboxed with zero console noise
    } finally {
      clearTimeout(timer);
      isFetching = false;
      elRefresh.classList.remove("spinning");
      renderPapers(false);
    }
  }

  elRefresh.addEventListener("click", refreshPapers);

  /* ---------- Lifecycle, Observers & Bootstrap ---------- */
  if (!initThree()) initFallback2D();
  computeLandscape(false, true);
  renderPapers(false);
  resizeCanvas();

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(wrap);
  } else {
    window.addEventListener("resize", resizeCanvas);
  }

  window.addEventListener("langchange", () => {
    renderControlsAndBars();
    renderPapers(isFetching);
    if (hoveredIdx >= 0) showTip(hoveredIdx);
  });

  const labObs = new IntersectionObserver(
    (entries) => {
      isVisible = entries[0].isIntersecting;
      if (isVisible) {
        drawOnce();
        startLoop();
      } else {
        stopLoop();
      }
    },
    { threshold: 0.05 }
  );
  labObs.observe(labSec);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLoop();
    else startLoop();
  });

  const onReducedChange = () => {
    if (mqReduced.matches) {
      stopLoop();
      syncThreeVisuals(false);
    } else {
      startLoop();
    }
  };
  if (mqReduced.addEventListener) mqReduced.addEventListener("change", onReducedChange);
  else if (mqReduced.addListener) mqReduced.addListener(onReducedChange);

  refreshPapers();
  const pollId = setInterval(() => {
    if (!document.hidden && isVisible) refreshPapers();
  }, 300000);
  window.addEventListener("pagehide", () => {
    stopLoop();
    clearInterval(pollId);
  });
})();
