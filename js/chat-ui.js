// Chat UI Manager - Gerencia a interface do usuário do chat
class ChatUI {
    constructor() {
        this.isOpen = false;
        this.currentTab = 'global';
        this.currentConversation = null;
        this.messageCache = new Map();
        this.userCache = new Map();
        this.searchTimeout = null;
        
        // Elementos DOM
        this.elements = {};
        
        this.init();
    }

    async init() {
        try {
            // Aguarda o ChatManager estar pronto
            if (window.chatManager && window.chatManager.isReady()) {
                this.setupUI();
            } else {
                document.addEventListener('chat:chatReady', () => {
                    this.setupUI();
                });
            }
            
            // Configura listeners de eventos do chat
            this.setupChatEventListeners();
            
            console.log('ChatUI initialized');
        } catch (error) {
            console.error('Error initializing ChatUI:', error);
        }
    }

    setupUI() {
        // Cria elementos do chat
        this.createChatElements();
        
        // Configura event listeners
        this.setupEventListeners();
        
        // Carrega dados iniciais
        this.loadInitialData();
    }

    createChatElements() {
        // Botão flutuante do chat
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'chat-toggle-btn';
        toggleBtn.innerHTML = `
            💬
            <span class="chat-notification-badge"></span>
        `;
        document.body.appendChild(toggleBtn);
        this.elements.toggleBtn = toggleBtn;

        // Janela principal do chat
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.innerHTML = this.getChatWindowHTML();
        document.body.appendChild(chatWindow);
        this.elements.chatWindow = chatWindow;

        // Modal de perfil
        const profileModal = document.createElement('div');
        profileModal.className = 'chat-profile-modal';
        profileModal.innerHTML = this.getProfileModalHTML();
        document.body.appendChild(profileModal);
        this.elements.profileModal = profileModal;

        // Armazena referências dos elementos
        this.cacheElements();
    }

