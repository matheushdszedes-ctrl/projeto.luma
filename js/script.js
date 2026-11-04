/* ==========================================================
   STYLE GUITAR – script.js
   Filtros, ordenação, preço, carrinho (com gaveta) e avisos
   ========================================================== */

/* ---------- 1. PRODUTOS ----------
   Para adicionar um instrumento novo, copie uma linha e mude os dados.
   tipo / cordas / palheta precisam ter o mesmo texto dos checkboxes. */
const produtos = window.SG.produtos;   // dados em js/produtos.js

/* ---------- 2. ELEMENTOS ---------- */
const SG = window.SG;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const grade       = $('.container');
const contagem    = $('#contagem');
const resultado   = $('#resultado');
const selOrdenar  = $('#ordenar');
const inpMin      = $('#minimo');
const inpMax      = $('#maximo');
const range       = $('#precoRange');
const btnLimpar   = $('#limpar');
const btnAplicar  = $('#aplicar');
const cartCount   = $('#cartCount');
const linkCarrinho = $('#abrirCarrinho');

const grupos = $$('.filtro .grupo');
const checksTipo    = $$('input[type="checkbox"]', grupos[0]);
const checksCordas  = $$('input[type="checkbox"]', grupos[1]);
const checksPalheta = $$('input[type="checkbox"]', grupos[2]);

/* ---------- 3. UTILITÁRIOS ---------- */
const moeda = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
const marcados = lista => lista.filter(c => c.checked).map(c => c.value);
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

/* ---------- 4. FILTRAR + ORDENAR ---------- */
function filtrar() {
    const tipos    = marcados(checksTipo);
    const cordas   = marcados(checksCordas);
    const palhetas = marcados(checksPalheta);

    let min = parseFloat(inpMin.value);
    let max = parseFloat(inpMax.value);
    if (isNaN(min)) min = 0;
    if (isNaN(max)) max = Infinity;
    if (min > max) [min, max] = [max, min]; // se o usuário inverter, corrige

    let lista = produtos.filter(p =>
        (!tipos.length    || tipos.includes(p.tipo)) &&
        (!cordas.length   || cordas.includes(p.cordas)) &&
        (!palhetas.length || (p.palheta && palhetas.includes(p.palheta))) &&
        p.preco >= min && p.preco <= max
    );

    switch (selOrdenar.value) {
        case 'menor': lista.sort((a, b) => a.preco - b.preco); break;
        case 'maior': lista.sort((a, b) => b.preco - a.preco); break;
        case 'nome':  lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')); break;
        default:      lista.sort((a, b) => a.id - b.id); // curadoria
    }
    return lista;
}

/* ---------- 5. RENDERIZAR ---------- */
function render() {
    const lista = filtrar();
    atualizarTodos();
    const texto = lista.length
        ? `${plural(lista.length, 'peça encontrada', 'peças encontradas')}`
        : 'Nenhuma peça encontrada';

    contagem.textContent = texto;
    resultado.textContent = texto;

    if (!lista.length) {
        grade.innerHTML = `
            <div class="vazio">
                <h3>Nada por aqui ainda</h3>
                <p>Tente remover alguns filtros ou ampliar a faixa de preço.</p>
                <button type="button" class="btn" id="vazioLimpar">Limpar filtros</button>
            </div>`;
        return;
    }

    grade.innerHTML = lista.map((p, i) => `
        <article class="card ${p.badge === 'Mais desejado' ? 'destaque' : ''}" style="animation-delay:${i * 40}ms">
            <div class="img-wrapper">
                ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
                <button type="button" class="fav-btn" data-fav-id="produto-${p.id}" data-produto="${p.id}" aria-pressed="false" aria-label="Favoritar ${p.nome}" title="Favoritar">♡</button>
                <img src="${p.img}" alt="${p.nome}" loading="lazy">
            </div>
            <div class="info">
                <span class="meta">${p.meta}</span>
                <h2>${p.nome}</h2>
                <div class="rodape">
                    <p class="preco">${moeda(p.preco)}</p>
                    <button class="btn" type="button" data-add="${p.id}">Adicionar <span>+</span></button>
                </div>
            </div>
        </article>`).join('');
    SG.favoritos.pintar(grade);
}

