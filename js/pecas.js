/* ==========================================================
   PEÇAS – js/pecas.js
   Catálogo de componentes do personalizador + cálculo do orçamento.

   >>> TODOS OS PREÇOS DAQUI SÃO DEMONSTRATIVOS (DEMO = true). <<<
   Para usar preços reais, edite os campos `preco` abaixo (ou carregue
   o catálogo de um servidor) e mude DEMO para false.

   Estrutura:
     CATEGORIAS[]  -> abas do personalizador
       .grupos[]   -> escolhas dentro da aba (ex.: "Formato do corpo")
         .opcoes[] -> peças (nome, descrição, preço adicional, características)
   O desenho de cada peça está em js/guitarra.js (usa os campos hex, etc.).
   ========================================================== */
(() => {
    'use strict';

    const SG = (window.SG = window.SG || {});
    const DEMO = true;

    const BASE = {
        nome: 'Preço-base da guitarra',
        preco: 2800,
        detalhe: 'Corpo, braço, captadores, ponte e ferragens padrão'
    };

    /* ---------- cores ---------- */
    const CORES = [
        { id: 'rubi',     nome: 'Vermelho Rubi',     hex: '#b5121b' },
        { id: 'onix',     nome: 'Preto Ônix',        hex: '#17171b' },
        { id: 'perola',   nome: 'Branco Pérola',     hex: '#efe9dc' },
        { id: 'noite',    nome: 'Azul Noite',        hex: '#1c3a78' },
        { id: 'oceano',   nome: 'Azul Oceano',       hex: '#1b86a8' },
        { id: 'floresta', nome: 'Verde Floresta',    hex: '#1f5a3a' },
        { id: 'sol',      nome: 'Laranja Pôr do Sol', hex: '#e8791f' },
        { id: 'ouro',     nome: 'Amarelo Ouro',      hex: '#e3b52c' },
        { id: 'ametista', nome: 'Roxo Ametista',     hex: '#5a2a86' },
        { id: 'pink',     nome: 'Rosa Pink',         hex: '#d9468a' },
        { id: 'grafite',  nome: 'Grafite',           hex: '#5b5f66' },
        { id: 'prata',    nome: 'Prata Lunar',       hex: '#b9bec6' }
    ];
    const opcoesCor = desc => CORES.map(c => ({ ...c, preco: 0, desc }));

    const COR_DECOR = [
        { id: 'branco',   nome: 'Branco',   hex: '#f6f1e6', preco: 0, desc: 'Contraste claro' },
        { id: 'preto',    nome: 'Preto',    hex: '#141416', preco: 0, desc: 'Contraste escuro' },
        { id: 'dourado',  nome: 'Dourado',  hex: '#d9a93c', preco: 0, desc: 'Brilho de latão' },
        { id: 'prata',    nome: 'Prata',    hex: '#c4c8cf', preco: 0, desc: 'Acabamento cromado' },
        { id: 'vermelho', nome: 'Vermelho', hex: '#d3202b', preco: 0, desc: 'Destaque da marca' }
    ];

    const O = (id, nome, preco, desc, extra = {}) => ({ id, nome, preco, desc, ...extra });

    /* ---------- catálogo ---------- */
    const CATEGORIAS = [
        {
            id: 'corpo', nome: 'Corpo', icone: 'fa-guitar',
            grupos: [
                {
                    id: 'formato', nome: 'Formato do corpo', recorte: [0, 470, 400, 520],
                    opcoes: [
                        O('dupla', 'Dupla cutaway', 0, 'Silhueta clássica de dois recortes, leve e equilibrada.', { carac: ['Acesso total aos agudos', 'Muito confortável'] }),
                        O('single', 'Single cut', 150, 'Corpo mais cheio, ombro arredondado e um recorte.', { carac: ['Sustain longo', 'Timbre encorpado'] }),
                        O('v', 'Estilo V', 220, 'Asas angulares para palco, visual agressivo.', { carac: ['Presença de palco', 'Toque em pé'] }),
                        O('agressiva', 'Agressiva', 260, 'Pontas afiadas e contornos extremos para o som pesado.', { carac: ['Design exclusivo', 'Ideal para metal'] })
                    ]
                },
                {
                    id: 'acabamento', nome: 'Acabamento', recorte: [0, 470, 400, 520],
                    opcoes: [
                        O('brilhante', 'Sólido brilhante', 0, 'Verniz de alto brilho, cor lisa.', { carac: ['Poliuretano', 'Alto brilho'] }),
                        O('fosca', 'Sólido fosco', 120, 'Aspecto acetinado, sem reflexo.', { carac: ['Toque aveludado', 'Esconde marcas'] }),
                        O('metalica', 'Metálico', 260, 'Pigmento metálico com brilho profundo.', { carac: ['Partículas metálicas', 'Verniz duplo'] }),
                        O('degrade', 'Degradê sunburst', 320, 'Centro claro escurecendo para as bordas.', { carac: ['Pintura em camadas', 'Visual vintage'] }),
                        O('madeira', 'Madeira natural', 380, 'Mostra os veios da madeira sob verniz.', { carac: ['Veios naturais', 'Cada peça é única'] })
                    ]
                },
                {
                    id: 'cor', nome: 'Cor do corpo', tipo: 'cor',
                    visivel: c => c.acabamento !== 'madeira',
                    opcoes: opcoesCor('Cor do corpo')
                },
                {
                    id: 'cor2', nome: 'Cor das bordas (degradê)', tipo: 'cor',
                    visivel: c => c.acabamento === 'degrade',
                    opcoes: opcoesCor('Cor das bordas do degradê')
                },
                {
                    id: 'madeira', nome: 'Madeira do corpo', recorte: [0, 470, 400, 520],
                    visivel: c => c.acabamento === 'madeira',
                    opcoes: [
                        O('maple', 'Maple', 0, 'Clara, veios finos e timbre brilhante.', { hex: '#d9b57a', veio: '#a8793e', contraste: 0.55 }),
                        O('ash', 'Ash (freixo)', 90, 'Veios marcantes, ataque definido.', { hex: '#cfa86d', veio: '#8a5a2a', contraste: 1 }),
                        O('mogno', 'Mogno', 140, 'Avermelhado, som quente e cheio.', { hex: '#7a4630', veio: '#3d1d10', contraste: 0.7 }),
                        O('nogueira', 'Nogueira', 210, 'Escura, veios profundos e graves firmes.', { hex: '#5a3a28', veio: '#241109', contraste: 0.85 })
                    ]
                }
            ]
        },
        {
            id: 'braco', nome: 'Braço e escala', icone: 'fa-ruler-vertical',
            grupos: [
                {
                    id: 'bracoMadeira', nome: 'Madeira do braço', recorte: [130, 10, 140, 330],
                    opcoes: [
                        O('maple', 'Maple natural', 0, 'Clara e rígida, toque rápido.', { hex: '#d8b878', carac: ['Estável', 'Brilho nos agudos'] }),
                        O('torrado', 'Maple torrado', 120, 'Tratado termicamente, tom caramelo.', { hex: '#b07a3c', carac: ['Mais estável', 'Toque liso'] }),
                        O('mogno', 'Mogno', 100, 'Braço escuro e confortável.', { hex: '#7e4b2c', carac: ['Som quente', 'Peso médio'] }),
                        O('ebanizado', 'Maple ebanizado', 220, 'Tingido de preto, visual noturno.', { hex: '#232226', carac: ['Visual escuro', 'Alta rigidez'] })
                    ]
                },
                {
                    id: 'escala', nome: 'Escala', recorte: [150, 330, 100, 220],
                    opcoes: [
                        O('jacaranda', 'Jacarandá', 0, 'Marrom-escura, toque macio.', { hex: '#4b2a1d', carac: ['Ataque suave', 'Veios discretos'] }),
                        O('ebano', 'Ébano', 160, 'Preta e densa, notas definidas.', { hex: '#1a1411', carac: ['Muito dura', 'Brilho intenso'] }),
                        O('maple', 'Maple', 0, 'Clara, verniz acetinado.', { hex: '#ddc08a', carac: ['Ataque brilhante', 'Toque rápido'] }),
                        O('pauferro', 'Pau-ferro', 80, 'Avermelhada, meio-termo entre jacarandá e ébano.', { hex: '#5d3a2a', carac: ['Equilibrada', 'Resistente'] })
                    ]
                },
                {
                    id: 'marcacoes', nome: 'Marcações da escala', recorte: [150, 330, 100, 220],
                    opcoes: [
                        O('pontos', 'Pontos', 0, 'Marcações redondas clássicas.', { carac: ['Discretas'] }),
                        O('blocos', 'Blocos', 90, 'Blocos retangulares de destaque.', { carac: ['Leitura fácil', 'Visual premium'] }),
                        O('nenhuma', 'Sem marcações', 0, 'Escala limpa, só com as laterais marcadas.', { carac: ['Visual minimalista'] })
                    ]
                },
                {
                    id: 'cabeca', nome: 'Cabeça (headstock)', recorte: [120, 8, 160, 160],
                    opcoes: [
                        O('natural', 'Madeira do braço', 0, 'Cabeça na mesma madeira do braço.', { carac: ['Visual clássico'] }),
                        O('combinando', 'Combinando com o corpo', 180, 'Pintada na cor do corpo.', { carac: ['Conjunto único'] }),
                        O('preta', 'Preta', 90, 'Cabeça preta brilhante.', { carac: ['Visual moderno'] })
                    ]
                }
            ]
        },
        {
            id: 'captadores', nome: 'Captadores', icone: 'fa-wave-square',
            grupos: [
                {
                    id: 'capConfig', nome: 'Configuração', recorte: [90, 640, 220, 190],
                    opcoes: [
                        O('HH', 'HH – dois humbuckers', 0, 'Dois captadores duplos, sem ruído.', { carac: ['Silencioso', 'Rock, metal, blues'] }),
                        O('SSS', 'SSS – três single coils', 120, 'Três captadores simples, som cristalino.', { carac: ['Brilho e clareza', 'Funk, pop, country'] }),
                        O('HSS', 'HSS – humbucker + singles', 60, 'Humbucker na ponte e dois singles.', { carac: ['Versátil', 'Do clean ao lead'] })
                    ]
                },
                {
                    id: 'capModelo', nome: 'Modelo dos captadores', recorte: [90, 640, 220, 190],
                    opcoes: [
                        O('vintage', 'Vintage', 0, 'Saída baixa, timbre cristalino e dinâmico.', { carac: ['Saída baixa', 'Blues e jazz'], timbre: ['blues', 'jazz'] }),
                        O('equilibrado', 'Equilibrado Alnico', 180, 'Médios definidos, serve para quase tudo.', { carac: ['Saída média', 'Rock clássico'], timbre: ['rock', 'blues'] }),
                        O('altaSaida', 'Alta saída cerâmico', 260, 'Ataque forte e graves firmes.', { carac: ['Saída alta', 'Rock pesado'], timbre: ['rock', 'metal'] }),
                        O('ativo', 'Ativo (bateria 9V)', 420, 'Compressão natural e ganho preciso.', { carac: ['Ativo', 'Metal moderno'], timbre: ['metal'] })
                    ]
                },
                {
                    id: 'capCor', nome: 'Cor das capas', recorte: [90, 640, 220, 190],
                    opcoes: [
                        O('preto', 'Preta', 0, 'Capa plástica preta.', { hex: '#17171a' }),
                        O('branco', 'Branca', 0, 'Capa plástica branca.', { hex: '#f1ece0' }),
                        O('creme', 'Creme envelhecido', 30, 'Aspecto vintage.', { hex: '#e0d0a2' }),
                        O('cromado', 'Capa cromada', 90, 'Cobertura metálica cromada.', { hex: '#cfd3d9', metal: true }),
                        O('dourado', 'Capa dourada', 140, 'Cobertura metálica dourada.', { hex: '#d4a73a', metal: true })
                    ]
                }
            ]
        },
        {
            id: 'ferragens', nome: 'Ferragens', icone: 'fa-screwdriver-wrench',
            grupos: [
                {
                    id: 'ponte', nome: 'Ponte', recorte: [100, 780, 200, 130],
                    opcoes: [
                        O('fixa', 'Ponte fixa (hardtail)', 0, 'Afinação estável e ataque direto.', { carac: ['Sem tremolo', 'Muito estável'] }),
                        O('tremolo', 'Tremolo vintage', 220, 'Alavanca para vibratos suaves.', { carac: ['Vibrato clássico', '6 selas'] }),
                        O('tunematic', 'Tune-o-matic + stop tailpiece', 180, 'Conjunto de ponte e cordal clássicos.', { carac: ['Sustain longo', 'Regulagem de altura'] }),
                        O('travavel', 'Tremolo travável', 480, 'Mergulhos fundos sem desafinar.', { carac: ['Trava na pestana', 'Afinadores finos'] })
                    ]
                },
                {
                    id: 'ferragemCor', nome: 'Cor das ferragens', recorte: [100, 780, 200, 130],
                    opcoes: [
                        O('cromado', 'Cromado', 0, 'Brilho prateado clássico.', { hex: '#cfd3d9' }),
                        O('preto', 'Preto', 60, 'Visual discreto e agressivo.', { hex: '#2a2a2e' }),
                        O('dourado', 'Dourado', 120, 'Banho de ouro para destaque.', { hex: '#d4a73a' }),
                        O('niquel', 'Níquel envelhecido', 70, 'Aspecto de instrumento usado.', { hex: '#a29e94' })
                    ]
                },
                {
                    id: 'tarraxas', nome: 'Tarraxas', recorte: [110, 10, 180, 150],
                    opcoes: [
                        O('abertas', 'Abertas (vintage)', 0, 'Mecanismo aberto de relação 15:1.', { carac: ['Visual vintage', 'Leves'] }),
                        O('travadas', 'Travadas (locking)', 160, 'Troca de cordas rápida e afinação firme.', { carac: ['Trocas rápidas', 'Afinação firme'] })
                    ]
                },
                {
                    id: 'botoes', nome: 'Botões de controle', recorte: [220, 830, 180, 120],
                    opcoes: [
                        O('preto', 'Plástico preto', 0, 'Botões pretos com indicador.', { hex: '#18181b' }),
                        O('branco', 'Plástico branco', 0, 'Botões brancos com indicador.', { hex: '#f1ece0' }),
                        O('ambar', 'Âmbar translúcido', 40, 'Botões cor de âmbar.', { hex: '#d98a1f' }),
                        O('metal', 'Metal escovado', 70, 'Botões de metal com ranhuras.', { hex: '#b9bdc4', metal: true })
                    ]
                }
            ]
        },
        {
            id: 'escudo', nome: 'Escudo', icone: 'fa-shield-halved',
            grupos: [
                {
                    id: 'escudo', nome: 'Escudo (pickguard)', recorte: [60, 540, 280, 380],
                    opcoes: [
                        O('nenhum', 'Sem escudo', 0, 'Corpo limpo, captadores direto na madeira.', { carac: ['Visual limpo'] }),
                        O('branco', 'Branco', 80, 'Escudo de 3 camadas branco.', { hex: '#f3efe4', carac: ['3 camadas'] }),
                        O('preto', 'Preto', 80, 'Escudo preto de 3 camadas.', { hex: '#141416', carac: ['3 camadas'] }),
                        O('tortoise', 'Tartaruga', 140, 'Padrão tartaruga clássico.', { hex: '#8a4a1c', carac: ['Estilo vintage'] }),
                        O('espelhado', 'Espelhado', 180, 'Acabamento cromado espelhado.', { hex: '#c7ccd4', carac: ['Efeito espelho'] })
                    ]
                }
            ]
        },
        {
            id: 'decoracao', nome: 'Decoração', icone: 'fa-wand-magic-sparkles',
            grupos: [
                {
                    id: 'simbolo', nome: 'Adesivo / símbolo', tipo: 'simbolo',
                    opcoes: [
                        O('nenhum', 'Nenhum', 0, 'Sem adesivo.'),
                        O('raio', 'Raio', 60, 'Símbolo de energia.'),
                        O('estrela', 'Estrela', 60, 'Estrela de cinco pontas.'),
                        O('chama', 'Chama', 80, 'Chama estilizada.'),
                        O('nota', 'Nota musical', 60, 'Colcheia.'),
                        O('coracao', 'Coração', 60, 'Coração clássico.'),
                        O('coroa', 'Coroa', 90, 'Coroa real.')
                    ]
                },
                {
                    id: 'simboloCor', nome: 'Cor do adesivo', tipo: 'cor',
                    visivel: c => c.simbolo !== 'nenhum',
                    opcoes: COR_DECOR
                },
                {
                    id: 'simboloPos', nome: 'Posição do adesivo', recorte: [0, 470, 400, 520],
                    visivel: c => c.simbolo !== 'nenhum',
                    opcoes: [
                        O('inferior', 'Corpo – parte inferior', 0, 'Embaixo, no lado esquerdo.'),
                        O('ombro', 'Corpo – ombro', 0, 'Ao lado do braço.'),
                        O('cabeca', 'Cabeça', 0, 'No topo da cabeça.')
                    ]
                },
                {
                    id: 'texto', nome: 'Nome personalizado', tipo: 'texto',
                    campos: [
                        { id: 'textoCorpo', rotulo: 'Nome no corpo', max: 16, preco: 90, dica: 'Ex.: Matheus Custom' },
                        { id: 'textoCabeca', rotulo: 'Nome na cabeça', max: 10, preco: 70, dica: 'Ex.: LUMA' }
                    ]
                },
                {
                    id: 'textoCor', nome: 'Cor do nome', tipo: 'cor',
                    visivel: c => !!(c.textoCorpo || c.textoCabeca),
                    opcoes: COR_DECOR
                },
                {
                    id: 'textoFonte', nome: 'Estilo da letra', recorte: null,
                    visivel: c => !!(c.textoCorpo || c.textoCabeca),
                    opcoes: [
                        O('sans', 'Moderna', 0, 'Sem serifa em negrito.', { familia: 'Arial, Helvetica, sans-serif', peso: 800 }),
                        O('serif', 'Clássica', 0, 'Com serifa elegante.', { familia: 'Georgia, "Times New Roman", serif', peso: 700 }),
                        O('script', 'Manuscrita', 0, 'Estilo escrito à mão.', { familia: '"Brush Script MT", "Segoe Script", cursive', peso: 400 }),
                        O('mono', 'Técnica', 0, 'Letras de máquina de escrever.', { familia: '"Courier New", monospace', peso: 700 })
                    ]
                }
            ]
        }
    ];

    /* ---------- índices ---------- */
    const GRUPOS = {};
    CATEGORIAS.forEach(cat => cat.grupos.forEach(g => { g.categoria = cat.id; GRUPOS[g.id] = g; }));
    const CAMPOS_TEXTO = GRUPOS.texto.campos;

    const P = {};
    P.DEMO = DEMO;
    P.BASE = BASE;
    P.categorias = CATEGORIAS;
    P.grupos = GRUPOS;
    P.cores = CORES;

    P.opcao = (grupoId, valor) => {
        const g = GRUPOS[grupoId];
        if (!g) return null;
        return g.opcoes.find(o => o.id === valor) || g.opcoes[0];
    };

    P.visivel = (grupo, cfg) => (typeof grupo.visivel === 'function' ? !!grupo.visivel(cfg) : true);

    /* ---------- configuração padrão ---------- */
    P.padrao = () => ({
        formato: 'dupla', acabamento: 'brilhante', cor: 'rubi', cor2: 'onix', madeira: 'maple',
        bracoMadeira: 'maple', escala: 'jacaranda', marcacoes: 'pontos', cabeca: 'natural',
        capConfig: 'HH', capModelo: 'equilibrado', capCor: 'preto',
        ponte: 'fixa', ferragemCor: 'cromado', tarraxas: 'abertas', botoes: 'preto',
        escudo: 'nenhum',
        simbolo: 'nenhum', simboloCor: 'branco', simboloPos: 'inferior',
        textoCorpo: '', textoCabeca: '', textoCor: 'branco', textoFonte: 'sans'
    });

    /* Aceita qualquer objeto (link compartilhado, projeto antigo, etc.)
       e devolve uma configuração válida; o que não existir vira o padrão. */
    P.normalizar = entrada => {
        const base = P.padrao();
        const src = entrada && typeof entrada === 'object' ? entrada : {};
        const cfg = {};
        Object.keys(base).forEach(chave => {
            const g = GRUPOS[chave];
            if (g && g.opcoes) {
                cfg[chave] = g.opcoes.some(o => o.id === src[chave]) ? src[chave] : base[chave];
            } else {
                const campo = CAMPOS_TEXTO.find(c => c.id === chave);
                const bruto = typeof src[chave] === 'string' ? src[chave] : '';
                cfg[chave] = campo ? bruto.replace(/[<>&"]/g, '').trim().slice(0, campo.max) : base[chave];
            }
        });
        return cfg;
    };

    /* ---------- orçamento ---------- */
    P.orcamento = cfg => {
        const linhas = [];
        CATEGORIAS.forEach(cat => cat.grupos.forEach(g => {
            if (!P.visivel(g, cfg)) return;
            if (g.tipo === 'texto') {
                g.campos.forEach(campo => {
                    const texto = cfg[campo.id];
                    if (!texto) return;
                    linhas.push({
                        categoria: cat.nome, categoriaId: cat.id, grupoId: campo.id,
                        rotulo: campo.rotulo, peca: `“${texto}”`, detalhe: 'Gravação personalizada',
                        preco: campo.preco
                    });
                });
                return;
            }
            const o = P.opcao(g.id, cfg[g.id]);
            if (g.id === 'simbolo' && o.id === 'nenhum') return;
            linhas.push({
                categoria: cat.nome, categoriaId: cat.id, grupoId: g.id,
                rotulo: g.nome, peca: o.nome, detalhe: [o.desc].concat(o.carac || []).filter(Boolean).join(' · '),
                preco: o.preco
            });
        }));
        const adicionais = linhas.reduce((s, l) => s + l.preco, 0);
        return { base: BASE.preco, linhas, adicionais, total: BASE.preco + adicionais, demo: DEMO };
    };

    /* ---------- resumo curto (para listas e carrinho) ---------- */
    P.resumo = cfg => {
        const forma = P.opcao('formato', cfg.formato).nome;
        const cor = cfg.acabamento === 'madeira' ? P.opcao('madeira', cfg.madeira).nome : P.opcao('cor', cfg.cor).nome;
        return `${forma} · ${cor} · ${P.opcao('capConfig', cfg.capConfig).id}`;
    };

    /* identificador estável da configuração (para o carrinho juntar iguais) */
    P.assinatura = cfg => {
        const s = JSON.stringify(P.normalizar(cfg));
        let h = 5381;
        for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
        return h.toString(36);
    };

    SG.Pecas = P;
})();
