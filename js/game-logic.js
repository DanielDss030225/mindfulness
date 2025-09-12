// Game Logic - Handles quiz gameplay and scoring
class GameLogic {
    constructor() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.questions = [];
        this.userAnswers = [];
        this.selectedAnswer = null;
        this.quizStartTime = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }




    setupEventListeners() {
        // Answer confirmation
        const confirmAnswerBtn = document.getElementById("confirmAnswerBtn");
        if (confirmAnswerBtn) {
            confirmAnswerBtn.addEventListener("click", () => this.confirmAnswer());
        }

        const nextQuestionBtn = document.getElementById("nextQuestionBtn");
        if (nextQuestionBtn) {
            nextQuestionBtn.addEventListener("click", () => this.nextQuestion());
        }

        // Review Questions button
        const reviewQuestionsBtn = document.getElementById("reviewQuestionsBtn");
        if (reviewQuestionsBtn) {
            reviewQuestionsBtn.addEventListener("click", () => this.getQuestionsForReview());
        }
    }

    async startQuiz(category, type, subcategory = "") {
        try {
            // Reset game state
            this.resetGame();
            
            // Get questions for the user
            const user = window.authManager.getCurrentUser();
            if (!user) {
                throw new Error("Usuário não autenticado");
            }

            const filters = { category, type };
            if (subcategory) {
                filters.subcategory = subcategory;
            }
            
            this.questions = await window.databaseManager.getQuestionsForUser(user.uid, filters);
            
            if (this.questions.length === 0) {
                throw new Error("Nenhuma questão encontrada para os filtros selecionados");
            }

            // Initialize quiz
            this.currentQuiz = {
                category,
                type,
                subcategory,
                startTime: Date.now(),
                userId: user.uid
            };
            
            this.quizStartTime = Date.now();
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.userAnswers = [];
            
            // Load first question
            this.loadCurrentQuestion();
            
            console.log(`Quiz started with ${this.questions.length} questions`);
            
        } catch (error) {
            console.error("Error starting quiz:", error);
            throw error;
        }
    }

    loadCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endQuiz();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        this.selectedAnswer = null;
        
        // Update UI
        this.updateQuestionUI(question);
        this.updateGameHeader();
        this.updateProfessorMessage2();
        
        // Reset confirm button
        const confirmBtn = document.getElementById("confirmAnswerBtn");
        if (confirmBtn) {
            confirmBtn.disabled = true;
        }
    }

    updateQuestionUI(question) {
        // Update question text
        const questionText = document.getElementById("questionText");
        if (questionText) {
            questionText.innerHTML = this.formatQuestionText(question.text);
        }

        // Update alternatives
        const alternativesContainer = document.getElementById("alternatives");
        if (alternativesContainer) {
            alternativesContainer.innerHTML = "";
            
            question.alternatives.forEach((alternative, index) => {
                const alternativeElement = this.createAlternativeElement(alternative, index);
                alternativesContainer.appendChild(alternativeElement);
            });
        }
    }

    formatQuestionText(text) {
        // Support for bold text and basic formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/\n/g, "<br>");
    }

    createAlternativeElement(text, index) {
        const div = document.createElement("div");
        div.className = "alternative";
        div.dataset.index = index;
        
        const letter = String.fromCharCode(65 + index); // A, B, C, D, E
        
        div.innerHTML = `
            <div class="alternative-letter">${letter}</div>
            <div class="alternative-text">${text}</div>
        `;
        
        div.addEventListener("click", () => this.selectAnswer(index));
        
        return div;
    }

    selectAnswer(index) {
        // Remove previous selection
        const alternatives = document.querySelectorAll(".alternative");
        alternatives.forEach(alt => alt.classList.remove("selected"));
        
        // Select new answer
        const selectedAlternative = document.querySelector(`[data-index="${index}"]`);
        if (selectedAlternative) {
            selectedAlternative.classList.add("selected");
            this.selectedAnswer = index;
            
            // Enable confirm button
            const confirmBtn = document.getElementById("confirmAnswerBtn");
            if (confirmBtn) {
                confirmBtn.disabled = false;
            }
        }
    }

    async confirmAnswer() {
        
        if (this.selectedAnswer === null) return;

        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = this.selectedAnswer === question.correctAnswer;
        const points = isCorrect ? 10 : 0;
        
        // Store user answer
        const userAnswer = {
            questionId: question.id,
            selectedAnswer: this.selectedAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect,
            points,
            timeSpent: Date.now() - this.quizStartTime
        };
        
        this.userAnswers.push(userAnswer);
        this.score += points;
        
        // Save answer to database
        const user = window.authManager.getCurrentUser();
        if (user) {
            await window.databaseManager.saveUserAnswer(user.uid, question.id, userAnswer);
        }
        
        // Show feedback
        this.showAnswerFeedback(isCorrect, question);

        // Show explanation and next question button
        document.getElementById("questionExplanation").innerHTML = question.comment;
        document.getElementById("explanationContainer").style.display = "block";
        document.getElementById("confirmAnswerBtn").style.display = "none";
        document.getElementById("nextQuestionBtn").style.display = "block";

}

