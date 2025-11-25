// Profile Manager - Handles user profile and statistics
class ProfileManager {
    constructor() {
        this.statsChart = null;
        this.userStats = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Review buttons - now navigate to separate screens instead of showing modals
        const reviewCorrectBtn = document.getElementById("reviewCorrectBtn");
        const reviewWrongBtn = document.getElementById("reviewWrongBtn");

        if (reviewCorrectBtn) {
            reviewCorrectBtn.addEventListener("click", () => {
                window.uiManager.showScreen('review-correct-screen');
            });
        }

        if (reviewWrongBtn) {
            reviewWrongBtn.addEventListener("click", () => {
                window.uiManager.showScreen('review-wrong-screen');
            });
        }

        // Review quiz buttons for the new screens
       // const startCorrectReviewQuizBtn = document.getElementById("startCorrectReviewQuizBtn");
     //   const startWrongReviewQuizBtn = document.getElementById("startWrongReviewQuizBtn");

      /*  if (startCorrectReviewQuizBtn) {
            startCorrectReviewQuizBtn.addEventListener("click", () => {
                this.startReviewQuizFromScreen('correct');
            });
        }

        if (startWrongReviewQuizBtn) {
            startWrongReviewQuizBtn.addEventListener("click", () => {
                this.startReviewQuizFromScreen('wrong');
            });
        } */

        // Ensure the reset stats button listener is always active
        const resetStatsBtn = document.getElementById("resetarEstatisticas");
        if (resetStatsBtn) {
            // Remove any existing listener to prevent duplicates if setupEventListeners is called multiple times
            if (this.boundResetUserStats) {
                resetStatsBtn.removeEventListener("click", this.boundResetUserStats);
            }
            this.boundResetUserStats = this.resetUserStats.bind(this);
            resetStatsBtn.addEventListener("click", this.boundResetUserStats);
        }

        // Load More buttons
        const loadMoreCorrectBtn = document.getElementById("loadMoreBtn_correct");
        const loadMoreWrongBtn = document.getElementById("loadMoreBtn_wrong");

        if (loadMoreCorrectBtn) {
            loadMoreCorrectBtn.addEventListener("click", () => {
                this.loadMoreReviewQuestions('correct');
            });
        }

        if (loadMoreWrongBtn) {
            loadMoreWrongBtn.addEventListener("click", () => {
                this.loadMoreReviewQuestions('wrong');
            });
        }
    }

    async loadUserStats() {
        const user = window.authManager.getCurrentUser();
        if (!user) {
            console.error("No user logged in");
            return;
        }

        try {
            // Get user statistics
            this.userStats = await window.databaseManager.getUserStats(user.uid);
            
            // Update UI with stats
            this.updateStatsDisplay();
            
            // Create or update chart
            this.createStatsChart();
            
        } catch (error) {
            console.error("Error loading user stats:", error);
            window.uiManager.showModal("Erro", "Erro ao carregar estatísticas do usuário.");
        }
    }

