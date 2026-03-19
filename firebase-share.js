// firebase-share.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { State } from "./state.js";
import { renderTeams } from "./render.js";

// COLOQUE AQUI AS SUAS CREDENCIAIS DO FIREBASE
// Você pega isso no Console do Firebase > Configurações do Projeto > Web App
const firebaseConfig = {
    apiKey: "AIzaSyAvKtLxIE5NPjp5eQusXvxS5lLXxNI5AZM",
    authDomain: "meutime01.firebaseapp.com",
    projectId: "meutime01",
    storageBucket: "meutime01.firebasestorage.app",
    messagingSenderId: "621941436768",
    appId: "1:621941436768:web:00e2165566d61e7f012e05"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.fbDb = db;
window.fbCollection = collection;
window.fbAddDoc = addDoc;
window.fbDoc = doc;
window.fbGetDoc = getDoc;

// Função para Salvar o Sorteio e Gerar o Link
export async function shareCurrentDraw() {
    // 1. Verifica se há times sorteados
    if (!State.teams || State.teams.length === 0) {
        alert("Faça um sorteio primeiro antes de compartilhar!");
        return;
    }

    const btnShare = document.getElementById('btnShare');
    const textoOriginal = btnShare.innerText;
    btnShare.innerText = "Gerando link";
    btnShare.disabled = true;

    // 2. Prepara os dados exatos que queremos salvar
    try {
        // CAPTURA E LIMPA OS NOMES ANTES DE SALVAR
        const potesTextoLimpo = {};
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById(`pote${i}`);
            if (el) {
                potesTextoLimpo[`pote${i}`] = el.value.split('\n')
                    .map(linha => linha.replace(/×/g, '').trim()) // Remove o '×'
                    .filter(linha => linha !== ""); // Ignora linhas em branco
            }
        }

        const dataToSave = {
            config: State.config,
            shuffledShields: State.shuffledShields || State.shieldPaths,
            teams: State.teams, 
            viewMode: State.viewMode || 'initial',
            layoutMode: State.layoutMode || 'pitch',
            potesTexto: potesTextoLimpo, // Usa a variável limpa
            dataSorteio: new Date().toISOString()
        };

        // 3. Salva no Firestore na coleção "shared_draws"
        const docRef = await window.fbAddDoc(window.fbCollection(window.fbDb, "shared_draws"), dataToSave);

        // 4. Gera o link curto com o ID do documento
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?draw=${docRef.id}`;

        // 5. Copia para a área de transferência
        await navigator.clipboard.writeText(`${shareUrl}`);
        alert("Link copiado para a área de transferência!\n" + shareUrl);

    } catch (error) {
        console.error("Erro ao compartilhar: ", error);
        alert("Erro ao gerar link de compartilhamento.");
    } finally {
        btnShare.innerText = textoOriginal;
        btnShare.disabled = false;
    }
}

// Função para Carregar um Sorteio via Link
export async function loadSharedDraw(drawId) {
    try {
        const docRef = window.fbDoc(window.fbDb, "shared_draws", drawId);
        const docSnap = await window.fbGetDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 1. Restaura o estado global
            State.config = data.config;
            State.teams = data.teams;
            State.shuffledShields = data.shuffledShields || State.shieldPaths;
            State.viewMode = data.viewMode || 'initial';
            State.layoutMode = data.layoutMode || 'pitch';

            // 2. Garante que a quantidade certa de potes fique visível
            // Usa a função visual do seu utils.js (se ela for global) ou faz manualmente:
            for(let i = 1; i <= 4; i++) {
                const el = document.getElementById(`pote${i}`);
                if (el && el.parentElement) {
                    // Mostra apenas os potes que foram usados no sorteio
                    el.parentElement.style.display = (i <= State.config.numPotes) ? 'block' : 'none';
                }
            }

            // 3. Renderiza os times primeiro
            renderTeams(State.teams);
            
            // 4. Preenche os potes e esconde os botões
            bloquearInterfaceParaVisualizacao(data);

        } else {
            // ESSE É O NOVO BLOCO 404:
            
            // 1. Esconde tudo que não deve aparecer
            const configSection = document.querySelector('.top-section.bottom');
            if (configSection) configSection.style.display = 'none';

            const potesSection = document.querySelector('.potes-container');
            if (potesSection) potesSection.style.display = 'none';
            
            const btnContainer = document.querySelector('.Btn-container');
            if (btnContainer) btnContainer.style.display = 'none';
            
            const potesDots = document.getElementById('potesDots');
            if (potesDots) potesDots.style.display = 'none';

            // 2. Cria a interface amigável de erro na área de resultados
            const resultsDiv = document.getElementById('resultsDiv');
            if (resultsDiv) {
                resultsDiv.innerHTML = `
                    <div style="min-height: 80vh; text-align: center; padding: 60px 20px; margin-top: 20px;">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7a84ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <h2 style="font-size: 18px; color: #ECEDEF; margin: 24px 0 4px 0;">Sorteio não encontrado</h2>
                        <p style="font-size: 14px; text-align: center; color: #808080; margin: 0 0 32px 0;">A página do sorteio que você procura pode estar incorreto ou ter expirado.</p>
                        <button class="btn-return" onclick="window.location.href = window.location.origin + window.location.pathname">
                                NOVO SORTEIO
                        </button>
                    </div>
                `;
                resultsDiv.style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Erro ao carregar sorteio:", error);
    }
}

// Função que transforma a página em "Apenas Leitura"
function bloquearInterfaceParaVisualizacao(data) {
    if (!data || !data.potesTexto) return;

    // 1. Preencher os potes
    for (let i = 1; i <= 4; i++) {
        const textarea = document.getElementById(`pote${i}`);
        const conteudo = data.potesTexto[`pote${i}`];
        
        if (textarea && conteudo) {
            // Como agora já salvamos limpo, não precisamos do .replace(/×/g, '') aqui
            const textoLimpo = Array.isArray(conteudo) 
                ? conteudo.join('\n') 
                : conteudo;
                
            textarea.value = textoLimpo.trim();
            textarea.readOnly = true;
            
            // Força a atualização dos contadores de "0 jogadores"
            textarea.dispatchEvent(new Event('input'));
        }
    }

    // 2. Esconder a seção de configurações completamente
    const configSection = document.querySelector('.top-section.bottom');
    if (configSection) {
        configSection.style.display = 'none';
    }

    // 3. Esconder os controles de sorteio
    const drawDiv = document.querySelector('.drawdiv');
    if (drawDiv) drawDiv.style.display = 'none';

    document.querySelectorAll('.btn-clear').forEach(btn => btn.style.display = 'none');
    
    const btnShare = document.getElementById('btnShare');
    if (btnShare) btnShare.style.display = 'none';

    // 4. Ajustar botão de Reiniciar para virar "Criar meu Sorteio"
    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
        btnReset.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg> Criar meu Sorteio`;
        btnReset.onclick = () => {
            // Remove o ID da URL e recarrega a página
            window.location.href = window.location.origin + window.location.pathname;
        };
    }
}