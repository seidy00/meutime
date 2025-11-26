/* draw.js
   Contém toda a lógica original do sorteio e do comportamento do mapa.
   Encapsulado em window.Sorteio.init() para inicializar após DOM estar pronto.
*/

(function (window, document) {
    'use strict';

    // Expondo namespace protegido
    window.Sorteio = window.Sorteio || {};

    window.Sorteio.init = function() {
        // ====================================================
        // VARIÁVEIS DE CONFIGURAÇÃO E CONSTANTES
        // ====================================================
        var teamColors = ['Azul', 'Vermelho', 'Preto', 'Amarelo'];
        var colorMap = {
            'Azul': '#2A3EFE',
            'Vermelho': '#E73B3B',
            'Preto': '#000000',
            'Amarelo': '#FFD02B'
        };
        var SHIELD_SVGS = [
            '<path d="M60,0S35.33,12.13,0,14.25v67.44c0,26.6,24.25,57.24,60,68.3,35.75-11.06,60-41.7,60-68.3V14.25C84.67,12.13,60,0,60,0Z"/>', 
            '<path d="M55,0S17.55,0,0,9.19v97.9c0,35.41,49.16,26.85,55,42.91,5.84-16.06,55-7.5,55-42.91V9.19C92.45,0,55,0,55,0Z"/>', 
            '<circle cx="75" cy="75" r="75"/>', 
            '<path d="M104.39,0l-39.39,10.85L25.61,0,0,34.14s13.73,16.4,13.73,49.42c0,46.36,51.27,66.44,51.27,66.44,0,0,51.27-20.08,51.27-66.44,0-33.02,13.73-49.42,13.73-49.42L104.39,0Z"/>', 
            '<polygon points="60 0 0 75 60 150 120 75 60 0"/>', 
            '<path d="M60,0L0,41.98s6.11,30.88,10.32,51.09c7.78,37.31,39.18,46.43,49.68,56.93,10.5-10.5,41.89-19.62,49.68-56.93,4.22-20.21,10.32-51.09,10.32-51.09L60,0Z"/>' 
        ];
        
        // Dados de Endereços Salvos
        var savedAddresses = [
            { 
                name: "Arena Society", 
                address: "R. Alfredo José Athaíde - Alto do Céu, João Pessoa", 
                mapLink: "https://maps.app.goo.gl/Y6DMcgMWDAs9gLNNA",
                imageURL: "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSxrg4JqSDwGTt988L3g-JIo8ayxPOk499ukrFg696LC7t-YpjyeQqOsX-GodQt_yzOfzLV7k6emqSNE6vpSYs0xMc6iiT85sLlrNcDmRD7I934em09c01XxJYbu4AJihmibJQvG3YYQil0B=w408-h306-k-no"
            },
            { 
                name: "Open Arena", 
                address: "Rua Dr. San Juan, 193 - Estados, João Pessoa", 
                mapLink: "https://maps.app.goo.gl/rpDr7ujrTD9dr5RB8",
                imageURL: "https://streetviewpixels-pa.googleapis.com/v1/thumbnail?cb_client=maps_sv.tactile&w=900&h=600&pitch=2.944694354568554&panoid=bbfJ69cJrzICtqjpqNiLIA&yaw=208.1746396666018"
            },
        ];
        
        // ====================================================
        // REFERÊNCIAS AO DOM
        // ====================================================
        var playersTextarea = document.getElementById('players-textarea');
        var drawBtn = document.getElementById('draw-btn');
        var clearBtn = document.getElementById('clear-btn');
        var resultsDiv = document.getElementById('results');
        var playerCountStats = document.getElementById('player-count-stats');
        var avgAgeStats = document.getElementById('avg-age-stats');
        
        // Elementos do Mapa/Data
        var dateInput = document.getElementById('date-input'); 
        var timeInput = document.getElementById('time-input'); 
        var addressInput = document.getElementById('address-input');
        var openMapBtn = document.getElementById('open-map-btn');
        var customDropdown = document.getElementById('custom-address-dropdown'); 
        var mapImageContainer = document.getElementById('map-image-container'); 
        var mapImage = document.getElementById('map-image'); 
        var dayOfWeekDisplay = document.getElementById('day-of-week-display'); 

        const initialPlaceholder = playersTextarea.placeholder;
        
        // ====================================================
        // FUNÇÕES DE UTILIDADE
        // ====================================================
        /** Embaralha um array (Algoritmo Fisher-Yates). */
        function shuffleArray(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = array[i];
                array[i] = array[j];
                array[j] = tmp;
            }
            return array;
        }

        function updateTextareaValue(value) {
            playersTextarea.value = value;
            if (value === initialPlaceholder) {
                playersTextarea.classList.add('initial-placeholder');
            } else {
                playersTextarea.classList.remove('initial-placeholder');
            }
            updateStats();
        }

        function parsePlayers() {
            const valueToParse = playersTextarea.value === initialPlaceholder ? '' : playersTextarea.value;
            const lines = valueToParse.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const players = [];
            for (const line of lines) {
                const parts = line.split(',').map(part => part.trim());
                const name = parts[0];
                const age = parseInt(parts[1]);
                const isGoalie = parts.length > 2 && parts[2].toUpperCase() === 'G';
                if (name && !isNaN(age) && age > 0) {
                    players.push({ name, age, isGoalie });
                }
            }
            return players;
        }

        /** Calcula e exibe as estatísticas dos jogadores. */
        function updateStats() {
            var players = parsePlayers();
            var totalPlayers = players.length;
            var totalGoalies = players.filter(function(p){ return p.isGoalie; }).length;
            
            var avgAge = 'N/A';
            if (totalPlayers > 0) {
                var totalAge = players.reduce(function(sum, p){ return sum + p.age; }, 0);
                avgAge = (totalAge / totalPlayers).toFixed(1);
            }

            playerCountStats.innerHTML = '<strong>' + totalPlayers + '</strong> Jogadores • <strong>' + totalGoalies + '</strong> Goleiros';
            avgAgeStats.innerHTML = 'Idade Média: <strong>' + avgAge + '</strong>';
        }

        // ====================================================
        // FUNÇÕES DE DATA/HORA
        // ====================================================
        /** Calcula e exibe o dia da semana a partir da string DD/MM. */
        function updateDayOfWeek(dateString) {
            var parts = dateString.split('/');
            if (parts.length === 2 && parts[0].length === 2 && parts[1].length === 2) {
                var day = parseInt(parts[0], 10);
                var month = parseInt(parts[1], 10);
                var currentYear = new Date().getFullYear(); 
                var date = new Date(currentYear, month - 1, day);

                if (date.getDate() === day && date.getMonth() === month - 1) {
                    var formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
                    var dayName = formatter.format(date);
                    dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1) + ',';
                    dayOfWeekDisplay.textContent = dayName;
                    dayOfWeekDisplay.style.display = 'inline'; 
                    dateInput.style.color = '#ECEDEF'; 
                } else {
                    dayOfWeekDisplay.textContent = 'Data Inválida,';
                    dayOfWeekDisplay.style.display = 'inline';
                    dateInput.style.color = '#E73B3B';
                }
            } else if (dateString.length > 0) {
                dayOfWeekDisplay.textContent = 'Dia,';
                dayOfWeekDisplay.style.display = 'inline';
                dateInput.style.color = '#ECEDEF'; 
            } else {
                dayOfWeekDisplay.textContent = '';
                dayOfWeekDisplay.style.display = 'none';
                dateInput.style.color = '#ECEDEF'; 
            }
        }
        
        /** Formata o input (DD/MM ou HH:MM) e salva no localStorage. */
        function formatInput(inputElement, formatSeparator) {
            var rawValue = inputElement.value.replace(/\D/g, '').substring(0, 4); 
            var formattedValue = '';
            
            var part1 = rawValue.substring(0, 2);
            var part2 = rawValue.substring(2, 4);

            if (part1.length === 2) {
                var num1 = parseInt(part1, 10);
                
                if (formatSeparator === '/') { // Data (DD)
                    if (num1 > 31) part1 = '31';
                    if (part1 === '00') part1 = '01'; 
                } else if (formatSeparator === ':') { // Hora (HH)
                    if (num1 > 23) part1 = '23';
                }
            }
            
            formattedValue += part1;

            if (part2.length > 0) {
                formattedValue += formatSeparator;
                var num2 = parseInt(part2, 10);
                
                if (formatSeparator === '/') { // Data (MM - Mês)
                    if (num2 > 12) part2 = '12';
                    if (part2 === '00') part2 = '01'; 
                } else if (formatSeparator === ':') { // Hora (MM - Minuto)
                    if (num2 > 59) part2 = '59';
                }
                
                formattedValue += part2;
            }
            
            inputElement.value = formattedValue;
            try {
                localStorage.setItem(inputElement.id === 'date-input' ? 'matchDate' : 'matchTime', formattedValue);
            } catch (e) {
                // localStorage pode falhar em modos especiais do navegador; ignorar silenciosamente
            }
            
            if (inputElement.id === 'date-input') {
                updateDayOfWeek(formattedValue);
            }
        }

        // ====================================================
        // FUNÇÕES DE MAPA/ENDEREÇO
        // ====================================================

        /** Obtém as cores do avatar com base na cor do time (para garantir contraste). */
        function getAvatarColors(teamColorHex) {
            var avatarBgColor = teamColorHex;
            var avatarTextColor = '#ECEDEF'; 

            if (teamColorHex === '#000000') { // Preto
                avatarBgColor = '#ECEDEF'; 
                avatarTextColor = '#0B0E0F'; 
            } else if (teamColorHex === '#FFD02B') { // Amarelo
                avatarTextColor = '#000000'; 
            }
            return { avatarBgColor: avatarBgColor, avatarTextColor: avatarTextColor };
        }
        
        /** Atualiza o texto do botão do mapa e o estado da imagem de visualização. */
        function updateMapButtonState() {
            var mapLink = addressInput.dataset.selectedLink;
            var imageURL = addressInput.dataset.selectedImage; 
            var selectedName = addressInput.dataset.selectedName || 'Local';
            
            openMapBtn.disabled = !mapLink;
            
            if (!mapLink) {
                openMapBtn.textContent = 'Abrir no Google Maps';
                mapImageContainer.style.display = 'none';
                mapImage.style.opacity = '0';
            } else {
                openMapBtn.textContent = 'Abrir "' + selectedName + '" no Maps';
                
                if (imageURL) {
                    mapImageContainer.style.display = 'block';
                    mapImage.style.opacity = '0'; 
                    var placeholder = mapImageContainer.querySelector('.image-placeholder');
                    if (placeholder) {
                        placeholder.style.display = 'flex';
                        placeholder.textContent = 'Carregando imagem do local...';
                    }
                    
                    mapImage.src = imageURL;
                    mapImage.onload = function() {
                        mapImage.style.opacity = '1';
                        if (placeholder) placeholder.style.display = 'none';
                    };
                    mapImage.onerror = function() {
                        mapImage.src = '';
                        mapImage.style.opacity = '0';
                        if (placeholder) {
                            placeholder.textContent = 'Erro ao carregar a imagem do local. Verifique o link.';
                            placeholder.style.display = 'flex';
                        }
                    };
                } else {
                    mapImageContainer.style.display = 'block'; 
                    mapImage.src = '';
                    mapImage.style.opacity = '0';
                    var ph = mapImageContainer.querySelector('.image-placeholder');
                    if (ph) {
                        ph.textContent = 'Imagem do local não fornecida.';
                        ph.style.display = 'flex';
                    }
                }
            }
        }
        
        /** Renderiza o dropdown customizado de endereços. */
        function filterAndRenderDropdown() {
            var addressesToDisplay = savedAddresses; 
            
            customDropdown.innerHTML = '';
            
            if (addressesToDisplay.length > 0 && document.activeElement === addressInput) {
                
                addressesToDisplay.forEach(function(item) {
                    var dropdownItem = document.createElement('div');
                    dropdownItem.className = 'dropdown-item';
                    dropdownItem.tabIndex = 0; 
                    
                    dropdownItem.innerHTML = '\n                        <span style="color: #ECEDEF; font-weight: bold; display: block;">' + item.name + '</span>\n                        <span style="color: #858787; font-size: 0.9em; display: block;">' + item.address + '</span>\n                    ';
                    
                    dropdownItem.addEventListener('click', function() {
                        addressInput.value = item.name; 
                        addressInput.dataset.selectedAddress = item.address; 
                        addressInput.dataset.selectedName = item.name;
                        addressInput.dataset.selectedLink = item.mapLink; 
                        addressInput.dataset.selectedImage = item.imageURL;
                        customDropdown.style.display = 'none';
                        updateMapButtonState(); 
                        addressInput.blur(); 
                    });
                    
                    customDropdown.appendChild(dropdownItem);
                });
                
                customDropdown.style.display = 'block';
            } else {
                customDropdown.style.display = 'none';
            }
        }

        // ====================================================
        // FUNÇÕES DE RENDERIZAÇÃO DO RESULTADO
        // ====================================================
        
        /** Cria o HTML para o marcador de jogador em campo. */
        function createPlayerMarkerHTML(player, teamColorHex, positionClass) {
            var colors = getAvatarColors(teamColorHex);
            var avatarBgColor = colors.avatarBgColor;
            var avatarTextColor = colors.avatarTextColor;
            var initial = player.name.charAt(0).toUpperCase();
            
            return '\n                <div class="player-marker ' + positionClass + '">\n                    <div class="player-avatar" style="background-color: ' + avatarBgColor + '; color: ' + avatarTextColor + ';">\n                        <span class="initial-letter">' + initial + '</span>\n                    </div>\n                    <span class="player-name">' + player.name + '</span>\n                    <span class="player-age">' + player.age + ' anos</span> \n                </div>\n            ';
        }

        /** Cria o HTML para o jogador substituto na lista. */
        function createSubstituteHTML(player, teamColorHex) {
            var colors = getAvatarColors(teamColorHex);
            var avatarBgColor = colors.avatarBgColor;
            var avatarTextColor = colors.avatarTextColor;
            var initial = player.name.charAt(0).toUpperCase();
            var goalieText = player.isGoalie ? ' (G)' : '';

            return '\n                <li class="substitute-player">\n                    <div class="player-avatar" style="background-color: ' + avatarBgColor + '; color: ' + avatarTextColor + ';">\n                        <span class="initial-letter">' + initial + '</span>\n                    </div>\n                    <span class="player-name">' + player.name + '</span>\n                    <span class="player-age">' + player.age + ' anos ' + goalieText + '</span>\n                </li>\n            ';
        }

        /** Cria o HTML completo do card de um time. */
        function createTeamCardHTML(team, teamColorName, teamColorHex, onFieldPlayersForDisplay, substitutes, shieldSVGPath) {
            var totalAge = team.reduce(function(sum, p){ return sum + p.age; }, 0);
            var avgAge = (team.length > 0) ? (totalAge / team.length).toFixed(1) : 'N/A';

            // Mapeamento de posições de campo para 1, 2, 3, 4 ou 5 jogadores de linha
            var nonGKPositions = {
                1: [['f0-m1']], 
                2: [['f2L-d1', 'f2L-d2']], 
                3: [['f3L-d1', 'f3L-m1', 'f3L-m2']], 
                4: [['f1-d1', 'f1-d2', 'f1-m1', 'f1-a1'], ['f2-d1', 'f2-m1', 'f2-m2', 'f2-a1'], ['f3-d1', 'f3-m1', 'f3-m2', 'f3-a1']], 
                5: [['pos-5-d1', 'pos-5-d2', 'pos-5-m1', 'pos-5-a1', 'pos-5-a2']],
            };

            var fieldPlayerSlots = onFieldPlayersForDisplay.length - onFieldPlayersForDisplay.filter(function(p){ return p.isGoalie; }).length;
            var positionsToUse = [];
            
            if (nonGKPositions[fieldPlayerSlots]) {
                 var formationOptions = nonGKPositions[fieldPlayerSlots];
                 positionsToUse = shuffleArray(formationOptions)[0]; 
            } else {
                // Fallback para posicionamento centralizado se a contagem não for 1-5.
                positionsToUse = Array(fieldPlayerSlots).fill(0).map(function(_, i){ return 'pos-a-c-' + i; }); 
            }

            var availablePositions = shuffleArray(positionsToUse);
            var fieldPlayerPositionIndex = 0;

            var pitchHTML = '\n                <div class="football-pitch">\n                    <div class="line-top"></div>\n                    <div class="penalty-box"></div>\n                    <div class="six-yard-box"></div>\n                    <div class="penalty-spot"></div>\n                    <div class="center-circle"></div>\n                    <div class="penalty-arc"></div> \n            ';
            
            onFieldPlayersForDisplay.forEach(function(player) {
                var positionClass;

                if (player.isGoalie) {
                    positionClass = 'pos-gk';
                } else {
                    if (fieldPlayerPositionIndex < availablePositions.length) {
                        positionClass = availablePositions[fieldPlayerPositionIndex];
                        fieldPlayerPositionIndex++;
                    } else {
                        positionClass = 'pos-a-c';
                    }
                }

                // SALVA A POSIÇÃO NO OBJETO DO JOGADOR
                player.finalPosition = positionClass;

                pitchHTML += createPlayerMarkerHTML(player, teamColorHex, positionClass);
            });
            
            pitchHTML += '</div>';

            var substitutesHTML = substitutes.map(function(p){ return createSubstituteHTML(p, teamColorHex); }).join('');

            return '\n\t\t<div class="team-header">\n\t\t\t<div class="name-and-color">\n\t\t\t\t<svg class="team-shield" viewBox="0 0 150 150" style="fill: ' + teamColorHex + '; stroke: #ECEDEF; stroke-width: 0;">\n\t\t\t\t\t' + shieldSVGPath + '\n\t\t\t\t</svg>\n\t\t\t\t' + teamColorName + '\n\t\t\t</div>\n\t\t\t<div class="info-text">\n   <strong>' + team.length + ' Jogadores</strong><br>\n   Idade média: ' + avgAge + ' anos\n   </div>\n   </div>\n   <div class="pitch-container">\n   ' + pitchHTML + '\n   </div>\n   <div class="substitutes-section">\n   <h4>Substituições <span class="count">(' + substitutes.length + ' jogador' + (substitutes.length !== 1 ? 'es' : '') + ')</span></h4>\n   <ul class="substitutes-list">\n   ' + substitutesHTML + '\n   </ul>\n   </div>\n   ';
        }

        // ====================================================
        // FUNÇÃO PRINCIPAL DE SORTEIO
        // ====================================================

        function drawTeams() {
            var players = parsePlayers();
            
            if (players.length < 8) {
                alert('É necessário ter pelo menos 8 jogadores para o sorteio.');
                return;
            }

            resultsDiv.innerHTML = '';
            
            var numPlayers = players.length;
            var numTeams = 0;

            if (numPlayers >= 8 && numPlayers <= 12) {
                numTeams = 2;
            } else if (numPlayers >= 13 && numPlayers <= 19) {
                numTeams = 3;
            } else if (numPlayers >= 20) {
                numTeams = 4;
            } else {
                 alert('A quantidade de jogadores não é suportada pela lógica atual.');
                 return;
            }

            var teams = Array.from({ length: numTeams }, function(){ return []; });
            var availablePlayers = shuffleArray(players.slice());

            var goalies = availablePlayers.filter(function(p){ return p.isGoalie; });
            var fieldPlayers = availablePlayers.filter(function(p){ return !p.isGoalie; });

            var oldPlayers = fieldPlayers.filter(function(p){ return p.age > 20; });
            var teens = fieldPlayers.filter(function(p){ return p.age >= 15 && p.age <= 19; });
            var kids = fieldPlayers.filter(function(p){ return p.age <= 14; });

            var exportedTeamsTemp = [];

            // 1. Sorteio de Goleiros
            shuffleArray(goalies);
            for (var gi = 0; gi < goalies.length && gi < numTeams; gi++) {
                teams[gi].push(goalies[gi]);
            }
            
            // 2. Equilíbrio de Experiência
            var teamsWithGoalieOver20 = teams.map(function(team){ return team.some(function(p){ return p.isGoalie && p.age > 20; }); });
            var remainingOldPlayers = [];
            var teamIndex = 0;

            var shuffledOld = shuffleArray(oldPlayers.slice());
            for (var oi = 0; oi < shuffledOld.length; oi++) {
                var player = shuffledOld[oi];
                var startIndex = teamIndex;
                var placed = false;
                while (!placed) {
                    if (!teamsWithGoalieOver20[teamIndex]) {
                        teams[teamIndex].push(player);
                        placed = true;
                    } else {
                        teamIndex = (teamIndex + 1) % numTeams;
                        if (teamIndex === startIndex) { 
                            remainingOldPlayers.push(player);
                            placed = true;
                        }
                    }
                }
                if (placed) {
                     teamIndex = (teamIndex + 1) % numTeams;
                }
            }

            // 3. Distribuição em Zig-Zag (Teens e Kids)
            var currentTeamIndex = 0;
            var direction = 1;
            var shuffledTeens = shuffleArray(teens.slice());
            for (var ti = 0; ti < shuffledTeens.length; ti++) {
                teams[currentTeamIndex].push(shuffledTeens[ti]);
                currentTeamIndex += direction;
                if (currentTeamIndex >= numTeams || currentTeamIndex < 0) {
                    direction *= -1;
                    currentTeamIndex += direction * 2;
                }
            }
            
            currentTeamIndex = 0;
            direction = 1;
            var shuffledKids = shuffleArray(kids.slice());
            for (var ki = 0; ki < shuffledKids.length; ki++) {
                teams[currentTeamIndex].push(shuffledKids[ki]);
                currentTeamIndex += direction;
                if (currentTeamIndex >= numTeams || currentTeamIndex < 0) {
                    direction *= -1;
                    currentTeamIndex += direction * 2;
                }
            }
            
            // 4. Distribuição dos jogadores velhos restantes (pelo time com menor idade média)
            var teamAges = teams.map(function(team){ return team.reduce(function(sum, p){ return sum + p.age; }, 0); });
            var sortedTeamIndices = teamAges.map(function(age, index){ return { age: age, index: index }; })
                                              .sort(function(a, b){ return a.age - b.age; })
                                              .map(function(item){ return item.index; });
            
            var oldPlayerIndex = 0;
            while (oldPlayerIndex < remainingOldPlayers.length) {
                for (var sti = 0; sti < sortedTeamIndices.length; sti++) {
                    var teamIdx = sortedTeamIndices[sti];
                    if (oldPlayerIndex < remainingOldPlayers.length) {
                        teams[teamIdx].push(remainingOldPlayers[oldPlayerIndex]);
                        oldPlayerIndex++;
                    }
                }
            }

            // 5. Distribuição dos jogadores não atribuídos (garante que todos foram alocados)
            var allPlayers = players;
            var assignedPlayers = teams.flat();
            var unassignedPlayers = allPlayers.filter(function(p){ return assignedPlayers.indexOf(p) === -1; });
            
            while(unassignedPlayers.length > 0) {
                var teamSizes = teams.map(function(t){ return t.length; });
                var minSize = Math.min.apply(null, teamSizes);
                var minSizeTeams = teams.filter(function(t){ return t.length === minSize; });
                var targetTeam = shuffleArray(minSizeTeams)[0];
                var playerToAdd = unassignedPlayers.shift();
                
                targetTeam.push(playerToAdd);
            }

            // 6. BALANCEAMENTO ITERATIVO (Tamanho do time)
            var iterativeBalance = function() {
                var attempts = 0; 
                var MAX_ATTEMPTS = 100; 
                var isThirteenPlayers = (numPlayers === 13 && numTeams === 3);

                while (attempts < MAX_ATTEMPTS) {
                    attempts++;
                    
                    var currentTeamSizes = teams.map(function(t){ return t.length; });
                    var maxTeamSize = Math.max.apply(null, currentTeamSizes);
                    var minTeamSize = Math.min.apply(null, currentTeamSizes);
                    var diff = maxTeamSize - minTeamSize;

                    if (isThirteenPlayers) {
                        if (diff === 2) { // 5, 5, 3
                            // Verifica se há times 5, 5, 3 e para.
                            var sizes = currentTeamSizes.slice().sort(function(a,b){ return a-b; });
                            if (sizes[0] === 3 && sizes[1] === 5 && sizes[2] === 5) break;
                        }
                        if (diff === 1 && attempts > 5) break; // Evita loop em 5, 4, 4
                    } else {
                        if (diff <= 1) break; // Lógica Padrão: 0 ou 1
                    }
                    
                    var maxIndex = currentTeamSizes.findIndex(function(size){ return size === maxTeamSize; });
                    var minIndex = currentTeamSizes.findIndex(function(size){ return size === minTeamSize; });
                    
                    if (maxIndex === -1 || minIndex === -1 || maxIndex === minIndex) break;

                    var largerTeam = teams[maxIndex];
                    var smallerTeam = teams[minIndex];

                    var playerToMove = null;

                    // Prioridade 1: Jogador mais jovem (<= 14) NÃO-GOLEIRO
                    playerToMove = largerTeam
                        .filter(function(p){ return !p.isGoalie && p.age <= 14; })
                        .sort(function(a, b){ return a.age - b.age; })[0]; 

                    // Prioridade 2: Jogador de linha mais jovem (qualquer idade)
                    if (!playerToMove) {
                        playerToMove = largerTeam
                            .filter(function(p){ return !p.isGoalie; })
                            .sort(function(a, b){ return a.age - b.age; })[0]; 
                    }
                    
                    // Prioridade 3: Jogador mais jovem (incluindo Goleiros, se for a única opção)
                    if (!playerToMove) {
                        playerToMove = largerTeam
                            .sort(function(a, b){ return a.age - b.age; })[0];
                    }

                    if (playerToMove) {
                        var playerIndex = largerTeam.indexOf(playerToMove);
                        if (playerIndex > -1) {
                            largerTeam.splice(playerIndex, 1);
                            smallerTeam.push(playerToMove);
                        } else {
                            break; 
                        }
                    } else {
                        break; 
                    }
                }
            };

            iterativeBalance(); 

            // ====================================================
            // RENDERIZAÇÃO FINAL
            // ====================================================
            resultsDiv.className = 'grid-' + numTeams;
            
            var shuffledColors = shuffleArray(teamColors.slice());
            var shuffledShields = shuffleArray(SHIELD_SVGS.slice());

            resultsDiv.innerHTML = "";
            // atualiza o header (fora do #results) — cria se não existir
            var resultsHeader = document.getElementById('results-header');
            if (!resultsHeader) {
                // caso não tenha sido criado no HTML, cria dinamicamente acima de #results
                resultsHeader = document.createElement('div');
                resultsHeader.id = 'results-header';
                resultsDiv.parentNode.insertBefore(resultsHeader, resultsDiv);
            }
            resultsHeader.innerHTML = ''; // limpa

            var resultsTitle = document.createElement('h2');
            resultsTitle.className = 'results-title';
            resultsTitle.textContent = 'Escalações';
            resultsHeader.appendChild(resultsTitle);


            teams.forEach(function(team, index) {
                var teamDiv = document.createElement('div');
                teamDiv.className = 'team';

		teamDiv.style.transform = 'translateY(25px)';
		teamDiv.style.opacity = '0';

                var teamColorName = shuffledColors[index] || 'Cor ' + (index + 1);
                var teamColorHex = colorMap[teamColorName] || '#ECEDEF';
                var shieldSVGPath = shuffledShields[index % SHIELD_SVGS.length];
                
                // Separação e ordenação para campo/reserva (Titulares: 5)
                var sortedTeamPlayers = team.sort(function(a, b) {
                    if (a.isGoalie && !b.isGoalie) return -1; 
                    if (!a.isGoalie && b.isGoalie) return 1;
                    return b.age - a.age;
                });

		// INDICADORES DE CARROSSEL (versão mobile)
		var carouselIndicators = document.getElementById('carousel-indicators');
		carouselIndicators.innerHTML = ''; // limpa os pontos antigos

		if (window.innerWidth <= 768) {
		    var totalTeams = teams.length;
		    for (let i = 0; i < totalTeams; i++) {
		        var dot = document.createElement('div');
		        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
		        carouselIndicators.appendChild(dot);
		    }

		    var resultsContainer = document.getElementById('results');
		    var dots = document.querySelectorAll('.carousel-dot');

		    resultsContainer.addEventListener('scroll', function () {
		        var scrollLeft = resultsContainer.scrollLeft;
		        var cardWidth = resultsContainer.clientWidth;
		        var activeIndex = Math.round(scrollLeft / cardWidth);
        
		        dots.forEach((dot, idx) => {
		            dot.classList.toggle('active', idx === activeIndex);
		        });
		    });
		}

                var onFieldPlayers = sortedTeamPlayers.slice(0, 5);
                var substitutes = sortedTeamPlayers.slice(5);

                // LÓGICA DE CORREÇÃO DE GOLEIRO EM CAMPO
                var designatedGoalie = null;
                if (!onFieldPlayers.some(function(p){ return p.isGoalie; })) {
                    var potentialGoalies = onFieldPlayers.filter(function(p){ return p.age >= 15; });
                    if (potentialGoalies.length > 0) {
                        designatedGoalie = shuffleArray(potentialGoalies)[0];
                    }
                }

                var hasGoalieBeenPlaced = false;
                var onFieldPlayersForDisplay = onFieldPlayers.map(function(player) {
                    var p = {};
                    for (var k in player) { if (Object.prototype.hasOwnProperty.call(player, k)) p[k] = player[k]; }

                    if (!p.isGoalie && player === designatedGoalie) {
                        p.isGoalie = true; 
                        p.isTempGoalie = true; 
                    }
                    
                    if (p.isGoalie && hasGoalieBeenPlaced) {
                        p.isGoalie = false;
                        p.isBackupGoalie = true; 
                    } else if (p.isGoalie) {
                        hasGoalieBeenPlaced = true;
                    }

                    return p;
                });
                
                teamDiv.innerHTML = createTeamCardHTML(
                    team, 
                    teamColorName, 
                    teamColorHex, 
                    onFieldPlayersForDisplay, 
                    substitutes,
                    shieldSVGPath 
                );

                // Salva este time com posições e escalação exatas
                exportedTeamsTemp.push({
                    fullTeam: sortedTeamPlayers.map(p => ({ ...p })),
                    colorName: teamColorName,
                    colorHex: teamColorHex,
                    shieldPath: shieldSVGPath,

                    onField: onFieldPlayersForDisplay.map(p => ({
                        name: p.name,
                        age: p.age,
                        isGoalie: p.isGoalie || false,
                        isTempGoalie: p.isTempGoalie || false,
                        isBackupGoalie: p.isBackupGoalie || false,
                        finalPosition: p.finalPosition || null
                    })),

                    substitutes: substitutes.map(p => ({
                        name: p.name,
                        age: p.age,
                        isGoalie: p.isGoalie || false,
                        finalPosition: p.finalPosition || null
                    }))
                });

                resultsDiv.appendChild(teamDiv);
              
		setTimeout(function(td){
  		  return function(){
			td.classList.add('show');
			td.style.transform = 'translateY(0)';
			td.style.opacity = '1';
			};
		}(teamDiv), 50 * index);
            });


            // ------------------------
            // SALVAR DADOS PARA COMPARTILHAR
            // ------------------------
            try {
                var shareData = {
                    date: (dateInput ? dateInput.value : ''),
                    time: (timeInput ? timeInput.value : ''),
                    addressName: (addressInput ? addressInput.dataset.selectedName || '' : ''),
                    address: (addressInput ? addressInput.dataset.selectedAddress || '' : ''),
                    mapLink: (addressInput ? addressInput.dataset.selectedLink || '' : ''),
                    
                    // ESTA É A PARTE IMPORTANTE:
                    // usa exatamente os dados que você já salvou no loop!
                    teams: exportedTeamsTemp
                };

                window.Sorteio.lastShared = shareData;

            } catch (e) {
                console.warn("Não foi possível preparar dados para compartilhamento", e);
            }
        }

        // ====================================================
        // Função pública para renderizar um sorteio compartilhado (modo somente leitura)
        // ====================================================
        window.Sorteio.renderShared = function (data) {
            try {
                console.log("RenderShared iniciado", data);

                const resultsDiv = document.getElementById('results');
                const mainInputCard = document.getElementById('main-input-card');
                const mapCard = document.getElementById('map-card');
                const dateInput = document.getElementById('date-input');
                const timeInput = document.getElementById('time-input');
                const addressInput = document.getElementById("address-input");

                // ===============================
                // MODO READ-ONLY
                // ===============================
                document.body.classList.add("view-only");

                // Esconde o card principal (inputs dos jogadores)
                if (mainInputCard) mainInputCard.style.display = "none";

                // Esconde abas
                const tabs = document.querySelector(".tabs");
                if (tabs) tabs.style.display = "none";

                // ===============================
                // DATA / HORA (somente leitura)
                //===============================
                if (dateInput) dateInput.value = data.date || "";
                // Atualiza o dia da semana (usa updateDayOfWeek se existir; fallback local se não)
                if (typeof updateDayOfWeek === 'function') {
                    try {
                        updateDayOfWeek(data.date || '');
                    } catch (e) {
                        console.warn('updateDayOfWeek lançou erro:', e);
                    }
                } else {
                    // fallback simples: tenta calcular dia da semana e inserir em elementos comuns
                    try {
                        var d = (data.date || '').trim(); // espera formato "DD/MM" ou "DD/MM/YYYY"
                        if (d) {
                            // tenta obter dia/mês/ano (se não vier o ano, usa o ano atual)
                            var parts = d.split('/');
                            var day = parseInt(parts[0], 10) || 1;
                            var month = (parts.length > 1) ? (parseInt(parts[1], 10) - 1) : 0;
                            var year = (parts.length > 2) ? parseInt(parts[2], 10) : (new Date()).getFullYear();

                            var dt = new Date(year, month, day);
                            if (!isNaN(dt.getTime())) {
                                var weekdayNames = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
                                var weekdayText = weekdayNames[dt.getDay()];

                                // tenta inserir em seletores comuns (se a sua UI tiver um elemento para isso)
                                var possibleSelectors = ['#day-of-week', '#date-day', '.date-weekday', '.day-of-week', '#weekday'];
                                var placed = false;
                                possibleSelectors.forEach(function(sel){
                                    if (placed) return;
                                    var el = document.querySelector(sel);
                                    if (el) {
                                        el.textContent = weekdayText;
                                        placed = true;
                                    }
                                });

                                // se não encontrou elemento para colocar, cria um pequeno label ao lado do dateInput (não intrusivo)
                                if (!placed && dateInput && dateInput.parentNode) {
                                    var existing = dateInput.parentNode.querySelector('.shared-weekday-label');
                                    if (!existing) {
                                        var lab = document.createElement('div');
                                        lab.className = 'shared-weekday-label';
                                        //lab.style.fontSize = '0.95rem';
                                        //lab.style.opacity = '0.85';
                                        //lab.style.marginTop = '6px';
                                        //lab.style.color = '#ECEDEF';
                                        lab.textContent = weekdayText;
                                        dateInput.parentNode.appendChild(lab);
                                    } else {
                                        existing.textContent = weekdayText;
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('fallback para dia da semana falhou:', e);
                    }
                }

                if (timeInput) timeInput.value = data.time || "";

                // Impede edição da data e hora no modo compartilhamento
                if (dateInput) {
                    dateInput.readOnly = true;
                    dateInput.style.pointerEvents = "none";
                    //dateInput.style.opacity = "0.7";
                }

                if (timeInput) {
                    timeInput.readOnly = true;
                    timeInput.style.pointerEvents = "none";
                    //timeInput.style.opacity = "0.7";
                }

                // ===============================
                // ENDEREÇO (somente leitura)
                // ===============================
                const sharedAddressBox = document.getElementById("shared-address-info");
                const sharedAddressName = document.getElementById("shared-address-name");
                const sharedAddressFull = document.getElementById("shared-address-full");

                if (sharedAddressBox && sharedAddressName && sharedAddressFull) {
                    sharedAddressName.textContent = data.addressName || "";
                    sharedAddressFull.textContent = data.address || "";
                    sharedAddressBox.style.display = "block";
                }

                // some com o input normal do endereço
                if (addressInput) {
                    addressInput.style.display = "none";
                }

                // Atualiza mapLink nos datasets (para manter botão funcionando)
                if (addressInput) {
                    addressInput.dataset.selectedName = data.addressName || "";
                    addressInput.dataset.selectedAddress = data.address || "";
                    addressInput.dataset.selectedLink = data.mapLink || "";
                }

                if (typeof updateMapButtonState === "function") {
                    updateMapButtonState();
                }

                // ===============================
                // RENDERIZAR TIMES
                // ===============================
                resultsDiv.innerHTML = ""; // limpa lista atual

                try {
                    let resultsHeader = document.getElementById('results-header');

                    // Se ainda não existir, cria tudo do zero
                    if (!resultsHeader) {
                        resultsHeader = document.createElement('div');
                        resultsHeader.id = 'results-header';
                        resultsHeader.className = 'results-header';

                        const title = document.createElement('h2');
                        title.className = 'results-title';
                        title.textContent = 'Escalações';

                        resultsHeader.appendChild(title);

                        // Insere acima da área de resultados
                        resultsDiv.parentNode.insertBefore(resultsHeader, resultsDiv);

                    } else {
                        // Se existir, mas estiver vazio, recria o título
                        let title = resultsHeader.querySelector('.results-title');

                        if (!title) {
                            title = document.createElement('h2');
                            title.className = 'results-title';
                            resultsHeader.appendChild(title);
                        }

                        title.textContent = 'Escalações';
                        resultsHeader.style.display = 'block';
                    }

                } catch (e) {
                    console.warn("Não foi possível criar o results-header no modo compartilhado:", e);
                }

                const teamsToRender = data.teams || [];
                resultsDiv.className = 'grid-' + (teamsToRender.length || 2);

                const shuffledColors = shuffleArray(teamColors.slice());
                const shuffledShields = shuffleArray(SHIELD_SVGS.slice());

                teamsToRender.forEach(function(teamObj, index) {

                    const teamColorName = teamObj.colorName;
                    const teamColorHex = teamObj.colorHex;
                    const shieldSVGPath = teamObj.shieldPath;

                    const onFieldPlayers = teamObj.onField || [];
                    const substitutes = teamObj.substitutes || [];
                    const fullTeam = teamObj.fullTeam || [];

                    const teamDiv = document.createElement('div');
                    teamDiv.className = "team show";

                    const playersForCard = [
                        ...onFieldPlayers,
                        ...substitutes
                    ];

                    teamDiv.innerHTML = createTeamCardHTML_SHARED(
                        playersForCard,
                        teamColorName,
                        teamColorHex,
                        onFieldPlayers,   // estes têm finalPosition
                        substitutes,      // reservas
                        shieldSVGPath
                    );

                    resultsDiv.appendChild(teamDiv);
                });

                // ======================================================
                // ATIVA O CARROSSEL NO MODO COMPARTILHADO (MOBILE)
                // ======================================================
                try {
                    if (window.innerWidth <= 768) {

                        var carouselIndicators = document.getElementById('carousel-indicators');
                        if (carouselIndicators) carouselIndicators.innerHTML = '';

                        var totalTeams = teamsToRender.length;

                        // Criar dots
                        for (let i = 0; i < totalTeams; i++) {
                            var dot = document.createElement('div');
                            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
                            carouselIndicators.appendChild(dot);
                        }

                        var resultsContainer = document.getElementById('results');
                        var dots = document.querySelectorAll('.carousel-dot');

                        // Listener para atualizar o indicador ativo
                        resultsContainer.addEventListener('scroll', function () {
                            var scrollLeft = resultsContainer.scrollLeft;
                            var cardWidth = resultsContainer.clientWidth;
                            var activeIndex = Math.round(scrollLeft / cardWidth);

                            dots.forEach((dot, idx) => {
                                dot.classList.toggle('active', idx === activeIndex);
                            });
                        });
                    }
                } catch (e) {
                    console.warn("Carrossel não pôde ser inicializado no modo compartilhado:", e);
                }

                console.log("renderShared finalizado — times renderizados:", teamsToRender.length);

            } catch (err) {
                console.error("Erro no renderShared:", err);
            }
        };
        
        // ====================================================
        // INICIALIZAÇÃO E EVENT LISTENERS
        // ====================================================
        
        // --- Jogadores e Estatísticas ---
        var savedPlayers = null;
        try { savedPlayers = localStorage.getItem('playerList'); } catch(e) { savedPlayers = null; }
        if (savedPlayers) {
            updateTextareaValue(savedPlayers);
        } else {
            updateTextareaValue(initialPlaceholder);
        }

        playersTextarea.addEventListener('focus', function() {
            if (playersTextarea.value === initialPlaceholder) {
                updateTextareaValue('');
            }
        });

        playersTextarea.addEventListener('blur', function() {
            if (playersTextarea.value.trim() === '') {
                updateTextareaValue(initialPlaceholder);
            }
        });

        playersTextarea.addEventListener('input', updateStats); 

        // Salva a lista a cada 3 segundos
        setInterval(function() {
            try {
                if (playersTextarea.value.trim() !== '' && playersTextarea.value !== initialPlaceholder) {
                    localStorage.setItem('playerList', playersTextarea.value);
                } else {
                    localStorage.removeItem('playerList');
                }
            } catch(e) {
                // ignore localStorage errors
            }
        }, 3000); 

        // --- Data e Hora ---
        var savedDate = null;
        var savedTime = null;
        try { savedDate = localStorage.getItem('matchDate'); } catch(e) { savedDate = null; }
        try { savedTime = localStorage.getItem('matchTime'); } catch(e) { savedTime = null; }

        if (savedDate) {
            dateInput.value = savedDate;
            updateDayOfWeek(savedDate);
        } else {
             updateDayOfWeek('');
        }
        if (savedTime) {
            timeInput.value = savedTime;
        }

        dateInput.addEventListener('input', function(e){ formatInput(e.target, '/'); });
        timeInput.addEventListener('input', function(e){ formatInput(e.target, ':'); });
        
        // --- Endereço e Mapa ---
        addressInput.addEventListener('focus', filterAndRenderDropdown);
        addressInput.addEventListener('click', filterAndRenderDropdown);

        // Oculta o dropdown ao clicar fora
        document.addEventListener('click', function(event) {
            var container = document.getElementById('address-input-container');
            var isClickInside = container && container.contains(event.target);
            if (!isClickInside) {
                customDropdown.style.display = 'none';
            }
        });

        openMapBtn.addEventListener('click', function() {
            var mapLink = addressInput.dataset.selectedLink; 
            if (mapLink) {
                window.open(mapLink, '_blank');
            } else {
                alert("Por favor, selecione um endereço da lista.");
            }
        });

        updateMapButtonState(); // Garante o estado inicial do botão/imagem

        // --- Botões Principais ---
        drawBtn.addEventListener('click', drawTeams);
        clearBtn.addEventListener('click', function() {
            updateTextareaValue(initialPlaceholder);
            try { localStorage.removeItem('playerList'); } catch(e) {}
            resultsDiv.innerHTML = '';
        });
        // Botão Compartilhar
        var shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function() {
                try {
                    var payload = window.Sorteio && window.Sorteio.lastShared;
                    if (!payload || !payload.teams || payload.teams.length === 0) {
                        alert('Primeiro, gere um sorteio para poder compartilhar o resultado.');
                        return;
                    }

                    // serializa em UTF-8 e codifica em Base64 URL-safe
                    function encodeData(obj) {
                        var json = JSON.stringify(obj);
                        // UTF-8 safe base64
                        var utf8 = unescape(encodeURIComponent(json));
                        var b64 = btoa(utf8);
                        return encodeURIComponent(b64);
                    }

                    var encoded = encodeData(payload);
                    var shareLink = window.location.origin + window.location.pathname + '?share=' + encoded;

                    // tenta copiar para clipboard
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(shareLink).then(function() {
                            alert('Link copiado para a área de transferência!');
                        }, function(err) {
                            // fallback: mostra o link para o usuário copiar manualmente
                            prompt('Copie o link abaixo:', shareLink);
                        });
                    } else {
                        // fallback para navegadores antigos
                        prompt('Copie o link abaixo:', shareLink);
                    }
                } catch (err) {
                    console.error('Erro ao gerar link de compartilhamento:', err);
                    alert('Ocorreu um erro ao gerar o link. Veja o console para detalhes.');
                }
            });
        }

        function createTeamCardHTML_SHARED(fullTeam, teamColorName, teamColorHex, onFieldPlayers, substitutes, shieldSVGPath) {

        var totalAge = fullTeam.reduce((s,p)=>s+p.age,0);
        var avgAge = (fullTeam.length ? (totalAge / fullTeam.length).toFixed(1) : 'N/A');

        var pitchHTML = `
            <div class="football-pitch">
                <div class="line-top"></div>
                <div class="penalty-box"></div>
                <div class="six-yard-box"></div>
                <div class="penalty-spot"></div>
                <div class="center-circle"></div>
                <div class="penalty-arc"></div>
        `;

        onFieldPlayers.forEach(player => {
            pitchHTML += createPlayerMarkerHTML(player, teamColorHex, player.finalPosition);
        });

        pitchHTML += '</div>';

        var substitutesHTML = substitutes
            .map(p => createSubstituteHTML(p, teamColorHex))
            .join('');

        return `
            <div class="team-header">
                <div class="name-and-color">
                    <svg class="team-shield" viewBox="0 0 150 150" style="fill: ${teamColorHex};">
                        ${shieldSVGPath}
                    </svg>
                    ${teamColorName}
                </div>
                <div class="info-text">
                    <strong>${fullTeam.length} Jogadores</strong><br>
                    Idade média: ${avgAge} anos
                </div>
            </div>

            <div class="pitch-container">
                ${pitchHTML}
            </div>

            <div class="substitutes-section">
                <h4>Substituições <span class="count">(${substitutes.length} jogador${substitutes.length !== 1 ? 'es' : ''})</span></h4>
                <ul class="substitutes-list">
                    ${substitutesHTML}
                </ul>
            </div>
        `;
        }
    }; // fim window.Sorteio.init
}(window, document));