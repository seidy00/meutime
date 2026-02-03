// render.js
import { State } from "./state.js";

const nonGKPositions = {
    1: [['f0-m1']], 
    2: [['f2L-d1', 'f2L-d2']], 
    3: [['f3L-d1', 'f3L-m1', 'f3L-m2']], 
    4: [['f1-d1', 'f1-d2', 'f1-m1', 'f1-a1'], ['f2-d1', 'f2-m1', 'f2-m2', 'f2-a1'], ['f3-d1', 'f3-m1', 'f3-m2', 'f3-a1']], 
    5: [['pos-5-d1', 'pos-5-d2', 'pos-5-m1', 'pos-5-a1', 'pos-5-a2']],
};

function getNomeDaCor(hex) {
    const corEncontrada = Object.entries(State.availableColors).find(([name, code]) => code.toLowerCase() === hex.toLowerCase());
    return corEncontrada ? corEncontrada[0] : "Time";
}

function getContrastingColor(hex) {
    const lightColors = ['#ffd02b', '#25dce6', '#ecedef']; // Amarelo, Ciano, Branco
    return lightColors.includes(hex.toLowerCase()) ? '#000000' : '#ecedef';
}

function getPinHTML(player) {
    return `
        <div class="pin-content">
            <span class="info-initial">${player.name.charAt(0).toUpperCase()}</span>
            <span class="info-pote">${player.pote}</span>
        </div>
    `;
}

