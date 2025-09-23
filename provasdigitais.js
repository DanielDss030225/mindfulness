// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD0fEAS-uL8tklmBNzLMrBHZ3Hh5cK21mM",
    authDomain: "orange-fast.firebaseapp.com",
    databaseURL: "https://orange-fast-default-rtdb.firebaseio.com",
    projectId: "orange-fast",
    storageBucket: "orange-fast.appspot.com",
    messagingSenderId: "816303515640",
    appId: "1:816303515640:web:fb1356d7b9e6cd60d3580d",
    measurementId: "G-5M2Z7DSHM0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Digital Exams System
class DigitalExamsSystem {
    constructor() {
        this.currentUser = null;
        this.currentExam = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.examStartTime = null;
        this.timerInterval = null;
        this.isAdmin = false;
        this.categories = {};
        this.subcategories = {};
        this.exams = {};
        this.currentExamQuestions = [];
        
        this.init();
    }

    async init() {
        try {
            this.showScreen('loading-screen');
            
            // For testing purposes, simulate a logged user
            // In production, this would use real Firebase auth
            this.currentUser = {
                uid: 'test-user-123',
                email: 'danielintheend@gmail.com',
                displayName: 'Administrador Teste'
            };
            this.isAdmin = this.currentUser.email === 'danielintheend@gmail.com';
            
            await this.loadUserData();
            this.setupEventListeners();
            this.showScreen('main-menu-screen');
            
        } catch (error) {
            console.error('Error initializing system:', error);
            this.showModal('Erro', 'Erro ao inicializar o sistema. Recarregue a página.');
        }
    }

    async loadUserData() {
        try {
            // For testing purposes, use mock data
            // In production, this would load from Firebase
            this.categories = {
                'cat1': { name: 'Direito Constitucional' },
                'cat2': { name: 'Direito Administrativo' },
                'cat3': { name: 'Português' },
                'cat4': { name: 'Matemática' }
            };
            
            this.exams = {
                'exam1': {
                    title: 'Concurso Polícia Civil - 2023',
                    type: 'concurso',
                    category: 'cat1',
                    banca: 'CESPE',
                    year: 2023,
                    description: 'Prova de Direito Constitucional para Polícia Civil',
                    stats: { usersCompleted: 150, averageRating: 4 },
                    questions: {
                        'q1': {
                            text: 'Qual é o princípio fundamental da Constituição Federal?',
                            alternatives: [
                                'Dignidade da pessoa humana',
                                'Soberania popular',
                                'Separação dos poderes',
                                'Federalismo',
                                'República'
                            ],
                            correctAnswer: 0,
                            comment: 'A dignidade da pessoa humana é um dos fundamentos da República Federativa do Brasil.'
                        }
                    }
                },
                'exam2': {
                    title: 'Simulado Português Básico',
                    type: 'simulado',
                    category: 'cat3',
                    description: 'Simulado básico de Língua Portuguesa',
                    stats: { usersCompleted: 89, averageRating: 3 },
                    questions: {
                        'q1': {
                            text: 'Qual é a classe gramatical da palavra "rapidamente"?',
                            alternatives: [
                                'Adjetivo',
                                'Advérbio',
                                'Substantivo',
                                'Verbo',
                                'Preposição'
                            ],
                            correctAnswer: 1,
                            comment: 'Rapidamente é um advérbio de modo, pois modifica o verbo indicando como a ação é realizada.'
                        }
                    }
                }
            };
            
            // Update UI
            this.updateUserInfo();
            this.loadCategoriesIntoSelects();
            this.loadExamsList();
            
            // Show admin panel if user is admin
            if (this.isAdmin) {
                document.getElementById('admin-panel').style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.displayName || this.currentUser.email;
        }
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            auth.signOut();
        });

        // Admin actions
        document.getElementById('create-exam-btn')?.addEventListener('click', () => {
            this.showScreen('create-exam-screen');
        });

        document.getElementById('manage-exams-btn')?.addEventListener('click', () => {
            this.showManageExamsModal();
        });

        // Navigation
        document.getElementById('back-to-menu-btn')?.addEventListener('click', () => {
            this.showScreen('main-menu-screen');
        });

        document.getElementById('cancel-create-btn')?.addEventListener('click', () => {
            this.showScreen('main-menu-screen');
        });

