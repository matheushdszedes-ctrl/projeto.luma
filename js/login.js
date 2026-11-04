/* ==========================================================
   LOGIN – js/login.js
   Confere e-mail e senha com as contas criadas no cadastro
   (guardadas no navegador), mostra erros, "lembrar de mim",
   mostrar/ocultar senha e redireciona para a home.
   ========================================================== */
(() => {
    'use strict';

    const SG = window.SG;
    const CHAVE_USUARIOS = 'usuariosStyleGuitar';

    const form = document.getElementById('form-login');
    if (!form) return;

    const email = document.getElementById('email');
    const senha = document.getElementById('senha');
    const lembrar = document.getElementById('lembrar');
    const aviso = document.getElementById('form-aviso');
    const caixa = document.querySelector('.login-caixa');

    // já está logado? vai direto para a home
    if (SG.sessao.ler()) { location.replace('index.html'); return; }

    /* ---------- utilitários ---------- */
    const lerUsuarios = () => {
        try { const u = JSON.parse(localStorage.getItem(CHAVE_USUARIOS)); return Array.isArray(u) ? u : []; }
        catch { return []; }
    };

    async function hash(texto) {
        if (window.crypto && crypto.subtle) {
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
            return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
        }
        let h = 5381;                                   // mesmo plano B do cadastro
        for (const c of texto) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
        return 'x' + h.toString(16);
    }

    function marcar(input, msg) {
        const campo = input.closest('.campo');
        campo.classList.toggle('erro', !!msg);
        campo.querySelector('.campo-msg').textContent = msg || '';
    }

    function mostrarAviso(msg, tipo) {
        aviso.textContent = msg;
        aviso.className = `form-aviso visivel ${tipo}`;
    }

    function tremer() {
        caixa.classList.remove('tremer');
        void caixa.offsetWidth;
        caixa.classList.add('tremer');
    }

    /* ---------- lembra o e-mail ---------- */
    try {
        const salvo = localStorage.getItem('emailLembradoStyleGuitar');
        if (salvo) { email.value = salvo; lembrar.checked = true; }
    } catch {}

    /* ---------- mostrar / ocultar senha ---------- */
    document.querySelector('.ver-senha').addEventListener('click', ev => {
        const mostrar = senha.type === 'password';
        senha.type = mostrar ? 'text' : 'password';
        ev.currentTarget.textContent = mostrar ? 'Ocultar' : 'Ver';
        ev.currentTarget.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
    });

    email.addEventListener('input', () => marcar(email, ''));
    senha.addEventListener('input', () => marcar(senha, ''));

    /* ---------- enviar ---------- */
    form.addEventListener('submit', async ev => {
        ev.preventDefault();
        aviso.className = 'form-aviso';

        const valorEmail = email.value.trim().toLowerCase();
        let ok = true;

        if (!valorEmail) { marcar(email, 'Digite seu e-mail.'); ok = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valorEmail)) { marcar(email, 'E-mail inválido.'); ok = false; }
        else marcar(email, '');

        if (!senha.value) { marcar(senha, 'Digite sua senha.'); ok = false; }
        else marcar(senha, '');

        if (!ok) { tremer(); return; }

        const usuario = lerUsuarios().find(u => u.email === valorEmail);
        const confere = usuario && usuario.senha === await hash(senha.value);

        if (!confere) {
            mostrarAviso('E-mail ou senha incorretos.', 'erro');
            tremer();
            return;
        }

        try {
            if (lembrar.checked) localStorage.setItem('emailLembradoStyleGuitar', valorEmail);
            else localStorage.removeItem('emailLembradoStyleGuitar');
        } catch {}

        SG.sessao.salvar(usuario, lembrar.checked);
        mostrarAviso(`Bem-vindo(a), ${usuario.nome.split(' ')[0]}! Entrando...`, 'ok');
        form.querySelector('button[type="submit"]').disabled = true;
        setTimeout(() => { location.href = 'index.html'; }, 900);
    });

    /* ---------- links ainda sem página ---------- */
    document.querySelector('.esqueci').addEventListener('click', ev => {
        ev.preventDefault();
        SG.aviso('Recuperação de senha em breve');
    });
    const google = document.querySelector('.login-social .btn');
    if (google) google.addEventListener('click', () => SG.aviso('Login com Google em breve'));
})();
