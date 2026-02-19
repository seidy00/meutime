// index.js
import { State } from "./state.js";
import { shuffleArray, parsePote, salvarConfiguracaoNoStorage, carregarConfiguracaoDoStorage, aplicarRiscado } from "./utils.js"
import { drawNextPlayer } from "./logic.js";
import { renderTeams } from "./render.js";

// Garante que o objeto Sorteio existe antes do init
window.Sorteio = window.Sorteio || {};

window.Sorteio.init = function() {
    console.log("DOM carregado e Sorteio.init executado!");

    const resultsArea = document.getElementById('resultsDiv');
    const colorsGrid = document.getElementById('teamColorsGrid');

    function configurarDropdown(containerId, textId, stateKey, callback) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const selectedText = document.getElementById(textId);
        const selectedContainer = container.querySelector('.select-selected');
        const arrow = container.querySelector('.dropdown-arrow');
        const items = container.querySelector('.select-items');
        const options = items.querySelectorAll('div');

        selectedContainer.onclick = (e) => {
                e.stopPropagation();
                
                // Fecha outros e reseta as setas deles
                document.querySelectorAll('.select-items').forEach(el => {
                    if (el !== items) {
                        el.classList.remove('show');
                        el.parentElement.querySelector('.dropdown-arrow').classList.remove('open');
                    }
                });

                const isOpened = items.classList.toggle('show');
                    arrow.classList.toggle('open', isOpened);
                };

        options.forEach(opt => {
            opt.onclick = (e) => {
                e.stopPropagation(); // Impede propagação
                const val = opt.getAttribute('data-value');
                selectedText.innerText = opt.innerText + (stateKey === 'numPotes' ? "" : ""); // Se quiser colocar o nome apenas no que foi selecionado (stateKey === 'numPotes' ? " Potes" : " Times");
                items.classList.remove('show'); // Fecha a lista
                arrow.classList.remove('open'); // Volta a seta

                // ATUALIZA O ESTADO GLOBAL
                const numericVal = parseInt(val);
                if (stateKey === 'numTeams') State.config.numTeams = numericVal;
                if (stateKey === 'numPotes') State.config.numPotes = numericVal;
                
                if (callback) callback(numericVal);
                salvarConfiguracaoNoStorage();
                atualizarEstadoBotoesSorteio();
            };
        });
        document.addEventListener('click', () => {
            document.querySelectorAll('.select-items').forEach(el => el.classList.remove('show'));
            document.querySelectorAll('.dropdown-arrow').forEach(el => el.classList.remove('open'));
        });
    }

    configurarDropdown('numTeamsSelect', 'selectedTeams', 'numTeams', (val) => {
        const qtd = State.config.numTeams;
    
        // 1. Ajusta o array de cores para o novo tamanho
        if (State.config.selectedColors.length > qtd) {
            State.config.selectedColors = State.config.selectedColors.slice(0, qtd);
        }
        
        renderColorGrid(); // Redesenha a grade de cores se mudar os times
        atualizarEstadoBotoesSorteio();
    });

    configurarDropdown('numPotesSelect', 'selectedPotes', 'numPotes', (val) => {
        // Aqui chamamos a função que esconde/mostra as colunas dos potes
        renderPotesVisual(val); 
    });

    // Fechar ao clicar fora
    document.addEventListener('click', () => {
        document.querySelectorAll('.select-items').forEach(el => el.classList.add('hidden'));
    });

    function atualizarEstadoBotoesSorteio() {
        const btnStart = document.getElementById('btnStartDrawing');
        const btnFull = document.getElementById('btnFullDraw');
        const btnSingle = document.getElementById('btnSingleDraw');
        const btnPote = document.getElementById('btnPoteDraw');
        
        const coresValidas = validarCoresParaSorteio();
        let temJogadores = false;

        if (faseSorteio === "preparar") {
            // Verifica se há pelo menos um nome não riscado em qualquer pote ativo
            for (let i = 1; i <= State.config.numPotes; i++) {
                const tx = document.getElementById(`pote${i}`);
                const nomesValidos = parsePote(tx.value).filter(n => !n.includes('OK'));
                if (nomesValidos.length > 0) {
                    temJogadores = true;
                    break;
                }
            }
        } else {
            // Se já começou, os botões dependem da fila (drawQueue)
            temJogadores = State.drawQueue.length > 0;
        }

        const podeSortear = temJogadores && coresValidas;

        // Bloqueia ou desbloqueia
        [btnStart, btnFull, btnSingle, btnPote].forEach(btn => {
            if (btn) {
                btn.disabled = !podeSortear;
                if (!coresValidas && temJogadores) {
                    btn.title = `Selecione exatamente ${State.config.numTeams} cores`;
                } else {
                    btn.title = "";
                }
            }
        });
    }

    function validarCoresParaSorteio() {
        const qtdTimes = State.config.numTeams;
        const qtdCores = State.config.selectedColors.length;
        
        // Retorna verdadeiro apenas se as cores baterem com os times
        return qtdCores === qtdTimes;
    }

    function prepararEscudos() {
        // Cria uma cópia e embaralha
        State.shuffledShields = shuffleArray([...State.shieldPaths]);
    }

    // Função central para garantir que todos os botões usem a mesma fila
    function garantirSorteioIniciado() {
        if (faseSorteio === "preparar") { // Usaremos uma variável global única agora
            salvarConfiguracaoNoStorage();
            prepararEscudos();

            const numTeams = State.config.numTeams;
            const numPotesAtivos = State.config.numPotes;

            // 1. Inicializa times se estiverem vazios
            if (State.teams.length === 0) {
                const colors = shuffleArray([...State.config.selectedColors]);
                State.teams = Array.from({ length: numTeams }, (_, i) => ({
                    id: i,
                    color: colors[i] || '#808080',
                    players: [],
                    tacticVariant: null
                }));
            }

            // 2. Monta a fila única se estiver vazia
            if (State.drawQueue.length === 0) {
                for (let i = 1; i <= numPotesAtivos; i++) {
                    const tx = document.getElementById(`pote${i}`);
                    const nomes = shuffleArray(parsePote(tx.value));
                    // Importante: filtramos apenas nomes que NÃO estão riscados (caso queira retomar)
                    nomes.forEach(n => {
                        if (!n.includes('\u0336')) { 
                            State.drawQueue.push({ name: n, pote: i });
                        }
                    });
                    tx.readOnly = true;
                    tx.style.opacity = "0.6";
                }
            }

            alternarBloqueioConfiguracao(true); //Bloqueia as opções (Qtd. time, Qtd. Potes e cores) durante o sorteio
            renderTeams(State.teams);
            faseSorteio = "sortear";
            scrollParaResultados();

            return false; //RETORNA FALSE: Indica que apenas "preparou", não deve sortear ainda
        }
        return State.drawQueue.length > 0;
    }

    function scrollParaResultados() {
        resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- FUNÇÃO PARA INICIAR ---
    const btnStart = document.getElementById('btnStartDrawing');
    const drawingActions = document.getElementById('drawingActions');
    btnStart.onclick = () => {
        // 1. Esconde o botão de "Iniciar" e mostra os de "Sorteio"
        btnStart.style.display = 'none';
        drawingActions.style.display = 'flex';

        // 2. Chama a lógica que você já tem para validar e criar os times
        // (Geralmente a função que renderiza os cards vazios)
        garantirSorteioIniciado();
    };

    // --- FUNÇÃO PARA SORTEAR TUDO ---
    const btnFull = document.getElementById('btnFullDraw');
    btnFull.onclick = () => {
        if (!garantirSorteioIniciado()) return;

        // Consome toda a fila restante de uma vez
        while (State.drawQueue.length > 0) {
            const p = State.drawQueue.shift();
            drawNextPlayer(p.name, p.pote, State.teams);
            riscarNomeNoCampo(p.name, p.pote);
        }

        renderTeams(State.teams);
        //alert("Sorteio Completo!");
        atualizarEstadoBotoesSorteio();
        scrollParaResultados();
    };
    
    // --- FUNÇÃO PARA SORTEAR UM JOGADOR POR VEZ ---
    const btnSingle = document.getElementById('btnSingleDraw'); // Variável de controle para saber se o sorteio individual começou
    let faseSorteio = "preparar"; // Estados: "preparar", "sortear"
    btnSingle.onclick = () => {
        if (!garantirSorteioIniciado()) return;

        const nextPlayer = State.drawQueue.shift(); 
        if (nextPlayer) {
            // 1. Define no State quem é o novo jogador para o render.js saber quem animar
            State.ultimoJogadorNome = null;

            const timeAlvo = drawNextPlayer(nextPlayer.name, nextPlayer.pote, State.teams);
            riscarNomeNoCampo(nextPlayer.name, nextPlayer.pote);

            // 2. Define quem é o ATUAL jogador que deve animar
            State.ultimoJogadorNome = nextPlayer.name;

            // 3. Rola o card do time
            const cards = document.querySelectorAll('.team');
            const cardElemento = cards[timeAlvo.id]; // O ID do time corresponde ao índice do card

            if (cardElemento) {
                cardElemento.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest', // Evita que a página pule muito verticalmente
                    inline: 'center'  // No Mobile, centraliza o card horizontalmente no carrossel
                });

                // Feedback Visual (Opcional): Faz o card brilhar rapidamente com a cor do time
                /*cardElemento.style.transition = '0.3s';
                cardElemento.style.boxShadow = `0 0 15px ${timeAlvo.color}`;
                setTimeout(() => {
                    cardElemento.style.boxShadow = 'none';
                }, 800);*/
            }

            // 4. Aguarda a rolagem (400ms) para renderizar o pin com a animação
            setTimeout(() => {
                renderTeams(State.teams);
                atualizarEstadoBotoesSorteio();
            }, 400);
        }
    };

    // --- FUNÇÃO PARA SORTEAR UM POTE POR VEZ ---
    const btnPote = document.getElementById('btnPoteDraw');
    btnPote.onclick = () => {
        if (!garantirSorteioIniciado()) return;

        // Identifica qual o pote do próximo jogador da fila
        const poteAlvo = State.drawQueue[0].pote;

        if (!poteAlvo) return;
        // Remove e sorteia todos os jogadores que pertencem a esse mesmo pote
        while (State.drawQueue.length > 0 && State.drawQueue[0].pote === poteAlvo) {
            const p = State.drawQueue.shift();
            drawNextPlayer(p.name, p.pote, State.teams);
            riscarNomeNoCampo(p.name, p.pote);
        }

        renderTeams(State.teams);
        atualizarEstadoBotoesSorteio();
        scrollParaResultados();
    };

    // FUNÇÃO PARA RISCAR OS NOMES SORTEADOS
    function riscarNomeNoCampo(nome, poteNum) {
    aplicarRiscado(`pote${poteNum}`, nome); // Chamamos apenas a função do utils que já faz todo o trabalho de procurar, limpar espaços e riscar dentro do textarea correto.
    }
    
    // --- FUNÇÃO PARA CONTAR A QUANTIDADE DE JOGADORES ---
    function configurarContadores() {
        for (let i = 1; i <= 4; i++) {
            const textarea = document.getElementById(`pote${i}`);
            const counter = document.getElementById(`count-pote${i}`);

            textarea.addEventListener('input', () => {
                // Usa a sua função parsePote existente para contar nomes válidos
                const nomes = parsePote(textarea.value);
                const qtd = nomes.length;
                counter.innerText = `${qtd} ${qtd === 1 ? 'Jogador' : 'Jogadores'}`;
                
                /*// Destaque visual se houver nomes
                counter.style.color = qtd > 0 ? '#4CAF50' : '#888';*/

                atualizarEstadoBotoesSorteio();
            });
        }
    }
    configurarContadores();

    // SALVAR AS INFORMAÇÕES DE TIMES, CORES E POTES
    document.getElementById('numTeamsSelect').addEventListener('change', salvarConfiguracaoNoStorage);
    document.getElementById('numPotesSelect').addEventListener('change', salvarConfiguracaoNoStorage);

    // EVENTO PARA SALVAR NOMES ENQUANTO O USUÁRIO DIGITA
    for(let i=1; i<=4; i++) {
        document.getElementById(`pote${i}`).addEventListener('input', salvarConfiguracaoNoStorage);
    }

    // FUNÇÃO PARA O BOTÃO RESETAR SORTEIO
    window.resetarTudo = function() {
        // 1. Volta a fase do sorteio para o início
        faseSorteio = "preparar";
        
        // 2. Limpa os dados internos do State
        State.teams = [];
        State.drawQueue = [];
        State.ultimoJogadorNome = null;
        State.shuffledShields = [];
        
        // 3. Destrava os botões
        /*const btnSingle = document.getElementById('btnSingleDraw');
        btnSingle.innerText = "Sortear 1 Jogador";
        btnSingle.disabled = false;

        const btnPote = document.getElementById('btnPoteDraw');
        if (btnPote) {
            btnPote.innerText = "Sortear Pote";
            btnPote.disabled = false;
        }*/

        alternarBloqueioConfiguracao(false); //Libera as opções (Qtd. time, Qtd. Potes e cores)

        // RECARREGAR NOMES ORIGINAIS AQUI
        carregarConfiguracaoDoStorage();

        // Recarrega os nomes
        const salvo = localStorage.getItem('sorteio_backup');
        if (salvo) {
            const dados = JSON.parse(salvo);
            document.getElementById('pote1').value = dados.pote1;
            document.getElementById('pote2').value = dados.pote2;
            document.getElementById('pote3').value = dados.pote3;
            document.getElementById('pote4').value = dados.pote4;
        }

        // 4. "Descongela" os Potes (Textareas)
        for (let i = 1; i <= 4; i++) {
            const tx = document.getElementById(`pote${i}`);
            if (tx) {
                tx.readOnly = false;
                tx.style.opacity = "1";
                tx.style.backgroundColor = ""; // Volta ao CSS original
                tx.dispatchEvent(new Event('input'));
                // Opcional: Se você usou o "--- OK ---", aqui você pode 
                // limpar apenas as marcações de sorteio se quiser manter os nomes originais.
                // Se você não mudou o texto do textarea, os nomes já estarão lá.
            }
        }

        // 5. Limpa os resultados visuais (os campos de futebol)
        const resultsDiv = document.getElementById('resultsDiv');
        if (resultsDiv) {
            resultsDiv.innerHTML = "";
        }

        const resultsDots = document.getElementById('resultsDots');
        if (resultsDots) resultsDots.innerHTML = '';

        btnStart.style.display = 'inline-flex';
        drawingActions.style.display = 'none';

        atualizarEstadoBotoesSorteio();
        setupCarouselDots('potesContainer', 'potesDots');
        console.log("Sistema resetado. Potes liberados para edição.");
    };

    // --- FUNÇÃO PARA O BOTÃO LIMPAR ---
    window.limparPote = function(idPote) {
        const textarea = document.getElementById(idPote);
        textarea.value = '';
        // Dispara o evento de input manualmente para zerar o contador
        textarea.dispatchEvent(new Event('input'));
    };

    // --- FUNÇÃO PARA MOSTRAR/ESCONDER POTES ---
    function renderPotesVisual(qtd) {
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById(`poteArea${i}`);
            if (el) {
                if (i <= qtd) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            }
        }
    }
    window.renderPotesVisual = renderPotesVisual; // Torne-a global para o utils.js conseguir enxergar

    window.setupCarouselDots = function(containerId, dotsId) {
        const container = document.getElementById(containerId);
        const dotsContainer = document.getElementById(dotsId);
        
        if (!container || !dotsContainer) return;

        const updateDots = () => {
            // Buscamos os itens reais dentro do grid (pote-column ou team)
            // Isso resolve o problema da estrutura aninhada
            const items = Array.from(container.querySelectorAll('.pote-column, .team')).filter(el => {
                return window.getComputedStyle(el).display !== 'none';
            });

            dotsContainer.innerHTML = '';
            
            // Se houver apenas 1 item visível, não precisa de bolinhas
            if (items.length <= 1) return;

            const scrollLeft = container.scrollLeft;
            const containerWidth = container.clientWidth;
            
            // Descobre qual item está mais visível no centro da tela
            let activeIndex = 0;
            if (container.scrollWidth > containerWidth) {
                activeIndex = Math.round(scrollLeft / (container.scrollWidth - containerWidth) * (items.length - 1));
            }

            items.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.className = 'dot' + (idx === activeIndex ? ' active' : '');
                dotsContainer.appendChild(dot);
            });
        };

        container.addEventListener('scroll', updateDots);
        
        // Observa mudanças de visibilidade (ex: mudar de 1 para 3 potes)
        const observer = new MutationObserver(updateDots);
        observer.observe(container, { attributes: true, childList: true, subtree: true });
        
        // Força uma atualização inicial
        setTimeout(updateDots, 100); 
    }

    // --- FUNÇÃO PARA GERAR QUADRADINHOS DE CORES ---
    function renderColorGrid() {
        const qtdTimes = State.config.numTeams;
        const selecionadas = State.config.selectedColors.length;
        const limiteAtingido = selecionadas >= qtdTimes; // Verifica se atingiu o limite

        // Atualiza o contador visual no label
        const labelCores = document.querySelector('.selected-colors label');
        if (labelCores) {
            labelCores.innerText = `(${selecionadas}/${qtdTimes})`;
            labelCores.style.color = selecionadas === qtdTimes ? "#28B84C" : "#FF7418";
        }

        colorsGrid.innerHTML = '';
        colorsGrid.className = 'colors-grid-simple'; // Classe para estilização em linha

        Object.entries(State.availableColors).forEach(([name, colorCode]) => {
            const isSelected = State.config.selectedColors.includes(colorCode);
            
            const square = document.createElement('div');
            square.className = 'color-static-square';
            square.style.backgroundColor = colorCode;
            square.title = name;
            
            if (isSelected) {
                square.classList.add('selected');
            } else if (limiteAtingido) {
                // Se o limite foi atingido e esta cor NÃO está selecionada, bloqueia ela
                //square.style.opacity = "0.2";
                //square.style.cursor = "not-allowed";
                //square.style.filter = "grayscale(0.8)";
                square.classList.add('rejected');
            }

            square.onclick = () => {
                const index = State.config.selectedColors.indexOf(colorCode);
                
                if (index > -1) {
                    // Se já estava selecionada, removemos (sempre permitido)
                    State.config.selectedColors.splice(index, 1);
                } else {
                    // Só permite adicionar se ainda não atingiu o limite
                    if (!limiteAtingido) {
                        State.config.selectedColors.push(colorCode);
                    } else {
                        return; // Sai da função sem fazer nada se estiver bloqueado
                    }
                }
                
                salvarConfiguracaoNoStorage();
                atualizarEstadoBotoesSorteio();
                renderColorGrid(); // Re-renderiza para atualizar o estado visual de todas
            };

            colorsGrid.appendChild(square);
        });
    }

    window.atualizarCoresCarregadas = function(coresSalvas) {
        // Garante que o State receba as cores do LocalStorage
        State.config.selectedColors = coresSalvas || [];
        renderColorGrid(); // Redesenha a grade marcando os quadradinhos ativos
    };

    document.getElementById('numTeamsSelect').addEventListener('change', () => {
        // Se o usuário diminuir os times, removemos o excesso de cores selecionadas
        const qtd = State.config.numTeams;
        if (State.config.selectedColors.length > qtd) {
            State.config.selectedColors = State.config.selectedColors.slice(0, qtd);
        }
        renderColorGrid();
        salvarConfiguracaoNoStorage();
    });

    function alternarBloqueioConfiguracao(bloquear) {
        // 1. Bloqueia os Dropdowns Customizados
        const dropdowns = [
            document.getElementById('numTeamsSelect'), // Container de Times
            document.getElementById('numPotesSelect')  // Container de Potes
        ];

        dropdowns.forEach(div => {
            if (div) {
                div.style.pointerEvents = bloquear ? 'none' : 'auto';
                div.style.opacity = bloquear ? '0.6' : '1';
                div.style.filter = bloquear ? 'grayscale(1)' : 'none';
            }
        });

        // 2. Bloqueia cliques nas cores
        const cores = document.querySelectorAll('.color-static-square');
        cores.forEach(c => {
            c.style.pointerEvents = bloquear ? 'none' : 'auto';
            c.style.opacity = bloquear ? '0.5' : '1';
        });

        // 3. Bloqueia os botões "Limpar" dos potes
        const botoesLimpar = document.querySelectorAll('.btn-clear');
        botoesLimpar.forEach(btn => {
            btn.disabled = bloquear;
            btn.style.opacity = bloquear ? '0.5' : '1';
        });
    }

    window.toggleViewMode = () => {
        State.viewMode = State.viewMode === 'initial' ? 'pote' : 'initial';
        const btn = document.getElementById('btnViewMode');
        const carousel = document.getElementById('team-carousel');
        
        if (btn) btn.classList.toggle('active', State.viewMode === 'pote');
        if (carousel) carousel.classList.toggle('view-mode-pote', State.viewMode === 'pote');
    };
    window.toggleLayoutMode = () => {
        State.layoutMode = State.layoutMode === 'pitch' ? 'list' : 'pitch';
        const btn = document.getElementById('btnLayoutMode');
        const carousel = document.getElementById('team-carousel');
        
        if (btn) btn.classList.toggle('active', State.layoutMode === 'list');
        if (carousel) carousel.classList.toggle('layout-mode-list', State.layoutMode === 'list');
    };

    setupCarouselDots('potesContainer', 'potesDots');
    carregarConfiguracaoDoStorage();
};

// Executa o init manualmente caso o main.js falhe
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.Sorteio.init();
} else {
    document.addEventListener('DOMContentLoaded', window.Sorteio.init);
}