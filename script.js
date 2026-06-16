document.addEventListener('DOMContentLoaded', () => {
    
    // Controle de Tema (Claro/Escuro)
    const btnTema = document.getElementById('btn-tema');
    const iconeTema = document.getElementById('icone-tema');

    // Aplica as configurações visuais do tema selecionado
    const aplicarTema = (temaEscuro) => {
        if (temaEscuro) {
            document.documentElement.setAttribute('data-theme', 'dark');
            iconeTema.textContent = '☀️';
            localStorage.setItem('temaFormulario', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            iconeTema.textContent = '🌙';
            localStorage.setItem('temaFormulario', 'light');
        }
    };

    // Lê configurações armazenadas ou verifica a preferência do sistema operacional
    const temaSalvo = localStorage.getItem('temaFormulario');
    const prefereEscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (temaSalvo === 'dark' || (!temaSalvo && prefereEscuro)) {
        aplicarTema(true);
    } else {
        aplicarTema(false);
    }

    // Intercepta o clique no botão para alternar o tema atual
    btnTema.addEventListener('click', () => {
        const ehEscuro = document.documentElement.getAttribute('data-theme') === 'dark';
        aplicarTema(!ehEscuro);
    });

    // Adiciona classe para detectar clique do mouse e remove ao usar o TAB (Acessibilidade Visual)
    document.body.addEventListener('mousedown', () => document.body.classList.add('using-mouse'));
    document.body.addEventListener('keydown', (e) => { if (e.key === 'Tab') document.body.classList.remove('using-mouse'); });

    // Mapeamento dos elementos DOM.
    const form = document.getElementById('form-institucional');
    const btnEnviar = document.getElementById('btn-enviar');
    
    const inputs = {
        nome: document.getElementById('nome'),
        email: document.getElementById('email'),
        telefone: document.getElementById('telefone'),
        curso: document.getElementById('curso'),
        turnos: document.querySelectorAll('input[name="turno"]'),
        fieldsetTurno: document.getElementById('fieldset-turno')
    };

    // Array contendo a lista oficial de cursos disponíveis.
    const cursosDisponiveis = [
        "Pedagogia", "Matemática", "Engenharia de Software", "Sistemas de Informação",
        "Gestão Ambiental", "Letras-Português", "Letras-Inglês", "Atuação Cênica",
        "Serviço Social", "Produção Cultural", "Gestão Pública", "Gestão da Tecnologia da Informação",
        "Dança", "Ciência da Computação", "Ciências Econômicas", "Psicologia", "Nutrição"
    ];

    // Recupera e popula os dados salvos temporariamente no navegador.
    const carregarDadosSalvos = () => {
        const dados = JSON.parse(sessionStorage.getItem('dadosFormularioUndf'));
        if (dados) {
            if (dados.nome) inputs.nome.value = dados.nome;
            if (dados.email) inputs.email.value = dados.email;
            if (dados.telefone) inputs.telefone.value = dados.telefone; 
            if (dados.curso) inputs.curso.value = dados.curso;
            if (dados.turno) {
                const radio = document.querySelector(`input[name="turno"][value="${dados.turno}"]`);
                if (radio) radio.checked = true;
            }
            checarBotaoGeral();
        }
    };

    // Remove acentuação e converte para letras minúsculas.
    const removerAcentos = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    // Controla a exibição do menu de autocompletar e os atributos ARIA
    const toggleListaCursos = (mostrar) => {
        const lista = document.getElementById('lista-cursos');
        if (mostrar) {
            lista.classList.remove('hidden');
            inputs.curso.setAttribute('aria-expanded', 'true');
        } else {
            lista.classList.add('hidden');
            inputs.curso.setAttribute('aria-expanded', 'false');
        }
    };

    // Gera a lista suspensa com base na busca do usuário
    const renderizarCursos = (termo, forcarAbrir = false) => {
        const lista = document.getElementById('lista-cursos');
        lista.innerHTML = ''; 
        
        // Esconde a lista se o campo estiver vazio e a abertura não for forçada pela seta
        if (termo.length === 0 && !forcarAbrir) {
            toggleListaCursos(false);
            return;
        }
        
        const filtrados = cursosDisponiveis.filter(c => removerAcentos(c).includes(removerAcentos(termo)));
        
        if (filtrados.length > 0) {
            filtrados.forEach((c) => {
                const li = document.createElement('li');
                li.textContent = c;
                li.tabIndex = -1; // Remove do fluxo do TAB, permitindo apenas navegação por setas
                li.setAttribute('role', 'option');

                li.addEventListener('mousedown', (evt) => { 
                    evt.preventDefault(); 
                    selecionarCurso(c);
                });

                // Navegação por Teclado dentro da lista (Seta Cima/Baixo, Enter e Esc)
                li.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') {
                        evt.preventDefault();
                        selecionarCurso(c);
                    } else if (evt.key === 'ArrowDown') {
                        evt.preventDefault();
                        if (li.nextSibling) li.nextSibling.focus();
                    } else if (evt.key === 'ArrowUp') {
                        evt.preventDefault();
                        if (li.previousSibling) li.previousSibling.focus();
                        else inputs.curso.focus(); 
                    } else if (evt.key === 'Escape') {
                        toggleListaCursos(false);
                        inputs.curso.focus();
                    }
                });

                lista.appendChild(li);
            });
            toggleListaCursos(true);
        } else {
            toggleListaCursos(false);
        }
    };

    // Dispara a filtragem a cada nova digitação
    inputs.curso.addEventListener('input', (e) => {
        renderizarCursos(e.target.value);
    });

    // Permite expandir a lista com a Seta para Baixo direto do campo de texto
    inputs.curso.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const lista = document.getElementById('lista-cursos');
            
            // Força a renderização com true para exibir toda a lista se o campo estiver vazio
            if (lista.classList.contains('hidden')) {
                if (inputs.curso.value.trim() === '') {
                    lista.innerHTML = ''; 
                    cursosDisponiveis.forEach((c) => {
                        const li = document.createElement('li');
                        li.textContent = c;
                        li.tabIndex = -1; 
                        li.setAttribute('role', 'option');
                        li.addEventListener('mousedown', (evt) => { evt.preventDefault(); selecionarCurso(c); });
                        li.addEventListener('keydown', (evt) => {
                            if (evt.key === 'Enter') { evt.preventDefault(); selecionarCurso(c); }
                            else if (evt.key === 'ArrowDown') { evt.preventDefault(); if (li.nextSibling) li.nextSibling.focus(); }
                            else if (evt.key === 'ArrowUp') { evt.preventDefault(); if (li.previousSibling) li.previousSibling.focus(); else inputs.curso.focus(); }
                            else if (evt.key === 'Escape') { lista.classList.add('hidden'); inputs.curso.focus(); }
                        });
                        lista.appendChild(li);
                    });
                    lista.classList.remove('hidden');
                } else {
                    inputs.curso.dispatchEvent(new Event('input'));
                }
            }
            
            // Pequeno delay para garantir que o DOM renderizou as "lis"
            setTimeout(() => {
                const firstLi = document.querySelector('#lista-cursos li');
                if (firstLi) firstLi.focus();
            }, 50);
        } else if (e.key === 'Escape') {
            document.getElementById('lista-cursos').classList.add('hidden');
        }
    });

    // Define o valor do input de curso, oculta a lista e dispara validações.
    const selecionarCurso = (cursoNome) => {
        inputs.curso.value = cursoNome;
        document.getElementById('lista-cursos').classList.add('hidden');
        validarCurso();
        checarBotaoGeral();
        inputs.curso.focus(); 
    };

    // Impede o usuário de inserir o caractere "@" no campo de e-mail.
    inputs.email.addEventListener('input', (e) => {
        if(e.target.value.includes('@')) e.target.value = e.target.value.split('@')[0];
    });

    // Formata o número de telefone em tempo real.
    inputs.telefone.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, ''); 
        if (v.length > 11) v = v.slice(0, 11);
        let formatado = v;
        if (v.length > 2 && v.length <= 7) formatado = `(${v.slice(0,2)}) ${v.slice(2)}`;
        else if (v.length > 7) formatado = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
        e.target.value = formatado;
    });

    // Salva automaticamente todos os dados no session storage ao digitar.
    form.addEventListener('input', () => {
        const turnoSelecionado = document.querySelector('input[name="turno"]:checked');
        sessionStorage.setItem('dadosFormularioUndf', JSON.stringify({
            nome: inputs.nome.value,
            email: inputs.email.value,
            telefone: inputs.telefone.value,
            curso: inputs.curso.value,
            turno: turnoSelecionado ? turnoSelecionado.value : null
        }));
        checarBotaoGeral();
    });

    // Atualiza as classes CSS do elemento e exibe a mensagem de feedback.
    const setStatus = (elemento, status, mensagem) => {
        const spanId = elemento.getAttribute('aria-describedby');
        const spanMsg = document.getElementById(spanId);
        
        elemento.classList.remove('is-valid', 'is-invalid', 'is-empty');
        spanMsg.style.display = 'block'; 
        
        if (status === 'erro') {
            elemento.classList.add('is-invalid');
            elemento.setAttribute('aria-invalid', 'true');
            spanMsg.innerHTML = '❌ Erro: ' + mensagem;
            spanMsg.style.color = 'var(--cor-erro)';
        } else if (status === 'vazio') {
            elemento.classList.add('is-empty');
            elemento.setAttribute('aria-invalid', 'false');
            spanMsg.innerHTML = '⚠️ Atenção: ' + mensagem;
            spanMsg.style.color = 'var(--cor-aviso)';
        } else if (status === 'sucesso') {
            elemento.classList.add('is-valid');
            elemento.setAttribute('aria-invalid', 'false');
            spanMsg.innerHTML = '✅ OK';
            spanMsg.style.color = 'var(--cor-sucesso)';
        }
    };

    // Valida o nome checando caracteres permitidos, quantidade de palavras e tamanho.
    const validarNome = () => {
        const valor = inputs.nome.value.trim();
        const palavras = valor.split(/\s+/); 
        const minimoDuasLetras = palavras.every(p => p.length >= 2);
        
        const regexNomeValido = /^[a-zA-ZÀ-ÿ\s']+$/;
        
        if (valor === "") {
            setStatus(inputs.nome, 'vazio', "Campo vazio. Insira seu nome completo.");
        } else if (!regexNomeValido.test(valor)) {
            setStatus(inputs.nome, 'erro', "Símbolos e números não são permitidos. Use apenas letras.");
        } else if (palavras.length < 2 || !minimoDuasLetras) {
            setStatus(inputs.nome, 'erro', "Insira seu nome completo");
        } else {
            setStatus(inputs.nome, 'sucesso', "");
        }
    };

    // Valida o prefixo do e-mail barrando símbolos indesejados e checando o formato.
    const validarEmail = () => {
        const valor = inputs.email.value.trim();
        
        const regexCaracteresValidos = /^[a-zA-Z0-9.]+$/;
        const regexFormato = /^[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}$/;
        
        if (valor === "") {
            setStatus(inputs.email, 'vazio', "Campo vazio. Insira seu email.");
        } else if (!regexCaracteresValidos.test(valor)) {
            setStatus(inputs.email, 'erro', "Símbolos e acentos não permitidos. Use letras, números e um ponto.");
        } else if (!regexFormato.test(valor)) {
            setStatus(inputs.email, 'erro', "Insira seu email institucional, no formato nome.sobrenome, o sistema completa o restante.");
        } else {
            setStatus(inputs.email, 'sucesso', "");
        }
    };

    // Valida o número de caracteres numéricos do telefone.
    const validarTelefone = () => {
        const nums = inputs.telefone.value.replace(/\D/g, '');
        if (nums === "") setStatus(inputs.telefone, 'vazio', "Campo vazio. Insira seu número de telefone.");
        else if (nums.length !== 11) setStatus(inputs.telefone, 'erro', "Insira os 11 dígitos (DDD + 9 números).");
        else setStatus(inputs.telefone, 'sucesso', "");
    };

    // Verifica se a entrada do campo curso corresponde a um item da lista.
    const validarCurso = () => {
        const valor = inputs.curso.value.trim();
        const cursoValido = cursosDisponiveis.some(c => c.toLowerCase() === valor.toLowerCase());

        if (valor === "") setStatus(inputs.curso, 'vazio', "Campo vazio. Pesquise e selecione o seu Curso.");
        else if (!cursoValido) setStatus(inputs.curso, 'erro', "Selecione um curso válido na lista apresentada.");
        else {
            inputs.curso.value = cursosDisponiveis.find(c => c.toLowerCase() === valor.toLowerCase());
            setStatus(inputs.curso, 'sucesso', "");
        }
    };

    // Verifica se há seleção no rádio de turno.
    const validarTurno = () => {
        const preenchido = Array.from(inputs.turnos).some(r => r.checked);
        if (!preenchido) setStatus(inputs.fieldsetTurno, 'vazio', "Escolha o turno do seu curso.");
        else setStatus(inputs.fieldsetTurno, 'sucesso', "");
    };

    // Dispara validações no evento blur.
    inputs.nome.addEventListener('blur', validarNome);
    inputs.email.addEventListener('blur', validarEmail);
    inputs.telefone.addEventListener('blur', validarTelefone);
    
    // Oculta a lista de cursos ao perder foco no container.
    const dropdownContainer = document.querySelector('.dropdown-container');
    dropdownContainer.addEventListener('focusout', (e) => {
        if (!dropdownContainer.contains(e.relatedTarget)) {
            document.getElementById('lista-cursos').classList.add('hidden');
            validarCurso();
        }
    });

    // Valida ao perder foco do fieldset.
    inputs.fieldsetTurno.addEventListener('focusout', (e) => {
        if (!inputs.fieldsetTurno.contains(e.relatedTarget)) validarTurno();
    });
    inputs.turnos.forEach(radio => radio.addEventListener('change', validarTurno));

    // Define o atributo disabled do botão enviar com base na validação de todos os campos.
    const checarBotaoGeral = () => {
        const pNome = inputs.nome.value.trim().split(/\s+/);
        const regexNome = /^[a-zA-ZÀ-ÿ\s']+$/;
        const n = pNome.length >= 2 && pNome.every(p => p.length >= 2) && regexNome.test(inputs.nome.value.trim());
        
        const regexEmail = /^[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}$/;
        const em = regexEmail.test(inputs.email.value.trim());
        
        const t = inputs.telefone.value.replace(/\D/g, '').length === 11;
        const c = cursosDisponiveis.some(curso => curso.toLowerCase() === inputs.curso.value.trim().toLowerCase());
        const tu = Array.from(inputs.turnos).some(r => r.checked);
        
        btnEnviar.disabled = !(n && em && t && c && tu);
    };

    // Manipula a exibição da janela modal de feedback e alterna a visibilidade dos botões.
    const mostrarModal = (tipo, titulo, texto) => {
        const modal = document.getElementById('modal-feedback');
        const box = document.getElementById('modal-box');
        const icone = document.getElementById('modal-icon');
        
        document.getElementById('modal-title').textContent = titulo;
        document.getElementById('modal-desc').textContent = texto;
        
        box.classList.remove('modal-sucesso', 'modal-erro');
        document.getElementById('btn-sucesso-ok').classList.add('hidden');
        document.getElementById('btn-erro-tentar').classList.add('hidden');
        document.getElementById('btn-erro-cancelar').classList.add('hidden');
        
        if (tipo === 'sucesso') {
            icone.textContent = '✅';
            document.getElementById('modal-title').style.color = 'var(--cor-sucesso)';
            box.classList.add('modal-sucesso');
            document.getElementById('btn-sucesso-ok').classList.remove('hidden');
        } else {
            icone.textContent = '❌';
            document.getElementById('modal-title').style.color = 'var(--cor-erro)';
            box.classList.add('modal-erro');
            document.getElementById('btn-erro-tentar').classList.remove('hidden');
            document.getElementById('btn-erro-cancelar').classList.remove('hidden');
        }
        modal.classList.remove('hidden');
    };

    const esconderModal = () => document.getElementById('modal-feedback').classList.add('hidden');

    document.getElementById('btn-sucesso-ok').addEventListener('click', esconderModal);

    // Usa requestSubmit ao invés de clique para garantir que a tela de Loading reapareça.
    document.getElementById('btn-erro-tentar').addEventListener('click', () => {
        esconderModal();
        form.requestSubmit(btnEnviar); 
    });

    // Limpa os dados do formulário, remove armazenamento e formatação.
    document.getElementById('btn-erro-cancelar').addEventListener('click', () => {
        esconderModal();
        form.reset();
        sessionStorage.removeItem('dadosFormularioUndf');
        
        document.querySelectorAll('.is-valid, .is-invalid, .is-empty').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid', 'is-empty');
            el.setAttribute('aria-invalid', 'false');
        });
        document.querySelectorAll('.msg-feedback').forEach(el => {
            el.style.display = 'none'; 
            el.innerHTML = '';
        });
        btnEnviar.disabled = true;
    });

    // Intercepta submit e realiza requisição POST com fetch.
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        validarNome(); validarEmail(); validarTelefone(); validarCurso(); validarTurno();
        if (btnEnviar.disabled) return;

        const telaLoading = document.getElementById('tela-loading');
        telaLoading.classList.remove('hidden');
        btnEnviar.disabled = true;

        try {
            // Atraso inserido NO INÍCIO do try para garantir que o Loading apareça primeiro, mesmo se a rede falhar.
            await new Promise(r => setTimeout(r, 1000)); 

            const resposta = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: inputs.nome.value,
                    email: inputs.email.value + "@undf.edu.br", 
                    telefone: inputs.telefone.value.replace(/\D/g, ''),
                    curso: inputs.curso.value,
                    turno: document.querySelector('input[name="turno"]:checked').value
                })
            });

            if (!resposta.ok) throw new Error('Erro de Rede');

            telaLoading.classList.add('hidden');
            mostrarModal('sucesso', 'Cadastro concluído!', 'Suas informações foram salvas. Verifique seu e-mail institucional em breve.');
            
            form.reset();
            sessionStorage.removeItem('dadosFormularioUndf');
            
            document.querySelectorAll('.is-valid, .is-invalid, .is-empty').forEach(el => {
                el.classList.remove('is-valid', 'is-invalid', 'is-empty');
                el.setAttribute('aria-invalid', 'false');
            });
            document.querySelectorAll('.msg-feedback').forEach(el => {
                el.style.display = 'none'; 
                el.innerHTML = '';
            });

        } catch (erro) {
            telaLoading.classList.add('hidden');
            mostrarModal('erro', 'Falha na conexão', 'Ocorreu um erro ao enviar. Seus dados estão salvos. O que deseja fazer?');
            btnEnviar.disabled = false;
        }
    });

    carregarDadosSalvos();
});