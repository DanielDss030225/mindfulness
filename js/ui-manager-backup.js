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

       
       // Em main.js (ou ui-manager.js), dentro da classe UIManager no método setupEventListeners

// ... outros listeners ...

if (profileBtn) {
    profileBtn.addEventListener('click', () => {
        const currentUser = window.authManager.getCurrentUser();
        if (currentUser) {
            // 1. Mostra a tela de perfil
            this.showScreen('profile-screen');

            // 2. Chama o profile.js para carregar as estatísticas e o gráfico
            if (window.profileManager) {
                window.profileManager.loadUserStats();
            }

            // 3. Chama o user-profile.js para carregar conquistas e sequência
            // Verifica se o perfil local já foi inicializado para não recarregar
            if (!window.localProfileManager) {
                console.log("Initializing local user profile modules (achievements, streak).");
                
                // Cria uma instância do manager com o prefixo 'local-'
                window.localProfileManager = new UserProfileManager('local-');
                
                // Inicia o carregamento passando o ID do usuário logado
                window.localProfileManager.init(currentUser.uid);
            }
        } else {
            console.error("No user logged in to show profile.");
            this.showModal("Erro", "Você precisa estar logado para ver seu perfil.");
        }
    });
}

// ... outros listeners ...




        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                this.showScreen('admin-screen');
                if (window.adminManager) {
                    window.adminManager.loadCategories();
                }
            });
        }

        // Back buttons
        ['backToMenuBtn', 'backToMenuFromProfileBtn', 'backToMenuFromAdminBtn', 'backToMenuFromResultBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => this.showScreen('main-menu-screen'));
        });

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

        [newQuizBtn, newQuizFromProfileBtn].forEach(btn => {
            if (btn) btn.addEventListener('click', () => this.showScreen('quiz-setup-screen'));
        });

        if (reviewQuestionsBtn) {
            reviewQuestionsBtn.addEventListener('click', () => this.reviewQuestions());
        }
    }

    setupModalHandlers() {
        const modal = document.getElementById('modal');
        const commentsModal = document.getElementById('comments-modal');

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal();
            });
        }

        if (commentsModal) {
            commentsModal.addEventListener('click', (e) => {
                if (e.target === commentsModal) this.hideCommentsModal();
            });
        }

        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');

        if (modalConfirm) modalConfirm.addEventListener('click', () => this.hideModal());
        if (modalCancel) modalCancel.addEventListener('click', () => this.hideModal());
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');

        });

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;

            targetScreen.classList.add('fade-in');
            setTimeout(() => targetScreen.classList.remove('fade-in'), 500);

            this.onScreenShown(screenId);
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
                if (window.profileManager) window.profileManager.loadUserStats();
                break;
            case 'admin-screen':
                if (window.adminManager) window.adminManager.loadCategories();
                break;
        }
    }

    showLoading() {
        this.isLoading = true;
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) loadingScreen.classList.add('active');
    }

    hideLoading() {
        this.isLoading = false;
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) loadingScreen.classList.remove('active');
    }

    showModal(title, message, type = 'info', showCancel = false) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');

        if (modal && modalTitle && modalMessage && modalConfirm && modalCancel) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modalConfirm.className = `btn-${type === 'error' ? 'secondary' : 'primary'}`;
            modalCancel.style.display = showCancel ? 'inline-block' : 'none';
            modal.classList.add('active');
            this.playSound(type);
        }
    }

    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) modal.classList.remove('active');
    }

    showCommentsModal(questionId) {
        const commentsModal = document.getElementById('comments-modal');
        if (commentsModal) {
            commentsModal.classList.add('active');
            if (window.commentsManager) window.commentsManager.loadComments(questionId);
        }
    }

    hideCommentsModal() {
        const commentsModal = document.getElementById('comments-modal');
        if (commentsModal) commentsModal.classList.remove('active');
    }

    updateProfessorMessage() {
          const messages = [
            'Olá! Pronto para aprender hoje?',
            'Vamos testar seus conhecimentos!',
            'Aprender nunca foi tão legal!',
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
    "Continue estudando! Você está quase lá!",
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
        const msg = messages[Math.floor(Math.random() * messages.length)];
        const el = document.getElementById('professorMessage');
        if (el && el.parentElement) {
            el.textContent = msg;
            el.parentElement.classList.add('slide-up');
            setTimeout(() => el.parentElement.classList.remove('slide-up'), 500);
        }
    }

    async loadCategories() {
        const categorySelect = document.getElementById('categorySelect');
        if (!categorySelect) return;

        try {
            const categories = await window.databaseManager.getCategories();
            categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
            const randomOption = document.createElement('option');
            randomOption.value = 'random';
            randomOption.textContent = 'Aleatórias';
            categorySelect.appendChild(randomOption);

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
      
         const seSelectButton = document.getElementById('seSelectButton');

        
        const categorySelect = document.getElementById('categorySelect');
        const subcategorySelect = document.getElementById('subcategorySelect');
        const questionTypeRadios = document.querySelectorAll('input[name="questionType"]');
 if ( seSelectButton.textContent == 0) {
                     this.showModal('Atenção','Seleciona a quantidade de questões para este simulado.');

          return
         } 

        if (!categorySelect || !questionTypeRadios.length) return;

        const selectedCategory = categorySelect.value;
        const selectedSubcategory = subcategorySelect ? subcategorySelect.value : '';
        let selectedType = '';

        questionTypeRadios.forEach(radio => {
            if (radio.checked) selectedType = radio.value;
        });

        if (!selectedCategory) {
            this.showModal('Atenção', 'Por favor, selecione uma categoria.');
            return;
        }

        try {
            this.showLoading();
            if (window.gameLogic) {
                await window.gameLogic.startQuiz(selectedCategory, selectedType, selectedSubcategory);
                this.showScreen('game-screen');
            }
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('Error starting quiz:', error);
            this.showModal('Ops', 'Aqui ainda não tem questões cadastradas, selecione outro filtro!');
        }
    }

    exitGame() {
        this.showModal('Atenção', 'Tem certeza que deseja sair? Seu progresso será perdido.', 'warning', true);
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');

        if (modalConfirm && modalCancel) {
            const confirmHandler = () => {
                this.hideModal();
                this.showScreen('main-menu-screen');
                if (window.gameLogic) window.gameLogic.resetGame();
            };
            const cancelHandler = () => this.hideModal();

            modalConfirm.addEventListener('click', confirmHandler, { once: true });
            modalCancel.addEventListener('click', cancelHandler, { once: true });
        }
    }

    reviewQuestions() {
        this.showModal('Em Desenvolvimento', 'Funcionalidade de revisão em desenvolvimento.');
    }

    playSound(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.value = {
                success: 800,
                error: 300,
                warning: 600
            }[type] || 500;

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.log('Audio not available');
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
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
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
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
