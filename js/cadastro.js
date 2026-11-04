/* ==========================================================
   CADASTRO – js/cadastro.js
   Validação em tempo real, força da senha, mostrar/ocultar senha
   e criação da conta. Sem servidor: as contas ficam salvas no
   navegador (localStorage) e a senha é guardada como hash SHA-256.
   ========================================================== */
(() => {
    'use strict';

    const SG = window.SG;
    const CHAVE_USUARIOS = 'usuariosStyleGuitar';

    const form = document.getElementById('form-cadastro');
    if (!form) return;

    const campos = {
        nome: document.getElementById('nome'),
        sobrenome: document.getElementById('sobrenome'),
        email: document.getElementById('email'),
        senha: document.getElementById('senha'),
        confirmar: document.getElementById('confirmar'),
        termos: document.getElementById('termos')
    };
    const aviso = document.getElementById('form-aviso');
    const barra = document.querySelector('.forca-senha .barra span');
    const textoForca = document.querySelector('.forca-senha small');

    /* ---------- armazenamento ---------- */
    const lerUsuarios = () => {
        try { const u = JSON.parse(localStorage.getItem(CHAVE_USUARIOS)); return Array.isArray(u) ? u : []; }
        catch { return []; }
    };

    async function hash(texto) {
        if (window.crypto && crypto.subtle) {
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
            return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
        }
        let h = 5381;                                   // plano B simples
        for (const c of texto) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
        return 'x' + h.toString(16);
    }

    /* ---------- mensagens por campo ---------- */
    function marcar(input, msg) {
        const campo = input.closest('.campo');
        if (!campo) return;
        const span = campo.querySelector('.campo-msg');
        campo.classList.toggle('erro', !!msg);
        campo.classList.toggle('ok', !msg && input.value.trim() !== '');
        if (span) span.textContent = msg || '';
    }

    function mostrarAviso(msg, tipo) {
        aviso.textContent = msg;
        aviso.className = `form-aviso visivel ${tipo}`;
    }

    /* ---------- regras ---------- */
    const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

    const regras = {
        nome: v => (v.trim().length < 2 ? 'Digite seu nome.' : ''),
        sobrenome: v => (v.trim().length < 2 ? 'Digite seu sobrenome.' : ''),
        email: v => {
            if (!v.trim()) return 'Digite seu e-mail.';
            if (!emailValido(v.trim())) return 'E-mail inválido.';
            if (lerUsuarios().some(u => u.email === v.trim().toLowerCase())) return 'Este e-mail já está cadastrado.';
            return '';
        },
        senha: v => {
            if (v.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
            if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Use letras e números.';
            return '';
        },
        confirmar: v => (v !== campos.senha.value ? 'As senhas não conferem.' : (v ? '' : 'Repita a senha.'))
    };

    const validar = nome => {
        const msg = regras[nome](campos[nome].value);
        marcar(campos[nome], msg);
        return !msg;
    };

    // valida ao sair do campo; depois corrige enquanto digita
    Object.keys(regras).forEach(nome => {
        campos[nome].addEventListener('blur', () => validar(nome));
        campos[nome].addEventListener('input', () => {
            if (campos[nome].closest('.campo').classList.contains('erro')) validar(nome);
        });
    });

    /* ---------- força da senha ---------- */
    function nivelSenha(s) {
        let n = 0;
        if (s.length >= 8) n++;
        if (/[a-z]/.test(s) && /[A-Z]/.test(s)) n++;
        if (/\d/.test(s)) n++;
        if (/[^A-Za-z0-9]/.test(s)) n++;
        return s ? Math.max(1, n) : 0;
    }

    campos.senha.addEventListener('input', () => {
        const n = nivelSenha(campos.senha.value);
        barra.dataset.nivel = n;
        textoForca.textContent = ['Use letras, números e símbolos', 'Senha fraca', 'Senha razoável', 'Senha boa', 'Senha forte'][n];
        if (campos.confirmar.value) validar('confirmar');
    });

    /* ---------- mostrar / ocultar senha ---------- */
    document.querySelectorAll('.ver-senha').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const mostrar = input.type === 'password';
            input.type = mostrar ? 'text' : 'password';
            btn.textContent = mostrar ? 'Ocultar' : 'Ver';
            btn.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
        });
    });

    /* ---------- enviar ---------- */
    form.addEventListener('submit', async ev => {
        ev.preventDefault();
        aviso.className = 'form-aviso';

        const todosOk = Object.keys(regras).map(validar).every(Boolean);

        if (!campos.termos.checked) {
            mostrarAviso('Aceite os termos de uso para continuar.', 'erro');
            return;
        }
        if (!todosOk) {
            mostrarAviso('Corrija os campos destacados.', 'erro');
            const primeiro = form.querySelector('.campo.erro input');
            if (primeiro) primeiro.focus();
            return;
        }

        const usuario = {
            nome: `${campos.nome.value.trim()} ${campos.sobrenome.value.trim()}`,
            email: campos.email.value.trim().toLowerCase(),
            senha: await hash(campos.senha.value),
            criadoEm: new Date().toISOString()
        };

        const usuarios = lerUsuarios();
        usuarios.push(usuario);
        try { localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios)); }
        catch { mostrarAviso('Não foi possível salvar a conta neste navegador.', 'erro'); return; }

        SG.sessao.salvar(usuario, true);
        mostrarAviso('Conta criada com sucesso! Redirecionando...', 'ok');
        form.querySelector('button[type="submit"]').disabled = true;
        setTimeout(() => { location.href = 'index.html'; }, 1200);
    });
})();
