/* Interactive 3-Step Guide: How AI Writes (Built for Everyone) */
(() => {
  const labSec = document.getElementById("lab");
  if (!labSec) return;

  const getLang = () =>
    window.I18N?.lang === "pt" || document.documentElement.lang.startsWith("pt") ? "pt" : "en";

  /* ---------- General UI Copy (EN / PT-BR) ---------- */
  const COPY = {
    en: {
      nextAttn: "Next: Connect clues →",
      nextPred: "Next: Guess next word →",
      backTok: "Back to step 1 ↺",
      takeTokens:
        "Common words stay whole, while longer names, word endings, or emojis split into smaller numbered pieces.",
      takeAttnDefault:
        "AI resolves ambiguous words by shining a bright spotlight onto clue words elsewhere in the sentence.",
      takePredSafe:
        "Safe mode sticks to the most obvious continuation (~89%) — great for facts, less surprising for stories.",
      takePredBal:
        "Balanced mode weighs likely phrasing while keeping gentle variety — how everyday AI chat usually writes.",
      takePredWild:
        "Wild mode boosts rare long-shot guesses (~17%) — fun for brainstorming, and also why AI sometimes invents things.",
      wordOne: "word",
      wordMany: "words",
      pieceOne: "token piece",
      pieceMany: "token pieces",
      tokEmpty: "Start typing above to see your words split into AI token pieces.",
      spaceNote: "␣ leading space",
      doneBadge: "Complete",
      pickAgain: "New sentence",
      pickNext: "Pick next piece",
    },
    pt: {
      nextAttn: "Próximo: Conectar pistas →",
      nextPred: "Próximo: Prever a próxima →",
      backTok: "Voltar ao passo 1 ↺",
      takeTokens:
        "Palavras comuns ficam inteiras, enquanto nomes longos, terminações ou emojis viram pedaços menores numerados.",
      takeAttnDefault:
        "A IA descobre o sentido de palavras ambíguas jogando um holofote nas palavras-pista da frase.",
      takePredSafe:
        "O modo Seguro escolhe quase sempre o caminho mais óbvio (~89%) — ótimo para fatos, menos surpreendente em histórias.",
      takePredBal:
        "O modo Equilibrado combina clareza e leve variedade — é assim que chats de IA costumam escrever no dia a dia.",
      takePredWild:
        "O modo Criativo dá chance real a ideias improváveis (~17%) — bom para inventar, e explica por que a IA às vezes alucina.",
      wordOne: "palavra",
      wordMany: "palavras",
      pieceOne: "pedaço",
      pieceMany: "pedaços",
      tokEmpty: "Digite acima para ver suas palavras divididas em pedaços de IA.",
      spaceNote: "␣ espaço",
      doneBadge: "Pronto",
      pickAgain: "Nova frase",
      pickNext: "Escolher próxima",
    },
  };

  /* ---------- CHAPTER 1: Human-Friendly Subword Tokenizer ---------- */
  const TOK_SAMPLES = {
    en: [
      { label: "Rainy London ☕", text: "Unbelievable rainy morning in London ☕" },
      { label: "7 Languages 🌍", text: "Wisniewski speaks 7 languages 🌍" },
      { label: "Untranslatable", text: "Saudade has no single-word translation" },
    ],
    pt: [
      { label: "Chuva em Londres ☕", text: "Manhã inacreditável de chuva em Londres ☕" },
      { label: "7 Idiomas 🌍", text: "Wisniewski fala 7 idiomas pelo mundo 🌍" },
      { label: "Português rico", text: "Paralelepípedo e saudade em português" },
    ],
  };

  const COMMON_LOW_IDS = new Map([
    ["the", 262], ["in", 287], ["a", 257], ["to", 284], ["of", 286], ["and", 290],
    ["is", 318], ["it", 340], ["no", 645], ["has", 468], ["on", 319], ["for", 329],
    ["morning", 3329], ["london", 3576], ["rain", 6290], ["word", 1573], ["single", 2060],
    ["de", 390], ["em", 795], ["e", 304], ["um", 522], ["uma", 1408], ["chuva", 4820],
    ["pelo", 2140], ["mundo", 3110], ["fala", 2890], ["português", 5120],
  ]);

  const KNOWN_WHOLE = new Set([
    ...COMMON_LOW_IDS.keys(),
    "manhã", "londres", "dia", "sol", "café", "brasil", "vida", "hoje", "aqui",
    "ai", "hello", "world", "city", "love", "music", "code", "tea", "book",
    "speaks", "writes", "thinks", "bright", "light", "good", "best", "time",
  ]);

  const PREFIXES = ["incompre", "counter", "multi", "super", "trans", "inter", "inacredit", "un", "re", "pre", "des", "dis"];
  const SUFFIXES = ["ation", "imento", "amente", "mente", "ável", "avel", "idade", "able", "tion", "são", "ção", "ções", "ing", "ed", "ly", "er", "s"];

  const seg = typeof Intl !== "undefined" && Intl.Segmenter
    ? new Intl.Segmenter("en", { granularity: "grapheme" })
    : null;

  function toGraphemes(str) {
    if (seg) return [...seg.segment(str)].map((s) => s.segment);
    return Array.from(str);
  }

  function tokenIdFor(piece) {
    const clean = piece.trim();
    const low = COMMON_LOW_IDS.get(clean) || COMMON_LOW_IDS.get(clean.toLowerCase());
    if (low) return piece.startsWith(" ") ? low + 14 : low;
    let h = 2166136261;
    for (let i = 0; i < piece.length; i++) {
      h ^= piece.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return 1100 + ((h >>> 0) % 88000);
  }

  function splitWordPieces(word) {
    if (!word) return [];
    const low = word.toLowerCase();
    if (KNOWN_WHOLE.has(low) || toGraphemes(word).length <= 4) return [word];

    const out = [];
    let mid = word;
    let midLow = low;

    // Peel a leading prefix if enough stem remains
    for (const pre of PREFIXES) {
      if (midLow.startsWith(pre) && toGraphemes(mid).length - pre.length >= 3) {
        const cut = pre.length;
        out.push(mid.slice(0, cut));
        mid = mid.slice(cut);
        midLow = mid.toLowerCase();
        break;
      }
    }

    // Peel a trailing suffix
    let tail = "";
    for (const suf of SUFFIXES) {
      if (midLow.endsWith(suf) && toGraphemes(mid).length - suf.length >= 3) {
        const cut = mid.length - suf.length;
        tail = mid.slice(cut);
        mid = mid.slice(0, cut);
        break;
      }
    }

    const graphs = toGraphemes(mid);
    if (KNOWN_WHOLE.has(mid.toLowerCase()) || graphs.length <= 6) {
      if (mid) out.push(mid);
    } else {
      // Chunk remaining unfamiliar stems cleanly into 3-4 grapheme pieces (no mid-char cuts)
      const step = graphs.length > 9 ? 4 : 3;
      for (let i = 0; i < graphs.length; i += step) {
        out.push(graphs.slice(i, i + step).join(""));
      }
    }
    if (tail) out.push(tail);
    return out;
  }

  function tokenizeText(input) {
    const s = input.normalize("NFC");
    if (!s.trim()) return [];
    const tokens = [];
    // Match optional leading space + (digits | word characters | single punctuation/emoji grapheme)
    const rawRuns = s.match(/ ?(?:[0-9]+|[\p{L}\p{M}]+|[^\s\p{L}\p{M}0-9]+)/gu) || [];
    for (const run of rawRuns) {
      const hasSpace = run.startsWith(" ");
      const core = hasSpace ? run.slice(1) : run;
      if (/^[0-9]+$/.test(core)) {
        for (let i = 0; i < core.length; i += 3) {
          tokens.push((i === 0 && hasSpace ? " " : "") + core.slice(i, i + 3));
        }
      } else if (/^[\p{L}\p{M}]+$/u.test(core)) {
        const subs = splitWordPieces(core);
        subs.forEach((p, idx) => tokens.push((idx === 0 && hasSpace ? " " : "") + p));
      } else {
        const graphs = toGraphemes(core);
        graphs.forEach((g, idx) => tokens.push((idx === 0 && hasSpace ? " " : "") + g));
      }
    }
    return tokens;
  }

  /* ---------- CHAPTER 2: Context Spotlight Scenarios ---------- */
  const ATTN_SCENARIOS = {
    en: [
      {
        id: "suitcase",
        label: "Big vs. Small",
        words: ["The", "trophy", "didn't", "fit", "in", "the", "suitcase", "because", "it", "was", "too", "big"],
        twistIdx: 11,
        twistLabels: ["big", "small"],
        focusIdx: 8,
        links: {
          0: { 1: 0.82, 3: 0.09, 11: 0.06, 6: 0.03 },
          1: { 6: 0.84, 3: 0.08, 11: 0.05, 1: 0.03 },
        },
        explain: [
          'Because of "big", the AI shines 82% of its spotlight on "trophy" — knowing the trophy is what didn\'t fit.',
          'Swap just one word to "small", and the spotlight swings to "suitcase" (84%) — now the bag is the tight spot!',
        ],
      },
      {
        id: "bank",
        label: "Double Meaning",
        words: ["She", "sat", "by", "the", "bank", "to", "watch", "the", "ducks"],
        twistIdx: 8,
        twistLabels: ["ducks", "traders"],
        focusIdx: 4,
        links: {
          0: { 8: 0.85, 6: 0.09, 2: 0.06 },
          1: { 8: 0.86, 6: 0.09, 0: 0.05 },
        },
        explain: [
          '"Ducks" shines its spotlight back onto "bank" (85%) — telling the AI this means a river\'s edge, not money.',
          'Flip "ducks" to "traders", and the 86% link locks "bank" to finance and markets instead!',
        ],
      },
      {
        id: "sarcasm",
        label: "Spotting Irony",
        words: ["Two", "hours", "stuck", "in", "pouring", "rain,", "he", "muttered", "brilliant!"],
        twistIdx: 8,
        twistLabels: ["brilliant!", "finally!"],
        focusIdx: 8,
        links: {
          0: { 4: 0.34, 5: 0.32, 2: 0.24, 7: 0.1 },
          1: { 1: 0.38, 0: 0.3, 2: 0.22, 7: 0.1 },
        },
        explain: [
          'Connecting "brilliant!" back to "stuck in pouring rain" (90% combined) lets AI recognize dry British sarcasm.',
          'Flipping to "finally!" shifts focus onto "Two hours stuck" — now reading as genuine relief, not sarcasm.',
        ],
      },
    ],
    pt: [
      {
        id: "suitcase",
        label: "Grande vs. Pequeno",
        words: ["O", "troféu", "não", "coube", "no", "armário", "porque", "ele", "era", "grande", "demais"],
        twistIdx: 9,
        twistLabels: ["grande", "pequeno"],
        focusIdx: 7,
        links: {
          0: { 1: 0.82, 3: 0.09, 9: 0.06, 5: 0.03 },
          1: { 5: 0.84, 3: 0.08, 9: 0.05, 1: 0.03 },
        },
        explain: [
          'Por causa de "grande", a IA joga 82% do holofote em "troféu" — sabendo que ele é grande demais para entrar.',
          'Troque uma única palavra para "pequeno" e o foco salta para "armário" (84%) — agora é o armário que ficou pequeno!',
        ],
      },
      {
        id: "manga",
        label: "Duplo Sentido",
        words: ["Ele", "olhou", "para", "a", "manga", "e", "viu", "que", "estava", "rasgada"],
        twistIdx: 9,
        twistLabels: ["rasgada", "madura"],
        focusIdx: 4,
        links: {
          0: { 9: 0.86, 6: 0.08, 1: 0.06 },
          1: { 9: 0.87, 6: 0.07, 1: 0.06 },
        },
        explain: [
          '"Rasgada" ilumina "manga" com 86% de força — mostrando à IA que se trata da manga da camisa.',
          'Mude apenas para "madura" e o holofote de 87% transforma "manga" na fruta na mesma hora!',
        ],
      },
      {
        id: "sarcasm",
        label: "Notando Ironia",
        words: ["Duas", "horas", "preso", "na", "chuva", "forte,", "ele", "soltou:", "maravilha!"],
        twistIdx: 8,
        twistLabels: ["maravilha!", "finalmente!"],
        focusIdx: 8,
        links: {
          0: { 4: 0.35, 5: 0.31, 2: 0.24, 7: 0.1 },
          1: { 1: 0.39, 0: 0.29, 2: 0.22, 7: 0.1 },
        },
        explain: [
          'Ligar "maravilha!" de volta a "preso na chuva forte" revela na hora o tom irônico em vez de elogio literal.',
          'Ao trocar para "finalmente!", a atenção volta para "Duas horas preso" — indicando alívio real.',
        ],
      },
    ],
  };

  /* ---------- CHAPTER 3: Composable Next-Word Prediction Stories ---------- */
  const PRED_PROMPTS = {
    en: [
      {
        id: "london",
        label: "London Sunday",
        starter: "On a rainy Sunday in London, the best plan is",
        steps: [
          [
            [" finding a cozy café", 4.4],
            [" wandering the Tate Modern", 3.7],
            [" baking warm cinnamon rolls", 3.0],
            [" teaching a pigeon Portuguese", 1.6],
          ],
          [
            [" while rain taps the window", 4.4],
            [" with a good book open", 3.7],
            [" without checking work email", 3.0],
            [" beside a very polite fox", 1.6],
          ],
          [
            [" until the evening clouds clear.", 4.4],
            [" and letting time slow down.", 3.7],
            [" with a fresh cup of tea.", 3.0],
            [" while inventing an eighth language.", 1.6],
          ],
        ],
      },
      {
        id: "truth",
        label: "How AI Thinks",
        starter: "When someone asks how AI actually writes, the secret is",
        steps: [
          [
            [" spotting patterns across billions of words", 4.4],
            [" weighing clues from earlier context", 3.7],
            [" guessing one likely piece at a time", 3.0],
            [" improvising like a jazz pianist", 1.6],
          ],
          [
            [" without looking up canned answers", 4.4],
            [" using math instead of human feelings", 3.7],
            [" guided by every word you just typed", 3.0],
            [" fueled by dramatic midnight metaphors", 1.6],
          ],
          [
            [" before picking the very next word.", 4.4],
            [" turning likelihoods into fluid replies.", 3.7],
            [" sentence by sentence on the fly.", 3.0],
            [" and hoping nobody notices the wild guesses!", 1.6],
          ],
        ],
      },
      {
        id: "langs",
        label: "7 Languages",
        starter: "Learning a seventh language feels magical the moment",
        steps: [
          [
            [" a local joke finally clicks", 4.4],
            [" you catch yourself dreaming in it", 3.7],
            [" you order street food effortlessly", 3.0],
            [" three grammar rules join one sentence", 1.6],
          ],
          [
            [" turning shy tries into warm laughter", 4.4],
            [" linking Curitiba, Paris, Kraków, and London", 3.7],
            [" making a stranger smile right back", 3.0],
            [" mixing Brazilian warmth with Japanese politeness", 1.6],
          ],
          [
            [" like opening a new lens on the world.", 4.4],
            [" without touching a translation app.", 3.7],
            [" one curious conversation at a time.", 3.0],
            [" proving curiosity always beats perfection.", 1.6],
          ],
        ],
      },
    ],
    pt: [
      {
        id: "london",
        label: "Domingo em Londres",
        starter: "Num domingo chuvoso em Londres, a melhor ideia é",
        steps: [
          [
            [" achar um café aconchegante", 4.4],
            [" passear pela Tate Modern", 3.7],
            [" fazer pão de queijo quentinho", 3.0],
            [" ensinar português a um pombo", 1.6],
          ],
          [
            [" enquanto a chuva bate no vidro", 4.4],
            [" com um bom livro aberto", 3.7],
            [" sem olhar o celular nenhuma vez", 3.0],
            [" ao lado de uma raposa educada", 1.6],
          ],
          [
            [" até as nuvens abrirem lá fora.", 4.4],
            [" e deixar o tempo passar sem pressa.", 3.7],
            [" com uma xícara de café fresco.", 3.0],
            [" inventando um oitavo idioma.", 1.6],
          ],
        ],
      },
      {
        id: "truth",
        label: "Como a IA Pensa",
        starter: "Quando perguntam como a IA escreve de verdade, o segredo é",
        steps: [
          [
            [" reconhecer padrões em bilhões de textos", 4.4],
            [" pesar pistas das palavras anteriores", 3.7],
            [" prever um pedacinho provável por vez", 3.0],
            [" improvisar como um músico de jazz", 1.6],
          ],
          [
            [" sem consultar respostas prontas", 4.4],
            [" usando cálculos em vez de sentimentos", 3.7],
            [" guiada por tudo que você escreveu antes", 3.0],
            [" embalada por metáforas improváveis", 1.6],
          ],
          [
            [" antes de escolher a próxima palavra.", 4.4],
            [" transformando chances em frases fluidas.", 3.7],
            [" construindo a resposta ao vivo.", 3.0],
            [" e torcendo para o chute fazer sentido!", 1.6],
          ],
        ],
      },
      {
        id: "langs",
        label: "7 Idiomas",
        starter: "Aprender mais um idioma fica mágico bem no instante em que",
        steps: [
          [
            [" uma piada local finalmente faz sentido", 4.4],
            [" você percebe que sonhou em outra língua", 3.7],
            [" faz um pedido na rua sem travar", 3.0],
            [" três idiomas se misturam numa frase", 1.6],
          ],
          [
            [" transformando tropeços em boas risadas", 4.4],
            [" conectando Curitiba, Paris, Cracóvia e Londres", 3.7],
            [" fazendo alguém sorrir do outro lado", 3.0],
            [" unindo o jeitinho brasileiro ao humor japonês", 1.6],
          ],
          [
            [" como quem ganha uma nova lente sobre a vida.", 4.4],
            [" sem precisar abrir tradutor nenhum.", 3.7],
            [" uma conversa curiosa de cada vez.", 3.0],
            [" provando que curiosidade vence a perfeição.", 1.6],
          ],
        ],
      },
    ],
  };

  const MOODS = { safe: 0.32, balanced: 0.9, wild: 1.75 };

  /* ---------- DOM References ---------- */
  const stepTabs = [...labSec.querySelectorAll(".lab-step")];
  const panels = {
    tokens: document.getElementById("labPanelTokens"),
    attention: document.getElementById("labPanelAttn"),
    predict: document.getElementById("labPanelPredict"),
  };

  const tokInput = document.getElementById("tokInput");
  const tokStats = document.getElementById("tokStats");
  const tokSamplesEl = document.getElementById("tokSamples");
  const tokViewTabs = [...labSec.querySelectorAll("[data-view]")];
  const tokList = document.getElementById("tokList");

  const attnScenariosEl = document.getElementById("attnScenarios");
  const attnStage = document.getElementById("attnStage");
  const attnSvg = document.getElementById("attnSvg");
  const attnWordsEl = document.getElementById("attnWords");
  const attnExplain = document.getElementById("attnExplain");

  const predPromptsEl = document.getElementById("predPrompts");
  const moodTabs = [...labSec.querySelectorAll("[data-mood]")];
  const predSentence = document.getElementById("predSentence");
  const predBars = document.getElementById("predBars");
  const predRollBtn = document.getElementById("predRoll");
  const predResetBtn = document.getElementById("predReset");

  const labTakeaway = document.getElementById("labTakeaway");
  const labNextStep = document.getElementById("labNextStep");

  /* ---------- State ---------- */
  let state = {
    step: "tokens",
    tokView: "pieces",
    tokSampleIdx: 0,
    tokCustom: false,
    attnScenIdx: 0,
    attnTwist: 0,
    attnFocusOverride: -1,
    predPromptIdx: 0,
    mood: "balanced",
    predChunks: [],
  };

  const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Navigation & Tablists ---------- */
  function bindTablist(tabs, onSelect) {
    tabs.forEach((btn, idx) => {
      btn.addEventListener("click", () => onSelect(btn));
      btn.addEventListener("keydown", (e) => {
        let next = -1;
        if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
        else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next >= 0) {
          e.preventDefault();
          tabs[next].focus();
          onSelect(tabs[next]);
        }
      });
    });
  }

  function setActiveTab(tabs, targetBtn) {
    tabs.forEach((t) => {
      const on = t === targetBtn;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
  }

  function setStep(stepName) {
    state.step = stepName;
    const btn = stepTabs.find((t) => t.dataset.step === stepName) || stepTabs[0];
    setActiveTab(stepTabs, btn);
    Object.entries(panels).forEach(([key, panel]) => {
      panel.hidden = key !== stepName;
    });
    updateFooter();
    if (stepName === "attention") {
      requestAnimationFrame(() => drawAttentionArcs());
    }
  }

  bindTablist(stepTabs, (btn) => setStep(btn.dataset.step));

  labNextStep.addEventListener("click", () => {
    if (state.step === "tokens") setStep("attention");
    else if (state.step === "attention") setStep("predict");
    else setStep("tokens");
  });

  function updateFooter() {
    const lang = getLang();
    const c = COPY[lang];
    if (state.step === "tokens") {
      labTakeaway.textContent = c.takeTokens;
      labNextStep.textContent = c.nextAttn;
    } else if (state.step === "attention") {
      labTakeaway.textContent = c.takeAttnDefault;
      labNextStep.textContent = c.nextPred;
    } else {
      labTakeaway.textContent =
        state.mood === "safe"
          ? c.takePredSafe
          : state.mood === "wild"
            ? c.takePredWild
            : c.takePredBal;
      labNextStep.textContent = c.backTok;
    }
  }

  /* ---------- Chapter 1 Rendering ---------- */
  function renderTokenizer(syncDefaultText = false) {
    const lang = getLang();
    const c = COPY[lang];
    const samples = TOK_SAMPLES[lang];

    if (syncDefaultText || (!state.tokCustom && tokInput.value !== samples[state.tokSampleIdx]?.text)) {
      const sample = samples[state.tokSampleIdx] || samples[0];
      tokInput.value = sample.text;
    }

    tokSamplesEl.replaceChildren();
    samples.forEach((s, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lab-chip";
      if (!state.tokCustom && i === state.tokSampleIdx) btn.classList.add("is-active");
      btn.textContent = s.label;
      btn.addEventListener("click", () => {
        state.tokSampleIdx = i;
        state.tokCustom = false;
        tokInput.value = s.text;
        renderTokenizer(false);
      });
      tokSamplesEl.appendChild(btn);
    });

    const text = tokInput.value;
    const pieces = tokenizeText(text);
    const wordCount = (text.trim().match(/[\p{L}\p{M}0-9]+/gu) || []).length;
    tokStats.textContent = `${wordCount} ${wordCount === 1 ? c.wordOne : c.wordMany} → ${pieces.length} ${pieces.length === 1 ? c.pieceOne : c.pieceMany}`;

    tokList.classList.toggle("is-numbers", state.tokView === "numbers");
    tokList.replaceChildren();

    if (!pieces.length) {
      const empty = document.createElement("p");
      empty.className = "lab-tok-empty";
      empty.textContent = c.tokEmpty;
      tokList.appendChild(empty);
      return;
    }

    pieces.forEach((p, idx) => {
      const id = tokenIdFor(p);
      const chip = document.createElement("span");
      chip.className = "lab-tok-chip";
      chip.dataset.c = String(idx % 5);

      const prettyText = p.startsWith(" ") ? "·" + p.slice(1) : p;
      const main = document.createElement("span");
      main.className = "lab-tok-chip__main";

      const sub = document.createElement("span");
      sub.className = "lab-tok-chip__sub mono";

      if (state.tokView === "numbers") {
        main.textContent = String(id);
        sub.textContent = p === " " ? c.spaceNote : `"${prettyText}"`;
      } else {
        main.textContent = prettyText === " " ? "·" : prettyText;
        sub.textContent = `#${id}`;
      }

      chip.append(main, sub);
      tokList.appendChild(chip);
    });
  }

  tokInput.addEventListener("input", () => {
    state.tokCustom = true;
    renderTokenizer(false);
  });

  bindTablist(tokViewTabs, (btn) => {
    state.tokView = btn.dataset.view;
    setActiveTab(tokViewTabs, btn);
    renderTokenizer(false);
  });

  /* ---------- Chapter 2 Rendering (SVG Spotlight Arcs) ---------- */
  function computeFallbackLinks(words, idx) {
    const res = {};
    const n = words.length;
    const targets = [];
    words.forEach((w, i) => {
      if (i !== idx && w.replace(/[^\p{L}]/gu, "").length >= 4) targets.push(i);
    });
    const pick = targets.slice(0, 3);
    if (!pick.length && n > 1) pick.push(idx === 0 ? 1 : 0);
    const weights = [0.64, 0.24, 0.12];
    pick.forEach((t, k) => {
      res[t] = weights[k] || 0.12;
    });
    return res;
  }

  function renderAttention() {
    const lang = getLang();
    const scenarios = ATTN_SCENARIOS[lang];
    const sc = scenarios[state.attnScenIdx] || scenarios[0];

    attnScenariosEl.replaceChildren();
    scenarios.forEach((item, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lab-chip";
      if (i === state.attnScenIdx) btn.classList.add("is-active");
      btn.textContent = item.label;
      btn.addEventListener("click", () => {
        state.attnScenIdx = i;
        state.attnTwist = 0;
        state.attnFocusOverride = -1;
        renderAttention();
      });
      attnScenariosEl.appendChild(btn);
    });

    const words = sc.words.map((w, i) => (i === sc.twistIdx ? sc.twistLabels[state.attnTwist] : w));
    const focusIdx = state.attnFocusOverride >= 0 ? state.attnFocusOverride : sc.focusIdx;
    const weights =
      state.attnFocusOverride >= 0 && state.attnFocusOverride !== sc.focusIdx
        ? computeFallbackLinks(words, focusIdx)
        : sc.links[state.attnTwist];

    attnWordsEl.replaceChildren();
    words.forEach((word, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lab-word";
      btn.dataset.idx = String(i);
      if (i === sc.twistIdx) btn.classList.add("lab-word--twist");
      if (i === focusIdx) btn.classList.add("is-focus");
      const w = weights[i] || 0;
      if (w > 0 && i !== focusIdx) {
        btn.classList.add("is-target");
        btn.style.setProperty("--w", w.toFixed(2));
      }
      btn.textContent = word;
      btn.addEventListener("click", () => {
        if (i === sc.twistIdx) {
          state.attnTwist = state.attnTwist === 0 ? 1 : 0;
          if (sc.focusIdx !== sc.twistIdx) state.attnFocusOverride = -1;
        } else {
          state.attnFocusOverride = i === state.attnFocusOverride ? -1 : i;
        }
        renderAttention();
      });
      attnWordsEl.appendChild(btn);
    });

    if (state.attnFocusOverride >= 0 && state.attnFocusOverride !== sc.focusIdx) {
      const topTargetIdx = Object.entries(weights).sort((a, b) => b[1] - a[1])[0]?.[0];
      const fWord = words[focusIdx];
      const tWord = topTargetIdx != null ? words[Number(topTargetIdx)] : "";
      attnExplain.textContent =
        lang === "pt"
          ? `Olhando a partir de "${fWord}", o modelo conecta pistas principalmente com "${tWord}" para manter a frase coesa.`
          : `Looking from "${fWord}", the model connects strongest clues with "${tWord}" to keep the sentence coherent.`;
    } else {
      attnExplain.textContent = sc.explain[state.attnTwist];
    }

    if (state.step === "attention") {
      requestAnimationFrame(() => drawAttentionArcs());
    }
  }

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    return el;
  }

  function drawAttentionArcs() {
    if (panels.attention.hidden) return;
    const stageRect = attnStage.getBoundingClientRect();
    if (stageRect.width < 20 || stageRect.height < 20) return;

    const lang = getLang();
    const sc = ATTN_SCENARIOS[lang][state.attnScenIdx] || ATTN_SCENARIOS[lang][0];
    const wordBtns = [...attnWordsEl.querySelectorAll(".lab-word")];
    const focusIdx = state.attnFocusOverride >= 0 ? state.attnFocusOverride : sc.focusIdx;
    const srcBtn = wordBtns[focusIdx];
    if (!srcBtn) return;

    const words = wordBtns.map((b) => b.textContent);
    const weights =
      state.attnFocusOverride >= 0 && state.attnFocusOverride !== sc.focusIdx
        ? computeFallbackLinks(words, focusIdx)
        : sc.links[state.attnTwist];

    attnSvg.replaceChildren();
    const defs = svgEl("defs");
    const grad = svgEl("linearGradient", { id: "attnGrad", x1: "0%", y1: "0%", x2: "100%", y2: "0%" });
    grad.append(
      svgEl("stop", { offset: "0%", "stop-color": "#4f8cff" }),
      svgEl("stop", { offset: "55%", "stop-color": "#9b72ff" }),
      svgEl("stop", { offset: "100%", "stop-color": "#e86fc1" })
    );
    defs.appendChild(grad);
    attnSvg.appendChild(defs);

    attnSvg.setAttribute("viewBox", `0 0 ${stageRect.width} ${stageRect.height}`);

    const sr = srcBtn.getBoundingClientRect();
    const sx = sr.left - stageRect.left + sr.width * 0.5;
    const badges = [];
    const entries = Object.entries(weights)
      .map(([k, w]) => [Number(k), w])
      .sort((a, b) => a[1] - b[1]);

    entries.forEach(([tIdx, w]) => {
      const tgtBtn = wordBtns[tIdx];
      if (!tgtBtn || tIdx === focusIdx || w < 0.02) return;
      const tr = tgtBtn.getBoundingClientRect();
      const tx = tr.left - stageRect.left + tr.width * 0.5;

      let sy, ty, c1x, c1y, c2x, c2y, bx, by;
      const sameRow = Math.abs(sr.top - tr.top) < 12;

      if (sameRow) {
        sy = sr.top - stageRect.top - 2;
        ty = tr.top - stageRect.top - 2;
        const lift = Math.min(44, 18 + Math.abs(tx - sx) * 0.13);
        c1x = sx + (tx - sx) * 0.2;
        c1y = sy - lift;
        c2x = sx + (tx - sx) * 0.8;
        c2y = ty - lift;
        bx = tx;
        by = ty - 16;
      } else if (tr.bottom < sr.top - 4) {
        // Target is on a row above source: curve cleanly inside the between-row lane
        sy = sr.top - stageRect.top - 2;
        ty = tr.bottom - stageRect.top + 3;
        const midY = (sy + ty) * 0.5;
        c1x = sx;
        c1y = midY;
        c2x = tx;
        c2y = midY;
        bx = tx;
        by = ty + 14;
      } else {
        // Target is on a row below source
        sy = sr.bottom - stageRect.top + 3;
        ty = tr.top - stageRect.top - 2;
        const midY = (sy + ty) * 0.5;
        c1x = sx;
        c1y = midY;
        c2x = tx;
        c2y = midY;
        bx = tx;
        by = ty - 15;
      }

      const d = `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${tx.toFixed(1)} ${ty.toFixed(1)}`;
      const baseOpacity = Math.min(0.95, 0.22 + w * 0.85);
      const sw = (1.4 + w * 3.4).toFixed(2);

      attnSvg.appendChild(
        svgEl("path", {
          d,
          class: "lab-attn-arc",
          stroke: w >= 0.5 ? "url(#attnGrad)" : "#7b9dff",
          "stroke-width": sw,
          opacity: baseOpacity.toFixed(2),
        })
      );

      if (w >= 0.25 && !mqReduced.matches) {
        attnSvg.appendChild(
          svgEl("path", {
            d,
            class: "lab-attn-arc lab-attn-arc--flow",
            stroke: "#f5d0fe",
            "stroke-width": "1.6",
            opacity: "0.72",
          })
        );
      }

      if (w >= 0.2) badges.push({ x: bx, y: by, pct: `${Math.round(w * 100)}%` });
    });

    // De-collide close badges horizontally before drawing
    badges.sort((a, b) => a.x - b.x);
    for (let i = 1; i < badges.length; i++) {
      if (Math.abs(badges[i].x - badges[i - 1].x) < 42 && Math.abs(badges[i].y - badges[i - 1].y) < 20) {
        badges[i].y -= 18;
      }
    }

    badges.forEach(({ x, y, pct }) => {
      const clampedX = Math.max(24, Math.min(stageRect.width - 24, x));
      const clampedY = Math.max(13, Math.min(stageRect.height - 13, y));
      const g = svgEl("g");
      g.append(
        svgEl("rect", {
          x: (clampedX - 18).toFixed(1),
          y: (clampedY - 10).toFixed(1),
          width: 36,
          height: 20,
          rx: 10,
          class: "lab-attn-pill-bg",
        }),
        (() => {
          const t = svgEl("text", { x: clampedX.toFixed(1), y: clampedY.toFixed(1), class: "lab-attn-pill-txt" });
          t.textContent = pct;
          return t;
        })()
      );
      attnSvg.appendChild(g);
    });
  }

  /* ---------- Chapter 3 Rendering (Next-Word Predictor) ---------- */
  function computeProbs(choices, temp) {
    const scaled = choices.map(([, z]) => z / temp);
    const maxZ = Math.max(...scaled);
    const exps = scaled.map((v) => Math.exp(v - maxZ));
    const sum = exps.reduce((a, b) => a + b, 0);
    return choices.map(([text], i) => ({ text, prob: exps[i] / sum }));
  }

  function renderPredict() {
    const lang = getLang();
    const c = COPY[lang];
    const prompts = PRED_PROMPTS[lang];
    const pObj = prompts[state.predPromptIdx] || prompts[0];

    predPromptsEl.replaceChildren();
    prompts.forEach((item, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lab-chip";
      if (i === state.predPromptIdx) btn.classList.add("is-active");
      btn.textContent = item.label;
      btn.addEventListener("click", () => {
        state.predPromptIdx = i;
        state.predChunks = [];
        renderPredict();
      });
      predPromptsEl.appendChild(btn);
    });

    const stepNum = Math.min(state.predChunks.length, pObj.steps.length - 1);
    const done = state.predChunks.length >= pObj.steps.length;

    predSentence.replaceChildren();
    predSentence.appendChild(document.createTextNode(pObj.starter));
    state.predChunks.forEach((chunk) => {
      const span = document.createElement("span");
      span.className = "lab-gen-piece";
      span.textContent = chunk;
      predSentence.append(document.createTextNode(" "), span);
    });

    if (done) {
      const badge = document.createElement("span");
      badge.className = "lab-done-pill";
      badge.textContent = `✓ ${c.doneBadge}`;
      predSentence.appendChild(badge);
    } else {
      const cur = document.createElement("span");
      cur.className = "lab-cursor";
      cur.setAttribute("aria-hidden", "true");
      cur.textContent = "▍";
      predSentence.appendChild(cur);
    }

    const rollTextSpan = predRollBtn.querySelector("span[data-i18n]");
    if (rollTextSpan) rollTextSpan.textContent = done ? c.pickAgain : c.pickNext;

    const currentChoices = computeProbs(pObj.steps[stepNum], MOODS[state.mood]);
    predBars.replaceChildren();
    currentChoices.forEach((item, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lab-pred-bar";
      if (idx === 0) btn.classList.add("is-top");

      const row = document.createElement("span");
      row.className = "lab-pred-bar__row";

      const txt = document.createElement("span");
      txt.className = "lab-pred-bar__text";
      txt.textContent = item.text.trim();

      const pct = document.createElement("span");
      pct.className = "lab-pred-bar__pct";
      pct.textContent = `${Math.round(item.prob * 100)}%`;

      const track = document.createElement("span");
      track.className = "lab-pred-bar__track";
      const fill = document.createElement("i");
      fill.style.width = `${Math.max(5, Math.round(item.prob * 100))}%`;
      track.appendChild(fill);

      row.append(txt, pct);
      btn.append(row, track);
      btn.addEventListener("click", () => {
        if (state.predChunks.length >= pObj.steps.length) state.predChunks = [];
        state.predChunks.push(item.text.trim());
        renderPredict();
      });
      predBars.appendChild(btn);
    });

    if (state.step === "predict") updateFooter();
  }

  bindTablist(moodTabs, (btn) => {
    state.mood = btn.dataset.mood;
    setActiveTab(moodTabs, btn);
    renderPredict();
    updateFooter();
  });

  predRollBtn.addEventListener("click", () => {
    const pObj = PRED_PROMPTS[getLang()][state.predPromptIdx] || PRED_PROMPTS[getLang()][0];
    if (state.predChunks.length >= pObj.steps.length) {
      state.predChunks = [];
      renderPredict();
      return;
    }
    const choices = computeProbs(pObj.steps[state.predChunks.length], MOODS[state.mood]);
    let r = Math.random();
    let picked = choices[0];
    for (const c of choices) {
      r -= c.prob;
      if (r <= 0) {
        picked = c;
        break;
      }
    }
    state.predChunks.push(picked.text.trim());
    renderPredict();
  });

  predResetBtn.addEventListener("click", () => {
    state.predChunks = [];
    renderPredict();
  });

  /* ---------- Lifecycle, Resize & Bilingual Sync ---------- */
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => drawAttentionArcs()).observe(attnStage);
  } else {
    window.addEventListener("resize", () => drawAttentionArcs());
  }

  window.addEventListener("langchange", () => {
    state.predChunks = [];
    renderTokenizer(!state.tokCustom);
    renderAttention();
    renderPredict();
    updateFooter();
  });

  const onReducedChange = () => drawAttentionArcs();
  if (mqReduced.addEventListener) mqReduced.addEventListener("change", onReducedChange);
  else if (mqReduced.addListener) mqReduced.addListener(onReducedChange);

  // Initial render
  renderTokenizer(true);
  renderAttention();
  renderPredict();
  setStep("tokens");
})();
