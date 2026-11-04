/* ==========================================================
   COMUM – js/comum.js (carregue em TODAS as páginas, antes do js da página)
   - contador do carrinho no menu
   - usuário logado: "Login" vira "Sair (Nome)" e "Cadastro" some
   - SG.aviso(): mensagem flutuante usada pelas outras páginas
   - SG.carrinho: ler/gravar o carrinho compartilhado
   - SG.favoritos: guitarras e produtos favoritos (usado em várias páginas)
   ========================================================== */
(() => {
    'use strict';

    const CHAVE_CARRINHO = 'carrinhoStyleGuitar';
    const CHAVE_SESSAO = 'sessaoStyleGuitar';
    const CHAVE_FAVORITOS = 'favoritosStyleGuitar';

    const SG = (window.SG = window.SG || {});

    /* ---------- utilitários ---------- */
    SG.moeda = v => v.toLocaleString('pt-BR', {
        style: 'currency', currency: 'BRL',
        minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
        maximumFractionDigits: 2
    });

    const ler = (storage, chave) => {
        try { return JSON.parse(storage.getItem(chave)); } catch { return null; }
    };

    /* ---------- carrinho compartilhado ---------- */
    SG.carrinho = {
        ler() {
            const dados = ler(localStorage, CHAVE_CARRINHO);
            return Array.isArray(dados) ? dados : [];
        },
        salvar(itens) {
            try { localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens)); } catch {}
            atualizarContador();
        },
        adicionar(item) {
            const itens = this.ler();
            const existente = itens.find(i => i.id === item.id);
            if (existente) existente.qtd = Math.min(existente.qtd + 1, 10);
            else itens.push({ ...item, qtd: 1 });
            this.salvar(itens);
        },
        total() { return this.ler().reduce((s, i) => s + i.qtd, 0); }
    };

    function atualizarContador() {
        const n = SG.carrinho.total();
        document.querySelectorAll('#cart-badge, #cartCount').forEach(el => {
            el.textContent = n;
            el.classList.toggle('visivel', n > 0);
        });
        const f = SG.favoritos ? SG.favoritos.contar() : 0;
        document.querySelectorAll('#fav-badge').forEach(el => {
            el.textContent = f;
            el.classList.toggle('visivel', f > 0);
        });
    }

    /* ---------- favoritos ----------
       Cada favorito é { id, tipo: 'produto' | 'guitarra', nome, preco, ... }.
       Produtos guardam o id do catálogo (pid); guitarras guardam a configuração (cfg).
       Para ligar a um servidor, troque ler()/gravar() por chamadas à sua API. */
    SG.favoritos = {
        ler() {
            const dados = ler(localStorage, CHAVE_FAVORITOS);
            return Array.isArray(dados) ? dados.filter(f => f && typeof f.id === 'string') : [];
        },
        gravar(lista) {
            try { localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista)); } catch {}
            atualizarContador();
            document.dispatchEvent(new CustomEvent('sg:favoritos'));
        },
        tem(id) { return this.ler().some(f => f.id === id); },
        contar() { return this.ler().length; },
        /* liga/desliga; devolve true se ficou favoritado */
        alternar(item) {
            const lista = this.ler();
            const i = lista.findIndex(f => f.id === item.id);
            if (i >= 0) { lista.splice(i, 1); this.gravar(lista); return false; }
            lista.unshift({ ...item, em: new Date().toISOString() });
            this.gravar(lista);
            return true;
        },
        remover(id) { this.gravar(this.ler().filter(f => f.id !== id)); },
        /* atualiza o desenho de todos os corações (.fav-btn[data-fav-id]) dentro de uma área */
        pintar(raiz = document) {
            raiz.querySelectorAll('[data-fav-id]').forEach(b => {
                const on = this.tem(b.dataset.favId);
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
                b.classList.toggle('ligado', on);
                if (b.classList.contains('fav-btn')) {
                    b.textContent = on ? '♥' : '♡';
                    b.title = on ? 'Remover dos favoritos' : 'Favoritar';
                }
            });
        }
    };
    document.addEventListener('sg:favoritos', () => SG.favoritos.pintar());

    /* ---------- sessão (login) ---------- */
    SG.sessao = {
        ler() { return ler(localStorage, CHAVE_SESSAO) || ler(sessionStorage, CHAVE_SESSAO); },
        salvar(usuario, lembrar) {
            const dados = JSON.stringify({ nome: usuario.nome, email: usuario.email });
            try {
                (lembrar ? localStorage : sessionStorage).setItem(CHAVE_SESSAO, dados);
            } catch {}
        },
        sair() {
            try { localStorage.removeItem(CHAVE_SESSAO); sessionStorage.removeItem(CHAVE_SESSAO); } catch {}
        }
    };

    function ajustarMenu() {
        const sessao = SG.sessao.ler();
        if (!sessao) return;

        const linkLogin = document.querySelector('.nav-links a[href$="login.html"]');
        const linkCadastro = document.querySelector('.nav-links a[href$="cadastro.html"]');

        if (linkCadastro) linkCadastro.closest('li').hidden = true;
        if (linkLogin) {
            const primeiro = String(sessao.nome || 'conta').split(' ')[0];
            const rot = linkLogin.querySelector('.rot');
            if (rot) rot.textContent = `Sair (${primeiro})`; else linkLogin.textContent = `Sair (${primeiro})`;
            linkLogin.removeAttribute('href');
            linkLogin.style.cursor = 'pointer';
            linkLogin.addEventListener('click', e => {
                e.preventDefault();
                SG.sessao.sair();
                SG.aviso('Você saiu da sua conta');
                setTimeout(() => { location.href = 'login.html'; }, 700);
            });
        }
    }

    /* ---------- aviso (toast) ---------- */
    let toast, timer;
    SG.aviso = msg => {
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            toast.setAttribute('role', 'status');
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        // força reflow para a animação rodar mesmo em avisos seguidos
        void toast.offsetWidth;
        toast.classList.add('visivel');
        clearTimeout(timer);
        timer = setTimeout(() => toast.classList.remove('visivel'), 2400);
    };

    /* ---------- ícones do menu: casa, perfil (bonequinho) e carrinho de supermercado ---------- */
    const ICONES = {
        'index.html': '<path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.8 9.8V20h12.4V9.8"/><path d="M10 20v-5.5h4V20"/>',
        'login.html': '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20.5c.6-4 3.5-6.3 7.2-6.3s6.6 2.3 7.2 6.3"/>',
        'cadastro.html': '<circle cx="10" cy="8" r="3.4"/><path d="M3.4 20c.6-3.7 3.2-5.8 6.6-5.8 1.6 0 3 .5 4.1 1.3"/><path d="M18 14v6M15 17h6"/>',
        /* carrinho de supermercado: cesto em grade, alça à esquerda e duas rodas */
        'carrinho.html': '<path d="M2.5 4.5h2.8l2.2 10.2h10.4l2-7.6H6.1"/><path d="M8.4 9.1h11M9.3 12h9.4M11.6 7.1l.6 7.6M15 7.1l-.2 7.6"/><path d="M7.5 14.7 6.9 17.4h11.2"/><circle class="cheio" cx="9" cy="20" r="1.5"/><circle class="cheio" cx="16.5" cy="20" r="1.5"/>'
    };
    function iconesMenu() {
        document.querySelectorAll('.nav-links a').forEach(a => {
            const href = (a.getAttribute('href') || '').split('/').pop();
            if (!ICONES[href] || a.querySelector('.ico')) return;
            const no = [...a.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
            if (no) { const s = document.createElement('span'); s.className = 'rot'; s.textContent = no.textContent.trim(); a.replaceChild(s, no); }
            a.insertAdjacentHTML('afterbegin', `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONES[href]}</svg>`);
        });
    }

    /* ---------- iniciar ---------- */
    window.addEventListener('storage', e => {
        if (e.key === CHAVE_CARRINHO) atualizarContador();
        if (e.key === CHAVE_FAVORITOS) { atualizarContador(); document.dispatchEvent(new CustomEvent('sg:favoritos')); }
    });
    atualizarContador();
    iconesMenu();
    ajustarMenu();
})();