/* ---------- 6. EVENTOS DOS FILTROS ---------- */
[...checksTipo, ...checksCordas, ...checksPalheta].forEach(c => c.addEventListener('change', render));
selOrdenar.addEventListener('change', render);

// preço: campos e slider conversam entre si
inpMin.addEventListener('input', render);
inpMax.addEventListener('input', () => {
    if (inpMax.value !== '') range.value = Math.min(inpMax.value, range.max);
    else range.value = range.max;
    render();
});
range.addEventListener('input', () => {
    // o slider controla o preço máximo; no limite, remove a restrição
    inpMax.value = Number(range.value) >= Number(range.max) ? '' : range.value;
    render();
});

btnAplicar.addEventListener('click', () => {
    render();
    $('.produtos').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function limparFiltros() {
    [...checksTipo, ...checksCordas, ...checksPalheta].forEach(c => (c.checked = false));
    inpMin.value = '';
    inpMax.value = '';
    range.value = range.max;
    selOrdenar.value = 'curadoria';
    render();
}
btnLimpar.addEventListener('click', limparFiltros);

/* botão "Todos": desmarca o grupo e mostra todas as opções dele */
const gruposChecks = [checksTipo, checksCordas, checksPalheta];
const botoesTodos = $$('.todos');

botoesTodos.forEach(btn => {
    btn.addEventListener('click', () => {
        gruposChecks[Number(btn.dataset.grupo)].forEach(c => (c.checked = false));
        render();
    });
});

// "Todos" fica destacado quando nenhuma caixa do grupo está marcada
function atualizarTodos() {
    botoesTodos.forEach(btn => {
        const nenhuma = !gruposChecks[Number(btn.dataset.grupo)].some(c => c.checked);
        btn.classList.toggle('ativo', nenhuma);
        btn.setAttribute('aria-pressed', nenhuma);
    });
}
grade.addEventListener('click', e => { if (e.target.closest('#vazioLimpar')) limparFiltros(); });

/* ---------- 7. CARRINHO ---------- */
const CHAVE = 'carrinhoStyleGuitar'; // mesma chave usada em carrinho.js
let carrinho = [];
try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE));
    if (Array.isArray(bruto)) carrinho = bruto;
} catch { carrinho = []; }

const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(carrinho)); } catch {} };
const totalItens = () => carrinho.reduce((s, i) => s + i.qtd, 0);
const totalValor = () => carrinho.reduce((s, i) => s + i.qtd * i.preco, 0);

function adicionar(id) {
    const p = produtos.find(x => x.id === id);
    if (!p) return;
    const chave = 'loja-' + p.id;
    const item = carrinho.find(i => i.id === chave);
    item
        ? item.qtd++
        : carrinho.push({ id: chave, nome: p.nome, categoria: 'Loja', preco: p.preco, img: p.img, qtd: 1 });
    salvar();
    atualizarCarrinho();
    aviso(`${p.nome} adicionado ao carrinho`);
}

// clique no coração (favoritar)
grade.addEventListener('click', e => {
    const f = e.target.closest('.fav-btn');
    if (!f) return;
    const p = produtos.find(x => x.id === Number(f.dataset.produto));
    if (!p) return;
    const ligado = SG.favoritos.alternar({ id: 'produto-' + p.id, tipo: 'produto', nome: p.nome, preco: p.preco, img: p.img, pid: p.id });
    aviso(ligado ? `${p.nome} adicionado aos favoritos` : `${p.nome} removido dos favoritos`);
});

// clique nos botões "Adicionar +"
grade.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    adicionar(Number(btn.dataset.add));
    btn.classList.add('added');
    btn.innerHTML = 'Adicionado ✓';
    setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = 'Adicionar <span>+</span>'; }, 1200);
});

// compatibilidade com o antigo onclick="comprar()"
window.comprar = () => aviso('Escolha um produto e clique em Adicionar');

