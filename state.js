// state.js
export const State = {
    availableColors: {
        'Preto': '#000000',
        'Vermelho': '#E73B3B',
        'Laranja': '#FF7418',
        'Amarelo': '#FFD02B',
        'Verde': '#28B84C',
        'Ciano': '#25DCE6',
        'Azul': '#2A3EFE',
        'Branco': '#ECEDEF'
    },
    config: {
        numTeams: [],
        numPotes: [],
        selectedColors: []
    },
    // Para o sorteio por clique:
    currentPoteIndex: 1,
    currentPlayersQueue: [],
    ultimoJogadorNome: null,
    drawQueue: [],
    teams: [],
    lastShared: null,
    shieldPaths: [
        '<path d="M60,0S35.33,12.13,0,14.25v67.44c0,26.6,24.25,57.24,60,68.3,35.75-11.06,60-41.7,60-68.3V14.25C84.67,12.13,60,0,60,0Z"/>', 
        '<path d="M55,0S17.55,0,0,9.19v97.9c0,35.41,49.16,26.85,55,42.91,5.84-16.06,55-7.5,55-42.91V9.19C92.45,0,55,0,55,0Z"/>', 
        '<circle cx="75" cy="75" r="75"/>', 
        '<path d="M104.39,0l-39.39,10.85L25.61,0,0,34.14s13.73,16.4,13.73,49.42c0,46.36,51.27,66.44,51.27,66.44,0,0,51.27-20.08,51.27-66.44,0-33.02,13.73-49.42,13.73-49.42L104.39,0Z"/>', 
        '<polygon points="60 0 0 75 60 150 120 75 60 0"/>', 
        '<path d="M60,0L0,41.98s6.11,30.88,10.32,51.09c7.78,37.31,39.18,46.43,49.68,56.93,10.5-10.5,41.89-19.62,49.68-56.93,4.22-20.21,10.32-51.09,10.32-51.09L60,0Z"/>',
        '<ellipse cx="47.5" cy="75" rx="47.5" ry="75"/>',
        '<path d="M145,0H0s-1.1,112.12,72.5,150h0s0,0,0,0c0,0,0,0,0,0h0C146.1,112.12,145,0,145,0Z"/>'
    ],
    shuffledShields: [], // Onde guardaremos a ordem sorteada
    viewMode: 'initial',
    layoutMode: 'pitch',
};