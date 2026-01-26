// logic.js
import { shuffleArray } from "./utils.js";

/**
 * Distribui jogadores respeitando a regra de ouro: 
 * Diferença máxima de 1 jogador entre os times.
 */
export function fullDraw(potes, numTeams, colors) {
    // 1. Inicializa os times
    let teams = Array.from({ length: numTeams }, (_, i) => ({
        id: i,
        color: colors[i] || '#808080',
        players: []
    }));

    // 2. Processa cada pote em ordem (1 a 4)
    for (let p = 1; p <= 4; p++) {
        const poteKey = `pote${p}`;
        const playersInPote = shuffleArray([...potes[poteKey]]);

        playersInPote.forEach(playerNameRaw => {
            const playerName = playerNameRaw.trim();

            // Encontra o time com menos jogadores no momento
            // Se houver empate, o filter pega todos e o sorteio escolhe um
            const minPlayers = Math.min(...teams.map(t => t.players.length));
            const candidateTeams = teams.filter(t => t.players.length === minPlayers);
            
            // Prioridade para quem não tem goleiro se estivermos no Pote 1
            let targetTeam;
            if (p === 1) {
                const noGkTeams = candidateTeams.filter(t => !t.players.some(pl => pl.pote === 1));
                targetTeam = noGkTeams.length > 0 
                    ? noGkTeams[Math.floor(Math.random() * noGkTeams.length)]
                    : candidateTeams[Math.floor(Math.random() * candidateTeams.length)];
            } else {
                targetTeam = candidateTeams[Math.floor(Math.random() * candidateTeams.length)];
            }

            targetTeam.players.push({ name: playerName, pote: p });
        });
    }

    return teams;
}

export function drawNextPlayer(playerNameRaw, poteOrigem, teams) {
    const playerName = playerNameRaw.trim();

    // 1. Encontrar a quantidade mínima de jogadores que um time tem
    const minPlayers = Math.min(...teams.map(t => t.players.length));
    
    // 2. Candidatos: times que têm o número mínimo de jogadores
    let candidates = teams.filter(t => t.players.length === minPlayers);

    // 3. Se o jogador for do Pote 1 (Goleiro), priorizar times sem goleiro entre os candidatos
    if (poteOrigem === 1) {
        const noGkTeams = candidates.filter(t => !t.players.some(p => p.pote === 1));
        if (noGkTeams.length > 0) candidates = noGkTeams;
    }

    // 4. Sortear um entre os candidatos válidos
    const chosenTeam = candidates[Math.floor(Math.random() * candidates.length)];
    
    // 5. Adicionar o jogador
    chosenTeam.players.push({ name: playerName, pote: poteOrigem });
    
    return chosenTeam; // Retorna o time que recebeu para podermos animar ou destacar
}