// Controles do leitor: barras que somem ao rolar, linha de progresso, menu
// lateral de títulos, painéis (folha de baixo no celular, coluna à esquerda
// acima de 40rem), Aa (abas Texto/Layout/Tema, prévia, − e +, predefinidos),
// marcações (destaque, sublinhado, nota, arquivo) com a pílula junto do
// trecho, marcadores, compartilhar, busca, exportar/importar, balão das notas,
// posição de leitura e setas do teclado para trocar de capítulo.
// Ajustes, marcações e marcadores ficam no localStorage; arquivos no IndexedDB.
// A página traz em <body>: data-pagina (capNN, apX, prefacio, index),
// data-livro, data-obra, data-citacao, data-rotulo e data-titulo (html.py).
(function () {
  'use strict';
  var raiz = document.documentElement, dados = document.body.dataset;
  var PAGINA = dados.pagina || 'pagina', CAPA = PAGINA === 'index';
  var LIVRO = dados.livro || 'livro', OBRA = dados.obra || document.title;
  var FONTE_CITACAO = dados.citacao || OBRA;
  var ROTULO = dados.rotulo || '', TITULO = dados.titulo || OBRA; // ex.: "Capítulo 3", "Variáveis Aleatórias"
  var PALAVRA = (ROTULO.split(' ')[0] || 'texto').toLowerCase(); // capítulo, apêndice, prefácio
  var corpo = document.querySelector('.corpo');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var toque = matchMedia('(pointer: coarse)');

  function ler(k, p) { try { var v = localStorage.getItem(k); return v == null ? p : JSON.parse(v); } catch (e) { return p; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { aviso('O navegador não deixou salvar'); return false; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function novoId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  var ICO = {
    voltar: '<path d="M15 5l-7 7 7 7"/>', aa: '<path d="M3 18l5-12 5 12M4.6 14h6.8M14 18l3.5-8.5L21 18M15.2 15.3h4.6"/>',
    busca: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>', marca: '<path d="M7 3h10v18l-5-4-5 4z"/>',
    sumario: '<path d="M4 6h16M4 12h16M4 18h10"/>', notas: '<path d="M5 4h14v16H5z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>', nota: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
    clipe: '<path d="M20 11.5l-8.2 8.2a5 5 0 01-7.1-7.1l8.6-8.6a3.4 3.4 0 014.8 4.8l-8.6 8.6a1.7 1.7 0 01-2.4-2.4l7.9-7.9"/>',
    copiar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    compartilhar: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>',
    lixo: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
    mais: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    baixar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', subir: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
    zap: '<path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/>'
  };
  function ico(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[n] + '</svg>'; }

  // ---------- avisos ----------
  var tAviso = 0;
  function aviso(txt) {
    var t = $('.cr-toast') || document.body.appendChild(el('<div class="cr-toast" role="status"></div>'));
    t.textContent = txt; t.hidden = false;
    clearTimeout(tAviso); tAviso = setTimeout(function () { t.hidden = true; }, 2600);
  }

  // ---------- arquivos no IndexedDB ----------
  var arquivos = (function () {
    var conexao = null;
    function abrir() {
      if (!conexao) conexao = new Promise(function (ok, erro) {
        try {
          var r = indexedDB.open('leitor-arquivos', 1);
          r.onupgradeneeded = function () { r.result.createObjectStore('arquivos', { keyPath: 'id' }); };
          r.onsuccess = function () { ok(r.result); };
          r.onerror = function () { erro(r.error); };
        } catch (e) { erro(e); }
      });
      return conexao;
    }
    function op(modo, fn) {
      return abrir().then(function (db) {
        return new Promise(function (ok, erro) {
          var tx = db.transaction('arquivos', modo), r = fn(tx.objectStore('arquivos'));
          tx.oncomplete = function () { ok(r && r.result); };
          tx.onerror = function () { erro(tx.error); };
        });
      });
    }
    return {
      por: function (o) { return op('readwrite', function (s) { return s.put(o); }); },
      pegar: function (id) { return op('readonly', function (s) { return s.get(id); }); },
      tirar: function (id) { return op('readwrite', function (s) { return s.delete(id); }); },
      todos: function () { return op('readonly', function (s) { return s.getAll(); }); }
    };
  })();
  function pedirPersistencia() { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {} }

  // ---------- ajustes de leitura ----------
  var AJUSTES = [
    { k: 'escala', nome: 'Tamanho da letra', min: .8, max: 1.6, passo: .05, padrao: 1, css: '--escala', fmt: function (v) { return Math.round(v * 100) + '%'; } },
    { k: 'entrelinha', nome: 'Espaço entre linhas', min: 1.3, max: 2.3, passo: .05, padrao: 1.7, css: '--entrelinha', fmt: function (v) { return v.toFixed(2).replace('.', ','); } },
    { k: 'letra', nome: 'Espaço entre letras', min: 0, max: .12, passo: .01, padrao: 0, css: '--esp-letra', un: 'em', fmt: function (v) { return v ? '+' + Math.round(v * 100) + '%' : 'Normal'; } },
    { k: 'palavra', nome: 'Espaço entre palavras', min: 0, max: .5, passo: .05, padrao: 0, css: '--esp-palavra', un: 'em', fmt: function (v) { return v ? '+' + Math.round(v * 100) + '%' : 'Normal'; } },
    { k: 'margem', nome: 'Margens', min: 0, max: 4, passo: 1, padrao: 1, css: '--margem', fmt: function (v) { return ['Mínimas', 'Estreitas', 'Médias', 'Largas', 'Máximas'][v]; } }
  ];
  var PREDEF = {
    compacto: { entrelinha: 1.45, letra: 0, palavra: 0, margem: 0 },
    padrao: { entrelinha: 1.7, letra: 0, palavra: 0, margem: 1 },
    arejado: { entrelinha: 2, letra: .03, palavra: .15, margem: 3 }
  };
  var CHAVE_AJ = 'leitor-ajustes';
  var aj = ler(CHAVE_AJ, null) || migrar(ler('leitor-config', null)) || {};
  // o leitor anterior guardava estilo, tema, letra, entrelinha, largura e notas-termos
  function migrar(v) {
    if (!v || typeof v !== 'object') return null;
    var n = {};
    if (v.tema === 'claro') n.tema = 'original'; else if (v.tema === 'escuro') n.tema = 'noite';
    if ({ p: 1, g: 1, gg: 1 }[v.letra]) n.escala = { p: .9, g: 1.1, gg: 1.2 }[v.letra];
    if ({ compacta: 1, arejada: 1 }[v.entrelinha]) n.entrelinha = { compacta: 1.5, arejada: 1.9 }[v.entrelinha];
    if ({ estreita: 1, larga: 1 }[v.largura]) n.margem = { estreita: 3, larga: 0 }[v.largura];
    if ({ livro: 1, classico: 1, legivel: 1 }[v.estilo]) n.fonte = { livro: 'source', classico: 'crimson', legivel: 'atkinson' }[v.estilo];
    if (v['notas-termos'] === 'nao') n.termos = 'nao';
    return n;
  }
  function valor(a) { var v = aj[a.k]; return typeof v === 'number' ? v : a.padrao; }
  function aplicarAjustes() {
    AJUSTES.forEach(function (a) { raiz.style.setProperty(a.css, valor(a) + (a.un || '')); });
    ['tema', 'fonte', 'justificar'].forEach(function (k) { if (aj[k] && aj[k] !== 'auto' && aj[k] !== 'literata' && aj[k] !== 'nao') raiz.dataset[k] = aj[k]; else delete raiz.dataset[k]; });
    if (aj.termos === 'nao') raiz.dataset.notasTermos = 'nao'; else delete raiz.dataset.notasTermos;
    gravar(CHAVE_AJ, aj);
    if (typeof agendarLargas === 'function') agendarLargas();
  }
  aplicarAjustes();

  // ---------- texto da página como uma string só ----------
  // Cada fórmula entra como ⟦TeX⟧. Marcações guardam o trecho, 32 caracteres
  // antes e depois e a seção; ao abrir, são achadas de novo nessa string.
  var texDe = new WeakMap();
  function mapearTex() {
    try { for (var it of MathJax.startup.document.math) if (it.typesetRoot) texDe.set(it.typesetRoot, it.math); } catch (e) {}
  }
  var IGNORAR = 'script, style, .nota-ref, .cr-nota, mjx-assistive-mml, .notas, .paginacao';
  var indice = null;
  function indexar() {
    var itens = [], pos = 0, partes = [];
    (function rec(n) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { itens.push({ no: c, ini: pos, fim: pos + c.nodeValue.length }); partes.push(c.nodeValue); pos += c.nodeValue.length; }
        else if (c.nodeType === 1) {
          if (c.matches('mjx-container')) { var t = '⟦' + (texDe.get(c) || c.textContent) + '⟧'; itens.push({ no: c, ini: pos, fim: pos + t.length, m: true }); partes.push(t); pos += t.length; }
          else if (!c.matches(IGNORAR)) rec(c);
        }
      }
    })(corpo);
    var bruto = partes.join(''), s = '', mapa = [], espaco = true;
    // versão com espaços colapsados: mapa[i] = posição no texto bruto
    for (var i = 0; i < bruto.length; i++) {
      var ch = bruto[i];
      if (/\s/.test(ch)) { if (!espaco) { s += ' '; mapa.push(i); espaco = true; } }
      else { s += ch; mapa.push(i); espaco = false; }
    }
    mapa.push(bruto.length);
    var porNo = new Map(); itens.forEach(function (x) { porNo.set(x.no, x); });
    indice = { itens: itens, bruto: bruto, s: s, mapa: mapa, porNo: porNo }; sujo = false;
    return indice;
  }
  // o MathJax preguiçoso (ui/lazy) troca cada mjx-container por outro ao
  // desenhar a fórmula: o índice fica apontando para nós soltos. Marca como
  // sujo e refaz na próxima consulta (as posições não mudam: a fórmula vira o
  // mesmo ⟦TeX⟧ antes e depois de desenhada).
  var sujo = false;
  function idx() { if (sujo || !indice) { mapearTex(); indexar(); } return indice; }
  var tReparar = 0;
  new MutationObserver(function (ms) {
    var mexeu = false;
    ms.forEach(function (m) {
      [].forEach.call(m.addedNodes, function (n) { if (ehFormula(n)) { mexeu = true; novasFormulas.push(n); } });
      if (!mexeu) mexeu = [].some.call(m.removedNodes, ehFormula);
    });
    if (!mexeu) return;
    sujo = true; clearTimeout(tReparar); tReparar = setTimeout(reparar, 400);
    if (novasFormulas.length && !quadroLargas) quadroLargas = requestAnimationFrame(function () { quadroLargas = 0; var l = novasFormulas; novasFormulas = []; l.forEach(conferirLarga); });
  }).observe(corpo, { childList: true, subtree: true });
  function ehFormula(n) { return n.nodeName === 'MJX-CONTAINER'; }
  // No meio de um redesenho (e enquanto espera uma fonte) o MathJax deixa cada
  // fórmula como um texto vazio: índice feito nessa hora perde o ⟦TeX⟧.
  // Esta promessa só resolve com ele parado.
  function mathJaxParado() {
    var d = window.MathJax && MathJax.startup && MathJax.startup.document;
    if (!d || !d.lazyPromise) return Promise.resolve();
    var p = d.lazyPromise;
    return p.then(function () {
      if (d.lazyPromise !== p) return mathJaxParado();
      if (d.lazyIdle) return new Promise(function (ok) { setTimeout(ok, 50); }).then(mathJaxParado);
    });
  }
  // fórmula em linha que o MathJax não consegue quebrar e passa da coluna
  // ganha .larga (rola de lado sozinha, com sombra, como as em destaque)
  // (antes do próximo quadro: as novas, quando o MathJax desenha; todas, ao mudar ajustes ou a janela)
  var tLargas = 0, novasFormulas = [], quadroLargas = 0;
  function agendarLargas() { if (!tLargas) tLargas = requestAnimationFrame(function () { tLargas = 0; $$('.corpo mjx-container').forEach(conferirLarga); }); }
  function conferirLarga(c) {
    if (!c.isConnected || c.getAttribute('display') === 'true') return;
    // quebrada em linhas pelo MathJax, são vários svg: vale o pedaço mais largo
    var w = 0; [].forEach.call(c.children, function (s) { if (s.tagName.toLowerCase() === 'svg') w = Math.max(w, s.getBoundingClientRect().width); });
    if (w < 120) { c.classList.remove('larga'); return; }
    if (c.closest('.eq, .tbl')) return;
    var b = c.parentElement.closest('p, li, dd, td, th, figcaption, div, .corpo'), cs = getComputedStyle(b);
    c.classList.toggle('larga', w > b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) + 1);
  }
  addEventListener('resize', agendarLargas);
  // Levar a um trecho: as fórmulas que entram na tela são desenhadas depois do
  // salto e empurram o texto; quando o MathJax para, mira de novo (a não ser
  // que o leitor já tenha rolado por conta própria).
  function levarAte(alvo, bloco, ajuste) {
    var t0 = performance.now(), voltas = 0;
    function ir() { alvo.scrollIntoView({ block: bloco || 'center' }); if (ajuste) scrollBy(0, ajuste); return alvo.getBoundingClientRect().top; }
    var topo = ir();
    (function conferir() {
      setTimeout(function () {
        mathJaxParado().then(function () {
          if (ultimaEntrada > t0 || !alvo.isConnected) return;
          if (Math.abs(alvo.getBoundingClientRect().top - topo) > 4 && voltas++ < 4) { topo = ir(); conferir(); }
        });
      }, 120);
    })();
  }
  // marcações que não foram achadas porque o MathJax estava no meio do caminho
  function reparar() {
    if (!revelado || !doCap(todas).some(function (a) { return a.perdida; }) && doCap(marcadores).every(function (m) { return $('[data-marcador="' + m.id + '"]'); })) return;
    mathJaxParado().then(function () { doCap(todas).forEach(function (a) { if (a.perdida) desenhar(a); }); desenharMarcadores(); });
  }
  function normPos(bruta) { // posição bruta → posição no texto colapsado
    var m = indice.mapa, lo = 0, hi = m.length - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (m[mid] < bruta) lo = mid + 1; else hi = mid; }
    return lo;
  }
  function posDoPonto(no, off, fim) {
    idx();
    var e = no.nodeType === 1 ? no : no.parentNode;
    var m = e && e.closest && e.closest('mjx-container');
    if (m && indice.porNo.get(m)) { var x = indice.porNo.get(m); return fim ? x.fim : x.ini; }
    if (no.nodeType === 3 && indice.porNo.get(no)) return indice.porNo.get(no).ini + off;
    // ponto entre elementos: primeiro item depois dele
    var r = document.createRange(); r.setStart(no, off); r.collapse(true);
    for (var i = 0; i < indice.itens.length; i++) {
      var it = indice.itens[i];
      if (r.comparePoint(it.no, 0) >= 0) return it.ini;
    }
    return indice.bruto.length;
  }
  function secaoDe(no) {
    var e = no.nodeType === 1 ? no : no.parentNode, achada = null;
    $$('.corpo h2[id], .corpo h3[id]').some(function (h) { if (h.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) { achada = h; return false; } return true; });
    return achada ? achada.id : '';
  }
  function tituloSecao(id) { var h = id && document.getElementById(id); if (!h) return ROTULO || TITULO; var n = $('.n', h), t = $('.t', h); return (n ? n.textContent + ' ' : '') + (t ? t.textContent : ''); }
  // acha o trecho de novo: dentro da seção primeiro, desempatando pelo contexto
  function localizar(a) {
    var s = idx().s, cands = [], i = -1;
    while ((i = s.indexOf(a.citacao, i + 1)) !== -1) cands.push(i);
    if (!cands.length) return null;
    var h = a.secao && document.getElementById(a.secao), iniSec = -1;
    if (h) { var primeiro = indice.itens.find(function (x) { return h.compareDocumentPosition(x.no) & Node.DOCUMENT_POSITION_FOLLOWING; }); if (primeiro) iniSec = normPos(primeiro.ini); }
    function nota(p) {
      var antes = s.slice(Math.max(0, p - a.antes.length), p), depois = s.slice(p + a.citacao.length, p + a.citacao.length + a.depois.length), pts = 0;
      for (var k = 1; k <= antes.length && antes[antes.length - k] === a.antes[a.antes.length - k]; k++) pts++;
      for (k = 0; k < depois.length && depois[k] === a.depois[k]; k++) pts++;
      return pts + (iniSec >= 0 && p >= iniSec ? 5 : 0);
    }
    cands.sort(function (x, y) { return nota(y) - nota(x); });
    var p = cands[0];
    return [indice.mapa[p], indice.mapa[p + a.citacao.length - 1] + 1];
  }
  function trechoDe(ini, fim) {
    idx(); var a = normPos(ini), b = normPos(fim);
    var s = indice.s, cit = s.slice(a, b).trim();
    a = s.indexOf(cit, a);
    return { citacao: cit, antes: s.slice(Math.max(0, a - 32), a), depois: s.slice(a + cit.length, a + cit.length + 32) };
  }

  // TeX → texto legível para compartilhar e listar (o comum em probabilidade)
  var SIMB = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ', nu: 'ν', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Sigma: 'Σ', Phi: 'Φ', Omega: 'Ω', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', sim: '∼', in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', cup: '∪', cap: '∩', infty: '∞', to: '→', rightarrow: '→', mid: '|', times: '×', cdot: '·', cdots: '⋯', ldots: '…', dots: '…', pm: '±', sum: '∑', prod: '∏', int: '∫', partial: '∂', sqrt: '√', perp: '⊥', mathbb: '', mathrm: '', mathbf: '', boldsymbol: '', negrito: '', operatorname: '', text: '', textrm: '', left: '', right: '', bigl: '', bigr: '', Bigl: '', Bigr: '', quad: ' ', qquad: '  ', displaystyle: '', Var: 'Var', Cov: 'Cov', Corr: 'Corr', Sd: 'Sd', exp: 'exp', log: 'log', ln: 'ln', max: 'max', min: 'min' };
  var SOBRE = '⁰¹²³⁴⁵⁶⁷⁸⁹', SOB = '₀₁₂₃₄₅₆₇₈₉';
  function texParaTexto(t) {
    var r = t
      .replace(/\\(?:hat|widehat)\{([^{}]*)\}/g, '$1̂').replace(/\\(?:bar|overline)\{([^{}]*)\}/g, '$1̄').replace(/\\(?:tilde)\{([^{}]*)\}/g, '$1̃')
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
      .replace(/\\([A-Za-z]+)/g, function (m, n) { return n in SIMB ? SIMB[n] : n; })
      .replace(/\\[,;:!]/g, ' ').replace(/\\\{/g, '{').replace(/\\\}/g, '}')
      .replace(/\^\{?(\d)\}?/g, function (m, d) { return SOBRE[d]; }).replace(/_\{?(\d)\}?/g, function (m, d) { return SOB[d]; })
      .replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/_\{([^{}]*)\}/g, '_$1')
      .replace(/[{}]/g, '').replace(/~/g, ' ').replace(/\s+/g, ' ').trim();
    return r;
  }
  function legivel(s) { return s.replace(/⟦([^⟧]*)⟧/g, function (m, t) { return texParaTexto(t); }); }

  // ---------- marcações ----------
  var CHAVE_M = 'leitor-marcacoes', CHAVE_B = 'leitor-marcadores';
  var todas = ler(CHAVE_M, []), marcadores = ler(CHAVE_B, []);
  function doCap(l) { return l.filter(function (a) { return a.pagina === PAGINA && (a.livro || LIVRO) === LIVRO; }); }
  function salvarMarcacoes() { gravar(CHAVE_M, todas); }
  function envolver(ini, fim, a) {
    var alvo = idx().itens.filter(function (x) { return x.fim > ini && x.ini < fim; }), marcas = [];
    alvo.forEach(function (x) {
      var m = document.createElement('mark');
      m.className = 'hl ' + a.cor; m.dataset.id = a.id;
      if (x.m) { x.no.parentNode.insertBefore(m, x.no); m.appendChild(x.no); }
      else {
        var n = x.no, i0 = Math.max(0, ini - x.ini), i1 = Math.min(n.nodeValue.length, fim - x.ini);
        if (i1 <= i0 || !n.nodeValue.slice(i0, i1).trim()) return;
        if (i1 < n.nodeValue.length) n.splitText(i1);
        if (i0 > 0) n = n.splitText(i0);
        n.parentNode.insertBefore(m, n); m.appendChild(n);
      }
      marcas.push(m);
    });
    indexar();
    return marcas;
  }
  function desenhar(a) {
    var faixa = localizar(a);
    if (!faixa) { a.perdida = true; return false; }
    a.perdida = false;
    envolver(faixa[0], faixa[1], a);
    pinoNota(a);
    return true;
  }
  function apagarDesenho(id) {
    $$('mark.hl[data-id="' + id + '"]').forEach(function (m) { var p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); m.remove(); p.normalize(); });
    $$('.cr-nota[data-id="' + id + '"]').forEach(function (x) { x.remove(); });
    indexar();
  }
  function pinoNota(a) {
    $$('.cr-nota[data-id="' + a.id + '"]').forEach(function (x) { x.remove(); });
    var ms = $$('mark.hl[data-id="' + a.id + '"]');
    if (!ms.length || !(a.nota || (a.arquivos && a.arquivos.length))) return;
    var b = el('<button type="button" class="cr-nota" aria-label="Ver nota"></button>');
    b.dataset.id = a.id; b.textContent = a.nota ? '✎' : '⎘';
    ms[ms.length - 1].after(b);
    indexar();
  }
  function criar(range, cor) {
    var ini = posDoPonto(range.startContainer, range.startOffset, false), fim = posDoPonto(range.endContainer, range.endOffset, true);
    if (fim <= ini) return null;
    var t = trechoDe(ini, fim);
    if (!t.citacao) return null;
    var a = { id: novoId(), livro: LIVRO, pagina: PAGINA, secao: secaoDe(range.startContainer), citacao: t.citacao, antes: t.antes, depois: t.depois, cor: cor || 'amarelo', nota: '', arquivos: [], criada: new Date().toISOString() };
    todas.push(a); salvarMarcacoes();
    desenhar(a);
    return a;
  }
  function porId(id) { return todas.find(function (a) { return a.id === id; }); }
  function removerMarcacao(a) {
    (a.arquivos || []).forEach(function (f) { arquivos.tirar(f.id).catch(function () {}); });
    todas = todas.filter(function (x) { return x !== a; }); salvarMarcacoes();
    apagarDesenho(a.id);
  }
  function mudarCor(a, cor) { a.cor = cor; salvarMarcacoes(); $$('mark.hl[data-id="' + a.id + '"]').forEach(function (m) { m.className = 'hl ' + cor; }); }

  // ---------- marcadores de página ----------
  var BLOCOS = '.corpo > p, .corpo > .eq, .corpo > div, .corpo > ul, .corpo > ol, .corpo > h2, .corpo > h3, .corpo > h4';
  function blocoNoTopo() {
    var lim = barrasVisiveis ? $('.cr-topo').getBoundingClientRect().bottom : 0;
    return $$(BLOCOS).find(function (b) { var r = b.getBoundingClientRect(); return r.bottom > lim + 8 && r.height > 0; });
  }
  function blocoDe(m) {
    var f = localizar(m); if (!f) return null;
    var it = indice.itens.find(function (x) { return x.fim > f[0]; });
    var e = it && (it.no.nodeType === 1 ? it.no : it.no.parentNode);
    return e && $$(BLOCOS).find(function (b) { return b.contains(e); });
  }
  function desenharMarcadores() {
    $$('[data-marcador]').forEach(function (b) { delete b.dataset.marcador; });
    doCap(marcadores).forEach(function (m) { var b = blocoDe(m); if (b) b.dataset.marcador = m.id; });
    atualizarFita();
  }
  function marcadorVisivel() {
    var topo = $('.cr-topo').getBoundingClientRect().bottom;
    return doCap(marcadores).find(function (m) { var b = $('[data-marcador="' + m.id + '"]'); if (!b) return false; var r = b.getBoundingClientRect(); return r.bottom > topo && r.top < innerHeight; });
  }
  function atualizarFita() { var b = $('[data-acao="marcador"]'); if (b) b.setAttribute('aria-pressed', marcadorVisivel() ? 'true' : 'false'); }
  function alternarMarcador() {
    var m = marcadorVisivel();
    if (m) { marcadores = marcadores.filter(function (x) { return x !== m; }); gravar(CHAVE_B, marcadores); desenharMarcadores(); aviso('Marcador removido'); return; }
    var b = blocoNoTopo(); if (!b) return;
    var ini = idx().itens.find(function (x) { return b.contains(x.no) && (x.m || x.no.nodeValue.trim()); });
    if (!ini) return;
    var t = trechoDe(ini.ini, ini.ini + 60);
    var novo = { id: novoId(), livro: LIVRO, pagina: PAGINA, secao: secaoDe(b), citacao: t.citacao, antes: t.antes, depois: t.depois, fracao: fracao(), criado: new Date().toISOString() };
    marcadores.push(novo); gravar(CHAVE_B, marcadores); desenharMarcadores();
    aviso('Página marcada');
  }

  // ---------- barras e progresso ----------
  var barrasVisiveis = true;
  function mostrarBarras(v) { barrasVisiveis = v; raiz.classList.toggle('oculto', !v); }
  function fracao() { var alto = document.documentElement.scrollHeight - innerHeight; return alto > 0 ? Math.min(1, Math.max(0, scrollY / alto)) : 0; }
  var palavrasTotal = 0;
  function infoProgresso() {
    var f = fracao(), pct = Math.round(f * 100), resta = Math.max(1, Math.round(palavrasTotal * (1 - f) / 130));
    var info = $('.cr-base .info'); if (info) info.textContent = pct + '% · ' + (f > .995 ? 'fim do ' + PALAVRA : resta + ' min restantes');
    $('.cr-linha').style.width = (f * 100) + '%';
    var atual = null;
    $$('.corpo h2[id], .corpo h3[id]').some(function (h) { if (h.getBoundingClientRect().top < 140) { atual = h; return false; } return true; });
    $('.cr-topo .sec').textContent = atual ? tituloSecao(atual.id) : TITULO;
    marcarNoMenu(atual && atual.id);
    if (!CAPA) try { localStorage.setItem('leitor-pos-' + PAGINA, String(f)); } catch (e) {}
    atualizarFita();
  }
  // menu lateral (desktop): marca a seção atual e a mantém à vista dentro do menu
  var menuLateral = $('#sumario'), atualNoMenu;
  function marcarNoMenu(id) {
    if (!menuLateral || id === atualNoMenu) return;
    atualNoMenu = id;
    var achado = null;
    $$('a', menuLateral).forEach(function (a) { var e = a.getAttribute('href') === '#' + id; a.classList.toggle('atual', e); if (e) { achado = a; a.setAttribute('aria-current', 'location'); } else a.removeAttribute('aria-current'); });
    if (!achado || getComputedStyle(menuLateral).display === 'none') return; // fixo: offsetParent é sempre null
    var m = menuLateral.getBoundingClientRect(), r = achado.getBoundingClientRect();
    if (r.top < m.top + 8) menuLateral.scrollTop -= m.top + 8 - r.top + m.height / 3;
    else if (r.bottom > m.bottom - 8) menuLateral.scrollTop += r.bottom - m.bottom + 8 + m.height / 3;
  }
  var ultimoY = scrollY, agendado = false;
  // fórmula desenhada mais alta ou mais baixa muda a altura do texto e o
  // navegador corrige a rolagem (scroll anchoring): isso não é o leitor rolando
  // (a rolagem corrigida chega antes do aviso do ResizeObserver: compara a
  // altura de agora com a última que ele informou)
  var ultimaEntrada = 0, ultimaMudanca = 0, altoVisto = corpo.offsetHeight;
  ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(function (t) { addEventListener(t, function () { ultimaEntrada = performance.now(); }, { passive: true, capture: true }); });
  if (window.ResizeObserver) new ResizeObserver(function () { ultimaMudanca = performance.now(); altoVisto = corpo.offsetHeight; }).observe(corpo);
  addEventListener('scroll', function () {
    if (agendado) return; agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      var agora = performance.now();
      if ((corpo.offsetHeight !== altoVisto || agora - ultimaMudanca < 60) && agora - ultimaEntrada > 500) { ultimoY = scrollY; infoProgresso(); return; }
      var dy = scrollY - ultimoY;
      if (!painelAberto && !menu) {
        if (dy > 12 && scrollY > 80) mostrarBarras(false);
        else if (dy < -24 || scrollY < 40 || innerHeight + scrollY >= document.documentElement.scrollHeight - 4) mostrarBarras(true);
      }
      if (Math.abs(dy) > 12) ultimoY = scrollY;
      infoProgresso();
    });
  }, { passive: true });
  // toque no texto mostra e esconde as barras (sem seleção, fora de links e marcações)
  var inicioToque = null;
  corpo.addEventListener('pointerdown', function (ev) { inicioToque = { x: ev.clientX, y: ev.clientY, t: Date.now() }; });
  corpo.addEventListener('pointerup', function (ev) {
    if (!inicioToque) return;
    var parado = Math.abs(ev.clientX - inicioToque.x) < 8 && Math.abs(ev.clientY - inicioToque.y) < 8 && Date.now() - inicioToque.t < 400;
    inicioToque = null;
    if (!parado || ev.target.closest('a, button, mark, input, .nota-ref, summary') || !getSelection().isCollapsed || painelAberto || menu) return;
    setTimeout(function () { if (getSelection().isCollapsed && !menu) mostrarBarras(!barrasVisiveis); }, 280);
  });

  // ---------- montagem das barras ----------
  var temSumario = !!$('#sumario a');
  var topo = el('<header class="cr cr-topo"><div class="linha">' +
    '<div class="esq">' + (CAPA ? '' : '<a class="bt" href="index.html" aria-label="Sumário do livro">' + ico('voltar') + '</a>') + '</div>' +
    '<div class="meio"><span class="cap"></span><span class="sec"></span></div>' +
    '<div class="dir"><button class="bt" type="button" data-acao="ajustes" aria-label="Aparência do texto" aria-haspopup="dialog">' + ico('aa') + '</button>' +
    (CAPA ? '' : '<button class="bt" type="button" data-acao="busca" aria-label="Buscar no ' + PALAVRA + '" aria-haspopup="dialog">' + ico('busca') + '</button>' +
    '<button class="bt" type="button" data-acao="marcador" aria-label="Marcar esta página" aria-pressed="false">' + ico('marca') + '</button>') + '</div></div></header>');
  $('.cap', topo).textContent = CAPA ? '' : ROTULO !== TITULO ? ROTULO : OBRA;
  $('.cap', topo).hidden = CAPA;
  $('.sec', topo).textContent = TITULO;
  var base = CAPA ? null : el('<footer class="cr cr-base"><div class="dentro">' +
    '<button class="bt rotulado" type="button" data-acao="sumario" aria-haspopup="dialog"' + (temSumario ? '' : ' hidden') + '>' + ico('sumario') + '<span>Sumário</span></button>' +
    '<span class="info" aria-live="off">0%</span>' +
    '<button class="bt rotulado" type="button" data-acao="marcacoes" aria-haspopup="dialog"><span>Marcações</span>' + ico('notas') + '</button></div></footer>');
  document.body.prepend(el('<div class="cr-linha" aria-hidden="true"></div>'), topo);
  if (base) document.body.appendChild(base); else raiz.classList.add('sem-base');
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-acao]'); if (!b || !b.closest('.cr-topo, .cr-base')) return;
    var acao = b.dataset.acao;
    if (acao === 'marcador') return alternarMarcador();
    if (painelAberto && painelAberto.dataset.nome === acao) return fecharPainel();
    ({ ajustes: abrirAjustes, busca: abrirBusca, sumario: abrirSumario, marcacoes: abrirMarcacoes })[acao](b);
  });

  // ---------- painel genérico: folha de baixo no celular, coluna à esquerda acima de 40rem ----------
  var painelAberto = null, fundo = null, voltarFoco = null;
  function abrirPainel(nome, titulo, conteudo, origem) {
    fecharPainel(); fecharMenu(true);
    voltarFoco = origem || document.activeElement;
    fundo = document.body.appendChild(el('<div class="cr-fundo"></div>'));
    fundo.addEventListener('click', fecharPainel);
    var p = el('<section class="cr cr-painel" role="dialog" aria-modal="true"><div class="cab"><h2></h2><button class="bt" type="button" data-fechar aria-label="Fechar">' + ico('fechar') + '</button></div><div class="rolar"></div></section>');
    p.dataset.nome = nome;
    if (nome === 'marcacoes' || nome === 'busca') { p.classList.add('leve'); fundo.classList.add('leve'); }
    $('h2', p).textContent = titulo; p.setAttribute('aria-label', titulo);
    $('.rolar', p).appendChild(conteudo);
    $('[data-fechar]', p).addEventListener('click', fecharPainel);
    document.body.appendChild(p);
    painelAberto = p; mostrarBarras(true); raiz.classList.add('com-painel');
    var foco = $('[data-foco]', p) || $('[data-fechar]', p);
    setTimeout(function () { foco.focus({ preventScroll: true }); }, 30);
    return p;
  }
  function fecharPainel() {
    if (!painelAberto) return;
    painelAberto.remove(); painelAberto = null; raiz.classList.remove('com-painel');
    if (fundo) { fundo.remove(); fundo = null; }
    if (voltarFoco && voltarFoco.focus) voltarFoco.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', function (ev) {
    if ((ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') && !painelAberto && !menu && !ev.altKey && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey && !/input|textarea|select/i.test(ev.target.tagName) && !ev.target.isContentEditable) {
      var alvo = $(ev.key === 'ArrowLeft' ? '.paginacao .ant' : '.paginacao .prox');
      if (alvo) location.href = alvo.href;
    }
    if (ev.key === 'Escape') { if (painelAberto) fecharPainel(); else if (menu) fecharMenu(); fecharBalao(); }
    if (ev.key === 'Tab' && painelAberto) { // foco preso no painel
      var f = $$('button, a[href], input, textarea, select', painelAberto).filter(function (x) { return x.offsetParent !== null && !x.disabled; });
      if (!f.length) return;
      if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
      else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
    }
  });

  // ---------- Aa: ajustes ----------
  function slider(a) {
    var v = valor(a), passos = Math.round((a.max - a.min) / a.passo);
    var html = '<div class="ajuste" data-k="' + a.k + '"><div class="topo"><label for="aj-' + a.k + '">' + a.nome + '</label><span class="valor"></span></div>';
    var inp = '<input class="slider" type="range" id="aj-' + a.k + '" min="' + a.min + '" max="' + a.max + '" step="' + a.passo + '" value="' + v + '">';
    var marcas = ''; var n = Math.min(passos, 12);
    for (var i = 0; i <= n; i++) { var mv = a.min + (a.max - a.min) * i / n; marcas += '<i' + (Math.abs(mv - a.padrao) < (a.max - a.min) / n / 2 ? ' class="padrao"' : '') + '></i>'; }
    html += '<div class="com-passos"><button class="bt" type="button" data-passo="-1" aria-label="Diminuir ' + a.nome.toLowerCase() + '">−</button><div>' + inp + '<div class="marcas" aria-hidden="true">' + marcas + '</div></div><button class="bt" type="button" data-passo="1" aria-label="Aumentar ' + a.nome.toLowerCase() + '">+</button></div>';
    var d = el(html + '</div>');
    var r = $('input', d), rot = $('.valor', d);
    function mostrar() {
      var x = parseFloat(r.value);
      rot.textContent = a.fmt(x); rot.classList.toggle('mudou', Math.abs(x - a.padrao) > 1e-9);
      r.style.setProperty('--p', ((x - a.min) / (a.max - a.min) * 100) + '%');
      r.setAttribute('aria-valuetext', a.fmt(x));
    }
    function mudar(x) { x = Math.min(a.max, Math.max(a.min, Math.round(x / a.passo) * a.passo)); x = +x.toFixed(3); r.value = x; aj[a.k] = x; delete aj.predef; aplicarAjustes(); mostrar(); marcarPredef(); }
    r.addEventListener('input', function () { mudar(parseFloat(r.value)); });
    $$('[data-passo]', d).forEach(function (b) { b.addEventListener('click', function () { mudar(parseFloat(r.value) + b.dataset.passo * a.passo); }); });
    mostrar();
    d._mostrar = function () { r.value = valor(a); mostrar(); };
    return d;
  }
  function marcarPredef() { $$('.predefinidos button').forEach(function (b) { var p = PREDEF[b.dataset.predef]; b.setAttribute('aria-pressed', Object.keys(p).every(function (k) { return Math.abs(valor(AJUSTES.find(function (a) { return a.k === k; })) - p[k]) < 1e-9; }) ? 'true' : 'false'); }); }
  function blocoTemas() {
    var temas = [['auto', 'Sistema'], ['original', 'Original'], ['papel', 'Papel'], ['noite', 'Noite']];
    var d = el('<div class="temas" role="group" aria-label="Tema">' + temas.map(function (t) { return '<button type="button" data-tema="' + t[0] + '"><span class="aa">Aa</span>' + t[1] + '</button>'; }).join('') + '</div>');
    function marcar() { $$('button', d).forEach(function (b) { b.setAttribute('aria-pressed', (aj.tema || 'auto') === b.dataset.tema ? 'true' : 'false'); }); }
    d.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b) return; aj.tema = b.dataset.tema; aplicarAjustes(); marcar(); });
    marcar(); return d;
  }
  function blocoFontes() {
    var f = [['literata', 'Literata', '"Literata"'], ['source', 'Source Serif', '"Source Serif 4"'], ['crimson', 'Crimson', '"Crimson Pro"'], ['atkinson', 'Atkinson', '"Atkinson Hyperlegible"']];
    var d = el('<div class="fontes" role="group" aria-label="Fonte">' + f.map(function (x) { return '<button type="button" data-fonte="' + x[0] + '" style="font-family:' + x[2] + ',serif">' + x[1] + '</button>'; }).join('') + '</div>');
    function marcar() { $$('button', d).forEach(function (b) { b.setAttribute('aria-pressed', (aj.fonte || 'literata') === b.dataset.fonte ? 'true' : 'false'); }); }
    d.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b) return; aj.fonte = b.dataset.fonte; aplicarAjustes(); marcar(); });
    marcar(); return d;
  }
  function chaveJustificar() {
    var d = el('<label class="linha-toggle"><span>Justificar o texto</span><input class="chave" type="checkbox" role="switch" id="aj-justificar"></label>');
    var c = $('input', d); c.checked = aj.justificar === 'sim';
    c.addEventListener('change', function () { aj.justificar = c.checked ? 'sim' : 'nao'; aplicarAjustes(); });
    return d;
  }
  function chaveTermos() {
    var d = el('<label class="linha-toggle"><span>Notas com o termo original</span><input class="chave" type="checkbox" role="switch" id="aj-termos"></label>');
    var c = $('input', d); c.checked = aj.termos !== 'nao';
    c.addEventListener('change', function () { aj.termos = c.checked ? 'sim' : 'nao'; aplicarAjustes(); });
    return d;
  }
  // prévia: o começo do primeiro parágrafo de texto corrido da página
  function textoPrevia() {
    var p = $$('.corpo p').find(function (x) { return !x.closest('.notas, .capa, .aviso') && !x.querySelector('mjx-container') && x.textContent.trim().length > 140; });
    var t = p ? p.textContent.replace(/\s+/g, ' ').trim() : 'O leitor ajusta a letra, o espaço entre as linhas, as margens e o tema; a mudança aparece aqui e no texto ao mesmo tempo.';
    return t.length > 240 ? t.slice(0, t.lastIndexOf(' ', 240)) + '…' : t;
  }
  function botaoRestaurar(atualizar) {
    var b = el('<button type="button" class="botao-p restaurar">Restaurar o padrão</button>');
    b.addEventListener('click', function () { aj = {}; aplicarAjustes(); atualizar(); aviso('Ajustes de volta ao padrão'); });
    return b;
  }
  function abrirAjustes(origem) {
    var frag = document.createDocumentFragment(), sls = AJUSTES.map(slider);
    function atualizar() { sls.forEach(function (s) { s._mostrar(); }); abrirAjustes(origem); }
    // folha: abas, − e + nas pontas, predefinidos e prévia ao vivo
    var abas = el('<div class="abas" role="tablist"><button type="button" role="tab" data-aba="texto">Texto</button><button type="button" role="tab" data-aba="layout">Layout</button><button type="button" role="tab" data-aba="tema">Tema</button></div>');
    var previa = el('<p class="previa" aria-hidden="true"></p>'); previa.textContent = textoPrevia();
    var paineis = {
      texto: [blocoFontes(), sls[0], sls[1]],
      layout: [el('<span class="rotulo">Predefinidos</span>'), predefinidos(sls), sls[2], sls[3], sls[4], chaveJustificar(), chaveTermos()],
      tema: [blocoTemas()]
    };
    frag.appendChild(abas); frag.appendChild(previa);
    var cont = el('<div style="display:grid;gap:.6rem"></div>'); frag.appendChild(cont);
    var aba = ler('leitor-aba', 'texto');
    function mostrarAba(n) {
      aba = n; gravar('leitor-aba', n);
      $$('button', abas).forEach(function (b) { b.setAttribute('aria-selected', b.dataset.aba === n ? 'true' : 'false'); b.tabIndex = b.dataset.aba === n ? 0 : -1; });
      cont.innerHTML = ''; paineis[n].forEach(function (x) { cont.appendChild(x); });
      // com o painel ao lado do texto a prévia sobra: o próprio texto mostra a mudança
      previa.hidden = n === 'tema' || matchMedia('(min-width: 40.01rem)').matches;
    }
    abas.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (b) mostrarAba(b.dataset.aba); });
    abas.addEventListener('keydown', function (ev) { var ord = ['texto', 'layout', 'tema'], i = ord.indexOf(aba); if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { mostrarAba(ord[(i + (ev.key === 'ArrowRight' ? 1 : 2)) % 3]); $('[aria-selected="true"]', abas).focus(); } });
    mostrarAba(aba);
    frag.appendChild(botaoRestaurar(atualizar));
    var p = abrirPainel('ajustes', 'Aparência', frag, origem);
    marcarPredef();
    return p;
  }
  function predefinidos(sls) {
    var nomes = { compacto: 'Compacto', padrao: 'Padrão', arejado: 'Arejado' }, gaps = { compacto: 3, padrao: 5, arejado: 8 };
    var d = el('<div class="predefinidos" role="group" aria-label="Predefinidos">' + Object.keys(PREDEF).map(function (k) { return '<button type="button" data-predef="' + k + '"><span class="linhas" style="gap:' + gaps[k] + 'px"><i></i><i></i><i></i></span>' + nomes[k] + '</button>'; }).join('') + '</div>');
    d.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b) return; var p = PREDEF[b.dataset.predef]; Object.keys(p).forEach(function (k) { aj[k] = p[k]; }); aplicarAjustes(); sls.forEach(function (s) { s._mostrar(); }); marcarPredef(); });
    return d;
  }

  // ---------- sumário ----------
  function abrirSumario(origem) {
    var nav = $('#sumario ol'), l = el('<ol class="lista"></ol>');
    l.innerHTML = nav ? nav.innerHTML : '';
    $$('a', l).forEach(function (a) { a.classList.remove('atual'); a.removeAttribute('aria-current'); });
    var atual = $('.cr-topo .sec').textContent;
    $$('a', l).forEach(function (a) { if (atual.indexOf(a.textContent.trim().split(' ')[0] + ' ') === 0) a.classList.add('atual'); a.addEventListener('click', function () { fecharPainel(); }); });
    var p = abrirPainel('sumario', ROTULO && ROTULO !== TITULO ? ROTULO + ' · ' + TITULO : TITULO, l, origem);
    var at = $('a.atual', l); if (at) { at.setAttribute('data-foco', ''); at.focus(); at.scrollIntoView({ block: 'center' }); }
    return p;
  }

  // ---------- busca ----------
  function semAcento(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function abrirBusca(origem) {
    var d = el('<div style="display:grid;gap:.6rem"><input class="campo" type="search" id="busca-campo" placeholder="Buscar no ' + PALAVRA + '" aria-label="Buscar no ' + PALAVRA + '" data-foco autocomplete="off"><p class="dica-pequena" aria-live="polite"></p><ol class="lista"></ol></div>');
    var campo = $('input', d), info = $('p', d), lista = $('ol', d), t = 0;
    function buscar() {
      var q = semAcento(campo.value.trim()); lista.innerHTML = '';
      if (q.length < 2) { info.textContent = ''; return; }
      var s = semAcento(idx().s), achados = [], i = -1;
      while ((i = s.indexOf(q, i + 1)) !== -1 && achados.length < 200) achados.push(i);
      info.textContent = achados.length ? achados.length + (achados.length === 200 ? '+' : '') + ' resultados' : 'Nada encontrado neste ' + PALAVRA;
      achados.slice(0, 80).forEach(function (p) {
        var ctx = indice.s.slice(Math.max(0, p - 40), p + q.length + 60);
        var b = el('<li><button type="button" class="item"><span class="contexto"></span><span class="meta"></span></button></li>');
        // o recorte pode cortar uma fórmula ao meio: o pedaço sem ⟦ ou sem ⟧ sai
        $('.contexto', b).textContent = (p > 40 ? '…' : '') + legivel(ctx.replace(/^[^⟦]*⟧/, '').replace(/⟦[^⟧]*$/, '')) + '…';
        var ini = indice.mapa[p], fim = indice.mapa[p + q.length - 1] + 1;
        var it = indice.itens.find(function (x) { return x.fim > ini; });
        $('.meta', b).textContent = tituloSecao(secaoDe(it.no));
        $('button', b).addEventListener('click', function () { fecharPainel(); irPara(ini, fim); });
        lista.appendChild(b);
      });
    }
    campo.addEventListener('input', function () { clearTimeout(t); t = setTimeout(buscar, 180); });
    return abrirPainel('busca', 'Buscar', d, origem);
  }
  function faixaDOM(ini, fim) {
    var a = idx().itens.find(function (x) { return x.fim > ini; }), b = indice.itens.slice().reverse().find(function (x) { return x.ini < fim; });
    if (!a || !b) return null;
    var r = document.createRange();
    if (a.m) r.setStartBefore(a.no); else r.setStart(a.no, Math.max(0, ini - a.ini));
    if (b.m) r.setEndAfter(b.no); else r.setEnd(b.no, Math.min(b.no.nodeValue.length, fim - b.ini));
    return r;
  }
  function irPara(ini, fim) {
    var r = faixaDOM(ini, fim); if (!r) return;
    var alvo = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
    levarAte(alvo, 'center');
    if (window.CSS && CSS.highlights && window.Highlight) { CSS.highlights.set('busca', new Highlight(r)); setTimeout(function () { CSS.highlights.delete('busca'); }, 2500); }
  }

  // ---------- painel de marcações ----------
  function abrirMarcacoes(origem, aba) {
    var d = el('<div style="display:grid;gap:.8rem"><div class="abas" role="tablist"><button type="button" role="tab" data-aba="destaques"></button><button type="button" role="tab" data-aba="notas"></button><button type="button" role="tab" data-aba="marcadores"></button></div><div class="cont" style="display:grid;gap:.6rem"></div><div class="botoes"></div></div>');
    var cont = $('.cont', d), filtro = null;
    aba = aba || ler('leitor-aba-marcacoes', 'destaques');
    function rot() {
      var m = doCap(todas), n = m.filter(function (a) { return a.nota || (a.arquivos || []).length; });
      $('[data-aba="destaques"]', d).textContent = 'Destaques ' + m.length;
      $('[data-aba="notas"]', d).textContent = 'Notas ' + n.length;
      $('[data-aba="marcadores"]', d).textContent = 'Marcadores ' + doCap(marcadores).length;
    }
    function item(a) {
      var li = el('<li><button type="button" class="item"><span class="citacao"></span><span class="nota"></span><span class="meta"></span></button></li>');
      $('.citacao', li).classList.add(a.cor); $('.citacao', li).textContent = legivel(a.citacao);
      $('.nota', li).textContent = a.nota || ''; $('.nota', li).hidden = !a.nota;
      var nf = (a.arquivos || []).length;
      $('.meta', li).textContent = tituloSecao(a.secao) + (nf ? ' · ' + nf + (nf > 1 ? ' arquivos' : ' arquivo') : '') + (a.perdida ? ' · trecho não encontrado nesta versão' : '');
      $('button', li).addEventListener('click', function () { fecharPainel(); var m = $('mark.hl[data-id="' + a.id + '"]'); if (!m) return; levarAte(m, 'center'); $$('mark.hl[data-id="' + a.id + '"]').forEach(function (x) { x.classList.add('realce'); setTimeout(function () { x.classList.remove('realce'); }, 1600); }); });
      return li;
    }
    function mostrar(n) {
      aba = n; gravar('leitor-aba-marcacoes', n); rot();
      $$('.abas button', d).forEach(function (b) { b.setAttribute('aria-selected', b.dataset.aba === n ? 'true' : 'false'); });
      cont.innerHTML = '';
      var ordem = function (x, y) { return (x.perdida ? 1e9 : posDe(x)) - (y.perdida ? 1e9 : posDe(y)); };
      if (n === 'marcadores') {
        var ms = doCap(marcadores);
        if (!ms.length) { cont.appendChild(el('<p class="vazio">Nenhum marcador. Toque na fita no alto da tela para marcar onde você está.</p>')); return; }
        var l = el('<ol class="lista"></ol>');
        ms.forEach(function (m) {
          var li = el('<li><button type="button" class="item"><span class="contexto"></span><span class="meta"></span></button></li>');
          $('.contexto', li).textContent = legivel(m.citacao) + '…';
          $('.meta', li).textContent = tituloSecao(m.secao) + ' · ' + Math.round(m.fracao * 100) + '% · ' + new Date(m.criado).toLocaleDateString('pt-BR');
          $('button', li).addEventListener('click', function () { fecharPainel(); var b = $('[data-marcador="' + m.id + '"]'); if (b) levarAte(b, 'start', -70); });
          l.appendChild(li);
        });
        cont.appendChild(l); return;
      }
      var lista = doCap(todas).filter(function (a) { return n === 'destaques' || a.nota || (a.arquivos || []).length; }).sort(ordem);
      if (n === 'destaques' && doCap(todas).length) {
        var cores = [['amarelo', '#f2cf4a'], ['verde', '#79c06a'], ['azul', '#5e9ce0'], ['rosa', '#e57aa0'], ['sub', '#d2452f']];
        var nomes = { amarelo: 'Amarelo', verde: 'Verde', azul: 'Azul', rosa: 'Rosa', sub: 'Sublinhado' };
        var f = el('<div class="filtros" role="group" aria-label="Filtrar por cor">' + cores.map(function (c) { return '<button type="button" data-cor="' + c[0] + '" aria-pressed="' + (filtro === c[0]) + '"><i style="--cor:' + c[1] + '"></i>' + nomes[c[0]] + '</button>'; }).join('') + '</div>');
        f.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b) return; filtro = filtro === b.dataset.cor ? null : b.dataset.cor; mostrar('destaques'); });
        cont.appendChild(f);
        if (filtro) lista = lista.filter(function (a) { return a.cor === filtro; });
      }
      if (!lista.length) { cont.appendChild(el('<p class="vazio">' + (n === 'notas' ? 'Nenhuma nota. Selecione um trecho e toque em Nota.' : 'Nenhum destaque. Selecione um trecho do texto para marcar.') + '</p>')); return; }
      var ol = el('<ol class="lista"></ol>'); lista.forEach(function (a) { ol.appendChild(item(a)); }); cont.appendChild(ol);
    }
    $('.abas', d).addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (b) mostrar(b.dataset.aba); });
    var bs = $('.botoes', d);
    var exp = el('<button type="button" class="botao-p">' + ico('baixar') + 'Exportar</button>');
    var imp = el('<button type="button" class="botao-p">' + ico('subir') + 'Importar</button>');
    var apagar = el('<button type="button" class="botao-p perigo">' + ico('lixo') + 'Apagar tudo</button>');
    exp.addEventListener('click', exportar);
    imp.addEventListener('click', importar);
    apagar.addEventListener('click', function () {
      if ($('.confirmar [data-sim]', d)) return;
      var c = el('<div class="confirmar" role="alert"><span>Apagar os destaques, notas, arquivos e marcadores deste ' + PALAVRA + '? Não dá para desfazer.</span><div class="botoes"><button type="button" class="botao-p perigo" data-sim>Apagar</button><button type="button" class="botao-p" data-nao>Cancelar</button></div></div>');
      $('[data-nao]', c).addEventListener('click', function () { c.remove(); });
      $('[data-sim]', c).addEventListener('click', function () { doCap(todas).forEach(removerMarcacao); marcadores = marcadores.filter(function (m) { return m.pagina !== PAGINA; }); gravar(CHAVE_B, marcadores); desenharMarcadores(); c.remove(); mostrar(aba); aviso('Marcações apagadas'); });
      d.appendChild(c); $('[data-nao]', c).focus();
    });
    bs.append(exp, imp, apagar);
    mostrar(aba);
    return abrirPainel('marcacoes', 'Marcações', d, origem);
  }
  function posDe(a) { var m = $('mark.hl[data-id="' + a.id + '"]'); var it = m && idx().itens.find(function (x) { return m.contains(x.no); }); return it ? it.ini : 0; }

  // ---------- exportar e importar (.json com os arquivos dentro) ----------
  function blobParaDataURL(b) { return new Promise(function (ok) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.readAsDataURL(b); }); }
  var ultimoExport = null;
  function exportar() {
    arquivos.todos().catch(function () { return []; }).then(function (fs) {
      return Promise.all(fs.map(function (f) { return blobParaDataURL(f.blob).then(function (u) { return { id: f.id, nome: f.nome, tipo: f.tipo, tamanho: f.tamanho, dados: u }; }); }));
    }).then(function (fs) {
      var j = JSON.stringify({ formato: 'leitor-marcacoes', versao: 1, livro: LIVRO, exportado: new Date().toISOString(), marcacoes: todas, marcadores: marcadores, arquivos: fs }, null, 1);
      var nome = 'marcacoes-' + LIVRO + '-' + new Date().toISOString().slice(0, 10) + '.json';
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([j], { type: 'application/json' })); a.download = nome;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
      aviso('Baixando ' + nome + ' (' + Math.max(1, Math.round(j.length / 1024)) + ' KB)');
      ultimoExport = j;
    });
  }
  function importar() {
    var inp = el('<input type="file" accept="application/json,.json" hidden>');
    document.body.appendChild(inp);
    inp.addEventListener('change', function () {
      var f = inp.files[0]; inp.remove(); if (!f) return;
      f.text().then(function (t) { return importarTexto(t); }).catch(function () { aviso('Esse arquivo não é um .json de marcações do leitor'); });
    });
    inp.click();
  }
  function importarTexto(t) {
    var j = JSON.parse(t);
    if (j.formato !== 'leitor-marcacoes') throw new Error('formato');
    var ids = new Set(todas.map(function (a) { return a.id; })), novas = (j.marcacoes || []).filter(function (a) { return !ids.has(a.id); });
    var idsB = new Set(marcadores.map(function (m) { return m.id; })), novosB = (j.marcadores || []).filter(function (m) { return !idsB.has(m.id); });
    return Promise.all((j.arquivos || []).map(function (f) { return fetch(f.dados).then(function (r) { return r.blob(); }).then(function (b) { return arquivos.por({ id: f.id, nome: f.nome, tipo: f.tipo, tamanho: f.tamanho, blob: b }); }); })).then(function () {
      todas = todas.concat(novas); marcadores = marcadores.concat(novosB);
      salvarMarcacoes(); gravar(CHAVE_B, marcadores);
      doCap(novas).forEach(desenhar); desenharMarcadores();
      if (painelAberto && painelAberto.dataset.nome === 'marcacoes') abrirMarcacoes();
      aviso(novas.length + (novas.length === 1 ? ' marcação e ' : ' marcações e ') + novosB.length + (novosB.length === 1 ? ' marcador importados' : ' marcadores importados'));
      return novas.length;
    });
  }

  // ---------- copiar ----------
  function copiar(txt, ok) {
    try {
      navigator.clipboard.writeText(txt).then(function () { aviso(ok || 'Copiado'); }, function () { copiarVelho(txt, ok); });
    } catch (e) { copiarVelho(txt, ok); }
  }
  function copiarVelho(txt, ok) {
    var t = el('<textarea style="position:fixed;opacity:0;top:0"></textarea>'); t.value = txt; document.body.appendChild(t); t.select();
    var deu = false; try { deu = document.execCommand('copy'); } catch (e) {}
    t.remove(); aviso(deu ? (ok || 'Copiado') : 'O navegador não deixou copiar');
  }

  // ---------- compartilhar ----------
  function linkTrecho(a) {
    var url = location.href.split('#')[0], palavras = legivel(a.citacao).split(' ');
    var limpo = function (s) { return !/[⟦⟧]/.test(s); };
    var frag = '';
    if (limpo(a.citacao)) frag = palavras.length > 8 ? ':~:text=' + encodeURIComponent(palavras.slice(0, 4).join(' ')) + ',' + encodeURIComponent(palavras.slice(-4).join(' ')) : ':~:text=' + encodeURIComponent(palavras.join(' '));
    return url + '#' + (a.secao || '') + frag;
  }
  function textoCompartilhar(a) { return '“' + legivel(a.citacao) + '”\n— ' + FONTE_CITACAO + ', ' + tituloSecao(a.secao); }
  function abrirCompartilhar(a, origem) {
    var txt = textoCompartilhar(a), link = linkTrecho(a), completo = txt + '\n' + link;
    var d = el('<div style="display:grid;gap:1rem"><figure class="cartao-citacao" style="margin:0"><blockquote></blockquote><figcaption class="fonte"></figcaption></figure><div class="destinos"></div><p class="dica-pequena">O link abre o ' + PALAVRA + ' nesse trecho.</p></div>');
    $('blockquote', d).textContent = '“' + legivel(a.citacao) + '”';
    $('.fonte', d).textContent = FONTE_CITACAO + ' · ' + tituloSecao(a.secao);
    var dest = $('.destinos', d);
    dest.appendChild(el('<a class="zap" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(completo) + '" data-destino="whatsapp"><span class="ic">' + ico('zap') + '</span>WhatsApp</a>'));
    dest.appendChild(el('<a target="_blank" rel="noopener" href="mailto:?subject=' + encodeURIComponent('Trecho de ' + FONTE_CITACAO) + '&body=' + encodeURIComponent(completo) + '" data-destino="email"><span class="ic">' + ico('email') + '</span>E-mail</a>'));
    var bc = el('<button type="button" data-destino="copiar"><span class="ic">' + ico('copiar') + '</span>Copiar texto</button>'); bc.addEventListener('click', function () { copiar(completo, 'Trecho copiado'); }); dest.appendChild(bc);
    var bl = el('<button type="button" data-destino="link"><span class="ic">' + ico('link') + '</span>Copiar link</button>'); bl.addEventListener('click', function () { copiar(link, 'Link copiado'); }); dest.appendChild(bl);
    if (navigator.share) {
      var bm = el('<button type="button" data-destino="mais"><span class="ic">' + ico('mais') + '</span>Mais apps</button>');
      bm.addEventListener('click', function () { navigator.share({ title: FONTE_CITACAO, text: txt, url: link }).catch(function (e) { if (e && e.name !== 'AbortError') aviso('Este navegador não abriu o compartilhamento. Use Copiar.'); }); });
      dest.appendChild(bm);
    }
    var p = abrirPainel('compartilhar', 'Compartilhar trecho', d, origem);
    p.dataset.texto = completo;
    return p;
  }

  // ---------- nota e arquivos de uma marcação ----------
  function chipArquivo(f, aoTirar) {
    var c = el('<span class="anexo"><span class="ext"></span><span class="nome"></span><button type="button" class="tirar" aria-label="Tirar arquivo">×</button></span>');
    $('.nome', c).textContent = f.nome; $('.ext', c).textContent = (f.nome.split('.').pop() || '').slice(0, 4);
    arquivos.pegar(f.id).then(function (r) {
      if (!r) return;
      var url = URL.createObjectURL(r.blob);
      if (/^image\//.test(r.tipo)) { var img = el('<img alt="">'); img.src = url; $('.ext', c).replaceWith(img); }
      var a = el('<a class="nome" target="_blank" rel="noopener"></a>'); a.href = url; a.textContent = f.nome; $('.nome', c).replaceWith(a);
    }).catch(function () {});
    $('.tirar', c).addEventListener('click', function () { aoTirar(f); c.remove(); });
    return c;
  }
  function escolherArquivo(cb) {
    var inp = el('<input type="file" hidden multiple>');
    document.body.appendChild(inp);
    inp.addEventListener('change', function () {
      var fs = Array.prototype.slice.call(inp.files); inp.remove();
      fs.forEach(function (f) {
        if (f.size > 50 * 1024 * 1024) { aviso(f.name + ' passa de 50 MB'); return; }
        var reg = { id: novoId(), nome: f.name, tipo: f.type || 'application/octet-stream', tamanho: f.size };
        arquivos.por(Object.assign({ blob: f }, reg)).then(function () { pedirPersistencia(); cb(reg); }).catch(function () { aviso('O navegador não deixou guardar o arquivo'); });
      });
    });
    inp.click();
  }
  function abrirNota(a, origem) {
    var d = el('<div style="display:grid;gap:.8rem"><figure class="cartao-citacao" style="margin:0"><blockquote></blockquote></figure><label class="rotulo" for="nota-texto">Sua nota</label><textarea class="campo" id="nota-texto" placeholder="Escreva aqui. Fica salvo enquanto você digita." data-foco></textarea><div class="anexos"></div><div class="botoes"><button type="button" class="botao-p" data-anexar>' + ico('clipe') + 'Anexar arquivo</button><button type="button" class="botao-p perigo" data-remover>' + ico('lixo') + 'Excluir marcação</button><button type="button" class="botao-p cheio" data-ok>Concluir</button></div></div>');
    $('blockquote', d).textContent = '“' + legivel(a.citacao) + '”';
    var ta = $('textarea', d), anexos = $('.anexos', d);
    ta.value = a.nota || '';
    var t = 0;
    ta.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { a.nota = ta.value.trim(); salvarMarcacoes(); pinoNota(a); }, 300); });
    function tirar(f) { a.arquivos = a.arquivos.filter(function (x) { return x.id !== f.id; }); salvarMarcacoes(); arquivos.tirar(f.id).catch(function () {}); pinoNota(a); }
    (a.arquivos || []).forEach(function (f) { anexos.appendChild(chipArquivo(f, tirar)); });
    $('[data-anexar]', d).addEventListener('click', function () { escolherArquivo(function (f) { a.arquivos = (a.arquivos || []).concat(f); salvarMarcacoes(); anexos.appendChild(chipArquivo(f, tirar)); pinoNota(a); aviso('Arquivo guardado neste navegador'); }); });
    $('[data-remover]', d).addEventListener('click', function () { removerMarcacao(a); fecharPainel(); aviso('Marcação excluída'); });
    $('[data-ok]', d).addEventListener('click', function () { clearTimeout(t); a.nota = ta.value.trim(); salvarMarcacoes(); pinoNota(a); fecharPainel(); });
    return abrirPainel('nota', a.nota ? 'Nota' : 'Nova nota', d, origem);
  }

  // ---------- menu da seleção ----------
  var menu = null, menuRange = null, menuMarca = null;
  var CORES = [['amarelo', 'Amarelo'], ['verde', 'Verde'], ['azul', 'Azul'], ['rosa', 'Rosa'], ['sub', 'Sublinhar']];
  function fecharMenu(manterSelecao) {
    if (menu) { menu.remove(); menu = null; raiz.classList.remove('com-menu'); }
    menuRange = null; menuMarca = null;
    if (!manterSelecao) { /* a seleção do usuário fica */ }
  }
  function abrirMenu(range, marca) {
    fecharMenu(true);
    menuRange = range; menuMarca = marca;
    var a = marca && porId(marca.dataset.id);
    var html = '<div class="cr cr-menu" role="toolbar" aria-label="' + (a ? 'Marcação' : 'Trecho selecionado') + '"><div class="dentro">' +
      '<div class="cores">' + CORES.map(function (c) { return '<button type="button" class="cor" data-cor="' + c[0] + '" aria-label="' + c[1] + '" aria-pressed="' + (a && a.cor === c[0] ? 'true' : 'false') + '">' + (c[0] === 'sub' ? 'S' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="acoes"><button type="button" class="bt" data-m="nota">' + 'Nota</button><button type="button" class="bt" data-m="anexar">' + 'Anexar</button><button type="button" class="bt" data-m="compartilhar">' + 'Compartilhar</button><button type="button" class="bt" data-m="copiar">' + 'Copiar</button>' + (a ? '<button type="button" class="bt" data-m="remover">' + 'Remover</button>' : '') + '</div></div></div>';
    menu = el(html);
    menu.addEventListener('pointerdown', function (ev) { ev.preventDefault(); }); // não perde a seleção
    menu.addEventListener('click', aoClicarMenu);
    document.body.appendChild(menu);
    raiz.classList.add('com-menu');
    posicionarMenu(range);
  }
  function textoDaFaixa(range) { var i = posDoPonto(range.startContainer, range.startOffset, false), f = posDoPonto(range.endContainer, range.endOffset, true); return trechoDe(i, f).citacao; }
  function posicionarMenu(range) {
    var rs = range.getClientRects(), r = rs.length ? rs[0] : range.getBoundingClientRect(), u = rs.length ? rs[rs.length - 1] : r;
    var w = menu.offsetWidth, h = menu.offsetHeight, vw = document.documentElement.clientWidth;
    // no toque o iOS põe o menu dele em cima da seleção: o nosso vai embaixo,
    // a não ser que não caiba (trecho no pé da tela); no mouse, vai em cima
    var cabeAcima = r.top - h - 14 >= 60, cabeAbaixo = u.bottom + 12 + (toque.matches ? 18 : 0) + h <= innerHeight - 8;
    var abaixo = toque.matches ? cabeAbaixo || !cabeAcima : !cabeAcima;
    var ref = abaixo ? u : r, cx = ref.left + ref.width / 2;
    var x = Math.max(8, Math.min(cx - w / 2, vw - w - 8));
    var y = abaixo ? u.bottom + 12 + (toque.matches ? 18 : 0) : r.top - h - 12;
    y = Math.max(60, Math.min(y, innerHeight - h - 8));
    menu.classList.toggle('abaixo', abaixo);
    menu.style.left = x + 'px'; menu.style.top = y + 'px';
    menu.style.setProperty('--seta', Math.max(16, Math.min(w - 16, cx - x)) + 'px');
  }
  function aoClicarMenu(ev) {
    var b = ev.target.closest('button'); if (!b) return;
    var a = menuMarca && porId(menuMarca.dataset.id), range = menuRange;
    var cor = b.dataset.cor, m = b.dataset.m;
    if (cor) {
      if (a) mudarCor(a, cor); else { a = criar(range, cor); getSelection().removeAllRanges(); }
      fecharMenu(); if (a) aviso(cor === 'sub' ? 'Sublinhado' : 'Destacado'); return;
    }
    if (m === 'copiar') { var t = a ? a.citacao : textoDaFaixa(range); copiar(legivel(t) + '\n— ' + FONTE_CITACAO + ', ' + tituloSecao(a ? a.secao : secaoDe(range.startContainer)), 'Trecho copiado'); fecharMenu(); return; }
    if (m === 'remover') { removerMarcacao(a); fecharMenu(); aviso('Marcação removida'); return; }
    if (m === 'compartilhar') {
      var x = a || (function () { var i = posDoPonto(range.startContainer, range.startOffset, false), f = posDoPonto(range.endContainer, range.endOffset, true), tr = trechoDe(i, f); tr.secao = secaoDe(range.startContainer); return tr; })();
      fecharMenu(); getSelection().removeAllRanges(); abrirCompartilhar(x); return;
    }
    if (!a) { a = criar(range, 'amarelo'); getSelection().removeAllRanges(); }
    fecharMenu();
    if (!a) return;
    if (m === 'nota') abrirNota(a);
    if (m === 'anexar') escolherArquivo(function (f) { a.arquivos = (a.arquivos || []).concat(f); salvarMarcacoes(); pinoNota(a); aviso('Arquivo guardado neste navegador'); });
  }
  var tSel = 0;
  function verSelecao() {
    var s = getSelection();
    if (painelAberto || CAPA) return;
    if (!s.rangeCount || s.isCollapsed) { if (menu && !menuMarca) fecharMenu(); return; }
    var r = s.getRangeAt(0);
    if (!corpo.contains(r.commonAncestorContainer) || r.toString().trim().length + (r.cloneContents().querySelector('mjx-container') ? 1 : 0) < 1) return;
    if ($('.notas', corpo) && $('.notas', corpo).contains(r.commonAncestorContainer)) return;
    abrirMenu(r.cloneRange(), null);
  }
  document.addEventListener('selectionchange', function () { clearTimeout(tSel); tSel = setTimeout(verSelecao, toque.matches ? 400 : 200); });
  document.addEventListener('mouseup', function (ev) { if (menu && menu.contains(ev.target)) return; clearTimeout(tSel); tSel = setTimeout(verSelecao, 10); });
  document.addEventListener('click', function (ev) {
    var pino = ev.target.closest('.cr-nota');
    if (pino) { ev.preventDefault(); return abrirNota(porId(pino.dataset.id), pino); }
    var m = ev.target.closest('mark.hl');
    if (m && getSelection().isCollapsed) { var r = document.createRange(); var ms = $$('mark.hl[data-id="' + m.dataset.id + '"]'); r.setStartBefore(ms[0]); r.setEndAfter(ms[ms.length - 1]); abrirMenu(r, m); return; }
    if (menu && !menu.contains(ev.target) && getSelection().isCollapsed) fecharMenu();
  });
  addEventListener('scroll', function () { if (menu && menuRange) posicionarMenu(menuRange); }, { passive: true });

  // ---------- notas (termo, tradutor, autor): o número abre um balão sem sair do lugar ----------
  // no mouse abre ao parar sobre o número e continua aberto enquanto o mouse vai até o balão
  var balao = null, ancora = null, tAbrir = 0, tFechar = 0;
  function fecharBalao() { clearTimeout(tAbrir); clearTimeout(tFechar); if (balao) { balao.remove(); balao = null; ancora = null; } }
  function abrirBalao(a) {
    if (ancora === a) return;
    fecharBalao();
    var item = document.getElementById(a.getAttribute('href').slice(1)); if (!item) return;
    balao = el('<div class="balao" role="note"></div>'); balao.className = 'balao ' + item.className;
    var tipo = $('.tipo', item), c = $('.conteudo', item);
    balao.innerHTML = '<span class="tipo">' + (tipo ? tipo.textContent : 'Nota') + ' ' + a.textContent + '</span>' + (c ? c.innerHTML : '');
    balao.addEventListener('mouseenter', function () { clearTimeout(tFechar); });
    balao.addEventListener('mouseleave', agendarFechar);
    document.body.appendChild(balao); ancora = a;
    var r = a.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    var esq = Math.max(12, Math.min(r.left - 24, vw - balao.offsetWidth - 12));
    var acima = r.bottom + 8 + balao.offsetHeight > innerHeight && r.top - 8 - balao.offsetHeight > 0;
    balao.classList.toggle('acima', acima);
    balao.style.left = (esq + scrollX) + 'px';
    balao.style.top = (acima ? r.top - 8 - balao.offsetHeight : r.bottom + 8) + scrollY + 'px';
    balao.style.setProperty('--seta', (r.left + r.width / 2 - esq) + 'px');
  }
  function agendarFechar() { clearTimeout(tAbrir); clearTimeout(tFechar); tFechar = setTimeout(fecharBalao, 250); }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('.nota-ref a');
    if (balao && balao.contains(ev.target)) return;
    if (!a) { fecharBalao(); return; }
    ev.preventDefault(); abrirBalao(a);
  });
  document.addEventListener('mouseover', function (ev) { var a = ev.target.closest && ev.target.closest('.nota-ref a'); if (!a) return; clearTimeout(tFechar); clearTimeout(tAbrir); tAbrir = setTimeout(function () { abrirBalao(a); }, 100); });
  document.addEventListener('mouseout', function (ev) { var a = ev.target.closest && ev.target.closest('.nota-ref a'); if (a && !(ev.relatedTarget && a.contains(ev.relatedTarget))) agendarFechar(); });
  document.addEventListener('focusin', function (ev) { var a = ev.target.closest('.nota-ref a'); if (a) abrirBalao(a); });
  document.addEventListener('focusout', function (ev) { if (ev.target.closest('.nota-ref a') && !(balao && balao.contains(ev.relatedTarget))) agendarFechar(); });

  // ---------- início: espera as fórmulas da tela, desenha marcações ----------
  var revelado = false;
  function iniciar() {
    if (revelado) return; revelado = true;
    mapearTex(); indexar();
    palavrasTotal = indice.s.split(' ').length;
    doCap(todas).forEach(desenhar);
    desenharMarcadores();
    var f = parseFloat(ler('leitor-pos-' + PAGINA, 0)) || 0;
    if (!CAPA && !location.hash && f > .01) scrollTo(0, f * (document.documentElement.scrollHeight - innerHeight));
    raiz.classList.remove('carregando'); raiz.classList.add('pronto');
    infoProgresso();
    if (CAPA) continuarLeitura(); else gravar('leitor-ultimo', PAGINA);
    if (!CAPA && !ler('leitor-dica-vista', false)) { setTimeout(function () { aviso(toque.matches ? 'Toque no texto para esconder ou mostrar os controles' : 'Clique no texto ou role para esconder os controles'); }, 900); gravar('leitor-dica-vista', true); }
    window.__leitor = { indice: idx, todas: function () { return todas; }, marcadores: function () { return marcadores; }, criar: criar, importarTexto: importarTexto, legivel: legivel, arquivos: arquivos, abrirMenu: abrirMenu, mostrarBarras: mostrarBarras, ultimoExport: function () { return ultimoExport; } };
  }
  // capa: "Continuar a leitura" leva à última página aberta
  function continuarLeitura() {
    var c = $('#continuar'), u = ler('leitor-ultimo', ''), m;
    if (!c || typeof u !== 'string') return;
    var nome = (m = /^cap(\d+)$/.exec(u)) ? 'Capítulo ' + parseInt(m[1], 10) : (m = /^ap([A-Z])$/.exec(u)) ? 'Apêndice ' + m[1] : u === 'prefacio' ? 'Prefácio' : '';
    if (!nome) return;
    c.href = u + '.html'; c.textContent = 'Continuar a leitura (' + nome + ')'; c.hidden = false;
  }
  function semPendentes() { return !$$('.corpo mjx-container').some(function (m) { var r = m.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && !m.querySelector('svg'); }); }
  function esperar(t0) {
    if (semPendentes() || Date.now() - t0 > 1500) Promise.race([mathJaxParado(), new Promise(function (ok) { setTimeout(ok, 4000); })]).then(iniciar);
    else requestAnimationFrame(function () { esperar(t0); });
  }
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(function () { esperar(Date.now()); }, iniciar);
  else addEventListener('load', iniciar);
  setTimeout(iniciar, 10000);
})();
