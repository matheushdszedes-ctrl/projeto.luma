/* ==========================================================
   COMUNIDADE – js/comunidade.js
   Camada de dados da galeria da comunidade.

   HOJE não existe servidor: não há guitarras de outros usuários, nem
   curtidas globais, nem publicação real. Por isso o adaptador padrão
   devolve lista vazia e recusa publicar (disponivel = false).

   Para ligar a um servidor, crie um adaptador e chame SG.comunidade.usar():
     SG.comunidade.usar({
       disponivel: true,
       listar:   () => fetch('/api/comunidade').then(r => r.json()),
       publicar: p  => fetch('/api/comunidade', { method:'POST', body: JSON.stringify(p) }).then(r => r.json()),
       curtir:   id => fetch('/api/comunidade/' + id + '/curtir', { method:'POST' }).then(r => r.json())
     });
   Cada item: { id, nome, autor, config, preco, tags[], curtidas }
   ========================================================== */
(() => {
    'use strict';
    const SG = (window.SG = window.SG || {});

    const padrao = {
        disponivel: false,
        motivo: 'A publicação na comunidade precisa de um servidor e de contas de usuário, que este site ainda não tem.',
        async listar() { return []; },
        async publicar() { throw new Error(padrao.motivo); },
        async curtir() { throw new Error('Curtidas globais precisam de um servidor.'); }
    };
    let adaptador = padrao;

    SG.comunidade = {
        usar(novo) { adaptador = novo || padrao; },
        get disponivel() { return !!adaptador.disponivel; },
        get motivo() { return adaptador.motivo || ''; },
        listar: () => adaptador.listar(),
        publicar: p => adaptador.publicar(p),
        curtir: id => adaptador.curtir(id)
    };
})();
