// UI Manager - Handles screen transitions and UI interactions
class UIManager {
    constructor() {
        this.currentScreen = 'loading-screen';
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModalHandlers();
        this.showScreen('loading-screen');
        
        // Simulate loading time
        setTimeout(() => {
            this.hideLoading();
            this.showScreen('login-screen');
        }, 2000);
    }

    setupEventListeners() {
        // Main menu navigation
        const startQuizBtn = document.getElementById('startQuizBtn');
        const profileBtn = document.getElementById('profileBtn');
        const adminBtn = document.getElementById('adminBtn');

        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', () => this.showScreen('quiz-setup-screen'));
        }

        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                console.log('Profile button clicked - navigating to profile-screen');
                this.showScreen('profile-screen');
            });
        }

        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                console.log('Admin button clicked - navigating to admin-screen');
                this.showScreen('admin-screen');
            });
        }

        // Back buttons 

        const backToMenuBtn = document.getElementById('backToMenuBtn');
        const backToMenuFromProfileBtn = document.getElementById('backToMenuFromProfileBtn');
        const backToMenuFromAdminBtn = document.getElementById('backToMenuFromAdminBtn');
        const backToMenuFromResultBtn = document.getElementById('backToMenuFromResultBtn');

        

    if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => this.showScreen('main-menu-screen'));
        }
        if (backToMenuFromProfileBtn) {
            backToMenuFromProfileBtn.addEventListener('click', () => this.showScreen('main-menu-screen'));
        }

        if (backToMenuFromAdminBtn) {
            backToMenuFromAdminBtn.addEventListener('click', () => this.showScreen('main-menu-screen'));
        }

        if (backToMenuFromResultBtn) {
            backToMenuFromResultBtn.addEventListener('click', () => this.showScreen('main-menu-screen'));
        }

        // Quiz setup
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => this.startQuiz());
        }

        // Game controls
        const exitGameBtn = document.getElementById('exitGameBtn');
        if (exitGameBtn) {
            exitGameBtn.addEventListener('click', () => this.exitGame());
        }

        // Result screen
        const newQuizBtn = document.getElementById('newQuizBtn');
        const newQuizFromProfileBtn = document.getElementById('newQuizFromProfileBtn');
        const reviewQuestionsBtn = document.getElementById('reviewQuestionsBtn');

        if (newQuizBtn) {
            newQuizBtn.addEventListener('click', () => this.showScreen('quiz-setup-screen'));
        }

        if (newQuizFromProfileBtn) {
            newQuizFromProfileBtn.addEventListener('click', () => this.showScreen('quiz-setup-screen'));
        }

        if (reviewQuestionsBtn) {
            reviewQuestionsBtn.addEventListener('click', () => this.reviewQuestions());
        }
    }




    
    setupModalHandlers() {
        const modal = document.getElementById('modal');
        const commentsModal = document.getElementById('comments-modal');
        
        // Close modal handlers
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });

        // Click outside to close
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        }

        if (commentsModal) {
            commentsModal.addEventListener('click', (e) => {
                if (e.target === commentsModal) {
                    this.hideCommentsModal();
                }
            });
        }

        // Modal buttons
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');

        if (modalConfirm) {
            modalConfirm.addEventListener('click', () => this.hideModal());
        }

        if (modalCancel) {
            modalCancel.addEventListener('click', () => this.hideModal());
        }
    }

    showScreen(screenId) {
        console.log(`Showing screen: ${screenId}`);
        
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Add animation class
            targetScreen.classList.add('fade-in');
            setTimeout(() => {
                targetScreen.classList.remove('fade-in');
            }, 500);

            // Screen-specific initialization
            this.onScreenShown(screenId);
        } else {
            console.error(`Screen with ID '${screenId}' not found`);
        }
    }

    onScreenShown(screenId) {
        switch (screenId) {
            case 'main-menu-screen':
                this.updateProfessorMessage();
                break;
            case 'quiz-setup-screen':
                this.loadCategories();
                break;
            case 'profile-screen':
                console.log('Profile screen shown - loading user stats');
                if (window.profileManager) {
                    window.profileManager.loadUserStats();
                }
                break;
            case 'admin-screen':
                console.log('Admin screen shown - loading categories');
                if (window.adminManager) {
                    window.adminManager.loadCategories();
                }
                break;
        }
    }

    showLoading() {
        this.isLoading = true;
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('active');
        }
    }

    hideLoading() {
        this.isLoading = false;
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
        }
    }

    showModal(title, message, type = 'info', showCancel = false) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');

        if (modal && modalTitle && modalMessage) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            
            // Set button styles based on type
            modalConfirm.className = `btn-${type === 'error' ? 'secondary' : 'primary'}`;
            modalCancel.style.display = showCancel ? 'inline-block' : 'none';
            
            modal.classList.add('active');
            
            // Play sound based on type
            this.playSound(type);
        }
    }

    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showCommentsModal(questionId) {
        const commentsModal = document.getElementById('comments-modal');
        if (commentsModal) {
            commentsModal.classList.add('active');
            
            if (window.commentsManager) {
                window.commentsManager.loadComments(questionId);
            }
        }
    }

    hideCommentsModal() {
        const commentsModal = document.getElementById('comments-modal');
        if (commentsModal) {
            commentsModal.classList.remove('active');
        }
    }

    updateProfessorMessage() {
         const messages = [
            'Olá! Pronto para aprender hoje?',
            'Vamos testar seus conhecimentos!',
            'Aprender nunca foi tão divertido!',
            'Cada questão é uma oportunidade de crescer!',
            'Vamos descobrir o que você já sabe!',
             "Vamos testar seus conhecimentos!",
   
    // +30 novas mensagens
    "Você está indo muito bem, continue assim!",
    "O conhecimento é a chave do sucesso!",
    "Cada resposta é um passo rumo à vitória!",
    "Você é mais inteligente do que imagina!",
    "Aprender é um superpoder — use o seu!",
    "Não desista, cada erro é um aprendizado!",
    "O importante é continuar tentando!",
    "Sua dedicação está fazendo a diferença!",
     "Cada questão é uma oportunidade de crescer!",
    "Vamos descobrir o que você já sabe!",
    "Você nasceu para conquistar grandes coisas!",
    "Desafios tornam a jornada mais emocionante!",
    "Continue! Você está quase lá!",
    "Você está construindo um futuro brilhante!",
    "Não pare agora, o melhor ainda está por vir!",
    "Errar faz parte do aprendizado!",
    "Você está se superando!",
    "Todo grande caminho começa com pequenos passos!",
    "A mente que se abre a um novo conhecimento nunca volta ao tamanho original!",
    "Cada questão resolve um mistério!",
    "Vamos desbloquear mais um nível de sabedoria!",
    "Você está dominando o conteúdo!",
    "A cada resposta certa, um novo nível de confiança!",
    "Você está fazendo progresso real!",
    "Seja curioso, seja destemido, seja você!",
    "As respostas certas te aproximam do seu objetivo!",
    "Foco, força e conhecimento!",
    "Você é capaz de aprender qualquer coisa!",
    "Continue, sua evolução é visível!",
    "Aprender é um caminho sem volta — e você está trilhando bem!",
    "A coragem de tentar já é metade da vitória!",
    "A prática leva à perfeição!",
    "Você está escrevendo sua própria história de sucesso!",
    "Vamos com tudo! O próximo desafio te espera!",
    "Seu esforço hoje é o seu resultado amanhã!",
    "Confie no seu potencial!"
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const professorMessage = document.getElementById('professorMessage');
        
        if (professorMessage) {
            professorMessage.textContent = randomMessage;
            
            // Add animation
            professorMessage.parentElement.classList.add('slide-up');
            setTimeout(() => {
                professorMessage.parentElement.classList.remove('slide-up');
            }, 500);
        }
    }

    async loadCategories() {
        const categorySelect = document.getElementById('categorySelect');
        if (!categorySelect) return;

        try {
            const categories = await window.databaseManager.getCategories();
            categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
            
            // Add "Aleatórias" option
            const randomOption = document.createElement('option');
            randomOption.value = 'random';
            randomOption.textContent = 'Aleatórias';
            categorySelect.appendChild(randomOption);
            
            // Add other categories
            Object.entries(categories || {}).forEach(([id, category]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
            categorySelect.innerHTML = '<option value="">Erro ao carregar categorias</option>';
        }
    }

    async startQuiz() {
        const categorySelect = document.getElementById('categorySelect');
        const questionTypeRadios = document.querySelectorAll('input[name="questionType"]');
        
        if (!categorySelect || !questionTypeRadios.length) return;

        const selectedCategory = categorySelect.value;
        let selectedType = '';
        
        questionTypeRadios.forEach(radio => {
            if (radio.checked) {
                selectedType = radio.value;
            }
        });

        if (!selectedCategory) {
            this.showModal('Atenção', 'Por favor, selecione uma categoria.');
            return;
        }

        try {
            this.showLoading();
            
            if (window.gameLogic) {
                await window.gameLogic.startQuiz(selectedCategory, selectedType);
                this.showScreen('game-screen');
            }
            
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('Error starting quiz:', error);
            this.showModal('Erro', 'Erro ao iniciar o quiz. Tente novamente.');
        }
    }

    exitGame() {
        this.showModal(
            'Sair do simulado',
            'Tem certeza que deseja sair? Seu progresso será perdido.',
            'warning',
            true
        );
        
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');
        
        // Override confirm button for this specific case
        modalConfirm.onclick = () => {
            this.hideModal();
            this.showScreen('main-menu-screen');
            if (window.gameLogic) {
                window.gameLogic.resetGame();
            }
        };
        
        modalCancel.onclick = () => {
            this.hideModal();
        };
    }

    reviewQuestions() {
        // Implementation for reviewing questions
        this.showModal('Em Desenvolvimento', 'Funcionalidade de revisão em desenvolvimento.');
    }

    playSound(type) {
        // Create audio context for sound effects
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            let frequency;
            switch (type) {
                case 'success':
                    frequency = 800; // High pitch for success
                    break;
                case 'error':
                    frequency = 300; // Low pitch for error
                    break;
                case 'warning':
                    frequency = 600; // Medium pitch for warning
                    break;
                default:
                    frequency = 500; // Default pitch
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // Fallback: no sound if audio context fails
            console.log('Audio not available');
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after duration
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    getCurrentScreen() {
        return this.currentScreen;
    }

    isScreenActive(screenId) {
        return this.currentScreen === screenId;
    }
}

// Initialize UI Manager
window.uiManager = new UIManager();