/* --- gaveta do carrinho --- */
const overlay = document.createElement('div');
overlay.className = 'overlay';
const gaveta = document.createElement('aside');
gaveta.className = 'gaveta';
gaveta.setAttribute('aria-label', 'Carrinho de compras');
gaveta.innerHTML = `
    <div class="gaveta-topo">
        <h2>Seu carrinho</h2>
        <button type="button" class="fechar" aria-label="Fechar carrinho">×</button>
    </div>
    <div class="gaveta-itens"></div>
    <div class="gaveta-rodape">
        <div class="total"><span>Total</span><strong id="cartTotal">R$ 0</strong></div>
        <button type="button" class="btn" id="finalizar">Finalizar compra</button>
        <button type="button" class="link-limpar" id="esvaziar">Esvaziar carrinho</button>
    </div>`;
document.body.append(overlay, gaveta);

const listaItens = $('.gaveta-itens', gaveta);
const elTotal = $('#cartTotal', gaveta);

function atualizarCarrinho() {
    const n = totalItens();
    cartCount.textContent = n;
    cartCount.classList.toggle('visivel', n > 0);

    if (!carrinho.length) {
        listaItens.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio.</p>';
    } else {
        listaItens.innerHTML = carrinho.map(i => {
            return `
            <div class="item" data-id="${i.id}">
                <img src="${i.img}" alt="${i.nome}">
                <div class="item-info">
                    <strong>${i.nome}</strong>
                    <span>${moeda(i.preco)}</span>
                    <div class="qtd">
                        <button type="button" data-acao="menos" aria-label="Diminuir">−</button>
                        <b>${i.qtd}</b>
                        <button type="button" data-acao="mais" aria-label="Aumentar">+</button>
                    </div>
                </div>
                <button type="button" class="remover" data-acao="remover" aria-label="Remover ${i.nome}">×</button>
            </div>`;
        }).join('');
    }
    elTotal.textContent = moeda(totalValor());
}

listaItens.addEventListener('click', e => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    const id = btn.closest('.item').dataset.id;
    const item = carrinho.find(i => i.id === id);
    if (!item) return;

    if (btn.dataset.acao === 'mais') item.qtd++;
    if (btn.dataset.acao === 'menos') item.qtd--;
    if (btn.dataset.acao === 'remover' || item.qtd <= 0) carrinho = carrinho.filter(i => i.id !== id);

    salvar();
    atualizarCarrinho();
});

const abrir  = () => { gaveta.classList.add('aberta'); overlay.classList.add('aberta'); };
const fechar = () => { gaveta.classList.remove('aberta'); overlay.classList.remove('aberta'); };

linkCarrinho.addEventListener('click', e => { e.preventDefault(); abrir(); });
overlay.addEventListener('click', fechar);
$('.fechar', gaveta).addEventListener('click', fechar);
document.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });

$('#esvaziar', gaveta).addEventListener('click', () => {
    carrinho = [];
    salvar();
    atualizarCarrinho();
});

$('#finalizar', gaveta).addEventListener('click', () => {
    if (!carrinho.length) return aviso('Adicione algo ao carrinho primeiro');
    const total = moeda(totalValor());
    carrinho = [];
    salvar();
    atualizarCarrinho();
    fechar();
    aviso(`Pedido de ${total} realizado com sucesso!`);
});

/* ---------- 8. AVISO (toast) ---------- */
const toast = document.createElement('div');
toast.className = 'toast';
toast.setAttribute('role', 'status');
document.body.appendChild(toast);
let timerToast;

function aviso(msg) {
    toast.textContent = msg;
    toast.classList.add('visivel');
    clearTimeout(timerToast);
    timerToast = setTimeout(() => toast.classList.remove('visivel'), 2200);
}

/* ---------- 9. INICIAR ---------- */
range.value = range.max;
atualizarCarrinho();
render();

window.addEventListener('storage', e => {
    if (e.key !== CHAVE) return;
    try { carrinho = JSON.parse(e.newValue) || []; } catch { carrinho = []; }
    atualizarCarrinho();
});
