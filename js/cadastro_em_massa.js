/**
 * Cadastro em Massa - Gerenciador de Upload e Processamento de Questões via CSV
 * Responsável por: leitura de CSV, parsing, validação, preview e cadastro em massa no Firebase
 */

class CadastroEmMassa {
    constructor() {
        this.db = firebase.database();
        this.questoes = [];
        this.questoesSelecionadas = [];
        this.init();
    }

    init() {
        console.log("📚 Cadastro em Massa inicializado");
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Upload Screen
        document.getElementById("upload-btn").addEventListener("click", () => this.handleFileUpload());
        document.getElementById("csv-file-input").addEventListener("change", (e) => this.handleFileSelect(e));
        document.getElementById("back-to-main-menu-btn").addEventListener("click", () => this.goToMainMenu());

        // Preview Screen
        document.getElementById("back-to-upload-btn").addEventListener("click", () => this.backToUpload());
        document.getElementById("select-all-btn").addEventListener("click", () => this.selectAllQuestions());
        document.getElementById("deselect-all-btn").addEventListener("click", () => this.deselectAllQuestions());
        document.getElementById("save-all-btn").addEventListener("click", () => this.saveQuestoes());
        document.getElementById("cancel-preview-btn").addEventListener("click", () => this.backToUpload());

        // Success Screen
        document.getElementById("back-to-upload-after-success-btn").addEventListener("click", () => this.resetAndBackToUpload());
        document.getElementById("back-to-main-menu-after-success-btn").addEventListener("click", () => this.goToMainMenu());
    }

    /**
     * Manipula a seleção do arquivo CSV
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            console.log("📄 Arquivo selecionado:", file.name);
        }
    }

    /**
     * Processa o upload do arquivo CSV
     */
    async handleFileUpload() {
        const fileInput = document.getElementById("csv-file-input");
        const file = fileInput.files[0];

        if (!file) {
            alert("Por favor, selecione um arquivo CSV.");
            return;
        }

        if (!file.name.endsWith(".csv")) {
            alert("Por favor, selecione um arquivo CSV válido.");
            return;
        }

        try {
            this.showLoadingState();
            const csvContent = await this.readFileAsText(file);
            this.questoes = this.parseCSV(csvContent);

            if (this.questoes.length === 0) {
                alert("Nenhuma questão foi encontrada no arquivo CSV.");
                this.hideLoadingState();
                return;
            }

            console.log(`✅ ${this.questoes.length} questões carregadas do CSV`);
            this.questoesSelecionadas = this.questoes.map((_, index) => index);
            this.showPreviewScreen();
            this.hideLoadingState();
        } catch (error) {
            console.error("❌ Erro ao processar arquivo:", error);
            alert("Erro ao processar arquivo CSV: " + error.message);
            this.hideLoadingState();
        }
    }

    /**
     * Lê o arquivo como texto
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error("Erro ao ler arquivo"));
            reader.readAsText(file);
        });
    }

    /**
     * Faz o parsing do CSV
     * Esperado: ID,Enunciado,Alternativa A,Alternativa B,Alternativa C,Alternativa D,Alternativa E,Ano,Banca,Órgão,Prova,Alt_Correta,TextAssociado,Comentario
     */
    parseCSV(csvContent) {
        const lines = csvContent.split("\n").filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error("Arquivo CSV vazio ou inválido");
        }

        const headers = this.parseCSVLine(lines[0]);
        console.log("📋 Headers encontrados:", headers);

        const questoes = [];

        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this.parseCSVLine(lines[i]);
                
                    // O CSV agora tem 17 colunas (12 + 5 novas)
                    if (values.length < 17) {
                    console.warn(`⚠️ Linha ${i + 1} ignorada: dados insuficientes`);
                    continue;
                }

                    const questao = {
                        id: values[0]?.trim(),
                        enunciado: values[1]?.trim(),
                        alternativaA: values[2]?.trim(),
                        alternativaB: values[3]?.trim(),
                        alternativaC: values[4]?.trim(),
                        alternativaD: values[5]?.trim(),
                        alternativaE: values[6]?.trim(),
                        ano: values[7]?.trim(),
                        banca: values[8]?.trim(),
                        orgao: values[9]?.trim(),
                        prova: values[10]?.trim(),
                        altCorreta: values[11]?.trim().toLowerCase(),
                        textAssociado: values[12]?.trim() || "",
                        comentario: values[13]?.trim() || "",
                        // Novas colunas adicionadas
                        categoria: values[14]?.trim() || "",
                        subcategoria: values[15]?.trim() || "",
                        tipo: values[16]?.trim() || "previous" // Inedita/BancaAnterior
                    };

