/* ==========================================================
   CUSTOM (texte.html) – js/custom.js
   Tela do personalizador. Usa:
     pecas.js     -> catálogo, padrões e orçamento
     guitarra.js  -> desenho em SVG
     projetos.js  -> salvar / abrir / link
     comum.js     -> carrinho, aviso (toast), sessão
   ========================================================== */
(() => {
    'use strict';

    const SG = window.SG;
    const P = SG.Pecas;
    const G = SG.Guitarra;
    const PR = SG.projetos;

    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const moeda = v => SG.moeda(v);

    /* ---------- elementos ---------- */
    const el = {
        palco: $('#palco'), svg: $('#svgGuitarra'),
        nome: $('#nomeProjeto'), estado: $('#estadoProjeto'),
        total: $('#totalTopo'), abas: $('#abas'), grupos: $('#grupos'),
        orcamento: $('#orcamento'), projetos: $('#projetos'),
        btnCarrinho: $('#btnCarrinho'), btnSalvar: $('#btnSalvar'), btnNovo: $('#btnNovo'),
        btnFavorito: $('#btnFavorito'), btnLink: $('#btnLink'), btnImagem: $('#btnImagem'), btnFicha: $('#btnFicha'),
        modal: $('#janela'), modalCaixa: $('#janelaCaixa'),
        navbar: $('.navbar')
    };

    /* ---------- estado ---------- */
    let estado = { cfg: P.padrao(), nome: '', id: null, sujo: false };
    let categoria = P.categorias[0].id;
    let contThumb = 0;

    /* ==========================================================
       1. DESENHO + ZOOM
       ========================================================== */
    const RETANGULOS = {
        inteira:    { x: 0,   y: 0,   w: 400, h: 1000 },
        corpo:      { x: 20,  y: 480, w: 360, h: 510 },
        captadores: { x: 90,  y: 640, w: 220, h: 270 },
        braco:      { x: 130, y: 130, w: 140, h: 540 },
        cabeca:     { x: 120, y: 6,   w: 160, h: 170 }
    };
    let vista = { cx: 200, cy: 500, h: 1000 };
    let vistaAtual = 'inteira';
    let animacao = null;

    const tamanhoPalco = () => {
        const r = el.palco.getBoundingClientRect();
        return { cw: Math.max(r.width, 50), ch: Math.max(r.height, 50) };
    };

    function aplicarVista() {
        const { cw, ch } = tamanhoPalco();
        const w = vista.h * (cw / ch);
        el.svg.setAttribute('viewBox', `${(vista.cx - w / 2).toFixed(2)} ${(vista.cy - vista.h / 2).toFixed(2)} ${w.toFixed(2)} ${vista.h.toFixed(2)}`);
        const zoomado = vista.h < 950;
        el.palco.classList.toggle('zoomado', zoomado);
        el.palco.style.touchAction = zoomado ? 'none' : 'pan-y';
    }

    function ajustar(ret) {
        const { cw, ch } = tamanhoPalco();
        const h = Math.max(ret.h, ret.w / (cw / ch)) * 1.05;
        return { cx: ret.x + ret.w / 2, cy: ret.y + ret.h / 2, h };
    }

    function limitar(v) {
        v.h = Math.min(1300, Math.max(80, v.h));
        v.cx = Math.min(480, Math.max(-80, v.cx));
        v.cy = Math.min(1080, Math.max(-80, v.cy));
        return v;
    }

    function irPara(nome) {
        vistaAtual = nome;
        $$('.vista').forEach(b => b.classList.toggle('ativa', b.dataset.vista === nome));
        const alvo = ajustar(RETANGULOS[nome]);
        const reduzir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        cancelAnimationFrame(animacao);
        if (reduzir) { vista = alvo; aplicarVista(); return; }
        const ini = { ...vista }, t0 = performance.now(), dur = 320;
        const passo = agora => {
            const t = Math.min(1, (agora - t0) / dur);
            const k = 1 - Math.pow(1 - t, 3);
            vista = { cx: ini.cx + (alvo.cx - ini.cx) * k, cy: ini.cy + (alvo.cy - ini.cy) * k, h: ini.h + (alvo.h - ini.h) * k };
            aplicarVista();
            if (t < 1) animacao = requestAnimationFrame(passo);
        };
        animacao = requestAnimationFrame(passo);
    }

    function zoomar(fator, mx, my) {
        cancelAnimationFrame(animacao);
        const { cw, ch } = tamanhoPalco();
        const upp = vista.h / ch;
        const px = mx == null ? cw / 2 : mx, py = my == null ? ch / 2 : my;
        const ponto = { x: vista.cx + (px - cw / 2) * upp, y: vista.cy + (py - ch / 2) * upp };
        const novo = limitar({ ...vista, h: vista.h * fator });
        const upp2 = novo.h / ch;
        novo.cx = ponto.x - (px - cw / 2) * upp2;
        novo.cy = ponto.y - (py - ch / 2) * upp2;
        vista = limitar(novo);
        vistaAtual = '';
        $$('.vista').forEach(b => b.classList.remove('ativa'));
        aplicarVista();
    }

    /* arrastar (1 dedo / mouse) e pinça (2 dedos) */
    const ponteiros = new Map();
    let distAnterior = 0;

    el.palco.addEventListener('pointerdown', e => {
        if (e.target.closest('.zoom')) return;
        el.palco.setPointerCapture(e.pointerId);
        ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
        distAnterior = 0;
    });
    el.palco.addEventListener('pointermove', e => {
        if (!ponteiros.has(e.pointerId)) return;
        const antes = ponteiros.get(e.pointerId);
        ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const { ch } = tamanhoPalco();

        if (ponteiros.size === 2) {
            const [a, b] = [...ponteiros.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (distAnterior) {
                const r = el.palco.getBoundingClientRect();
                zoomar(distAnterior / d, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
            }
            distAnterior = d;
        } else if (ponteiros.size === 1 && vista.h < 950) {
            cancelAnimationFrame(animacao);
            const upp = vista.h / ch;
            vista = limitar({ ...vista, cx: vista.cx - (e.clientX - antes.x) * upp, cy: vista.cy - (e.clientY - antes.y) * upp });
            vistaAtual = '';
            aplicarVista();
        }
    });
    const soltar = e => { ponteiros.delete(e.pointerId); distAnterior = 0; };
    el.palco.addEventListener('pointerup', soltar);
    el.palco.addEventListener('pointercancel', soltar);

    el.palco.addEventListener('wheel', e => {
        if (!(e.ctrlKey || e.metaKey)) return;           // sem Ctrl a página rola normalmente
        e.preventDefault();
        const r = el.palco.getBoundingClientRect();
        zoomar(e.deltaY > 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    el.palco.addEventListener('dblclick', () => irPara('inteira'));

    $('#zoomMais').addEventListener('click', () => zoomar(1 / 1.3));
    $('#zoomMenos').addEventListener('click', () => zoomar(1.3));
    $('#zoomReset').addEventListener('click', () => irPara('inteira'));
    $$('.vista').forEach(b => b.addEventListener('click', () => irPara(b.dataset.vista)));

    if ('ResizeObserver' in window) new ResizeObserver(() => { if (vistaAtual) vista = ajustar(RETANGULOS[vistaAtual]); aplicarVista(); }).observe(el.palco);
    window.addEventListener('resize', ajustarNavbar);

    function ajustarNavbar() {
        if (el.navbar) document.documentElement.style.setProperty('--nav-h', el.navbar.offsetHeight + 'px');
    }

    function desenhar() {
        el.svg.innerHTML = G.conteudo(estado.cfg, 'main_');
    }

    /* ==========================================================
       2. ABAS E CATÁLOGO DE PEÇAS
       ========================================================== */
    function renderAbas() {
        el.abas.innerHTML = P.categorias.map(cat => `
            <button type="button" role="tab" class="aba${cat.id === categoria ? ' ativa' : ''}" data-categoria="${cat.id}" aria-selected="${cat.id === categoria}">
                <i class="fa-solid ${cat.icone}" aria-hidden="true"></i><span>${cat.nome}</span>
            </button>`).join('');
    }

    function miniatura(grupo, o) {
        if (grupo.tipo === 'simbolo') {
            if (o.id === 'nenhum') return '<span class="sem-simbolo" aria-hidden="true"><i class="fa-solid fa-ban"></i></span>';
            return G.simbolo(o.id, P.opcao('simboloCor', estado.cfg.simboloCor).hex, 56);
        }
        if (grupo.id === 'textoFonte') {
            return `<svg viewBox="0 0 100 60" aria-hidden="true"><text x="50" y="42" text-anchor="middle" font-family='${o.familia}' font-weight="${o.peso}" font-size="38" fill="#f4ecec">Aa</text></svg>`;
        }
        if (!grupo.recorte) return '';
        const cfg = { ...estado.cfg, [grupo.id]: o.id };
        if (grupo.id === 'madeira') cfg.acabamento = 'madeira';
        if (grupo.id === 'simboloPos' && cfg.simbolo === 'nenhum') cfg.simbolo = 'estrela';
        return G.svg(cfg, { viewBox: grupo.recorte.join(' '), uid: `t${++contThumb}_` });
    }

    function cartaoOpcao(grupo, o, ativo) {
        const preco = o.preco ? `+ ${moeda(o.preco)}` : 'Incluso';
        const carac = (o.carac || []).slice(0, 2).map(c => `<li>${esc(c)}</li>`).join('');
        return `
        <button type="button" class="peca${ativo ? ' ativa' : ''}" data-grupo="${grupo.id}" data-valor="${o.id}" aria-pressed="${ativo}">
            <span class="peca-img">${miniatura(grupo, o)}</span>
            <span class="peca-corpo">
                <span class="peca-nome">${esc(o.nome)}</span>
                <span class="peca-desc">${esc(o.desc)}</span>
                ${carac ? `<ul class="peca-carac">${carac}</ul>` : ''}
                <span class="peca-preco${o.preco ? '' : ' incluso'}">${preco}</span>
            </span>
            ${ativo ? '<span class="peca-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>' : ''}
        </button>`;
    }

    function cartaoCor(grupo, o, ativo) {
        return `
        <button type="button" class="cor${ativo ? ' ativa' : ''}" data-grupo="${grupo.id}" data-valor="${o.id}" aria-pressed="${ativo}" title="${esc(o.nome)}" aria-label="${esc(o.nome)}" style="--cor:${o.hex}">
            ${ativo ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : ''}
        </button>`;
    }

    function blocoTexto(grupo) {
        return `<div class="campos-texto">` + grupo.campos.map(c => `
            <label class="campo-texto" for="${c.id}">
                <span>${c.rotulo} <small>(+ ${moeda(c.preco)} se preenchido)</small></span>
                <input type="text" id="${c.id}" data-texto="${c.id}" maxlength="${c.max}" placeholder="${esc(c.dica)}" value="${esc(estado.cfg[c.id] || '')}" autocomplete="off">
                <em class="contador" data-contador="${c.id}">${(estado.cfg[c.id] || '').length}/${c.max}</em>
            </label>`).join('') + '</div>';
    }

    function renderGrupos(foco) {
        const cat = P.categorias.find(c => c.id === categoria);
        const html = cat.grupos.filter(g => P.visivel(g, estado.cfg)).map(g => {
            let corpo;
            if (g.tipo === 'texto') {
                corpo = blocoTexto(g);
            } else if (g.tipo === 'cor') {
                const atual = P.opcao(g.id, estado.cfg[g.id]);
                corpo = `<div class="cores">${g.opcoes.map(o => cartaoCor(g, o, o.id === atual.id)).join('')}</div>`;
            } else {
                const atual = P.opcao(g.id, estado.cfg[g.id]);
                const classe = g.tipo === 'simbolo' ? 'pecas simbolos' : 'pecas';
                corpo = `<div class="${classe}">${g.opcoes.map(o => cartaoOpcao(g, o, o.id === atual.id)).join('')}</div>`;
            }
            const sel = g.tipo === 'texto' ? '' : P.opcao(g.id, estado.cfg[g.id]).nome;
            return `<section class="grupo-pecas" data-grupo-id="${g.id}">
                <header><h3>${g.nome}</h3>${sel ? `<span class="sel">${esc(sel)}</span>` : ''}</header>
                ${corpo}
            </section>`;
        }).join('');
        el.grupos.innerHTML = html;
        el.grupos.setAttribute('aria-labelledby', 'aba-' + categoria);

        if (foco) {
            const alvo = foco.texto
                ? $(`#${foco.texto}`, el.grupos)
                : $(`[data-grupo="${foco.grupo}"][data-valor="${foco.valor}"]`, el.grupos);
            if (alvo) {
                alvo.focus({ preventScroll: true });
                if (foco.texto && alvo.setSelectionRange) alvo.setSelectionRange(foco.pos, foco.pos);
            }
        }
    }

    el.abas.addEventListener('click', e => {
        const b = e.target.closest('[data-categoria]');
        if (!b) return;
        categoria = b.dataset.categoria;
        renderAbas();
        renderGrupos();
    });

    el.grupos.addEventListener('click', e => {
        const b = e.target.closest('[data-grupo][data-valor]');
        if (!b) return;
        escolher(b.dataset.grupo, b.dataset.valor);
    });

    el.grupos.addEventListener('input', e => {
        const campo = e.target.closest('[data-texto]');
        if (!campo) return;
        const id = campo.dataset.texto;
        const antes = !!(estado.cfg.textoCorpo || estado.cfg.textoCabeca);
        estado.cfg[id] = campo.value.replace(/[<>&"]/g, '');
        const depois = !!(estado.cfg.textoCorpo || estado.cfg.textoCabeca);
        const cont = $(`[data-contador="${id}"]`, el.grupos);
        if (cont) cont.textContent = `${estado.cfg[id].length}/${campo.maxLength}`;
        marcarAlterado();
        atualizarTudo(antes !== depois ? { texto: id, pos: campo.selectionStart } : null, false);
    });

    function escolher(grupo, valor) {
        if (estado.cfg[grupo] === valor) return;
        estado.cfg[grupo] = valor;
        marcarAlterado();
        atualizarTudo({ grupo, valor });
        // dica visual: leva a visão para a parte alterada
        const g = P.grupos[grupo];
        const alvo = { formato: 'inteira', acabamento: 'corpo', cor: 'corpo', cor2: 'corpo', madeira: 'corpo', escudo: 'corpo', simbolo: 'corpo', simboloCor: 'corpo', simboloPos: 'corpo',
            bracoMadeira: 'braco', escala: 'braco', marcacoes: 'braco', cabeca: 'cabeca', tarraxas: 'cabeca',
            capConfig: 'captadores', capModelo: 'captadores', capCor: 'captadores', ponte: 'captadores', ferragemCor: 'captadores', botoes: 'corpo',
            textoCor: 'corpo', textoFonte: 'corpo' }[grupo];
        if (g && alvo && vistaAtual && vistaAtual !== alvo && vista.h >= 950 === false) irPara(alvo);
    }

    /* ==========================================================
       3. ORÇAMENTO
       ========================================================== */
    function renderOrcamento() {
        const o = P.orcamento(estado.cfg);
        let ultima = '';
        const linhas = o.linhas.map(l => {
            const cab = l.categoria !== ultima ? `<tr class="cat"><th colspan="3"><button type="button" class="cat-link" data-ir="${l.categoriaId}">${l.categoria}</button></th></tr>` : '';
            ultima = l.categoria;
            return `${cab}<tr>
                <td class="item"><span class="rot">${esc(l.rotulo)}</span><strong>${esc(l.peca)}</strong></td>
                <td class="det">${esc(l.preco ? '' : '')}</td>
                <td class="val${l.preco ? '' : ' incluso'}">${l.preco ? '+ ' + moeda(l.preco) : 'Incluso'}</td>
            </tr>`;
        }).join('');

        el.orcamento.innerHTML = `
            <header class="orc-topo">
                <h3>Orçamento em tempo real</h3>
                ${o.demo ? '<span class="selo-demo" title="Valores de demonstração, não representam preços reais">Valores demonstrativos</span>' : ''}
            </header>
            <table class="tabela-orc">
                <tbody>
                    <tr class="base"><td class="item"><span class="rot">${esc(P.BASE.nome)}</span><strong>${esc(P.BASE.detalhe)}</strong></td><td></td><td class="val">${moeda(o.base)}</td></tr>
                    ${linhas}
                </tbody>
                <tfoot>
                    <tr class="sub"><td colspan="2">Adicionais escolhidos</td><td class="val">+ ${moeda(o.adicionais)}</td></tr>
                    <tr class="total"><td colspan="2">Preço final</td><td class="val" id="valorFinal">${moeda(o.total)}</td></tr>
                </tfoot>
            </table>`;
        el.total.textContent = moeda(o.total);
    }

    el.orcamento.addEventListener('click', e => {
        const b = e.target.closest('[data-ir]');
        if (!b) return;
        categoria = b.dataset.ir;
        renderAbas();
        renderGrupos();
        el.abas.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* ==========================================================
       4. ESTADO DO PROJETO + ATUALIZAÇÃO GERAL
       ========================================================== */
    let salvarRascunhoTimer;
    function marcarAlterado() {
        estado.sujo = true;
        atualizarEstado();
        clearTimeout(salvarRascunhoTimer);
        salvarRascunhoTimer = setTimeout(() => PR.salvarRascunho({ cfg: estado.cfg, nome: estado.nome, id: estado.id }), 250);
    }

    function atualizarEstado() {
        const e = el.estado;
        if (estado.sujo) { e.textContent = estado.id ? 'Alterações não salvas' : 'Rascunho não salvo'; e.className = 'estado sujo'; }
        else { e.textContent = estado.id ? 'Projeto salvo' : 'Novo projeto'; e.className = 'estado' + (estado.id ? ' salvo' : ''); }
    }

    function atualizarTudo(foco, grupos = true) {
        desenhar();
        renderOrcamento();
        if (grupos) renderGrupos(foco);
        else if (foco) { renderGrupos(foco); }
        atualizarEstado();
        atualizarFavorito();
    }

    /* ---------- favoritar a configuração atual ---------- */
    function atualizarFavorito() {
        const b = el.btnFavorito;
        if (!b) return;
        b.dataset.favId = 'guitarra-' + P.assinatura(estado.cfg);
        const on = SG.favoritos.tem(b.dataset.favId);
        b.classList.toggle('ligado', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = on ? '♥ Favoritada' : '♡ Favoritar';
    }
    document.addEventListener('sg:favoritos', atualizarFavorito);

    function favoritarAtual() {
        const cfg = P.normalizar(estado.cfg);
        const ligado = SG.favoritos.alternar({
            id: 'guitarra-' + P.assinatura(cfg), tipo: 'guitarra',
            nome: nomeAtual(), preco: P.orcamento(cfg).total, cfg, autor: autor()
        });
        SG.aviso(ligado ? `“${nomeAtual()}” adicionada aos favoritos` : 'Removida dos favoritos');
    }

    el.nome.addEventListener('input', () => { estado.nome = el.nome.value; marcarAlterado(); });

    /* ==========================================================
       5. JANELAS (modal)
       ========================================================== */
    let aoFechar = null;
    function abrirJanela(html, opcoes = {}) {
        el.modalCaixa.className = 'janela-caixa' + (opcoes.larga ? ' larga' : '');
        el.modalCaixa.innerHTML = html;
        el.modal.classList.add('aberta');
        el.modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('sem-rolagem');
        aoFechar = opcoes.aoFechar || null;
        const foco = $('[data-foco]', el.modalCaixa) || $('button', el.modalCaixa);
        if (foco) foco.focus();
    }
    function fecharJanela() {
        el.modal.classList.remove('aberta');
        el.modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('sem-rolagem');
        if (aoFechar) { const f = aoFechar; aoFechar = null; f(); }
    }
    el.modal.addEventListener('click', e => {
        if (e.target === el.modal || e.target.closest('[data-fechar]')) fecharJanela();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && el.modal.classList.contains('aberta')) fecharJanela(); });

    function perguntar(titulo, texto, confirmar, perigo = false) {
        return new Promise(resolve => {
            abrirJanela(`
                <h2>${esc(titulo)}</h2>
                <p>${esc(texto)}</p>
                <div class="janela-botoes">
                    <button type="button" class="btn btn-claro" data-resp="0" data-foco>Cancelar</button>
                    <button type="button" class="btn${perigo ? ' perigo' : ''}" data-resp="1">${esc(confirmar)}</button>
                </div>`, { aoFechar: () => resolve(false) });
            $$('[data-resp]', el.modalCaixa).forEach(b => b.addEventListener('click', () => {
                aoFechar = null;
                fecharJanela();
                resolve(b.dataset.resp === '1');
            }));
        });
    }

    /* ==========================================================
       6. AÇÕES
       ========================================================== */
    const autor = () => { const s = SG.sessao && SG.sessao.ler(); return s ? s.nome : 'Você'; };
    const nomeAtual = () => (estado.nome || '').trim() || 'Minha guitarra';

    function carregando(btn, textoEnquanto, fn) {
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.classList.add('carregando');
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ${textoEnquanto}`;
        return Promise.resolve().then(fn).finally(() => {
            btn.disabled = false;
            btn.classList.remove('carregando');
            btn.innerHTML = original;
        });
    }

    async function salvar() {
        try {
            const reg = await PR.salvar({ id: estado.id, nome: nomeAtual(), cfg: estado.cfg, autor: autor() });
            estado.id = reg.id; estado.nome = reg.nome; estado.sujo = false;
            el.nome.value = reg.nome;
            PR.salvarRascunho({ cfg: estado.cfg, nome: estado.nome, id: estado.id });
            atualizarEstado();
            await renderProjetos();
            SG.aviso(`Projeto “${reg.nome}” salvo`);
        } catch (e) {
            SG.aviso('Não foi possível salvar: armazenamento do navegador cheio ou bloqueado');
        }
    }

    async function novo() {
        if (estado.sujo && !(await perguntar('Descartar alterações?', 'Você tem alterações que ainda não foram salvas neste projeto.', 'Começar novo', true))) return;
        estado = { cfg: P.padrao(), nome: '', id: null, sujo: false };
        el.nome.value = '';
        PR.limparRascunho();
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
        categoria = P.categorias[0].id;
        renderAbas();
        atualizarTudo();
        irPara('inteira');
        renderProjetos();
    }

    function abrirLink(dados) {
        const link = PR.linkCompartilhar(dados);
        const podeNativo = !!navigator.share;
        abrirJanela(`
            <h2>Compartilhar projeto</h2>
            <p>Qualquer pessoa com este link abre a sua guitarra exatamente como ela está agora.
               O link carrega a configuração dentro do próprio endereço, por isso não depende de servidor.</p>
            <label class="campo-link"><span>Link do projeto</span>
                <input type="text" id="campoLink" readonly value="${esc(link)}" data-foco>
            </label>
            <div class="janela-botoes">
                ${podeNativo ? '<button type="button" class="btn btn-claro" id="linkNativo"><i class="fa-solid fa-share-nodes"></i> Compartilhar…</button>' : ''}
                <button type="button" class="btn" id="linkCopiar"><i class="fa-solid fa-copy"></i> Copiar link</button>
            </div>
            <button type="button" class="janela-x" data-fechar aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>`);
        const campo = $('#campoLink');
        campo.select();
        $('#linkCopiar').addEventListener('click', async () => {
            let ok = false;
            try { await navigator.clipboard.writeText(link); ok = true; } catch {
                try { campo.select(); ok = document.execCommand('copy'); } catch {}
            }
            SG.aviso(ok ? 'Link copiado!' : 'Selecione o link e copie com Ctrl+C');
        });
        const nativo = $('#linkNativo');
        if (nativo) nativo.addEventListener('click', () => navigator.share({ title: dados.nome || 'Guitarra Style Guitar', url: link }).catch(() => {}));
    }

    async function baixarImagem() {
        await carregando(el.btnImagem, 'Gerando…', async () => {
            try {
                const total = P.orcamento(estado.cfg).total;
                const blob = await G.png(estado.cfg, { nome: nomeAtual(), preco: total });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${nomeAtual().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'guitarra'}.png`;
                document.body.appendChild(a); a.click(); a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 2000);
                SG.aviso('Imagem gerada e baixada');
            } catch (e) {
                SG.aviso('Não foi possível gerar a imagem neste navegador');
            }
        });
    }

    function abrirFicha(cfg = estado.cfg, nome = nomeAtual(), data = new Date()) {
        const o = P.orcamento(cfg);
        let ultima = '';
        const linhas = o.linhas.map(l => {
            const cat = l.categoria !== ultima ? `<tr class="ficha-cat"><th colspan="4">${l.categoria}</th></tr>` : '';
            ultima = l.categoria;
            return `${cat}<tr><td>${esc(l.rotulo)}</td><td><strong>${esc(l.peca)}</strong></td><td class="ficha-det">${esc(l.detalhe)}</td><td class="val">${l.preco ? '+ ' + moeda(l.preco) : 'Incluso'}</td></tr>`;
        }).join('');
        abrirJanela(`
            <article class="ficha" id="fichaConteudo">
                <header class="ficha-topo">
                    <div class="ficha-img">${G.svg(cfg, { viewBox: '10 440 380 560', uid: 'fh_' })}</div>
                    <div>
                        <span class="eyebrow">Ficha técnica</span>
                        <h2>${esc(nome)}</h2>
                        <p>${esc(P.resumo(cfg))}</p>
                        <p class="ficha-data">Emitida em ${data.toLocaleDateString('pt-BR')} · Style Guitar</p>
                        ${o.demo ? '<p class="selo-demo">Valores demonstrativos, não representam preços reais</p>' : ''}
                    </div>
                </header>
                <table class="ficha-tabela">
                    <thead><tr><th>Componente</th><th>Peça escolhida</th><th>Características</th><th class="val">Valor</th></tr></thead>
                    <tbody>
                        <tr class="ficha-base"><td>Base</td><td><strong>${esc(P.BASE.nome)}</strong></td><td class="ficha-det">${esc(P.BASE.detalhe)}</td><td class="val">${moeda(o.base)}</td></tr>
                        ${linhas}
                    </tbody>
                    <tfoot><tr><td colspan="3">Preço final</td><td class="val">${moeda(o.total)}</td></tr></tfoot>
                </table>
            </article>
            <div class="janela-botoes nao-imprimir">
                <button type="button" class="btn btn-claro" data-fechar data-foco>Fechar</button>
                <button type="button" class="btn" id="fichaImprimir"><i class="fa-solid fa-print"></i> Imprimir / salvar PDF</button>
            </div>
            <button type="button" class="janela-x nao-imprimir" data-fechar aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>`, { larga: true });
        $('#fichaImprimir').addEventListener('click', () => window.print());
    }

    function adicionarAoCarrinho() {
        const o = P.orcamento(estado.cfg);
        SG.carrinho.adicionar({
            id: 'custom-' + P.assinatura(estado.cfg),
            nome: nomeAtual(),
            categoria: 'Customizados',
            preco: o.total,
            img: G.dataUrl(estado.cfg)
        });
        SG.aviso(`“${nomeAtual()}” adicionada ao carrinho`);
        const b = el.btnCarrinho;
        b.classList.add('added');
        b.innerHTML = '<i class="fa-solid fa-check"></i> Adicionada';
        setTimeout(() => { b.classList.remove('added'); b.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Adicionar ao carrinho'; }, 1500);
    }

    el.btnSalvar.addEventListener('click', salvar);
    el.btnFavorito.addEventListener('click', favoritarAtual);
    el.btnNovo.addEventListener('click', novo);
    el.btnLink.addEventListener('click', () => abrirLink({ nome: nomeAtual(), cfg: estado.cfg }));
    el.btnImagem.addEventListener('click', baixarImagem);
    el.btnFicha.addEventListener('click', () => abrirFicha());
    el.btnCarrinho.addEventListener('click', adicionarAoCarrinho);

    /* ==========================================================
       7. MEUS PROJETOS
       ========================================================== */
    const dataCurta = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); };

    async function renderProjetos() {
        const lista = await PR.listar();
        if (!lista.length) {
            el.projetos.innerHTML = `
                <header class="orc-topo"><h3>Meus projetos</h3></header>
                <p class="vazio-proj"><i class="fa-regular fa-folder-open" aria-hidden="true"></i>
                Você ainda não salvou nenhuma guitarra. Monte a sua e clique em <strong>Salvar projeto</strong>.</p>`;
            return;
        }
        el.projetos.innerHTML = `
            <header class="orc-topo"><h3>Meus projetos</h3><span class="contagem">${lista.length} salvo${lista.length > 1 ? 's' : ''}</span></header>
            <div class="lista-proj">${lista.map(p => `
                <article class="proj${p.id === estado.id ? ' atual' : ''}" data-id="${p.id}">
                    <div class="proj-img">${G.svg(p.config, { viewBox: '10 440 380 560', uid: `pj${p.id}_`.replace(/[^\w]/g, '') })}</div>
                    <div class="proj-info">
                        <h4>${esc(p.nome)}</h4>
                        <p>${esc(P.resumo(P.normalizar(p.config)))}</p>
                        <p class="proj-meta">${moeda(p.preco)} · ${dataCurta(p.atualizadoEm)}</p>
                        <div class="proj-acoes">
                            <button type="button" class="btn mini" data-proj="abrir">Abrir</button>
                            <button type="button" class="btn mini btn-claro" data-proj="ficha" title="Ficha técnica"><i class="fa-solid fa-file-lines"></i></button>
                            <button type="button" class="btn mini btn-claro" data-proj="link" title="Link de compartilhamento"><i class="fa-solid fa-link"></i></button>
                            <button type="button" class="btn mini btn-claro" data-proj="duplicar" title="Duplicar"><i class="fa-regular fa-copy"></i></button>
                            <button type="button" class="btn mini btn-claro" data-proj="excluir" title="Excluir"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </div>
                </article>`).join('')}</div>`;
    }

    el.projetos.addEventListener('click', async e => {
        const b = e.target.closest('[data-proj]');
        if (!b) return;
        const id = b.closest('.proj').dataset.id;
        const proj = await PR.obter(id);
        if (!proj) { renderProjetos(); return; }

        if (b.dataset.proj === 'abrir') {
            if (estado.sujo && estado.id !== id && !(await perguntar('Abrir outro projeto?', 'As alterações não salvas do projeto atual serão perdidas.', 'Abrir mesmo assim', true))) return;
            estado = { cfg: P.normalizar(proj.config), nome: proj.nome, id: proj.id, sujo: false };
            el.nome.value = proj.nome;
            PR.salvarRascunho({ cfg: estado.cfg, nome: estado.nome, id: estado.id });
            atualizarTudo();
            irPara('inteira');
            renderProjetos();
            SG.aviso(`Projeto “${proj.nome}” aberto para edição`);
            el.palco.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (b.dataset.proj === 'ficha') {
            abrirFicha(P.normalizar(proj.config), proj.nome, new Date(proj.atualizadoEm));
        } else if (b.dataset.proj === 'link') {
            abrirLink({ nome: proj.nome, cfg: proj.config });
        } else if (b.dataset.proj === 'duplicar') {
            await PR.duplicar(id);
            await renderProjetos();
            SG.aviso('Projeto duplicado');
        } else if (b.dataset.proj === 'excluir') {
            if (!(await perguntar('Excluir projeto?', `“${proj.nome}” será removido da sua lista. Essa ação não pode ser desfeita.`, 'Excluir', true))) return;
            await PR.excluir(id);
            if (estado.id === id) { estado.id = null; estado.sujo = true; atualizarEstado(); }
            await renderProjetos();
            SG.aviso('Projeto excluído');
        }
    });

    /* ==========================================================
       8. INICIAR
       ========================================================== */
    async function iniciar() {
        ajustarNavbar();

        const compartilhado = PR.lerDoEndereco();
        const rascunho = PR.lerRascunho();
        if (compartilhado) {
            estado = { cfg: compartilhado.cfg, nome: compartilhado.nome, id: null, sujo: true };
            setTimeout(() => SG.aviso('Projeto compartilhado aberto. Salve para guardar a sua cópia'), 500);
        } else if (rascunho) {
            // volta ao projeto salvo se ele ainda existir
            const salvo = rascunho.id ? await PR.obter(rascunho.id) : null;
            estado = { cfg: rascunho.cfg, nome: rascunho.nome, id: salvo ? rascunho.id : null, sujo: false };
            if (salvo) estado.sujo = JSON.stringify(P.normalizar(salvo.config)) !== JSON.stringify(rascunho.cfg);
            else estado.sujo = JSON.stringify(rascunho.cfg) !== JSON.stringify(P.padrao());
        }
        el.nome.value = estado.nome;

        renderAbas();
        desenhar();
        renderGrupos();
        renderOrcamento();
        atualizarEstado();
        atualizarFavorito();
        vista = ajustar(RETANGULOS.inteira);
        aplicarVista();
        renderProjetos();
    }

    window.addEventListener('hashchange', () => {
        const c = PR.lerDoEndereco();
        if (!c) return;
        estado = { cfg: c.cfg, nome: c.nome, id: null, sujo: true };
        el.nome.value = c.nome;
        atualizarTudo();
        SG.aviso('Projeto compartilhado aberto');
    });

    // avisa antes de sair com alterações não salvas
    window.addEventListener('beforeunload', e => {
        if (estado.sujo) { PR.salvarRascunho({ cfg: estado.cfg, nome: estado.nome, id: estado.id }); }
    });

    iniciar();

    // para testes e depuração
    SG.personalizador = { get estado() { return estado; }, escolher, salvar, irPara };
})();
