/* ==========================================================
   TEMA – js/tema.js (carregue no <head> de TODAS as páginas, antes do CSS pintar)
   Tema claro (o visual vermelho original) e tema escuro, com botão sol/lua no menu.
   A escolha fica salva no navegador (temaStyleGuitar). Sem escolha salva,
   segue o tema do aparelho (claro/escuro).
   ========================================================== */
(() => {
    'use strict';
    const CHAVE = 'temaStyleGuitar';
    const SG = (window.SG = window.SG || {});

    const lerSalvo = () => { try { const t = localStorage.getItem(CHAVE); return t === 'claro' || t === 'escuro' ? t : null; } catch { return null; } };
    const doAparelho = () => (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro');

    SG.tema = {
        atual() { return document.documentElement.dataset.tema || 'claro'; },
        definir(t, salvar = true) {
            if (t !== 'claro' && t !== 'escuro') return;
            document.documentElement.dataset.tema = t;
            if (salvar) { try { localStorage.setItem(CHAVE, t); } catch {} }
            document.querySelectorAll('.tema-toggle button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tema === t)));
            document.dispatchEvent(new CustomEvent('sg:tema', { detail: t }));
        }
    };

    SG.tema.definir(lerSalvo() || doAparelho(), false);        // já no <head>: sem piscar

    const SOL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>';
    const LUA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z"/></svg>';

    function criarBotao() {
        const barra = document.querySelector('.navbar');
        if (!barra || barra.querySelector('.tema-toggle')) return;
        const t = SG.tema.atual();
        const grupo = document.createElement('div');
        grupo.className = 'tema-toggle';
        grupo.setAttribute('role', 'group');
        grupo.setAttribute('aria-label', 'Tema do site');
        grupo.innerHTML =
            `<button type="button" data-tema="claro" aria-pressed="${t === 'claro'}" title="Tema claro" aria-label="Tema claro">${SOL}</button>` +
            `<button type="button" data-tema="escuro" aria-pressed="${t === 'escuro'}" title="Tema escuro" aria-label="Tema escuro">${LUA}</button>`;
        grupo.addEventListener('click', e => { const b = e.target.closest('button[data-tema]'); if (b) SG.tema.definir(b.dataset.tema); });
        barra.appendChild(grupo);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', criarBotao); else criarBotao();
    window.addEventListener('storage', e => { if (e.key === CHAVE && (e.newValue === 'claro' || e.newValue === 'escuro')) SG.tema.definir(e.newValue, false); });
})();
