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
     
    
   resetCategoryFilters()


    console.log(`Showing screen: ${screenId}`);

    // Se for index.html, força scroll para o topo
    const paginaAtual = window.location.pathname.split("/").pop();
    if (paginaAtual === "index.html" || paginaAtual === "") {
        if (typeof this.forceScrollToTop === "function") {
            this.forceScrollToTop();
            setTimeout(() => this.forceScrollToTop(), 100);
        }
    }

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

setTimeout(() => {
 

    this.updateChatButtonVisibility(screenId);
}, 100);



}


forceScrollToTop() {
    document.querySelector('.social-feed-container').scrollTop = 0;
    document.querySelector('.menu-content').scrollTop = 0;
    document.getElementById("quiz-setup-screen").scrollTop = 0;
   document.getElementById("profile-screen").scrollTop = 0;
   document.getElementById("direito").scrollTop = 0;
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
                confirmButton.textContent = 'Confirmar';
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
        const categorySearchInput = document.getElementById('categorySearchInput');
        const categoryDropdown = document.getElementById('categoryDropdown');
        const categorySelect = document.getElementById('categorySelect');
        
        if (!categorySearchInput || !categoryDropdown || !categorySelect) return;

        try {
            const categories = await window.databaseManager.getCategories();
            
            // Clear existing options
            categoryDropdown.innerHTML = '';
            categorySearchInput.placeholder = 'Digite para pesquisar categoria...';

            // Store categories data for search
            this.categoriesData = {};

            // Add 'Random' option
            const randomItem = document.createElement('div');
            randomItem.className = 'dropdown-item';
            randomItem.setAttribute('data-value', 'random');
            randomItem.textContent = '🎲 Resolver Questões Aleatórias';
            categoryDropdown.appendChild(randomItem);
            this.categoriesData['random'] = '🎲 Resolver Questões Aleatórias';

            // Sort categories alphabetically
            const sortedCategories = Object.entries(categories || {}).sort(([,a], [,b]) => a.name.localeCompare(b.name));

            // Add sorted categories to the dropdown
            sortedCategories.forEach(([id, category]) => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.setAttribute('data-value', id);
                item.textContent = category.name;
                categoryDropdown.appendChild(item);
                this.categoriesData[id] = category.name;
            });

            // Setup search functionality
            this.setupCategorySearch();

        } catch (error) {
            console.error('Error loading categories:', error);
            categoryDropdown.innerHTML = '<div class="dropdown-item no-results">Erro ao carregar categorias</div>';
        }
    }

    setupCategorySearch() {
        
        const categorySearchInput = document.getElementById('categorySearchInput');
        const categoryDropdown = document.getElementById('categoryDropdown');
        const categorySelect = document.getElementById('categorySelect');
        
        if (!categorySearchInput || !categoryDropdown || !categorySelect) return;

        // Handle input click to show dropdown
        categorySearchInput.addEventListener('click', () => {
            categorySearchInput.removeAttribute('readonly');
            categorySearchInput.classList.add('active');
            categoryDropdown.classList.add('show');
            categorySearchInput.focus();
        });

        // Handle input changes for search
        categorySearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            this.filterCategoryDropdown(searchTerm);
        });

        // Handle dropdown item clicks
        categoryDropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item') && !e.target.classList.contains('no-results')) {
                const value = e.target.getAttribute('data-value');
                const text = e.target.textContent;
                
                categorySearchInput.value = text;
                categorySelect.value = value;
                categoryDropdown.classList.remove('show');
                categorySearchInput.setAttribute('readonly', 'true');
                categorySearchInput.classList.remove('active');
                
                // Trigger category change
                this.onCategoryChange();
            }
        });




        
        // Handle clicks outside to close dropdown
        document.addEventListener('click', (e) => {
            if (!categorySearchInput.contains(e.target) && !categoryDropdown.contains(e.target)) {
                categoryDropdown.classList.remove('show');
                categorySearchInput.setAttribute('readonly', 'true');
                categorySearchInput.classList.remove('active');
            }
        });
    }

    filterCategoryDropdown(searchTerm) {
   let subcategorySection = document.getElementById("subcategorySection");
   subcategorySection.style.display = "none";
        const categoryDropdown = document.getElementById('categoryDropdown');
        const items = categoryDropdown.querySelectorAll('.dropdown-item');
        let hasVisibleItems = false;

        items.forEach(item => {
            if (item.classList.contains('no-results')) {
                item.remove();
                return;
            }

            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = 'block';
                hasVisibleItems = true;
            } else {
                item.style.display = 'none';
            }
        });

        // Show "no results" message if no items match
        if (!hasVisibleItems && searchTerm.length > 0) {
            const noResultsItem = document.createElement('div');
            noResultsItem.className = 'dropdown-item no-results';
            noResultsItem.textContent = 'Nenhuma categoria encontrada';
            categoryDropdown.appendChild(noResultsItem);
        }
    }

    async onCategoryChange() {
       
        const categorySelect = document.getElementById('categorySelect');
        const subcategorySection = document.getElementById('subcategorySection');
        const subcategorySearchInput = document.getElementById('subcategorySearchInput');
        const subcategoryDropdown = document.getElementById('subcategoryDropdown');
        const subcategorySelect = document.getElementById('subcategorySelect');

        if (!categorySelect || !subcategorySection || !subcategorySearchInput || !subcategoryDropdown || !subcategorySelect) return;

        const selectedCategory = categorySelect.value;

        if (!selectedCategory || selectedCategory === 'random') {
            subcategorySection.style.display = 'none';
            subcategorySearchInput.value = '';
            subcategorySelect.value = '';
            subcategoryDropdown.innerHTML = '<div class="dropdown-item" data-value="">Selecione uma subcategoria (opcional)</div>';
            return;
        }

        try {
            const subcategories = await window.databaseManager.getSubcategories(selectedCategory);
            
            // Clear existing options
            subcategoryDropdown.innerHTML = '';
            subcategorySearchInput.value = '';
            subcategorySelect.value = '';
            subcategorySearchInput.placeholder = 'Digite para pesquisar subcategoria...';

            // Store subcategories data for search
            this.subcategoriesData = {};

            // Add default option
            const defaultItem = document.createElement('div');
            defaultItem.className = 'dropdown-item';
            defaultItem.setAttribute('data-value', '');
            defaultItem.textContent = 'Todas as subcategorias';
            subcategoryDropdown.appendChild(defaultItem);
            this.subcategoriesData[''] = 'Todas as subcategorias';

            if (subcategories && Object.keys(subcategories).length > 0) {
                // Sort subcategories alphabetically
                const sortedSubcategories = Object.entries(subcategories).sort(([,a], [,b]) => a.name.localeCompare(b.name));

                // Add sorted subcategories to the dropdown
                sortedSubcategories.forEach(([id, subcategory]) => {
                    const item = document.createElement('div');
                    item.className = 'dropdown-item';
                    item.setAttribute('data-value', id);
                    item.textContent = subcategory.name;
                    subcategoryDropdown.appendChild(item);
                    this.subcategoriesData[id] = subcategory.name;
                });

                // Setup search functionality for subcategories
                this.setupSubcategorySearch();

                subcategorySection.style.display = 'block';
            } else {
                subcategorySection.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading subcategories:', error);
            subcategorySection.style.display = 'none';
        }
    }

    setupSubcategorySearch() {
        const subcategorySearchInput = document.getElementById('subcategorySearchInput');
        const subcategoryDropdown = document.getElementById('subcategoryDropdown');
        const subcategorySelect = document.getElementById('subcategorySelect');
        
        if (!subcategorySearchInput || !subcategoryDropdown || !subcategorySelect) return;

        // Remove existing event listeners to prevent duplicates
        const newSubcategorySearchInput = subcategorySearchInput.cloneNode(true);
        subcategorySearchInput.parentNode.replaceChild(newSubcategorySearchInput, subcategorySearchInput);
        
        const newSubcategoryDropdown = subcategoryDropdown.cloneNode(true);
        subcategoryDropdown.parentNode.replaceChild(newSubcategoryDropdown, subcategoryDropdown);

        // Handle input click to show dropdown
        newSubcategorySearchInput.addEventListener('click', () => {
            newSubcategorySearchInput.removeAttribute('readonly');
            newSubcategorySearchInput.classList.add('active');
            newSubcategoryDropdown.classList.add('show');
            newSubcategorySearchInput.focus();
        });

        // Handle input changes for search
        newSubcategorySearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            this.filterSubcategoryDropdown(searchTerm);
        });

        // Handle dropdown item clicks
        newSubcategoryDropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item') && !e.target.classList.contains('no-results')) {
                const value = e.target.getAttribute('data-value');
                const text = e.target.textContent;
                
                newSubcategorySearchInput.value = text;
                subcategorySelect.value = value;
                newSubcategoryDropdown.classList.remove('show');
                newSubcategorySearchInput.setAttribute('readonly', 'true');
                newSubcategorySearchInput.classList.remove('active');
            }
        });

        // Handle clicks outside to close dropdown
        document.addEventListener('click', (e) => {
            if (!newSubcategorySearchInput.contains(e.target) && !newSubcategoryDropdown.contains(e.target)) {
                newSubcategoryDropdown.classList.remove('show');
                newSubcategorySearchInput.setAttribute('readonly', 'true');
                newSubcategorySearchInput.classList.remove('active');
            }
        });
    }

    filterSubcategoryDropdown(searchTerm) {
        const subcategoryDropdown = document.getElementById('subcategoryDropdown');
        const items = subcategoryDropdown.querySelectorAll('.dropdown-item');
        let hasVisibleItems = false;

        items.forEach(item => {
            if (item.classList.contains('no-results')) {
                item.remove();
                return;
            }

            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = 'block';
                hasVisibleItems = true;
            } else {
                item.style.display = 'none';
            }
        });

        // Show "no results" message if no items match
        if (!hasVisibleItems && searchTerm.length > 0) {
            const noResultsItem = document.createElement('div');
            noResultsItem.className = 'dropdown-item no-results';
            noResultsItem.textContent = 'Nenhuma subcategoria encontrada';
            subcategoryDropdown.appendChild(noResultsItem);
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


    //correto
    exitGame() {
  

        this.showModal(
            'Sair do simulado',
            'Tem certeza que deseja sair? Seu progresso será perdido.',
            'Problema',
            true,
            () => {


    
    
    this.showScreen('main-menu-screen');
               
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
summaryText.textContent = `Você errou ${questions.length} ${questions.length > 1 ? 'questões' : 'questão'} no último simulado:`;
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
    const backToHomeButton = document.getElementById('backinicio');

    if (backToHomeButton) {
        backToHomeButton.addEventListener('click', function(event) {
            event.preventDefault(); 

            // Verifica se o game-screen está ativo
            const gameScreen = document.getElementById('game-screen');
            const isGameActive = gameScreen && gameScreen.classList.contains('active');

            if (isGameActive) {
                // Se estiver ativo, dispara o clique no botão "Sair" do jogo
                const exitGameBtn = document.getElementById('exitGameBtn');
                if (exitGameBtn) {
                    exitGameBtn.click();
                } else {
                    console.error('Botão de sair do jogo não encontrado.');
                }
            } else {
                // Se não estiver no jogo, volta para o menu principal normalmente
                if (window.uiManager) {
                    window.uiManager.showScreen('main-menu-screen');
                } else {
                    console.error('UIManager não encontrado. Não foi possível voltar para a tela inicial.');
                }
            }
        });
    }
});


// Inicializa o UI Manager globalmente
window.uiManager = new UIManager();



function resetCategoryFilters() {
    const categorySearchInput = document.getElementById('categorySearchInput');
    const categoryDropdown = document.getElementById('categoryDropdown');
    const categorySelect = document.getElementById('categorySelect');

    const subcategorySearchInput = document.getElementById('subcategorySearchInput');
    const subcategoryDropdown = document.getElementById('subcategoryDropdown');
    const subcategorySelect = document.getElementById('subcategorySelect');
    const subcategorySection = document.getElementById('subcategorySection');

    // Reset Categoria
    if (categorySearchInput) {
        categorySearchInput.value = '';
        categorySearchInput.setAttribute('readonly', 'true');
        categorySearchInput.classList.remove('active');
    }
    if (categoryDropdown) {
        categoryDropdown.classList.remove('show');
        // Opcional: recarregar as categorias para restaurar o estado inicial do dropdown
        // this.loadCategories(); // Se você estiver dentro da classe UIManager
    }
    if (categorySelect) {
        categorySelect.value = ''; // Limpa o valor do input hidden
    }

    // Reset Subcategoria
    if (subcategorySearchInput) {
        subcategorySearchInput.value = '';
        subcategorySearchInput.setAttribute('readonly', 'true');
        subcategorySearchInput.classList.remove('active');
    }
    if (subcategoryDropdown) {
        subcategoryDropdown.classList.remove('show');
        // Opcional: limpar as opções do dropdown de subcategoria
        subcategoryDropdown.innerHTML = '<div class="dropdown-item" data-value="">Selecione uma subcategoria (opcional)</div>';
    }
    if (subcategorySelect) {
        subcategorySelect.value = ''; // Limpa o valor do input hidden
    }
    if (subcategorySection) {
        subcategorySection.style.display = 'none'; // Esconde a seção de subcategoria
    }

    // Se você estiver usando a classe UIManager, pode querer chamar onCategoryChange para redefinir o estado da subcategoria
    // if (window.uiManager) {
    //     window.uiManager.onCategoryChange();
    // }
}