                // Validações básicas
                if (!questao.id || !questao.enunciado || !questao.altCorreta) {
                    console.warn(`⚠️ Linha ${i + 1} ignorada: campos obrigatórios faltando`);
                    continue;
                }

                questoes.push(questao);
            } catch (error) {
                console.warn(`⚠️ Erro ao processar linha ${i + 1}:`, error.message);
                continue;
            }
        }

        return questoes;
    }

    /**
     * Faz o parsing de uma linha CSV respeitando aspas
     */
    parseCSVLine(line) {
        const result = [];
        let current = "";
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === "," && !insideQuotes) {
                result.push(current);
                current = "";
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    }

    /**
     * Exibe a tela de preview das questões
     */
    showPreviewScreen() {
        this.hideAllScreens();
        document.getElementById("preview-screen").classList.add("active");
        document.getElementById("total-questions").textContent = this.questoes.length;
        this.renderQuestionsPreview();
    }

    /**
     * Renderiza o preview das questões
     */
    renderQuestionsPreview() {
        const container = document.getElementById("questions-preview-container");
        container.innerHTML = "";

        this.questoes.forEach((questao, index) => {
            const card = this.createQuestionCard(questao, index);
            container.appendChild(card);
        });
    }

    /**
     * Cria um card de questão para o preview
     */
    createQuestionCard(questao, index) {
        const card = document.createElement("div");
        card.className = "question-card";
        card.id = `question-card-${index}`;
        card.dataset.index = index;

        const isSelected = this.questoesSelecionadas.includes(index);
        if (!isSelected) {
            card.classList.add("unchecked");
        }

        // Mapear letra para alternativa
        const alternativaMap = {
            "a": questao.alternativaA,
            "b": questao.alternativaB,
            "c": questao.alternativaC,
            "d": questao.alternativaD,
            "e": questao.alternativaE
        };

        // Criar HTML do card
        card.innerHTML = `
            <div class="question-card-header">
                <input type="checkbox" class="question-checkbox" ${isSelected ? "checked" : ""} data-index="${index}">
                <div style="flex: 1;">
                    <div class="question-number">Questão #${index + 1}</div>
                    <div class="question-metadata">
                        <span class="metadata-tag">ID: ${questao.id}</span>
                        <span class="metadata-tag">Ano: ${questao.ano}</span>
                        <span class="metadata-tag">Banca: ${questao.banca}</span>
                    </div>
                </div>
            </div>

            <div class="question-enunciado">
                ${this.sanitizeHTML(questao.enunciado)}
            </div>

            <div class="question-alternatives">
                ${this.renderAlternatives(questao, alternativaMap)}
            </div>

            ${this.renderAdditionalInfo(questao)}
        `;

        // Adicionar listener ao checkbox
        card.querySelector(".question-checkbox").addEventListener("change", (e) => {
            this.toggleQuestionSelection(index, e.target.checked);
        });

        return card;
    }

    /**
     * Renderiza as alternativas da questão
     */
    renderAlternatives(questao, alternativaMap) {
        const letras = ["a", "b", "c", "d", "e"];
        return letras.map(letra => {
            const texto = alternativaMap[letra];
            const isCorrect = questao.altCorreta === letra;
            const className = isCorrect ? "alternative correct" : "alternative";
            
            return `
                <div class="${className}">
                    <span class="alternative-letter">${letra.toUpperCase()})</span>
                    <span class="alternative-text">
                        ${this.sanitizeHTML(texto)}
                        ${isCorrect ? '<span class="correct-answer-badge">✓ Resposta Correta</span>' : ''}
                    </span>
                </div>
            `;
        }).join("");
    }

    /**
     * Renderiza informações adicionais da questão
     */
    renderAdditionalInfo(questao) {
        let html = '<div class="question-additional">';

	        // Novas informações: Categoria, Subcategoria e Tipo
	        if (questao.categoria) {
	            html += `
	                <div class="additional-item">
	                    <strong>Categoria (ID):</strong>
	                    <p>${this.sanitizeHTML(questao.categoria)}</p>
	                </div>
	            `;
	        }

	        if (questao.subcategoria) {
	            html += `
	                <div class="additional-item">
	                    <strong>Subcategoria (ID):</strong>
	                    <p>${this.sanitizeHTML(questao.subcategoria)}</p>
	                </div>
	            `;
	        }

	        if (questao.tipo) {
	            const tipoDisplay = questao.tipo === 'banca' ? 'Banca Anterior' : 'Inédita';
	            html += `
	                <div class="additional-item">
	                    <strong>Tipo:</strong>
	                    <p>${tipoDisplay}</p>
	                </div>
	            `;
	        }
	        
	        // Informações existentes
	        if (questao.orgao) {
	            html += `
	                <div class="additional-item">
	                    <strong>Órgão:</strong>
	                    <p>${this.sanitizeHTML(questao.orgao)}</p>
	                </div>
	            `;
	        }

	        if (questao.prova) {
	            html += `
	                <div class="additional-item">
	                    <strong>Prova:</strong>
	                    <p>${this.sanitizeHTML(questao.prova)}</p>
	                </div>
	            `;
	        }

        if (questao.textAssociado) {
            html += `
                <div class="additional-item">
                    <strong>Texto Associado:</strong>
                    <p>${this.sanitizeHTML(questao.textAssociado)}</p>
                </div>
            `;
        }

        if (questao.comentario) {
            html += `
                <div class="additional-item">
                    <strong>Comentário:</strong>
                    <p>${this.sanitizeHTML(questao.comentario)}</p>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    /**
     * Sanitiza HTML para evitar XSS
     */
    sanitizeHTML(text) {
        if (!text) return "";
        
        const div = document.createElement("div");
        div.textContent = text;
        let html = div.innerHTML;
        
        // Permitir quebras de linha
        html = html.replace(/\n/g, "<br>");
        
        // Permitir tags HTML básicas (p, br, strong, em, etc)
        html = html.replace(/&lt;p&gt;/g, "<p>").replace(/&lt;\/p&gt;/g, "</p>");
        html = html.replace(/&lt;br&gt;/g, "<br>").replace(/&lt;br\/&gt;/g, "<br>");
        html = html.replace(/&lt;strong&gt;/g, "<strong>").replace(/&lt;\/strong&gt;/g, "</strong>");
        html = html.replace(/&lt;em&gt;/g, "<em>").replace(/&lt;\/em&gt;/g, "</em>");
        html = html.replace(/&lt;img /g, "<img ");
        
        return html;
    }

    /**
     * Alterna a seleção de uma questão
     */
    toggleQuestionSelection(index, isSelected) {
        if (isSelected) {
            if (!this.questoesSelecionadas.includes(index)) {
                this.questoesSelecionadas.push(index);
            }
        } else {
            this.questoesSelecionadas = this.questoesSelecionadas.filter(i => i !== index);
        }

        const card = document.getElementById(`question-card-${index}`);
        if (isSelected) {
            card.classList.remove("unchecked");
        } else {
            card.classList.add("unchecked");
        }
    }

    /**
     * Seleciona todas as questões
     */
    selectAllQuestions() {
        this.questoesSelecionadas = this.questoes.map((_, index) => index);
        this.questoes.forEach((_, index) => {
            const checkbox = document.querySelector(`input[data-index="${index}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
            const card = document.getElementById(`question-card-${index}`);
            if (card) {
                card.classList.remove("unchecked");
            }
        });
    }

    /**
     * Desseleciona todas as questões
     */
    deselectAllQuestions() {
        this.questoesSelecionadas = [];
        this.questoes.forEach((_, index) => {
            const checkbox = document.querySelector(`input[data-index="${index}"]`);
            if (checkbox) {
                checkbox.checked = false;
            }
            const card = document.getElementById(`question-card-${index}`);
            if (card) {
                card.classList.add("unchecked");
            }
        });
    }

    /**
     * Salva as questões selecionadas no Firebase
     */
    async saveQuestoes() {
         alert("Por favor, selecione pelo menos uma questão para salvar.");
        if (this.questoesSelecionadas.length === 0) {
            alert("Por favor, selecione pelo menos uma questão para salvar.");
            return;
        }

        try {
            this.showLoadingState();

            let sucessos = 0;
            let erros = 0;

            for (const index of this.questoesSelecionadas) {
                const questao = this.questoes[index];
                try {
                    await this.saveQuestaoToFirebase(questao);
                    sucessos++;
                } catch (error) {
                    console.error(`❌ Erro ao salvar questão ${questao.id}:`, error);
                    erros++;
                }
            }

            this.hideLoadingState();
            this.showSuccessScreen(sucessos, erros);
        } catch (error) {
            console.error("❌ Erro ao salvar questões:", error);
            alert("Erro ao salvar questões: " + error.message);
            this.hideLoadingState();
        }
    }

    /**
     * Salva uma questão individual no Firebase
     */
    async saveQuestaoToFirebase(questao) {
        const questaoData = {
            alternatives: [
                questao.alternativaA,
                questao.alternativaB,
                questao.alternativaC,
                questao.alternativaD,
                questao.alternativaE
            ],
            category: questao.categoria, 
            comment: questao.comentario || "",
            correctAnswer: this.convertLetraToIndex(questao.altCorreta),
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            createdBy: questao.id,
            subcategory: questao.subcategoria ||  "",
            associatedText: questao.textAssociado ||  "",
            text: questao.enunciado,
            type: questao.tipo, // Deve ser "inedita" ou "banca"
           

         
            ano: questao.ano,
            banca: questao.banca,
            orgao: questao.orgao,
            prova: questao.prova,
          
      
        };

        const ref = this.db.ref("questions").push();
        await ref.set(questaoData);
        console.log(`✅ Questão ${questao.id} salva com sucesso`);
        return ref.key;
    }

    /**
     * Converte letra (a, b, c, d, e) para índice (0, 1, 2, 3, 4)
     */
    convertLetraToIndex(letra) {
        const map = { "a": 0, "b": 1, "c": 2, "d": 3, "e": 4 };
        return map[letra.toLowerCase()] || 0;
    }

    /**
     * Exibe a tela de sucesso
     */
    showSuccessScreen(sucessos, erros) {
        this.hideAllScreens();
        document.getElementById("success-screen").classList.add("active");
        document.getElementById("success-count").textContent = `${sucessos} questão(ões) foi/foram cadastrada(s) com sucesso no banco de dados.`;
        
        let detalhes = `Processadas: ${sucessos + erros} questões`;
        if (erros > 0) {
            detalhes += ` | Erros: ${erros}`;
        }
        document.getElementById("success-details").textContent = detalhes;
    }

    /**
     * Volta para a tela de upload
     */
    backToUpload() {
        this.questoes = [];
        this.questoesSelecionadas = [];
        document.getElementById("csv-file-input").value = "";
        this.hideAllScreens();
        document.getElementById("upload-screen").classList.add("active");
    }

    /**
     * Reseta e volta para upload após sucesso
     */
    resetAndBackToUpload() {
        this.backToUpload();
    }

    /**
     * Volta para o menu principal
     */
    goToMainMenu() {
        window.location.href = "manager.html";
    }

    /**
     * Mostra estado de carregamento
     */
    showLoadingState() {
        const container = document.querySelector(".container");
        if (container) {
            const loading = document.createElement("div");
            loading.className = "loading-state";
            loading.id = "loading-overlay";
            loading.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Processando...</p>
            `;
            container.appendChild(loading);
        }
    }

    /**
     * Esconde estado de carregamento
     */
    hideLoadingState() {
        const loading = document.getElementById("loading-overlay");
        if (loading) {
            loading.remove();
        }
    }

    /**
     * Esconde todas as telas
     */
    hideAllScreens() {
        document.querySelectorAll(".screen").forEach(screen => {
            screen.classList.remove("active");
        });
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
    // Aguardar Firebase ser inicializado
    const checkFirebase = setInterval(() => {
        if (window.firebaseServices && window.firebaseServices.database) {
            clearInterval(checkFirebase);
            window.cadastroEmMassa = new CadastroEmMassa();
        }
    }, 100);
});
