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