    updateStatsDisplay() {
        if (!this.userStats) return;

        const totalQuestions = this.userStats.totalQuestions || 0;
        const correctAnswers = this.userStats.correctAnswers || 0;
        const wrongAnswers = this.userStats.wrongAnswers || 0;
        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        // Update summary elements
        const elements = {
            "totalQuestionsProfile": totalQuestions,
            "correctAnswersProfile": correctAnswers,
            "wrongAnswersProfile": wrongAnswers,
            "accuracyProfile": `${accuracy}%`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update review buttons state
        //this.updateReviewButtons(correctAnswers, wrongAnswers);
    }

    updateReviewButtons(correctAnswers, wrongAnswers) {
        const reviewCorrectBtn = document.getElementById("reviewCorrectBtn");
        const reviewWrongBtn = document.getElementById("reviewWrongBtn");

        if (reviewCorrectBtn) {
            reviewCorrectBtn.disabled = correctAnswers === 0;
            reviewCorrectBtn.textContent = `Revisar Acertos (${correctAnswers})`;
        }

        if (reviewWrongBtn) {
            reviewWrongBtn.disabled = wrongAnswers === 0;
            reviewWrongBtn.textContent = `Revisar Erros (${wrongAnswers})`;
        }
    }

    createStatsChart() {
        const canvas = document.getElementById("statsChart");
        if (!canvas || !this.userStats) return;

        // Destroy existing chart if it exists
        if (this.statsChart) {
            this.statsChart.destroy();
        }

        const ctx = canvas.getContext("2d");
        const totalQuestions = this.userStats.totalQuestions || 0;
        const correctAnswers = this.userStats.correctAnswers || 0;
        const wrongAnswers = this.userStats.wrongAnswers || 0;

        // If no data, show empty state
        if (totalQuestions === 0) {
            this.showEmptyChartState(ctx);
            return;
        }

        // Create pie chart
        this.statsChart = new Chart(ctx, {
            type: "pie",
            data: {
                labels: ["Questões corretas", "Questões incorretas"],
                datasets: [{
                    data: [correctAnswers, wrongAnswers],
                    backgroundColor: [
                        "#4CAF50",  // Green for correct
                        "#f44336"   // Red for wrong
                    ],
                    borderColor: [
                        "#45a049",
                        "#d32f2f"
                    ],
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            padding: 20,
                            font: {
                                size: 14,
                                weight: "600"
                            },
                            color: "#333"
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || "";
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        },
                        backgroundColor: "rgba(0,0,0,0.8)",
                        titleColor: "white",
                        bodyColor: "white",
                        borderColor: "#4CAF50",
                        borderWidth: 1
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000
                }
            }
        });
    }

    showEmptyChartState(ctx) {
       
        // Clear canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw empty state
        ctx.fillStyle = "#f8f9fa";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = "#666";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            "Nenhuma questão respondida ainda",
            ctx.canvas.width / 2,
            ctx.canvas.height / 2 - 10
        );
        
        ctx.font = "14px Arial";
        ctx.fillText(
            "Faça um quiz para ver suas estatísticas!",
            ctx.canvas.width / 2,
            ctx.canvas.height / 2 + 15
        );
    }

