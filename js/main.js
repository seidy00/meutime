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
        try {
            const params = new URLSearchParams(window.location.search);
            if (!params.has('share')) return; // se não há parâmetro "share", sai

            const encoded = params.get('share');
            if (!encoded) return;

            // Decodifica URL + Base64 + UTF-8
            let decodedJson;
            try {
                const b64 = decodeURIComponent(encoded);
                const json = decodeURIComponent(escape(atob(b64)));
                decodedJson = json;
            } catch (err) {
                console.warn('Decodificação primária falhou, tentando alternativa:', err);
                try {
                    decodedJson = atob(encoded);
                } catch (e2) {
                    console.error('Falha ao decodificar link de compartilhamento:', e2);
                    return;
                }
            }

            let sharedData = null;
            try {
                sharedData = JSON.parse(decodedJson);
            } catch (err) {
                console.error('Erro ao parsear JSON do compartilhamento:', err);
                return;
            }

            console.log('🔗 Modo compartilhamento detectado — dados decodificados:', sharedData);

            // Garante que a aba "Equilibrado" esteja ativa
            const equilibradoTabBtn = document.querySelector('.tab-button[data-tab="equilibrado"]');
            if (equilibradoTabBtn) equilibradoTabBtn.click();

            // Aguarda a função renderShared estar pronta
            const waitForRender = setInterval(() => {
                if (window.Sorteio && typeof window.Sorteio.renderShared === 'function') {
                    clearInterval(waitForRender);
                    console.log('🔄 renderShared disponível, renderizando sorteio compartilhado...');
                    window.Sorteio.renderShared(sharedData);
                }
            }, 200);

            // Segurança: para o loop após 5s
            setTimeout(() => clearInterval(waitForRender), 5000);
        } catch (err) {
            console.error('Erro ao processar parâmetro de compartilhamento:', err);
        }
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