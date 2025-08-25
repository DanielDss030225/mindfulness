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
                lastActiveElement.textContent = 'Ativo há 2 horas';
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

    async loadAchievements() {
        // Mock achievements data
        const achievements = [
            { id: 1, name: 'Primeira Questão', icon: '🎯', earned: true },
            { id: 2, name: 'Primeira Centena', icon: '💯', earned: true },
            { id: 3, name: 'Acerto Perfeito', icon: '🎪', earned: true },
            { id: 4, name: 'Sequência de 7 dias', icon: '🔥', earned: true },
            { id: 5, name: 'Especialista em Português', icon: '📚', earned: false },
            { id: 6, name: 'Mestre do Direito', icon: '⚖️', earned: false },
            { id: 7, name: 'Milhar de Questões', icon: '🚀', earned: false },
            { id: 8, name: 'Sequência de 30 dias', icon: '🏆', earned: false },
            { id: 9, name: 'Mentor da Comunidade', icon: '👨‍🏫', earned: false },
            { id: 10, name: 'Lenda dos Concursos', icon: '👑', earned: false },
            { id: 11, name: 'Velocista', icon: '⚡', earned: false },
            { id: 12, name: 'Perfeccionista', icon: '💎', earned: false }
        ];

        const earnedCount = achievements.filter(a => a.earned).length;
        const achievementCountElement = document.getElementById('achievementCount');
        if (achievementCountElement) {
            achievementCountElement.textContent = `${earnedCount} de ${achievements.length} desbloqueadas`;
        }

        const achievementsContainer = document.getElementById('achievementsList');
        if (achievementsContainer) {
            achievementsContainer.innerHTML = achievements.map(achievement => `
                <div class="achievement-badge ${achievement.earned ? 'earned' : ''}">
                    <span class="achievement-icon">${achievement.icon}</span>
                    <div class="achievement-name">${achievement.name}</div>
                </div>
            `).join('');
        }
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

    async loadStudyStreak() {
        // Mock study streak data
        const currentStreak = 7;
        const longestStreak = 15;
        const totalStudyDays = 45;

        const currentStreakElement = document.getElementById('currentStreak');
        if (currentStreakElement) {
            currentStreakElement.textContent = `Sequência atual: ${currentStreak} dias`;
        }

        const longestStreakElement = document.getElementById('longestStreak');
        if (longestStreakElement) {
            longestStreakElement.textContent = longestStreak;
        }

        const totalStudyDaysElement = document.getElementById('totalStudyDays');
        if (totalStudyDaysElement) {
            totalStudyDaysElement.textContent = totalStudyDays;
        }

        // Generate calendar for last 30 days
        this.generateStreakCalendar();
    }

    generateStreakCalendar() {
        const calendarContainer = document.getElementById('streakCalendar');
        if (!calendarContainer) return;

        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        // Mock active days (random for demonstration)
        const activeDays = new Set();
        for (let i = 0; i < 20; i++) {
            const randomDay = Math.floor(Math.random() * 30);
            activeDays.add(randomDay);
        }

        let calendarHTML = '';
        for (let i = 0; i < 30; i++) {
            const date = new Date(thirtyDaysAgo.getTime() + (i * 24 * 60 * 60 * 1000));
            const isToday = date.toDateString() === today.toDateString();
            const isActive = activeDays.has(i);
            
            calendarHTML += `
                <div class="calendar-day ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}">
                    ${date.getDate()}
                </div>
            `;
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

