// main.js
// Inicializador: garante que a inicialização protegida ocorra após DOM carregado.

(function (window, document) {
    'use strict';

    function onReady(fn) {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(fn, 0);
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    onReady(function() {
        if (window.Sorteio && typeof window.Sorteio.init === 'function') {
            try {
                window.Sorteio.init();
            } catch (err) {
                console.error('Erro ao inicializar Sorteio:', err);
                alert('Ocorreu um erro ao inicializar a aplicação. Veja o console para detalhes.');
            }
        } else {
            console.error('Sorteio.init não encontrado.');
        }

        // Detecta parâmetro de compartilhamento na URL e renderiza o resultado em modo somente leitura
        (function handleSharedLink() {
            try {

                const params = new URLSearchParams(window.location.search);
                if (!params.has('d')) {
                    console.log('Nenhum parâmetro de compartilhamento encontrado.');
                    return;
                }

                const encoded = params.get('d');
                if (!encoded) return;

                console.log('Parâmetro recebido:', encoded.slice(0, 30) + '...');

                // Decodifica
                let jsonString = "";
                try {
                    const decompressed = LZString.decompressFromBase64(decodeURIComponent(encoded));
                    jsonString = decompressed;
                } catch (err) {
                    console.error('Erro ao descomprimir LZString:', err);
                    return;
                }

                let sharedData = null;
                try {
                    sharedData = JSON.parse(jsonString);
                } catch (err) {
                    console.error('Erro ao parsear JSON descomprimido:', err);
                    return;
                }

                console.log("Dados de compartilhamento decodificados:", sharedData);

                // Seleciona a aba "Equilibrado", caso exista
                const eqTab = document.querySelector('.tab-button[data-tab="equilibrado"]');
                if (eqTab) eqTab.click();

                // Aguarda o renderShared ficar disponível (draw.js carregado)
                const wait = setInterval(() => {
                    if (window.Sorteio && typeof window.Sorteio.renderShared === 'function') {
                        clearInterval(wait);
                        console.log("Chamando renderShared...");
                        window.Sorteio.renderShared(sharedData);
                    }
                }, 150);

                setTimeout(() => clearInterval(wait), 5000);

            } catch (err) {
                console.error('Erro geral ao processar link compartilhado:', err);
            }
        })();
    });

// CONTROLE DAS ABAS
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-tab');

            // Atualiza aba ativa
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Mostra o conteúdo correto
            tabContents.forEach(content => {
                if (content.id === 'tab-' + target) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });
});

}(window, document));