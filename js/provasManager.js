class ProvasManager {
    constructor() {
        this.db = firebase.database();
        this.categories = {};
        this.choicesCategory = null;
        this.choicesSubcategory = null;
        this.init();
    }

    async init() {
        console.log("📚 ProvasManager inicializado");

        await this.loadCategories(); // Carregar categorias ao iniciar

        // Inicializar Choices.js nos selects de categoria/subcategoria
        const categorySelect = document.getElementById("question-category");
        const subcategorySelect = document.getElementById("question-subcategory");

        if (categorySelect) {
            this.choicesCategory = new Choices(categorySelect, {
                searchEnabled: true,
                itemSelectText: '',
                placeholder: true,
                placeholderValue: 'Selecione a categoria...'
            });

            categorySelect.addEventListener("change", (e) => {
                this.loadSubcategories(e.target.value, "question-subcategory");
            });
        }

        if (subcategorySelect) {
            this.choicesSubcategory = new Choices(subcategorySelect, {
                searchEnabled: true,
                itemSelectText: '',
                placeholder: true,
                placeholderValue: 'Selecione a subcategoria...'
            });
        }

        // Listener para criar prova
        const createExamForm = document.getElementById("create-exam-form");
        if (createExamForm) {
            createExamForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.criarProva(new FormData(createExamForm));
            });
        }

        // Listener para adicionar questão
        const addQuestionForm = document.getElementById("add-question-form");
        if (addQuestionForm) {
            addQuestionForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.adicionarQuestao(new FormData(addQuestionForm));
            });
        }
    }

    async loadCategories() {
        try {
            const snapshot = await this.db.ref("categories").once("value");
            this.categories = snapshot.val() || {};

            const categorySelects = ["exam-discipline", "question-category"];
            categorySelects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    // Limpar opções existentes, exceto a primeira
                    while (select.children.length > 1) {
                        select.removeChild(select.lastChild);
                    }

                    Object.entries(this.categories).forEach(([id, category]) => {
                        const option = document.createElement("option");
                        option.value = id;
                        option.textContent = category.name;
                        select.appendChild(option);
                    });
                }
            });

            // Atualizar Choices.js, se existir
            if (this.choicesCategory) this.choicesCategory.setChoices(Object.entries(this.categories).map(([id, cat]) => ({
                value: id,
                label: cat.name
            })), 'value', 'label', true);

        } catch (error) {
            console.error("❌ Erro ao carregar categorias:", error);
        }
    }

    async loadSubcategories(categoryId, subcategorySelectId) {
        const select = document.getElementById(subcategorySelectId);
        if (!select || !categoryId) return;

        // Limpar opções existentes, exceto a primeira
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        try {
            const snapshot = await this.db.ref(`categories/${categoryId}/subcategories`).once("value");
            const subcategories = snapshot.val() || {};

            Object.entries(subcategories).forEach(([id, subcategory]) => {
                const option = document.createElement("option");
                option.value = id;
                option.textContent = subcategory.name;
                select.appendChild(option);
            });

            // Atualizar Choices.js
            if (this.choicesSubcategory) this.choicesSubcategory.setChoices(Object.entries(subcategories).map(([id, sub]) => ({
                value: id,
                label: sub.name
            })), 'value', 'label', true);

        } catch (error) {
            console.error("❌ Erro ao carregar subcategorias:", error);
        }
    }

    async criarProva(formData) {
        try {
            const prova = {
                nome: formData.get("exam-name"),
                disciplina: formData.get("exam-discipline"),
                categoria: formData.get("exam-category") || null,
                subcategoria: formData.get("exam-subcategory") || null,
                data: formData.get("exam-date"),
                criadaEm: Date.now()
            };

            const ref = await this.db.ref("provas").push(prova);
            console.log("✅ Prova criada:", ref.key);

        } catch (error) {
            console.error("❌ Erro ao criar prova:", error);
            alert("Erro ao criar prova!");
        }
    }

   async adicionarQuestao(formData) {
    try {
        const enunciado = formData.get("question-text")?.trim();
        const alternativas = [
            formData.get("option-a")?.trim(),
            formData.get("option-b")?.trim(),
            formData.get("option-c")?.trim(),
            formData.get("option-d")?.trim()
        ];
        const respostaCorreta = formData.get("correct-answer");
        const categoria = formData.get("question-category");
        const subcategoria = formData.get("question-subcategory");

        // 🔎 Validações
        if (!enunciado) {
            alert("Erro: o enunciado da questão é obrigatório.");
            return;
        }

        if (alternativas.some(alt => !alt)) {
            alert("Erro: todas as alternativas devem ser preenchidas.");
            return;
        }

        if (!respostaCorreta) {
            alert("Erro: selecione a resposta correta.");
            return;
        }

        if (!categoria) {
            alert("Erro: selecione a categoria da questão.");
            return;
        }

        const questao = {
            enunciado,
            categoria,
            subcategoria: subcategoria || null,
            alternativas,
            respostaCorreta,
            criadaEm: Date.now()
        };

        const ref = await this.db.ref("questoes").push(questao);
        console.log("✅ Questão adicionada:", ref.key);
        alert("Questão adicionada com sucesso!");

        // 🔄 Opcional: limpar formulário após salvar
        document.getElementById("add-question-form").reset();

    } catch (error) {
        console.error("❌ Erro ao adicionar questão:", error);
        alert("Erro ao adicionar questão!");
    }
}

}

// Inicializar automaticamente
document.addEventListener("DOMContentLoaded", () => {
    window.provasManager = new ProvasManager();
});
