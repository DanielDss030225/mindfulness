// User Profile Page Manager - Versão Corrigida com Foto de Perfil
class UserProfileManager {
    constructor() {
        this.currentUserId = null;
        this.userData = null;
        this.userStats = null;
        this.performanceChart = null;
        this.init();
    }

    init() {
        // Aguardar que os managers globais estejam disponíveis
        this.waitForGlobalManagers().then(() => {
            // Get user ID from URL parameters
            this.getUserIdFromURL();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load user profile
            this.loadUserProfile();
        }).catch(error => {
            console.error('Error initializing UserProfileManager:', error);
            this.showError('Erro ao inicializar página de perfil');
        });
    }

    async waitForGlobalManagers() {
        // Aguardar que os managers globais estejam disponíveis
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo
        
        while (attempts < maxAttempts) {
            if (window.authManager && window.databaseManager && window.uiManager && window.profilePictureManager) {
                console.log('Global managers are available');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('Global managers not available');
    }

    getUserIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentUserId = urlParams.get('userId');
        
        console.log('URL userId:', this.currentUserId);
        
        if (!this.currentUserId) {
            // Se não há userId na URL, usar o usuário atual logado
            const currentUser = window.authManager.getCurrentUser();
            if (currentUser) {
                this.currentUserId = currentUser.uid;
                console.log('Using current user ID:', this.currentUserId);
            } else {
                console.error('No user ID provided and no current user');
                this.showError('ID do usuário não fornecido e nenhum usuário logado');
                return;
            }
        }
    }

    setupEventListeners() {
        // Back button
        const backToMainBtn = document.getElementById('backToMainBtn');
        if (backToMainBtn) {
            backToMainBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        // Back from error
        const backToMainFromError = document.getElementById('backToMainFromError');
        if (backToMainFromError) {
            backToMainFromError.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        // Follow button
        const followBtn = document.getElementById('followBtn');
        if (followBtn) {
            followBtn.addEventListener('click', () => {
                this.toggleFollow();
            });
        }

        // Message button
        const messageBtn = document.getElementById('messageBtn');
        if (messageBtn) {
            messageBtn.addEventListener('click', () => {
                this.openMessage();
            });
        }

        // Chart type toggle
        const chartTypeBtn = document.getElementById('chartTypeBtn');
        if (chartTypeBtn) {
            chartTypeBtn.addEventListener('click', () => {
                this.toggleChartType();
            });
        }
    }

    async loadUserProfile() {
        try {
            console.log('Starting to load user profile for:', this.currentUserId);
            this.showLoading();

            // Load user data
            await this.loadUserData();
            
            // Load user statistics
            await this.loadUserStats();
            
            // Load user activities
            await this.loadRecentActivity();
            
            // Load achievements
            await this.loadAchievements();
            
            // Load category performance
            await this.loadCategoryPerformance();
            
            // Load study streak
            await this.loadStudyStreak();
            
            // Load sidebar data
            await this.loadSidebarData();
            
            // Create performance chart
            this.createPerformanceChart();
            
            console.log('Profile loaded successfully');
            this.hideLoading();
            this.showProfile();

        } catch (error) {
            console.error('Error loading user profile:', error);
            this.hideLoading();
            this.showError('Erro ao carregar perfil do usuário: ' + error.message);
        }
    }

    async loadUserData() {
        try {
            console.log('Loading user data for userId:', this.currentUserId);
            
            // Verificar se o método getUserData existe
            if (!window.databaseManager.getUserData) {
                throw new Error('Método getUserData não encontrado no databaseManager');
            }
            
            // Usar o databaseManager global para buscar dados do usuário
            const userData = await window.databaseManager.getUserData(this.currentUserId);
            console.log('User data received:', userData);
            
            this.userData = userData;
            
            if (!this.userData) {
                throw new Error('Usuário não encontrado no banco de dados');
            }

            // Update UI with user data
            const userNameElement = document.getElementById('userName2');
            if (userNameElement) {
                userNameElement.textContent = this.userData.name || 'Usuário';
            }

            // CORREÇÃO: Carregar foto de perfil usando o profilePictureManager
            await this.loadUserProfilePicture();
            
            // Set member since date
            const memberSince = this.userData.createdAt ? new Date(this.userData.createdAt).toLocaleDateString('pt-BR', { 
                year: 'numeric', 
                month: 'long' 
            }) : 'Janeiro 2025';
            
            const memberSinceElement = document.getElementById('memberSince');
            if (memberSinceElement) {
                memberSinceElement.textContent = `Membro desde ${memberSince}`;
            }
            
            // Set last active (mock data for now)
            const lastActiveElement = document.getElementById('lastActive');
            if (lastActiveElement) {
                lastActiveElement.textContent = 'Ativo';
            }

            console.log('User data loaded successfully');

        } catch (error) {
            console.error('Error loading user data:', error);
            throw error;
        }
    }

    // NOVO MÉTODO: Carregar foto de perfil corretamente
    async loadUserProfilePicture() {
        try {
            console.log('Loading profile picture for userId:', this.currentUserId);
            
            // Usar o método correto do profilePictureManager
            let photoURL = null;
            
            if (window.profilePictureManager && window.profilePictureManager.getUserProfilePictureURL) {
                photoURL = await window.profilePictureManager.getUserProfilePictureURL(this.currentUserId);
                console.log('Profile picture URL from profilePictureManager:', photoURL);
            }
            
            // Se não encontrou foto, tentar buscar diretamente no Firebase
            if (!photoURL) {
                try {
                    const snapshot = await window.firebaseServices.database.ref(`users/${this.currentUserId}/profile/photoURL`).once('value');
                    photoURL = snapshot.val();
                    console.log('Profile picture URL from Firebase direct:', photoURL);
                } catch (error) {
                    console.log('No profile picture found in Firebase:', error);
                }
            }
            
            // Se ainda não encontrou, usar foto padrão
            if (!photoURL) {
                photoURL = "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";
                console.log('Using default profile picture');
            }
            
            // Atualizar elemento da foto de perfil
            const userAvatarElement = document.getElementById('userAvatar');
            if (userAvatarElement) {
                userAvatarElement.src = photoURL;
                console.log('Profile picture updated in UI:', photoURL);
            } else {
                console.warn('userAvatar element not found');
            }
            
        } catch (error) {
            console.error('Error loading user profile picture:', error);
            // Em caso de erro, usar foto padrão
            const userAvatarElement = document.getElementById('userAvatar');
            if (userAvatarElement) {
                userAvatarElement.src = "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";
            }
        }
    }

    async loadUserStats() {
        try {
            console.log('Loading user stats for userId:', this.currentUserId);
            
            // Usar o databaseManager global para buscar estatísticas
            this.userStats = await window.databaseManager.getUserStats(this.currentUserId);
            
            if (!this.userStats) {
                console.log('No stats found, using defaults');
                this.userStats = {
                    totalQuestions: 0,
                    correctAnswers: 0,
                    wrongAnswers: 0,
                    totalScore: 0
                };
            }

            console.log('User stats loaded:', this.userStats);

            // Calculate derived stats
            const totalQuestions = this.userStats.totalQuestions || 0;
            const correctAnswers = this.userStats.correctAnswers || 0;
            const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

            // Update stats overview
            const totalQuestionsElement = document.getElementById('totalQuestions');
            if (totalQuestionsElement) {
                totalQuestionsElement.textContent = totalQuestions.toLocaleString();
            }

            const correctAnswersElement = document.getElementById('correctAnswers');
            if (correctAnswersElement) {
                correctAnswersElement.textContent = correctAnswers.toLocaleString();
            }

            const accuracyElement = document.getElementById('accuracy');
            if (accuracyElement) {
                accuracyElement.textContent = `${accuracy}%`;
            }
            
            // Mock ranking for now
            const rankingElement = document.getElementById('ranking');
            if (rankingElement) {
                rankingElement.textContent = '#' + Math.floor(Math.random() * 1000 + 1);
            }

            console.log('User stats UI updated successfully');

        } catch (error) {
            console.error('Error loading user stats:', error);
            // Não lançar erro aqui, apenas usar valores padrão
            this.userStats = {
                totalQuestions: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                totalScore: 0
            };
        }
    }








    async loadRecentActivity() {
        // Mock recent activity data
        const activities = [
            {
                type: 'quiz',
                title: 'Completou um quiz de Português',
                description: '15 questões • 80% de acerto',
                time: '2 horas atrás',
                icon: '🎯'
            },
            {
                type: 'achievement',
                title: 'Desbloqueou nova conquista',
                description: 'Primeira Centena - 100 questões resolvidas',
                time: '1 dia atrás',
                icon: '🏆'
            },
            {
                type: 'social',
                title: 'Fez um novo post',
                description: 'Compartilhou dicas de estudo',
                time: '2 dias atrás',
                icon: '📝'
            },
            {
                type: 'quiz',
                title: 'Completou um quiz de Direito',
                description: '12 questões • 75% de acerto',
                time: '3 dias atrás',
                icon: '🎯'
            },
            {
                type: 'achievement',
                title: 'Desbloqueou nova conquista',
                description: 'Sequência de Estudos - 7 dias consecutivos',
                time: '1 semana atrás',
                icon: '🔥'
            }
        ];

        const activityContainer = document.getElementById('recentActivity');
        if (activityContainer) {
            activityContainer.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        ${activity.icon}
                    </div>
                    <div class="activity-details">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                    </div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            `).join('');
        }
    }



// Substitua esta função inteira no seu arquivo js/user-profile.js
// Em js/user-profile.js, substitua a função loadAchievements() inteira
// Em js/user-profile.js, substitua a função loadAchievements() inteira

async loadAchievements() {
    const achievementsContainer = document.getElementById('achievementsList');
    const achievementCountElement = document.getElementById('achievementCount');

    if (!achievementsContainer || !achievementCountElement) return;

    const totalQuestions = this.userStats.totalQuestions || 0;

    if (totalQuestions === 0) {
        achievementCountElement.textContent = '';
        achievementsContainer.innerHTML = `          
            <div class="no-achievements-message">
                <p>🌱 Este usuário está começando sua jornada.</p>
            </div>
        `;
        return;
    }

    // --- LÓGICA PARA CONQUISTAS ESPECÍFICAS ---

    // 1. Buscar detalhes das questões respondidas para analisar por categoria
    const answeredQuestions = await window.databaseManager.getAnsweredQuestionsDetails(this.currentUserId);

    // 2. Buscar os IDs das categorias "Português" e "Direito"
    const allCategories = await window.databaseManager.getCategories();
    let portuguesCategoryId = null;
    let direitoCategoryId = null; // <-- Variável para o ID de Direito

    for (const id in allCategories) {
        const categoryName = allCategories[id].name.toLowerCase();
        if (categoryName === 'português') {
            portuguesCategoryId = id;
        }
        if (categoryName === 'direito') { // <-- Encontra o ID para Direito
            direitoCategoryId = id;
        }
    }

    // 3. Contar quantas questões de cada categoria foram respondidas
    let portuguesQuestionsCount = 0;
    if (portuguesCategoryId) {
        portuguesQuestionsCount = answeredQuestions.filter(q => q.category === portuguesCategoryId).length;
    }

    let direitoQuestionsCount = 0; // <-- Variável para a contagem de Direito
    if (direitoCategoryId) {
        direitoQuestionsCount = answeredQuestions.filter(q => q.category === direitoCategoryId).length;
    }

    // 4. Usar os dados da sequência calculados anteriormente (se existirem)
    const currentStreak = this.streaksData ? this.streaksData.currentStreak : 0;

    // 5. Definir a lista de conquistas com a nova lógica para Direito
    const achievements = [
        { id: 1, name: 'Primeira Questão', icon: '🎯', earned: totalQuestions >= 1 },
        { id: 2, name: '100 Questões', icon: '💯', earned: totalQuestions >= 20 },
        { id: 3, name: 'Acerto Perfeito', icon: '🎪', earned: totalQuestions >= 50 },
        { id: 4, name: 'Concurseiro Pro', icon: '🔥', earned: totalQuestions >= 100 },
          { id: 5, name: 'Especialista em Português', icon: '📚', earned: portuguesQuestionsCount >= 10 },
        { id: 6, name: 'Mestre do Direito', icon: '⚖️', earned: direitoQuestionsCount >= 10 }, // <-- LÓGICA ADICIONADA AQUI
        { id: 7, name: 'Milhar de Questões', icon: '🚀', earned: totalQuestions >= 150 },
        { id: 8, name: '200 Questões', icon: '🏆',earned: totalQuestions >= 200 },
        { id: 9, name: 'Mentor da Comunidade', icon: '👨‍🏫', earned: totalQuestions >= 250 },
        { id: 10, name: 'Lenda dos Concursos', icon: '👑', earned: totalQuestions >= 500 },
        { id: 11, name: '1000 Questões', icon: '⚡',  earned: totalQuestions >= 1000 },
        { id: 12, name: '5000 Questões', icon: '💎', earned: totalQuestions >= 5000 },
       
    ];

    // 6. Renderizar as conquistas na UI
    const earnedCount = achievements.filter(a => a.earned).length;
    achievementCountElement.textContent = `${earnedCount} de ${achievements.length} desbloqueadas`;

    achievementsContainer.innerHTML = achievements.map(achievement => `
        <div class="achievement-badge ${achievement.earned ? 'earned' : ''}" title="${achievement.name}">
            <span class="achievement-icon">${achievement.icon}</span>
            <div class="achievement-name">${achievement.name}</div>
        </div>
    `).join('');
}



    async loadCategoryPerformance() {
        // Mock category performance data
        const categories = [
            { name: 'Português', questions: 150, correct: 120, percentage: 80 },
            { name: 'Direito Constitucional', questions: 89, correct: 67, percentage: 75 },
            { name: 'Direito Administrativo', questions: 76, correct: 53, percentage: 70 },
            { name: 'Inglês', questions: 45, correct: 36, percentage: 80 },
            { name: 'Matemática', questions: 32, correct: 19, percentage: 59 },
            { name: 'Informática', questions: 28, correct: 22, percentage: 79 }
        ];

        const categoryContainer = document.getElementById('categoryPerformance');
        if (categoryContainer) {
            categoryContainer.innerHTML = categories.map(category => `
                <div class="category-stat">
                    <div class="category-name">${category.name}</div>
                    <div class="category-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${category.percentage}%"></div>
                        </div>
                        <span class="category-percentage">${category.percentage}%</span>
                    </div>
                </div>
            `).join('');
        }
    }



// Em js/user-profile.js, substitua a função loadStudyStreak() inteira
// Em js/user-profile.js, substitua a função loadStudyStreak() inteira

async loadStudyStreak() {
    const calendarContainer = document.getElementById('streakCalendar');
    const currentStreakElement = document.getElementById('currentStreak');
    const longestStreakElement = document.getElementById('longestStreak');
    const totalStudyDaysElement = document.getElementById('totalStudyDays');

    if (!calendarContainer || !currentStreakElement || !longestStreakElement || !totalStudyDaysElement) return;

    try {
        const dailyActivity = await window.databaseManager.getDailyActivity(this.currentUserId);
        
        // CORREÇÃO: Converte as chaves de data (string) para objetos de Data em UTC.
        // Isso padroniza o tratamento de datas, eliminando problemas de fuso horário.
        const activeDates = Object.keys(dailyActivity).map(dateStr => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(Date.UTC(year, month - 1, day));
        });

        if (activeDates.length === 0) {
            currentStreakElement.textContent = 'Sequência atual: 0 dias';
            longestStreakElement.textContent = '0';
            totalStudyDaysElement.textContent = '0';
            this.generateStreakCalendar([]);
            this.streaksData = { currentStreak: 0, longestStreak: 0 };
            return;
        }

        // A função de cálculo agora recebe as datas padronizadas em UTC.
        const streaks = this.calculateStreaks(activeDates);
        
        currentStreakElement.textContent = `Sequência atual: ${streaks.currentStreak} dias`;
        longestStreakElement.textContent = streaks.longestStreak;
        totalStudyDaysElement.textContent = streaks.totalStudyDays;

        this.generateStreakCalendar(activeDates);
        this.streaksData = streaks;

    } catch (error) {
        console.error('Erro ao carregar sequência de estudos:', error);
        currentStreakElement.textContent = 'Erro ao carregar';
    }
}

// Em js/user-profile.js, substitua também a função calculateStreaks()

calculateStreaks(dates) {
    if (dates.length === 0) {
        return { currentStreak: 0, longestStreak: 0, totalStudyDays: 0 };
    }

    // Ordena as datas para garantir que a lógica funcione corretamente.
    dates.sort((a, b) => a.getTime() - b.getTime());

    let currentStreak = 0;
    let longestStreak = 1;
    let tempLongest = 1;

    // CORREÇÃO: Usa UTC para obter a data de "hoje" e "ontem" de forma consistente.
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const yesterdayUTC = new Date(todayUTC);
    yesterdayUTC.setUTCDate(todayUTC.getUTCDate() - 1);

    const lastActiveDate = dates[dates.length - 1];

    // Verifica se a sequência atual está ativa (última atividade foi hoje ou ontem).
    if (lastActiveDate.getTime() === todayUTC.getTime() || lastActiveDate.getTime() === yesterdayUTC.getTime()) {
        currentStreak = 1;
        // Itera de trás para frente para calcular a sequência atual.
        for (let i = dates.length - 1; i > 0; i--) {
            const diff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                currentStreak++;
            } else {
                break; // A sequência foi quebrada.
            }
        }
    }

    // Itera do início ao fim para encontrar a maior sequência de todos os tempos.
    for (let i = 1; i < dates.length; i++) {
        const diff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
            tempLongest++;
        } else {
            tempLongest = 1; // Reseta a contagem se houver uma falha.
        }
        if (tempLongest > longestStreak) {
            longestStreak = tempLongest;
        }
    }

    return {
        currentStreak,
        longestStreak,
        totalStudyDays: dates.length
    };
}





// Em js/user-profile.js, substitua sua função por esta:

generateStreakCalendar(activeDates) {
    const calendarContainer = document.getElementById('streakCalendar');
    if (!calendarContainer) return;

    const activeDateStrings = new Set(activeDates.map(d => d.toISOString().split('T')[0]));
    const today = new Date();
    let calendarHTML = '';

    for (let i = 29; i >= -12; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        const isToday = i === 0;
        const isActive = activeDateStrings.has(dateString);
        
        // ==========================================================
        // ▼▼▼ A MÁGICA ACONTECE AQUI ▼▼▼
        // Usamos date.getDate() para pegar o número do dia e o inserimos no HTML.
        // ==========================================================
        calendarHTML += `
            <div class="calendar-day ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}" title="${date.toLocaleDateString('pt-BR')}">
                ${date.getDate()}
            </div>
        `;
        // ==========================================================
    }
    
    calendarContainer.innerHTML = calendarHTML;
}




    

    async loadSidebarData() {
        // Quick stats
        const questionsTodayElement = document.getElementById('questionsToday');
        if (questionsTodayElement) {
            questionsTodayElement.textContent = '12';
        }

        const studyTimeElement = document.getElementById('studyTime');
        if (studyTimeElement) {
            studyTimeElement.textContent = '2h 30m';
        }

        const userLevelElement = document.getElementById('userLevel');
        if (userLevelElement) {
            userLevelElement.textContent = '8';
        }

        // Favorite categories
        const favoriteCategories = [
            { name: 'Português', icon: '📚', questions: 150 },
            { name: 'Direito', icon: '⚖️', questions: 165 },
            { name: 'Inglês', icon: '🌍', questions: 45 }
        ];

        const favCategoriesContainer = document.getElementById('favoriteCategories');
        if (favCategoriesContainer) {
            favCategoriesContainer.innerHTML = favoriteCategories.map(category => `
                <div class="favorite-category">
                    <div class="category-icon">${category.icon}</div>
                    <div class="category-info">
                        <div class="category-title">${category.name}</div>
                        <div class="category-questions">${category.questions} questões</div>
                    </div>
                </div>
            `).join('');
        }

        // Recent badges
        const recentBadges = ['🎯', '💯', '🔥', '📚'];
        const badgesContainer = document.getElementById('recentBadges');
        if (badgesContainer) {
            badgesContainer.innerHTML = recentBadges.map(badge => `
                <div class="recent-badge">${badge}</div>
            `).join('');
        }

        // Social stats
        const followersCountElement = document.getElementById('followersCount');
        if (followersCountElement) {
            followersCountElement.textContent = Math.floor(Math.random() * 500 + 50);
        }

        const followingCountElement = document.getElementById('followingCount');
        if (followingCountElement) {
            followingCountElement.textContent = Math.floor(Math.random() * 200 + 20);
        }

        const postsCountElement = document.getElementById('postsCount');
        if (postsCountElement) {
            postsCountElement.textContent = Math.floor(Math.random() * 50 + 5);
        }
    }

    createPerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas || !this.userStats) return;

        const ctx = canvas.getContext('2d');
        const totalQuestions = this.userStats.totalQuestions || 0;
        const correctAnswers = this.userStats.correctAnswers || 0;
        const wrongAnswers = this.userStats.wrongAnswers || 0;

        // If no data, show empty state
        if (totalQuestions === 0) {
            this.showEmptyChartState(ctx);
            return;
        }

        // Create pie chart
        this.performanceChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Questões Corretas', 'Questões Incorretas'],
                datasets: [{
                    data: [correctAnswers, wrongAnswers],
                    backgroundColor: [
                        '#4CAF50',
                        '#f44336'
                    ],
                    borderColor: [
                        '#45a049',
                        '#d32f2f'
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
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 14,
                                weight: '600'
                            },
                            color: '#333'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        },
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#4CAF50',
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
            "",
            ctx.canvas.width / 2,
            ctx.canvas.height / 2 + 15
        );
    }

    toggleChartType() {
        if (!this.performanceChart || !this.userStats) return;

        const currentType = this.performanceChart.config.type;
        const newType = currentType === 'pie' ? 'bar' : 'pie';

        // Destroy current chart
        this.performanceChart.destroy();

        // Create new chart with different type
        const canvas = document.getElementById('performanceChart');
        const ctx = canvas.getContext('2d');
        const correctAnswers = this.userStats.correctAnswers || 0;
        const wrongAnswers = this.userStats.wrongAnswers || 0;

        if (newType === 'bar') {
            this.performanceChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Questões Corretas', 'Questões Incorretas'],
                    datasets: [{
                        data: [correctAnswers, wrongAnswers],
                        backgroundColor: ['#4CAF50', '#f44336'],
                        borderColor: ['#45a049', '#d32f2f'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } else {
            // Recreate pie chart
            this.createPerformanceChart();
        }

        // Update button text
        const btn = document.getElementById('chartTypeBtn');
        if (btn) {
            btn.textContent = newType === 'pie' ? '📊 Gráfico Pizza' : '📊 Gráfico Barras';
        }
    }

    async toggleFollow() {
        // Mock follow functionality
        const followBtn = document.getElementById('followBtn');
        if (!followBtn) return;

        const isFollowing = followBtn.textContent.includes('Seguindo');
        
        if (isFollowing) {
            followBtn.innerHTML = '<span class="follow-icon">👤</span> Seguir';
            followBtn.style.background = '#4CAF50';
        } else {
            followBtn.innerHTML = '<span class="follow-icon">✓</span> Seguindo';
            followBtn.style.background = '#6c757d';
        }
        
        // Here you would implement actual follow/unfollow logic with Firebase
    }

    openMessage() {
        // Mock message functionality
        alert('Funcionalidade de mensagem será implementada em breve!');
    }

    showLoading() {
        console.log('Showing loading screen');
        const loadingScreen = document.getElementById('loading-screen');
        const profileContent = document.getElementById('profile-content');
        const errorState = document.getElementById('error-state');

        if (loadingScreen) {
            loadingScreen.classList.add('active');
            loadingScreen.style.display = 'flex';
        }
        if (profileContent) {
            profileContent.style.display = 'none';
        }
        if (errorState) {
            errorState.style.display = 'none';
        }
    }

    hideLoading() {
        console.log('Hiding loading screen');
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
            loadingScreen.style.display = 'none';
        }
    }

    showProfile() {
        console.log('Showing profile content');
        const profileContent = document.getElementById('profile-content');
        const errorState = document.getElementById('error-state');

        if (profileContent) {
            profileContent.style.display = 'grid';
        }
        if (errorState) {
            errorState.style.display = 'none';
        }
    }

    showError(message) {
        console.log('Showing error:', message);
        const loadingScreen = document.getElementById('loading-screen');
        const profileContent = document.getElementById('profile-content');
        const errorState = document.getElementById('error-state');

        if (loadingScreen) {
            loadingScreen.classList.remove('active');
            loadingScreen.style.display = 'none';
        }
        if (profileContent) {
            profileContent.style.display = 'none';
        }
        if (errorState) {
            errorState.style.display = 'flex';
        }
        
        const errorContent = document.querySelector('.error-content p');
        if (errorContent) {
            errorContent.textContent = message;
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing UserProfileManager');
    new UserProfileManager();
});