    async reviewQuestions(type) {
      
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            window.uiManager.showLoading();
            
            // Get user answers
            const userAnswers = await window.databaseManager.getUserAnswers(user.uid);
            
            // Filter answers based on type
            const filteredAnswers = Object.entries(userAnswers).filter(([questionId, answer]) => {
                return type === "correct" ? answer.isCorrect : !answer.isCorrect;
            });

            if (filteredAnswers.length === 0) {
                window.uiManager.hideLoading();
                const message = type === "correct" 
                    ? "Você ainda não acertou nenhuma questão." 
                    : "Você ainda não errou nenhuma questão.";
                window.uiManager.showModal("Nenhuma Questão", message);
                return;
            }

            // Get question details
            const questionIds = filteredAnswers.map(([questionId]) => questionId);
            const questions = await this.getQuestionsByIds(questionIds);
            
            window.uiManager.hideLoading();
            
            // Show review modal
            this.showReviewModal(questions, filteredAnswers, type);
            
        } catch (error) {
            window.uiManager.hideLoading();
            console.error("Error reviewing questions:", error);
            window.uiManager.showModal("Erro", "Erro ao carregar questões para revisão.");
        }
    }

    async getQuestionsByIds(questionIds) {
        const questions = {};
        
        for (const questionId of questionIds) {
            try {
                const snapshot = await window.firebaseServices.database.ref(`questions/${questionId}`).once("value");
                const questionData = snapshot.val();
                if (questionData) {
                    questions[questionId] = { id: questionId, ...questionData };
                }
            } catch (error) {
                console.error(`Error getting question ${questionId}:`, error);
            }
        }
        
        return questions;
    }

    showReviewModal(questions, userAnswers, type) {
        // Create review modal content
        const modalContent = this.createReviewModalContent(questions, userAnswers, type);
        
        // Show modal with custom content
        const modal = document.getElementById("modal");
        const modalTitle = document.getElementById("modalTitle");
        const modalBody = document.querySelector("#modal .modal-body");
        const modalFooter = document.querySelector("#modal .modal-footer");
        
        if (modal && modalTitle && modalBody) {
            modalTitle.textContent = type === "correct" ? "Questões Acertadas" : "Questões Erradas";
            modalBody.innerHTML = modalContent;
            
            // Clear existing buttons to prevent duplicate event listeners
            modalFooter.innerHTML = ""; 

            // Create and append new buttons
            const startReviewQuizBtn = document.createElement("button");
            startReviewQuizBtn.id = "startReviewQuiz";
            startReviewQuizBtn.className = "btn-primary";
            startReviewQuizBtn.textContent = "Fazer simulado com Essas Questões";
            startReviewQuizBtn.addEventListener("click", () => {
                this.startReviewQuiz(Object.keys(questions), type);
            });
            modalFooter.appendChild(startReviewQuizBtn);

            const closeReviewModalBtn = document.createElement("button");
            closeReviewModalBtn.id = "closeReviewModal";
            closeReviewModalBtn.className = "btn-secondary";
            closeReviewModalBtn.textContent = "Fechar";
            closeReviewModalBtn.addEventListener("click", () => {
                window.uiManager.hideModal();
            });
            modalFooter.appendChild(closeReviewModalBtn);
            
            modal.classList.add("active");
        }
    }

    createReviewModalContent(questions, userAnswers, type) {
        const questionsList = Object.entries(questions).map(([questionId, question]) => {
            const userAnswer = userAnswers.find(([id]) => id === questionId)?.[1];
            const userSelectedLetter = userAnswer ? String.fromCharCode(65 + userAnswer.selectedAnswer) : "?";
            const correctLetter = String.fromCharCode(65 + question.correctAnswer);
            
            return `
                <div class="review-question">
                    <div class="review-question-text">
                        ${this.formatQuestionText(question.text)}
                    </div>
                    <div class="review-answer-info">
                        <span class="user-answer ${type}">
                            Sua resposta: ${userSelectedLetter}
                        </span>
                        <span class="correct-answer">
                            Resposta correta: ${correctLetter}
                        </span>
                    </div>
                    ${question.comment ? `
                        <div class="review-comment">
                            <strong>Explicação:</strong> ${question.comment}
                        </div>
                    ` : ""}
                </div>
            `;
        }).join("");

        return `
            <div class="review-content">
                <p class="review-summary">
                    ${type === "correct" ? "Questões que você acertou" : "Questões que você errou"} 
                    (${Object.keys(questions).length} questões)
                </p>
                <div class="review-questions-list">
                    ${questionsList}
                </div>
            </div>
        `;
    }

    formatQuestionText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/\n/g, "<br>");
    }

    async startReviewQuiz(questionIds, type) {
        try {
            window.uiManager.hideModal();
            window.uiManager.showLoading();
            
            // Get questions data
            const questions = await this.getQuestionsByIds(questionIds);
            const questionsArray = Object.values(questions);
            
            // Shuffle questions
            const shuffledQuestions = window.databaseManager.shuffleArray(questionsArray);
            
            // Start custom quiz with these questions
            if (window.gameLogic) {
                window.gameLogic.resetGame();
                window.gameLogic.questions = shuffledQuestions.slice(0, 10); // Limit to 20 questions
                window.gameLogic.currentQuiz = {
                    category: "review",
                    type: type,
                    startTime: Date.now(),
                    userId: window.authManager.getCurrentUser().uid
                };
                window.gameLogic.quizStartTime = Date.now();
                window.gameLogic.currentQuestionIndex = 0;
                window.gameLogic.score = 0;
                window.gameLogic.userAnswers = [];
                
                window.gameLogic.loadCurrentQuestion();
                window.uiManager.showScreen("game-screen");
            }
            
            window.uiManager.hideLoading();
            
        } catch (error) {
            window.uiManager.hideLoading();
            console.error("Error starting review quiz:", error);
            window.uiManager.showModal("Erro", "Erro ao iniciar quiz de revisão.");
        }
    }

    // Get user quiz history
    async getUserQuizHistory() {
        const user = window.authManager.getCurrentUser();
        if (!user) return [];

        try {
            return await window.databaseManager.getUserQuizSessions(user.uid, 10);
        } catch (error) {
            console.error("Error getting quiz history:", error);
            return [];
        }
    }

    // Export user data (for future implementation)
    async exportUserData() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            const userData = await window.authManager.getUserData();
            const userAnswers = await window.databaseManager.getUserAnswers(user.uid);
            const quizHistory = await this.getUserQuizHistory();

            const exportData = {
                user: userData,
                stats: this.userStats,
                answers: userAnswers,
                quizHistory: quizHistory,
                exportDate: new Date().toISOString()
            };

            // Create and download JSON file
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement("a");
            link.href = url;
            link.download = `mindfulness-data-${user.uid}-${Date.now()}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            window.uiManager.showModal("Sucesso", "Dados exportados com sucesso!", "success");
            
        } catch (error) {
            console.error("Error exporting user data:", error);
            window.uiManager.showModal("Erro", "Erro ao exportar dados do usuário.");
        }
    }

    // New function to load review screens
async loadReviewScreen(type) {
    const user = window.authManager.getCurrentUser();
    if (!user) return;

    try {
        // Mostrar carregamento
        this.showReviewLoading(type);

        // Buscar respostas do usuário
        const userAnswers = await window.databaseManager.getUserAnswers(user.uid);

        if (!userAnswers || Object.keys(userAnswers).length === 0) {
            this.showReviewEmpty(type);
            return;
        }

        // Filtrar corretas ou incorretas
        let filteredAnswers = Object.entries(userAnswers).filter(([id, ans]) => {
            return type === "correct" ? ans.isCorrect : !ans.isCorrect;
        });

        // Se não houver questões desse tipo
        if (filteredAnswers.length === 0) {
            this.showReviewEmpty(type);
            return;
        }

        // 1️⃣ Armazenar todas as questões filtradas
        this.allReviewQuestions = this.allReviewQuestions || {};
        this.allReviewQuestions[type] = filteredAnswers;

        const PAGE_SIZE = 5;
        let loadedPairs = [];
        let index = 0;

        // 2️⃣ Buscar as primeiras 5 questões válidas
        while (loadedPairs.length < PAGE_SIZE && index < filteredAnswers.length) {
            const [qId, answer] = filteredAnswers[index];
            const q = await this.getQuestionsByIds([qId]); // busca unitária

            if (q[qId]) {
                loadedPairs.push([qId, answer]);
            }

            index++;
        }

        // Se não achou nada válido, mostra tela vazia
        if (loadedPairs.length === 0) {
            this.showReviewEmpty(type);
            return;
        }

        // 3️⃣ Renderizar as primeiras 5 reais
        const questionIds = loadedPairs.map(([id]) => id);
        const questions = await this.getQuestionsByIds(questionIds);
        this.displayReviewQuestions(questions, loadedPairs, type, true); // true para limpar o container

        // 4️⃣ Guardar o restante para carregamento posterior
        this.remainingQuestions = this.remainingQuestions || {};
        this.remainingQuestions[type] = filteredAnswers.slice(index);

        // 5️⃣ Mostrar/Esconder botão "Carregar mais"
        this.toggleLoadMoreButton(type);

    } catch (error) {
        console.error("Error loading review screen:", error);
        this.showReviewError(type);
    }
}



    showReviewLoading(type) {
        const summaryElement = document.getElementById(type === 'correct' ? 'correctSummaryText' : 'wrongSummaryText');
        const listElement = document.getElementById(type === 'correct' ? 'correctQuestionsList' : 'wrongQuestionsList');
        
        if (summaryElement) {
            summaryElement.textContent = `Carregando questões ${type === 'correct' ? 'acertadas' : 'erradas'}...`;
        }
        
        if (listElement) {
            listElement.innerHTML = '<div class="review-loading"><div class="loading-spinner"></div><p class="carregando">Carregando questões...</p></div>';
        }
    }

    showReviewEmpty(type) {
        const summaryElement = document.getElementById(type === 'correct' ? 'correctSummaryText' : 'wrongSummaryText');
        const listElement = document.getElementById(type === 'correct' ? 'correctQuestionsList' : 'wrongQuestionsList');
        const actionButton = document.getElementById(type === 'correct' ? 'startCorrectReviewQuizBtn' : 'startWrongReviewQuizBtn');
        
        if (summaryElement) {
            summaryElement.textContent = `Você ainda não ${type === 'correct' ? 'acertou' : 'errou'} nenhuma questão.`;
        }
        
        if (listElement) {
            listElement.innerHTML = `
                <div class="review-empty">
                    <h3>Nenhuma questão encontrada</h3>
                    <p>Faça alguns quizzes para ver suas questões ${type === 'correct' ? 'acertadas' : 'erradas'} aqui!</p>
                </div>
            `;
        }
        
        if (actionButton) {
            actionButton.style.display = 'none';
        }
    }

    showReviewError(type) {
        const summaryElement = document.getElementById(type === 'correct' ? 'correctSummaryText' : 'wrongSummaryText');
        const listElement = document.getElementById(type === 'correct' ? 'correctQuestionsList' : 'wrongQuestionsList');
        
        if (summaryElement) {
            summaryElement.textContent = 'Erro ao carregar questões.';
        }
        
        if (listElement) {
            listElement.innerHTML = '<div class="review-empty"><h3>Erro</h3><p>Não foi possível carregar as questões. Tente novamente.</p></div>';
        }
    }

    displayReviewQuestions(questions, userAnswers, type) {
        const summaryElement = document.getElementById(type === 'correct' ? 'correctSummaryText' : 'wrongSummaryText');
        const listElement = document.getElementById(type === 'correct' ? 'correctQuestionsList' : 'wrongQuestionsList');
        const actionButton = document.getElementById(type === 'correct' ? 'startCorrectReviewQuizBtn' : 'startWrongReviewQuizBtn');
        
        // Update summary
if (summaryElement) {
    const quantidade = Object.keys(questions).length;

    summaryElement.textContent =
        `Mostrando ${quantidade === 1 ? 'a última' : 'as últimas'} ${quantidade} ` +
        `${quantidade === 1 ? 'questão' : 'questões'} que você ` +
        `${type === 'correct' ? 'acertou' : 'errou'}`;
}

        
        // Display questions
        if (listElement) {
            const questionsList = Object.entries(questions).map(([questionId, question]) => {
                const userAnswer = userAnswers.find(([id]) => id === questionId)?.[1];
                const userSelectedLetter = userAnswer ? String.fromCharCode(65 + userAnswer.selectedAnswer) : "?";
                const correctLetter = String.fromCharCode(65 + question.correctAnswer);
                
                return `
                    <div class="review-question">
                        <div class="review-question-text">
                            ${this.formatQuestionText(question.text)}
                        </div>
                        <div class="review-answer-info">
                            <span class="user-answer ${type}">
                                Sua resposta: ${userSelectedLetter}
                            </span>
                            <span class="correct-answer">
                                Resposta correta: ${correctLetter}
                            </span>
                        </div>
                        ${question.comment ? `
                            <div class="review-comment">
                                <strong>Explicação:</strong> ${question.comment}
                            </div>
                        ` : ""}
                    </div>
                `;
            }).join("");
            
            listElement.innerHTML = questionsList;
        }
        
        // Show action button
        if (actionButton) {
            actionButton.style.display = 'block';
        }
        
        // Store questions for quiz
        this.currentReviewQuestions = questions;
        this.currentReviewType = type;
    }

    // Função auxiliar para formatar o texto da questão (se existir)
    formatQuestionText(text) {
        // Implementação da função formatQuestionText (assumindo que ela existe ou é necessária)
        // Se não existir, pode ser uma função simples de retorno ou uma que faça a formatação HTML
        return text; 
    }

    // Função auxiliar para adicionar questões ao DOM
    appendReviewQuestions(questionsObj, pairs, type) {
        const listId = type === "correct" ? "correctQuestionsList" : "wrongQuestionsList";
        const list = document.getElementById(listId);
        if (!list) return;

        const html = pairs.map(([questionId, answer]) => {
            const q = questionsObj[questionId];
            if (!q) return "";

            const userLetter = String.fromCharCode(65 + answer.selectedAnswer);
            const correctLetter = String.fromCharCode(65 + q.correctAnswer);

            return `
                <div class="review-question">
                    <div class="review-question-text">
                        ${this.formatQuestionText(q.text)}
                    </div>
                    <div class="review-answer-info">
                        <span class="user-answer ${type}">Sua resposta: ${userLetter}</span>
                        <span class="correct-answer">Resposta correta: ${correctLetter}</span>
                    </div>
                    ${q.comment ? `
                        <div class="review-comment">
                            <strong>Explicação:</strong> ${q.comment}</div>` : ""
                    }
                </div>
            `;
        }).join("");

        list.insertAdjacentHTML("beforeend", html);
    }

    // Função auxiliar para mostrar/esconder o botão "Carregar mais"
    toggleLoadMoreButton(type) {
           
        const btn = document.getElementById(`loadMoreBtn_${type}`);
        if (!btn) return;

        const remaining = this.remainingQuestions[type] ? this.remainingQuestions[type].length : 0;

        if (remaining > 0) {
            btn.style.display = "block";
            btn.textContent = `Carregar mais 5 questões (${remaining} restantes)`;
        } else {
            btn.style.display = "none";
        }
    }

    // Função para carregar mais questões loadMoreBtn_wrong
    async loadMoreReviewQuestions(type) {
        let butaoWrong = document.getElementById("loadMoreBtn_wrong");
        let butaoCorrect = document.getElementById("loadMoreBtn_correct");
        butaoCorrect.textContent = "Carregando..."
  butaoWrong.textContent = "Carregando..."
        if (!this.remainingQuestions || !this.remainingQuestions[type] || this.remainingQuestions[type].length === 0) return;

        const PAGE_SIZE = 5;
        let loadedPairs = [];
        let index = 0;
        const remaining = this.remainingQuestions[type];

        try {
            // 🔄 Enquanto não tiver 5 questões válidas,
            // e ainda existirem questões restantes...
            while (loadedPairs.length < PAGE_SIZE && index < remaining.length) {

                const [qId, answer] = remaining[index];
                const q = await this.getQuestionsByIds([qId]); // busca unitária

                if (q[qId]) {
                    loadedPairs.push([qId, answer]);
                }

                index++;
            }

            // Remover do vetor principal as já processadas
            this.remainingQuestions[type] = remaining.slice(index);

            // Se não achou nada válido, não faz nada
            if (loadedPairs.length === 0) {
                this.toggleLoadMoreButton(type); // Esconde se não houver mais
                return;
            }

            // ➕ Inserir no DOM (append - SEM substituir)
            const questionIds = loadedPairs.map(([id]) => id);
            const questions = await this.getQuestionsByIds(questionIds);
            this.appendReviewQuestions(questions, loadedPairs, type);

            // Atualizar estado do botão
            this.toggleLoadMoreButton(type);

        } catch (err) {
            console.error("Error loading more questions:", err);
        }
    }

    // Função para renderizar as questões (ajustada para receber o parâmetro clear)
    displayReviewQuestions(questions, userAnswers, type, clear = false) {
        const summaryElement = document.getElementById(type === 'correct' ? 'correctSummaryText' : 'wrongSummaryText');
        const listElement = document.getElementById(type === 'correct' ? 'correctQuestionsList' : 'wrongQuestionsList');
        const actionButton = document.getElementById(type === 'correct' ? 'startCorrectReviewQuizBtn' : 'startWrongReviewQuizBtn');
        
        // Update summary
        if (summaryElement) {
            const totalQuestions = this.allReviewQuestions[type].length;
            const currentLoaded = Object.keys(questions).length;

            summaryElement.textContent =
                `Mostrando ${currentLoaded} de ${totalQuestions} questões que você ` +
                `${type === 'correct' ? 'acertou' : 'errou'}`;
        }

        // Display questions
        if (listElement) {
            const questionsList = userAnswers.map(([questionId, userAnswer]) => {
                const question = questions[questionId];
                if (!question) return "";

                const userSelectedLetter = userAnswer ? String.fromCharCode(65 + userAnswer.selectedAnswer) : "?";
                const correctLetter = String.fromCharCode(65 + question.correctAnswer);
                
                return `
                    <div class="review-question">
                        <div class="review-question-text">
                            ${this.formatQuestionText(question.text)}
                        </div>
                        <div class="review-answer-info">
                            <span class="user-answer ${type}">
                                Sua resposta: ${userSelectedLetter}
                            </span>
                            <span class="correct-answer">
                                Resposta correta: ${correctLetter}
                            </span>
                        </div>
                        ${question.comment ? `
                            <div class="review-comment">
                                <strong>Explicação:</strong> ${question.comment}
                            </div>
                        ` : ""}
                    </div>
                `;
            }).join("");
            
            if (clear) {
                listElement.innerHTML = questionsList;
            } else {
                listElement.insertAdjacentHTML("beforeend", questionsList);
            }
        }
        
        // Show action button
        if (actionButton) {
            actionButton.style.display = 'block';
        }
        
        // Store questions for quiz
        // Para o quiz, vamos usar todas as questões armazenadas em this.allReviewQuestions[type]
        // O quiz deve ser iniciado com todas as questões, não apenas as 5 carregadas.
        const allQuestionsIds = this.allReviewQuestions[type].map(([id]) => id);
        this.getQuestionsByIds(allQuestionsIds).then(allQuestions => {
            this.currentReviewQuestions = allQuestions;
            this.currentReviewType = type;
        });
    }

    async startReviewQuizFromScreen(type) {
        if (!this.currentReviewQuestions) {
            window.uiManager.showModal("Erro", "Necessário carregar pelo menos 10 questões.");
            return;
        }

        try {
            window.uiManager.showLoading();
            
            // Get questions data
            const questionsArray = Object.values(this.currentReviewQuestions);
            
            // Shuffle questions
            const shuffledQuestions = window.databaseManager.shuffleArray(questionsArray);
            
            // Start custom quiz with these questions
            if (window.gameLogic) {
                window.gameLogic.resetGame();
                window.gameLogic.questions = shuffledQuestions.slice(0,10); // Limit to 20 questions
                window.gameLogic.currentQuiz = {
                    category: "review",
                    type: type,
                    startTime: Date.now(),
                    userId: window.authManager.getCurrentUser().uid
                };
                window.gameLogic.quizStartTime = Date.now();
                window.gameLogic.currentQuestionIndex = 0;
                window.gameLogic.score = 0;
                window.gameLogic.userAnswers = [];
                
                window.gameLogic.loadCurrentQuestion();
                window.uiManager.showScreen("game-screen");
            }
            
            window.uiManager.hideLoading();
            
        } catch (error) {
            window.uiManager.hideLoading();
            console.error("Error starting review quiz from screen:", error);
            window.uiManager.showModal("Erro", "Erro ao iniciar quiz de revisão.");
        }
    }

    // Reset user statistics (for future implementation)
    async resetUserStats() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        window.uiManager.showModal(
            "Confirmar Reset",
            "Tem certeza que deseja resetar todas as suas estatísticas? Esta ação não pode ser desfeita.",
            "warning",
            true, // showConfirmButton
            async () => { // onConfirm callback
                try {
                    window.uiManager.hideModal();
                    window.uiManager.showLoading();
                    
                    // Reset stats
                    await window.databaseManager.updateUserStats(user.uid, {
                        totalQuestions: 0,
                        correctAnswers: 0,
                        wrongAnswers: 0,
                        totalScore: 0
                    });
                    
                    // Reload stats
                    await this.loadUserStats();
                    
                    window.uiManager.hideLoading();
                    window.uiManager.showModal("Sucesso", "Estatísticas resetadas com sucesso!", "success");
                    
                } catch (error) {
                    window.uiManager.hideLoading();
                    console.error("Error resetting user stats:", error);
                    window.uiManager.showModal("Erro", "Erro ao resetar estatísticas.");
                }
            },
            () => { // onCancel callback
                window.uiManager.hideModal();
            }
        );
    }


    // Adicione este novo método dentro da classe ProfileManager em js/profile.js

async loadAndDisplayAchievements(userId, containerId) {
    const achievementsContainer = document.getElementById(containerId);
    if (!achievementsContainer) {
        console.error(`Container de conquistas com ID '${containerId}' não encontrado.`);
        return;
    }

    try {
        // 1. Buscar as estatísticas do usuário
        const userStats = await window.databaseManager.getUserStats(userId);
        const totalQuestions = userStats.totalQuestions || 0;
        console.log("User stats:", userStats);

        // 2. Buscar detalhes das questões respondidas
        const answeredQuestions = await window.databaseManager.getAnsweredQuestionsDetails(userId);
        console.log("Answered questions details:", answeredQuestions);

        const allCategories = await window.databaseManager.getCategories();
        console.log("All categories:", allCategories);

        // Contar questões respondidas por categoria
        const categoryCounts = {};
        answeredQuestions.forEach(q => {
            if (q.category) {
                categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
            }
        });
        console.log("Answered questions count by category (categoryId: count):", categoryCounts);

        let portuguesQuestionsCount = 0;
        let direitoQuestionsCount = 0;

        for (const id in allCategories) {
            const categoryName = allCategories[id].name.toLowerCase();

            if (categoryName.includes('português')) portuguesQuestionsCount += categoryCounts[id] || 0;
            if (categoryName.includes('direito')) direitoQuestionsCount += categoryCounts[id] || 0;

            console.log(`Category: ${allCategories[id].name}, ID: ${id}, User answered count: ${categoryCounts[id] || 0}`);
        }

        console.log(`Português questions answered: ${portuguesQuestionsCount}`);
        console.log(`Direito questions answered: ${direitoQuestionsCount}`);


let categoriaPortugues = "";
let categoriaDireitoPenal = "";

console.log('[loadAchievements] Contagem de questões por categoria:');
for (const id in allCategories) {
    const categoryName = allCategories[id].name;
    const count = answeredQuestions.filter(q => q.category === id).length;

    console.log(`Categoria: ${categoryName} | ID: ${id} | Questões respondidas: ${count}`);

    if (categoryName  == "🆎 Português: Língua Portuguesa e Interpretação de Textos" ) {
categoriaPortugues =  count;
     

    }

if (categoryName.includes("⚖️ Direito Penal - Código Penal") ) {
categoriaDireitoPenal =  count;


       

    }

}

direitoQuestionsCount = categoriaDireitoPenal;
      

        // 3. Lista de conquistas
        const achievements = [
            { id: 1, name: 'Primeira Questão', icon: '🎯', earned: totalQuestions >= 1 },
            { id: 4, name: 'Concurseiro Pro', icon: '🔥', earned: totalQuestions >= 20 },
            { id: 3, name: 'Acerto Perfeito', icon: '🎪', earned: totalQuestions >= 50 },
            { id: 2, name: '100 Questões', icon: '💯', earned: totalQuestions >= 100 },
            { id: 5, name: 'Especialista em Português', icon: '📚', earned: portuguesQuestionsCount >= 10 },
            { id: 6, name: 'Mestre do Direito Penal', icon: '⚖️', earned: direitoQuestionsCount >= 10 },
            { id: 8, name: '200 Questões', icon: '🏆', earned: totalQuestions >= 200 },
            { id: 9, name: 'Mentor da Comunidade', icon: '👨‍🏫', earned: totalQuestions >= 250 },
            { id: 10, name: 'Lenda dos Concursos', icon: '👑', earned: totalQuestions >= 500 },
            { id: 7, name: 'Milhar de Questões', icon: '🚀', earned: totalQuestions >= 1000 },
            { id: 11, name: '2000 Questões', icon: '⚡', earned: totalQuestions >= 2000 },
            { id: 12, name: '5000 Questões', icon: '💎', earned: totalQuestions >= 5000 },
        ];

        // 4. Renderizar conquistas
        const earnedCount = achievements.filter(a => a.earned).length;

        const achievementCountElement = document.getElementById('achievementCount2');
        if (achievementCountElement) {
            achievementCountElement.textContent = `${earnedCount} de ${achievements.length} desbloqueadas`;
        }

        achievementsContainer.innerHTML = achievements.map(achievement => `
            <div class="achievement-badge ${achievement.earned ? 'earned' : ''}" title="${achievement.name}">
                <span class="achievement-icon">${achievement.icon}</span>
                <div class="achievement-name">${achievement.name}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Erro ao carregar e exibir conquistas:", error);
        achievementsContainer.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar conquistas.</p>`;
    }
}






}

// Initialize Profile Manager
window.profileManager = new ProfileManager();

// The event listener for resetarEstatisticas is now set up in setupEventListeners
// document.getElementById("resetarEstatisticas").addEventListener("click", () => {
//     window.profileManager.resetUserStats();
// });


