// Admin Manager - Handles administrative functions
class AdminManager {
    constructor() {
        this.currentTab = 'questions';
        this.richEditor = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRichEditor();
        this.loadCategoriesForQuestions(); // Load categories on initialization
    }

    setupEventListeners() {
        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Question form
        const questionForm = document.getElementById('questionForm');
        if (questionForm) {
            questionForm.addEventListener('submit', (e) => this.handleQuestionSubmit(e));
        }

        // Category form
        const categoryForm = document.getElementById('categoryForm');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => this.handleCategorySubmit(e));
        }

        // Subcategory form
        const subcategoryForm = document.getElementById('subcategoryForm');
        if (subcategoryForm) {
            subcategoryForm.addEventListener('submit', (e) => this.handleSubcategorySubmit(e));
        }

        // Manage questions filters
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyQuestionFilters());
        }

        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearQuestionFilters());
        }

        // Rich editor toolbar
        this.setupRichEditorToolbar();
    }

    setupRichEditor() {
        const editor = document.getElementById('questionEditor');
        if (editor) {
            this.richEditor = editor;
            
            // Add toolbar
            const toolbar = this.createEditorToolbar();
            editor.parentNode.insertBefore(toolbar, editor);
            
            // Handle editor events
            editor.addEventListener('input', () => this.updateEditorContent());
            editor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
        }
    }

    createEditorToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';
        toolbar.innerHTML = `
            <button type="button" class="toolbar-btn" data-command="bold" title="Negrito">
                <strong>B</strong>
            </button>
            <button type="button" class="toolbar-btn" data-command="italic" title="Itálico">
                <em>I</em>
            </button>
            <button type="button" class="toolbar-btn" data-command="underline" title="Sublinhado">
                <u>U</u>
            </button>
            <div class="toolbar-separator"></div>
            <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="Lista">
                • Lista
            </button>
            <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="Lista Numerada">
                1. Lista
            </button>
        `;
        
        return toolbar;
    }

    setupRichEditorToolbar() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('toolbar-btn')) {
                e.preventDefault();
                const command = e.target.dataset.command;
                this.executeEditorCommand(command);
            }
        });
    }

    executeEditorCommand(command) {
        document.execCommand(command, false, null);
        this.richEditor.focus();
    }

    handleEditorKeydown(e) {
        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    this.executeEditorCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.executeEditorCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    this.executeEditorCommand('underline');
                    break;
            }
        }
    }

    updateEditorContent() {
        // This method can be used to sync content or validate
        console.log('Editor content updated');
    }

    switchTab(tabName) {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        this.currentTab = tabName;

        // Load data for the active tab
        if (tabName === 'categories') {
            this.loadCategories();
            this.loadCategoriesForSubcategories();
            this.loadSubcategories();
        } else if (tabName === 'questions') {
            this.loadCategoriesForQuestions();
        } else if (tabName === 'manage-questions') {
            this.loadCategoriesForFilters();
        }
    }

    async loadCategories() {
        try {
            const categories = await window.databaseManager.getCategories();
            this.updateCategoriesList(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
            window.uiManager.showModal('Erro', 'Erro ao carregar categorias.');
        }
    }

    async loadCategoriesForQuestions() {
        try {
            const categories = await window.databaseManager.getCategories();
            const categorySelect = document.getElementById("questionCategory");
            
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
                
                const sortedCategories = Object.entries(categories || {}).sort(([,a], [,b]) => a.name.localeCompare(b.name));

                sortedCategories.forEach(([id, category]) => {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });

                if (this.questionCategoryChoices) {
                    this.questionCategoryChoices.destroy();
                }
                this.questionCategoryChoices = new Choices(categorySelect, {
                    searchEnabled: true,
                    itemSelectText: 'Pressione para selecionar',
                    noResultsText: 'Digite o nome corretamente',
                    shouldSort: false,
                    shouldSortItems: false,
                    position: 'bottom',
                });

                // Add event listener for category change
                categorySelect.addEventListener('change', () => this.onQuestionCategoryChange());
            }
        } catch (error) {
            console.error('Error loading categories for questions:', error);
        }
    }

    async onQuestionCategoryChange() {
        const categorySelect = document.getElementById("questionCategory");
        const subcategoryGroup = document.getElementById("questionSubcategoryGroup");
        const subcategorySelect = document.getElementById("questionSubcategory");
        
        if (!categorySelect || !subcategoryGroup || !subcategorySelect) return;

        const selectedCategory = categorySelect.value;
        
        if (!selectedCategory) {
            // Hide subcategory group
            subcategoryGroup.style.display = "none";
            subcategorySelect.innerHTML = '<option value="">Selecione uma subcategoria (opcional)</option>';
            if (this.questionSubcategoryChoices) {
                this.questionSubcategoryChoices.destroy();
                this.questionSubcategoryChoices = null;
            }
            return;
        }

        try {
            // Load subcategories for selected category
            const subcategories = await window.databaseManager.getSubcategories(selectedCategory);
            
            if (this.questionSubcategoryChoices) {
                this.questionSubcategoryChoices.destroy();
            }
            subcategorySelect.innerHTML = '<option value="">Selecione uma subcategoria (opcional)</option>';
            
            if (subcategories && Object.keys(subcategories).length > 0) {
                const sortedSubcategories = Object.entries(subcategories).sort(([,a], [,b]) => a.name.localeCompare(b.name));

                sortedSubcategories.forEach(([id, subcategory]) => {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = subcategory.name;
                    subcategorySelect.appendChild(option);
                });
                
                this.questionSubcategoryChoices = new Choices(subcategorySelect, {
                    searchEnabled: true,
                    itemSelectText: 'Pressione para selecionar',
                    noResultsText: 'Digite o nome corretamente',
                    shouldSort: false,
                    shouldSortItems: false,
                    position: 'bottom',
                });

                // Show subcategory group
                subcategoryGroup.style.display = "block";
            } else {
                // Hide subcategory group if no subcategories
                subcategoryGroup.style.display = "none";
                this.questionSubcategoryChoices = null;
            }
        } catch (error) {
            console.error('Error loading subcategories for questions:', error);
            subcategoryGroup.style.display = "none";
        }
    }

    updateCategoriesList(categories) {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;

        categoriesList.innerHTML = '';

        if (!categories || Object.keys(categories).length === 0) {
            categoriesList.innerHTML = '<li class="no-categories">Nenhuma categoria encontrada</li>';
            return;
        }

        Object.entries(categories).forEach(([id, category]) => {
            const li = document.createElement('li');
            li.className = 'category-item';
            li.innerHTML = `
           
                <span class="category-name">${category.name}</span>
                <button class="btn-delete" data-category-id="${id}">
                    Excluir
                </button>
                
            `;
            categoriesList.appendChild(li);

            // Attach event listener using addEventListener
            li.querySelector('.btn-delete').addEventListener('click', (e) => {
                const categoryIdToDelete = e.target.dataset.categoryId;
                this.deleteCategory(categoryIdToDelete);
            });
        });
    }

    async loadCategoriesForSubcategories() {
        try {
            const categories = await window.databaseManager.getCategories();
            const categorySelect = document.getElementById('subcategoryParentCategory');
            
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
                
                Object.entries(categories || {}).forEach(([id, category]) => {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading categories for subcategories:', error);
        }
    }

    async loadSubcategories() {
        try {
            const categories = await window.databaseManager.getCategories();
            this.updateSubcategoriesList(categories);
        } catch (error) {
            console.error('Error loading subcategories:', error);
            window.uiManager.showModal('Erro', 'Erro ao carregar subcategorias.');
        }
    }

    updateSubcategoriesList(categories) {
        const subcategoriesList = document.getElementById('subcategoriesList');
        if (!subcategoriesList) return;

        subcategoriesList.innerHTML = '';

        if (!categories || Object.keys(categories).length === 0) {
            subcategoriesList.innerHTML = '<p class="no-subcategories">Nenhuma categoria encontrada</p>';
            return;
        }

        Object.entries(categories).forEach(([categoryId, category]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-subcategories';
            
            const categoryHeader = document.createElement('h5');
            categoryHeader.textContent = category.name;
            categoryDiv.appendChild(categoryHeader);

            const subcategoriesUl = document.createElement('ul');
            subcategoriesUl.className = 'subcategories-list';

            if (category.subcategories && Object.keys(category.subcategories).length > 0) {
                Object.entries(category.subcategories).forEach(([subcategoryId, subcategory]) => {
                    const li = document.createElement('li');
                    li.className = 'subcategory-item';
                    li.innerHTML = `
                     <div class="sub-category-item">
                        <span class="subcategory-name">${subcategory.name}</span>
                        
                        <button class="btn-delete" data-category-id="${categoryId}" data-subcategory-id="${subcategoryId}">
                            Excluir
                        </button>
                     </div>
                    `;
                    subcategoriesUl.appendChild(li);

                    // Attach event listener using addEventListener
                    li.querySelector('.btn-delete').addEventListener('click', (e) => {
                        const catId = e.target.dataset.categoryId;
                        const subcatId = e.target.dataset.subcategoryId;
                        this.deleteSubcategory(catId, subcatId);
                    });
                });
            } else {
                const li = document.createElement('li');
                li.className = 'no-subcategories';
                li.textContent = 'Nenhuma subcategoria encontrada';
                subcategoriesUl.appendChild(li);
            }

            categoryDiv.appendChild(subcategoriesUl);
            subcategoriesList.appendChild(categoryDiv);
        });
    }

    async handleSubcategorySubmit(e) {
        e.preventDefault();

        // Check if user is admin
        if (!window.authManager.isUserAdmin()) {
            window.uiManager.showModal('Acesso Negado', 'Apenas administradores podem adicionar subcategorias.');
            return;
        }

        try {
            const categoryId = document.getElementById('subcategoryParentCategory').value;
            const subcategoryName = document.getElementById('subcategoryName').value.trim();
            
            if (!categoryId) {
                window.uiManager.showModal('Erro', 'Selecione uma categoria principal.');
                return;
            }

            if (!subcategoryName) {
                window.uiManager.showModal('Erro', 'Nome da subcategoria é obrigatório.');
                return;
            }

            // Check if subcategory already exists in this category
            const existingSubcategories = await window.databaseManager.getSubcategories(categoryId);
            const subcategoryExists = Object.values(existingSubcategories || {}).some(
                subcat => subcat.name.toLowerCase() === subcategoryName.toLowerCase()
            );

            if (subcategoryExists) {
                window.uiManager.showModal('Erro', 'Já existe uma subcategoria com este nome nesta categoria.');
                return;
            }

            // Add subcategory
            window.uiManager.showLoading();
            await window.databaseManager.addSubcategory(categoryId, { name: subcategoryName });
            window.uiManager.hideLoading();
            
            // Show success message
            window.uiManager.showModal('Sucesso', 'Subcategoria adicionada com sucesso!', 'success');
            
            // Reset form and reload subcategories
            document.getElementById('subcategoryForm').reset();
            this.loadSubcategories();
            
        } catch (error) {
            window.uiManager.hideLoading();
            console.error('Error adding subcategory:', error);
            window.uiManager.showModal('Erro', error.message || 'Erro ao adicionar subcategoria.');
        }
    }

    async deleteSubcategory(categoryId, subcategoryId) {
        // Check if user is admin
        if (!window.authManager.isUserAdmin()) {
            window.uiManager.showModal('Acesso Negado', 'Apenas administradores podem excluir subcategorias.');
            return;
        }

        // Show confirmation dialog
        window.uiManager.showModal(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir esta subcategoria? Esta ação não pode ser desfeita.',
            'warning',
            true, // showConfirmButton
            async () => { // onConfirm callback
                try {
                    window.uiManager.hideModal();
                    window.uiManager.showLoading();
                    
                    await window.databaseManager.deleteSubcategory(categoryId, subcategoryId);
                    
                    window.uiManager.hideLoading();
                    window.uiManager.showModal('Sucesso', 'Subcategoria excluída com sucesso!', 'success');
                    
                    // Reload subcategories
                    this.loadSubcategories();
                    
                } catch (error) {
                    window.uiManager.hideLoading();
                    console.error('Error deleting subcategory:', error);
                    window.uiManager.showModal('Erro', 'Erro ao excluir subcategoria.');
                }
            },
            () => { // onCancel callback
                window.uiManager.hideModal();
            }
        );
    }

    async handleQuestionSubmit(e) {
        e.preventDefault();

        // Check if user is admin
        if (!window.authManager.isUserAdmin()) {
            window.uiManager.showModal('Acesso Negado', 'Apenas administradores podem adicionar questões.');
            return;
        }

        try {
            // Get form data
            const formData = this.getQuestionFormData();
            
            // Validate data
            window.databaseManager.validateQuestionData(formData);
            
            // Save question
            window.uiManager.showLoading();
            await window.databaseManager.addQuestion(formData);
            window.uiManager.hideLoading();
            
            // Show success message
            window.uiManager.showModal('Sucesso', 'Questão adicionada com sucesso!', 'success');
            
            // Reset form
            this.resetQuestionForm();
            
        } catch (error) {
            window.uiManager.hideLoading();
            console.error('Error adding question:', error);
            window.uiManager.showModal('Erro', error.message || 'Erro ao adicionar questão.');
        }
    }

    getQuestionFormData() {
        const category = document.getElementById('questionCategory').value;
        const subcategory = document.getElementById('questionSubcategory').value;
        const type = document.getElementById('questionType').value;
        const text = this.richEditor.innerHTML;
        const comment = document.getElementById('questionComment').value;
        
        // Get alternatives
        const alternativeInputs = document.querySelectorAll('.alternative-item input[type="text"]');
        const alternatives = Array.from(alternativeInputs).map(input => input.value.trim());
        
        // Get correct answer
        const correctAnswerRadio = document.querySelector('input[name="correctAnswer"]:checked');
        const correctAnswer = correctAnswerRadio ? parseInt(correctAnswerRadio.value) : null;
        
        const questionData = {
            category,
            type,
            text,
            alternatives,
            correctAnswer,
            comment: comment.trim(),
            createdBy: window.authManager.getCurrentUser().uid
        };

        // Add subcategory if selected
        if (subcategory) {
            questionData.subcategory = subcategory;
        }
        
        return questionData;
    }

    resetQuestionForm() {
        const form = document.getElementById('questionForm');
        if (form) {
            form.reset();
            this.richEditor.innerHTML = '';
        }
    }

    async handleCategorySubmit(e) {
        e.preventDefault();

        // Check if user is admin
        if (!window.authManager.isUserAdmin()) {
            window.uiManager.showModal('Acesso Negado', 'Apenas administradores podem adicionar categorias.');
            return;
        }

        try {
            const categoryName = document.getElementById('categoryName').value.trim();
            
            if (!categoryName) {
                window.uiManager.showModal('Erro', 'Nome da categoria é obrigatório.');
                return;
            }

            // Check if category already exists
            const existingCategories = await window.databaseManager.getCategories();
            const categoryExists = Object.values(existingCategories || {}).some(
                cat => cat.name.toLowerCase() === categoryName.toLowerCase()
            );

            if (categoryExists) {
                window.uiManager.showModal('Erro', 'Já existe uma categoria com este nome.');
                return;
            }

            // Add category
            window.uiManager.showLoading();
            await window.databaseManager.addCategory({ name: categoryName });
            window.uiManager.hideLoading();
            
            // Show success message
            window.uiManager.showModal('Sucesso', 'Categoria adicionada com sucesso!', 'success');
            
            // Reset form and reload categories
            document.getElementById('categoryForm').reset();
            this.loadCategories();
            this.loadCategoriesForQuestions();
            
        } catch (error) {
            window.uiManager.hideLoading();
            console.error('Error adding category:', error);
            window.uiManager.showModal('Erro', error.message || 'Erro ao adicionar categoria.');
        }
    }

    async deleteCategory(categoryId) {
        // Check if user is admin
        if (!window.authManager.isUserAdmin()) {
            window.uiManager.showModal('Acesso Negado', 'Apenas administradores podem excluir categorias.');
            return;
        }

        // Show confirmation dialog
        window.uiManager.showModal(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.',
            'warning',
            true, // showConfirmButton
            async () => { // onConfirm callback
                try {
                    window.uiManager.hideModal();
                    window.uiManager.showLoading();
                    
                    await window.databaseManager.deleteCategory(categoryId);
                    
                    window.uiManager.hideLoading();
                    window.uiManager.showModal('Sucesso', 'Categoria excluída com sucesso!', 'success');
                    
                    // Reload categories
                    this.loadCategories();
                    this.loadCategoriesForQuestions();
                    
                } catch (error) {
                    window.uiManager.hideLoading();
                    console.error('Error deleting category:', error);
                    window.uiManager.showModal('Erro', 'Erro ao excluir categoria.');
                }
            },
            () => { // onCancel callback
                window.uiManager.hideModal();
            }
        );
    }

    async loadCategoriesForFilters() {
        try {
            const categories = await window.databaseManager.getCategories();
            const categorySelect = document.getElementById('filterCategory');
            
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Todas as categorias</option>';
                
                Object.entries(categories || {}).forEach(([id, category]) => {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });

                // Add event listener for category change
                categorySelect.addEventListener('change', () => this.onFilterCategoryChange());
            }
        } catch (error) {
            console.error('Error loading categories for filters:', error);
        }
    }

    async onFilterCategoryChange() {
        const categorySelect = document.getElementById('filterCategory');
        const subcategoryGroup = document.getElementById('filterSubcategoryGroup');
        const subcategorySelect = document.getElementById('filterSubcategory');
        
        if (!categorySelect || !subcategoryGroup || !subcategorySelect) return;

        const selectedCategory = categorySelect.value;
        
        if (!selectedCategory) {
            // Hide subcategory group
            subcategoryGroup.style.display = 'none';
            subcategorySelect.innerHTML = '<option value="">Todas as subcategorias</option>';
            return;
        }

        try {
            // Load subcategories for selected category
            const subcategories = await window.databaseManager.getSubcategories(selectedCategory);
            
            subcategorySelect.innerHTML = '<option value="">Todas as subcategorias</option>';
            
            if (subcategories && Object.keys(subcategories).length > 0) {
                Object.entries(subcategories).forEach(([id, subcategory]) => {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = subcategory.name;
                    subcategorySelect.appendChild(option);
                });
                
                // Show subcategory group
                subcategoryGroup.style.display = 'block';
            } else {
                // Hide subcategory group if no subcategories
                subcategoryGroup.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading subcategories for filters:', error);
            subcategoryGroup.style.display = 'none';
        }
    }

    async applyQuestionFilters() {
        try {
            const category = document.getElementById('filterCategory').value;
            const subcategory = document.getElementById('filterSubcategory').value;
            const type = document.getElementById('filterType').value;

            const filters = {};
            if (category) filters.category = category;
            if (subcategory) filters.subcategory = subcategory;
            if (type) filters.type = type;

            window.uiManager.showLoading();
            const questions = await window.databaseManager.getQuestions(filters);
            window.uiManager.hideLoading();

            this.displayQuestionsList(questions);
        } catch (error) {
            window.uiManager.hideLoading();
            console.error('Error applying question filters:', error);
            window.uiManager.showModal('Erro', 'Erro ao filtrar questões.');
        }
    }

    clearQuestionFilters() {
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterSubcategory').value = '';
        document.getElementById('filterType').value = '';
        document.getElementById('filterSubcategoryGroup').style.display = 'none';
        
        const questionsListContainer = document.getElementById('questionsListContainer');
        if (questionsListContainer) {
            questionsListContainer.innerHTML = '<p class="no-questions">Clique em "Aplicar Filtros" para carregar as questões</p>';
        }
    }

    displayQuestionsList(questions) {
        const questionsListContainer = document.getElementById('questionsListContainer');
        if (!questionsListContainer) return;

        if (!questions || questions.length === 0) {
            questionsListContainer.innerHTML = '<p class="no-questions">Nenhuma questão encontrada com os filtros aplicados</p>';
            return;
        }

        questionsListContainer.innerHTML = '';

        questions.forEach((question) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            
            // Get category and subcategory names
            const categoryName = this.getCategoryName(question.category);
            const subcategoryName = question.subcategory ? this.getSubcategoryName(question.category, question.subcategory) : 'Sem subcategoria';
            
            questionDiv.innerHTML = `
            <div class="question-container">
                <div class="question-header">
                    <h5>Questão ${question.id}</h5>
                    <div class="question-meta">
                        <span class="category-tag">${categoryName}</span>
                        <span class="subcategory-tag">${subcategoryName}</span>
                        <span class="type-tag">${question.type === 'new' ? 'Inédita' : 'Banca Anterior'}</span>
                    </div>
                </div>
                <div class="question-preview">
                    ${this.truncateText(question.text, 150)}
                </div>
                <div class="question-actions">
                    <button class="btn-primary" data-question-id="${question.id}" data-action="edit">
                        Editar
                    </button>
                    
                    <button class="btn-delete" data-question-id="${question.id}" data-action="delete">
                        Excluir
                    </button>
                </div>
            </div>
            `;
            
            questionsListContainer.appendChild(questionDiv);

            // Attach event listeners using addEventListener
            questionDiv.querySelector('button[data-action="edit"]').addEventListener('click', (e) => {
                const questionIdToEdit = e.target.dataset.questionId;
                this.editQuestion(questionIdToEdit);
            });
            questionDiv.querySelector('button[data-action="delete"]').addEventListener('click', (e) => {
                const questionIdToDelete = e.target.dataset.questionId;
                this.deleteQuestion(questionIdToDelete);
            });
        });
    }

    getCategoryName(categoryId) {
        // This would need to be implemented to get category name from ID
        return 'Categoria'; // Placeholder
    }

    getSubcategoryName(categoryId, subcategoryId) {
        // This would need to be implemented to get subcategory name from ID
        return 'Subcategoria'; // Placeholder
    }

    truncateText(text, maxLength) {
        const plainText = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
        if (plainText.length <= maxLength) return plainText;
        return plainText.substring(0, maxLength) + '...';
    }

    async editQuestion(questionId) {
        // Implementation for editing questions
        window.uiManager.showModal('Em desenvolvimento', 'Funcionalidade de edição em desenvolvimento.');
    }

    async deleteQuestion(questionId) {
        // Check if user is admin
        if (!window.authManager.isUserAdmin()) {
            window.uiManager.showModal('Acesso Negado', 'Apenas administradores podem excluir questões.');
            return;
        }

        // Show confirmation dialog
        window.uiManager.showModal(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita.',
            'warning',
            true, // showConfirmButton
            async () => { // onConfirm callback
                try {
                    window.uiManager.hideModal();
                    window.uiManager.showLoading();
                    
                    await window.databaseManager.deleteQuestion(questionId);
                    
                    window.uiManager.hideLoading();
                    window.uiManager.showModal('Sucesso', 'Questão excluída com sucesso!', 'success');
                    
                    // Reload questions list
                    this.applyQuestionFilters();
                    
                } catch (error) {
                    window.uiManager.hideLoading();
                    console.error('Error deleting question:', error);
                    window.uiManager.showModal('Erro', 'Erro ao excluir questão.');
                }
            },
            () => { // onCancel callback
                window.uiManager.hideModal();
            }
        );
    }

    // Initialize admin panel when screen is shown
    onAdminScreenShown() {
        // Check if user is admin
        if (!window.authManager.isUserAdmin()) {
            window.uiManager.showModal('Acesso Negado', 'Você não tem permissão para acessar esta área.');
            window.uiManager.showScreen('main-menu-screen');
            return;
        }

        // Load initial data
        this.loadCategoriesForQuestions();
        if (this.currentTab === 'categories') {
            this.loadCategories();
            this.loadCategoriesForSubcategories();
            this.loadSubcategories();
        }
    }

    // Utility methods for rich text editor
    getEditorPlainText() {
        return this.richEditor.textContent || this.richEditor.innerText || '';
    }

    setEditorContent(html) {
        if (this.richEditor) {
            this.richEditor.innerHTML = html;
        }
    }

    clearEditor() {
        if (this.richEditor) {
            this.richEditor.innerHTML = '';
        }
    }
}

// Initialize Admin Manager
window.adminManager = new AdminManager();