updateProfessorMessage2() {
  const messages = [
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
    "Continue! Você está quase lá!",
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
        const professorMessage = document.getElementById("professorMessage2");

        if (professorMessage) {
            professorMessage.textContent = randomMessage;
        }
    }



    showAnswerFeedback(isCorrect, question) {
        // Highlight correct answer
        const alternatives = document.querySelectorAll(".alternative");
        alternatives.forEach((alt, index) => {
            if (index === question.correctAnswer) {
                alt.classList.add("correct");
            } else if (index === this.selectedAnswer && !isCorrect) {
                alt.classList.add("wrong");
            }
            alt.style.pointerEvents = "none";
        });

        // Show motivational message
        const messages = isCorrect ? [
            "Parabéns! Resposta correta! 🎉",
            "Excelente! Você acertou! ⭐",
            "Muito bem! Continue assim! 👏",
            "Perfeito! Você está indo bem! 🚀"
        ] : [
            "Não foi dessa vez, mas continue tentando! 💪",
            "Quase lá! A próxima você acerta! 🎯",
            "Não desista! Cada erro é aprendizado! 📚",
            "Vamos para a próxima! Você consegue! 🌟"
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Update professor message
        const professorMessage = document.getElementById("professorMessage");
        if (professorMessage) {
            professorMessage.textContent = randomMessage;
        }
        
        // Play sound
        window.uiManager.playSound(isCorrect ? "success" : "error");
        
        // Disable confirm button
        const confirmBtn = document.getElementById("confirmAnswerBtn");
        if (confirmBtn) {
            confirmBtn.disabled = true;
        }
    }

    updateGameHeader() {
        const questionCounter = document.getElementById("questionCounter");
        const gameScore = document.getElementById("gameScore");
        
        if (questionCounter) {
            questionCounter.textContent = `Questão ${this.currentQuestionIndex + 1} de ${this.questions.length}`;
        }
        
        if (gameScore) {
            gameScore.textContent = `Pontos: ${this.score}`;
        }
    }

// Em js/game-logic.js, substitua sua função endQuiz por esta:

async endQuiz() {
    const user = window.authManager.getCurrentUser();
    if (!user) return;

    // Calculate final stats
    const totalQuestions = this.questions.length;
    const correctAnswers = this.userAnswers.filter(answer => answer.isCorrect).length;
    const wrongAnswers = totalQuestions - correctAnswers;
    const finalScore = this.score;
    const quizDuration = Date.now() - this.quizStartTime;

    // Update user statistics
    await window.databaseManager.incrementUserStats(user.uid, {
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        totalScore: finalScore
    });

    // Save quiz session
    const sessionData = {
        category: this.currentQuiz.category,
        type: this.currentQuiz.type,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        finalScore,
        duration: quizDuration,
        questions: this.questions.map(q => q.id),
        answers: this.userAnswers
    };

    await window.databaseManager.saveQuizSession(user.uid, sessionData);

    // =================================================================
    // ▼▼▼ LINHA ADICIONADA PARA REGISTRAR A ATIVIDADE DIÁRIA ▼▼▼
    // =================================================================
    await window.databaseManager.logDailyActivity(user.uid);
    // =================================================================

    // Update result screen
    this.updateResultScreen(totalQuestions, correctAnswers, finalScore);
    
    // Show result screen
    window.uiManager.showScreen("result-screen");
    
    // Show completion message
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    let message = "";
    
    if (accuracy >= 80) {
        message = `Excelente! ${accuracy}% de acertos! Você está dominando o assunto! 🏆`;
    } else if (accuracy >= 60) {
        message = `Muito bom! ${accuracy}% de acertos! Continue estudando! 📚`;
    } else if (accuracy >= 40) {
        message = `Bom trabalho! ${accuracy}% de acertos! Há espaço para melhorar! 💪`;
    } else {
        message = `${accuracy}% de acertos. Não desista! A prática leva à perfeição! 🌟`;
    }
    
    setTimeout(() => {
        window.uiManager.showModal("Simulado Finalizado!", message, "success");
    }, 500);
}









    updateResultScreen(totalQuestions, correctAnswers, finalScore) {
        const finalScoreElement = document.getElementById("finalScore");
        const correctAnswersElement = document.getElementById("correctAnswers");
        const totalQuestionsElement = document.getElementById("totalQuestions");
        
        if (finalScoreElement) {
            finalScoreElement.textContent = finalScore;
        }
        
        if (correctAnswersElement) {
            correctAnswersElement.textContent = correctAnswers;
        }
        
        if (totalQuestionsElement) {
            totalQuestionsElement.textContent = totalQuestions;
        }
    }

    resetGame() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.questions = [];
        this.userAnswers = [];
        this.selectedAnswer = null;
        this.quizStartTime = null;
    }

    // Get current quiz state
    getCurrentQuizState() {
        return {
            currentQuiz: this.currentQuiz,
            currentQuestionIndex: this.currentQuestionIndex,
            score: this.score,
            totalQuestions: this.questions.length,
            userAnswers: this.userAnswers
        };
    }

    // Get questions for review
    getQuestionsForReview() {
        const incorrectAnswers = this.userAnswers.filter(answer => !answer.isCorrect);
        const incorrectQuestions = incorrectAnswers.map(answer => {
            const question = this.questions.find(q => q.id === answer.questionId);
            return question ? { ...question, userAnswer: answer } : null;
        }).filter(q => q !== null);
        return incorrectQuestions;
    }
    

    nextQuestion() {
         document.querySelector('.fundoQuestoes').scrollTop = 0;
        this.currentQuestionIndex++;
        document.getElementById("explanationContainer").style.display = "none";
        document.getElementById("nextQuestionBtn").style.display = "none";
        document.getElementById("confirmAnswerBtn").style.display = "block";
        this.loadCurrentQuestion();
        this.updateProfessorMessage2();
    }

    
}

// Initialize Game Logic
window.gameLogic = new GameLogic();







