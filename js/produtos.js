/* ==========================================================
   PRODUTOS – js/produtos.js
   Catálogo da loja (instrumentos prontos). Fica aqui para ser usado pela
   loja, pelos favoritos e pelo comparador. Para cadastrar um produto novo,
   copie uma linha e mude os dados.
   tipo / cordas / palheta precisam ter o mesmo texto dos filtros da loja.
   ========================================================== */
(() => {
    'use strict';
    const SG = (window.SG = window.SG || {});

    SG.produtos = [
    { id: 1,  nome: 'Violão Aurora',      tipo: 'Violão',     cordas: 'Aço',              palheta: 'Celuloide', preco: 3890, meta: 'Aço · Spruce maciço',   img: '../img/WarlockGuitar.png', badge: 'Mais desejado' },
    { id: 2,  nome: 'Guitarra Rubra 62',  tipo: 'Guitarra',   cordas: 'Aço',              palheta: 'Celuloide', preco: 6450, meta: 'Elétrica · Alder',       img: '../img/LesPaulSlash.png' },
    { id: 3,  nome: 'Violino Amati',      tipo: 'Violino',    cordas: 'Aço',              palheta: null,        preco: 4280, meta: '4/4 · Maple europeu',    img: '../img/FlynigVBlack.png' },
    { id: 4,  nome: 'Baixo Nocturne',     tipo: 'Baixo',      cordas: 'Aço',              palheta: 'Nylon',     preco: 5790, meta: '4 cordas · Ash',         img: '../img/WarlockGuitar.png', badge: 'Edição limitada' },
    { id: 5,  nome: 'Ukulele Ilha',       tipo: 'Ukulele',    cordas: 'Nylon',            palheta: 'Feltro',    preco: 1280, meta: 'Concerto · Mogno',       img: '../img/LesPaulSlash.png' },
    { id: 6,  nome: 'Cavaquinho Seresta', tipo: 'Cavaquinho', cordas: 'Nylon',            palheta: 'Celuloide', preco: 1940, meta: 'Nylon · Jacarandá',      img: '../img/FlynigVBlack.png' },
    { id: 7,  nome: 'Violão Serena',      tipo: 'Violão',     cordas: 'Nylon',            palheta: null,        preco: 2650, meta: 'Nylon · Cedro',          img: '../img/WarlockGuitar.png' },
    { id: 8,  nome: 'Guitarra Onix',      tipo: 'Guitarra',   cordas: 'Aço',              palheta: 'Celuloide', preco: 7200, meta: 'Elétrica · Mogno',       img: '../img/FlynigVBlack.png' },
    { id: 9,  nome: 'Banjo Prairie',      tipo: 'Banjo',      cordas: 'Bronze fosfatado', palheta: 'Celuloide', preco: 3350, meta: '5 cordas · Maple',       img: '../img/LesPaulSlash.png' },
    { id: 10, nome: 'Harpa Celta Lira',   tipo: 'Harpa',      cordas: 'Nylon',            palheta: null,        preco: 7900, meta: 'Celta · Cerejeira',      img: '../img/WarlockGuitar.png' }
];

    SG.produto = id => SG.produtos.find(p => p.id === Number(id)) || null;
})();
