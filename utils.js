// utils.js
import { State } from "./state.js";

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function parsePote(text) {
    if (!text) return [];
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

// Salva os dados (Lista de jogadores, Qtd. de times, Qtd. de Potes e Cores escolhidas)
export function salvarConfiguracaoNoStorage() {
    const pote1 = document.getElementById('pote1');
    if (pote1 && pote1.readOnly) return;
    
    const configuracao = {
        potesTexto: {
            pote1: document.getElementById('pote1').value,
            pote2: document.getElementById('pote2').value,
            pote3: document.getElementById('pote3').value,
            pote4: document.getElementById('pote4').value
        },
        numTeams: State.config.numTeams,
        numPotes: State.config.numPotes,
        cores: [...State.config.selectedColors]
    };
    localStorage.setItem('sorteio_config_total', JSON.stringify(configuracao));
}

export function carregarConfiguracaoDoStorage() {
    const salvo = localStorage.getItem('sorteio_config_total');
    if (!salvo) return;

    const config = JSON.parse(salvo);

    // 1. Restaurar Quantidade de Times PRIMEIRO
    if (config.numTeams) {
        State.config.numTeams = config.numTeams;
        const label = document.getElementById('selectedTeams');
        if (label) label.innerText = `${config.numTeams} Times`;
    }

    // 2. Restaurar Cores chamando a função global que criamos
    if (config.cores && config.cores.length > 0) {
        if (window.atualizarCoresCarregadas) {
            window.atualizarCoresCarregadas(config.cores);
        }
    }

    // 3. Restaurar Potes e forçar a visibilidade
    if (config.numPotes) {
        State.config.numPotes = config.numPotes;
        const label = document.getElementById('selectedPotes');
        if (label) label.innerText = `${config.numPotes} ${config.numPotes > 1 ? 'Potes' : 'Pote'}`;
        
        if (window.renderPotesVisual) {
            window.renderPotesVisual(config.numPotes);
        }
    }

    // 4. Restaurar os nomes nos textareas
    if (config.potesTexto) {
        for (let i = 1; i <= 4; i++) {
            const tx = document.getElementById(`pote${i}`);
            if (tx) {
                tx.value = config.potesTexto[`pote${i}`] || '';
                tx.dispatchEvent(new Event('input')); // Atualiza contadores
            }
        }
    }
}

// Função que risca o nome dos jogadores usando caracteres Unicode especiais
export function aplicarRiscado(poteId, nomeSorteado) {
    if (!nomeSorteado) return; // Segurança contra valores nulos
    
    const textarea = document.getElementById(poteId);
    if (!textarea) return;

    const nomeAlvo = nomeSorteado.trim();
    const linhas = textarea.value.split('\n');
    let encontrouERiscou = false;

    const novasLinhas = linhas.map(linha => {
        const linhaLimpa = linha.trim();

        // Se a linha estiver vazia, mantém
        if (!linhaLimpa) return linha;

        // Se já riscou um nesta rodada ou se a linha já está riscada, mantém
        if (encontrouERiscou || linha.includes('-----')) return linha;

        // Compara ignorando espaços extras
        if (linhaLimpa === nomeAlvo) {
            encontrouERiscou = true;
            return `  ×${nomeAlvo}×`;
        }

        return linha;
    });

    textarea.value = novasLinhas.join('\n');
    textarea.dispatchEvent(new Event('input'));
}