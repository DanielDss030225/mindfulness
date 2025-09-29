
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

            this.showScreen('main-menu-screen')
            ;
            const headerGame = document.getElementById("headerGame");
                        const loading = document.getElementById("loading-screen");

            if (headerGame) {

    headerGame.style.display = "flex"; 

}
      if (loading) {

    loading.style.display = "none"; 

}




        } catch (error) {
            console.error('Error initializing system:', error);
            this.showModal('Erro', 'Erro ao inicializar o sistema. Recarregue a página.');
        }
    }

async loadUserData() {
    try {
        // Carregar categorias (continua hardcoded)
        this.categories = { 
          
           // 'cat3': { name: 'Português' },
            'cat1': { name: 'Polícia Penal De Minas Gerais' },
            'cat2': { name: 'Polícia Militar De Minas Gerais' },
         'cat3': { name: 'Simulado Bizurado' }

        };

        // Buscar exames do Firebase
        const examsSnapshot = await database.ref('digitalExams').once('value');
        this.exams = examsSnapshot.val() || {};

        // Atualizar UI
        this.updateUserInfo();
        this.loadCategoriesIntoSelects();
        this.loadExamsList();

        // Mostrar painel admin se for administrador
        if (this.isAdmin) {
        }

    } catch (error) {
        console.error('Error loading user data:', error);
        this.showModal('Erro', 'Não foi possível carregar os dados. Recarregue a página.');
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
    // Navega para a página admProvas/index.html
    window.location.href = 'manager.html';

    // Se ainda quiser manter o modal, deixe a linha abaixo
    // this.showManageExamsModal();
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
 document.getElementById('back-to-exam-btn2')?.addEventListener('click', () => {
            this.showScreen('exam-screen');
        });
        document.getElementById('exit-exam-btn')?.addEventListener('click', () => {
            this.exitExam();
        });

        // Results actions
        document.getElementById('review-answers-btn')?.addEventListener('click', () => {
         this.showScreen('exam-screen');
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
      this.updateAnswerSheetStats();
window.scrollTo({
  top: 0,
});


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
      
       let concusaoName = usersCount === 1 ? "conclusão" : "conclusões";

        card.innerHTML = `
            <h4>${exam.title}</h4>
            <div class="exam-meta">
                <span class="exam-tag">${exam.type === 'concurso' ? 'Concurso' : 'Simulado'}</span>
                <span class="exam-tag">${categoryName}</span>
                ${exam.banca ? `<span class="exam-tag">${exam.banca}</span>` : ''}
                ${exam.year ? `<span class="exam-tag">${exam.year}</span>` : ''}
            </div>
            <p >${exam.description || 'Sem descrição'}</p>
            <div class="exam-stats">
            
                <span>${questionsCount} questões</span>
                <span>${usersCount} ${concusaoName}</span>
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
            window.location.href = `manager.html?examId=${examRef.key}`;



        } catch (error) {
            console.error('Error creating exam:', error);
            this.showModal('Erro', 'Erro ao criar prova. Tente novamente.');
        }
    }

async addQuestionToExam() {
    try {
        // Pegar valores do formulário
        const questionText = document.getElementById('question-text')?.value.trim();
        const associatedText = document.getElementById('question-associated-text')?.value.trim();
        const alternatives = Array.from(document.querySelectorAll('.alternative-text'))
            .map(t => t.value.trim());
        const correctAnswer = parseInt(document.querySelector('input[name="correct-answer"]:checked')?.value);
        const comment = document.getElementById('question-comment')?.value.trim();
        const category = document.getElementById('question-category')?.value;
        const subcategory = document.getElementById('question-subcategory')?.value;

        // 🔎 Validações
        if (!this.currentExam) {
            this.showModal("Erro", "Nenhuma prova ativa. Crie ou selecione uma prova antes de adicionar questões.");
            return;
        }

        if (!questionText) {
            this.showModal("Erro", "O enunciado da questão é obrigatório.");
            return;
        }

        if (alternatives.length < 4 || alternatives.some(alt => !alt)) {
            this.showModal("Erro", "Preencha todas as alternativas (A, B, C e D).");
            return;
        }

        if (isNaN(correctAnswer)) {
            this.showModal("Erro", "Selecione a resposta correta.");
            return;
        }

        if (!category) {
            this.showModal("Erro", "Selecione a categoria da questão.");
            return;
        }

        // Dados da questão
        const questionData = {
            text: questionText,
            associatedText: associatedText || "",
            alternatives,
            correctAnswer,
            comment: comment || "",
            createdBy: this.currentUser?.uid || "anon",
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            type: "previous",
            category,
            subcategory: subcategory || null
        };

        // 1️⃣ Salvar no nó do exame
        await database.ref(`digitalExams/${this.currentExam}/questions`).push(questionData);

        // 2️⃣ Salvar no banco geral de questões
        await database.ref("questions").push(questionData);

        // Atualizar contagem
        const snapshot = await database.ref(`digitalExams/${this.currentExam}/questions`).once("value");
        const currentCount = snapshot.numChildren();
        document.getElementById("questions-count").textContent = `${currentCount} questões`;

        // Limpar formulário
        this.clearQuestionForm();

        this.showModal("Sucesso", "Questão adicionada com sucesso!");

    } catch (error) {
        console.error("❌ Erro ao adicionar questão:", error);
        this.showModal("Erro", "Erro ao adicionar questão. Tente novamente.");
    }

    
}


// Limpar formulário, incluindo selects
clearQuestionForm() {
    document.getElementById('question-associated-text').value = '';
    document.getElementById('question-text').value = '';
    document.querySelectorAll('.alternative-text').forEach(textarea => textarea.value = '');
    document.querySelectorAll('input[name="correct-answer"]').forEach(radio => radio.checked = false);
    document.getElementById('question-comment').value = '';
    document.getElementById('question-category').value = '';
    document.getElementById('question-subcategory').value = '';
}


    clearQuestionForm() {
        document.getElementById('question-associated-text').value = '';
        document.getElementById('question-text').value = '';
        document.querySelectorAll('.alternative-text').forEach(textarea => textarea.value = '');
        document.querySelectorAll('input[name="correct-answer"]').forEach(radio => radio.checked = false);
        document.getElementById('question-comment').value = '';
        //document.getElementById('save-to-general').checked = false;
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
            let concusaoName = exam.stats?.usersCompleted === 1 ? "conclusão" : "conclusões";
            // Update UI
            document.getElementById('exam-title-display').textContent = exam.title;
            document.getElementById('exam-users-count').textContent = `${exam.stats?.usersCompleted || 0} ${concusaoName}`;
                    
        // Preencher gabarito
        this.updateAnswerKey();  // <-- chamada adicionada aqui
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
       

    this.showModal('Concurseiro, Boa Sorte!', 'Observe o tempo e tente completar a prova/simulado dentro do prazo do concurso real.');
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
        
        // Display associated text if it exists
        const associatedTextDisplay = document.getElementById('question-associated-text-display');
        const buttonText = document.getElementById("esconderTexto");
   let textoAssociation = document.getElementById("question-associated-text-display");
   if (textoAssociation) {
    if (textoAssociation.style.display == "none" )
    {

    } else {
        verTexto()
    }
   }
        if (question.associatedText && question.associatedText.trim()) {
            associatedTextDisplay.innerHTML = this.formatQuestionText(question.associatedText);
buttonText.style.display = 'block';
// ======== NOVO CÓDIGO PARA ZOOM ========
associatedTextDisplay.querySelectorAll('img').forEach(img => {
    img.style.cursor = 'zoom-in'; // opcional, muda o cursor
    img.onclick = () => abrirModalExclusivo(img);
});
          //  associatedTextDisplay.style.display = 'block';
        } else {
          //  associatedTextDisplay.style.display = 'none';
          buttonText.style.display = 'none';

        }
        
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
            this.currentQuestionIndex === this.currentExamQuestions.length - 1 ? 'Finalizar Prova' : 'Próxima Questão';
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
            <div class="alternative-text">${this.formatQuestionText(text)}</div>
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

        // Atualiza gabarito para essa questão (se houver)
        const qIndex = this.currentExamQuestions.findIndex(q => q.id === questionId);
        if (qIndex >= 0) {
            this.updateAnswerKeyForQuestion(qIndex, answerIndex, this.currentExamQuestions[qIndex].correctAnswer);
        }

        // Atualiza as estatísticas (respondidas / corretas / restantes)
        this.updateAnswerSheetStats();
    }
}

updateProgress() {
    const totalQuestions = this.currentExamQuestions.length;

    // Barra inicia zerada: 0% na primeira questão (índice 0)
    let progressPercentage = 0;
    if (this.currentQuestionIndex > 0) {
        progressPercentage = (this.currentQuestionIndex / totalQuestions) * 100;
    }

    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (progressFill) progressFill.style.width = `${progressPercentage}%`;
    if (progressText) progressText.textContent = `${this.currentQuestionIndex + 1} / ${totalQuestions}`;
}


    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.loadCurrentQuestion();
        }
    }

nextQuestion() {

   let textoAssociation = document.getElementById("question-associated-text-display");
   if (textoAssociation) {
    if (textoAssociation.style.display == "none" )
    {

    } else {
        verTexto()
    }
   }
    window.scrollTo({
  top: 0,
  
});

    const currentQuestion = this.currentExamQuestions[this.currentQuestionIndex];
    const userAnswer = this.userAnswers[currentQuestion.id];

    // Atualiza gabarito somente para a questão atual
    this.updateAnswerKeyForQuestion(this.currentQuestionIndex, userAnswer, currentQuestion.correctAnswer);

    if (this.currentQuestionIndex < this.currentExamQuestions.length - 1) {
        this.currentQuestionIndex++;
        this.loadCurrentQuestion();
    } else {
        // Última questão → finalizar
        this.finishExam();
    }
}



updateAnswerSheetStats() {
    const totalQuestions = this.currentExamQuestions.length;
    let answered = 0;
    let correct = 0;

    this.currentExamQuestions.forEach(question => {
        const userAnswer = this.userAnswers[question.id];

        if (userAnswer !== undefined && userAnswer !== null) {
            answered++;
            if (userAnswer === question.correctAnswer) correct++;
        }
    });

    const remaining = totalQuestions - answered;

    document.getElementById('answered-count').textContent = answered;
    document.getElementById('correct-count').textContent = correct;
    document.getElementById('remaining-count').textContent = remaining;
}

updateAnswerKeyForQuestion(questionIndex, userAnswer, correctAnswer) {
    const container = document.getElementById('answer-key-container');
    const container2 = document.getElementById('answer-key-container2');

    // Primeiro container
    let div = container.children[questionIndex];
    if (!div) {
        div = document.createElement('div');
        div.className = 'answer-key-item';
        div.textContent = `Questão ${questionIndex + 1}: ${String.fromCharCode(65 + correctAnswer)}`;
        container.appendChild(div);
    }

    // Segundo container
    let div2 = container2.children[questionIndex];
    if (!div2) {
        div2 = document.createElement('div');
        div2.className = 'answer-key-item';
        div2.textContent = `Questão ${questionIndex + 1}: ${String.fromCharCode(65 + correctAnswer)}`;
        container2.appendChild(div2);
    }

    // Limpa classes anteriores (ambos containers)
    div.classList.remove('correct', 'incorrect');
    div2.classList.remove('correct', 'incorrect');

    // Marca de acordo com a resposta (ambos containers)
    if (userAnswer === undefined) {
        // Não respondida → cinza (classe padrão)
    } else if (userAnswer === correctAnswer) {
        div.classList.add('correct'); 
        div2.classList.add('correct');
    } else {
        div.classList.add('incorrect'); 
        div2.classList.add('incorrect');
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
            const score = correctAnswers * 2;
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

        await database.ref(`digitalExams/${this.currentExam}/stats/usersCompleted`).transaction(current => {
            return (current || 0) + 1;
        });

        // Atualiza o objeto local para refletir na UI
        if (this.exams[this.currentExam]) {
            if (!this.exams[this.currentExam].stats) this.exams[this.currentExam].stats = {};
            this.exams[this.currentExam].stats.usersCompleted = (this.exams[this.currentExam].stats.usersCompleted || 0) + 1;
        }
         
        // Atualiza a contagem na tela de exame
        const exam = this.exams[this.currentExam];
        let concusaoName = exam.stats.usersCompleted === 1 ? "conclusão" : "conclusões";
        document.getElementById('exam-users-count').textContent = `${exam.stats.usersCompleted} ${concusaoName}`;

    } catch (error) {
        console.error('Error updating exam stats:', error);
    }
}


    updateResultsScreen(total, answered, correct, wrong, score, duration) {
        document.getElementById('final-score').textContent = score;
        document.getElementById('total-answered').textContent = answered;
        document.getElementById('total-correct').textContent = correct;
        document.getElementById('total-wrong').textContent = wrong;

       let naoRespondidas = (total - (correct + wrong));
       console.log( "Questão não respondidas: ", naoRespondidas)
       document.getElementById("naoRespondidas").textContent = naoRespondidas;
        // Calcular porcentagem de acerto
        
        const accuracyPercentage = answered > 0 ? Math.round((correct / total) * 100) : 0;
        document.getElementById('accuracy-percentage').textContent = `${accuracyPercentage}%`;
        
        const hours = Math.floor(duration / 3600000);
        const minutes = Math.floor((duration % 3600000) / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        document.getElementById('total-time').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Exibir mensagem motivacional
        this.showMotivationalMessage(accuracyPercentage, correct, total);
    }


updateAnswerKey() {
    const containers = [
        document.getElementById('answer-key-container'),
        document.getElementById('answer-key-container2')
    ];

    const totalQuestions = this.currentExamQuestions.length;

    containers.forEach(container => {
        if (!container) return;

        // Limpa gabarito antigo
        container.innerHTML = '';

        // Ajusta grid para preencher por coluna
        container.style.display = 'grid';
        container.style.gridAutoFlow = 'column';

        // Para telas menores: cada container terá número de linhas igual ao total de questões
        if (window.innerWidth < 1000) { // breakpoint para mobile/tablet
            container.style.gridTemplateRows = `repeat(${totalQuestions}, auto)`;
        } else {
            // Para telas maiores, você pode definir um número fixo de linhas ou repetir automaticamente
            container.style.gridTemplateRows = 'repeat(25, auto)'; 
        }

        // Cria os itens
        this.currentExamQuestions.forEach((question, index) => {
            const div = document.createElement('div');
            div.className = 'answer-key-item';
            div.textContent = `Questão ${index + 1}: ${String.fromCharCode(65 + question.correctAnswer)}`;

            // Verifica se o usuário respondeu
            const userAnswer = this.userAnswers[question.id];

            if (userAnswer === undefined) {
                div.classList.remove('correct', 'incorrect');
            } else if (userAnswer === question.correctAnswer) {
                div.classList.add('correct');
            } else {
                div.classList.add('incorrect');
            }

            container.appendChild(div);
        });
    });
}





    showMotivationalMessage(accuracyPercentage, correct, total) {
        let title = '';
        let message = '';
        
        if (accuracyPercentage >= 90) {
            title = '🏆 Excelente!';
            message = `Parabéns! Você acertou ${correct} de ${total} questões (${accuracyPercentage}%). Seu desempenho foi excepcional! Continue assim e você alcançará todos os seus objetivos!`;
        } else if (accuracyPercentage >= 80) {
            title = '🎯 Muito Bom!';
            message = `Ótimo trabalho! Você acertou ${correct} de ${total} questões (${accuracyPercentage}%). Está no caminho certo! Com mais um pouco de estudo, você chegará à excelência!`;
        } else if (accuracyPercentage >= 70) {
            title = '👍 Bom Desempenho!';
            message = `Bom resultado! Você acertou ${correct} de ${total} questões (${accuracyPercentage}%). Você tem potencial! Continue estudando e praticando que logo estará entre os melhores!`;
        } else if (accuracyPercentage >= 60) {
            title = '📚 Continue Estudando!';
            message = `Você acertou ${correct} de ${total} questões (${accuracyPercentage}%). Está progredindo! Cada erro é uma oportunidade de aprender. Não desista, você está no caminho certo!`;
        } else if (accuracyPercentage >= 40) {
            title = '💪 Não Desista!';
            message = `Você acertou ${correct} de ${total} questões (${accuracyPercentage}%). Todo grande sucesso começou com pequenos passos. Continue praticando e estudando - você tem tudo para melhorar!`;
        } else {
            title = '🌱 Comece Agora!';
            message = `Você acertou ${correct} de ${total} questões (${accuracyPercentage}%). Este é apenas o começo da sua jornada! Cada questão respondida é um aprendizado. Persista e você verá grandes progressos!`;
        }
        
        // Exibir modal com mensagem motivacional
        setTimeout(() => {
            this.showModal(title, message);
        }, 1000);
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

// 🚀 Instancia só quando o DOM terminar de carregar
document.addEventListener("DOMContentLoaded", () => {
    window.system = new DigitalExamsSystem();
    window.system.init();
});

function verTexto() {
    const associatedTextDisplay = document.getElementById('question-associated-text-display');
        const esconderTexto = document.getElementById('esconderTexto');
        const fundoEsconderTexto     = document.getElementById('fundoEsconderTexto');


    if (associatedTextDisplay.style.display === 'block') {
         fundoEsconderTexto.style.display = 'none';
        associatedTextDisplay.style.display = 'none';
        esconderTexto.textContent = "Ver Texto"

    } else {
        associatedTextDisplay.style.display = 'block';
                fundoEsconderTexto.style.display = 'flex';

                esconderTexto.textContent = "Esconder Texto"

    }
}
// Também é bom atualizar o grid se o usuário redimensionar a tela
window.addEventListener('resize', () => {
    if (window.system) {
        window.system.updateAnswerKey();
    }
});




// Mantendo tudo que você já tem...
const modalExclusivo = document.getElementById("modalImagemExclusiva");
const modalImgExclusiva = document.getElementById("imagemExclusivaModal");
const legendaExclusiva = document.getElementById("legendaExclusiva");
const fecharExclusivo = document.getElementsByClassName("fechar-exclusivo")[0];

let zoomAtivo = false; // controla estado do zoom

function abrirModalExclusivo(img) {
  modalExclusivo.style.display = "block";
  modalImgExclusiva.src = img.src;
  legendaExclusiva.innerHTML = img.alt || '';
  // Reset tamanho
  modalImgExclusiva.style.width = "auto";
  modalImgExclusiva.style.maxWidth = "90%";
  zoomAtivo = false;
  modalImgExclusiva.style.cursor = "zoom-in";
}

// Fecha modal ao clicar no X ou fora da imagem
fecharExclusivo.onclick = () => modalExclusivo.style.display = "none";
modalExclusivo.onclick = (e) => { 
  if(e.target === modalExclusivo) modalExclusivo.style.display = "none"; 
}

// Clique na imagem para zoom
modalImgExclusiva.onclick = (e) => {
  e.stopPropagation(); // evita fechar o modal
  if(!zoomAtivo){
    modalImgExclusiva.style.width = "150%"; // aumenta real a largura
    modalImgExclusiva.style.maxWidth = "none";
    zoomAtivo = true;
    modalImgExclusiva.style.cursor = "zoom-out";
  } else {
    modalImgExclusiva.style.width = "auto"; // volta ao tamanho normal
    modalImgExclusiva.style.maxWidth = "90%";
    zoomAtivo = false;
    modalImgExclusiva.style.cursor = "zoom-in";
  }
}

// Mantendo seleção de imagens no container
const containerTexto = document.getElementById("fundoDoTexto");
const imagens = containerTexto.getElementsByTagName("img");

for (let img of imagens) {
  img.style.cursor = "pointer"; 
  img.addEventListener("click", () => abrirModalExclusivo(img));
}

