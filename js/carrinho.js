/* ==========================================================
   CARRINHO – carrinho.js
   Quantidade, remover (com desfazer), cupom, frete, total,
   finalizar compra, aviso e carrinho salvo no navegador
   ========================================================== */
(() => {
    'use strict';

    /* ---------- 1. CONFIGURAÇÃO (edite aqui) ---------- */
    const CONFIG = {
        chave: 'carrinhoStyleGuitar',
        chaveCupom: 'carrinhoStyleGuitarCupom',
        qtdMax: 10,                 // máximo de unidades por item
        freteFixo: 0,               // 0 = frete sempre grátis
        freteGratisAcima: 0,        // se freteFixo > 0: grátis a partir deste valor
        lojaUrl: '../html/loja.html',
        cupons: {
            STYLE10:      { tipo: 'percentual', valor: 10,  descricao: '10% de desconto' },
            BEMVINDO:     { tipo: 'percentual', valor: 5,   descricao: '5% de desconto' },
            GUITARRA500:  { tipo: 'fixo',       valor: 500, descricao: 'R$ 500 de desconto' }
        }
    };

    /* Itens que aparecem na primeira visita (depois vale o que está salvo) */
    const ITENS_PADRAO = [];

    /* ---------- 2. ELEMENTOS ---------- */
    const $ = (s, c = document) => c.querySelector(s);

    const listaEl      = $('#lista-produtos');
    const badge        = $('#cart-badge');
    const btnEsvaziar  = $('#btn-esvaziar');
    const btnFinalizar = $('#btn-finalizar');
    const subLabel     = $('#resumo-subtotal-label');
    const subEl        = $('#resumo-subtotal');
    const linhaDesc    = $('#linha-desconto');
    const descLabel    = $('#resumo-desconto-label');
    const descEl       = $('#resumo-desconto');
    const freteEl      = $('#resumo-frete');
    const totalEl      = $('#resumo-total');
    const cupomInput   = $('#cupom-input');
    const btnCupom     = $('#btn-cupom');
    const cupomMsg     = $('#cupom-msg');
    const cupomAtivoEl = $('#cupom-ativo');
    const modal        = $('#modal');
    const modalCaixa   = $('#modal-caixa');

    /* ---------- 3. UTILITÁRIOS ---------- */
    const moeda = v => v.toLocaleString('pt-BR', {
        style: 'currency', currency: 'BRL',
        minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
        maximumFractionDigits: 2
    });
    const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
    const clonar = obj => JSON.parse(JSON.stringify(obj));
    const itemValido = i =>
        i && typeof i.id === 'string' && typeof i.nome === 'string' &&
        typeof i.preco === 'number' && i.preco >= 0 &&
        Number.isInteger(i.qtd) && i.qtd >= 1;

    /* ---------- 4. ESTADO + ARMAZENAMENTO ---------- */
    function carregarItens() {
        try {
            const bruto = localStorage.getItem(CONFIG.chave);
            if (bruto === null) return clonar(ITENS_PADRAO);   // primeira visita
            const dados = JSON.parse(bruto);
            if (Array.isArray(dados)) return dados.filter(itemValido); // pode ser [] (carrinho vazio)
        } catch {}
        return clonar(ITENS_PADRAO);
    }

    function carregarCupom() {
        try {
            const c = localStorage.getItem(CONFIG.chaveCupom);
            return c && CONFIG.cupons[c] ? c : null;
        } catch { return null; }
    }

    let itens = carregarItens();
    let cupomAtivo = carregarCupom();
    let ultimoRemovido = null;
    let primeiraRenderizacao = true;
    let acaoModal = null;

    const salvar = () => {
        try {
            localStorage.setItem(CONFIG.chave, JSON.stringify(itens));
            if (cupomAtivo) localStorage.setItem(CONFIG.chaveCupom, cupomAtivo);
            else localStorage.removeItem(CONFIG.chaveCupom);
        } catch {}
    };

    /* ---------- 5. CÁLCULOS ---------- */
    function calcular() {
        const subtotal = itens.reduce((s, i) => s + i.preco * i.qtd, 0);
        const qtdTotal = itens.reduce((s, i) => s + i.qtd, 0);

        let desconto = 0;
        const cupom = cupomAtivo && CONFIG.cupons[cupomAtivo];
        if (cupom && subtotal > 0) {
            desconto = cupom.tipo === 'percentual'
                ? subtotal * cupom.valor / 100
                : Math.min(cupom.valor, subtotal);
            desconto = Math.round(desconto * 100) / 100;
        }

        const base = subtotal - desconto;
        let frete = 0;
        if (subtotal > 0 && CONFIG.freteFixo > 0 && base < CONFIG.freteGratisAcima) frete = CONFIG.freteFixo;

        return { subtotal, qtdTotal, desconto, frete, total: base + frete };
    }

    /* ---------- 6. RENDERIZAÇÃO ---------- */
    function htmlItem(i, anima) {
        return `
        <article class="produto-item ${anima ? 'anima' : ''}" data-id="${i.id}" style="${anima ? `animation-delay:${itens.indexOf(i) * 60}ms` : ''}">
            <div class="img-wrapper">
                <img src="${i.img}" alt="${i.nome}" onerror="this.style.visibility='hidden'">
            </div>
            <div class="produto-info">
                <h3>${i.nome}</h3>
                <p class="categoria">${i.categoria || 'Loja'}</p>
                <button type="button" class="btn-remover" data-acao="remover"><i class="fa-solid fa-trash"></i> Remover</button>
            </div>
            <div class="produto-quantidade">
                <button type="button" class="qtd-btn" data-acao="menos" aria-label="Diminuir quantidade">−</button>
                <span class="qtd-numero" aria-live="polite">${i.qtd}</span>
                <button type="button" class="qtd-btn" data-acao="mais" aria-label="Aumentar quantidade">+</button>
            </div>
            <div class="produto-preco">
                <span class="preco-total">${moeda(i.preco * i.qtd)}</span>
                <span class="preco-unit" ${i.qtd > 1 ? '' : 'hidden'}>${moeda(i.preco)} cada</span>
            </div>
        </article>`;
    }

    function renderLista() {
        if (!itens.length) {
            listaEl.innerHTML = `
                <div class="carrinho-vazio">
                    <i class="fa-solid fa-cart-shopping"></i>
                    <h3>Seu carrinho está vazio</h3>
                    <p>Que tal explorar nossos instrumentos?</p>
                    <a class="btn-finalizar" href="${CONFIG.lojaUrl}">Ver produtos</a>
                </div>`;
        } else {
            listaEl.innerHTML = itens.map(i => htmlItem(i, primeiraRenderizacao)).join('');
        }
        primeiraRenderizacao = false;
        itens.forEach(atualizarBotoesQtd);
    }

    const elItem = id => listaEl.querySelector(`[data-id="${CSS.escape(id)}"]`);

    function atualizarBotoesQtd(item) {
        const el = elItem(item.id);
        if (!el) return;
        el.querySelector('[data-acao="menos"]').disabled = item.qtd <= 1;
        el.querySelector('[data-acao="mais"]').disabled = item.qtd >= CONFIG.qtdMax;
    }

    // atualiza só o que mudou (sem recriar a lista inteira)
    function atualizarItem(item) {
        const el = elItem(item.id);
        if (!el) return;
        el.querySelector('.qtd-numero').textContent = item.qtd;
        el.querySelector('.preco-total').textContent = moeda(item.preco * item.qtd);
        const unit = el.querySelector('.preco-unit');
        unit.hidden = item.qtd <= 1;
        unit.textContent = `${moeda(item.preco)} cada`;
        atualizarBotoesQtd(item);
    }

    function atualizarResumo() {
        const r = calcular();
        const vazio = itens.length === 0;

        subLabel.textContent = `Subtotal (${plural(r.qtdTotal, 'item', 'itens')})`;
        subEl.textContent = moeda(r.subtotal);

        linhaDesc.hidden = !(r.desconto > 0);
        descLabel.textContent = `Desconto (${cupomAtivo || ''})`;
        descEl.textContent = `− ${moeda(r.desconto)}`;

        if (r.frete > 0) {
            freteEl.textContent = moeda(r.frete);
            freteEl.classList.remove('frete-gratis');
        } else {
            freteEl.textContent = 'Grátis';
            freteEl.classList.add('frete-gratis');
        }

        totalEl.textContent = moeda(r.total);

        badge.textContent = r.qtdTotal;
        badge.classList.toggle('visivel', r.qtdTotal > 0);

        btnFinalizar.disabled = vazio;
        btnEsvaziar.hidden = vazio;
        btnCupom.disabled = vazio;
        cupomInput.disabled = vazio;

        // etiqueta do cupom ativo
        if (cupomAtivo) {
            cupomAtivoEl.hidden = false;
            cupomAtivoEl.innerHTML = `<span><i class="fa-solid fa-tag"></i> ${cupomAtivo}</span>
                <button type="button" data-acao="tirar-cupom" aria-label="Remover cupom">×</button>`;
        } else {
            cupomAtivoEl.hidden = true;
            cupomAtivoEl.innerHTML = '';
        }
    }

    function renderTudo() {
        renderLista();
        atualizarResumo();
    }

    /* ---------- 7. AÇÕES NOS ITENS ---------- */
    listaEl.addEventListener('click', e => {
        const btn = e.target.closest('[data-acao]');
        if (!btn) return;
        const el = btn.closest('.produto-item');
        const item = itens.find(i => i.id === el.dataset.id);
        if (!item) return;

        switch (btn.dataset.acao) {
            case 'mais':
                if (item.qtd < CONFIG.qtdMax) item.qtd++;
                else return aviso(`Limite de ${CONFIG.qtdMax} unidades por item`);
                break;
            case 'menos':
                if (item.qtd > 1) item.qtd--;
                break;
            case 'remover':
                return remover(item.id, el);
        }
        salvar();
        atualizarItem(item);
        atualizarResumo();
    });

    function remover(id, el) {
        el.classList.add('saindo');
        setTimeout(() => {
            const idx = itens.findIndex(i => i.id === id);
            if (idx === -1) return;
            const [item] = itens.splice(idx, 1);
            ultimoRemovido = { item, idx };
            salvar();
            renderTudo();
            aviso(`${item.nome} removido`, { texto: 'Desfazer', fn: desfazerRemocao });
        }, 250);
    }

    function desfazerRemocao() {
        if (!ultimoRemovido) return;
        const { item, idx } = ultimoRemovido;
        itens.splice(Math.min(idx, itens.length), 0, item);
        ultimoRemovido = null;
        salvar();
        renderTudo();
        aviso(`${item.nome} voltou ao carrinho`);
    }

    /* ---------- 8. CUPOM ---------- */
    function mensagemCupom(texto, tipo) {
        cupomMsg.textContent = texto;
        cupomMsg.className = `cupom-msg ${tipo || ''}`;
    }

    function aplicarCupom() {
        const codigo = cupomInput.value.trim().toUpperCase();
        if (!codigo) return mensagemCupom('Digite o código do cupom.', 'erro');
        if (!CONFIG.cupons[codigo]) return mensagemCupom('Cupom inválido ou expirado.', 'erro');
        if (cupomAtivo === codigo) return mensagemCupom('Esse cupom já está aplicado.', 'erro');

        cupomAtivo = codigo;
        salvar();
        cupomInput.value = '';
        mensagemCupom(`Cupom aplicado: ${CONFIG.cupons[codigo].descricao}.`, 'ok');
        atualizarResumo();
    }

    btnCupom.addEventListener('click', aplicarCupom);
    cupomInput.addEventListener('keydown', e => { if (e.key === 'Enter') aplicarCupom(); });
    cupomInput.addEventListener('input', () => mensagemCupom(''));
    cupomAtivoEl.addEventListener('click', e => {
        if (!e.target.closest('[data-acao="tirar-cupom"]')) return;
        cupomAtivo = null;
        salvar();
        mensagemCupom('Cupom removido.');
        atualizarResumo();
    });

    /* ---------- 9. MODAL ---------- */
    function abrirModal(html, aoConfirmar) {
        modalCaixa.innerHTML = html;
        acaoModal = aoConfirmar || null;
        modal.classList.add('aberto');
        modal.setAttribute('aria-hidden', 'false');
        const foco = modalCaixa.querySelector('.primario') || modalCaixa.querySelector('button');
        if (foco) foco.focus();
    }

    function fecharModal() {
        modal.classList.remove('aberto');
        modal.setAttribute('aria-hidden', 'true');
        acaoModal = null;
    }

    modal.addEventListener('click', e => {
        if (e.target === modal) return fecharModal();            // clique no fundo
        const btn = e.target.closest('[data-modal]');
        if (!btn) return;
        if (btn.dataset.modal === 'ok' && acaoModal) { const fn = acaoModal; fecharModal(); fn(); }
        else fecharModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });

    /* esvaziar carrinho */
    btnEsvaziar.addEventListener('click', () => {
        abrirModal(`
            <div class="modal-icone"><i class="fa-solid fa-trash"></i></div>
            <h3>Esvaziar carrinho?</h3>
            <p>Todos os itens serão removidos do seu carrinho.</p>
            <div class="modal-botoes">
                <button type="button" data-modal="cancelar">Cancelar</button>
                <button type="button" class="primario" data-modal="ok">Esvaziar</button>
            </div>`, () => {
            const copia = itens.slice();
            itens = [];
            cupomAtivo = null;
            salvar();
            renderTudo();
            mensagemCupom('');
            aviso('Carrinho esvaziado', { texto: 'Desfazer', fn: () => { itens = copia; salvar(); renderTudo(); } });
        });
    });

    /* finalizar compra */
    btnFinalizar.addEventListener('click', () => {
        if (!itens.length) return;
        const r = calcular();
        abrirModal(`
            <div class="modal-icone"><i class="fa-solid fa-bag-shopping"></i></div>
            <h3>Confirmar pedido?</h3>
            <p>Você está finalizando <strong>${plural(r.qtdTotal, 'item', 'itens')}</strong>
               no valor de <strong>${moeda(r.total)}</strong>.</p>
            <div class="modal-botoes">
                <button type="button" data-modal="cancelar">Voltar</button>
                <button type="button" class="primario" data-modal="ok">Confirmar</button>
            </div>`, () => concluirPedido(r));
    });

    function concluirPedido(r) {
        const numero = `SG-${Date.now().toString().slice(-6)}`;
        itens = [];
        cupomAtivo = null;
        ultimoRemovido = null;
        salvar();
        renderTudo();
        mensagemCupom('');
        abrirModal(`
            <div class="modal-icone ok"><i class="fa-solid fa-check"></i></div>
            <h3>Pedido confirmado!</h3>
            <p>Número do pedido: <strong>#${numero}</strong></p>
            <p>Total pago: <strong>${moeda(r.total)}</strong></p>
            <p>Obrigado por comprar na Style Guitar.</p>
            <div class="modal-botoes">
                <button type="button" data-modal="fechar">Fechar</button>
                <a class="primario" href="${CONFIG.lojaUrl}">Voltar à loja</a>
            </div>`);
    }

    /* ---------- 10. AVISO (toast) ---------- */
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
    let timerToast;

    function aviso(msg, acao) {
        toast.innerHTML = '';
        const span = document.createElement('span');
        span.textContent = msg;
        toast.appendChild(span);

        if (acao) {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = acao.texto;
            b.onclick = () => { acao.fn(); toast.classList.remove('visivel'); };
            toast.appendChild(b);
        }

        toast.classList.add('visivel');
        clearTimeout(timerToast);
        timerToast = setTimeout(() => toast.classList.remove('visivel'), acao ? 5000 : 2400);
    }

    /* ---------- 11. SINCRONIZA ENTRE ABAS ---------- */
    window.addEventListener('storage', e => {
        if (e.key !== CONFIG.chave && e.key !== CONFIG.chaveCupom) return;
        itens = carregarItens();
        cupomAtivo = carregarCupom();
        renderTudo();
    });

    /* ---------- 12. INICIAR ---------- */
    renderTudo();
})();
