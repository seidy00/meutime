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

export function renderTeams(teams) {
    const resultsDiv = document.getElementById('resultsDiv');
    resultsDiv.innerHTML = ''; 

    teams.forEach((team, index) => {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team show';
        teamDiv.style.setProperty('--team-color', team.color);
        
        const nomeDoTime = getNomeDaCor(team.color);
        const shieldPath = State.shuffledShields[index % State.shuffledShields.length] || State.shieldPaths[0];

        const textColor = getContrastingColor(team.color);
        const reservas = team.players.slice(5);

        teamDiv.innerHTML += `
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
            
            <div class="bench-container ${reservas.length > 0 ? '' : 'hidden'}">
                <p class="bench-title">Substituições</p>
                <div class="bench-list">
                    ${reservas.map(p => `
                        <div class="bench-player-item">
                            <div class="player-pin mini" style="background-color: ${team.color}; color: ${textColor}">
                                ${p.name.charAt(0).toUpperCase()}
                            </div>
                            <span class="bench-player-name">${p.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        resultsDiv.appendChild(teamDiv);
    });
}

function renderPlayersInPitch(team, color) {
    const allPlayers = team.players || [];
    const textColor = getContrastingColor(color);
    
    const titulares = allPlayers.slice(0, 5);
    const gkIndex = titulares.findIndex(p => p.pote === 1);
    let linePlayers = [...titulares];
    let gkPlayer = null;

    if (gkIndex !== -1) {
        gkPlayer = linePlayers.splice(gkIndex, 1)[0];
    }

    const numLine = linePlayers.length;
    if (numLine === 0 && !gkPlayer) return '';

    const variantes = nonGKPositions[numLine] || [];
    if (team.lastLineCount !== numLine || team.tacticVariant === undefined) {
        team.tacticVariant = Math.floor(Math.random() * variantes.length);
        team.lastLineCount = numLine; 
    }

    const táticaEscolhida = variantes[team.tacticVariant] || variantes[0] || [];

    // --- LÓGICA DE ANIMAÇÃO ---
    // Pegamos o nome do último jogador do State
    const ultimoNome = State.ultimoJogadorNome ? State.ultimoJogadorNome.trim() : null;
    
    let html = '';

    // Renderiza Goleiro
    if (gkPlayer) {
        // Verifica se o goleiro é o recém-chegado
        const animarGK = (gkPlayer.name.trim() === ultimoNome) ? 'animar-pin' : '';
        html += `<div class="player-marker pos-gk ${animarGK}">
            <div class="player-pin" style="background-color: ${color}; color: ${textColor}">${gkPlayer.name.charAt(0).toUpperCase()}</div>
            <div class="player-name">${gkPlayer.name}</div>
        </div>`;
    }

    // Renderiza Jogadores de linha
    linePlayers.forEach((player, i) => {
        const classePosicao = táticaEscolhida[i] || 'f0-m1';
        // Verifica se este jogador de linha é o recém-chegado
        const animarLinha = (player.name.trim() === ultimoNome) ? 'animar-pin' : '';
        
        html += `<div class="player-marker ${classePosicao} ${animarLinha}">
            <div class="player-pin" style="background-color: ${color}; color: ${textColor}">
                ${player.name.charAt(0).toUpperCase()}
            </div>
            <div class="player-name">${player.name}</div>
        </div>`;
    });

    return html;
}