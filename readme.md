# Cadastro de Interesse - Laboratório UnDF

Este é o repositório front-end do formulário de Cadastro de Interesse para projetos do Laboratório de Inovação Digital da Universidade do Distrito Federal (UnDF).

## 🎯 Sobre o Projeto

O projeto foi construído com foco primário em **Acessibilidade de Alto Nível (WCAG e WAI-ARIA)** e Usabilidade Avançada, garantindo que qualquer usuário — com ou sem deficiências visuais ou motoras — tenha uma experiência fluida, previsível e segura, compatível com os principais leitores de tela do mercado (NVDA, Narrador, etc).

O formulário valida dados em tempo real, gerencia foco nativo de leitores de tela e oferece salvamento automático de sessão e alteração de tema (Claro/Escuro).

## 🚀 Como Executar e Usar

O projeto foi desenvolvido em **Vanilla JS, HTML5 e CSS3 puro**, o que significa que não há necessidade de instalação de dependências, Node.js ou bundlers. 

1. Faça o download ou clone os arquivos deste repositório para o seu computador.
2. Certifique-se de que os arquivos de logotipo (`logo_undf.png` e `logo_undf_dark.png`) estão na mesma pasta que os códigos.
3. Abra o arquivo `index.html` em qualquer navegador web moderno (Chrome, Edge, Firefox).
4. Para simular e testar o funcionamento da requisição HTTP (mock), basta preencher os campos corretamente e clicar em "Enviar Cadastro".

## ♿ Destaques de Acessibilidade (QA)

* **Leitores de Tela Otimizados:** O texto auxiliar (`.sr-only`) foi limpo de redundâncias para garantir que leitores como o NVDA não entrem em loops de leitura, oferecendo locuções diretas e objetivas. Todos os campos usam `aria-describedby`.
* **Focus Trap (Trava de Foco):** Janelas modais e sobreposições de Loading sequestram fisicamente e virtualmente o teclado, impedindo navegação "fantasma" no fundo da tela.
* **Navegação 100% por Teclado:** O menu suspenso de cursos (`combobox`) permite navegação por setas com loop infinito, atende regras ARIA e atualiza atributos expandidos de forma nativa.
* **Segurança e Anti-Double Submit:** A submissão bloqueia logicamente cliques repetidos sem desativar visualmente o botão, mantendo-o focável para anunciar feedbacks contínuos e erros em tempo real.
* **Proteção de Storage:** O recurso de autossave protege o preenchimento, com mecanismos `try/catch` que previnem quebra de código caso cookies/sessão estejam bloqueados pelo navegador do usuário.