    getChatWindowHTML() {
        return `
            <div class="chat-header">
                <h3>Chat</h3>
                <div class="chat-header-actions">
                    <button class="chat-header-btn" id="chatSettingsBtn" title="Configurações">
                        ⚙️
                    </button>
                    <button class="chat-header-btn" id="chatCloseBtn" title="Fechar">
                        ✕
                    </button>
                </div>
            </div>
            
            <div class="chat-tabs">
                <button class="chat-tab active" data-tab="global">
                    Global
                    <span class="chat-tab-badge"></span>
                </button>
                <button class="chat-tab" data-tab="private">
                    Privadas
                    <span class="chat-tab-badge"></span>
                </button>
                <button class="chat-tab" data-tab="groups">
                    Grupos
                    <span class="chat-tab-badge"></span>
                </button>
            </div>
            
            <div class="chat-content">
                <!-- Painel Global -->
                <div class="chat-panel active" data-panel="global">
                    <div class="chat-search">
                        <input type="text" class="chat-search-input" placeholder="Pesquisar usuários..." id="userSearchInput">
                    </div>
                    <div class="chat-users-list" id="onlineUsersList">
                        <div class="chat-loading">
                            <div class="chat-loading-spinner"></div>
                        </div>
                    </div>
                    <div class="chat-messages" id="globalMessages">
                        <div class="chat-loading">
                            <div class="chat-loading-spinner"></div>
                        </div>
                    </div>
                    <div class="chat-input-area">
                        <div class="chat-input-container">
                            <textarea class="chat-input" placeholder="Digite sua mensagem..." id="globalMessageInput" rows="1"></textarea>
                            <button class="chat-send-btn" id="globalSendBtn">
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Painel Privadas -->
                <div class="chat-panel" data-panel="private">
                    <div class="chat-conversations" id="privateConversations">
                        <div class="chat-empty-state">
                            <div class="chat-empty-icon">💬</div>
                            <div class="chat-empty-title">Nenhuma conversa</div>
                            <div class="chat-empty-description">Clique em um usuário online para iniciar uma conversa</div>
                        </div>
                    </div>
                    <div class="chat-messages" id="privateMessages" style="display: none;">
                        <!-- Mensagens da conversa privada selecionada -->
                    </div>
                    <div class="chat-input-area" id="privateInputArea" style="display: none;">
                        <div class="chat-input-container">
                            <textarea class="chat-input" placeholder="Digite sua mensagem..." id="privateMessageInput" rows="1"></textarea>
                            <button class="chat-send-btn" id="privateSendBtn">
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Painel Grupos -->
                <div class="chat-panel" data-panel="groups">
                    <div class="chat-conversations" id="groupConversations">
                        <div class="chat-empty-state">
                            <div class="chat-empty-icon">👥</div>
                            <div class="chat-empty-title">Nenhum grupo</div>
                            <div class="chat-empty-description">Crie ou participe de grupos para conversar com múltiplos usuários</div>
                        </div>
                    </div>
                    <div class="chat-messages" id="groupMessages" style="display: none;">
                        <!-- Mensagens do grupo selecionado -->
                    </div>
                    <div class="chat-input-area" id="groupInputArea" style="display: none;">
                        <div class="chat-input-container">
                            <textarea class="chat-input" placeholder="Digite sua mensagem..." id="groupMessageInput" rows="1"></textarea>
                            <button class="chat-send-btn" id="groupSendBtn">
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProfileModalHTML() {
        return `
            <div class="chat-profile-content">
                <div class="chat-profile-header">
                    <img class="chat-profile-avatar" src="" alt="Avatar">
                    <h3 class="chat-profile-name"></h3>
                    <p class="chat-profile-email"></p>
                </div>
                <div class="chat-profile-actions">
                    <button class="chat-profile-btn primary" id="startPrivateChatBtn">
                        Conversar
                    </button>
                    <button class="chat-profile-btn secondary" id="closeProfileBtn">
                        Fechar
                    </button>
                </div>
            </div>
        `;
    }

    cacheElements() {
        // Botões principais
        this.elements.toggleBtn = document.querySelector('.chat-toggle-btn');
        this.elements.chatWindow = document.querySelector('.chat-window');
        this.elements.closeBtn = document.getElementById('chatCloseBtn');
        this.elements.settingsBtn = document.getElementById('chatSettingsBtn');
        
        // Abas
        this.elements.tabs = document.querySelectorAll('.chat-tab');
        this.elements.panels = document.querySelectorAll('.chat-panel');
        
        // Elementos globais
        this.elements.userSearchInput = document.getElementById('userSearchInput');
        this.elements.onlineUsersList = document.getElementById('onlineUsersList');
        this.elements.globalMessages = document.getElementById('globalMessages');
        this.elements.globalMessageInput = document.getElementById('globalMessageInput');
        this.elements.globalSendBtn = document.getElementById('globalSendBtn');
        
        // Elementos privados
        this.elements.privateConversations = document.getElementById('privateConversations');
        this.elements.privateMessages = document.getElementById('privateMessages');
        this.elements.privateMessageInput = document.getElementById('privateMessageInput');
        this.elements.privateSendBtn = document.getElementById('privateSendBtn');
        this.elements.privateInputArea = document.getElementById('privateInputArea');
        
        // Elementos de grupos
        this.elements.groupConversations = document.getElementById('groupConversations');
        this.elements.groupMessages = document.getElementById('groupMessages');
        this.elements.groupMessageInput = document.getElementById('groupMessageInput');
        this.elements.groupSendBtn = document.getElementById('groupSendBtn');
        this.elements.groupInputArea = document.getElementById('groupInputArea');
        
        // Modal de perfil
        this.elements.profileModal = document.querySelector('.chat-profile-modal');
        this.elements.profileAvatar = document.querySelector('.chat-profile-avatar');
        this.elements.profileName = document.querySelector('.chat-profile-name');
        this.elements.profileEmail = document.querySelector('.chat-profile-email');
        this.elements.startPrivateChatBtn = document.getElementById('startPrivateChatBtn');
        this.elements.closeProfileBtn = document.getElementById('closeProfileBtn');
        
        // Badge de notificações
        this.elements.notificationBadge = document.querySelector('.chat-notification-badge');
    }

    setupEventListeners() {
        // Botão de toggle
        this.elements.toggleBtn.addEventListener('click', () => this.toggleChat());
        
        // Botão de fechar
        this.elements.closeBtn.addEventListener('click', () => this.closeChat());
        
        // Abas
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        // Pesquisa de usuários
        this.elements.userSearchInput.addEventListener('input', (e) => {
            this.handleUserSearch(e.target.value);
        });
        
        // Envio de mensagens
        this.elements.globalSendBtn.addEventListener('click', () => this.sendGlobalMessage());
        this.elements.privateSendBtn.addEventListener('click', () => this.sendPrivateMessage());
        this.elements.groupSendBtn.addEventListener('click', () => this.sendGroupMessage());
        
        // Enter para enviar mensagens
        this.elements.globalMessageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendGlobalMessage();
            }
        });
        
        this.elements.privateMessageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendPrivateMessage();
            }
        });
        
        this.elements.groupMessageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendGroupMessage();
            }
        });
        
        // Auto-resize dos textareas
        [this.elements.globalMessageInput, this.elements.privateMessageInput, this.elements.groupMessageInput].forEach(textarea => {
            textarea.addEventListener('input', () => this.autoResizeTextarea(textarea));
        });
        
        // Modal de perfil
        this.elements.closeProfileBtn.addEventListener('click', () => this.closeProfileModal());
        this.elements.startPrivateChatBtn.addEventListener('click', () => this.startPrivateChat());
        
        // Fechar modal clicando fora
        this.elements.profileModal.addEventListener('click', (e) => {
            if (e.target === this.elements.profileModal) {
                this.closeProfileModal();
            }
        });
        
        // Fechar chat com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
    }

    setupChatEventListeners() {
        // Nova mensagem
        document.addEventListener('chat:newMessage', (event) => {
            this.handleNewMessage(event.detail);
        });
        
        // Usuários online atualizados
        document.addEventListener('chat:onlineUsersUpdated', (event) => {
            this.updateOnlineUsers(event.detail);
        });
        
        // Conversas atualizadas
        document.addEventListener('chat:conversationsUpdated', (event) => {
            this.updateConversations(event.detail);
        });
        
        // Abrir conversa específica
        document.addEventListener('chat:openConversation', (event) => {
            this.openConversation(event.detail.type, event.detail.conversationId);
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        this.elements.chatWindow.classList.add('active');
        this.elements.toggleBtn.classList.add('active');
        
        // Foca no input da aba atual
        this.focusCurrentInput();
        
        // Marca mensagens como lidas se necessário
        this.markCurrentMessagesAsRead();
    }

    closeChat() {
        this.isOpen = false;
        this.elements.chatWindow.classList.remove('active');
        this.elements.toggleBtn.classList.remove('active');
    }

    switchTab(tabName) {
        // Atualiza abas
        this.elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Atualiza painéis
        this.elements.panels.forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabName);
        });
        
        this.currentTab = tabName;
        
        // Carrega dados da aba se necessário
        this.loadTabData(tabName);
        
        // Foca no input
        this.focusCurrentInput();
        
        // Marca mensagens como lidas
        this.markCurrentMessagesAsRead();
    }

    async loadInitialData() {
        try {
            // Carrega usuários online
            if (window.chatManager) {
                const onlineUsers = window.chatManager.getOnlineUsers();
                this.updateOnlineUsers(onlineUsers);
                
                const conversations = window.chatManager.getConversations();
                this.updateConversations(conversations);
            }
            
            // Carrega mensagens globais
            await this.loadGlobalMessages();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'global':
                await this.loadGlobalMessages();
                break;
            case 'private':
                this.loadPrivateConversations();
                break;
            case 'groups':
                this.loadGroupConversations();
                break;
        }
    }

    async loadGlobalMessages() {
        // Por enquanto, mostra estado vazio
        // As mensagens serão carregadas via eventos do ChatManager
        this.elements.globalMessages.innerHTML = `
            <div class="chat-empty-state">
                <div class="chat-empty-icon">🌍</div>
                <div class="chat-empty-title">Chat Global</div>
                <div class="chat-empty-description">Converse com todos os usuários online</div>
            </div>
        `;
    }

    updateOnlineUsers(users) {
        const container = this.elements.onlineUsersList;
        
        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="chat-empty-state">
                    <div class="chat-empty-icon">👤</div>
                    <div class="chat-empty-title">Nenhum usuário online</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = users.map(([userId, userData]) => `
            <div class="chat-user-item" data-user-id="${userId}">
                <div class="chat-user-avatar">
                    <img src="${userData.profilePicture}" alt="${userData.name}">
                    <div class="chat-user-status ${userData.isOnline ? 'online' : 'offline'}"></div>
                </div>
                <div class="chat-user-info">
                    <p class="chat-user-name">${userData.name}</p>
                    <p class="chat-user-last-seen">${this.formatLastSeen(userData.lastSeen, userData.isOnline)}</p>
                </div>
            </div>
        `).join('');
        
        // Adiciona event listeners
        container.querySelectorAll('.chat-user-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                this.showUserProfile(userId);
            });
        });
    }

    updateConversations(conversations) {
        // Atualiza conversas privadas
        this.updatePrivateConversations(conversations.filter(([key]) => key.startsWith('private_')));
        
        // Atualiza grupos
        this.updateGroupConversations(conversations.filter(([key]) => key.startsWith('group_')));
    }

    updatePrivateConversations(conversations) {
        const container = this.elements.privateConversations;
        
        if (!conversations || conversations.length === 0) {
            container.innerHTML = `
                <div class="chat-empty-state">
                    <div class="chat-empty-icon">💬</div>
                    <div class="chat-empty-title">Nenhuma conversa</div>
                    <div class="chat-empty-description">Clique em um usuário online para iniciar uma conversa</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = conversations.map(([key, data]) => {
            const userId = key.replace('private_', '');
            return `
                <div class="chat-conversation-item" data-conversation-id="${userId}" data-type="private">
                    <div class="chat-conversation-avatar">
                        <img src="${data.otherUserProfilePic}" alt="${data.otherUserName}">
                    </div>
                    <div class="chat-conversation-info">
                        <p class="chat-conversation-name">${data.otherUserName}</p>
                        <p class="chat-conversation-last-message">${data.lastMessage}</p>
                    </div>
                    <div class="chat-conversation-meta">
                        <span class="chat-conversation-time">${this.formatTime(data.lastMessageTime)}</span>
                        <span class="chat-conversation-unread ${data.unreadCount > 0 ? 'show' : ''}">${data.unreadCount}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adiciona event listeners
        container.querySelectorAll('.chat-conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const conversationId = item.dataset.conversationId;
                const type = item.dataset.type;
                this.openConversation(type, conversationId);
            });
        });
    }

    updateGroupConversations(conversations) {
        const container = this.elements.groupConversations;
        
        if (!conversations || conversations.length === 0) {
            container.innerHTML = `
                <div class="chat-empty-state">
                    <div class="chat-empty-icon">👥</div>
                    <div class="chat-empty-title">Nenhum grupo</div>
                    <div class="chat-empty-description">Crie ou participe de grupos para conversar com múltiplos usuários</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = conversations.map(([key, data]) => {
            const groupId = key.replace('group_', '');
            return `
                <div class="chat-conversation-item" data-conversation-id="${groupId}" data-type="group">
                    <div class="chat-conversation-avatar">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${data.groupName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div class="chat-conversation-info">
                        <p class="chat-conversation-name">${data.groupName}</p>
                        <p class="chat-conversation-last-message">${data.lastMessage}</p>
                    </div>
                    <div class="chat-conversation-meta">
                        <span class="chat-conversation-time">${this.formatTime(data.lastMessageTime)}</span>
                        <span class="chat-conversation-unread ${data.unreadCount > 0 ? 'show' : ''}">${data.unreadCount}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adiciona event listeners
        container.querySelectorAll('.chat-conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const conversationId = item.dataset.conversationId;
                const type = item.dataset.type;
                this.openConversation(type, conversationId);
            });
        });
    }

    handleNewMessage(messageData) {
        const { type, message, conversationId } = messageData;
        
        // Atualiza badge de notificações
        this.updateNotificationBadge();
        
        // Adiciona mensagem à interface se a conversa estiver aberta
        if (this.isConversationActive(type, conversationId)) {
            this.addMessageToUI(type, message, conversationId);
        }
    }

    addMessageToUI(type, message, conversationId) {
        let messagesContainer;
        
        switch (type) {
            case 'global':
                messagesContainer = this.elements.globalMessages;
                break;
            case 'private':
                messagesContainer = this.elements.privateMessages;
                break;
            case 'group':
                messagesContainer = this.elements.groupMessages;
                break;
            default:
                return;
        }
        
        // Remove estado vazio se existir
        const emptyState = messagesContainer.querySelector('.chat-empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        // Cria elemento da mensagem
        const messageElement = this.createMessageElement(message);
        messagesContainer.appendChild(messageElement);
        
        // Scroll para baixo
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    createMessageElement(message) {
        const currentUser = window.chatManager.getCurrentUser();
        const isOwn = message.senderId === currentUser.uid;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isOwn ? 'own' : ''}`;
        
        messageDiv.innerHTML = `
            <img class="chat-message-avatar" src="${message.senderProfilePic}" alt="${message.senderName}">
            <div class="chat-message-content">
                <div class="chat-message-header">
                    <span class="chat-message-sender">${message.senderName}</span>
                    <span class="chat-message-time">${this.formatTime(message.timestamp)}</span>
                </div>
                <div class="chat-message-bubble">
                    <div class="chat-message-text">${this.formatMessageText(message.message)}</div>
                    ${message.linkPreview ? this.renderLinkPreview(message.linkPreview) : ''}
                </div>
            </div>
        `;
        
        // Adiciona event listener para o avatar
        const avatar = messageDiv.querySelector('.chat-message-avatar');
        avatar.addEventListener('click', () => {
            if (!isOwn) {
                this.showUserProfile(message.senderId);
            }
        });
        
        return messageDiv;
    }

    formatMessageText(text) {
        // Escapa HTML e converte quebras de linha
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return escaped.replace(/\n/g, '<br>');
    }

    renderLinkPreview(preview) {
        if (!preview) return '';
        
        return window.linkPreviewManager.renderPreview(preview);
    }

    async sendGlobalMessage() {
        const input = this.elements.globalMessageInput;
        const message = input.value.trim();
        
        if (!message) return;
        
        try {
            this.elements.globalSendBtn.disabled = true;
            await window.chatManager.sendMessage('global', message);
            input.value = '';
            this.autoResizeTextarea(input);
        } catch (error) {
            console.error('Error sending global message:', error);
            alert('Erro ao enviar mensagem: ' + error.message);
        } finally {
            this.elements.globalSendBtn.disabled = false;
        }
    }

    async sendPrivateMessage() {
        if (!this.currentConversation) return;
        
        const input = this.elements.privateMessageInput;
        const message = input.value.trim();
        
        if (!message) return;
        
        try {
            this.elements.privateSendBtn.disabled = true;
            await window.chatManager.sendMessage('private', message, this.currentConversation);
            input.value = '';
            this.autoResizeTextarea(input);
        } catch (error) {
            console.error('Error sending private message:', error);
            alert('Erro ao enviar mensagem: ' + error.message);
        } finally {
            this.elements.privateSendBtn.disabled = false;
        }
    }

    async sendGroupMessage() {
        if (!this.currentConversation) return;
        
        const input = this.elements.groupMessageInput;
        const message = input.value.trim();
        
        if (!message) return;
        
        try {
            this.elements.groupSendBtn.disabled = true;
            await window.chatManager.sendMessage('group', message, this.currentConversation);
            input.value = '';
            this.autoResizeTextarea(input);
        } catch (error) {
            console.error('Error sending group message:', error);
            alert('Erro ao enviar mensagem: ' + error.message);
        } finally {
            this.elements.groupSendBtn.disabled = false;
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }

    handleUserSearch(query) {
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(async () => {
            if (query.length < 2) {
                // Mostra usuários online se a pesquisa estiver vazia
                const onlineUsers = window.chatManager.getOnlineUsers();
                this.updateOnlineUsers(onlineUsers);
                return;
            }
            
            try {
                const results = await window.chatManager.searchUsers(query);
                this.displaySearchResults(results);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        }, 300);
    }

    displaySearchResults(results) {
        const container = this.elements.onlineUsersList;
        
        if (!results || results.length === 0) {
            container.innerHTML = `
                <div class="chat-empty-state">
                    <div class="chat-empty-icon">🔍</div>
                    <div class="chat-empty-title">Nenhum resultado</div>
                    <div class="chat-empty-description">Tente pesquisar por outro nome ou email</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = results.map(user => `
            <div class="chat-user-item" data-user-id="${user.id}">
                <div class="chat-user-avatar">
                    <img src="${user.profilePicture}" alt="${user.name}">
                    <div class="chat-user-status ${user.isOnline ? 'online' : 'offline'}"></div>
                </div>
                <div class="chat-user-info">
                    <p class="chat-user-name">${user.name}</p>
                    <p class="chat-user-last-seen">${this.formatLastSeen(user.lastSeen, user.isOnline)}</p>
                </div>
            </div>
        `).join('');
        
        // Adiciona event listeners
        container.querySelectorAll('.chat-user-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                this.showUserProfile(userId);
            });
        });
    }

    async showUserProfile(userId) {
        try {
            const userData = await window.chatManager.getUserData(userId);
            if (!userData) return;
            
            this.elements.profileAvatar.src = userData.profilePicture;
            this.elements.profileName.textContent = userData.name;
            this.elements.profileEmail.textContent = userData.email;
            
            // Armazena ID do usuário para iniciar conversa
            this.elements.startPrivateChatBtn.dataset.userId = userId;
            
            this.elements.profileModal.classList.add('active');
        } catch (error) {
            console.error('Error showing user profile:', error);
        }
    }

    closeProfileModal() {
        this.elements.profileModal.classList.remove('active');
    }

    startPrivateChat() {
        const userId = this.elements.startPrivateChatBtn.dataset.userId;
        if (!userId) return;
        
        this.closeProfileModal();
        this.openConversation('private', userId);
    }

    openConversation(type, conversationId) {
        // Muda para a aba correta
        if (type === 'private') {
            this.switchTab('private');
        } else if (type === 'group') {
            this.switchTab('groups');
        }
        
        // Define conversa atual
        this.currentConversation = conversationId;
        
        // Mostra área de mensagens e input
        if (type === 'private') {
            this.elements.privateMessages.style.display = 'flex';
            this.elements.privateInputArea.style.display = 'block';
            this.elements.privateConversations.style.display = 'none';
        } else if (type === 'group') {
            this.elements.groupMessages.style.display = 'flex';
            this.elements.groupInputArea.style.display = 'block';
            this.elements.groupConversations.style.display = 'none';
        }
        
        // Marca conversa como ativa
        const conversationItems = document.querySelectorAll(`[data-conversation-id="${conversationId}"]`);
        conversationItems.forEach(item => {
            item.classList.add('active');
        });
        
        // Marca mensagens como lidas
        window.chatManager.markMessagesAsRead(type, conversationId);
        
        // Abre o chat se não estiver aberto
        if (!this.isOpen) {
            this.openChat();
        }
    }

    isConversationActive(type, conversationId) {
        return this.currentTab === type && this.currentConversation === conversationId;
    }

    focusCurrentInput() {
        let input;
        
        switch (this.currentTab) {
            case 'global':
                input = this.elements.globalMessageInput;
                break;
            case 'private':
                if (this.currentConversation) {
                    input = this.elements.privateMessageInput;
                }
                break;
            case 'groups':
                if (this.currentConversation) {
                    input = this.elements.groupMessageInput;
                }
                break;
        }
        
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }

    markCurrentMessagesAsRead() {
        if (this.currentConversation && window.chatManager) {
            window.chatManager.markMessagesAsRead(this.currentTab, this.currentConversation);
        }
    }

    updateNotificationBadge() {
        if (!window.chatManager) return;
        
        const totalUnread = window.chatManager.getTotalUnreadCount();
        const badge = this.elements.notificationBadge;
        
        if (totalUnread > 0) {
            badge.textContent = totalUnread > 99 ? '99+' : totalUnread.toString();
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Menos de 1 minuto
            return 'agora';
        } else if (diff < 3600000) { // Menos de 1 hora
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m`;
        } else if (diff < 86400000) { // Menos de 1 dia
            const hours = Math.floor(diff / 3600000);
            return `${hours}h`;
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    }

    formatLastSeen(timestamp, isOnline) {
        if (isOnline) return 'Online';
        if (!timestamp) return 'Offline';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return 'Visto agora';
        } else if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `Visto ${minutes}m atrás`;
        } else if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `Visto ${hours}h atrás`;
        } else {
            const days = Math.floor(diff / 86400000);
            return `Visto ${days}d atrás`;
        }
    }
}

// Inicializa a ChatUI globalmente
window.chatUI = new ChatUI();