export function renderTeams(teams) {
    const resultsDiv = document.getElementById('resultsDiv');
    if (!resultsDiv) return;

    if (!teams || teams.length === 0) {
        resultsDiv.innerHTML = '';
        return;
    }

    // Tenta encontrar o carrossel já existente
    let carouselContainer = document.getElementById('team-carousel');

    // Se o carrossel NÃO existe, criamos a estrutura inicial
    if (!carouselContainer) {
        resultsDiv.innerHTML = '';
        
        const headerSection = document.createElement('div');
        headerSection.className = 'results-header-actions';
        headerSection.innerHTML = `
            <h2>Escalações</h2>
            <div class="header-buttons">
                <button id="btnViewMode" onclick="window.toggleViewMode()" class="btn-toggle-info">
                    Potes
                </button>
                <button id="btnLayoutMode" onclick="window.toggleLayoutMode()" class="btn-toggle-info">
                    Lista
                </button>
            </div>
        `;
        resultsDiv.appendChild(headerSection);

        carouselContainer = document.createElement('div');
        carouselContainer.className = 'teams-carousel-wrapper';
        carouselContainer.id = 'team-carousel';
        resultsDiv.appendChild(carouselContainer);
    }

    // APLICAÇÃO DOS ESTADOS (Cores e Visibilidade)
    const btnPote = document.getElementById('btnViewMode');
    const btnLista = document.getElementById('btnLayoutMode');

    // Se o State estiver como 'pote', adiciona classe ativa, senão remove
    btnPote.classList.toggle('active', State.viewMode === 'pote');
    btnLista.classList.toggle('active', State.layoutMode === 'list');

    // Aplica as classes no container para o CSS controlar o que aparece
    carouselContainer.classList.toggle('view-mode-pote', State.viewMode === 'pote');
    carouselContainer.classList.toggle('layout-mode-list', State.layoutMode === 'list');

    // LIMPA E RECONSTRÓI APENAS OS CARDS (Necessário para novos jogadores)
    // Mas como o 'carouselContainer' não é deletado, o scroll-bar pai se mantém estável
    carouselContainer.innerHTML = '';

    // 4. Renderizar os times
    teams.forEach((team, index) => {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team';
        
        //teamDiv.style.setProperty('--team-color', team.color);
        const nomeDoTime = getNomeDaCor(team.color);
        const shieldPath = State.shuffledShields[index % State.shuffledShields.length] || State.shieldPaths[0];
        const textColor = getContrastingColor(team.color);
        const reservas = team.players.slice(5);

        teamDiv.innerHTML = `
            <div class="team-header">
                <div class="name-and-color">
                    <svg class="team-shield" viewBox="0 0 150 150" width="30" height="30">
                        <g fill="${team.color}">${shieldPath}</g>
                    </svg>
                    ${nomeDoTime}
                </div>
                <div class="info-text">
                    <strong>${team.players.length} Jogadores</strong>
                </div>
            </div>

            <div class="pitch-container">
                <div class="soccer-pitch">
                    <div class="line-top"></div>
                    <div class="left-corner-kick"></div>
                    <div class="right-corner-kick"></div>
                    <div class="penalty-box"></div>
                    <div class="six-yard-box"></div>
                    <div class="penalty-spot"></div>
                    <div class="penalty-arc"></div>
                    <div class="center-circle"></div>
                    ${renderPlayersInPitch(team, team.color)}
                </div>
            </div>

            ${renderPlayersList(team.players)}
            
            <div class="bench-container ${reservas.length > 0 ? '' : 'hidden'}">
                <p class="bench-title">Substituições</p>
                <div class="bench-list">
                    ${reservas.map(p => `
                        <div class="bench-player-item">
                            <div class="player-pin mini" style="background-color: ${team.color}; color: ${textColor}">
                                ${getPinHTML(p)}
                            </div>
                            <span class="bench-player-name">${p.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        carouselContainer.appendChild(teamDiv);
    });
    if (window.setupCarouselDots) {
        window.setupCarouselDots('team-carousel', 'resultsDots');
    }
}

function renderPlayersInPitch(team, color) {
    const allPlayers = team.players || [];
    const textColor = getContrastingColor(color);
    const ultimoNome = State.ultimoJogadorNome ? State.ultimoJogadorNome.trim() : null;

    // 1. Pegamos os 5 titulares
    let titulares = allPlayers.slice(0, 5);
    if (titulares.length === 0) return '';

    // 2. BUSCA PELO GOLEIRO:
    // Primeiro, tentamos achar alguém do Pote 1
    let gkIndex = titulares.findIndex(p => p.pote === 1);
    
    // REGRA DE OURO: Se não houver ninguém do Pote 1, 
    // o primeiro jogador da lista vira o goleiro "quebra-galho"
    if (gkIndex === -1 && titulares.length > 0) {
        gkIndex = 0; 
    }

    let linePlayers = [...titulares];
    let gkPlayer = null;

    // Remove o goleiro escolhido da lista de jogadores de linha
    if (gkIndex !== -1) {
        gkPlayer = linePlayers.splice(gkIndex, 1)[0];
    }

    // 3. Lógica de Táticas (agora baseada nos jogadores que sobraram na linha)
    const numLine = linePlayers.length;
    const variantes = nonGKPositions[numLine] || [];
    
    if (team.lastLineCount !== numLine || team.tacticVariant === undefined) {
        team.tacticVariant = Math.floor(Math.random() * variantes.length);
        team.lastLineCount = numLine; 
    }

    const táticaEscolhida = variantes[team.tacticVariant] || variantes[0] || [];
    let html = '';

    // Renderiza o Goleiro (seja ele Pote 1 ou não)
    if (gkPlayer) {
        const animarGK = (gkPlayer.name.trim() === ultimoNome) ? 'animar-pin' : '';
        html += `<div class="player-marker pos-gk ${animarGK}">
            <div class="player-pin" style="background-color: ${color}; color: ${textColor}">
                ${getPinHTML(gkPlayer)}
            </div>
            <div class="player-name">${gkPlayer.name}</div>
        </div>`;
    }

    // Renderiza os Jogadores de Linha restantes
    linePlayers.forEach((player, i) => {
        const classePosicao = táticaEscolhida[i] || 'f0-m1';
        const animarLinha = (player.name.trim() === ultimoNome) ? 'animar-pin' : '';
        html += `<div class="player-marker ${classePosicao} ${animarLinha}">
            <div class="player-pin" style="background-color: ${color}; color: ${textColor}">
                ${getPinHTML(player)}
            </div>
            <div class="player-name">${player.name}</div>
        </div>`;
    });

    return html;
}

function renderPlayersList(players) {
    // Ordenamos a lista por pote para ficar organizado
    const sortedPlayers = [...players].sort((a, b) => a.pote - b.pote);
    
    return `
        <div class="team-list-view">
            <div class="list-color-team"></div>
            <div class="list-header">
                <span>Jogador</span>
                <span>Pote</span>
            </div>
            ${sortedPlayers.map(p => `
                <div class="list-item">
                    <span class="player-name-list">${p.name}</span>
                    <span class="player-pote-list">${p.pote}</span>
                </div>
            `).join('')}
        </div>
    `;
}