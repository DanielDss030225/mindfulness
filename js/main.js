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



// Também pode chamar no carregamento inicial
window.addEventListener('DOMContentLoaded', atualizarHeaderVisibilidade);
// Em js/main.js ou um arquivo de script principal
document.addEventListener('DOMContentLoaded', function() {
    const openPlayerBtn = document.getElementById('openPlayerBtn');
    let playerWindow = null; // Variável para guardar a referência da janela do player

    if (openPlayerBtn) {
        openPlayerBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Impede que o link <a> navegue

            // Verifica se a janela do player não existe ou se foi fechada pelo usuário
            if (playerWindow === null || playerWindow.closed) {
                
                // --- A LÓGICA PRINCIPAL ACONTECE AQUI ---

                // 1. Abre a nova janela (pop-up). Em um celular, ela aparecerá na frente.
                // Passamos 'autoplay=true' para que o player saiba que deve tocar imediatamente.
                playerWindow = window.open(
                    'player.html?autoplay=true', // A URL do seu player com o parâmetro
                    'MusicPlayer',               // Um nome para a janela
                    'width=350,height=630,scrollbars=no,resizable=no' // Opções da janela
                );

                // 2. Imediatamente após abrir, traz o foco de volta para a janela principal.
                // Este é o passo crucial que faz a janela do player ir para segundo plano no celular.
                if (playerWindow) {
                    // Um pequeno atraso pode aumentar a confiabilidade em alguns navegadores
                    setTimeout(() => {
                        window.focus();
                    }, 100); 
                }
                
            } else {
                // Se a janela já estiver aberta, apenas a foca (mais útil em desktops).
                playerWindow.focus();
            }
        });
    }
});
/**
 * Função para atualizar a visibilidade do header com base na tela ativa.
 * O header não deve aparecer na tela de login.
 * Também salva no localStorage se o usuário está em desktop ("sim") ou não ("não").
 */
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
