// Controles do leitor: estilo, tema, letra, entrelinha e largura (gravados no
// navegador), sumário, barra de progresso, posição de leitura, dúvidas do
// tradutor e setas do teclado para trocar de capítulo.
(function () {
  var raiz = document.documentElement;
  var CHAVE = 'leitor-config';
  var GRUPOS = [
    { nome: 'estilo', titulo: 'Estilo', padrao: 'calma', opcoes: [['calma', 'Leitura calma'], ['livro', 'Livro-texto'], ['classico', 'Clássico'], ['legivel', 'Legível']] },
    { nome: 'tema', titulo: 'Tema', padrao: 'auto', opcoes: [['auto', 'Do sistema'], ['claro', 'Claro'], ['escuro', 'Escuro']] },
    { nome: 'letra', titulo: 'Tamanho da letra', padrao: 'm', opcoes: [['p', 'A−'], ['m', 'A'], ['g', 'A+'], ['gg', 'A++']] },
    { nome: 'entrelinha', titulo: 'Entrelinha', padrao: 'estilo', opcoes: [['estilo', 'Do estilo'], ['compacta', 'Compacta'], ['media', 'Média'], ['arejada', 'Arejada']] },
    { nome: 'largura', titulo: 'Largura da coluna', padrao: 'estilo', opcoes: [['estilo', 'Do estilo'], ['estreita', 'Estreita'], ['media', 'Média'], ['larga', 'Larga']] },
    { nome: 'notas-termos', titulo: 'Notas com o termo original', padrao: 'sim', opcoes: [['sim', 'Mostrar'], ['nao', 'Ocultar']] }
  ];

  function ler(chave, padrao) { try { var v = localStorage.getItem(chave); return v === null ? padrao : v; } catch (e) { return padrao; } }
  function gravar(chave, valor) { try { localStorage.setItem(chave, valor); } catch (e) {} }

  var config = {};
  try { config = JSON.parse(ler(CHAVE, '{}')) || {}; } catch (e) { config = {}; }

  function aplicar() {
    GRUPOS.forEach(function (g) {
      var v = config[g.nome] || g.padrao;
      if (v === g.padrao && (g.padrao === 'estilo' || g.nome === 'tema' || g.nome === 'letra' || g.nome === 'notas-termos')) raiz.removeAttribute('data-' + g.nome);
      else raiz.setAttribute('data-' + g.nome, v);
    });
    if ((config.estilo || 'calma') === 'calma') raiz.removeAttribute('data-estilo');
    gravar(CHAVE, JSON.stringify(config));
  }

  // painel de ajustes
  var painel = document.getElementById('ajustes');
  var botaoAjustes = document.getElementById('abrir-ajustes');
  if (painel) {
    GRUPOS.forEach(function (g) {
      var grupo = document.createElement('div');
      grupo.className = 'grupo';
      grupo.setAttribute('role', 'group');
      grupo.setAttribute('aria-label', g.titulo);
      grupo.innerHTML = '<span>' + g.titulo + '</span>';
      var opcoes = document.createElement('div');
      opcoes.className = 'opcoes';
      g.opcoes.forEach(function (o) {
        var b = document.createElement('button');
        b.type = 'button';
        b.id = 'ajuste-' + g.nome + '-' + o[0];
        b.textContent = o[1];
        b.setAttribute('aria-pressed', (config[g.nome] || g.padrao) === o[0] ? 'true' : 'false');
        b.addEventListener('click', function () {
          config[g.nome] = o[0];
          opcoes.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          aplicar();
        });
        opcoes.appendChild(b);
      });
      grupo.appendChild(opcoes);
      painel.appendChild(grupo);
    });
    botaoAjustes.addEventListener('click', function (ev) {
      ev.stopPropagation();
      painel.hidden = !painel.hidden;
      botaoAjustes.setAttribute('aria-expanded', painel.hidden ? 'false' : 'true');
    });
    document.addEventListener('click', function (ev) {
      if (!painel.hidden && !painel.contains(ev.target) && ev.target !== botaoAjustes) {
        painel.hidden = true;
        botaoAjustes.setAttribute('aria-expanded', 'false');
      }
    });
  }
  aplicar();

  // sumário
  var botaoSumario = document.getElementById('abrir-sumario');
  var sumario = document.getElementById('sumario');
  if (botaoSumario && sumario) {
    if (!sumario.textContent.trim()) botaoSumario.hidden = true;
    botaoSumario.addEventListener('click', function () {
      var aberto = document.body.classList.toggle('sumario-aberto');
      botaoSumario.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
    sumario.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) { document.body.classList.remove('sumario-aberto'); botaoSumario.setAttribute('aria-expanded', 'false'); }
    });
  }

  // progresso, seção atual e posição de leitura
  var pagina = document.body.getAttribute('data-pagina');
  var barra = document.getElementById('progresso');
  var titulos = Array.prototype.slice.call(document.querySelectorAll('.corpo h2[id], .corpo h3[id]'));
  var links = {};
  if (sumario) sumario.querySelectorAll('a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var agendado = false;
  function aoRolar() {
    agendado = false;
    var alto = document.documentElement.scrollHeight - window.innerHeight;
    var frac = alto > 0 ? Math.min(1, window.scrollY / alto) : 0;
    if (barra) barra.style.width = (frac * 100).toFixed(2) + '%';
    var atual = null;
    for (var i = 0; i < titulos.length; i++) { if (titulos[i].getBoundingClientRect().top < 120) atual = titulos[i].id; else break; }
    Object.keys(links).forEach(function (k) { links[k].classList.toggle('atual', k === atual); });
    if (pagina && pagina !== 'index') { gravar('leitor-pos-' + pagina, String(frac)); gravar('leitor-ultimo', pagina); }
  }
  window.addEventListener('scroll', function () { if (!agendado) { agendado = true; requestAnimationFrame(aoRolar); } }, { passive: true });

  function restaurar() {
    if (!pagina || pagina === 'index' || location.hash) return;
    var frac = parseFloat(ler('leitor-pos-' + pagina, '0'));
    if (frac > 0.01) window.scrollTo(0, frac * (document.documentElement.scrollHeight - window.innerHeight));
  }
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(function () { restaurar(); aoRolar(); });
  else window.addEventListener('load', function () { setTimeout(function () { restaurar(); aoRolar(); }, 300); });

  // índice: continuar de onde parou
  var continuar = document.getElementById('continuar');
  if (continuar) {
    var ultimo = ler('leitor-ultimo', '');
    if (/^cap\d+$/.test(ultimo)) { continuar.href = ultimo + '.html'; continuar.hidden = false; continuar.textContent = 'Continuar a leitura (Capítulo ' + parseInt(ultimo.slice(3), 10) + ')'; }
  }

  // notas: o número abre a explicação num balão, sem sair do lugar
  var balao = null;
  function fecharBalao() { if (balao) { balao.remove(); balao = null; } }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('.nota-ref a');
    if (balao && balao.contains(ev.target)) return;
    fecharBalao();
    if (!a) return;
    var item = document.getElementById(a.getAttribute('href').slice(1));
    if (!item) return;
    ev.preventDefault();
    balao = document.createElement('div');
    balao.className = 'balao ' + item.className;
    balao.setAttribute('role', 'note');
    var tipo = item.querySelector('.tipo'), conteudo = item.querySelector('.conteudo');
    balao.innerHTML = '<span class="tipo">' + (tipo ? tipo.textContent : 'Nota') + ' ' + a.textContent + '</span>' + (conteudo ? conteudo.innerHTML : '');
    document.body.appendChild(balao);
    var r = a.getBoundingClientRect();
    var esq = Math.max(12, Math.min(r.left + window.scrollX - 24, window.scrollX + document.documentElement.clientWidth - balao.offsetWidth - 12));
    balao.style.left = esq + 'px';
    balao.style.top = (r.bottom + window.scrollY + 8) + 'px';
  });

  // setas: capítulo anterior e próximo
  document.addEventListener('keydown', function (ev) {
    if (ev.altKey || ev.ctrlKey || ev.metaKey || /input|textarea|select/i.test(ev.target.tagName)) return;
    var alvo = ev.key === 'ArrowLeft' ? document.querySelector('.paginacao .ant') : ev.key === 'ArrowRight' ? document.querySelector('.paginacao .prox') : null;
    if (alvo) location.href = alvo.href;
    if (ev.key === 'Escape') {
      if (painel && !painel.hidden) { painel.hidden = true; botaoAjustes.setAttribute('aria-expanded', 'false'); }
      document.body.classList.remove('sumario-aberto');
      fecharBalao();
    }
  });
})();
