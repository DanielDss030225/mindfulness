class ProvasManager {
    constructor() {
        this.db = firebase.database();
        this.auth = firebase.auth();
        this.currentUser = null;
        this.isAdmin = false;
        this.categories = {};
        this.subcategories = {};
        this.currentExamId = null;
        this.currentQuestionId = null;

        // Choices.js instances
        this.choicesEditExamCategory = null;
        this.choicesEditExamSubcategory = null;
        this.choicesEditQuestionCategory = null;
        this.choicesEditQuestionSubcategory = null;
        this.choicesAddQuestionCategory = null;
        this.choicesAddQuestionSubcategory = null;
    }

   async initManager() {
    console.log("📚 ProvasManager inicializado");
    this.showScreen("loading-screen");
    await this.checkAuthAndLoadData();

    // Capturar examId da URL
    const params = new URLSearchParams(window.location.search);
    const examId = params.get("examId");

    this.setupEventListeners();

    if (examId) {
        // Se tem examId, abre direto a edição dessa prova
        this.loadExamForEdit(examId);
    } else {
        // Se não tem examId, vai para tela inicial de manager
        this.showScreen("manager-screen");
    }

    document.body.style.overflow = "auto";
}

    async checkAuthAndLoadData() {
        return new Promise((resolve) => {
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    // Simulação de admin para teste. Em produção, verificar permissões no DB.
                    this.isAdmin = this.currentUser.email === 'danielintheend@gmail.com'; 
                    if (!this.isAdmin) {
                        alert("Acesso negado. Você não tem permissão de administrador.");
                        window.location.href = "index.html"; // Redirecionar se não for admin
                        return resolve();
                    }
                    await this.loadAllData();
                    this.updateUserInfo();
                    resolve();
                } else {
                  
                    window.location.href = "index.html"; // Redirecionar para login
                    resolve();
                }
            });
        });
    }

    async loadAllData() {
        await this.loadCategories();
        await this.loadExams();
        this.loadCategoriesIntoSelects(); // Carrega categorias para todos os selects
        this.renderExamsList();
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('userName');
        const userProfilePicElement = document.getElementById('userProfilePic');
        const userInfoDiv = document.querySelector('.user-info');

        if (this.currentUser) {
            if (userNameElement) userNameElement.textContent = this.currentUser.displayName || this.currentUser.email;
            if (userProfilePicElement) userProfilePicElement.src = this.currentUser.photoURL || 'img/perfil.png';
            if (userInfoDiv) userInfoDiv.style.display = 'flex';
        }
    }

    setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.auth.signOut().then(() => {
                window.location.href = "index.html";
            }).catch((error) => {
                console.error("Erro ao fazer logout:", error);
                this.showModal("Erro", "Não foi possível fazer logout.");
            });
        });

        document.getElementById('back-to-main-menu-btn')?.addEventListener('click', () => {
            window.location.href = "provasdigitais.html";
        });

        document.getElementById('create-new-exam-btn')?.addEventListener('click', () => {
            this.showScreen('create-exam-screen');
            this.resetCreateExamForm();
        });

        document.getElementById('back-to-manager-btn')?.addEventListener('click', () => {
            this.showScreen('manager-screen');
            this.renderExamsList();
        });

        document.getElementById('back-to-edit-exam-btn')?.addEventListener('click', () => {
            this.showScreen('edit-exam-screen');
            this.loadExamForEdit(this.currentExamId); // Recarrega a prova para garantir dados atualizados
        });

        document.getElementById('back-from-add-question-btn')?.addEventListener('click', () => {
            this.showScreen('edit-exam-screen');
            this.loadExamForEdit(this.currentExamId); // Recarrega a prova para garantir dados atualizados
        });

        // Formulário de Criação de Prova (novo)
        document.getElementById('create-exam-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createExam();
        });
        document.getElementById('cancel-create-exam-btn')?.addEventListener('click', () => {
            this.showScreen('manager-screen');
        });

        // Formulário de Edição de Prova
        document.getElementById('edit-exam-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateExam();
        });
        document.getElementById('delete-exam-btn')?.addEventListener('click', () => {
            this.deleteExam();
        });

        // Formulário de Edição de Questão
        document.getElementById('edit-question-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateQuestion();
        });
        document.getElementById('delete-question-btn')?.addEventListener('click', () => {
            this.deleteQuestion();
        });

        // Formulário de Adicionar Questão à Prova
        document.getElementById('add-question-to-exam-btn')?.addEventListener('click', () => {
            this.showScreen('add-question-to-exam-screen');
            document.getElementById('add-question-current-exam-title').textContent = document.getElementById('edit-exam-title').value;
            document.getElementById('add-question-exam-id').value = this.currentExamId;
            this.resetAddQuestionForm();
        });

        document.getElementById('add-question-to-exam-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addQuestionToExam();
        });

        document.getElementById('clear-add-question-form-btn')?.addEventListener('click', () => {
            this.resetAddQuestionForm();
        });

        // Event listeners para selects de categoria/subcategoria
        document.getElementById('edit-exam-category')?.addEventListener('change', (e) => {
            this.loadSubcategoriesIntoSelect(e.target.value, 'edit-exam-subcategory', this.choicesEditExamSubcategory);
        });
        
        document.getElementById('edit-question-category')?.addEventListener('change', (e) => {
            this.loadSubcategoriesIntoSelect(e.target.value, 'edit-question-subcategory', this.choicesEditQuestionSubcategory);
        });
        document.getElementById('add-question-category')?.addEventListener('change', (e) => {
            this.loadSubcategoriesIntoSelect(e.target.value, 'add-question-subcategory', this.choicesAddQuestionSubcategory);
        });

        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal();
            });
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    async loadCategories() {
        try {
            const snapshot = await this.db.ref("categories").once("value");
            this.categories = snapshot.val() || {};
        } catch (error) {
            console.error("❌ Erro ao carregar categorias:", error);
            this.showModal("Erro", "Não foi possível carregar as categorias.");
        }
    }

    async loadExams() {
        try {
            const snapshot = await this.db.ref("digitalExams").once("value");
            this.exams = snapshot.val() || {};
        } catch (error) {
            console.error("❌ Erro ao carregar provas:", error);
            this.showModal("Erro", "Não foi possível carregar as provas.");
        }
    }

    loadCategoriesIntoSelects() {
        const categorySelects = [
          //  { id: 'edit-exam-category', choicesInstance: this.choicesEditExamCategory },
            { id: 'edit-question-category', choicesInstance: this.choicesEditQuestionCategory },
            { id: 'add-question-category', choicesInstance: this.choicesAddQuestionCategory },
            { id: 'create-exam-category', choicesInstance: null } // Adicionado para o formulário de criação
        ];

        categorySelects.forEach(item => {
            const select = document.getElementById(item.id);
            if (select) {
                const options = [{ value: '', label: 'Selecione a categoria...', selected: true, disabled: true }];
                Object.entries(this.categories).forEach(([id, category]) => {
                    options.push({ value: id, label: category.name });
                });

                if (item.choicesInstance) {
                    item.choicesInstance.setChoices(options, 'value', 'label', true);
                } else {
                    // Para selects sem Choices.js (ex: create-exam-category)
                    select.innerHTML = '';
                    options.forEach(opt => {
                        const optionElement = document.createElement('option');
                        optionElement.value = opt.value;
                        optionElement.textContent = opt.label;
                        if (opt.selected) optionElement.selected = true;
                        if (opt.disabled) optionElement.disabled = true;
                        select.appendChild(optionElement);
                    });
                }
            }
        });

        // Inicializar Choices.js para os selects que ainda não foram
        if (!this.choicesEditExamCategory) {
            this.choicesEditExamCategory = new Choices(document.getElementById('edit-exam-category'), { searchEnabled: true, itemSelectText: '', placeholder: true, placeholderValue: 'Selecione a categoria...' });
        }
        if (!this.choicesEditExamSubcategory) {
            this.choicesEditExamSubcategory = new Choices(document.getElementById('edit-exam-subcategory'), { searchEnabled: true, itemSelectText: '', placeholder: true, placeholderValue: 'Selecione a subcategoria...' });
        }
        if (!this.choicesEditQuestionCategory) {
            this.choicesEditQuestionCategory = new Choices(document.getElementById('edit-question-category'), { searchEnabled: true, itemSelectText: '', placeholder: true, placeholderValue: 'Selecione a categoria...' });
        }
        if (!this.choicesEditQuestionSubcategory) {
            this.choicesEditQuestionSubcategory = new Choices(document.getElementById('edit-question-subcategory'), { searchEnabled: true, itemSelectText: '', placeholder: true, placeholderValue: 'Selecione a subcategoria...' });
        }
        if (!this.choicesAddQuestionCategory) {
            this.choicesAddQuestionCategory = new Choices(document.getElementById('add-question-category'), { searchEnabled: true, itemSelectText: '', placeholder: true, placeholderValue: 'Selecione a categoria...' });
        }
        if (!this.choicesAddQuestionSubcategory) {
            this.choicesAddQuestionSubcategory = new Choices(document.getElementById('add-question-subcategory'), { searchEnabled: true, itemSelectText: '', placeholder: true, placeholderValue: 'Selecione a subcategoria...' });
        }
    }

    async loadSubcategoriesIntoSelect(categoryId, selectId, choicesInstance) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const options = [{ value: '', label: 'Selecione a subcategoria...', selected: true, disabled: true }];

        if (categoryId) {
            try {
                const snapshot = await this.db.ref(`categories/${categoryId}/subcategories`).once("value");
                const subcategories = snapshot.val() || {};
                Object.entries(subcategories).forEach(([id, subcategory]) => {
                    options.push({ value: id, label: subcategory.name });
                });
            } catch (error) {
                console.error("Erro ao carregar subcategorias:", error);
                this.showModal("Erro", "Não foi possível carregar as subcategorias.");
            }
        }

        if (choicesInstance) {
            choicesInstance.setChoices(options, 'value', 'label', true);
        } else {
            select.innerHTML = '';
            options.forEach(opt => {
                const optionElement = document.createElement('option');
                optionElement.value = opt.value;
                optionElement.textContent = opt.label;
                if (opt.selected) optionElement.selected = true;
                if (opt.disabled) optionElement.disabled = true;
                select.appendChild(optionElement);
            });
        }
    }

