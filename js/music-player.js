document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('background-audio');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playIcon = playPauseBtn.querySelector('.icon-play');
    const pauseIcon = playPauseBtn.querySelector('.icon-pause');
    const skipBtn = document.getElementById('skipBtn');

    const musicPlaylist = [
        'trem-bala.mp3',
        'mercy-me.mp3'
        // Adicione mais músicas aqui
    ];

    let lastTrack = localStorage.getItem('musicCurrentTrack');
    let lastTime = parseFloat(localStorage.getItem('musicCurrentTime')) || 0;
    // A variável 'isPlaying' será controlada pelos eventos 'play' e 'pause' do áudio,
    // tornando o controle mais confiável.

    // --- FUNÇÃO CORRIGIDA ---
    // Adicionamos um parâmetro para saber se a música deve começar do início.
    function playMusic(startFromBeginning = false) {
        // Se não houver uma faixa anterior, escolhe uma aleatória.
        if (!lastTrack) {
            lastTrack = musicPlaylist[Math.floor(Math.random() * musicPlaylist.length)];
        }
        
        audioPlayer.src = 'music/' + lastTrack;
        
        // Se for para começar do início (após pular ou terminar), reseta o tempo.
        if (startFromBeginning) {
            audioPlayer.currentTime = 0;
        } else {
            // Senão, usa o tempo salvo (útil ao recarregar a página).
            audioPlayer.currentTime = lastTime || 0;
        }
        
        audioPlayer.play().catch(error => {
            console.error("Erro ao tocar música (o navegador pode ter bloqueado o autoplay):", error);
            updateButtonUI(); // Garante que a UI mostre o ícone de play se falhar.
        });
    }

    // --- FUNÇÃO CORRIGIDA ---
    function skipToNextMusic() {
        const currentIndex = musicPlaylist.indexOf(lastTrack);
        // Garante que o índice seja válido mesmo que a música não esteja na lista.
        const nextIndex = (currentIndex + 1) % musicPlaylist.length;
        lastTrack = musicPlaylist[nextIndex];
        
        // Chama a função para tocar, forçando o início em 0.
        playMusic(true); 
    }

    function updateButtonUI() {
        // A verificação agora é mais simples: o player está pausado?
        if (audioPlayer.paused) {
            playIcon.style.display = 'inline';
            pauseIcon.style.display = 'none';
        } else {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline';
        }
    }

    // Evento de Play/Pause
    playPauseBtn.addEventListener('click', function() {
        if (audioPlayer.paused) {
            // Se não tiver uma música carregada, inicia uma nova.
            if (!audioPlayer.src) {
                playMusic();
            } else {
                audioPlayer.play();
            }
        } else {
            audioPlayer.pause();
        }
    });

    // --- EVENTO 'ended' CORRIGIDO ---
    audioPlayer.addEventListener('ended', function() {
        // Simplesmente chama a função de pular, que já lida com a lógica.
        skipToNextMusic();
    });

    // Listeners para 'play' e 'pause' para manter a UI e o localStorage sincronizados.
    audioPlayer.addEventListener('pause', function() {
        localStorage.setItem('musicIsPlaying', 'false');
        updateButtonUI();
    });

    audioPlayer.addEventListener('play', function() {
        localStorage.setItem('musicIsPlaying', 'true');
        updateButtonUI();
    });

    // Salva o progresso da música em intervalos.
    setInterval(() => {
        if (audioPlayer.src && !audioPlayer.paused) {
            localStorage.setItem('musicCurrentTime', audioPlayer.currentTime);
            localStorage.setItem('musicCurrentTrack', lastTrack);
        }
    }, 2000);

    function initializePlayer() {
        // Se o localStorage indicar que estava tocando, carrega a música.
        if (localStorage.getItem('musicIsPlaying') === 'true' && lastTrack) {
            audioPlayer.src = 'music/' + lastTrack;
            audioPlayer.currentTime = lastTime || 0;
        }
        // A UI é atualizada para o estado correto (pausado por padrão).
        updateButtonUI();
    }

    initializePlayer();

    skipBtn.addEventListener('click', function() {
        skipToNextMusic();
    });

    audioPlayer.volume = 0.01;
});
