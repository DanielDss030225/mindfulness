// Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.justLoggedIn = false; // Flag para detectar login manual ou após registro
        this.init();
    }

    init() {
        // Listen for authentication state changes
        window.firebaseServices.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.isAdmin = user && user.email === window.firebaseServices.ADMIN_EMAIL;

            if (user) {
                this.onUserLoggedIn(user);
            } else {
                this.onUserLoggedOut();
            }
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');

        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            window.uiManager.showModal('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        try {
            window.uiManager.showLoading();
            this.justLoggedIn = true; // Marcar login manual
            await window.firebaseServices.auth.signInWithEmailAndPassword(email, password);
            window.uiManager.hideLoading();
        } catch (error) {
            window.uiManager.hideLoading();
            this.justLoggedIn = false;
            this.handleAuthError(error);
        }
    }

    reloadApp() {
        console.log('Recarregando a aplicação...');
        window.location.reload();
    }

    async handleRegister(e) {
        e.preventDefault();

        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        if (!name || !email || !password) {
            window.uiManager.showModal('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        if (password.length < 6) {
            window.uiManager.showModal('Erro', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        try {
            window.uiManager.showLoading();

            const userCredential = await window.firebaseServices.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            await user.updateProfile({ displayName: name });

            await this.createUserProfile(user.uid, {
                name,
                email,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                stats: {
                    totalQuestions: 0,
                    correctAnswers: 0,
                    wrongAnswers: 0,
                    totalScore: 0
                }
            });

            this.justLoggedIn = true; // Marcar que o usuário acabou de se registrar e logar
            this.onUserLoggedIn(user);
            window.uiManager.hideLoading();
            window.uiManager.showModal('Sucesso', 'Conta criada com sucesso!');
        } catch (error) {
            window.uiManager.hideLoading();
            this.handleAuthError(error);
        }
    }

    async createUserProfile(uid, userData) {
        try {
            await window.firebaseServices.database.ref(`users/${uid}`).set(userData);
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await window.firebaseServices.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            window.uiManager.showModal('Erro', 'Erro ao fazer logout. Tente novamente.');
        }
    }

    onUserLoggedIn(user) {
        console.log('User logged in:', user.email);

        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = user.displayName || 'Usuário';
        }

        if (window.profilePictureManager) {
            window.profilePictureManager.loadUserProfilePicture();
        }

        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.style.display = this.isAdmin ? 'flex' : 'none';
        }

        window.uiManager.showScreen('main-menu-screen');
        this.updateProfessorMessage();

        if (this.justLoggedIn) {
            this.justLoggedIn = false;
            this.reloadApp();
        }
    }

    onUserLoggedOut() {
        console.log('User logged out');
        this.currentUser = null;
        this.isAdmin = false;

        if (window.profilePictureManager) {
            window.profilePictureManager.cleanup();
        }

        window.uiManager.showScreen('login-screen');
    }

    updateProfessorMessage() {
        const messages = [
            'Olá! Pronto para aprender hoje?',
            'Vamos testar seus conhecimentos!',
            'Que tal um simulado desafiador?',
            'Aprender nunca foi tão divertido!',
            'Cada questão é uma oportunidade de crescer!',
            'Vamos descobrir o que você já sabe!'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const professorMessage = document.getElementById('professorMessage');

        if (professorMessage) {
            professorMessage.textContent = randomMessage;
        }
    }

    showLoginForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (loginForm && registerForm) {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        }
    }

    showRegisterForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (loginForm && registerForm) {
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
        }
    }

    handleAuthError(error) {
        let message = 'Ocorreu um erro. Tente novamente.';

        switch (error.code) {
            case 'auth/user-not-found':
                message = 'Usuário não encontrado. Verifique o email.';
                break;
            case 'auth/wrong-password':
                message = 'Senha incorreta. Tente novamente.';
                break;
            case 'auth/email-already-in-use':
                message = 'Este email já está em uso. Tente fazer login.';
                break;
            case 'auth/weak-password':
                message = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                break;
            case 'auth/invalid-email':
                message = 'Email inválido. Verifique o formato.';
                break;
            case 'auth/too-many-requests':
                message = 'Muitas tentativas. Tente novamente mais tarde.';
                break;
            default:
                message = error.message || 'Erro desconhecido. Tente novamente.';
        }

        window.uiManager.showModal('Erro de Autenticação', message);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isUserAdmin() {
        return this.isAdmin;
    }

    async getUserData() {
        if (!this.currentUser) return null;

        try {
            const snapshot = await window.firebaseServices.database.ref(`users/${this.currentUser.uid}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    async updateUserStats(stats) {
        if (!this.currentUser) return;

        try {
            await window.firebaseServices.database.ref(`users/${this.currentUser.uid}/stats`).update(stats);
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }
}

// Initialize authentication manager
window.authManager = new AuthManager();
