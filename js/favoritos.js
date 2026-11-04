/* ==========================================================
   FAVORITOS E COMPARADOR – js/favoritos.js (favoritos.html)
   - lista guitarras personalizadas e produtos favoritados
   - remover, abrir no personalizador, adicionar ao carrinho
   - compara de 2 a 3 itens do MESMO tipo: preço, componentes,
     características e especificações; opção "só diferenças"
   Usa: comum.js (favoritos, carrinho), produtos.js, pecas.js,
        guitarra.js e projetos.js
   ========================================================== */
(() => {
    'use strict';

    const SG = window.SG;
    const P = SG.Pecas;
    const G = SG.Guitarra;
    const PR = SG.projetos;

    const $ = (s, c = document) => c.querySelector(s);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const moeda = v => SG.moeda(v);

    const MAX_COMPARAR = 3;
    const CHAVE_SEL = 'compararStyleGuitar';

    const el = {
        lista: $('#listaFav'), chips: $('#chipsFav'),
        comp: $('#comparador'), resumo: $('#resumoFav')
    };

    let filtro = 'todos';
    let somenteDiferencas = false;
    let sel = (() => {
        try { const a = JSON.parse(sessionStorage.getItem(CHAVE_SEL)); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; }
        catch { return []; }
    })();
    const salvarSel = () => { try { sessionStorage.setItem(CHAVE_SEL, JSON.stringify(sel)); } catch {} };

    /* ==========================================================
       1. DADOS DE CADA FAVORITO
       ========================================================== */
    function dados(f) {
        if (f.tipo === 'guitarra') {
            const cfg = P.normalizar(f.cfg);
            const orc = P.orcamento(cfg);
            return { id: f.id, tipo: 'guitarra', nome: f.nome || 'Minha guitarra', preco: orc.total, cfg, orc, resumo: P.resumo(cfg), autor: f.autor };
        }
        const p = SG.produto(f.pid);
        return {
            id: f.id, tipo: 'produto', pid: f.pid,
            nome: p ? p.nome : f.nome, preco: p ? p.preco : f.preco,
            img: p ? p.img : f.img, p, meta: p ? p.meta : ''
        };
    }

    function miniatura(d, uid) {
        if (d.tipo === 'guitarra') return G.svg(d.cfg, { viewBox: '40 0 320 1000', uid });
        return `<img src="${esc(d.img || '')}" alt="${esc(d.nome)}" loading="lazy" onerror="this.style.visibility='hidden'">`;
    }

    /* ==========================================================
       2. LISTA DE FAVORITOS
       ========================================================== */
    function renderChips(todos) {
        const n = t => todos.filter(f => t === 'todos' || f.tipo === t).length;
        const opcoes = [['todos', 'Todos'], ['guitarra', 'Guitarras personalizadas'], ['produto', 'Produtos']];
        el.chips.innerHTML = opcoes.map(([id, nome]) =>
            `<button type="button" class="chip${filtro === id ? ' ativo' : ''}" data-filtro="${id}">${nome}<span class="n">${n(id)}</span></button>`).join('');
    }

    function cartao(f, i) {
        const d = dados(f);
        const marcado = sel.includes(f.id);
        const linhaInfo = d.tipo === 'guitarra' ? esc(d.resumo) : esc(d.meta || (d.p ? d.p.tipo : ''));
        const preco = d.tipo === 'guitarra'
            ? `<p class="fav-preco">${moeda(d.preco)} <small>valor demonstrativo</small></p>`
            : `<p class="fav-preco">${moeda(d.preco)}</p>`;
        const abrir = d.tipo === 'guitarra'
            ? `<a class="btn btn-claro mini" href="${esc(PR.linkPara('texte.html', { nome: d.nome, cfg: d.cfg }))}">Abrir no personalizador</a>`
            : `<a class="btn btn-claro mini" href="loja.html">Ver na loja</a>`;
        return `
        <article class="fav-card" data-id="${esc(f.id)}" style="animation-delay:${Math.min(i, 8) * 40}ms">
            <div class="fav-img ${d.tipo}">
                ${miniatura(d, 'fv' + i + '_')}
                <span class="fav-tipo">${d.tipo === 'guitarra' ? 'Personalizada' : 'Produto'}</span>
                <button type="button" class="fav-btn ligado" data-remover="${esc(f.id)}" aria-label="Remover ${esc(d.nome)} dos favoritos" title="Remover dos favoritos">♥</button>
            </div>
            <div class="fav-corpo">
                <h3>${esc(d.nome)}</h3>
                <p class="fav-meta">${linhaInfo}</p>
                ${preco}
                <label class="comparar-chk${marcado ? ' marcado' : ''}">
                    <input type="checkbox" data-comparar="${esc(f.id)}"${marcado ? ' checked' : ''}> Comparar
                </label>
                <div class="fav-acoes">
                    <button type="button" class="btn mini" data-carrinho="${esc(f.id)}">Adicionar ao carrinho</button>
                    ${abrir}
                </div>
            </div>
        </article>`;
    }

    function renderLista() {
        const todos = SG.favoritos.ler();
        // tira da comparação o que deixou de ser favorito
        const ids = new Set(todos.map(f => f.id));
        const antes = sel.length;
        sel = sel.filter(id => ids.has(id));
        if (sel.length !== antes) salvarSel();

        renderChips(todos);
        const lista = todos.filter(f => filtro === 'todos' || f.tipo === filtro);

        if (!todos.length) {
            el.lista.innerHTML = `
                <div class="vazio-fav">
                    <div class="coracao-grande" aria-hidden="true">♡</div>
                    <h2>Você ainda não favoritou nada</h2>
                    <p>Toque no coração dos produtos da loja ou monte uma guitarra no personalizador e clique em <strong>Favoritar</strong>.</p>
                    <div class="vazio-botoes">
                        <a class="btn" href="loja.html">Ver produtos</a>
                        <a class="btn btn-claro" href="texte.html">Montar uma guitarra</a>
                    </div>
                </div>`;
        } else if (!lista.length) {
            el.lista.innerHTML = '<p class="sem-itens">Nenhum favorito neste filtro.</p>';
        } else {
            el.lista.innerHTML = lista.map(cartao).join('');
        }
        renderComparador();
    }

    /* ==========================================================
       3. COMPARADOR
       ========================================================== */
    const tipoSelecionado = () => {
        const f = SG.favoritos.ler().find(x => x.id === sel[0]);
        return f ? f.tipo : null;
    };

    function linhasGuitarra(d) {
        // Map: chave -> { cat, rotulo, valor, extra, carac, preco }
        const m = new Map();
        d.orc.linhas.forEach(l => {
            const op = P.grupos[l.grupoId] ? P.opcao(l.grupoId, d.cfg[l.grupoId]) : null;
            m.set(l.categoria + '|' + l.rotulo, {
                cat: l.categoria, rotulo: l.rotulo, valor: l.peca,
                extra: l.preco ? '+ ' + moeda(l.preco) : (l.preco === 0 ? 'Incluso' : ''),
                carac: op && op.carac ? op.carac.join(' · ') : ''
            });
        });
        const cap = P.opcao('capModelo', d.cfg.capModelo);
        const estilos = (cap.timbre || []).map(t => ({ rock: 'Rock', metal: 'Metal', blues: 'Blues', jazz: 'Jazz' }[t] || t)).join(', ');
        if (estilos) m.set('Captadores|Estilos indicados', { cat: 'Captadores', rotulo: 'Estilos indicados', valor: estilos, extra: '', carac: '' });
        return m;
    }

    function linhasProduto(d) {
        const m = new Map();
        const p = d.p;
        if (!p) { m.set('Produto|Observação', { cat: 'Produto', rotulo: 'Observação', valor: 'Item não está mais no catálogo', extra: '', carac: '' }); return m; }
        const add = (rot, val) => m.set('Especificações|' + rot, { cat: 'Especificações', rotulo: rot, valor: val, extra: '', carac: '' });
        add('Tipo de instrumento', p.tipo);
        add('Material das cordas', p.cordas);
        add('Palheta', p.palheta || 'Não usa palheta');
        add('Detalhes', p.meta);
        add('Selo', p.badge || '—');
        return m;
    }

    function renderComparador() {
        if (!SG.favoritos.contar()) { el.comp.hidden = true; return; }
        el.comp.hidden = false;

        const favs = sel.map(id => SG.favoritos.ler().find(f => f.id === id)).filter(Boolean);
        const n = favs.length;

        if (n < 2) {
            el.comp.innerHTML = `
                <header class="comp-topo"><h2>Comparador</h2><span class="comp-cont">${n} de ${MAX_COMPARAR} selecionados</span></header>
                <p class="comp-vazio">Marque <strong>Comparar</strong> em pelo menos 2 favoritos do mesmo tipo (guitarras com guitarras, produtos com produtos) para ver preço, componentes e características lado a lado.</p>`;
            return;
        }

        const itens = favs.map(dados);
        const mapas = itens.map(d => (d.tipo === 'guitarra' ? linhasGuitarra(d) : linhasProduto(d)));

        // chaves na ordem em que aparecem (primeiro item define a ordem; os outros entram depois)
        const chaves = [];
        mapas.forEach(m => m.forEach((_, k) => { if (!chaves.includes(k)) chaves.push(k); }));

        const difere = k => {
            const vals = mapas.map(m => (m.get(k) ? m.get(k).valor : '—'));
            return new Set(vals).size > 1;
        };
        const totalDif = chaves.filter(difere).length;

        // preço
        const menor = Math.min(...itens.map(d => d.preco));
        const celulaPreco = d => `<td class="${d.preco === menor ? 'melhor' : ''}"><strong>${moeda(d.preco)}</strong>${d.preco === menor ? '<small>menor preço</small>' : `<small>+ ${moeda(d.preco - menor)} que o menor</small>`}</td>`;

        let ultima = '';
        const corpo = chaves.filter(k => !somenteDiferencas || difere(k)).map(k => {
            const ref = mapas.map(m => m.get(k)).find(Boolean);
            const cab = ref.cat !== ultima ? `<tr class="comp-cat"><th colspan="${n + 1}">${esc(ref.cat)}</th></tr>` : '';
            ultima = ref.cat;
            const celulas = mapas.map(m => {
                const c = m.get(k);
                if (!c) return '<td class="vazia">—</td>';
                return `<td><strong>${esc(c.valor)}</strong>${c.extra ? `<small class="extra">${esc(c.extra)}</small>` : ''}${c.carac ? `<small class="carac">${esc(c.carac)}</small>` : ''}</td>`;
            }).join('');
            return `${cab}<tr class="${difere(k) ? 'dif' : ''}"><th scope="row">${esc(ref.rotulo)}</th>${celulas}</tr>`;
        }).join('');

        const ehGuitarra = itens[0].tipo === 'guitarra';
        const adicionais = ehGuitarra
            ? `<tr class="comp-total"><th scope="row">Adicionais escolhidos</th>${itens.map(d => `<td>+ ${moeda(d.orc.adicionais)}</td>`).join('')}</tr>` : '';

        el.comp.innerHTML = `
            <header class="comp-topo">
                <h2>Comparador</h2>
                <span class="comp-cont">${n} de ${MAX_COMPARAR} selecionados</span>
                <label class="so-dif"><input type="checkbox" id="soDif"${somenteDiferencas ? ' checked' : ''}> Mostrar só as diferenças <em>(${totalDif} de ${chaves.length})</em></label>
                <button type="button" class="link-limpar-comp" id="limparComp">Limpar comparação</button>
            </header>
            ${ehGuitarra ? '<p class="comp-aviso">Valores das guitarras personalizadas são demonstrativos.</p>' : ''}
            <div class="comp-scroll">
                <table class="comp-tabela">
                    <thead>
                        <tr>
                            <th class="canto"><span>Modelo</span></th>
                            ${itens.map((d, i) => `
                            <th class="comp-col">
                                <div class="comp-img ${d.tipo}">${miniatura(d, 'cp' + i + '_')}</div>
                                <h3>${esc(d.nome)}</h3>
                                <button type="button" class="tirar" data-tirar="${esc(d.id)}" aria-label="Tirar ${esc(d.nome)} da comparação">× tirar</button>
                            </th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="comp-preco"><th scope="row">Preço final</th>${itens.map(celulaPreco).join('')}</tr>
                        ${adicionais}
                        ${corpo || `<tr><td colspan="${n + 1}" class="vazia">Os itens escolhidos são iguais em todos os componentes.</td></tr>`}
                    </tbody>
                </table>
            </div>`;
    }

    /* ==========================================================
       4. EVENTOS
       ========================================================== */
    el.chips.addEventListener('click', e => {
        const b = e.target.closest('[data-filtro]');
        if (!b) return;
        filtro = b.dataset.filtro;
        renderLista();
    });

    el.lista.addEventListener('click', e => {
        const rem = e.target.closest('[data-remover]');
        if (rem) {
            const f = SG.favoritos.ler().find(x => x.id === rem.dataset.remover);
            SG.favoritos.remover(rem.dataset.remover);          // dispara 'sg:favoritos' -> redesenha
            SG.aviso(`${f ? f.nome : 'Item'} removido dos favoritos`);
            return;
        }
        const car = e.target.closest('[data-carrinho]');
        if (car) {
            const f = SG.favoritos.ler().find(x => x.id === car.dataset.carrinho);
            if (!f) return;
            const d = dados(f);
            if (d.tipo === 'guitarra') {
                SG.carrinho.adicionar({ id: 'custom-' + P.assinatura(d.cfg), nome: d.nome, categoria: 'Customizados', preco: d.preco, img: G.dataUrl(d.cfg) });
            } else {
                SG.carrinho.adicionar({ id: 'loja-' + d.pid, nome: d.nome, categoria: 'Loja', preco: d.preco, img: d.img });
            }
            SG.aviso(`${d.nome} adicionado ao carrinho`);
            car.textContent = 'Adicionado ✓';
            setTimeout(() => { car.textContent = 'Adicionar ao carrinho'; }, 1300);
        }
    });

    el.lista.addEventListener('change', e => {
        const chk = e.target.closest('[data-comparar]');
        if (!chk) return;
        const id = chk.dataset.comparar;
        if (chk.checked) {
            const f = SG.favoritos.ler().find(x => x.id === id);
            if (sel.length && f && tipoSelecionado() !== f.tipo) {
                chk.checked = false;
                SG.aviso('Compare apenas itens do mesmo tipo (guitarras com guitarras, produtos com produtos)');
                return;
            }
            if (sel.length >= MAX_COMPARAR) {
                chk.checked = false;
                SG.aviso(`Você pode comparar no máximo ${MAX_COMPARAR} itens`);
                return;
            }
            sel.push(id);
        } else {
            sel = sel.filter(x => x !== id);
        }
        salvarSel();
        chk.closest('.comparar-chk').classList.toggle('marcado', chk.checked);
        renderComparador();
        if (chk.checked && sel.length === 2) el.comp.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    el.comp.addEventListener('click', e => {
        const t = e.target.closest('[data-tirar]');
        if (t) {
            sel = sel.filter(x => x !== t.dataset.tirar);
            salvarSel();
            renderLista();
            return;
        }
        if (e.target.closest('#limparComp')) { sel = []; salvarSel(); renderLista(); }
    });
    el.comp.addEventListener('change', e => {
        if (e.target.id === 'soDif') { somenteDiferencas = e.target.checked; renderComparador(); }
    });

    document.addEventListener('sg:favoritos', renderLista);

    renderLista();
    SG.favoritosPagina = { get selecionados() { return sel.slice(); } };   // para testes
})();
