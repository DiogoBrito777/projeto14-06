document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================
    // ENCAPSULAMENTO DE STORAGE (Proteção contra erros de bloqueio)
    // =========================================================
    const safeSetLocalStorage = (key, value) => { try { localStorage.setItem(key, value); } catch(e){} };
    const safeGetLocalStorage = (key) => { try { return localStorage.getItem(key); } catch(e){ return null; } };
    const safeSetSessionStorage = (key, value) => { try { sessionStorage.setItem(key, value); } catch(e){} };
    const safeGetSessionStorage = (key) => { try { return sessionStorage.getItem(key); } catch(e){ return null; } };
    const safeRemoveSessionStorage = (key) => { try { sessionStorage.removeItem(key); } catch(e){} };

    const anunciadorPolite = document.getElementById('anunciador-polite');
    const anunciadorAssertive = document.getElementById('anunciador-assertive');

    /**
     * Envia mensagens de texto para as regiões aria-live do leitor de tela.
     */
    const falarParaLeitor = (mensagem, urgente = false) => {
        const alvo = urgente ? anunciadorAssertive : anunciadorPolite;
        alvo.textContent = ''; 
        
        const tempoEspera = urgente ? 500 : 50;

        setTimeout(() => { 
            alvo.textContent = mensagem; 
        }, tempoEspera);
    };

    const btnTema = document.getElementById('btn-tema');
    const iconeTema = document.getElementById('icone-tema');

    /**
     * Aplica o tema visual, atualiza o logo e o localStorage.
     */
    const aplicarTema = (temaEscuro) => {
        const imgLogo = document.getElementById('img-logo');
        if (temaEscuro) {
            document.documentElement.setAttribute('data-theme', 'dark');
            iconeTema.textContent = '☀️';
            if (imgLogo) imgLogo.src = 'logo_undf_dark.png';
            safeSetLocalStorage('temaFormulario', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            iconeTema.textContent = '🌙';
            if (imgLogo) imgLogo.src = 'logo_undf.png';
            safeSetLocalStorage('temaFormulario', 'light');
        }
    };

    const temaSalvo = safeGetLocalStorage('temaFormulario');
    const prefereEscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (temaSalvo === 'dark' || (!temaSalvo && prefereEscuro)) aplicarTema(true);
    else aplicarTema(false);

    btnTema.addEventListener('click', () => {
        const ehEscuro = document.documentElement.getAttribute('data-theme') === 'dark';
        aplicarTema(!ehEscuro);
    });

    document.body.addEventListener('mousedown', () => document.body.classList.add('using-mouse'));
    document.body.addEventListener('keydown', (e) => { if (e.key === 'Tab') document.body.classList.remove('using-mouse'); });

    const form = document.getElementById('form-institucional');
    const btnEnviar = document.getElementById('btn-enviar');
    let isSubmitting = false; // Trava física contra duplo envio
    
    const inputs = {
        nome: document.getElementById('nome'),
        email: document.getElementById('email'),
        telefone: document.getElementById('telefone'),
        curso: document.getElementById('curso'),
        turnos: document.querySelectorAll('input[name="turno"]'),
        fieldsetTurno: document.getElementById('fieldset-turno')
    };

    const cursosDisponiveis = [
        "Pedagogia", "Matemática", "Engenharia de Software", "Sistemas de Informação",
        "Gestão Ambiental", "Letras-Português", "Letras-Inglês", "Atuação Cênica",
        "Serviço Social", "Produção Cultural", "Gestão Pública", "Gestão da Tecnologia da Informação",
        "Dança", "Ciência da Computação", "Ciências Econômicas", "Psicologia", "Nutrição"
    ];

    const categoriasCursos = {
        "Matemática": "exatas", "Engenharia de Software": "exatas", "Sistemas de Informação": "exatas", "Ciência da Computação": "exatas",
        "Gestão Ambiental": "gestao", "Gestão Pública": "gestao", "Gestão da Tecnologia da Informação": "gestao",
        "Pedagogia": "humanas", "Letras-Português": "humanas", "Letras-Inglês": "humanas", "Atuação Cênica": "humanas",
        "Serviço Social": "humanas", "Produção Cultural": "humanas", "Dança": "humanas", "Ciências Econômicas": "humanas",
        "Psicologia": "humanas", "Nutrição": "humanas"
    };

    const atualizarTurnosDisponiveis = (cursoSelecionado) => {
        const radioMatutino = document.getElementById('turno-matutino');
        const radioVespertino = document.getElementById('turno-vespertino');
        const radioNoturno = document.getElementById('turno-noturno');
        
        [radioMatutino, radioVespertino, radioNoturno].forEach(r => {
            r.disabled = false;
            r.parentElement.classList.remove('radio-disabled');
        });

        const categoria = categoriasCursos[cursoSelecionado];
        if (!categoria) return "";

        let turnosDisponiveisStr = "todos os turnos";
        let turnoPerdido = false;

        if (categoria === 'exatas') {
            radioVespertino.disabled = true;
            radioVespertino.parentElement.classList.add('radio-disabled');
            if (radioVespertino.checked) {
                radioVespertino.checked = false;
                turnoPerdido = true;
            }
            turnosDisponiveisStr = "apenas matutino e noturno";
        } else if (categoria === 'humanas') {
            radioMatutino.disabled = true;
            radioMatutino.parentElement.classList.add('radio-disabled');
            if (radioMatutino.checked) {
                radioMatutino.checked = false;
                turnoPerdido = true;
            }
            turnosDisponiveisStr = "apenas vespertino e noturno";
        }

        if (turnoPerdido) {
            inputs.fieldsetTurno.classList.remove('is-valid', 'is-invalid', 'is-empty');
            inputs.fieldsetTurno.removeAttribute('aria-invalid');
            document.getElementById('erro-turno').style.display = 'none';
        }

        return turnosDisponiveisStr;
    };

    const carregarDadosSalvos = () => {
        const dadosString = safeGetSessionStorage('dadosFormularioUndf');
        if (!dadosString) return;
        
        try {
            const dados = JSON.parse(dadosString);
            if (dados) {
                if (dados.nome) inputs.nome.value = dados.nome;
                if (dados.email) inputs.email.value = dados.email;
                if (dados.telefone) inputs.telefone.value = dados.telefone; 
                if (dados.curso) {
                    inputs.curso.value = dados.curso;
                    atualizarTurnosDisponiveis(dados.curso);
                }
                if (dados.turno) {
                    const radio = document.querySelector(`input[name="turno"][value="${dados.turno}"]`);
                    if (radio && !radio.disabled) radio.checked = true;
                }
                checarBotaoGeral();
            }
        } catch(e){}
    };

    const removerAcentos = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    /**
     * Alterna a visibilidade e atributos ARIA do menu suspenso de cursos.
     */
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

    const renderizarCursos = (termo, forcarAbrir = false) => {
        const lista = document.getElementById('lista-cursos');
        lista.innerHTML = ''; 
        
        if (termo.length === 0 && !forcarAbrir) {
            toggleListaCursos(false);
            return;
        }
        
        const filtrados = cursosDisponiveis.filter(c => removerAcentos(c).includes(removerAcentos(termo)));
        
        if (filtrados.length > 0) {
            falarParaLeitor(`${filtrados.length} cursos encontrados. Pressione seta para baixo para explorar a lista.`);
            
            filtrados.forEach((c) => {
                const li = document.createElement('li');
                li.textContent = c;
                li.tabIndex = -1; 
                li.setAttribute('role', 'option');
                li.setAttribute('aria-selected', 'false');

                li.addEventListener('focus', () => li.setAttribute('aria-selected', 'true'));
                li.addEventListener('blur', () => li.setAttribute('aria-selected', 'false'));

                li.addEventListener('mousedown', (evt) => { 
                    evt.preventDefault(); 
                    selecionarCurso(c);
                });

                li.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') {
                        evt.preventDefault();
                        selecionarCurso(c);
                    } else if (evt.key === 'ArrowDown') {
                        evt.preventDefault();
                        if (li.nextSibling) li.nextSibling.focus();
                        else document.querySelector('#lista-cursos li').focus(); // Loop para o topo
                    } else if (evt.key === 'ArrowUp') {
                        evt.preventDefault();
                        if (li.previousSibling) li.previousSibling.focus();
                        else inputs.curso.focus(); // Retorna ao input
                    } else if (evt.key === 'Escape') {
                        toggleListaCursos(false);
                        inputs.curso.focus();
                        falarParaLeitor('Lista de cursos fechada.');
                    }
                });

                lista.appendChild(li);
            });
            toggleListaCursos(true);
        } else {
            toggleListaCursos(false);
        }
    };

    inputs.curso.addEventListener('input', (e) => {
        inputs.curso.setAttribute('aria-describedby', 'instrucao-curso erro-curso');
        renderizarCursos(e.target.value);
    });

    inputs.curso.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            if (e.altKey) e.preventDefault(); 
            
            const lista = document.getElementById('lista-cursos');
            if (lista.classList.contains('hidden')) {
                if (inputs.curso.value.trim() === '') {
                    renderizarCursos('', true);
                } else {
                    inputs.curso.dispatchEvent(new Event('input'));
                }
            }
            setTimeout(() => {
                const firstLi = document.querySelector('#lista-cursos li');
                if (firstLi) firstLi.focus();
            }, 100);
        } else if (e.key === 'Escape') {
            toggleListaCursos(false);
        }
    });

    const selecionarCurso = (cursoNome) => {
        inputs.curso.value = cursoNome;
        toggleListaCursos(false);
        
        const infoTurnos = atualizarTurnosDisponiveis(cursoNome);
        falarParaLeitor(`Curso ${cursoNome} selecionado com sucesso. Opções de turno filtradas: ${infoTurnos} disponíveis.`);
        
        inputs.curso.setAttribute('aria-describedby', 'erro-curso'); 
        validarCurso(true); 
        checarBotaoGeral();
        inputs.curso.focus(); 
    };

    inputs.email.addEventListener('input', (e) => {
        if(e.target.value.includes('@')) e.target.value = e.target.value.split('@')[0];
    });

    inputs.telefone.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, ''); 
        if (v.length > 11) v = v.slice(0, 11);
        let formatado = v;
        if (v.length > 2 && v.length <= 7) formatado = `(${v.slice(0,2)}) ${v.slice(2)}`;
        else if (v.length > 7) formatado = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
        e.target.value = formatado;
    });

    form.addEventListener('input', () => {
        const turnoSelecionado = document.querySelector('input[name="turno"]:checked');
        safeSetSessionStorage('dadosFormularioUndf', JSON.stringify({
            nome: inputs.nome.value,
            email: inputs.email.value,
            telefone: inputs.telefone.value,
            curso: inputs.curso.value,
            turno: turnoSelecionado ? turnoSelecionado.value : null
        }));
        checarBotaoGeral();
    });

    const setStatus = (elemento, status, mensagemVisual, nomeCampo, perdeuFoco = false, mensagemAcessibilidadeExtra = "") => {
        const spanIdArray = elemento.getAttribute('aria-describedby');
        if(!spanIdArray) return;
        
        const spanId = spanIdArray.split(' ').find(id => id.startsWith('erro-'));
        const spanMsg = document.getElementById(spanId);
        
        elemento.classList.remove('is-valid', 'is-invalid', 'is-empty');
        spanMsg.style.display = 'block'; 
        
        if (status === 'erro' || status === 'vazio') {
            const isErro = status === 'erro';
            const iconeHtml = `<span aria-hidden="true">${isErro ? '❌' : '⚠️'}</span>`;
            const prefixoVisual = isErro ? ' Erro: ' : ' Atenção: ';
            
            elemento.classList.add(isErro ? 'is-invalid' : 'is-empty');
            elemento.setAttribute('aria-invalid', 'true');
            spanMsg.innerHTML = iconeHtml + prefixoVisual + mensagemVisual;
            spanMsg.style.color = isErro ? 'var(--cor-erro)' : 'var(--cor-aviso)';
            
            if (perdeuFoco) {
                const textoNarrador = mensagemAcessibilidadeExtra || mensagemVisual;
                falarParaLeitor(`Alerta. O campo "${nomeCampo}" possui um erro. ${textoNarrador}. Pressione Shift e Tab juntos para voltar e corrigir.`, true);
            }
        } else if (status === 'sucesso') {
            elemento.classList.add('is-valid');
            elemento.setAttribute('aria-invalid', 'false');
            spanMsg.innerHTML = '<span aria-hidden="true">✅</span> OK';
            spanMsg.style.color = 'var(--cor-sucesso)';
            
            if (perdeuFoco && elemento.value) {
                falarParaLeitor(`Campo ${nomeCampo} preenchido corretamente.`, false);
            }
        }
    };

    const validarNome = (perdeuFoco = false) => {
        const valor = inputs.nome.value.trim();
        const palavras = valor.split(/\s+/); 
        const minimoDuasLetras = palavras.every(p => p.length >= 2);
        const regexNomeValido = /^[a-zA-ZÀ-ÿ\s']+$/;
        
        if (valor === "") {
            setStatus(inputs.nome, 'vazio', "Campo vazio. Insira seu nome completo.", "Nome Completo", perdeuFoco);
        } else if (!regexNomeValido.test(valor)) {
            setStatus(inputs.nome, 'erro', "Símbolos e números não são permitidos. Use apenas letras.", "Nome Completo", perdeuFoco);
        } else if (palavras.length < 2 || !minimoDuasLetras) {
            setStatus(inputs.nome, 'erro', "Insira seu nome completo, sem abreviações.", "Nome Completo", perdeuFoco, "Nome incompleto. Digite pelo menos um nome e um sobrenome sem abreviar.");
        } else {
            setStatus(inputs.nome, 'sucesso', "", "Nome Completo", perdeuFoco);
        }
    };

    const validarEmail = (perdeuFoco = false) => {
        const valor = inputs.email.value.trim();
        const regexCaracteresValidos = /^[a-zA-Z0-9.]+$/;
        const regexFormato = /^[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}$/;
        
        if (valor === "") {
            setStatus(inputs.email, 'vazio', "Campo vazio. Insira seu email.", "E-mail Institucional", perdeuFoco);
        } else if (!regexCaracteresValidos.test(valor)) {
            setStatus(inputs.email, 'erro', "Símbolos e acentos não permitidos. Use letras, números e um ponto.", "E-mail Institucional", perdeuFoco);
        } else if (!regexFormato.test(valor)) {
            setStatus(inputs.email, 'erro', "Insira seu email institucional, no formato nome.sobrenome.", "E-mail Institucional", perdeuFoco);
        } else {
            setStatus(inputs.email, 'sucesso', "", "E-mail Institucional", perdeuFoco);
        }
    };

    const validarTelefone = (perdeuFoco = false) => {
        const nums = inputs.telefone.value.replace(/\D/g, '');
        if (nums === "") {
            setStatus(inputs.telefone, 'vazio', "Campo vazio. Insira seu número de telefone.", "Telefone", perdeuFoco);
        } else if (nums.length !== 11) {
            setStatus(inputs.telefone, 'erro', "Insira os 11 dígitos (DDD + 9 números).", "Telefone", perdeuFoco, "Faltam dígitos. Insira os 2 dígitos do DDD e os 9 do número do telefone.");
        } else {
            setStatus(inputs.telefone, 'sucesso', "", "Telefone", perdeuFoco);
        }
    };

    const validarCurso = (perdeuFoco = false) => {
        const valor = inputs.curso.value.trim();
        const cursoValido = cursosDisponiveis.find(c => c.toLowerCase() === valor.toLowerCase());

        if (valor === "") {
            setStatus(inputs.curso, 'vazio', "Campo vazio. Pesquise e selecione o seu Curso.", "Curso", perdeuFoco);
            atualizarTurnosDisponiveis("");
        } else if (!cursoValido) {
            setStatus(inputs.curso, 'erro', "Selecione um curso válido na lista apresentada.", "Curso", perdeuFoco);
            atualizarTurnosDisponiveis("");
        } else {
            inputs.curso.value = cursoValido;
            setStatus(inputs.curso, 'sucesso', "", "Curso", perdeuFoco);
            atualizarTurnosDisponiveis(cursoValido);
        }
    };

    const validarTurno = (perdeuFoco = false) => {
        const preenchido = Array.from(inputs.turnos).some(r => r.checked);
        if (!preenchido) setStatus(inputs.fieldsetTurno, 'vazio', "Escolha o turno do seu curso.", "Turno do Curso", perdeuFoco);
        else {
            setStatus(inputs.fieldsetTurno, 'sucesso', "", "Turno do Curso", perdeuFoco);
        }
    };

    inputs.nome.addEventListener('blur', () => { validarNome(true); checarBotaoGeral(); });
    inputs.email.addEventListener('blur', () => { validarEmail(true); checarBotaoGeral(); });
    inputs.telefone.addEventListener('blur', () => { validarTelefone(true); checarBotaoGeral(); });
    
    const dropdownContainer = document.querySelector('.dropdown-container');
    dropdownContainer.addEventListener('focusout', (e) => {
        if (!dropdownContainer.contains(e.relatedTarget)) {
            toggleListaCursos(false); 
            validarCurso(true);
            checarBotaoGeral();
        }
    });

    inputs.fieldsetTurno.addEventListener('focusout', (e) => {
        if (!inputs.fieldsetTurno.contains(e.relatedTarget)) {
            validarTurno(true);
            checarBotaoGeral();
        }
    });
    inputs.turnos.forEach(radio => radio.addEventListener('change', () => {
        validarTurno(false);
        checarBotaoGeral();
    }));

    const checarBotaoGeral = () => {
        const pNome = inputs.nome.value.trim().split(/\s+/);
        const regexNome = /^[a-zA-ZÀ-ÿ\s']+$/;
        const n = pNome.length >= 2 && pNome.every(p => p.length >= 2) && regexNome.test(inputs.nome.value.trim());
        const em = /^[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}$/.test(inputs.email.value.trim());
        const t = inputs.telefone.value.replace(/\D/g, '').length === 11;
        const c = cursosDisponiveis.some(curso => curso.toLowerCase() === inputs.curso.value.trim().toLowerCase());
        const tu = Array.from(inputs.turnos).some(r => r.checked);
        
        const formValido = (n && em && t && c && tu);
        
        btnEnviar.setAttribute('aria-disabled', !formValido ? 'true' : 'false');

        const feedbackBotao = document.getElementById('feedback-botao-enviar');
        if (!feedbackBotao) return;

        const camposComErro = document.querySelectorAll('.is-invalid, .is-empty');

        const formVazio = inputs.nome.value.trim() === '' && 
                          inputs.email.value.trim() === '' && 
                          inputs.telefone.value.replace(/\D/g, '') === '' && 
                          inputs.curso.value.trim() === '' && 
                          !tu;

        if (formVazio && camposComErro.length === 0) {
            feedbackBotao.innerHTML = "";
            feedbackBotao.style.display = "none";
            return;
        }

        if (formValido) {
            feedbackBotao.innerHTML = '<span aria-hidden="true">✅</span> Todos os campos estão corretos. Pronto para enviar!';
            feedbackBotao.style.color = "var(--cor-sucesso)";
            feedbackBotao.style.display = "block";
        } else {
            if (camposComErro.length === 1) {
                const elementoComErro = camposComErro[0];
                const spanIdArray = elementoComErro.getAttribute('aria-describedby');
                
                if (spanIdArray) {
                    const spanId = spanIdArray.split(' ').find(id => id.startsWith('erro-'));
                    const spanMsg = document.getElementById(spanId);
                    
                    if (spanMsg) {
                        let nomeDoCampo = "Campo";
                        if (elementoComErro.id === 'fieldset-turno') {
                            nomeDoCampo = "Turno do Curso";
                        } else {
                            const label = document.querySelector(`label[for="${elementoComErro.id}"]`);
                            if (label) nomeDoCampo = label.textContent;
                        }

                        let textoErro = spanMsg.textContent.replace('❌ Erro: ', '').replace('⚠️ Atenção: ', '').replace('✅ OK', '');
                        const isInvalid = elementoComErro.classList.contains('is-invalid');
                        const icone = isInvalid ? '❌' : '⚠️';
                        const locucaoAria = isInvalid ? 'Erro:' : 'Atenção:';
                        
                        feedbackBotao.innerHTML = `<span aria-hidden="true">${icone}</span> <span class="sr-only">${locucaoAria}</span> Corrija o campo <strong>${nomeDoCampo}</strong>:<br>${textoErro}`;
                        feedbackBotao.style.color = isInvalid ? 'var(--cor-erro)' : 'var(--cor-aviso)';
                        feedbackBotao.style.display = "block";
                    }
                }
            } else if (camposComErro.length > 1) {
                feedbackBotao.innerHTML = '<span aria-hidden="true">⚠️</span> <span class="sr-only">Atenção:</span> Verifique os campos anteriores: preencha e corrija todos os dados acima para liberar o envio.';
                feedbackBotao.style.color = "var(--cor-aviso)";
                feedbackBotao.style.display = "block";
            } else {
                feedbackBotao.innerHTML = "";
                feedbackBotao.style.display = "none";
            }
        }
    };

    const mostrarModal = (tipo, titulo, texto) => {
        const modal = document.getElementById('modal-feedback');
        const box = document.getElementById('modal-box');
        const icone = document.getElementById('modal-icon');
        const mainContainer = document.querySelector('main.container');
        
        document.getElementById('modal-title').textContent = titulo;
        document.getElementById('modal-desc').textContent = texto;
        
        box.classList.remove('modal-sucesso', 'modal-erro');
        document.getElementById('btn-sucesso-ok').classList.add('hidden');
        document.getElementById('btn-erro-tentar').classList.add('hidden');
        document.getElementById('btn-erro-cancelar').classList.add('hidden');
        
        if (tipo === 'sucesso') {
            icone.innerHTML = '<span aria-hidden="true">✅</span>';
            document.getElementById('modal-title').style.color = 'var(--cor-sucesso)';
            box.classList.add('modal-sucesso');
            document.getElementById('btn-sucesso-ok').classList.remove('hidden');
            falarParaLeitor(`Cadastro com sucesso. ${texto}`, true);
        } else {
            icone.innerHTML = '<span aria-hidden="true">❌</span>';
            document.getElementById('modal-title').style.color = 'var(--cor-erro)';
            box.classList.add('modal-erro');
            document.getElementById('btn-erro-tentar').classList.remove('hidden');
            document.getElementById('btn-erro-cancelar').classList.remove('hidden');
            falarParaLeitor(`Erro no envio. ${texto}`, true);
        }
        
        if (mainContainer) mainContainer.setAttribute('aria-hidden', 'true');
        modal.classList.remove('hidden');

        setTimeout(() => {
            if (tipo === 'sucesso') document.getElementById('btn-sucesso-ok').focus();
            else document.getElementById('btn-erro-tentar').focus();
        }, 50);
    };

    const esconderModal = () => {
        const mainContainer = document.querySelector('main.container');
        document.getElementById('modal-feedback').classList.add('hidden');
        if (mainContainer) mainContainer.removeAttribute('aria-hidden');
    };

    const modalFeedback = document.getElementById('modal-feedback');
    modalFeedback.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            const focusableElements = modalFeedback.querySelectorAll('button:not(.hidden)');
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });

    const resetarFormulario = () => {
        esconderModal();
        form.reset();
        safeRemoveSessionStorage('dadosFormularioUndf');
        
        document.querySelectorAll('.is-valid, .is-invalid, .is-empty').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid', 'is-empty');
            el.removeAttribute('aria-invalid');
        });
        document.querySelectorAll('.msg-feedback').forEach(el => {
            el.style.display = 'none'; 
            el.innerHTML = '';
        });
        
        inputs.curso.setAttribute('aria-describedby', 'instrucao-curso erro-curso');
        
        btnEnviar.setAttribute('aria-disabled', 'true');
        
        const radios = document.querySelectorAll('.radio-item input[type="radio"]');
        radios.forEach(r => {
            r.disabled = false;
            r.parentElement.classList.remove('radio-disabled');
        });

        const feedbackBotao = document.getElementById('feedback-botao-enviar');
        if (feedbackBotao) {
            feedbackBotao.style.display = 'none';
            feedbackBotao.innerHTML = '';
        }

        inputs.nome.focus(); // Devolve o foco de forma limpa para o leitor de tela iniciar novamente
        checarBotaoGeral();
    };

    // CORREÇÃO AQUI: O botão OK chama a limpeza completa e devolve o foco limpo
    document.getElementById('btn-sucesso-ok').addEventListener('click', () => {
        resetarFormulario(); 
    });

    document.getElementById('btn-erro-tentar').addEventListener('click', () => {
        btnEnviar.focus(); 
        esconderModal();
        form.requestSubmit(btnEnviar); 
    });

    document.getElementById('btn-erro-cancelar').addEventListener('click', () => {
        resetarFormulario();
        falarParaLeitor('Formulário limpo e resetado.', true);
    });

    const blockTabHandler = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const loadingBox = document.querySelector('.loading-box');
            if (loadingBox) loadingBox.focus();
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        validarNome(); validarEmail(); validarTelefone(); validarCurso(); validarTurno();
        checarBotaoGeral();
        
        if (isSubmitting || btnEnviar.getAttribute('aria-disabled') === 'true') return;

        isSubmitting = true;

        const telaLoading = document.getElementById('tela-loading');
        const mainContainer = document.querySelector('main.container');
        const loadingBox = telaLoading.querySelector('.loading-box');

        if (mainContainer) mainContainer.setAttribute('aria-hidden', 'true');
        telaLoading.classList.remove('hidden');
        
        if (loadingBox) loadingBox.focus();
        
        document.addEventListener('keydown', blockTabHandler);
        
        btnEnviar.setAttribute('aria-disabled', 'true');
        falarParaLeitor('Enviando dados, por favor aguarde...', true);

        try {
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

            document.removeEventListener('keydown', blockTabHandler);
            telaLoading.classList.add('hidden');
            
            // CORREÇÃO AQUI: Apenas mostra o modal. A limpeza será feita no click do "OK".
            mostrarModal('sucesso', 'Cadastro concluído!', 'Suas informações foram salvas. Verifique seu e-mail institucional em breve.');
            
            isSubmitting = false; 

        } catch (erro) {
            document.removeEventListener('keydown', blockTabHandler);
            telaLoading.classList.add('hidden');
            mostrarModal('erro', 'Falha na conexão', 'Ocorreu um erro ao enviar. Seus dados estão salvos. O que deseja fazer?');
            btnEnviar.setAttribute('aria-disabled', 'false');
            isSubmitting = false; 
        }
    });

    carregarDadosSalvos();
    checarBotaoGeral();
});