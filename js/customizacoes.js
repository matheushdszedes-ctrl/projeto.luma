/* ==========================================================
   GALERIA – js/customizacoes.js (NossasCustomizacoes.html)
   Mostra: exemplos da casa (rotulados), guitarras da comunidade
   (só se houver servidor) e as criações salvas por você neste navegador.
   "Curtir" = favoritar. Compartilhar usa link real com a configuração.
   ========================================================== */
(() => {
    'use strict';
    const SG = window.SG, P = SG.Pecas, G = SG.Guitarra, PR = SG.projetos;
    const $ = (s, c = document) => c.querySelector(s);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /* Exemplos da casa: configurações reais do catálogo, preço calculado pelo orçamento (demonstração) */
    const mk = (nome, estilo, desc, extra) => ({
        id: 'exemplo-' + nome.toLowerCase().replace(/\W+/g, '-'),
        nome, estilo, desc, autor: 'Equipe Style Guitar', origem: 'exemplo',
        config: P.normalizar({ ...P.padrao(), ...extra })
    });
    const EXEMPLOS = [
        mk('Noite de Palco', 'metal', 'Corpo agressivo preto fosco, captadores ativos e ferragens pretas.',
            { formato: 'agressiva', acabamento: 'fosca', cor: 'onix', capModelo: 'ativo', ferragemCor: 'preto', ponte: 'travavel' }),
        mk('Estilo V Obsidiana', 'metal', 'Formato V com braço ebanizado e captadores de alta saída.',
            { formato: 'v', acabamento: 'brilhante', cor: 'onix', bracoMadeira: 'ebanizado', escala: 'ebano', capModelo: 'altaSaida', ferragemCor: 'preto' }),
        mk('Rubi Rock', 'rock', 'Dupla cutaway vermelha com escudo preto e tremolo vintage.',
            { formato: 'dupla', acabamento: 'brilhante', cor: 'rubi', escudo: 'preto', ponte: 'tremolo', capModelo: 'equilibrado' }),
        mk('Sunburst Clássica', 'classica', 'Single cut em degradê sunburst com ponte tune-o-matic.',
            { formato: 'single', acabamento: 'degrade', ponte: 'tunematic', capModelo: 'equilibrado', ferragemCor: 'dourado' }),
        mk('Madeira Nua', 'classica', 'Mostra os veios do mogno, sem pintura, com captadores vintage.',
            { formato: 'single', acabamento: 'madeira', madeira: 'mogno', capModelo: 'vintage' }),
        mk('Pérola Brilho', 'rock', 'Três single coils em branco pérola, o som cristalino das cleans.',
            { formato: 'dupla', acabamento: 'brilhante', cor: 'perola', capConfig: 'SSS', escudo: 'tortoise', capModelo: 'vintage' })
    ];

    const FILTROS = [['todas', 'Todas'], ['metal', 'Metal'], ['rock', 'Rock'], ['classica', 'Clássicas'], ['minhas', 'Minhas criações']];
    const ROTULO_ESTILO = { metal: 'Metal', rock: 'Rock', classica: 'Clássica' };
    let filtro = 'todas';
    let itens = [];
    let uid = 0;

    const grade = $('#galeria');

    async function carregar() {
        const meus = (await PR.listar()).map(p => ({
            id: 'meu-' + p.id, nome: p.nome, autor: 'Você', origem: 'meu', estilo: 'minhas',
            desc: 'Salva neste navegador.', config: P.normalizar(p.config)
        }));
        let comunidade = [];
        try {
            comunidade = (await SG.comunidade.listar()).map(c => ({
                id: 'com-' + c.id, nome: c.nome, autor: c.autor || 'Comunidade', origem: 'comunidade',
                estilo: (c.tags && c.tags[0]) || 'todas', desc: c.desc || '', config: P.normalizar(c.config)
            }));
        } catch { /* servidor fora do ar: ignora */ }
        itens = [...meus, ...comunidade, ...EXEMPLOS];
        renderChips(); render();
    }

    const preco = it => P.orcamento(it.config).total;
    const favId = it => 'guitarra-' + P.assinatura(it.config);
    const conta = f => f === 'todas' ? itens.length : itens.filter(i => f === 'minhas' ? i.origem === 'meu' : i.estilo === f).length;

    function renderChips() {
        $('#chips').innerHTML = FILTROS.map(([id, nome]) =>
            `<button type="button" class="chip${id === filtro ? ' ativo' : ''}" data-filtro="${id}" aria-pressed="${id === filtro}">${nome}<span class="n">${conta(id)}</span></button>`).join('');
    }

    function render() {
        const lista = itens.filter(i => filtro === 'todas' || (filtro === 'minhas' ? i.origem === 'meu' : i.estilo === filtro));
        if (!lista.length) {
            grade.innerHTML = filtro === 'minhas'
                ? `<div class="galeria-vazia"><strong>Você ainda não salvou nenhuma guitarra.</strong><br>Monte uma no personalizador e clique em “Salvar projeto”. Ela aparece aqui.<br><a class="btn" href="texte.html">Montar a minha guitarra</a></div>`
                : '<div class="galeria-vazia">Nenhuma guitarra neste filtro.</div>';
            return;
        }
        grade.innerHTML = lista.map(it => {
            const tag = it.origem === 'exemplo' ? 'Exemplo' : (it.origem === 'meu' ? 'Sua criação' : 'Comunidade');
            const tags = [ROTULO_ESTILO[it.estilo], P.opcao('capModelo', it.config.capModelo).nome.split(' ')[0], it.config.capConfig].filter(Boolean);
            return `
            <article class="item-custom" data-id="${esc(it.id)}">
                <div class="img-wrapper">
                    <span class="selo ${it.origem}">${tag}</span>
                    <button type="button" class="fav-btn" data-fav-id="${esc(favId(it))}" data-acao="curtir" aria-label="Favoritar ${esc(it.nome)}">♡</button>
                    ${G.svg(it.config, { uid: 'g' + (++uid) + '_' })}
                </div>
                <div class="item-custom-info">
                    <h3>${esc(it.nome)}</h3>
                    <p>${esc(it.desc)}</p>
                    <div class="tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
                    <p class="autor">Por ${esc(it.autor)}</p>
                    <div class="rodape">
                        <p class="preco">${SG.moeda(preco(it))}<small>estimativa demo</small></p>
                    </div>
                    <div class="acoes">
                        <a class="btn" href="${esc(PR.linkPara('texte.html', { nome: it.nome, cfg: it.config }))}">Abrir no personalizador</a>
                        <button type="button" class="btn btn-claro" data-acao="compartilhar">Compartilhar</button>
                    </div>
                </div>
            </article>`;
        }).join('');
        SG.favoritos.pintar(grade);
    }

    $('#chips').addEventListener('click', e => {
        const b = e.target.closest('[data-filtro]'); if (!b) return;
        filtro = b.dataset.filtro; renderChips(); render();
    });

    grade.addEventListener('click', async e => {
        const b = e.target.closest('[data-acao]'); if (!b) return;
        const it = itens.find(i => i.id === b.closest('.item-custom').dataset.id); if (!it) return;
        if (b.dataset.acao === 'curtir') {
            const on = SG.favoritos.alternar({ id: favId(it), tipo: 'guitarra', nome: it.nome, preco: preco(it), cfg: it.config, autor: it.autor });
            SG.aviso(on ? `“${it.nome}” adicionada aos favoritos` : 'Removida dos favoritos');
        } else {
            const url = PR.linkPara('texte.html', { nome: it.nome, cfg: it.config }, true);
            try {
                if (navigator.share) { await navigator.share({ title: it.nome, text: 'Veja esta guitarra no Style Guitar', url }); return; }
                await navigator.clipboard.writeText(url);
                SG.aviso('Link copiado');
            } catch (err) {
                if (err && err.name === 'AbortError') return;
                window.prompt('Copie o link:', url);
            }
        }
    });

    /* publicar: só funciona com servidor */
    const btnPub = $('#btnPublicar');
    btnPub.disabled = !SG.comunidade.disponivel;
    $('#notaPublicar').textContent = SG.comunidade.disponivel ? 'Escolha uma guitarra salva para publicar.' : SG.comunidade.motivo;

    carregar();
    SG.galeria = { get itens() { return itens; }, EXEMPLOS };   // para testes
})();
