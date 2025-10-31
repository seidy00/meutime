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

}(window, document));