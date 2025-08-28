// Chat Manager - Gerencia todas as operações de chat
class ChatManager {
    constructor() {
        this.database = window.firebaseServices.database;
        this.auth = window.firebaseServices.auth;
        this.currentUser = null;
        this.onlineUsers = new Map();
        this.conversations = new Map();
        this.unreadCounts = new Map();
        this.messageListeners = new Map();
        this.isInitialized = false;
        
        // Configurações
        this.maxMessagesPerLoad = 50;
        this.messageRateLimit = 10; // mensagens por minuto
        this.userMessageCount = 0;
        this.lastMessageTime = 0;
        
        this.init();
    }

    async init() {
        try {
            // Aguarda o usuário estar autenticado
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    await this.initializeUserChat();
                } else {
                    this.cleanup();
                }
            });
            
            console.log('ChatManager initialized');
        } catch (error) {
            console.error('Error initializing ChatManager:', error);
        }
    }

    async initializeUserChat() {
        if (!this.currentUser || this.isInitialized) return;

        try {
            // Configura presença do usuário
            await this.setupUserPresence();
            
            // Carrega dados do usuário
            await this.loadUserData();
            
            // Configura listeners para mensagens
            this.setupMessageListeners();
            
            // Carrega conversas existentes
            await this.loadUserConversations();
            
            // Carrega usuários online
            await this.loadOnlineUsers();
            
            this.isInitialized = true;
            
            // Notifica que o chat está pronto
            this.dispatchEvent('chatReady');
            
            console.log('User chat initialized for:', this.currentUser.email);
        } catch (error) {
            console.error('Error initializing user chat:', error);
        }
    }

    async setupUserPresence() {
        const userId = this.currentUser.uid;
        const userRef = this.database.ref(`users/${userId}`);
        const onlineRef = this.database.ref('.info/connected');
        
        // Configura presença online/offline
        onlineRef.on('value', async (snapshot) => {
            if (snapshot.val() === true) {
                // Usuário está online
                await userRef.update({
                    isOnline: true,
                    lastSeen: firebase.database.ServerValue.TIMESTAMP
                });
                
                // Configura para marcar como offline quando desconectar
                userRef.onDisconnect().update({
                    isOnline: false,
                    lastSeen: firebase.database.ServerValue.TIMESTAMP
                });
            }
        });
    }

    async loadUserData() {
        const userId = this.currentUser.uid;
        const userRef = this.database.ref(`users/${userId}`);
        
        // Atualiza dados básicos do usuário
        await userRef.update({
            name: this.currentUser.displayName || 'Usuário',
            email: this.currentUser.email,
            profilePicture: this.currentUser.photoURL || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/default-avatar.png?alt=media&token=default'
        });
    }

    setupMessageListeners() {
        // Listener para mensagens globais
        this.setupGlobalMessageListener();
        
        // Listener para mensagens privadas
        this.setupPrivateMessageListener();
        
        // Listener para grupos
        this.setupGroupMessageListener();
    }

    setupGlobalMessageListener() {
        const globalRef = this.database.ref('globalMessages').limitToLast(this.maxMessagesPerLoad);
        
        globalRef.on('child_added', (snapshot) => {
            const message = { id: snapshot.key, ...snapshot.val() };
            this.handleNewMessage('global', message);
        });
        
        this.messageListeners.set('global', globalRef);
    }

    setupPrivateMessageListener() {
        const userId = this.currentUser.uid;
        
        // Listener para conversas onde o usuário é participante
        const privateRef = this.database.ref('privateMessages');
        
        privateRef.on('child_added', (conversationSnapshot) => {
            const conversationId = conversationSnapshot.key;
            const [user1, user2] = conversationId.split('_');
            
            // Verifica se o usuário atual faz parte desta conversa
            if (user1 === userId || user2 === userId) {
                const messagesRef = conversationSnapshot.ref.limitToLast(this.maxMessagesPerLoad);
                
                messagesRef.on('child_added', (messageSnapshot) => {
                    const message = { id: messageSnapshot.key, ...messageSnapshot.val() };
                    this.handleNewMessage('private', message, conversationId);
                });
                
                this.messageListeners.set(`private_${conversationId}`, messagesRef);
            }
        });
    }

    setupGroupMessageListener() {
        const userId = this.currentUser.uid;
        
        // Busca grupos onde o usuário é membro
        const userGroupsRef = this.database.ref(`userConversations/${userId}/groups`);
        
        userGroupsRef.on('child_added', (snapshot) => {
            const groupId = snapshot.key;
            const groupMessagesRef = this.database.ref(`groups/${groupId}/messages`).limitToLast(this.maxMessagesPerLoad);
            
            groupMessagesRef.on('child_added', (messageSnapshot) => {
                const message = { id: messageSnapshot.key, ...messageSnapshot.val() };
                this.handleNewMessage('group', message, groupId);
            });
            
            this.messageListeners.set(`group_${groupId}`, groupMessagesRef);
        });
    }

    handleNewMessage(type, message, conversationId = null) {
        // Não processa mensagens próprias como novas
        if (message.senderId === this.currentUser.uid) return;
        
        // Atualiza contador de não lidas
        const key = conversationId ? `${type}_${conversationId}` : type;
        const currentCount = this.unreadCounts.get(key) || 0;
        this.unreadCounts.set(key, currentCount + 1);
        
        // Dispara evento de nova mensagem
        this.dispatchEvent('newMessage', {
            type,
            message,
            conversationId,
            unreadCount: currentCount + 1
        });
        
        // Atualiza lista de conversas
        this.updateConversationsList(type, message, conversationId);
    }

    async updateConversationsList(type, message, conversationId) {
        const userId = this.currentUser.uid;
        
        if (type === 'private' && conversationId) {
            const [user1, user2] = conversationId.split('_');
            const otherUserId = user1 === userId ? user2 : user1;
            
            // Busca dados do outro usuário
            const otherUserSnapshot = await this.database.ref(`users/${otherUserId}`).once('value');
            const otherUserData = otherUserSnapshot.val();
            
            if (otherUserData) {
                await this.database.ref(`userConversations/${userId}/private/${otherUserId}`).update({
                    lastMessage: message.message,
                    lastMessageTime: message.timestamp,
                    unreadCount: firebase.database.ServerValue.increment(1),
                    otherUserName: otherUserData.name,
                    otherUserProfilePic: otherUserData.profilePicture
                });
            }
        } else if (type === 'group' && conversationId) {
            const groupSnapshot = await this.database.ref(`groups/${conversationId}`).once('value');
            const groupData = groupSnapshot.val();
            
            if (groupData) {
                await this.database.ref(`userConversations/${userId}/groups/${conversationId}`).update({
                    groupName: groupData.name,
                    lastMessage: message.message,
                    lastMessageTime: message.timestamp,
                    unreadCount: firebase.database.ServerValue.increment(1)
                });
            }
        }
    }

    async sendMessage(type, content, targetId = null) {
        if (!this.canSendMessage()) {
            throw new Error('Rate limit exceeded. Aguarde um momento antes de enviar outra mensagem.');
        }

        const userId = this.currentUser.uid;
        const userData = await this.getUserData(userId);
        
        const messageData = {
            senderId: userId,
            senderName: userData.name,
            senderProfilePic: userData.profilePicture,
            message: content.trim(),
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: this.detectMessageType(content)
        };

        // Adiciona preview de link se necessário
        if (messageData.type === 'link') {
            messageData.linkPreview = await this.generateLinkPreview(content);
        }

        try {
            let messageRef;
            
            switch (type) {
                case 'global':
                    messageRef = this.database.ref('globalMessages').push();
                    break;
                    
                case 'private':
                    if (!targetId) throw new Error('Target user ID required for private message');
                    const conversationId = this.getConversationId(userId, targetId);
                    messageRef = this.database.ref(`privateMessages/${conversationId}`).push();
                    messageData.receiverId = targetId;
                    messageData.read = false;
                    break;
                    
                case 'group':
                    if (!targetId) throw new Error('Group ID required for group message');
                    messageRef = this.database.ref(`groups/${targetId}/messages`).push();
                    break;
                    
                default:
                    throw new Error('Invalid message type');
            }
            
            await messageRef.set(messageData);
            
            // Atualiza rate limiting
            this.updateRateLimit();
            
            return messageRef.key;
            
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    canSendMessage() {
        const now = Date.now();
        const oneMinute = 60 * 1000;
        
        // Reset contador se passou mais de um minuto
        if (now - this.lastMessageTime > oneMinute) {
            this.userMessageCount = 0;
        }
        
        return this.userMessageCount < this.messageRateLimit;
    }

    updateRateLimit() {
        const now = Date.now();
        const oneMinute = 60 * 1000;
        
        if (now - this.lastMessageTime > oneMinute) {
            this.userMessageCount = 1;
        } else {
            this.userMessageCount++;
        }
        
        this.lastMessageTime = now;
    }

    detectMessageType(content) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return urlRegex.test(content) ? 'link' : 'text';
    }

    async generateLinkPreview(content) {
        // Implementação básica de preview de link
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = content.match(urlRegex);
        
        if (urls && urls.length > 0) {
            const url = urls[0];
            
            // Para uma implementação completa, você usaria uma API de preview
            // Por enquanto, retorna dados básicos
            return {
                url: url,
                title: 'Link compartilhado',
                description: 'Clique para abrir',
                image: null
            };
        }
        
        return null;
    }

    getConversationId(userId1, userId2) {
        // Cria ID consistente para conversa privada
        return userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
    }

    async loadOnlineUsers() {
        const usersRef = this.database.ref('users').orderByChild('isOnline').equalTo(true);
        
        usersRef.on('value', (snapshot) => {
            this.onlineUsers.clear();
            
            snapshot.forEach((childSnapshot) => {
                const userId = childSnapshot.key;
                const userData = childSnapshot.val();
                
                if (userId !== this.currentUser.uid) {
                    this.onlineUsers.set(userId, userData);
                }
            });
            
            this.dispatchEvent('onlineUsersUpdated', Array.from(this.onlineUsers.entries()));
        });
    }

    async loadUserConversations() {
        const userId = this.currentUser.uid;
        const conversationsRef = this.database.ref(`userConversations/${userId}`);
        
        conversationsRef.on('value', (snapshot) => {
            const conversations = snapshot.val() || {};
            this.conversations.clear();
            
            // Carrega conversas privadas
            if (conversations.private) {
                Object.entries(conversations.private).forEach(([otherUserId, data]) => {
                    this.conversations.set(`private_${otherUserId}`, {
                        type: 'private',
                        id: otherUserId,
                        ...data
                    });
                });
            }
            
            // Carrega grupos
            if (conversations.groups) {
                Object.entries(conversations.groups).forEach(([groupId, data]) => {
                    this.conversations.set(`group_${groupId}`, {
                        type: 'group',
                        id: groupId,
                        ...data
                    });
                });
            }
            
            this.dispatchEvent('conversationsUpdated', Array.from(this.conversations.entries()));
        });
    }

    async searchUsers(query) {
        if (!query || query.trim().length < 2) return [];
        
        const usersRef = this.database.ref('users');
        const snapshot = await usersRef.once('value');
        const users = snapshot.val() || {};
        
        const results = [];
        const searchTerm = query.toLowerCase();
        
        Object.entries(users).forEach(([userId, userData]) => {
            if (userId === this.currentUser.uid) return;
            
            const name = (userData.name || '').toLowerCase();
            const email = (userData.email || '').toLowerCase();
            
            if (name.includes(searchTerm) || email.includes(searchTerm)) {
                results.push({
                    id: userId,
                    ...userData
                });
            }
        });
        
        return results.slice(0, 20); // Limita a 20 resultados
    }

    async getUserData(userId) {
        const snapshot = await this.database.ref(`users/${userId}`).once('value');
        return snapshot.val();
    }

    async markMessagesAsRead(type, conversationId) {
        const userId = this.currentUser.uid;
        
        if (type === 'private') {
            const fullConversationId = this.getConversationId(userId, conversationId);
            const messagesRef = this.database.ref(`privateMessages/${fullConversationId}`);
            
            const snapshot = await messagesRef.orderByChild('read').equalTo(false).once('value');
            const updates = {};
            
            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                if (message.receiverId === userId) {
                    updates[`${childSnapshot.key}/read`] = true;
                }
            });
            
            if (Object.keys(updates).length > 0) {
                await messagesRef.update(updates);
            }
            
            // Reset contador de não lidas
            await this.database.ref(`userConversations/${userId}/private/${conversationId}/unreadCount`).set(0);
        }
        
        // Reset contador local
        const key = conversationId ? `${type}_${conversationId}` : type;
        this.unreadCounts.set(key, 0);
        
        this.dispatchEvent('messagesRead', { type, conversationId });
    }

    async createGroup(name, description, memberIds) {
        const userId = this.currentUser.uid;
        const userData = await this.getUserData(userId);
        
        const groupRef = this.database.ref('groups').push();
        const groupId = groupRef.key;
        
        const members = {
            [userId]: {
                name: userData.name,
                role: 'admin',
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            }
        };
        
        // Adiciona outros membros
        for (const memberId of memberIds) {
            const memberData = await this.getUserData(memberId);
            if (memberData) {
                members[memberId] = {
                    name: memberData.name,
                    role: 'member',
                    joinedAt: firebase.database.ServerValue.TIMESTAMP
                };
            }
        }
        
        await groupRef.set({
            name: name.trim(),
            description: description.trim(),
            createdBy: userId,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            members: members,
            messages: {}
        });
        
        // Atualiza conversas de todos os membros
        const updates = {};
        Object.keys(members).forEach(memberId => {
            updates[`userConversations/${memberId}/groups/${groupId}`] = {
                groupName: name,
                lastMessage: 'Grupo criado',
                lastMessageTime: firebase.database.ServerValue.TIMESTAMP,
                unreadCount: 0
            };
        });
        
        await this.database.ref().update(updates);
        
        return groupId;
    }

    getUnreadCount(type, conversationId = null) {
        const key = conversationId ? `${type}_${conversationId}` : type;
        return this.unreadCounts.get(key) || 0;
    }

    getTotalUnreadCount() {
        let total = 0;
        this.unreadCounts.forEach(count => total += count);
        return total;
    }

    dispatchEvent(eventName, data = null) {
        const event = new CustomEvent(`chat:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    cleanup() {
        // Remove todos os listeners
        this.messageListeners.forEach((ref) => {
            ref.off();
        });
        
        this.messageListeners.clear();
        this.onlineUsers.clear();
        this.conversations.clear();
        this.unreadCounts.clear();
        
        this.isInitialized = false;
        this.currentUser = null;
        
        console.log('ChatManager cleaned up');
    }

    // Métodos públicos para integração com a UI
    isReady() {
        return this.isInitialized;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getOnlineUsers() {
        return Array.from(this.onlineUsers.entries());
    }

    getConversations() {
        return Array.from(this.conversations.entries());
    }
}

// Inicializa o ChatManager globalmente
window.chatManager = new ChatManager();

