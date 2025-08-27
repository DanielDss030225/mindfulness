

document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('background-audio');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playIcon = playPauseBtn.querySelector('.icon-play');
    const pauseIcon = playPauseBtn.querySelector('.icon-pause');
    const skipBtn = document.getElementById('skipBtn');

    // Lista de músicas
    const musicPlaylist = [
        'trem-bala.mp3',
        'mercy-me.mp3'
        // Adicione mais músicas aqui
    ];

    // Recupera estado salvo
    let isPlaying = localStorage.getItem('musicIsPlaying') === 'true';
    let lastTrack = localStorage.getItem('musicCurrentTrack');
    let lastTime = parseFloat(localStorage.getItem('musicCurrentTime')) || 0;

    // Função para tocar música (se nada salvo, pega aleatória)
    function playRandomMusic() {
        let musicFile = lastTrack || musicPlaylist[Math.floor(Math.random() * musicPlaylist.length)];
        audioPlayer.src = 'music/' + musicFile;
        audioPlayer.currentTime = lastTime || 0; // volta no ponto salvo
        audioPlayer.play().catch(error => console.error("Erro ao tocar música:", error));
        lastTrack = musicFile;
    }

    // Função para pular para a próxima música
    function skipToNextMusic() {
        const currentIndex = musicPlaylist.indexOf(lastTrack);
        const nextIndex = (currentIndex + 1) % musicPlaylist.length; // Vai para a próxima, e volta para o começo se for o final
        lastTrack = musicPlaylist[nextIndex];
        playRandomMusic(); // Toca a nova música
    }

    // Atualiza UI do botão
    function updateButtonUI() {
        if (isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline';
        } else {
            playIcon.style.display = 'inline';
            pauseIcon.style.display = 'none';
        }
    }

    // Botão play/pause
    playPauseBtn.addEventListener('click', function() {
        isPlaying = !isPlaying;
        if (isPlaying) {
            if (!audioPlayer.src) {
                playRandomMusic();
            } else {
                audioPlayer.play().catch(error => console.error("Erro ao continuar música:", error));
            }
        } else {
            audioPlayer.pause();
        }
        localStorage.setItem('musicIsPlaying', isPlaying);
        updateButtonUI();
    });

    // Quando terminar a música, toca a próxima
    audioPlayer.addEventListener('ended', function() {
        // Depois que a música terminar, chama a função de pular para a próxima
        skipToNextMusic(); // Isso vai mudar a música e tocar a próxima
    });

    // Salva progresso a cada 2s
    setInterval(() => {
        if (audioPlayer.src) {
            localStorage.setItem('musicCurrentTime', audioPlayer.currentTime);
            localStorage.setItem('musicCurrentTrack', lastTrack);
        }
    }, 2000);

    // Inicializa player ao carregar
    function initializePlayer() {
        if (isPlaying) {
            playRandomMusic();
        }
        updateButtonUI();
    }

    // Inicializa o player ao carregar
    initializePlayer();

    // Evento de pular música
    skipBtn.addEventListener('click', function() {
        skipToNextMusic();
    });

    // Volume inicial
    audioPlayer.volume = 0.01;
});


