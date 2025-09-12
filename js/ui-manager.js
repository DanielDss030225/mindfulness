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

        // Espera o Firebase verificar o status do login
        firebase.auth().onAuthStateChanged(user => {
            this.hideLoading();
            if (user) {
                this.showScreen('main-menu-screen');
            } else {
                this.showScreen('login-screen');
            }
        });
    }

    setupEventListeners() {
        const startQuizBtn = document.getElementById('startQuizBtn');
        const profileBtn = document.getElementById('profileBtn');
        const adminBtn = document.getElementById('adminBtn');

        if (startQuizBtn) startQuizBtn.addEventListener('click', () => this.showScreen('quiz-setup-screen'));
        if (profileBtn) profileBtn.addEventListener('click', () => this.showScreen('profile-screen'));
        if (adminBtn) adminBtn.addEventListener('click', () => this.showScreen('admin-screen'));

        const backButtons = [
            ['backToMenuBtn', 'main-menu-screen'],
            ['backToMenuFromProfileBtn', 'main-menu-screen'],
            ['backToMenuFromAdminBtn', 'main-menu-screen'],
            ['backToMenuFromResultBtn', 'main-menu-screen'],
            ['backToProfileFromCorrectBtn', 'profile-screen'],
            ['backToProfileFromWrongBtn', 'profile-screen'],
            ['backToResultFromReviewBtn', 'result-screen'],
            ['backToResultFromReviewActionsBtn', 'result-screen']
        ];
        backButtons.forEach(([id, screen]) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => this.showScreen(screen));
        });

        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) startGameBtn.addEventListener('click', () => this.startQuiz());

        const exitGameBtn = document.getElementById('exitGameBtn');
        if (exitGameBtn) exitGameBtn.addEventListener('click', () => this.exitGame());

        const newQuizBtn = document.getElementById('newQuizBtn');
        const newQuizFromProfileBtn = document.getElementById('newQuizFromProfileBtn');
        const reviewQuestionsBtn = document.getElementById('reviewQuestionsBtn');
        const startIncorrectReviewQuizBtn = document.getElementById('startIncorrectReviewQuizBtn');

        if (newQuizBtn) newQuizBtn.addEventListener('click', () => this.showScreen('quiz-setup-screen'));
        if (newQuizFromProfileBtn) newQuizFromProfileBtn.addEventListener('click', () => this.showScreen('quiz-setup-screen'));
        if (reviewQuestionsBtn) reviewQuestionsBtn.addEventListener('click', () => this.reviewQuestions());
        if (startIncorrectReviewQuizBtn) startIncorrectReviewQuizBtn.addEventListener('click', () => this.startIncorrectReviewQuiz());
   
   
   
    }

    setupModalHandlers() {
        const modal = document.getElementById('modal');
        const commentsModal = document.getElementById('comments-modal');
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => btn.addEventListener('click', () => this.hideModal()));

        if (modal) modal.addEventListener('click', e => { if (e.target === modal) this.hideModal(); });
        if (commentsModal) commentsModal.addEventListener('click', e => { if (e.target === commentsModal) this.hideCommentsModal(); });
    }

    showScreen(screenId) {
        console.log(`Showing screen: ${screenId}`);

        // Volta para o topo ao trocar de tela
 this.forceScrollToTop();

    setTimeout(() => this.forceScrollToTop(), 100);


        // Esconde todas as telas
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });

        // Exibe a nova tela
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.style.display = 'flex';
            targetScreen.classList.add('active');
            this.currentScreen = screenId;

            // Animação
            targetScreen.classList.add('fade-in');
            setTimeout(() => targetScreen.classList.remove('fade-in'), 500);

            this.onScreenShown(screenId);
        } else {
            console.error(`Screen with ID '${screenId}' not found`);
        }
            this.updateChatButtonVisibility(screenId);

    }