        // Create exam form
        document.getElementById('create-exam-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createExam();
        });

        // Exam type change
        document.getElementById('exam-type-create')?.addEventListener('change', (e) => {
            const concursoFields = document.getElementById('concurso-fields');
            if (e.target.value === 'concurso') {
                concursoFields.classList.add('show');
            } else {
                concursoFields.classList.remove('show');
            }
        });

        // Category change for subcategories
        document.getElementById('exam-category-create')?.addEventListener('change', (e) => {
            this.loadSubcategoriesIntoSelect(e.target.value, 'exam-subcategory-create');
        });

        // Add question form
        document.getElementById('add-question-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addQuestionToExam();
        });

        document.getElementById('clear-question-btn')?.addEventListener('click', () => {
            this.clearQuestionForm();
        });

        document.getElementById('finish-exam-btn')?.addEventListener('click', () => {
            this.finishExamCreation();
        });

        // Exam filters
        document.getElementById('exam-type')?.addEventListener('change', () => {
            this.filterExams();
        });

        document.getElementById('exam-category')?.addEventListener('change', () => {
            this.filterExams();
        });

        document.getElementById('exam-banca')?.addEventListener('change', () => {
            this.filterExams();
        });

        document.getElementById('exam-year')?.addEventListener('change', () => {
            this.filterExams();
        });

        // Exam navigation
        document.getElementById('prev-question-btn')?.addEventListener('click', () => {
            this.previousQuestion();
        });

        document.getElementById('next-question-btn')?.addEventListener('click', () => {
            this.nextQuestion();
        });

        document.getElementById('show-answer-btn')?.addEventListener('click', () => {
            this.showScreen('answer-sheet-screen');
        });

        document.getElementById('back-to-exam-btn')?.addEventListener('click', () => {
            this.showScreen('exam-screen');
        });

        document.getElementById('exit-exam-btn')?.addEventListener('click', () => {
            this.exitExam();
        });

        // Results actions
        document.getElementById('review-answers-btn')?.addEventListener('click', () => {
            this.reviewAnswers();
        });

        document.getElementById('new-exam-btn')?.addEventListener('click', () => {
            this.showScreen('main-menu-screen');
        });

        document.getElementById('back-to-menu-final-btn')?.addEventListener('click', () => {
            this.showScreen('main-menu-screen');
        });

        document.getElementById('finish-exam-final-btn')?.addEventListener('click', () => {
            this.finishExam();
        });

        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal();
            });
        });
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    loadCategoriesIntoSelects() {
        const selects = ['exam-category', 'exam-category-create'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                // Clear existing options except first
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }
                
                // Add categories
                Object.entries(this.categories).forEach(([id, category]) => {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            }
        });
    }

    async loadSubcategoriesIntoSelect(categoryId, selectId) {
        const select = document.getElementById(selectId);
        if (!select || !categoryId) return;

        // Clear existing options except first
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        try {
            const subcategoriesSnapshot = await database.ref(`categories/${categoryId}/subcategories`).once('value');
            const subcategories = subcategoriesSnapshot.val() || {};
            
            Object.entries(subcategories).forEach(([id, subcategory]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = subcategory.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading subcategories:', error);
        }
    }

    loadExamsList() {
        const examsList = document.getElementById('exams-list');
        if (!examsList) return;

        examsList.innerHTML = '';

        if (Object.keys(this.exams).length === 0) {
            examsList.innerHTML = '<p class="text-center">Nenhuma prova disponível.</p>';
            return;
        }

        Object.entries(this.exams).forEach(([examId, exam]) => {
            const examCard = this.createExamCard(examId, exam);
            examsList.appendChild(examCard);
        });

        this.loadFiltersOptions();
    }

    createExamCard(examId, exam) {
        const card = document.createElement('div');
        card.className = 'exam-card';
        card.onclick = () => this.startExam(examId);

        const categoryName = this.categories[exam.category]?.name || 'Categoria não encontrada';
        const questionsCount = exam.questions ? Object.keys(exam.questions).length : 0;
        const usersCount = exam.stats?.usersCompleted || 0;
        const rating = exam.stats?.averageRating || 0;

        card.innerHTML = `
            <h4>${exam.title}</h4>
            <div class="exam-meta">
                <span class="exam-tag">${exam.type === 'concurso' ? 'Concurso' : 'Simulado'}</span>
                <span class="exam-tag">${categoryName}</span>
                ${exam.banca ? `<span class="exam-tag">${exam.banca}</span>` : ''}
                ${exam.year ? `<span class="exam-tag">${exam.year}</span>` : ''}
            </div>
            <p>${exam.description || 'Sem descrição'}</p>
            <div class="exam-stats">
                <span>${questionsCount} questões</span>
                <span>${usersCount} usuários</span>
                <span>${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))}</span>
            </div>
        `;

        return card;
    }

    loadFiltersOptions() {
        // Load bancas
        const bancaSelect = document.getElementById('exam-banca');
        const bancas = new Set();
        
        // Load years
        const yearSelect = document.getElementById('exam-year');
        const years = new Set();

        Object.values(this.exams).forEach(exam => {
            if (exam.banca) bancas.add(exam.banca);
            if (exam.year) years.add(exam.year);
        });

        // Clear and populate banca select
        if (bancaSelect) {
            while (bancaSelect.children.length > 1) {
                bancaSelect.removeChild(bancaSelect.lastChild);
            }
            
            Array.from(bancas).sort().forEach(banca => {
                const option = document.createElement('option');
                option.value = banca;
                option.textContent = banca;
                bancaSelect.appendChild(option);
            });
        }

        // Clear and populate year select
        if (yearSelect) {
            while (yearSelect.children.length > 1) {
                yearSelect.removeChild(yearSelect.lastChild);
            }
            
            Array.from(years).sort((a, b) => b - a).forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
        }
    }

    filterExams() {
        const typeFilter = document.getElementById('exam-type').value;
        const categoryFilter = document.getElementById('exam-category').value;
        const bancaFilter = document.getElementById('exam-banca').value;
        const yearFilter = document.getElementById('exam-year').value;

        const examCards = document.querySelectorAll('.exam-card');
        
        examCards.forEach(card => {
            const examId = Object.keys(this.exams).find(id => {
                const exam = this.exams[id];
                return card.querySelector('h4').textContent === exam.title;
            });
            
            if (!examId) return;
            
            const exam = this.exams[examId];
            let show = true;

            if (typeFilter && exam.type !== typeFilter) show = false;
            if (categoryFilter && exam.category !== categoryFilter) show = false;
            if (bancaFilter && exam.banca !== bancaFilter) show = false;
            if (yearFilter && exam.year != yearFilter) show = false;

            card.style.display = show ? 'block' : 'none';
        });
    }

    async createExam() {
        try {
            const title = document.getElementById('exam-title').value;
            const type = document.getElementById('exam-type-create').value;
            const category = document.getElementById('exam-category-create').value;
            const subcategory = document.getElementById('exam-subcategory-create').value;
            const description = document.getElementById('exam-description').value;
            const banca = document.getElementById('exam-banca-create').value;
            const year = document.getElementById('exam-year-create').value;

            if (!title || !type || !category) {
                this.showModal('Erro', 'Preencha todos os campos obrigatórios.');
                return;
            }

            const examData = {
                title,
                type,
                category,
                subcategory: subcategory || null,
                description,
                createdBy: this.currentUser.uid,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                questions: {},
                stats: {
                    usersCompleted: 0,
                    averageRating: 0
                }
            };

            if (type === 'concurso') {
                examData.banca = banca;
                examData.year = parseInt(year);
            }

            // Save exam to database
            const examRef = await database.ref('digitalExams').push(examData);
            this.currentExam = examRef.key;

            // Update local data
            this.exams[examRef.key] = examData;

            // Show add questions screen
            document.getElementById('current-exam-title').textContent = title;
            document.getElementById('questions-count').textContent = '0 questões';
            this.showScreen('add-questions-screen');

            this.showModal('Sucesso', 'Prova criada com sucesso! Agora adicione as questões.');

        } catch (error) {
            console.error('Error creating exam:', error);
            this.showModal('Erro', 'Erro ao criar prova. Tente novamente.');
        }
    }

    async addQuestionToExam() {
        try {
            const questionText = document.getElementById('question-text').value;
            const alternatives = Array.from(document.querySelectorAll('.alternative-text')).map(textarea => textarea.value);
            const correctAnswer = parseInt(document.querySelector('input[name="correct-answer"]:checked').value);
            const comment = document.getElementById('question-comment').value;
            const saveToGeneral = document.getElementById('save-to-general').checked;

            if (!questionText || alternatives.some(alt => !alt.trim())) {
                this.showModal('Erro', 'Preencha o texto da questão e todas as alternativas.');
                return;
            }

            if (correctAnswer === null || correctAnswer === undefined) {
                this.showModal('Erro', 'Selecione a resposta correta.');
                return;
            }

            const questionData = {
                text: questionText,
                alternatives,
                correctAnswer,
                comment: comment || '',
                createdBy: this.currentUser.uid,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };

            // Add to exam
            const questionRef = await database.ref(`digitalExams/${this.currentExam}/questions`).push(questionData);

            // Save to general system if requested
            if (saveToGeneral) {
                const examData = this.exams[this.currentExam];
                const generalQuestionData = {
                    ...questionData,
                    category: examData.category,
                    subcategory: examData.subcategory,
                    type: 'multipla-escolha'
                };
                
                await database.ref('questions').push(generalQuestionData);
            }

            // Update questions count
            const currentCount = Object.keys(this.exams[this.currentExam].questions || {}).length + 1;
            document.getElementById('questions-count').textContent = `${currentCount} questões`;

            // Clear form
            this.clearQuestionForm();

            this.showModal('Sucesso', 'Questão adicionada com sucesso!');

        } catch (error) {
            console.error('Error adding question:', error);
            this.showModal('Erro', 'Erro ao adicionar questão. Tente novamente.');
        }
    }

    clearQuestionForm() {
        document.getElementById('question-text').value = '';
        document.querySelectorAll('.alternative-text').forEach(textarea => textarea.value = '');
        document.querySelectorAll('input[name="correct-answer"]').forEach(radio => radio.checked = false);
        document.getElementById('question-comment').value = '';
        document.getElementById('save-to-general').checked = false;
    }

    async finishExamCreation() {
        try {
            const questionsSnapshot = await database.ref(`digitalExams/${this.currentExam}/questions`).once('value');
            const questions = questionsSnapshot.val() || {};

            if (Object.keys(questions).length === 0) {
                this.showModal('Erro', 'Adicione pelo menos uma questão antes de finalizar a prova.');
                return;
            }

            // Update exam status
            await database.ref(`digitalExams/${this.currentExam}`).update({
                status: 'published',
                publishedAt: firebase.database.ServerValue.TIMESTAMP
            });

            this.showModal('Sucesso', 'Prova finalizada e publicada com sucesso!', () => {
                this.showScreen('main-menu-screen');
                this.loadUserData(); // Reload data
            });

        } catch (error) {
            console.error('Error finishing exam:', error);
            this.showModal('Erro', 'Erro ao finalizar prova. Tente novamente.');
        }
    }

    async startExam(examId) {
        try {
            this.currentExam = examId;
            const exam = this.exams[examId];
            
            // Load exam questions from mock data
            const questionsData = exam.questions || {};
            
            this.currentExamQuestions = Object.entries(questionsData).map(([id, question]) => ({
                id,
                ...question
            }));

            if (this.currentExamQuestions.length === 0) {
                this.showModal('Erro', 'Esta prova não possui questões.');
                return;
            }

            // Initialize exam state
            this.currentQuestionIndex = 0;
            this.userAnswers = {};
            this.examStartTime = Date.now();

            // Update UI
            document.getElementById('exam-title-display').textContent = exam.title;
            document.getElementById('exam-users-count').textContent = `${exam.stats?.usersCompleted || 0} usuários resolveram`;
            
            // Start timer
            this.startTimer();

            // Load first question
            this.loadCurrentQuestion();

            // Show exam screen
            this.showScreen('exam-screen');

        } catch (error) {
            console.error('Error starting exam:', error);
            this.showModal('Erro', 'Erro ao iniciar prova. Tente novamente.');
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.examStartTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            document.getElementById('exam-timer').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    loadCurrentQuestion() {
        if (this.currentQuestionIndex >= this.currentExamQuestions.length) {
            this.finishExam();
            return;
        }

        const question = this.currentExamQuestions[this.currentQuestionIndex];
        
        // Update question display
        document.getElementById('question-number').textContent = `Questão ${this.currentQuestionIndex + 1}`;
        document.getElementById('question-text-display').innerHTML = this.formatQuestionText(question.text);

        // Update alternatives
        const alternativesContainer = document.getElementById('alternatives-container');
        alternativesContainer.innerHTML = '';

        question.alternatives.forEach((alternative, index) => {
            const alternativeElement = this.createAlternativeElement(alternative, index, question.id);
            alternativesContainer.appendChild(alternativeElement);
        });

        // Update progress
        this.updateProgress();

        // Update navigation buttons
        document.getElementById('prev-question-btn').disabled = this.currentQuestionIndex === 0;
        document.getElementById('next-question-btn').textContent = 
            this.currentQuestionIndex === this.currentExamQuestions.length - 1 ? 'Finalizar' : 'Próxima';
    }

    formatQuestionText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/\n/g, "<br>");
    }

    createAlternativeElement(text, index, questionId) {
        const div = document.createElement('div');
        div.className = 'alternative';
        div.dataset.index = index;
        div.dataset.questionId = questionId;
        
        const letter = String.fromCharCode(65 + index);
        
        div.innerHTML = `
            <div class="alternative-letter">${letter}</div>
            <div class="alternative-text">${text}</div>
        `;
        
        // Check if this alternative is already selected
        if (this.userAnswers[questionId] === index) {
            div.classList.add('selected');
        }
        
        div.addEventListener('click', () => this.selectAnswer(questionId, index));
        
        return div;
    }

    selectAnswer(questionId, answerIndex) {
        // Remove previous selection for this question
        document.querySelectorAll(`[data-question-id="${questionId}"]`).forEach(alt => {
            alt.classList.remove('selected');
        });
        
        // Select new answer
        const selectedAlternative = document.querySelector(`[data-question-id="${questionId}"][data-index="${answerIndex}"]`);
        if (selectedAlternative) {
            selectedAlternative.classList.add('selected');
            this.userAnswers[questionId] = answerIndex;
            this.updateProgress();
        }
    }

    updateProgress() {
        const totalQuestions = this.currentExamQuestions.length;
        const answeredQuestions = Object.keys(this.userAnswers).length;
        const progressPercentage = (answeredQuestions / totalQuestions) * 100;
        
        document.getElementById('progress-fill').style.width = `${progressPercentage}%`;
        document.getElementById('progress-text').textContent = `${answeredQuestions} / ${totalQuestions}`;
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.loadCurrentQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentExamQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.loadCurrentQuestion();
        } else {
            this.finishExam();
        }
    }

    exitExam() {
        this.showModal('Sair da Prova', 'Tem certeza que deseja sair? Seu progresso será perdido.', () => {
            this.stopTimer();
            this.showScreen('main-menu-screen');
        }, true);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    async finishExam() {
        try {
            this.stopTimer();
            
            // Calculate results
            const totalQuestions = this.currentExamQuestions.length;
            const answeredQuestions = Object.keys(this.userAnswers).length;
            let correctAnswers = 0;
            
            this.currentExamQuestions.forEach(question => {
                if (this.userAnswers[question.id] === question.correctAnswer) {
                    correctAnswers++;
                }
            });
            
            const wrongAnswers = answeredQuestions - correctAnswers;
            const score = correctAnswers * 10;
            const duration = Date.now() - this.examStartTime;
            
            // Save exam session
            const sessionData = {
                examId: this.currentExam,
                userId: this.currentUser.uid,
                totalQuestions,
                answeredQuestions,
                correctAnswers,
                wrongAnswers,
                score,
                duration,
                answers: this.userAnswers,
                completedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await database.ref('examSessions').push(sessionData);
            
            // Update exam stats
            await this.updateExamStats();
            
            // Update results screen
            this.updateResultsScreen(totalQuestions, answeredQuestions, correctAnswers, wrongAnswers, score, duration);
            
            // Show results screen
            this.showScreen('results-screen');
            
        } catch (error) {
            console.error('Error finishing exam:', error);
            this.showModal('Erro', 'Erro ao finalizar prova. Tente novamente.');
        }
    }

    async updateExamStats() {
        try {
            const statsRef = database.ref(`digitalExams/${this.currentExam}/stats`);
            const currentStats = await statsRef.once('value');
            const stats = currentStats.val() || { usersCompleted: 0, averageRating: 0 };
            
            await statsRef.update({
                usersCompleted: stats.usersCompleted + 1
            });
        } catch (error) {
            console.error('Error updating exam stats:', error);
        }
    }

    updateResultsScreen(total, answered, correct, wrong, score, duration) {
        document.getElementById('final-score').textContent = score;
        document.getElementById('total-answered').textContent = answered;
        document.getElementById('total-correct').textContent = correct;
        document.getElementById('total-wrong').textContent = wrong;
        
        const hours = Math.floor(duration / 3600000);
        const minutes = Math.floor((duration % 3600000) / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        document.getElementById('total-time').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    reviewAnswers() {
        // Implementation for reviewing answers
        this.showModal('Em Desenvolvimento', 'Funcionalidade de revisão em desenvolvimento.');
    }

    showModal(title, message, callback = null, showCancel = false) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalFooter = modal.querySelector('.modal-footer');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalFooter.innerHTML = '';
        
        // Add confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn-primary';
        confirmBtn.textContent = 'OK';
        confirmBtn.onclick = () => {
            this.hideModal();
            if (callback) callback();
        };
        modalFooter.appendChild(confirmBtn);
        
        // Add cancel button if needed
        if (showCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-secondary';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.onclick = () => this.hideModal();
            modalFooter.appendChild(cancelBtn);
        }
        
        modal.classList.add('active');
    }

    hideModal() {
        document.getElementById('modal').classList.remove('active');
    }

    showManageExamsModal() {
        // Implementation for managing exams
        this.showModal('Em Desenvolvimento', 'Funcionalidade de gerenciamento em desenvolvimento.');
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.digitalExamsSystem = new DigitalExamsSystem();
});

