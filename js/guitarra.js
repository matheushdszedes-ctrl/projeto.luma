/* ==========================================================
   GUITARRA – js/guitarra.js
   Desenha a guitarra em SVG, em camadas, a partir de uma configuração
   (a mesma usada em pecas.js). Não depende de imagens externas:
   cada peça é desenhada por código, por isso muda na hora.

   API:
     SG.Guitarra.conteudo(cfg, uid)  -> miolo do SVG (defs + camadas)
     SG.Guitarra.svg(cfg, opcoes)    -> <svg> completo (string)
     SG.Guitarra.dataUrl(cfg)        -> data:image/svg+xml (para <img>)
     SG.Guitarra.png(cfg, opcoes)    -> Promise<Blob> (imagem PNG)
     SG.Guitarra.simbolo(id, cor)    -> <svg> de um adesivo

   Sistema de coordenadas: 400 x 1000, cabeça no topo, corpo embaixo.
   ========================================================== */
(() => {
    'use strict';

    const SG = (window.SG = window.SG || {});
    const P = SG.Pecas;
    const G = {};
    let contador = 0;

    /* ---------- cores ---------- */
    const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
    const rgb = h => {
        h = h.replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const n = parseInt(h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
    const mix = (a, b, t) => {
        const A = rgb(a), B = rgb(b);
        return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
    };
    const claro = (h, t) => mix(h, '#ffffff', t);
    const escuro = (h, t) => mix(h, '#000000', t);
    const lum = h => {
        const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contraste = h => (lum(h) > 0.35 ? '#1a1416' : '#f4eee2');
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const f = n => Math.round(n * 100) / 100;

    /* ---------- geometria da escala ---------- */
    const CENTRO = 200, PESTANA = 150, ESCALA = 681, FIM_ESCALA = 655, Y_PONTE = 831;
    const fretY = n => PESTANA + ESCALA * (1 - Math.pow(2, -n / 12));
    const meiaEscala = y => 22 + (7 * (y - PESTANA)) / 490;
    const espCorda = y => 7 + (3 * (y - PESTANA)) / (Y_PONTE - PESTANA);
    const cordaX = (i, y) => CENTRO + (i - 2.5) * espCorda(y);

    /* ---------- corpos ---------- */
    // cada lado é uma lista de segmentos ['C', x1,y1, x2,y2, x,y] ou ['L', x,y]
    // partindo de [200,552]; se não houver `dir`, o lado direito é o espelho.
    const CORPOS = {
        dupla: {
            esq: [['C', 172, 556, 148, 540, 130, 508], ['C', 100, 510, 66, 552, 62, 612], ['C', 58, 660, 86, 690, 82, 730],
                  ['C', 78, 775, 40, 810, 44, 880], ['C', 48, 945, 110, 968, 200, 968]],
            botoes: [[262, 876], [300, 884], [338, 892]],
            escudo: 'M118,606 C140,590 262,590 284,606 C302,620 304,672 298,724 C294,764 296,812 312,862 C318,884 304,904 284,900 C236,892 160,876 126,826 C106,794 104,700 108,650 C109,626 110,612 118,606 Z',
            parafusos: [[128, 616], [272, 616], [290, 704], [300, 858], [150, 840], [116, 700]],
            texto: { x: 200, y: 946, rot: 0, max: 200, tam: 20 },
            simbolos: { inferior: [120, 905, 58], ombro: [96, 652, 34] }
        },
        single: {
            esq: [['C', 160, 556, 112, 546, 84, 584], ['C', 50, 628, 62, 672, 78, 704], ['C', 62, 752, 38, 792, 42, 862], ['C', 46, 932, 112, 968, 200, 968]],
            dir: [['C', 232, 556, 256, 540, 272, 520], ['C', 292, 504, 338, 560, 336, 616], ['C', 334, 664, 318, 690, 322, 730],
                  ['C', 326, 775, 362, 810, 358, 880], ['C', 354, 945, 288, 968, 200, 968]],
            botoes: [[262, 876], [300, 884], [338, 892]],
            escudo: 'M124,636 C146,620 254,620 276,636 C288,646 290,700 286,760 C283,806 270,820 244,820 L156,820 C130,820 118,806 116,760 C112,700 114,646 124,636 Z',
            parafusos: [[134, 644], [266, 644], [278, 760], [160, 808], [240, 808], [124, 760]],
            texto: { x: 200, y: 946, rot: 0, max: 200, tam: 20 },
            simbolos: { inferior: [120, 905, 58], ombro: [100, 656, 34] }
        },
        v: {
            esq: [['C', 165, 560, 110, 700, 50, 962], ['C', 46, 972, 52, 984, 66, 986], ['C', 92, 988, 116, 982, 128, 976], ['C', 150, 950, 176, 924, 200, 900]],
            botoes: [[236, 872], [262, 888], [288, 904]],
            escudo: 'M165,662 L235,662 L254,800 L146,800 Z',
            parafusos: [[172, 672], [228, 672], [246, 790], [154, 790]],
            texto: { x: 112, y: 905, rot: -70, max: 140, tam: 18 },
            simbolos: { inferior: [300, 945, 36], ombro: [270, 780, 26] }
        },
        agressiva: {
            esq: [['C', 170, 556, 146, 534, 126, 490], ['C', 112, 520, 78, 570, 68, 612], ['L', 92, 704], ['C', 70, 760, 44, 820, 48, 872],
                  ['L', 64, 966], ['C', 100, 944, 150, 944, 200, 952]],
            botoes: [[256, 874], [294, 882], [332, 890]],
            escudo: 'M124,636 C146,620 254,620 276,636 C288,646 290,700 286,760 C283,806 270,820 244,820 L156,820 C130,820 118,806 116,760 C112,700 114,646 124,636 Z',
            parafusos: [[134, 644], [266, 644], [278, 760], [160, 808], [240, 808], [124, 760]],
            texto: { x: 200, y: 934, rot: 0, max: 190, tam: 19 },
            simbolos: { inferior: [118, 898, 52], ombro: [102, 654, 32] }
        }
    };

    const absoluto = (inicio, segs) => {
        let p0 = inicio;
        return segs.map(s => {
            const o = s[0] === 'L'
                ? { t: 'L', p0, p: [s[1], s[2]] }
                : { t: 'C', p0, c1: [s[1], s[2]], c2: [s[3], s[4]], p: [s[5], s[6]] };
            p0 = o.p;
            return o;
        });
    };
    const m = p => [400 - p[0], p[1]];
    const espelhar = segs => segs.map(s => (s.t === 'L'
        ? { t: 'L', p0: m(s.p0), p: m(s.p) }
        : { t: 'C', p0: m(s.p0), c1: m(s.c1), c2: m(s.c2), p: m(s.p) }));
    const reverter = segs => segs.slice().reverse().map(s => (s.t === 'L'
        ? { t: 'L', p0: s.p, p: s.p0 }
        : { t: 'C', p0: s.p, c1: s.c2, c2: s.c1, p: s.p0 }));
    const trecho = s => (s.t === 'L' ? `L${f(s.p[0])},${f(s.p[1])}` : `C${f(s.c1[0])},${f(s.c1[1])} ${f(s.c2[0])},${f(s.c2[1])} ${f(s.p[0])},${f(s.p[1])}`);

    const cacheCaminho = {};
    const caminhoCorpo = id => {
        if (cacheCaminho[id]) return cacheCaminho[id];
        const def = CORPOS[id];
        const ini = [200, 552];
        const esq = absoluto(ini, def.esq);
        const dir = def.dir ? absoluto(ini, def.dir) : espelhar(esq);
        const d = `M${ini[0]},${ini[1]} ` + esq.map(trecho).join(' ') + ' ' + reverter(dir).map(trecho).join(' ') + ' Z';
        return (cacheCaminho[id] = d);
    };

    /* ---------- símbolos (caixa 100 x 100) ---------- */
    const SIMBOLOS = {
        raio: 'M58,0 L18,56 L44,56 L34,100 L82,38 L55,38 L70,0 Z',
        estrela: 'M50,4 L62,37 L97,38 L69,59 L79,93 L50,73 L21,93 L31,59 L3,38 L38,37 Z',
        chama: 'M52,0 C58,26 86,40 82,70 C79,90 62,100 50,100 C36,100 18,90 18,68 C18,50 32,44 38,28 C42,36 46,34 52,0 Z',
        nota: 'M44,8 L86,20 L86,40 L58,32 L58,78 A17,13 0 1 1 44,66 Z',
        coracao: 'M50,92 C8,62 -2,34 22,18 C38,8 50,22 50,30 C50,22 62,8 78,18 C102,34 92,62 50,92 Z',
        coroa: 'M8,82 L2,28 L30,54 L50,12 L70,54 L98,28 L92,82 Z'
    };
    G.SIMBOLOS = SIMBOLOS;

    G.simbolo = (id, cor, tam = 60) => {
        if (!SIMBOLOS[id]) return '';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 108 108" width="${tam}" height="${tam}"><path d="${SIMBOLOS[id]}" fill="${cor}" stroke="${contraste(cor)}" stroke-opacity=".35" stroke-width="2" stroke-linejoin="round"/></svg>`;
    };

    /* ---------- gradientes ---------- */
    const gradMetal = (id, h) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${claro(h, 0.4)}"/><stop offset=".35" stop-color="${h}"/><stop offset=".65" stop-color="${escuro(h, 0.3)}"/><stop offset="1" stop-color="${claro(h, 0.22)}"/></linearGradient>`;

    /* ---------- pintura do corpo ---------- */
    function veios(op, d) {
        let s = '';
        for (let i = 0; i < 48; i++) {
            const x0 = 30 + i * 7.1 + (i % 3) * 0.7;
            const a = ((i * 37) % 11 - 5) * 1.2;
            const larg = 0.7 + (((i * 13) % 7) / 7) * 1.5;
            const opac = (0.1 + (((i * 29) % 10) / 100)) * op.contraste;
            s += `<path d="M${f(x0)},460 C${f(x0 + a * 3)},620 ${f(x0 - a * 4)},800 ${f(x0 + a * 2)},990" stroke="${op.veio}" stroke-opacity="${opac.toFixed(3)}" stroke-width="${larg.toFixed(2)}" fill="none"/>`;
        }
        return s;
    }

    function pinturaCorpo(c, u) {
        const ac = c.acabamento;
        const corBase = P.opcao('cor', c.cor).hex;
        let defs = '', fill = corBase, base = corBase, extra = '';

        const brilho = (forca) => `<linearGradient id="${u}gl" x1="0" y1="0" x2="1" y2=".55"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff" stop-opacity="${forca}"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#fff" stop-opacity="${f(forca * 0.35)}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;

        if (ac === 'madeira') {
            const w = P.opcao('madeira', c.madeira);
            base = w.hex;
            defs += `<linearGradient id="${u}gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${claro(base, 0.1)}"/><stop offset=".6" stop-color="${base}"/><stop offset="1" stop-color="${escuro(base, 0.14)}"/></linearGradient>`;
            fill = `url(#${u}gb)`;
            extra += veios(w) + `<rect x="0" y="460" width="400" height="540" fill="url(#${u}gl)"/>`;
            defs += brilho(0.3);
        } else if (ac === 'degrade') {
            const c2 = P.opcao('cor2', c.cor2).hex;
            defs += `<radialGradient id="${u}gd" gradientUnits="userSpaceOnUse" cx="200" cy="770" r="270"><stop offset="0" stop-color="${claro(corBase, 0.08)}"/><stop offset=".35" stop-color="${corBase}"/><stop offset="1" stop-color="${c2}"/></radialGradient>`;
            fill = `url(#${u}gd)`;
            defs += brilho(0.34);
            extra += `<rect x="0" y="460" width="400" height="540" fill="url(#${u}gl)"/>`;
        } else if (ac === 'metalica') {
            defs += `<linearGradient id="${u}gm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${claro(corBase, 0.38)}"/><stop offset=".3" stop-color="${corBase}"/><stop offset=".55" stop-color="${escuro(corBase, 0.28)}"/><stop offset=".8" stop-color="${corBase}"/><stop offset="1" stop-color="${claro(corBase, 0.26)}"/></linearGradient>`;
            defs += `<pattern id="${u}sp" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".7" fill="#fff" fill-opacity=".55"/><circle cx="5" cy="4.6" r=".5" fill="#fff" fill-opacity=".35"/></pattern>`;
            fill = `url(#${u}gm)`;
            defs += brilho(0.4);
            extra += `<rect x="0" y="460" width="400" height="540" fill="url(#${u}sp)" opacity=".55"/><rect x="0" y="460" width="400" height="540" fill="url(#${u}gl)"/>`;
        } else if (ac === 'fosca') {
            fill = mix(corBase, '#8a8a8a', 0.12);
            base = fill;
            defs += `<linearGradient id="${u}gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>`;
            extra += `<rect x="0" y="460" width="400" height="540" fill="url(#${u}gl)"/>`;
        } else { // brilhante
            defs += brilho(0.45);
            extra += `<rect x="0" y="460" width="400" height="540" fill="url(#${u}gl)"/>`;
        }
        return { defs, fill, base, extra };
    }

    /* cor “plana” do corpo (usada na cabeça combinando) */
    const corPlana = c => (c.acabamento === 'madeira' ? P.opcao('madeira', c.madeira).hex : P.opcao('cor', c.cor).hex);

    /* ---------- peças ---------- */
    function braco(c, u, fm) {
        const hNeck = P.opcao('bracoMadeira', c.bracoMadeira).hex;
        const hEsc = P.opcao('escala', c.escala).hex;
        const hFim = FIM_ESCALA;
        const meiaNeck = y => meiaEscala(y) + 6;

        const neck = `M${f(CENTRO - meiaNeck(PESTANA))},${PESTANA} L${f(CENTRO + meiaNeck(PESTANA))},${PESTANA} L${f(CENTRO + meiaNeck(hFim))},${hFim} L${f(CENTRO - meiaNeck(hFim))},${hFim} Z`;
        const esc = `M${f(CENTRO - meiaEscala(PESTANA))},${PESTANA} L${f(CENTRO + meiaEscala(PESTANA))},${PESTANA} L${f(CENTRO + meiaEscala(hFim))},${hFim} L${f(CENTRO - meiaEscala(hFim))},${hFim} Z`;

        let s = `<path d="${neck}" fill="${hNeck}" stroke="${escuro(hNeck, 0.45)}" stroke-width="1"/>`;
        s += `<path d="${esc}" fill="${hEsc}" stroke="${escuro(hEsc, 0.4)}" stroke-width=".8"/>`;
        s += `<path d="${esc}" fill="url(#${u}fb)" />`;

        // marcações
        const claroTab = lum(hEsc) < 0.35;
        const corMarca = claroTab ? '#efe6cf' : '#2a2a2a';
        const centros = n => (fretY(n - 1) + fretY(n)) / 2;
        const tipo = c.marcacoes;
        if (tipo !== 'nenhuma') {
            [3, 5, 7, 9, 12, 15, 17, 19, 21].forEach(n => {
                const y = centros(n);
                const duplo = n === 12;
                if (tipo === 'pontos') {
                    const xs = duplo ? [-9, 9] : [0];
                    xs.forEach(dx => { s += `<circle cx="${CENTRO + dx}" cy="${f(y)}" r="3.4" fill="${corMarca}" fill-opacity=".92"/>`; });
                } else {
                    const larg = meiaEscala(y) * 1.1;
                    if (duplo) {
                        [-1, 1].forEach(sg => { s += `<rect x="${f(CENTRO + sg * larg * 0.42 - 3.5)}" y="${f(y - 5)}" width="7" height="10" rx="1.2" fill="${corMarca}" fill-opacity=".92"/>`; });
                    } else {
                        s += `<rect x="${f(CENTRO - larg / 2)}" y="${f(y - 4.5)}" width="${f(larg)}" height="9" rx="1.5" fill="${corMarca}" fill-opacity=".92"/>`;
                    }
                }
            });
        }
        // marcações laterais
        [3, 5, 7, 9, 12, 15, 17, 19, 21].forEach(n => {
            const y = centros(n);
            s += `<circle cx="${f(CENTRO - meiaNeck(y) + 3)}" cy="${f(y)}" r="1.1" fill="${claro(hNeck, 0.5)}"/>`;
        });
        // trastes
        for (let n = 1; n <= 22; n++) {
            const y = fretY(n);
            const h = meiaEscala(y);
            s += `<line x1="${f(CENTRO - h)}" y1="${f(y)}" x2="${f(CENTRO + h)}" y2="${f(y)}" stroke="url(#${u}tr)" stroke-width="1.7" stroke-linecap="round"/>`;
        }
        // pestana
        s += `<rect x="${f(CENTRO - meiaEscala(PESTANA) - 1)}" y="${PESTANA - 3}" width="${f(2 * meiaEscala(PESTANA) + 2)}" height="5" rx="1" fill="#ece5d0" stroke="#a79f88" stroke-width=".6"/>`;
        return s;
    }

    function cabeca(c, u, fm) {
        const op = c.cabeca;
        let cor = P.opcao('bracoMadeira', c.bracoMadeira).hex;
        if (op === 'combinando') cor = corPlana(c);
        if (op === 'preta') cor = '#141416';
        const d = 'M168,152 L162,104 C158,60 160,26 172,18 L228,18 C240,26 242,60 238,104 L232,152 Z';
        let s = `<path d="${d}" fill="${cor}" stroke="${escuro(cor, 0.5)}" stroke-width="1.2" stroke-linejoin="round"/>`;
        s += `<path d="${d}" fill="url(#${u}hb)"/>`;
        return { s, cor };
    }

    function tarraxas(c, u, fm) {
        const travada = c.tarraxas === 'travadas';
        const postes = [[180, 112, -1], [180, 76, -1], [180, 40, -1], [220, 40, 1], [220, 76, 1], [220, 112, 1]];
        let s = '';
        postes.forEach(([x, y, lado]) => {
            const bx = x + lado * 26;
            s += `<rect x="${f(Math.min(x, bx))}" y="${y - 2.2}" width="${Math.abs(bx - x)}" height="4.4" rx="2" fill="url(#${u}mt)" stroke="${escuro(fm, 0.5)}" stroke-width=".6"/>`;
            if (travada) {
                s += `<rect x="${f(bx + lado * 3 - 7.5)}" y="${y - 9}" width="15" height="18" rx="7" fill="url(#${u}mt)" stroke="${escuro(fm, 0.55)}" stroke-width=".9"/>`;
                s += `<circle cx="${f(bx + lado * 3)}" cy="${y}" r="3.4" fill="${escuro(fm, 0.35)}" stroke="${claro(fm, 0.3)}" stroke-width=".8"/>`;
            } else {
                s += `<ellipse cx="${f(bx + lado * 4)}" cy="${y}" rx="6.5" ry="9" fill="url(#${u}mt)" stroke="${escuro(fm, 0.55)}" stroke-width=".9"/>`;
                s += `<line x1="${f(bx + lado * 4 - 3)}" y1="${y}" x2="${f(bx + lado * 4 + 3)}" y2="${y}" stroke="${escuro(fm, 0.45)}" stroke-width="1.1" stroke-linecap="round"/>`;
            }
            s += `<circle cx="${x}" cy="${y}" r="4.6" fill="${claro(fm, 0.25)}" stroke="${escuro(fm, 0.6)}" stroke-width="1"/><circle cx="${x}" cy="${y}" r="1.6" fill="${escuro(fm, 0.65)}"/>`;
        });
        return s;
    }

    function captador(tipo, cx, cy, capa, u, comCavidade) {
        const sp = espCorda(cy);
        const humb = tipo === 'H';
        const w = 5 * sp + (humb ? 20 : 16);
        const h = humb ? 36 : 15;
        let s = '';
        if (comCavidade) s += `<rect x="${f(cx - w / 2 - 6)}" y="${f(cy - h / 2 - 6)}" width="${f(w + 12)}" height="${h + 12}" rx="${humb ? 9 : 8}" fill="#000" fill-opacity=".42"/>`;
        const fillCapa = capa.metal ? `url(#${u}pm)` : capa.hex;
        s += `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${h}" rx="${humb ? 6 : 7}" fill="${fillCapa}" stroke="${escuro(capa.hex, 0.55)}" stroke-width="1"/>`;
        if (capa.metal) {
            s += humb
                ? `<line x1="${f(cx - w / 2 + 4)}" y1="${cy}" x2="${f(cx + w / 2 - 4)}" y2="${cy}" stroke="${escuro(capa.hex, 0.45)}" stroke-width="1"/>`
                : '';
            s += `<circle cx="${f(cx - w / 2 + 6)}" cy="${cy}" r="1.7" fill="${escuro(capa.hex, 0.5)}"/><circle cx="${f(cx + w / 2 - 6)}" cy="${cy}" r="1.7" fill="${escuro(capa.hex, 0.5)}"/>`;
        } else if (humb) {
            for (let i = 0; i < 6; i++) {
                const x = cordaX(i, cy);
                s += `<circle cx="${f(x)}" cy="${cy - 8}" r="2.7" fill="#cdd1d7" stroke="#6b6e73" stroke-width=".7"/><line x1="${f(x - 1.6)}" y1="${cy - 8}" x2="${f(x + 1.6)}" y2="${cy - 8}" stroke="#6b6e73" stroke-width=".7"/>`;
                s += `<circle cx="${f(x)}" cy="${cy + 8}" r="2.7" fill="#8f949b" stroke="#55585d" stroke-width=".7"/>`;
            }
        } else {
            for (let i = 0; i < 6; i++) {
                const x = cordaX(i, cy);
                s += `<circle cx="${f(x)}" cy="${cy}" r="3" fill="#cdd1d7" stroke="#6b6e73" stroke-width=".8"/>`;
            }
        }
        s += `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(h / 2)}" rx="${humb ? 6 : 7}" fill="url(#${u}pk)"/>`;
        return s;
    }

    function captadores(c, u) {
        const capa = P.opcao('capCor', c.capCor);
        const layouts = {
            HH: [['H', 690], ['H', 790]],
            SSS: [['S', 690], ['S', 740], ['S', 790]],
            HSS: [['S', 690], ['S', 738], ['H', 790]]
        };
        const semEscudo = c.escudo === 'nenhum';
        return layouts[c.capConfig].map(([t, y]) => captador(t, CENTRO, y, capa, u, semEscudo)).join('');
    }

    function ponte(c, u, fm) {
        const t = c.ponte;
        const metal = `url(#${u}mt)`;
        const traco = escuro(fm, 0.55);
        let s = '', fim = 842;
        const sela = (y, w, h) => [0, 1, 2, 3, 4, 5].map(i => `<rect x="${f(cordaX(i, Y_PONTE) - w / 2)}" y="${y}" width="${w}" height="${h}" rx="1.8" fill="${claro(fm, 0.25)}" stroke="${traco}" stroke-width=".7"/>`).join('');

        if (t === 'fixa') {
            s += `<rect x="170" y="822" width="60" height="28" rx="3" fill="${metal}" stroke="${traco}" stroke-width="1"/>`;
            s += sela(826, 8, 17);
            s += `<circle cx="176" cy="846" r="1.7" fill="${traco}"/><circle cx="224" cy="846" r="1.7" fill="${traco}"/>`;
            fim = 842;
        } else if (t === 'tunematic') {
            s += `<rect x="166" y="812" width="68" height="11" rx="3" fill="${metal}" stroke="${traco}" stroke-width="1"/>`;
            s += [0, 1, 2, 3, 4, 5].map(i => `<circle cx="${f(cordaX(i, Y_PONTE))}" cy="817.5" r="3" fill="${claro(fm, 0.3)}" stroke="${traco}" stroke-width=".7"/>`).join('');
            s += `<circle cx="158" cy="817" r="5.5" fill="${metal}" stroke="${traco}"/><circle cx="242" cy="817" r="5.5" fill="${metal}" stroke="${traco}"/>`;
            s += `<rect x="172" y="866" width="56" height="22" rx="5" fill="${metal}" stroke="${traco}" stroke-width="1"/>`;
            s += [0, 1, 2, 3, 4, 5].map(i => `<circle cx="${f(cordaX(i, 877))}" cy="877" r="2" fill="${escuro(fm, 0.7)}"/>`).join('');
            fim = 877;
        } else { // tremolo e travavel
            s += `<rect x="166" y="806" width="68" height="62" rx="3" fill="${metal}" stroke="${traco}" stroke-width="1"/>`;
            s += `<rect x="176" y="852" width="48" height="10" rx="2" fill="${escuro(fm, 0.35)}" fill-opacity=".55"/>`;
            s += sela(818, 8, 15);
            s += `<circle cx="172" cy="812" r="2" fill="${traco}"/><circle cx="228" cy="812" r="2" fill="${traco}"/><circle cx="172" cy="862" r="2" fill="${traco}"/><circle cx="228" cy="862" r="2" fill="${traco}"/>`;
            if (t === 'travavel') {
                s += [0, 1, 2, 3, 4, 5].map(i => `<rect x="${f(cordaX(i, Y_PONTE) - 3.5)}" y="801" width="7" height="9" rx="2" fill="${claro(fm, 0.2)}" stroke="${traco}" stroke-width=".7"/>`).join('');
            }
            fim = 836;
        }
        return { s, fim };
    }

    function pestanaTravavel(u, fm) {
        return `<rect x="${f(CENTRO - meiaEscala(PESTANA) - 2)}" y="${PESTANA - 10}" width="${f(2 * meiaEscala(PESTANA) + 4)}" height="12" rx="2" fill="#222226" stroke="#0a0a0b"/><circle cx="188" cy="${PESTANA - 4}" r="2" fill="${fm}"/><circle cx="212" cy="${PESTANA - 4}" r="2" fill="${fm}"/>`;
    }

    function cordas(c, u, fim) {
        const larguras = [2.0, 1.7, 1.4, 1.1, 0.95, 0.8];
        const alvos = [[180, 112], [180, 76], [180, 40], [220, 40], [220, 76], [220, 112]];
        let s = '';
        for (let i = 0; i < 6; i++) {
            const x0 = cordaX(i, PESTANA), x1 = cordaX(i, fim);
            // trecho sobre a cabeça (do pino até a pestana)
            s += `<line x1="${f(x0)}" y1="${PESTANA}" x2="${alvos[i][0]}" y2="${alvos[i][1]}" stroke="#dcdfe3" stroke-opacity=".7" stroke-width="${f(larguras[i] * 0.6)}"/>`;
            s += `<line x1="${f(x0)}" y1="${PESTANA}" x2="${f(x1)}" y2="${fim}" stroke="#e6e8eb" stroke-width="${larguras[i]}" stroke-linecap="round"/>`;
            s += `<line x1="${f(x0 + 0.9)}" y1="${PESTANA}" x2="${f(x1 + 0.9)}" y2="${fim}" stroke="#000" stroke-opacity=".18" stroke-width=".7"/>`;
        }
        return s;
    }

    function botoes(c, u, forma) {
        const b = P.opcao('botoes', c.botoes);
        let s = '';
        forma.botoes.forEach(([x, y], i) => {
            const base = b.metal ? `url(#${u}bm)` : b.hex;
            s += `<circle cx="${x}" cy="${y}" r="14" fill="#000" fill-opacity=".35"/>`;
            s += `<circle cx="${x}" cy="${y}" r="12.5" fill="${base}" stroke="${escuro(b.hex, 0.55)}" stroke-width="1"/>`;
            s += `<circle cx="${x}" cy="${y}" r="8.5" fill="${claro(b.hex, b.metal ? 0.12 : 0.1)}" fill-opacity=".9" stroke="${escuro(b.hex, 0.4)}" stroke-width=".6"/>`;
            const ang = (-40 + i * 25) * Math.PI / 180;
            s += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + Math.sin(ang) * 11)}" y2="${f(y - Math.cos(ang) * 11)}" stroke="${contraste(b.hex)}" stroke-width="1.8" stroke-linecap="round"/>`;
            if (b.metal) for (let k = 0; k < 12; k++) {
                const a = (k * 30) * Math.PI / 180;
                s += `<line x1="${f(x + Math.sin(a) * 9.6)}" y1="${f(y - Math.cos(a) * 9.6)}" x2="${f(x + Math.sin(a) * 12.3)}" y2="${f(y - Math.cos(a) * 12.3)}" stroke="${escuro(b.hex, 0.45)}" stroke-width=".8"/>`;
            }
        });
        return s;
    }

    function escudo(c, u, forma) {
        if (c.escudo === 'nenhum') return '';
        const o = P.opcao('escudo', c.escudo);
        let fill = o.hex;
        if (c.escudo === 'tortoise') fill = `url(#${u}tt)`;
        if (c.escudo === 'espelhado') fill = `url(#${u}es)`;
        let s = `<path d="${forma.escudo}" fill="#000" fill-opacity=".3" transform="translate(1.5,2.5)"/>`;
        s += `<path d="${forma.escudo}" fill="${fill}" stroke="${escuro(o.hex, 0.5)}" stroke-width="1.2" stroke-linejoin="round"/>`;
        if (c.escudo === 'tortoise') {
            const manchas = [[150, 640, 14], [236, 662, 11], [180, 720, 16], [262, 760, 12], [140, 790, 12], [220, 830, 15], [286, 840, 9], [168, 668, 7]];
            s += `<g clip-path="url(#${u}pg)">` + manchas.map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * 1.4)}" fill="#1b0d06" fill-opacity=".38" transform="rotate(${(x + y) % 50 - 25} ${x} ${y})"/>`).join('') + '</g>';
        }
        s += forma.parafusos.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#c9cdd3" stroke="#5a5d62" stroke-width=".8"/><line x1="${x - 1.6}" y1="${y - 1.6}" x2="${x + 1.6}" y2="${y + 1.6}" stroke="#5a5d62" stroke-width=".7"/>`).join('');
        return s;
    }

    function decoracao(c, u, forma, corCabeca) {
        let s = '';
        const fonte = P.opcao('textoFonte', c.textoFonte);
        const corTexto = P.opcao('textoCor', c.textoCor).hex;

        if (c.simbolo !== 'nenhum' && SIMBOLOS[c.simbolo]) {
            const corS = P.opcao('simboloCor', c.simboloCor).hex;
            let x, y, tam;
            if (c.simboloPos === 'cabeca') { x = 200; y = 50; tam = 26; }
            else { [x, y, tam] = forma.simbolos[c.simboloPos] || forma.simbolos.inferior; }
            s += `<g transform="translate(${f(x - tam / 2)} ${f(y - tam / 2)}) scale(${f(tam / 100)})"><path d="${SIMBOLOS[c.simbolo]}" fill="${corS}" stroke="${contraste(corS)}" stroke-opacity=".4" stroke-width="3" stroke-linejoin="round"/></g>`;
        }

        const texto = (str, x, y, rot, max, tam) => {
            const natural = str.length * tam * 0.62;
            const ajuste = natural > max ? ` textLength="${max}" lengthAdjust="spacingAndGlyphs"` : '';
            const tr = rot ? ` transform="rotate(${rot} ${x} ${y})"` : '';
            return `<text x="${x}" y="${y}"${tr} text-anchor="middle" font-family='${fonte.familia}' font-weight="${fonte.peso}" font-size="${tam}" fill="${corTexto}" stroke="${contraste(corTexto)}" stroke-opacity=".28" stroke-width=".6" paint-order="stroke"${ajuste}>${esc(str)}</text>`;
        };

        if (c.textoCorpo) {
            const t = forma.texto;
            s += texto(c.textoCorpo, t.x, t.y, t.rot, t.max, t.tam);
        }
        if (c.textoCabeca) {
            s += texto(c.textoCabeca, 200, 104, -90, 66, 12);
        }
        return s;
    }

    /* ---------- conteúdo completo ---------- */
    G.conteudo = (entrada, uid) => {
        const c = P.normalizar(entrada);
        const u = uid || `g${++contador}_`;
        const forma = CORPOS[c.formato];
        const dCorpo = caminhoCorpo(c.formato);
        const pint = pinturaCorpo(c, u);
        const fm = P.opcao('ferragemCor', c.ferragemCor).hex;
        const capa = P.opcao('capCor', c.capCor);
        const bt = P.opcao('botoes', c.botoes);
        const hEsc = P.opcao('escala', c.escala).hex;

        let defs = '';
        defs += `<filter id="${u}sh" x="-20%" y="-5%" width="140%" height="112%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#000" flood-opacity=".5"/></filter>`;
        defs += `<clipPath id="${u}cp"><path d="${dCorpo}"/></clipPath>`;
        defs += `<clipPath id="${u}pg"><path d="${forma.escudo}"/></clipPath>`;
        defs += pint.defs;
        defs += gradMetal(`${u}mt`, fm);
        if (capa.metal) defs += gradMetal(`${u}pm`, capa.hex);
        if (bt.metal) defs += gradMetal(`${u}bm`, bt.hex);
        defs += `<linearGradient id="${u}tr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f2f4"/><stop offset="1" stop-color="#a9adb4"/></linearGradient>`;
        defs += `<linearGradient id="${u}fb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>`;
        defs += `<linearGradient id="${u}hb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`;
        defs += `<linearGradient id="${u}pk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
        if (c.escudo === 'tortoise') defs += `<linearGradient id="${u}tt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a1d0e"/><stop offset=".35" stop-color="#b8661f"/><stop offset=".6" stop-color="#7a3d14"/><stop offset="1" stop-color="#2d160a"/></linearGradient>`;
        if (c.escudo === 'espelhado') defs += `<linearGradient id="${u}es" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6f9"/><stop offset=".3" stop-color="#8d95a1"/><stop offset=".55" stop-color="#e3e7ec"/><stop offset="1" stop-color="#737b87"/></linearGradient>`;

        const { s: sCabeca, cor: corCabeca } = cabeca(c, u, fm);
        const pt = ponte(c, u, fm);
        let s = `<defs>${defs}</defs>`;

        // 1. corpo
        s += `<g filter="url(#${u}sh)"><path d="${dCorpo}" fill="${pint.fill}"/></g>`;
        s += `<g clip-path="url(#${u}cp)">${pint.extra}<path d="${dCorpo}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="8"/></g>`;
        s += `<path d="${dCorpo}" fill="none" stroke="${escuro(pint.base, 0.55)}" stroke-width="1.6" stroke-linejoin="round"/>`;
        // 2. escudo
        s += escudo(c, u, forma);
        // 3. braço e cabeça
        s += `<g filter="url(#${u}sh)" opacity="1">${braco(c, u, fm)}</g>`;
        s += sCabeca;
        if (c.ponte === 'travavel') s += pestanaTravavel(u, fm);
        // 4. captadores e ponte
        s += captadores(c, u);
        s += pt.s;
        // 5. cordas
        s += cordas(c, u, pt.fim);
        // 6. tarraxas e botões
        s += tarraxas(c, u, fm);
        s += botoes(c, u, forma);
        // 7. adesivos e nomes
        s += decoracao(c, u, forma, corCabeca);
        return s;
    };

    G.svg = (cfg, op = {}) => {
        const vb = op.viewBox || '0 0 400 1000';
        const tam = op.largura ? ` width="${op.largura}" height="${op.altura}"` : '';
        const cls = op.classe ? ` class="${op.classe}"` : '';
        const rotulo = op.rotulo ? ` role="img" aria-label="${esc(op.rotulo)}"` : ' aria-hidden="true"';
        const fundo = op.fundo ? `<rect x="-1000" y="-1000" width="3000" height="3000" fill="${op.fundo}"/>` : '';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${tam}${cls}${rotulo}>${fundo}${G.conteudo(cfg, op.uid)}</svg>`;
    };

    G.dataUrl = cfg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(G.svg(cfg, { viewBox: '10 440 380 560' }));

    /* ---------- imagem PNG ---------- */
    G.png = (cfg, op = {}) => new Promise((ok, falha) => {
        const L = op.largura || 900, A = op.altura || 1400;
        const svg = G.svg(cfg, { uid: 'png_', viewBox: '-30 -10 460 1020' });
        const img = new Image();
        img.onload = () => {
            try {
                const cv = document.createElement('canvas');
                cv.width = L; cv.height = A;
                const x = cv.getContext('2d');
                const fundo = x.createRadialGradient(L / 2, A * 0.55, 80, L / 2, A * 0.55, A * 0.8);
                fundo.addColorStop(0, '#2a1d20'); fundo.addColorStop(1, '#0d0a0b');
                x.fillStyle = fundo; x.fillRect(0, 0, L, A);

                const altG = A - 330, larG = altG * (460 / 1020);
                x.drawImage(img, (L - larG) / 2, 200, larG, altG);

                x.fillStyle = '#b5121b'; x.fillRect(60, 70, 54, 5);
                x.fillStyle = '#f4ecec'; x.textAlign = 'left';
                x.font = '700 54px Georgia, serif';
                x.fillText((op.nome || 'Guitarra personalizada').slice(0, 28), 60, 140);
                x.font = '500 24px Arial, sans-serif'; x.fillStyle = '#b8a9ab';
                x.fillText(P.resumo(P.normalizar(cfg)), 60, 180);

                x.textAlign = 'center';
                x.font = '700 30px Georgia, serif'; x.fillStyle = '#f4ecec';
                x.fillText('Style Guitar', L / 2, A - 80);
                if (typeof op.preco === 'number') {
                    x.font = '500 22px Arial, sans-serif'; x.fillStyle = '#d9a441';
                    x.fillText('Valor demonstrativo: ' + SG.moeda(op.preco), L / 2, A - 40);
                }
                cv.toBlob(b => (b ? ok(b) : falha(new Error('Não foi possível gerar o PNG'))), 'image/png');
            } catch (e) { falha(e); }
        };
        img.onerror = () => falha(new Error('Não foi possível desenhar a guitarra'));
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });

    G.CORPOS = Object.keys(CORPOS);
    G.util = { claro, escuro, contraste, mix };
    SG.Guitarra = G;
})();