fundoQuestoes
forceScrollToTop() {
    document.querySelector('.social-feed-container').scrollTop = 0;
    document.querySelector('.menu-content').scrollTop = 0;
    document.getElementById("quiz-setup-screen").scrollTop = 0;
        document.getElementById("profile-screen").scrollTop = 0;

    document.querySelector('.fundoQuestoes').scrollTop = 0;

    // Força rolagem em todos os elementos possíveis
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Força rolagem em elementos com overflow
    const scrollableElements = document.querySelectorAll('[style*="overflow"]');
    scrollableElements.forEach(el => {
        el.scrollTop = 0;
    });


}





    onScreenShown(screenId) {
        switch (screenId) {
            case 'main-menu-screen': this.updateProfessorMessage(); break;
            case 'quiz-setup-screen': this.loadCategories(); break;
            case 'profile-screen':
                if (window.profileManager) window.profileManager.loadUserStats();
                break;
            case 'admin-screen':
                if (window.adminManager) window.adminManager.loadCategories();
                break;
            case 'review-correct-screen':
                if (window.profileManager) window.profileManager.loadReviewScreen('correct');
                break;
            case 'review-wrong-screen':
                if (window.profileManager) window.profileManager.loadReviewScreen('wrong');
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

    showModal(title, message, type = 'info', showConfirmButton = true, onConfirmCallback = null, onCancelCallback = null) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalFooter = document.querySelector('#modal .modal-footer');

        if (modal && modalTitle && modalMessage && modalFooter) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modalFooter.innerHTML = '';

            if (showConfirmButton) {
                const confirmButton = document.createElement('button');
                confirmButton.id = 'modalConfirm';
                confirmButton.className = `btn-${type === 'error' ? 'secondary' : 'primary'}`;
                confirmButton.textContent = 'OK';
                confirmButton.addEventListener('click', () => {
                    this.hideModal();
                    if (onConfirmCallback) onConfirmCallback();
                });
                modalFooter.appendChild(confirmButton);
            }

            if (onCancelCallback || (type === 'warning' && showConfirmButton)) {
                const cancelButton = document.createElement('button');
                cancelButton.id = 'modalCancel';
                cancelButton.className = 'btn-secondary3';
                cancelButton.textContent = 'Cancelar';
                cancelButton.addEventListener('click', () => {
                    this.hideModal();
                    if (onCancelCallback) onCancelCallback();
                });
                modalFooter.appendChild(cancelButton);
            }

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
            'Que tal um simulado desafiador?',
            'Aprender nunca foi tão divertido!',
            'Cada questão é uma oportunidade de crescer!',
            'Vamos descobrir o que você já sabe!',
            'O conhecimento é o melhor investimento!',
            'Hoje é um ótimo dia para aprender algo novo!'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const professorMessage = document.getElementById('professorMessage');

        if (professorMessage) {
            professorMessage.textContent = randomMessage;
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
            
            // Clear existing options
            categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';

            // Add 'Random' option
            const randomOption = document.createElement('option');
            randomOption.value = 'random';
            randomOption.textContent = 'Aleatórias';
            categorySelect.appendChild(randomOption);

            // Sort categories alphabetically
            const sortedCategories = Object.entries(categories || {}).sort(([,a], [,b]) => a.name.localeCompare(b.name));

            // Add sorted categories to the select
            sortedCategories.forEach(([id, category]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });

            // Initialize Choices.js for search functionality
            if (this.categoryChoices) {
                this.categoryChoices.destroy();
            }
                this.categoryChoices = new Choices(categorySelect, {
                    searchEnabled: true,
                    itemSelectText: 'Pressione para selecionar',
                    noResultsText: 'Digite o nome corretamente',
                    shouldSort: false,
                    shouldSortItems: false,
                    position: 'bottom',
                });

            categorySelect.addEventListener('change', () => this.onCategoryChange());
        } catch (error) {
            console.error('Error loading categories:', error);
            categorySelect.innerHTML = '<option value="">Erro ao carregar categorias</option>';
        }
    }

    async onCategoryChange() {
        const categorySelect = document.getElementById('categorySelect');
        const subcategorySection = document.getElementById('subcategorySection');
        const subcategorySelect = document.getElementById('subcategorySelect');

        if (!categorySelect || !subcategorySection || !subcategorySelect) return;

        const selectedCategory = categorySelect.value;

        if (!selectedCategory || selectedCategory === 'random') {
            subcategorySection.style.display = 'none';
            subcategorySelect.innerHTML = '<option value="">Selecione uma subcategoria (opcional)</option>';
            if (this.subcategoryChoices) {
                this.subcategoryChoices.destroy();
                this.subcategoryChoices = null;
            }
            return;
        }

        try {
            const subcategories = await window.databaseManager.getSubcategories(selectedCategory);
            
            // Clear existing options and destroy previous Choices instance
            if (this.subcategoryChoices) {
                this.subcategoryChoices.destroy();
            }
            subcategorySelect.innerHTML = '<option value="">Todas as subcategorias</option>';

            if (subcategories && Object.keys(subcategories).length > 0) {
                // Sort subcategories alphabetically
                const sortedSubcategories = Object.entries(subcategories).sort(([,a], [,b]) => a.name.localeCompare(b.name));

                // Add sorted subcategories to the select
                sortedSubcategories.forEach(([id, subcategory]) => {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = subcategory.name;
                    subcategorySelect.appendChild(option);
                });

                // Initialize Choices.js for search functionality
                this.subcategoryChoices = new Choices(subcategorySelect, {
                    searchEnabled: true,
                    itemSelectText: 'Pressione para selecionar',
                    noResultsText: 'Digite o nome corretamente',
                    shouldSort: false,
                    shouldSortItems: false,
                    position: 'bottom',
                });

                subcategorySection.style.display = 'block';
            } else {
                subcategorySection.style.display = 'none';
                this.subcategoryChoices = null; // No subcategories, no Choices instance
            }
        } catch (error) {
            console.error('Error loading subcategories:', error);
            subcategorySection.style.display = 'none';
        }
    }

    async startQuiz() {
        const categorySelect = document.getElementById('categorySelect');
        const subcategorySelect = document.getElementById('subcategorySelect');
        const questionTypeRadios = document.querySelectorAll('input[name="questionType"]');

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

        this.showModal(
            'Sair do simulado',
            'Tem certeza que deseja sair? Seu progresso será perdido.',
            'Problema',
            true,
            () => {
    document.getElementById("explanationContainer").style.display = "none";

                this.showScreen('main-menu-screen');
                if (window.gameLogic) window.gameLogic.resetGame();
            }
        );
    }

    reviewQuestions() {
        const incorrectQuestions = window.gameLogic.getQuestionsForReview();
        if (incorrectQuestions.length > 0) {
            this.displayReviewQuestions(incorrectQuestions);
        } else {
            this.showModal('Revisar Questões', 'Parabéns! Você não errou nenhuma questão no último simulado.');
        }
    }

    displayReviewQuestions(questions) {
        // Navigate to the review screen
        this.showScreen('review-incorrect-screen');
        
        // Update summary text
        const summaryText = document.getElementById('incorrectSummaryText');
        if (summaryText) {
            summaryText.textContent = `Você errou ${questions.length} questão${questions.length > 1 ? 'ões' : ''} no último simulado:`;
        }
        
        // Populate questions container
        const container = document.getElementById('incorrectQuestionsContainer');
        if (container) {
            container.innerHTML = '';
            
            if (questions.length === 0) {
                container.innerHTML = `
                    <div class="no-incorrect-questions">
                        <span class="celebration-icon">🎉</span>
                        <h3>Parabéns!</h3>
                        <p>Você não errou nenhuma questão no último simulado. Continue assim!</p>
                    </div>
                `;
                return;
            }
            
            questions.forEach((question, index) => {
                const questionElement = this.createReviewQuestionElement(question, index + 1);
                container.appendChild(questionElement);
            });
        }
    }

    createReviewQuestionElement(question, questionNumber) {
        const div = document.createElement('div');
        div.className = 'review-question-item';
        
        const userAnswer = question.userAnswer;
        const userSelectedIndex = userAnswer ? userAnswer.selectedAnswer : -1;
        const correctIndex = question.correctAnswer;
        
        // Create alternatives HTML
        let alternativesHTML = '';
        question.alternatives.forEach((alternative, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D, E
            let classes = 'review-alternative';
            
            if (index === userSelectedIndex) {
                classes += ' user-selected';
            }
            if (index === correctIndex) {
                classes += ' correct-answer';
            }
            
            alternativesHTML += `
                <div class="${classes}">
                    <div class="review-alternative-letter">${letter}</div>
                    <div class="review-alternative-text">${alternative}</div>
                </div>
            `;
        });
        
        // Create answer indicators
        const userAnswerLetter = userSelectedIndex >= 0 ? String.fromCharCode(65 + userSelectedIndex) : 'N/A';
        const correctAnswerLetter = String.fromCharCode(65 + correctIndex);
        
        div.innerHTML = `
            <div class="review-question-header">
                <div class="review-question-number">Questão ${questionNumber}</div>
                <div class="review-question-status">Incorreta</div>
            </div>
            
            <div class="review-question-text">
                ${this.formatQuestionText(question.text)}
            </div>
            
            <div class="review-answer-indicators">
                <div class="review-indicator user-answer">
                    <span class="review-indicator-icon">❌</span>
                    Sua resposta: ${userAnswerLetter}
                </div>
                <div class="review-indicator correct-answer">
                    <span class="review-indicator-icon">✅</span>
                    Resposta correta: ${correctAnswerLetter}
                </div>
            </div>
            
            <div class="review-alternatives">
                ${alternativesHTML}
            </div>
            
            ${question.comment ? `
                <div class="review-explanation">
                    <h4>Explicação:</h4>
                    <p>${question.comment}</p>
                </div>
            ` : ''}
        `;
        
        return div;
    }

    formatQuestionText(text) {
        // Support for bold text and basic formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/\n/g, "<br>");
    }

    async startQuizWithReviewQuestions(questions) {
        try {
            this.showLoading();
            if (window.gameLogic) {
                // Assuming gameLogic can accept a pre-defined list of questions
                // This might require a modification to gameLogic.startQuiz or a new method
                window.gameLogic.questions = questions.map(q => ({ ...q, id: q.id })); // Ensure questions are in the expected format
                window.gameLogic.currentQuestionIndex = 0;
                window.gameLogic.score = 0;
                window.gameLogic.userAnswers = [];
                window.gameLogic.quizStartTime = Date.now();
                window.gameLogic.loadCurrentQuestion();
                this.showScreen('game-screen');
            }
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('Error starting review quiz:', error);
            this.showModal('Erro', 'Erro ao iniciar o simulado de revisão. Tente novamente.');
        }
    }

    async startIncorrectReviewQuiz() {
        const incorrectQuestions = window.gameLogic.getQuestionsForReview();
        if (incorrectQuestions.length === 0) {
            this.showModal('Atenção', 'Não há questões incorretas para revisar.');
            return;
        }
        
        try {
            this.showLoading();
            if (window.gameLogic) {
                // Reset game state and set up with incorrect questions
                window.gameLogic.resetGame();
                window.gameLogic.questions = incorrectQuestions.map(q => ({ 
                    ...q, 
                    id: q.id || `review_${Date.now()}_${Math.random()}` 
                }));
                window.gameLogic.currentQuestionIndex = 0;
                window.gameLogic.score = 0;
                window.gameLogic.userAnswers = [];
                window.gameLogic.quizStartTime = Date.now();
                
                // Set up a mock quiz object for tracking
                window.gameLogic.currentQuiz = {
                    category: 'review',
                    type: 'incorrect',
                    subcategory: '',
                    startTime: Date.now(),
                    userId: window.authManager.getCurrentUser()?.uid
                };
                
                // Load first question
                window.gameLogic.loadCurrentQuestion();
                this.showScreen('game-screen');
            }
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('Error starting incorrect review quiz:', error);
            this.showModal('Erro', 'Erro ao iniciar o simulado de revisão. Tente novamente.');
        }
    }

    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            let frequency = 500;
            if (type === 'success') frequency = 800;
            else if (type === 'error') frequency = 300;
            else if (type === 'warning') frequency = 600;

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
        `;

        document.body.appendChild(notification);

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



updateChatButtonVisibility(screenId) {
    const chatButton = document.querySelector('.chat-toggle-btn');
    if (chatButton) {
        if (screenId === 'main-menu-screen') {
            chatButton.style.display = 'block';
        } else {
            chatButton.style.display = 'none';
        }
    }
}




}
document.addEventListener('DOMContentLoaded', function() {
    // Encontra o elemento pelo ID
    const backToHomeButton = document.getElementById('backinicio');

    // Verifica se o botão existe na página
    if (backToHomeButton) {
        // Adiciona um evento de clique
        backToHomeButton.addEventListener('click', function(event) {
            // Previne o comportamento padrão do link <a>
            event.preventDefault(); 
            
            // Verifica se o uiManager está disponível e chama a função para mostrar a tela principal
            if (window.uiManager) {
                window.uiManager.showScreen('main-menu-screen');
            } else {
                console.error('UIManager não encontrado. Não foi possível voltar para a tela inicial.');
            }
        });
    }
});

// Inicializa o UI Manager globalmente
window.uiManager = new UIManager();


