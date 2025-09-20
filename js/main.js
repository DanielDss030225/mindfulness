// Main Application Controller
class MindfulnessApp {

    constructor() {
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('Initializing PlataformaBizurada App...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.startApp());
            } else {
                this.startApp();
            }
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showInitializationError();
        }
    }

    async startApp() {
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize Firebase and wait for auth state
            await this.initializeFirebase();
            
            // Initialize all managers
            this.initializeManagers();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('Mindfulness App initialized successfully');
            
        } catch (error) {
            console.error('Error starting app:', error);
            this.showInitializationError();
        }
    }

    showLoadingScreen() {
        // Show loading screen with app info
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('active');
        }
    }

    async initializeFirebase() {
        return new Promise((resolve) => {
            // Firebase is already initialized in firebase-config.js
            // Just wait a bit for auth state to settle
            setTimeout(() => {
                resolve();
            }, 1000);
        });
    }

    initializeManagers() {
        // All managers are already initialized in their respective files
        // This method can be used for additional setup if needed
        
        // Verify all managers are available
        const requiredManagers = [
            'authManager',
            'databaseManager', 
            'uiManager',
            'gameLogic',
            'adminManager',
            'profileManager',
            'commentsManager'
        ];

        const missingManagers = requiredManagers.filter(manager => !window[manager]);
        
        if (missingManagers.length > 0) {
            throw new Error(`Missing managers: ${missingManagers.join(', ')}`);
        }

        console.log('All managers initialized successfully');
    }

    setupGlobalEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            this.handleBrowserNavigation(e);
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.handleOnlineStatus(true);
        });

        window.addEventListener('offline', () => {
            this.handleOnlineStatus(false);
        });

        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Prevent context menu on production (optional)
        if (window.location.hostname !== 'localhost') {
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.handleGlobalError(e.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.handleGlobalError(e.reason);
        });
    }

    handleBrowserNavigation(e) {
        // Handle browser back/forward navigation
        // This can be enhanced to maintain app state
        console.log('Browser navigation detected');
    }

    handleOnlineStatus(isOnline) {
        if (isOnline) {
            window.uiManager.showNotification('Conexão restaurada!', 'success', 2000);
        } else {
            window.uiManager.showNotification('Sem conexão com a internet', 'warning', 5000);
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Tab is hidden
            console.log('App hidden');
        } else {
            // Tab is visible
            console.log('App visible');
            // Refresh data if needed
            this.refreshAppData();
        }
    }

    handleGlobalKeyboard(e) {
        // Global keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'h':
                    e.preventDefault();
                    this.showKeyboardShortcuts();
                    break;
                case '/':
                    e.preventDefault();
                    this.focusSearch();
                    break;
            }
        }

        // Escape key to close modals
        if (e.key === 'Escape') {
            window.uiManager.hideModal();
            window.commentsManager.closeCommentsModal();
        }
    }

    handleWindowResize() {
        // Handle responsive layout changes
        this.updateLayoutForScreenSize();
    }

    handleGlobalError(error) {
        // Don't show error modal for every error to avoid spam
        // Log to console and optionally send to error tracking service
        console.error('Application error:', error);
        
        // Show user-friendly error message for critical errors
        if (error.message && error.message.includes('Firebase')) {
            window.uiManager.showNotification('Erro de conexão. Verifique sua internet.', 'error');
        }
    }

    showInitializationError() {
        // Show error screen if app fails to initialize
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                padding: 20px;
                font-family: Arial, sans-serif;
            ">
                <h1>Erro ao Carregar Aplicação</h1>
                <p>Ocorreu um erro ao inicializar o Mindfulness.</p>
                <p>Por favor, recarregue a página ou tente novamente mais tarde.</p>
                <button onclick="window.location.reload()" style="
                    background: white;
                    color: #333;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    margin-top: 20px;
                ">
                    Recarregar Página
                </button>
            </div>
        `;
    }

    showKeyboardShortcuts() {
        const shortcuts = `
            <div style="text-align: left;">
                <h4>Atalhos do Teclado:</h4>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Ctrl/Cmd + H:</strong> Mostrar atalhos</li>
                    <li><strong>Escape:</strong> Fechar modais</li>
                    <li><strong>Ctrl/Cmd + Enter:</strong> Enviar comentário</li>
                </ul>
            </div>
        `;
        
        window.uiManager.showModal('Atalhos do Teclado', shortcuts);
    }

    focusSearch() {
        // Focus search input if available
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="buscar"]');
        if (searchInput) {
            searchInput.focus();
        }
    }

    updateLayoutForScreenSize() {
        // Update layout based on screen size
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile-layout', isMobile);
    }

    async refreshAppData() {
        // Refresh app data when tab becomes visible
        if (!this.isInitialized) return;

        try {
            const currentScreen = window.uiManager.getCurrentScreen();
            
            switch (currentScreen) {
                case 'profile-screen':
                    if (window.profileManager) {
                        await window.profileManager.loadUserStats();
                    }
                    break;
                case 'admin-screen':
                    if (window.adminManager && window.authManager.isUserAdmin()) {
                        window.adminManager.loadCategories();
                    }
                    break;
            }
        } catch (error) {
            console.error('Error refreshing app data:', error);
        }
    }

    // Utility methods
    getAppVersion() {
        return '1.0.0';
    }

    getAppInfo() {
        return {
            name: 'Mindfulness',
            version: this.getAppVersion(),
            description: 'Jogo Educativo de Questões',
            author: 'Mindfulness Team'
        };
    }

    // Performance monitoring
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    // Debug methods (development only)
    enableDebugMode() {
        if (window.location.hostname === 'localhost') {
            window.debug = {
                app: this,
                auth: window.authManager,
                database: window.databaseManager,
                ui: window.uiManager,
                game: window.gameLogic,
                admin: window.adminManager,
                profile: window.profileManager,
                comments: window.commentsManager
            };
            console.log('Debug mode enabled. Use window.debug to access managers.');
        }
    }

    // Cleanup method
    destroy() {
        // Cleanup event listeners and resources
        window.removeEventListener('popstate', this.handleBrowserNavigation);
        window.removeEventListener('online', this.handleOnlineStatus);
        window.removeEventListener('offline', this.handleOnlineStatus);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('keydown', this.handleGlobalKeyboard);
        window.removeEventListener('resize', this.handleWindowResize);
        
        this.isInitialized = false;
        console.log('Mindfulness App destroyed');
    }



    
}

// Initialize the application
const mindfulnessApp = new MindfulnessApp();

// Make app available globally for debugging
window.mindfulnessApp = mindfulnessApp;

// Enable debug mode in development
if (window.location.hostname === 'localhost') {
    mindfulnessApp.enableDebugMode();
}

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

function goToProfile() {
    if (window.uiManager) {
        window.uiManager.showScreen('profile-screen');
        if (window.profileManager) {
            window.profileManager.loadUserStats();
        }
    }
}


function atualizarHeaderVisibilidade() {
    const header = document.querySelector('.game-header');
    const loginScreen = document.getElementById('login-screen');

    if (loginScreen.classList.contains('active')) {
        header.style.display = 'none'; // esconde o header
    } else {
        header.style.display = ''; // mostra novamente
    }
}

// Chame essa função sempre que trocar de tela
const screens = document.querySelectorAll('.screen');
screens.forEach(screen => {
    const observer = new MutationObserver(() => {
        atualizarHeaderVisibilidade();
    });
    observer.observe(screen, { attributes: true, attributeFilter: ['class'] });
});








// Player popup functionality
document.addEventListener("DOMContentLoaded", function() {
    const openPlayerBtn = document.getElementById("openPlayerBtn");
    let playerWindow = null; // Variável para guardar a referência da janela do player

    if (openPlayerBtn) {
        openPlayerBtn.addEventListener("click", (event) => {
            event.preventDefault(); // Impede que o link <a> navegue

            // Verifica se a janela do player não existe ou se foi fechada pelo usuário
            if (playerWindow === null || playerWindow.closed) {
                
                // Abre a nova janela popup
                playerWindow = window.open(
                    "player.html?autoplay=true", // A URL do player com parâmetro de autoplay
                    "MusicPlayer",               // Nome único para a janela
                    "width=400,height=700,scrollbars=no,resizable=yes,toolbar=no,menubar=no,location=no,status=no" // Opções da janela
                );

                // Imediatamente após abrir, traz o foco de volta para a janela principal
                // Isso faz a janela do player ir para segundo plano
                if (playerWindow) {
                    setTimeout(() => {
                        window.focus();
                        // Adiciona classe visual para indicar que o player está ativo
                        openPlayerBtn.classList.add("player-active");
                        openPlayerBtn.querySelector(".tocarbtn").textContent = "🎵 Tocando";
                        openPlayerBtn.querySelector(".ouvirMusica").textContent = "Player aberto em segundo plano";
                    }, 200); 
                }

                // Monitora se a janela foi fechada para atualizar o botão
                const checkClosed = setInterval(() => {
                    if (playerWindow.closed) {
                        clearInterval(checkClosed);
                        openPlayerBtn.classList.remove("player-active");
                        openPlayerBtn.querySelector(".tocarbtn").textContent = "🎵 Tocar";
                        openPlayerBtn.querySelector(".ouvirMusica").textContent = "Ouça música enquanto estuda";
                        playerWindow = null;
                    }
                }, 1000);
                
            } else {
                // Se a janela já estiver aberta, traz ela para frente momentaneamente
                playerWindow.focus();
                // Depois volta o foco para a janela principal
                setTimeout(() => {
                    window.focus();
                }, 500);
            }
        });
    }

    // Função global para comunicação com o player
    window.playerControl = {
        isPlayerOpen: () => playerWindow && !playerWindow.closed,
        closePlayer: () => {
            if (playerWindow && !playerWindow.closed) {
                playerWindow.close();
            }
        },
        focusPlayer: () => {
            if (playerWindow && !playerWindow.closed) {
                playerWindow.focus();
            }
        }
    };
});














function atualizarHeaderVisibilidade() {
    const header = document.querySelector('.game-header');
    const loginScreen = document.getElementById('login-screen');

    // Detecta se é desktop (largura mínima de 1024px, pode ajustar)
    const isDesktop = window.innerWidth >= 765;

    // Salva no localStorage (substitui valor anterior)
    localStorage.setItem('ehDesktop', isDesktop ? 'sim' : 'não');

    // Atualiza visibilidade do header
    if (header && loginScreen) {
        if (loginScreen.classList.contains('active')) {
            header.style.display = 'none'; // Esconde o header na tela de login
        } else {
            header.style.display = ''; // Mostra o header em outras telas
        }
    }
}





// Monitora mudanças nas classes das telas para atualizar o header
document.addEventListener('DOMContentLoaded', () => {
    const screens = document.querySelectorAll('.screen');
    const observer = new MutationObserver(() => {

        atualizarHeaderVisibilidade();

    });

    screens.forEach(screen => {
        observer.observe(screen, { attributes: true, attributeFilter: ['class'] });
    });

    // Garante que o estado inicial está correto
    atualizarHeaderVisibilidade();
    // Instancia o ChatManager e o ChatUI para que fiquem disponíveis globalmente
    window.chatManager = new ChatManager();
    window.chatUI = new ChatUI();


});



//função para trocar professor
function monitoraTempo(actionFunction) {
        let lastHour = -1;

        function checkHour() {
            const now = new Date();
            const currentHour = now.getHours();

            if (currentHour !== lastHour) {
                actionFunction(currentHour);
                lastHour = currentHour;
            }
        }

        // Executa logo ao carregar
        checkHour();

        // Depois verifica a cada minuto
        setInterval(checkHour, 60000);
    }

 function minhaAcao(hour) {
    // Array com imagens correspondentes a cada hora do dia
    const imagens = [
      "./professores/policialcivil.png",        // 0h-1h
        "./professores/guardacivil.png",            // 1h-2h
        "./professores/bombeiromilitar.png",            // 2h-3h
       "./professores/policialrodoviario.png",             // 3h-4h
       "./professores/policialpenal.png",             // 4h-5h
      "./professores/policialmilitar.png",        // 5h-6h
        "./professores/policialfederal.png",             // 6h-7h
       "./professores/policialcivil.png",            // 7h-8h
        "./professores/guardacivil.png",           // 8h-9h
       "./professores/bombeiromilitar.png",             // 9h-10h
       "./professores/policialrodoviario.png",            // 10h-11h
    "./professores/policialpenal.png",           // 11h-12h
        "./professores/policialmilitar.png",              // 12h-13h
      "./professores/policialfederal.png",           // 13h-14h
        "./professores/policialcivil.png",             // 14h-15h
          "./professores/guardacivil.png",              // 15h-16h
           "./professores/bombeiromilitar.png",            // 16h-17h
         "./professores/policialrodoviario.png",  // 17h-18h
        "./professores/policialpenal.png", // 18h-19h
        "./professores/policialmilitar.png",            // 19h-20h
       "./professores/policialfederal.png",           // 20h-21h
        "./professores/policialcivil.png",           // 21h-22h
         "./professores/guardacivil.png",           // 22h-23h
        "./professores/bombeiromilitar.png",             // 23h-0h
    ];

    // Array apenas com os nomes
  const nomes = [
  "Policial Civil",         // 0h-1h
  "Guarda Civil",           // 1h-2h
  "Bombeiro Militar",       // 2h-3h
  "Policial Rodoviário",    // 3h-4h
  "Policial Penal",         // 4h-5h
  "Policial Militar",       // 5h-6h
  "Policial Federal",       // 6h-7h
  "Policial Civil",         // 7h-8h
  "Guarda Civil",           // 8h-9h
  "Bombeiro Militar",       // 9h-10h
  "Policial Rodoviário",    // 10h-11h
  "Policial Penal",         // 11h-12h
  "Policial Militar",       // 12h-13h
  "Policial Federal",       // 13h-14h
  "Policial Civil",         // 14h-15h
  "Guarda Civil",           // 15h-16h
  "Bombeiro Militar",       // 16h-17h
  "Policial Rodoviário",    // 17h-18h
  "Policial Penal",         // 18h-19h
  "Policial Militar",       // 19h-20h
  "Policial Federal",       // 20h-21h
  "Policial Civil",         // 21h-22h
  "Guarda Civil",           // 22h-23h
  "Bombeiro Militar"        // 23h-0h
];


    // Seleciona os elementos
    const imgElement = document.querySelector(".professor-img");
    const nomeElement = document.querySelector(".nomeProfessora");
 const imgElement2 = document.querySelector(".professor2-img");
    const nomeElement2 = document.querySelector(".nomeProfessora2");

    if (imgElement) {
        imgElement.src = imagens[hour] || "img/default.png";
        imgElement.alt = `Imagem para o intervalo ${hour}h - ${hour + 1}h`;
    }

    if (nomeElement) {
        nomeElement.textContent = nomes[hour] || "Professor Desconhecido";
nomeElement.textContent ="Olá, sou um(a) " + nomes[hour] +  ". Estarei aqui durante 1 hora para te motivar! Bora começar?";

    }
      if (imgElement2) {
        imgElement2.src = imagens[hour] || "img/default.png";
        imgElement2.alt = `Imagem para o intervalo ${hour}h - ${hour + 1}h`;
    }

    if (nomeElement2) {
        nomeElement2.textContent = nomes[hour] || "Professor Desconhecido";
nomeElement2.textContent ="Olá, sou um(a) " + nomes[hour] +  ". Estarei aqui durante 1 hora para te motivar! Bora começar?";

    }
}

    window.addEventListener("DOMContentLoaded", () => {
        monitoraTempo(minhaAcao);
    });


    