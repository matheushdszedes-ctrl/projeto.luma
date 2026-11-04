/* ==========================================================
   INDEX (Home) – js/index.js
   Entrada suave dos blocos ao rolar a página + efeito de
   inclinação na guitarra do banner seguindo o mouse.
   ========================================================== */
(() => {
    'use strict';

    /* ---------- 1. aparecer ao rolar ---------- */
    const blocos = document.querySelectorAll('.card, .beneficio, .chamada, .secao-titulo');
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if ('IntersectionObserver' in window && !reduzir) {
        blocos.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(16px)';
            el.style.transition = 'opacity .5s ease, transform .5s ease';
        });

        const obs = new IntersectionObserver((entradas, o) => {
            entradas.forEach(en => {
                if (!en.isIntersecting) return;
                en.target.style.opacity = '1';
                en.target.style.transform = 'none';
                o.unobserve(en.target);
            });
        }, { threshold: 0.15 });

        blocos.forEach(el => obs.observe(el));
    }

    /* ---------- 2. guitarra do banner acompanha o mouse ---------- */
    const banner = document.querySelector('.banner-img');
    const img = banner && banner.querySelector('img');

    if (banner && img && !reduzir) {
        banner.addEventListener('mousemove', e => {
            const r = banner.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            img.style.transform = `rotate(${-8 + x * 10}deg) translate(${x * 14}px, ${y * 14}px) scale(1.04)`;
        });
        banner.addEventListener('mouseleave', () => { img.style.transform = ''; });
    }
})();