renderExamsList() {
    const examsListDiv = document.getElementById('manager-exams-list');
    if (!examsListDiv) return;

    examsListDiv.innerHTML = '';

    if (Object.keys(this.exams).length === 0) {
        examsListDiv.innerHTML = '<p class="text-center">Nenhuma prova disponível.</p>';
        return;
    }

    Object.entries(this.exams).forEach(([examId, exam]) => {
        // Conta a quantidade de questões da prova
        const questionCount = exam.questions ? Object.keys(exam.questions).length : 0;

        const examCard = document.createElement('div');
        examCard.className = 'exam-card';
        examCard.innerHTML = `
            <h4>${exam.title}</h4>
            <div class="exam-meta">
                <span class="exam-tag">${exam.type === 'concurso' ? 'Concurso' : 'Simulado'}</span>
                <span class="exam-tag">${this.categories[exam.category]?.name || 'N/A'}</span>
                ${exam.banca ? `<span class="exam-tag">${exam.banca}</span>` : ''}
                ${exam.year ? `<span class="exam-tag">${exam.year}</span>` : ''}
                <span class="exam-tag">Questões: ${questionCount}</span> <!-- NOVO -->
            </div>
            <p>${exam.description || 'Sem descrição'}</p>
            <div class="exam-actions">
                <button class="btn-secondary" data-id="${examId}">Editar</button>
            </div>
        `;
examCard.querySelector('button').addEventListener('click', () => {
    window.location.href = `manager.html?examId=${examId}`;
});
        examsListDiv.appendChild(examCard);
    });
}

    async createExam() {
        try {
            const title = document.getElementById('create-exam-title').value;
            const type = document.getElementById('create-exam-type').value;
            const category = document.getElementById('create-exam-category').value;
            const subcategory = document.getElementById('create-exam-subcategory').value;
            const description = document.getElementById('create-exam-description').value;
            const banca = document.getElementById('create-exam-banca').value;
            const year = document.getElementById('create-exam-year').value;

            if (!title || !type || !category) {
                this.showModal('Erro', 'Preencha todos os campos obrigatórios: Título, Tipo e Categoria.');
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

            const examRef = await this.db.ref('digitalExams').push(examData);
            this.exams[examRef.key] = examData; // Atualiza a lista local
            this.showModal('Sucesso', 'Prova criada com sucesso! Você pode editá-la agora para adicionar questões.', () => {
                this.showScreen('edit-exam-screen');
                this.loadExamForEdit(examRef.key);
            });

        } catch (error) {
            console.error('Error creating exam:', error);
            this.showModal('Erro', 'Erro ao criar prova. Tente novamente.');
        }
    }

    async loadExamForEdit(examId) {
        this.currentExamId = examId;
        this.showScreen('edit-exam-screen');

        try {
            const snapshot = await this.db.ref(`digitalExams/${examId}`).once('value');
            const exam = snapshot.val();

            if (!exam) {
                this.showModal('Erro', 'Prova não encontrada.');
                this.showScreen('manager-screen');
                return;
            }

            document.getElementById('edit-exam-id').value = examId;
            document.getElementById('edit-exam-title').value = exam.title;

            // Set type and trigger change to show/hide concurso fields
            const editExamTypeSelect = document.getElementById('edit-exam-type');
            editExamTypeSelect.value = exam.type;
            const event = new Event('change');
            editExamTypeSelect.dispatchEvent(event);

            document.getElementById('edit-exam-banca').value = exam.banca || '';
            document.getElementById('edit-exam-year').value = exam.year || '';
            document.getElementById('edit-exam-description').value = exam.description || '';

            // Set category using Choices.js
            if (this.choicesEditExamCategory) {
                this.choicesEditExamCategory.setChoiceByValue(exam.category);
                await this.loadSubcategoriesIntoSelect(exam.category, 'edit-exam-subcategory', this.choicesEditExamSubcategory);
                if (exam.subcategory && this.choicesEditExamSubcategory) {
                    this.choicesEditExamSubcategory.setChoiceByValue(exam.subcategory);
                }
            }

            this.renderExamQuestions(examId, exam.questions);

        } catch (error) {
            console.error('Error loading exam for edit:', error);
            this.showModal('Erro', 'Erro ao carregar prova para edição.');
        }
    }

    async updateExam() {
        try {
            const examId = document.getElementById('edit-exam-id').value;
            const title = document.getElementById('edit-exam-title').value;
            const type = document.getElementById('edit-exam-type').value;
            const category = document.getElementById('edit-exam-category').value;
            const subcategory = document.getElementById('edit-exam-subcategory').value;
            const description = document.getElementById('edit-exam-description').value;
            const banca = document.getElementById('edit-exam-banca').value;
            const year = document.getElementById('edit-exam-year').value;

            if (!title || !type || !category) {
                this.showModal('Erro', 'Preencha todos os campos obrigatórios: Título, Tipo e Categoria.');
                return;
            }

            const examData = {
                title,
                type,
                category,
                subcategory: subcategory || null,
                description,
                // createdBy e createdAt não são alterados na edição
            };

            if (type === 'concurso') {
                examData.banca = banca;
                examData.year = parseInt(year);
            } else {
                examData.banca = null; // Limpa se mudar para simulado
                examData.year = null;
            }

            await this.db.ref(`digitalExams/${examId}`).update(examData);
            this.exams[examId] = { ...this.exams[examId], ...examData }; // Atualiza a lista local
            this.showModal('Sucesso', 'Prova atualizada com sucesso!', () => {
                this.showScreen('manager-screen');
                this.renderExamsList();
            });

        } catch (error) {
            console.error('Error updating exam:', error);
            this.showModal('Erro', 'Erro ao atualizar prova. Tente novamente.');
        }
    }

    async deleteExam() {
        const examId = document.getElementById('edit-exam-id').value;
        if (!confirm('Tem certeza que deseja excluir esta prova e todas as suas questões?')) {
            return;
        }

        try {
            await this.db.ref(`digitalExams/${examId}`).remove();
            delete this.exams[examId]; // Remove da lista local
            this.showModal('Sucesso', 'Prova excluída com sucesso!', () => {
                this.showScreen('manager-screen');
                this.renderExamsList();
            });
        } catch (error) {
            console.error('Error deleting exam:', error);
            this.showModal('Erro', 'Erro ao excluir prova. Tente novamente.');
        }
    }

// Função auxiliar para truncar texto
truncateText(text, maxLength = 50) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

renderExamQuestions(examId, questions) {
    const questionsListDiv = document.getElementById('exam-questions-list');
    if (!questionsListDiv) return;

    questionsListDiv.innerHTML = '';

    if (!questions || Object.keys(questions).length === 0) {
        questionsListDiv.innerHTML = '<p class="text-center">Nenhuma questão adicionada a esta prova.</p>';
        return;
    }

    let questionNumber = 1;
    Object.entries(questions).forEach(([questionId, question]) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.innerHTML = `
            <h2>Questão ${questionNumber}</h2>
            <p><strong>Enunciado:</strong> ${this.truncateText(question.text)}</p>
            ${question.associatedText ? `<p><strong>Texto associado:</strong> ${this.truncateText(question.associatedText)}</p>` : ''}
            ${question.comment ? `<p><strong>Comentário:</strong> ${this.truncateText(question.comment)}</p>` : ''}
            <p><strong>Categoria:</strong> ${this.categories[question.category]?.name || 'N/A'}</p>


          
           
           
            <div class="question-actions">
                <button class="btn-secondary" data-id="${questionId}">Editar Questão</button>
            </div>
        `;
        questionCard.querySelector('button').addEventListener('click', () => this.loadQuestionForEdit(examId, questionId));
        questionsListDiv.appendChild(questionCard);
        questionNumber++;
    });
}


    async loadQuestionForEdit(examId, questionId) {
        this.currentExamId = examId;
        this.currentQuestionId = questionId;
        this.showScreen('edit-question-screen');

        try {
            const snapshot = await this.db.ref(`digitalExams/${examId}/questions/${questionId}`).once('value');
            
            const question = snapshot.val();

            if (!question) {
                this.showModal('Erro', 'Questão não encontrada.');
                this.showScreen('edit-exam-screen');
                return;
            }

            document.getElementById('edit-question-id').value = questionId;
            document.getElementById('edit-question-exam-id').value = examId;
            document.getElementById('edit-question-associated-text').value = question.associatedText || '';
            document.getElementById('edit-question-text').value = question.text;
            document.getElementById('edit-question-comment').value = question.comment || '';

            // Load alternatives
            const alternativesListDiv = document.getElementById('edit-alternatives-list');
            alternativesListDiv.innerHTML = '';
            question.alternatives.forEach((altText, index) => {
                const item = document.createElement('div');
                item.className = 'alternative-item';
                item.innerHTML = `
                    <input type="radio" name="edit-correct-answer" value="${index}" ${question.correctAnswer === index ? 'checked' : ''} required>
                    <label>${String.fromCharCode(65 + index)}</label>
                    <textarea class="alternative-text" rows="2" data-index="${index}" required>${altText}</textarea>
                `;
                alternativesListDiv.appendChild(item);
            });

            // Set category and subcategory using Choices.js
            if (this.choicesEditQuestionCategory) {
                this.choicesEditQuestionCategory.setChoiceByValue(question.category);
                await this.loadSubcategoriesIntoSelect(question.category, 'edit-question-subcategory', this.choicesEditQuestionSubcategory);
                if (question.subcategory && this.choicesEditQuestionSubcategory) {
                    this.choicesEditQuestionSubcategory.setChoiceByValue(question.subcategory);
                }
            }

        } catch (error) {
            console.error('Error loading question for edit:', error);
            this.showModal('Erro', 'Erro ao carregar questão para edição.');
        }
    }

  async updateQuestion() {
    try {
        // Pega o ID da prova e o ID da questão (mesmo ID usado no banco global)
        const examId = document.getElementById('edit-question-exam-id').value;
        const questionId = document.getElementById('edit-question-id').value;

        const associatedText = document.getElementById('edit-question-associated-text').value.trim();
        const text = document.getElementById('edit-question-text').value.trim();
        const comment = document.getElementById('edit-question-comment').value.trim();
        const category = document.getElementById('edit-question-category').value;
        const subcategory = document.getElementById('edit-question-subcategory').value;

        const alternatives = Array.from(document.querySelectorAll('#edit-alternatives-list .alternative-text')).map(textarea => textarea.value.trim());
        const correctAnswer = parseInt(document.querySelector('input[name="edit-correct-answer"]:checked')?.value);

        if (!text || alternatives.some(alt => !alt) || isNaN(correctAnswer) || !category) {
            this.showModal('Erro', 'Preencha todos os campos obrigatórios da questão e selecione a resposta correta.');
            return;
        }

        const questionData = {
            associatedText: associatedText || "",
            text,
            alternatives,
            correctAnswer,
            comment: comment || "",
            category,
            subcategory: subcategory || null,
            // createdBy e createdAt não são alterados na edição
        };

        // Atualizar no nó da prova
        await this.db.ref(`digitalExams/${examId}/questions/${questionId}`).update(questionData);

        // Atualizar no banco global de questões com o mesmo ID
        await this.db.ref(`questions/${questionId}`).update(questionData);

        this.showModal('Sucesso', 'Questão atualizada com sucesso!', () => {
            this.showScreen('edit-exam-screen');
            this.loadExamForEdit(examId);
        });

    } catch (error) {
        console.error('Error updating question:', error);
        this.showModal('Erro', 'Erro ao atualizar questão. Tente novamente.');
    }
}

    async deleteQuestion() {
        const examId = document.getElementById('edit-question-exam-id').value;
        const questionId = document.getElementById('edit-question-id').value;
        const questionText = document.getElementById('edit-question-text').value.trim();

        if (!confirm('Tem certeza que deseja excluir esta questão da prova?')) {
            return;
        }

        try {
            // Remover do nó da prova
            await this.db.ref(`digitalExams/${examId}/questions/${questionId}`).remove();

            // Perguntar se deseja remover também do banco global de questões
            if (confirm('Deseja remover esta questão também do banco de questões global?')) {
                const globalQuestionSnapshot = await this.db.ref(`questions`).orderByChild('text').equalTo(questionText).once('value');
                const globalQuestionKey = Object.keys(globalQuestionSnapshot.val() || {})[0];
                if (globalQuestionKey) {
                    await this.db.ref(`questions/${globalQuestionKey}`).remove();
                }
            }

            this.showModal('Sucesso', 'Questão excluída com sucesso!', () => {
                this.showScreen('edit-exam-screen');
                this.loadExamForEdit(examId);
            });

        } catch (error) {
            console.error('Error deleting question:', error);
            this.showModal('Erro', 'Erro ao excluir questão. Tente novamente.');
        }
    }

  async addQuestionToExam() {
    try {
        const examId = document.getElementById('add-question-exam-id').value;

        const associatedText = document.getElementById('add-question-associated-text').value.trim();
        const text = document.getElementById('add-question-text').value.trim();
        const comment = document.getElementById('add-question-comment').value.trim();
        const category = document.getElementById('add-question-category').value;
        const subcategory = document.getElementById('add-question-subcategory').value;
        const saveToGlobal = document.getElementById('save-to-global-questions').checked;

        const alternatives = Array.from(document.querySelectorAll('#add-alternatives-list .alternative-text')).map(textarea => textarea.value.trim());
        const correctAnswer = parseInt(document.querySelector('input[name="correct-answer"]:checked')?.value);

        if (!text || alternatives.some(alt => !alt) || isNaN(correctAnswer) || !category) {
            this.showModal('Erro', 'Preencha todos os campos obrigatórios da questão e selecione a resposta correta.');
            return;
        }

        // 1. Gerar um ID único manualmente (exemplo usando push().key)
        const questionId = this.db.ref().child('questions').push().key;

        const questionData = {
            associatedText: associatedText || "",
            text,
            alternatives,
            correctAnswer,
            comment: comment || "",
            createdBy: this.currentUser.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            type: "previous", // ou outro tipo padrão
            category,
            subcategory: subcategory || null
        };

        // 2. Salvar no nó da prova com o mesmo ID
        await this.db.ref(`digitalExams/${examId}/questions/${questionId}`).set(questionData);

        // 3. Salvar no nó global de questões com o mesmo ID, se marcado
        if (saveToGlobal) {
            await this.db.ref(`questions/${questionId}`).set(questionData);
        }

        this.showModal('Sucesso', 'Questão adicionada com sucesso!', () => {
            this.resetAddQuestionForm();
            this.loadExamForEdit(examId); // Recarrega a prova
            this.showScreen('edit-exam-screen');
        });

    } catch (error) {
        console.error('Error adding question to exam:', error);
        this.showModal('Erro', 'Erro ao adicionar questão. Tente novamente.');
    }
}

    resetCreateExamForm() {
        document.getElementById('create-exam-form').reset();
        document.getElementById('create-exam-type').value = '';
        document.getElementById('create-exam-category').value = '';
        document.getElementById('create-exam-subcategory').value = '';
        document.getElementById('create-exam-banca').value = '';
        document.getElementById('create-exam-year').value = '';
        document.getElementById('concurso-fields').classList.remove('show');
    }

    resetAddQuestionForm() {
        document.getElementById('add-question-to-exam-form').reset();
        document.getElementById('add-question-associated-text').value = '';
        document.getElementById('add-question-text').value = '';
        document.querySelectorAll('#add-alternatives-list .alternative-text').forEach(textarea => textarea.value = '');
        document.querySelectorAll('input[name="correct-answer"]').forEach(radio => radio.checked = false);
        document.getElementById('add-question-comment').value = '';
        if (this.choicesAddQuestionCategory) this.choicesAddQuestionCategory.setChoiceByValue('');
        if (this.choicesAddQuestionSubcategory) this.choicesAddQuestionSubcategory.setChoiceByValue('');
        document.getElementById('save-to-global-questions').checked = true;
    }

    showModal(title, message, callback = null, showCancel = false) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalFooter = modal.querySelector('.modal-footer');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalFooter.innerHTML = '';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn-primary';
        confirmBtn.textContent = 'OK';
        confirmBtn.onclick = () => {
               salvaValorInput();
            this.hideModal();
            if (callback) callback();
        };
        modalFooter.appendChild(confirmBtn);
        
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
}

