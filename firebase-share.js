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

    try {
        // 2. Prepara os dados exatos que queremos salvar
        const dataToSave = {
            config: State.config,
            shuffledShields: State.shuffledShields || State.shieldPaths,
            teams: State.teams, // Contém cores, jogadores, e a tática do campo
            viewMode: State.viewMode,
            layoutMode: State.layoutMode,
            potesTexto: {
                pote1: document.getElementById('pote1').value,
                pote2: document.getElementById('pote2').value,
                pote3: document.getElementById('pote3').value,
                pote4: document.getElementById('pote4').value
            },
            dataSorteio: new Date().toISOString()
        };

        // 3. Salva no Firestore na coleção "shared_draws"
        const docRef = await addDoc(collection(db, "shared_draws"), dataToSave);

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
            State.config = data.config;
            State.teams = data.teams;
            
            // Renderiza os times primeiro
            renderTeams(State.teams);
            
            // Bloqueia a interface passando os dados
            bloquearInterfaceParaVisualizacao(data);
        }
    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
}

// Função que transforma a página em "Apenas Leitura"
function bloquearInterfaceParaVisualizacao(data) {
    // 1. Restaurar os nomes nos potes (todos os que foram salvos)
    if (data.potesTexto) {
        Object.keys(data.potesTexto).forEach(key => {
            const textarea = document.getElementById(key);
            if (textarea) {
                // Remove o caractere de riscado '×' para o convidado
                const conteudo = Array.isArray(data.potesTexto[key]) 
                    ? data.potesTexto[key].join('\n') 
                    : data.potesTexto[key];
                
                textarea.value = conteudo.replace(/×/g, '').trim();
                textarea.readOnly = true;
                
                // Dispara o evento de input para atualizar os contadores de jogadores
                textarea.dispatchEvent(new Event('input'));
            }
        });
    }

    // 2. Esconder elementos de edição
    const drawDiv = document.querySelector('.drawdiv');
    if (drawDiv) drawDiv.style.display = 'none';

    document.querySelectorAll('.btn-clear').forEach(btn => btn.style.display = 'none');
    
    const btnShare = document.getElementById('btnShare');
    if (btnShare) btnShare.style.display = 'none';
    
    const configCard = document.querySelector('.top-section.bottom');
    if (configCard) configCard.style.display = 'none';

    // 3. Ajustar botão de Reiniciar
    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
        btnReset.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg> Criar meu Sorteio`;
        btnReset.onclick = () => {
            window.location.href = window.location.origin + window.location.pathname;
        };
    }
}