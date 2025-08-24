// Database Manager - Handles all Firebase Realtime Database operations
class DatabaseManager {
    constructor() {
        this.database = window.firebaseServices.database;
        this.init();
    }

    init() {
        console.log("Database Manager initialized");
    }

    // Categories Management
    async getCategories() {
        try {
            const snapshot = await this.database.ref("categories").once("value");
            return snapshot.val() || {};
        } catch (error) {
            console.error("Error getting categories:", error);
            throw error;
        }
    }

    async addCategory(categoryData) {
        try {
            const newCategoryRef = this.database.ref("categories").push();
            await newCategoryRef.set({
                ...categoryData,
                subcategories: categoryData.subcategories || {},
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return newCategoryRef.key;
        } catch (error) {
            console.error("Error adding category:", error);
            throw error;
        }
    }

    async deleteCategory(categoryId) {
        try {
            await this.database.ref(`categories/${categoryId}`).remove();
        } catch (error) {
            console.error("Error deleting category:", error);
            throw error;
        }
    }

    // Subcategories Management
    async getSubcategories(categoryId) {
        try {
            const snapshot = await this.database.ref(`categories/${categoryId}/subcategories`).once("value");
            return snapshot.val() || {};
        } catch (error) {
            console.error("Error getting subcategories:", error);
            throw error;
        }
    }

    async addSubcategory(categoryId, subcategoryData) {
        try {
            const newSubcategoryRef = this.database.ref(`categories/${categoryId}/subcategories`).push();
            await newSubcategoryRef.set({
                ...subcategoryData,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return newSubcategoryRef.key;
        } catch (error) {
            console.error("Error adding subcategory:", error);
            throw error;
        }
    }

    async deleteSubcategory(categoryId, subcategoryId) {
        try {
            await this.database.ref(`categories/${categoryId}/subcategories/${subcategoryId}`).remove();
        } catch (error) {
            console.error("Error deleting subcategory:", error);
            throw error;
        }
    }

    // Questions Management
    async getQuestions(filters = {}) {
        try {
            let query = this.database.ref("questions");
            
            // Apply filters
            if (filters.category && filters.category !== "random") {
                query = query.orderByChild("category").equalTo(filters.category);
            }
            
            const snapshot = await query.once("value");
            const questions = snapshot.val() || {};
            
            // Additional filtering
            let filteredQuestions = Object.entries(questions).map(([id, question]) => ({
                id,
                ...question
            }));

            if (filters.type) {
                filteredQuestions = filteredQuestions.filter(q => q.type === filters.type);
            }

            // Filter by subcategory if specified
            if (filters.subcategory) {
                filteredQuestions = filteredQuestions.filter(q => q.subcategory === filters.subcategory);
            }

            if (filters.category === "random") {
                // Get questions from all categories, mixed
                filteredQuestions = this.shuffleArray(filteredQuestions);
            }

            return filteredQuestions;
        } catch (error) {
            console.error("Error getting questions:", error);
            throw error;
        }
    }

    async getQuestionsForUser(userId, filters = {}) {
        try {
            // Get all questions
            const allQuestions = await this.getQuestions(filters);
            
            // Get user's answered questions
            const userAnswersSnapshot = await this.database.ref(`userAnswers/${userId}`).once("value");
            const userAnswers = userAnswersSnapshot.val() || {};
            
            // Filter out already answered questions (for new questions)
            let availableQuestions = allQuestions.filter(question => !userAnswers[question.id]);
            
            // If no new questions available, return all questions
            if (availableQuestions.length === 0) {
                availableQuestions = allQuestions;
            }
            
            // Shuffle and limit to 50 questions
            availableQuestions = this.shuffleArray(availableQuestions);
            return availableQuestions.slice(0, 15);
            
        } catch (error) {
            console.error("Error getting questions for user:", error);
            throw error;
        }
    }

    async addQuestion(questionData) {
        try {
            const newQuestionRef = this.database.ref("questions").push();
            await newQuestionRef.set({
                ...questionData,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return newQuestionRef.key;
        } catch (error) {
            console.error("Error adding question:", error);
            throw error;
        }
    }

    async updateQuestion(questionId, questionData) {
        try {
            await this.database.ref(`questions/${questionId}`).update({
                ...questionData,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error("Error updating question:", error);
            throw error;
        }
    }

    async deleteQuestion(questionId) {
        try {
            await this.database.ref(`questions/${questionId}`).remove();
        } catch (error) {
            console.error("Error deleting question:", error);
            throw error;
        }
    }

    // User Answers Management
    async saveUserAnswer(userId, questionId, answerData) {
        try {
            await this.database.ref(`userAnswers/${userId}/${questionId}`).set({
                ...answerData,
                answeredAt: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error("Error saving user answer:", error);
            throw error;
        }
    }

    async getUserAnswers(userId, questionIds = null) {
        try {
            const snapshot = await this.database.ref(`userAnswers/${userId}`).once("value");
            const allAnswers = snapshot.val() || {};
            
            if (questionIds) {
                // Return only specific questions
                const filteredAnswers = {};
                questionIds.forEach(id => {
                    if (allAnswers[id]) {
                        filteredAnswers[id] = allAnswers[id];
                    }
                });
                return filteredAnswers;
            }
            
            return allAnswers;
        } catch (error) {
            console.error("Error getting user answers:", error);
            throw error;
        }
    }

    // User Statistics
    async getUserStats(userId) {
        try {
            const snapshot = await this.database.ref(`users/${userId}/stats`).once("value");
            return snapshot.val() || {
                totalQuestions: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                totalScore: 0
            };
        } catch (error) {
            console.error("Error getting user stats:", error);
            throw error;
        }
    }

    async updateUserStats(userId, stats) {
        try {
            await this.database.ref(`users/${userId}/stats`).update(stats);
        } catch (error) {
            console.error("Error updating user stats:", error);
            throw error;
        }
    }

    async incrementUserStats(userId, increments) {
        try {
            const currentStats = await this.getUserStats(userId);
            const newStats = {
                totalQuestions: (currentStats.totalQuestions || 0) + (increments.totalQuestions || 0),
                correctAnswers: (currentStats.correctAnswers || 0) + (increments.correctAnswers || 0),
                wrongAnswers: (currentStats.wrongAnswers || 0) + (increments.wrongAnswers || 0),
                totalScore: (currentStats.totalScore || 0) + (increments.totalScore || 0)
            };
            
            await this.updateUserStats(userId, newStats);
            return newStats;
        } catch (error) {
            console.error("Error incrementing user stats:", error);
            throw error;
        }
    }

    // Comments Management
    async getQuestionComments(questionId) {
        try {
            const snapshot = await this.database.ref(`comments/${questionId}`).orderByChild("createdAt").once("value");
            const comments = snapshot.val() || {};
            
            // Convert to array and sort by creation date
            return Object.entries(comments).map(([id, comment]) => ({
                id,
                ...comment
            })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        } catch (error) {
            console.error("Error getting question comments:", error);
            throw error;
        }
    }

    async addComment(questionId, commentData) {
        try {
            const newCommentRef = this.database.ref(`comments/${questionId}`).push();
            await newCommentRef.set({
                ...commentData,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return newCommentRef.key;
        } catch (error) {
            console.error("Error adding comment:", error);
            throw error;
        }
    }

    async deleteComment(questionId, commentId) {
        try {
            await this.database.ref(`comments/${questionId}/${commentId}`).remove();
        } catch (error) {
            console.error("Error deleting comment:", error);
            throw error;
        }
    }

    // Quiz Sessions Management
    async saveQuizSession(userId, sessionData) {
        try {
            const newSessionRef = this.database.ref(`quizSessions/${userId}`).push();
            await newSessionRef.set({
                ...sessionData,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return newSessionRef.key;
        } catch (error) {
            console.error("Error saving quiz session:", error);
            throw error;
        }
    }

    async getUserQuizSessions(userId, limit = 10) {
        try {
            const snapshot = await this.database.ref(`quizSessions/${userId}`)
                .orderByChild("createdAt")
                .limitToLast(limit)
                .once("value");
            
            const sessions = snapshot.val() || {};
            return Object.entries(sessions).map(([id, session]) => ({
                id,
                ...session
            })).reverse(); // Most recent first
        } catch (error) {
            console.error("Error getting user quiz sessions:", error);
            throw error;
        }
    }

    // Utility Methods
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Initialize default data
    async initializeDefaultData() {
        try {
            // Check if categories exist
            const categories = await this.getCategories();
            
            if (Object.keys(categories).length === 0) {
                // Add default categories
                const defaultCategories = [
                    { name: "Português" },
                    { name: "Matemática" },
                    { name: "Inglês" },
                    { name: "Direito" },
                    { name: "História" },
                    { name: "Geografia" },
                    { name: "Ciências" },
                    { name: "Informática" }
                ];

                for (const category of defaultCategories) {
                    await this.addCategory(category);
                }
                
                console.log("Default categories created");
            }
        } catch (error) {
            console.error("Error initializing default data:", error);
        }
    }

    // Data validation
    validateQuestionData(questionData) {
        const required = ["text", "alternatives", "category", "type"];
        
        for (const field of required) {
            if (!questionData[field]) {
                throw new Error(`Campo obrigatório ausente: ${field}`);
            }
        }

        // Check if correctAnswer is null or undefined, and if so, throw an error
        if (questionData.correctAnswer === null || questionData.correctAnswer === undefined) {
            throw new Error("Campo obrigatório ausente: correctAnswer");
        }

        if (!Array.isArray(questionData.alternatives) || questionData.alternatives.length !== 5) {
            throw new Error("Deve haver exatamente 5 alternativas");
        }

        if (questionData.correctAnswer < 0 || questionData.correctAnswer > 4) {
            throw new Error("Resposta correta deve ser entre 0 e 3");
        }

        return true;
    }

    validateCategoryData(categoryData) {
        if (!categoryData.name || categoryData.name.trim().length === 0) {
            throw new Error("Nome da categoria é obrigatório");
        }

        return true;
    }

    validateSubcategoryData(subcategoryData) {
        if (!subcategoryData.name || subcategoryData.name.trim().length === 0) {
            throw new Error("Nome da subcategoria é obrigatório");
        }

        return true;
    }
}

// Initialize Database Manager
window.databaseManager = new DatabaseManager();

// Initialize default data when the page loads
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        window.databaseManager.initializeDefaultData();
    }, 1000);
});