document.addEventListener("DOMContentLoaded", () => {
    window.provasManager = new ProvasManager();
    window.provasManager.initManager();

    // Adiciona event listener para o select de tipo de prova no formulário de criação
    document.getElementById('create-exam-type')?.addEventListener('change', (e) => {
        const concursoFields = document.getElementById('concurso-fields');
        if (e.target.value === 'concurso') {
            concursoFields.classList.add('show');
        } else {
            concursoFields.classList.remove('show');
        }
    });

    // Adiciona event listener para o select de tipo de prova no formulário de edição
    document.getElementById('edit-exam-type')?.addEventListener('change', (e) => {
        const concursoFields = document.getElementById('edit-concurso-fields');
        if (e.target.value === 'concurso') {
            concursoFields.classList.add('show');
        } else {
            concursoFields.classList.remove('show');
        }
    });

    // Adiciona event listener para o select de categoria no formulário de criação
    document.getElementById('create-exam-category')?.addEventListener('change', (e) => {
        window.provasManager.loadSubcategoriesIntoSelect(e.target.value, 'create-exam-subcategory', null); // Passa null para não usar Choices.js aqui
    });
});

// Funções globais para compatibilidade (se necessário, ou remover)
function goToProfile() {
    alert('Funcionalidade de perfil em desenvolvimento.');
}



