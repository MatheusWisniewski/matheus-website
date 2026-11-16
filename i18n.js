/*
 * Lightweight EN / PT-BR switcher.
 * English lives in the HTML (source of truth); this file only holds Portuguese.
 * - [data-i18n="key"]            -> innerHTML swapped
 * - [data-i18n-attr="attr:key;"] -> attributes swapped
 * - .date elements               -> month names / "Present" localised
 * - img[alt$=" logo"]            -> alt localised
 * Choice priority: ?lang= param > localStorage > browser language (pt*) / Brazil timezone > English.
 */
(() => {
  "use strict";

  const PT = {
      "t1": "Sobre",
      "t2": "Experiência",
      "t3": "Habilidades",
      "t4": "Formação",
      "t5": "Idiomas",
      "t6": "Contato",
      "t7": "<span class=\"pulse-dot\"></span> Engenheiro de Software @ Google DeepMind",
      "t8": "Olá, sou o <span class=\"gradient-text\">Matheus Wisniewski</span>.",
      "t9": "Crio as interfaces onde pessoas e IA de ponta se encontram.",
      "t10": "Ver minha trajetória",
      "t11": "Londres 🇬🇧",
      "t12": "Onde trabalhei, lancei produtos e estudei",
      "t13": "Sobre mim",
      "t14": "Sou <strong>Engenheiro de Software Full Stack</strong> no <strong>Google DeepMind</strong>, em Londres, onde desenvolvo o <a href=\"https://ai.dev/build\" target=\"_blank\" rel=\"noopener\" class=\"inline-link\">Google AI Studio Build</a> — nossa plataforma de <em>vibe coding</em> que transforma prompts em aplicações completas — e os pipelines de <strong>avaliação com LLM-as-a-judge</strong> que elevam continuamente a qualidade dos apps gerados.",
      "t15": "Mesmo lidando com desafios altamente técnicos, me relaciono muito bem com pessoas e gosto de falar para grandes públicos. Meu lado empreendedor me move a buscar sempre formas criativas de resolver problemas.",
      "t16": "Minha trajetória passa por engenharia de controle e automação, óptica, sistemas aeroportuários, dashboards para o mercado financeiro, parcerias no YouTube e agora IA generativa — tendo como próximo passo o <strong>mestrado (MSc) em Integrated Machine Learning Systems na UCL</strong>.",
      "t17": "🗣️ Aprendizado de idiomas",
      "t18": "🧘 Meditação",
      "t19": "📚 Leitura",
      "t20": "🏃 Corrida",
      "t21": "🏊 Natação",
      "t22": "Anos desenvolvendo software",
      "t23": "Idiomas falados",
      "t24": "Países onde morei e trabalhei",
      "t25": "Início no Google DeepMind",
      "t26": "Engenheiro de Software",
      "t26_co": "Google DeepMind · Londres, Reino Unido",
      "t27": "Engenheiro de Software Full Stack na unidade de IA Generativa, desenvolvendo a arquitetura de produto e os ciclos automatizados de avaliação por trás do <a href=\"https://ai.dev/build\" target=\"_blank\" rel=\"noopener\" class=\"inline-link\"><strong>Google AI Studio Build</strong> (ai.dev/build)</a> — a plataforma de <em>vibe coding</em> do Google AI Studio que transforma prompts em aplicações web completas.",
      "t27_h1": "Plataforma de Vibe Coding · UI e Pipeline Backend",
      "t27_p1": "Desenvolvimento de ponta a ponta dos fluxos de interface e da orquestração de backend para geração de apps por prompt, sandboxes ao vivo e refinamento iterativo de código.",
      "t27_h2": "Pipeline de Evals · Hill Climbing com LLM-as-a-Judge",
      "t27_tag2": "LLM-as-a-Judge",
      "t27_p2": "Implementação de pipelines automatizados de avaliação com juízes baseados em LLM para guiar melhorias contínuas (hill climbing) na qualidade dos apps gerados — medindo compilação, UX e fidelidade funcional.",
      "t28_eval": "Evals com LLM",
      "t28": "IA Generativa",
      "t29": "Partner Technology Manager · YouTube",
      "t30": "Gerenciei o relacionamento técnico com os maiores parceiros de mídia do Reino Unido no YouTube — automações via API, upload em massa de vídeos, transmissões ao vivo, análise de dados e proteção de direitos autorais via Content ID. Criei dashboards internos, cobri lacunas de produto, automatizei operações de parceiros e conduzi novas iniciativas da concepção ao lançamento.",
      "t31": "Engenheiro de Software Front-End · ML (projeto 20%)",
      "t32": "Interface de um produto de rotulagem de dados para machine learning.",
      "t33": "Engenheiro de Software Front-End · NBU (projeto 20%)",
      "t34": "Portal interno de busca para facilitar o acesso e a descoberta do acervo de pesquisas do Google.",
      "t35": "Análise de Dados",
      "t36": "Engenheiro JavaScript Sênior",
      "t37": "Luxoft · Cracóvia, Polônia",
      "t38": "Desenvolvi dashboards de investimentos e análise de dados para o mercado financeiro.",
      "t39": "Engenheiro de Software Front-End Angular",
      "t40": "James Delivery · Curitiba, Brasil",
      "t41": "Criei o dashboard interno de operações de entrega, um site e aplicativo desktop para estabelecimentos parceiros (pedidos, finanças e cardápios) e o site institucional da empresa.",
      "t42": "Desenvolvedor de Software (C++ / iOS)",
      "t43": "CINQ Technologies · Curitiba, Brasil",
      "t44": "Desenvolvi software de troca de mensagens para sistemas aeroportuários e um app de rastreamento de bagagens para iPad, atuando em times Scrum com comunicação em inglês.",
      "t45": "Estagiário de Engenharia de Telecomunicações",
      "t46": "Prestei suporte técnico a projetos FTTH (Fiber to the Home) na América Latina, elaborei diagramas de redes ópticas passivas e desenvolvi automações em VBA.",
      "t47": "Redes Ópticas",
      "t48": "Iniciação Científica e Monitoria",
      "t49": "UTFPR · Curitiba, Brasil",
      "t50": "Pesquisei e desenvolvi um sistema óptico para medição de ressonância de plásmons de superfície (com fomento da Fundação Araucária). Atuei como monitor de Cálculo IV — transformadas de Fourier e Laplace.",
      "t51": "Óptica",
      "t52": "Pesquisa",
      "t53": "Matemática",
      "t54": "Habilidades e ferramentas",
      "t55": "IA e Machine Learning",
      "t56": "Interfaces de vibe coding, pipelines automatizados de avaliação com LLM-as-a-judge (hill climbing de qualidade) e ferramentas de rotulagem de dados para ML.",
      "t57": "Front-End e Full Stack",
      "t58": "Plataformas web e pipelines de backend de ponta a ponta, de ambientes de criação com IA generativa a dashboards para o mercado financeiro.",
      "t59": "Sistemas e Engenharia",
      "t60": "Base em controle e automação, óptica e software nativo para sistemas aeroportuários.",
      "t61": "Parcerias e Execução",
      "t62": "Liderança técnica junto a grandes parceiros de mídia e condução de iniciativas de ponta a ponta.",
      "t63": "Gestão Técnica",
      "t64": "Próximo passo",
      "t65": "Mestrado (MSc) em Integrated Machine Learning Systems",
      "t66": "Especialização em Engenharia de Software",
      "t67": "Graduação em Engenharia Óptica",
      "t68": "Institut d'Optique · França <span class=\"muted\">— bolsista do Ciência sem Fronteiras</span>",
      "t69": "Graduação em Engenharia de Controle e Automação",
      "t70": "Universidade Tecnológica Federal do Paraná (UTFPR) <span class=\"muted\">— melhor aluno da turma de 2016</span>",
      "t71": "🏆 Prêmios e reconhecimentos",
      "t72": "Melhor aluno da turma de Engenharia de Controle e Automação (2016)",
      "t73": "Bolsista integral do programa Ciência sem Fronteiras",
      "t74": "1º lugar (Grupo A) — 32º Concurso de Oratória em Japonês do Paraná <span class=\"muted\">(パラナ・スピーチ・コンテスト)</span>",
      "t75": "3º lugar — Startup Weekend Education Curitiba",
      "t76": "2º lugar — Hackathon Copel",
      "t77": "📜 Certificações",
      "t78": "Português",
      "t79": "Nativo",
      "t80": "Inglês",
      "t81": "Fluente · CPE",
      "t82": "Francês",
      "t83": "Fluente · DALF C2",
      "t84": "Espanhol",
      "t85": "Fluente",
      "t86": "Japonês",
      "t87": "Intermediário · estudando",
      "t88": "Italiano",
      "t89": "Básico",
      "t90": "Polonês",
      "t91": "Vamos construir algo <span class=\"gradient-text\">inteligente</span>.",
      "t92": "Seja para falar de IA, produto ou bater um papo em qualquer um dos sete idiomas — é só me escrever.",
      "contact_mailto": "mailto:oi@matheuswisniewski.com",
      "contact_email": "oi@matheuswisniewski.com",
      "t93": "Conectar no LinkedIn",
      "t94": "Londres, Reino Unido",
      "lab_nav": "Lab",
      "lab_title": "Laboratório de Evals",
      "lab_lead": "Explore como pipelines de <strong>LLM-as-a-judge</strong> guiam o <em>hill climbing</em> da geração de apps em uma superfície 3D de qualidade — barrando regressões até atingir builds prontos para produção, ao lado de artigos diários de IA.",
      "lab_prompt_aria": "Selecionar suíte de avaliação",
      "lab_p_studio": "Vibe UI · Angular",
      "lab_p_fullstack": "Full-Stack · Kotlin",
      "lab_p_optics": "Óptica · Canvas",
      "lab_p_polyglot": "7 Idiomas",
      "lab_reset": "Reiniciar",
      "lab_canvas_aria": "Superfície 3D interativa de hill climbing de evals. Use as setas esquerda e direita para inspecionar builds candidatos e Enter ou Espaço para avaliar o candidato focado.",
      "lab_hint": "Arraste para girar · Clique em um marcador 3D (ou card abaixo) para ver o veredito do juiz LLM",
      "lab_bars_aria": "Iterações candidatas do pipeline",
      "lab_leg_samp": "Build ativo",
      "lab_leg_nuc": "Aprovado (≥ τ)",
      "lab_leg_prune": "Barrado (< τ)",
      "lab_kpi_ent": "Nota do Juiz",
      "lab_kpi_nuc": "Ganho vs v0",
      "lab_kpi_top1": "Acima do corte",
      "lab_sample": "Subir +1 passo",
      "lab_ctrl_title": "Rubrica LLM-as-a-Judge",
      "lab_presets_aria": "Perfis de avaliação",
      "lab_pre_bal": "Equilibrado",
      "lab_pre_ux": "Foco em UX",
      "lab_pre_strict": "Rigor Técnico",
      "lab_c_func": "Compilação e Lógica (w₁)",
      "lab_c_ux": "UI, Design e A11y (w₂)",
      "lab_c_gate": "Corte de Aprovação (τ)",
      "lab_feed_title": "Artigos de IA em Alta",
      "lab_refresh_aria": "Atualizar artigos diários de IA",
      "lab_feed_sub": "Preprints curados diariamente no arXiv via Hugging Face Papers",
      "lab_feed_link": "HF Daily Papers ↗",
      "a1": "Voltar ao topo",
      "a2": "Alternar menu",
      "a3": "Rolar para baixo",
      "a4": "Foto de Matheus Wisniewski",
      "a5": "Organizações onde trabalhei e estudei"
  };

  const META = {
    en: {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || "",
      ogTitle: document.querySelector('meta[property="og:title"]')?.content || "",
      ogDescription: document.querySelector('meta[property="og:description"]')?.content || "",
      htmlLang: "en",
    },
    pt: {
      title: "Matheus Wisniewski — Engenheiro de Software @ Google DeepMind",
      description: "Matheus Wisniewski — Engenheiro de Software Full Stack no Google DeepMind, criando interfaces de IA de ponta, como o Google AI Studio. Desenvolvendo o AI Studio Build (ai.dev/build) e pipelines de evals com LLM-as-a-judge.",
      ogTitle: "Matheus Wisniewski — Engenheiro de Software @ Google DeepMind",
      ogDescription: "Criando as interfaces onde pessoas e IA de ponta se encontram.",
      htmlLang: "pt-BR",
    },
  };

  // Dynamic strings consumed by script.js
  const DYN = {
    en: {
      typed: [
        "Building Google AI Studio Build (ai.dev/build)",
        "Hill-climbing app quality via LLM-as-a-judge",
        "Angular · TypeScript · Kotlin · Python",
        "MSc Integrated ML Systems @ UCL (2026)",
        "7 languages spoken — currently learning 日本語",
      ],
      switchLabel: "Switch to Portuguese",
    },
    pt: {
      typed: [
        "Construindo o AI Studio Build (ai.dev/build)",
        "Evals com LLM-as-a-judge e hill climbing",
        "Angular · TypeScript · Kotlin · Python",
        "Mestrado em Integrated ML Systems @ UCL (2026)",
        "Falo 7 idiomas — estudando 日本語",
      ],
      switchLabel: "Mudar para inglês",
    },
  };

  const MONTHS = { Jan: "Jan", Feb: "Fev", Mar: "Mar", Apr: "Abr", May: "Mai", Jun: "Jun", Jul: "Jul", Aug: "Ago", Sep: "Set", Oct: "Out", Nov: "Nov", Dec: "Dez" };

  const BR_TIMEZONES = [
    "America/Sao_Paulo", "America/Bahia", "America/Fortaleza", "America/Recife", "America/Maceio",
    "America/Belem", "America/Araguaina", "America/Santarem", "America/Manaus", "America/Cuiaba",
    "America/Campo_Grande", "America/Porto_Velho", "America/Boa_Vista", "America/Rio_Branco",
    "America/Eirunepe", "America/Noronha",
  ];
  const ptDate = (s) => s.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (m) => MONTHS[m]).replace("Present", "Atual");

  // Snapshot English originals once
  const textEls = [...document.querySelectorAll("[data-i18n]")].map((el) => ({ el, en: el.innerHTML, key: el.dataset.i18n }));
  const attrEls = [...document.querySelectorAll("[data-i18n-attr]")].flatMap((el) =>
    el.dataset.i18nAttr.split(";").filter(Boolean).map((pair) => {
      const [attr, key] = pair.split(":");
      return { el, attr, key, en: el.getAttribute(attr) };
    })
  );
  const dateEls = [...document.querySelectorAll(".date")].map((el) => ({ el, en: el.textContent }));
  const logoAlts = [...document.querySelectorAll('img[alt$=" logo"]')].map((el) => ({ el, en: el.alt }));
  const descMeta = document.querySelector('meta[name="description"]');
  const ogTitleMeta = document.querySelector('meta[property="og:title"]');
  const ogDescMeta = document.querySelector('meta[property="og:description"]');

  function getInitial() {
    if (window.__LANG__ === "pt" || window.__LANG__ === "en") return window.__LANG__;
    const q = (new URLSearchParams(location.search).get("lang") || "").toLowerCase().slice(0, 2);
    if (q === "pt" || q === "en") return q;
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "pt" || saved === "en") return saved;
    } catch {}
    return looksBrazilian() ? "pt" : "en";
  }

  // Auto-detect (no network calls): Portuguese browser language, or a Brazilian timezone.
  function looksBrazilian() {
    const primary = ((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase();
    if (primary.startsWith("pt")) return true;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      return BR_TIMEZONES.includes(tz);
    } catch { return false; }
  }

  let current = "en";

  function apply(lang, { persist = false } = {}) {
    current = lang;
    const pt = lang === "pt";
    textEls.forEach(({ el, en, key }) => { el.innerHTML = pt && PT[key] ? PT[key] : en; });
    attrEls.forEach(({ el, attr, key, en }) => el.setAttribute(attr, pt && PT[key] ? PT[key] : en));
    dateEls.forEach(({ el, en }) => { el.textContent = pt ? ptDate(en) : en; });
    logoAlts.forEach(({ el, en }) => { el.alt = pt ? "Logotipo: " + en.replace(/ logo$/, "") : en; });

    document.documentElement.lang = META[lang].htmlLang;
    document.title = META[lang].title;
    if (descMeta) descMeta.content = META[lang].description;
    if (ogTitleMeta) ogTitleMeta.content = META[lang].ogTitle;
    if (ogDescMeta) ogDescMeta.content = META[lang].ogDescription;

    document.querySelectorAll(".lang-switch").forEach((btn) => {
      btn.setAttribute("aria-label", DYN[lang].switchLabel);
      btn.querySelectorAll("[data-lang]").forEach((s) => s.classList.toggle("is-active", s.dataset.lang === lang));
    });

    if (persist) { try { localStorage.setItem("lang", lang); } catch {} }
    window.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  window.I18N = {
    get lang() { return current; },
    t: (name) => DYN[current][name],
    set: (lang) => apply(lang, { persist: true }),
  };

  document.querySelectorAll(".lang-switch").forEach((btn) =>
    btn.addEventListener("click", () => {
      const next = current === "pt" ? "en" : "pt";
      apply(next, { persist: true });
      const url = new URL(location.href);
      if (url.searchParams.has("lang")) { url.searchParams.set("lang", next); history.replaceState(null, "", url); }
    })
  );

  apply(getInitial());
  document.documentElement.classList.remove("i18n-pending");
})();