function alternativaE() {

    document.getElementById("alternativaE").value = "Ignorar questão."
}


function salvaValorInput() {
    const input = document.getElementById('add-question-associated-text');

    const valor = input.value.trim(); // pega o valor do input
    if(valor) {
        localStorage.setItem('associatedText', valor); // sobrescreve o valor anterior
        console.log('Valor salvo:', valor);
    } else {
        console.log('Input vazio, nada salvo.');
    }
}



function usarValorInput() {

const valorSalvo = localStorage.getItem('associatedText');
    const input = document.getElementById('add-question-associated-text');

if(valorSalvo) {
    input.value = valorSalvo; // preenche o input com o valor salvo
    console.log('Valor recuperado:', valorSalvo);
} else {
        console.log('valor de texto vazio');

}
}


document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const examId = params.get("examId");

    if (examId) {
        // Já existe examId na URL → abre a edição dessa prova
        try {
            await examManager.loadExamForEdit(examId); 
            examManager.showScreen("edit-exam-screen");
        } catch (error) {
            console.error("Erro ao carregar prova via examId:", error);
            examManager.showModal("Erro", "Não foi possível abrir a prova automaticamente.");
            examManager.showScreen("manager-screen"); // fallback
        }
    } else {
        // Sem examId → fluxo normal de gerenciamento
        examManager.showScreen("manager-screen");
        examManager.loadExamsList();
    }
});



// Seleciona todos os textareas dentro da div #add-alternatives-list 
const textareas = document.querySelectorAll('#add-alternatives-list textarea');

const enunciado = document.getElementById("add-question-text");
let textoUmaLinha = enunciado.value.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
enunciado.value = textoUmaLinha; // <-- Aqui atualizamos o conteúdo do textarea




textareas.forEach(textarea => {
    // Limpa o texto ao colar ou digitar
    textarea.addEventListener('input', () => {
        let valor = textarea.value;

        // Remove quebras de linha e espaços extras
        valor = valor.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();

        textarea.value = valor;
    });

    // Limpa imediatamente ao colar
    textarea.addEventListener('paste', (e) => {
        e.preventDefault();
        let paste = (e.clipboardData || window.clipboardData).getData('text');

        // Remove quebras de linha e espaços extras
        paste = paste.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();

        // Insere o texto tratado no textarea
        textarea.value = paste;
    });
});


