

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
                this.userCache = new Map(); // NOVO: Adiciona um cache para os dados dos usuários

        this.maxMessagesPerLoad = 50;
        this.messageRateLimit = 20;
        this.userMessageCount = 0;
        this.lastMessageTime = 0;
        
        this.init();
    }

    async init() {
        try {
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    await this.initializeUserChat();
                } else {
                    this.cleanup();
                }
            });
            console.log("ChatManager initialized");
        } catch (error) {
            console.error("Error initializing ChatManager:", error);
        }
    }

    async initializeUserChat() {
        if (!this.currentUser || this.isInitialized) return;

        try {
            await this.setupUserPresence();
            await this.loadUserData();
            this.setupMessageListeners();
            await this.loadUserConversations();
            await this.loadOnlineUsers();
            this.isInitialized = true;
            this.dispatchEvent("chatReady");
            console.log("User chat initialized for:", this.currentUser.email);
        } catch (error) {
            console.error("Error initializing user chat:", error);
        }
    }

    async setupUserPresence() {
        const userId = this.currentUser.uid;
        const userRef = this.database.ref(`users/${userId}`);
        const onlineRef = this.database.ref(".info/connected");
        
        onlineRef.on("value", async (snapshot) => {
            if (snapshot.val() === true) {
                await userRef.update({
                    isOnline: true,
                    lastSeen: firebase.database.ServerValue.TIMESTAMP
                });
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
        
        await userRef.update({
            name: this.currentUser.displayName || "Novato",
            email: this.currentUser.email,
            profilePicture: this.currentUser.photoURL || "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e"
        });
    }

    setupMessageListeners() {
        this.setupGlobalMessageListener();
        this.setupPrivateMessageListener();
       // this.setupGroupMessageListener();
    }

    setupGlobalMessageListener() {
        const globalRef = this.database.ref("globalMessages").orderByChild("timestamp").limitToLast(this.maxMessagesPerLoad);
        
        // Removido o listener de mensagens globais para evitar puxar dados para notificações
         globalRef.on("child_added", (snapshot) => {
             const message = { id: snapshot.key, ...snapshot.val() };
             this.handleNewMessage("global", message);
         });
        this.messageListeners.set("global", globalRef);
    }

 // DENTRO DA CLASSE ChatManager

setupPrivateMessageListener() {
    const userId = this.currentUser.uid;
    const privateRef = this.database.ref("privateMessages");

    privateRef.on("child_added", (conversationSnapshot) => {
        const combinedConversationId = conversationSnapshot.key; // Ex: 'userA_userB'
        const [user1, user2] = combinedConversationId.split("_");

        if (user1 === userId || user2 === userId) {
            // --- INÍCIO DA CORREÇÃO ---
            // Determine o ID do OUTRO usuário na conversa.
            const otherUserId = user1 === userId ? user2 : user1;
            // --- FIM DA CORREÇÃO ---

            const messagesRef = this.database.ref(`privateMessages/${combinedConversationId}`).orderByChild("timestamp").limitToLast(this.maxMessagesPerLoad);

            messagesRef.on("child_added", async (messageSnapshot) => {
                const message = { id: messageSnapshot.key, ...messageSnapshot.val() };
                const senderData = await this.getUserData(message.senderId);
                const fullMessage = {
                    ...message,
                    senderName: senderData.name || "Desconhecido",
                    senderProfilePicture: senderData.profilePicture || "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e"
                };

                // --- MUDANÇA PRINCIPAL ---
                // Passe o 'otherUserId' como o ID da conversa para a UI.
                this.handleNewMessage("private", fullMessage, otherUserId );
                // --- FIM DA MUDANÇA ---


        
        
                // Se a conversa estiver aberta e a mensagem é do outro usuário, marca como lida
 if (otherUserId === window.currentOpenConversationId && message.senderId !== userId && message.read === false) {
    await this.database.ref(`privateMessages/${combinedConversationId}/${message.id}`).update({ read: true });
    this.unreadCounts.set(`private_${otherUserId}`, 0);
    this.dispatchEvent("unreadCountUpdated");
    this.dispatchEvent("conversationsUpdated", Array.from(this.conversations.entries()));
}

            });



            this.messageListeners.set(`private_${combinedConversationId}`, messagesRef);
        }
    });
}


    setupGroupMessageListener() {
        const userId = this.currentUser.uid;
        
        const userGroupsRef = this.database.ref(`userConversations/${userId}/groups`);
        
        userGroupsRef.on("child_added", (snapshot) => {
            const groupId = snapshot.key;
            const groupMessagesRef = this.database.ref(`groups/${groupId}/messages`).orderByChild("timestamp").limitToLast(this.maxMessagesPerLoad);
            
            groupMessagesRef.on("child_added", (messageSnapshot) => {
                const message = { id: messageSnapshot.key, ...messageSnapshot.val() };
                this.handleNewMessage("group", message, groupId);
            });
            this.messageListeners.set(`group_${groupId}`, groupMessagesRef);
        });
    }

async markOpenConversationAsRead(otherUserId) {
    const userId = this.currentUser.uid;
    const fullConversationId = this.getConversationId(userId, otherUserId);
    const messagesRef = this.database.ref(`privateMessages/${fullConversationId}`);

    const snapshot = await messagesRef.orderByChild("read").equalTo(false).once("value");
    const updates = {};
    snapshot.forEach(child => {
        if (child.val().senderId !== userId) {
            updates[child.key + "/read"] = true;
        }
    });

    if (Object.keys(updates).length > 0) {
        await messagesRef.update(updates);
        // Atualiza contador local
        this.unreadCounts.set(`private_${otherUserId}`, 0);
        this.dispatchEvent("unreadCountUpdated");
        this.dispatchEvent("conversationsUpdated", Array.from(this.conversations.entries()));
    }
}


   // MODIFICADO: Garante que os dados do usuário sejam incluídos na mensagem
// DENTRO DA CLASSE ChatManager
async handleNewMessage(type, message, conversationId = null) {
    // Garante os dados do remetente
    const senderData = await this.getUserData(message.senderId);
    message.senderName = senderData?.name || "Novato";
    message.senderProfilePicture = senderData?.profilePicture || "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";

    const key = conversationId ? `${type}_${conversationId}` : type;

    // Regras para contagem:
    const isOwnMessage = message.senderId === this.currentUser.uid;
    const isReadPrivate = message.read === true; // privadas
    const isReadGroup = type === "group" && message.readBy && message.readBy[this.currentUser.uid] === true; // grupos
    const isRead = isReadPrivate || isReadGroup;

const shouldCount = !isOwnMessage && !isRead && type !== "global"; // ❌ adicionei a condição para ignorar global

    if (shouldCount) {
        const currentCount = this.unreadCounts.get(key) || 0;
        this.unreadCounts.set(key, currentCount + 1);
    }

    // Dispara o evento sempre (para renderizar a mensagem),
    // mas com o unreadCount atual (sem inflar quando read=true)
  this.dispatchEvent("newMessage", {
    type,
    message,
    conversationId,
    unreadCount: type !== "global" ? (this.unreadCounts.get(key) || 0) : undefined
});


    // Atualiza lista de conversas só se não for sua própria mensagem
    if (!isOwnMessage) {
        this.updateConversationsList(type, message, conversationId);
    }
}


// DENTRO DA CLASSE ChatManager
async updateConversationsList(type, message, conversationId) {
    const userId = this.currentUser.uid;

    if (type === "private" && conversationId) {
        const otherUserId = conversationId; // <- aqui é o ID do outro usuário
        const otherUserSnapshot = await this.database.ref(`users/${otherUserId}`).once("value");
        const otherUserData = otherUserSnapshot.val();

        // Só incrementa se a msg for do outro e não estiver lida
        const shouldIncrement = message.senderId !== userId && message.read !== true;

        if (otherUserData) {
            await this.database.ref(`userConversations/${userId}/private/${otherUserId}`).update({
                lastMessage: message.message,
                lastMessageTime: message.timestamp,
                unreadCount: shouldIncrement 
                    ? firebase.database.ServerValue.increment(1) 
                    : firebase.database.ServerValue.increment(0),
                otherUserName: otherUserData.name,
                otherUserProfilePic: otherUserData.profilePicture
            });
        }

    } else if (type === "group" && conversationId) {
        const groupSnapshot = await this.database.ref(`groups/${conversationId}`).once("value");
        const groupData = groupSnapshot.val();

        const readByCurrent = message.readBy && message.readBy[userId] === true;
        const shouldIncrement = message.senderId !== userId && !readByCurrent;

        if (groupData) {
            await this.database.ref(`userConversations/${userId}/groups/${conversationId}`).update({
                groupName: groupData.name,
                lastMessage: message.message,
                lastMessageTime: message.timestamp,
                unreadCount: shouldIncrement 
                    ? firebase.database.ServerValue.increment(1) 
                    : firebase.database.ServerValue.increment(0)
            });
        }
    }
}


    async sendMessage(type, content, targetId = null) {
        if (type === "private" && window.currentOpenConversationId === targetId) {
        await this.markOpenConversationAsRead(targetId);
    }
        if (!this.canSendMessage()) {
            throw new Error("Rate limit exceeded. Aguarde um momento antes de enviar outra mensagem.");
        }

        const userId = this.currentUser.uid;
        const userData = await this.getUserData(userId);
        
        const messageData = {
            senderId: userId,
            senderName: userData.name,
            senderProfilePicture: userData.profilePicture,
            message: content.trim(),
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: this.detectMessageType(content)
        };

        if (messageData.type === "link") {
            messageData.linkPreview = await this.generateLinkPreview(content);
        }

        try {
            let messageRef;
            
            switch (type) {
                case "global":
                    messageRef = this.database.ref("globalMessages").push();
                    break;
                    
                case "private":
                    if (!targetId) throw new Error("Target user ID required for private message");
                    const conversationId = this.getConversationId(userId, targetId);
                    messageRef = this.database.ref(`privateMessages/${conversationId}`).push();
                    messageData.receiverId = targetId;
                    messageData.read = false;
                    break;
                    
                case "group":
                    if (!targetId) throw new Error("Group ID required for group message");
                    messageRef = this.database.ref(`groups/${targetId}/messages`).push();
                    break;
                    
                default:
                    throw new Error("Invalid message type");
            }
            
            await messageRef.set(messageData);
            this.updateRateLimit();
            return messageRef.key;
            
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }

    canSendMessage() {
        const now = Date.now();
        const oneMinute = 60 * 1000;
        
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
        return urlRegex.test(content) ? "link" : "text";
    }

    async generateLinkPreview(content) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = content.match(urlRegex);
        if (!urls || urls.length === 0) return null;

        try {
            const preview = await window.linkPreviewManager.generatePreview(urls[0]);
            return preview;
        } catch (error) {
            console.error("Error generating link preview:", error);
            return null;
        }
    }

    getConversationId(userId1, userId2) {
        return userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
    }

    async loadOnlineUsers() {
        const usersRef = this.database.ref("users").orderByChild("isOnline").equalTo(true);
        
        usersRef.on("value", (snapshot) => {
            this.onlineUsers.clear();
            
            snapshot.forEach((childSnapshot) => {
                const userId = childSnapshot.key;
                const userData = childSnapshot.val();
                
                if (userId !== this.currentUser.uid) {
                    this.onlineUsers.set(userId, userData);
                }
            });
            this.dispatchEvent("onlineUsersUpdated", Array.from(this.onlineUsers.entries()));
        });
    }

    async loadUserConversations() {
        const userId = this.currentUser.uid;
        const conversationsRef = this.database.ref(`userConversations/${userId}`);
        
        conversationsRef.on("value", (snapshot) => {
            const conversations = snapshot.val() || {};
            this.conversations.clear();
            
            if (conversations.private) {
                Object.entries(conversations.private).forEach(([otherUserId, data]) => {
                    this.conversations.set(`private_${otherUserId}`, {
                        type: "private",
                        id: otherUserId,
                        ...data
                    });
                });
            }
            
            if (conversations.groups) {
                Object.entries(conversations.groups).forEach(([groupId, data]) => {
                    this.conversations.set(`group_${groupId}`, {
                        type: "group",
                        id: groupId,
                        ...data
                    });
                });
            }
            this.dispatchEvent("conversationsUpdated", Array.from(this.conversations.entries()));
        });
    }

    async searchUsers(query) {
        if (!query || query.trim().length < 2) return [];
        
        const usersRef = this.database.ref("users");
        const snapshot = await usersRef.once("value");
        const users = snapshot.val() || {};
        
        const results = [];
        const searchTerm = query.toLowerCase();
        
        Object.entries(users).forEach(([userId, userData]) => {
            if (userId === this.currentUser.uid) return;
            
            const name = (userData.name || "").toLowerCase();
            const email = (userData.email || "").toLowerCase();
            
            if (name.includes(searchTerm) || email.includes(searchTerm)) {
                results.push({
                    id: userId,
                    ...userData
                });
            }
        });
        return results.slice(0, 20);
    }

  // MODIFICADO: getUserData agora usa o cache
    async getUserData(userId) {
        // Se o usuário já está no cache, retorna imediatamente
        if (this.userCache.has(userId)) {
            return this.userCache.get(userId);
        }

        // Se não, busca no Firebase
        const snapshot = await this.database.ref(`users/${userId}`).once("value");
        const userData = snapshot.val();

        // Armazena no cache para futuras requisições
        if (userData) {
            this.userCache.set(userId, userData);
        }
        
        return userData;
    }




    
   // DENTRO DA CLASSE ChatManager

async markMessagesAsRead(type, conversationId) {
    const userId = this.currentUser.uid;
    
    if (type === "private") {
        const fullConversationId = this.getConversationId(userId, conversationId);
        const messagesRef = this.database.ref(`privateMessages/${fullConversationId}`);
        
        const snapshot = await messagesRef.orderByChild("read").equalTo(false).once("value");
        const updates = {};
        snapshot.forEach(child => {
            // Garante que estamos marcando como lidas apenas as mensagens recebidas
            if (child.val().senderId !== userId) {
                updates[child.key + "/read"] = true;
            }
        });
        if (Object.keys(updates).length > 0) {
            await messagesRef.update(updates);
            
        }
        
        // Zera o contador de não lidas na conversa do usuário
        await this.database.ref(`userConversations/${userId}/private/${conversationId}`).update({
            unreadCount: 0
        });
        this.unreadCounts.set(`private_${conversationId}`, 0);

    } else if (type === "global") {
        this.unreadCounts.set("global", 0);

    } else if (type === "group") {
        const groupMessagesRef = this.database.ref(`groups/${conversationId}/messages`);
        const snapshot = await groupMessagesRef.orderByChild(`readBy/${userId}`).equalTo(null).once("value");
        const updates = {};
        snapshot.forEach(child => {
            updates[child.key + `/readBy/${userId}`] = true;
        });
        if (Object.keys(updates).length > 0) {
            await groupMessagesRef.update(updates);
        }
        
        await this.database.ref(`userConversations/${userId}/groups/${conversationId}`).update({
            unreadCount: 0
        });
        this.unreadCounts.set(`group_${conversationId}`, 0);
    }

    // --- INÍCIO DA CORREÇÃO ---
    // Dispara um evento para forçar a UI a reavaliar os contadores de não lidas.
    // A função `updateNotificationBadges` na ChatUI será chamada em resposta a este evento.
    this.dispatchEvent("unreadCountUpdated");
    // --- FIM DA CORREÇÃO ---

    // Esta linha também ajuda a atualizar a lista de conversas, removendo o badge da conversa específica.
    this.dispatchEvent("conversationsUpdated", Array.from(this.conversations.entries()));
}


async markPrivateConversationAsRead(conversationId) {

    if (window.chatManager && window.chatManager.currentUser) {
        const userId = window.chatManager.currentUser.uid;
        const fullConversationId = window.chatManager.getConversationId(userId, conversationId);
        const messagesRef = window.chatManager.database.ref(`privateMessages/${fullConversationId}`);

        try {
            // Marcar todas as mensagens não lidas como lidas
            const snapshot = await messagesRef.orderByChild("read").equalTo(false).once("value");
            const updates = {};
            snapshot.forEach(child => {
                updates[child.key + "/read"] = true;
            });

            // Exibe alerta com quantidade de mensagens não lidas que serão marcadas
            const unreadCount = Object.keys(updates).length;
            if (unreadCount > 0) {
                alert(`Você está prestes a marcar ${unreadCount} mensagem(ns) como lida(s).`);
                await messagesRef.update(updates);
                alert(`Mensagens na conversa ${fullConversationId} marcadas como lidas.`);
            }

            // Resetar o contador de mensagens não lidas para esta conversa no userConversations
            await window.chatManager.database.ref(`userConversations/${userId}/private/${conversationId}`).update({
                unreadCount: 0
            });
            console.log(`Contador de não lidas para ${conversationId} zerado.`);

            // Atualizar o contador de não lidas no ChatManager (se existir)
            if (window.chatManager.unreadCounts) {
                window.chatManager.unreadCounts.set(`private_${conversationId}`, 0);
            }

            // Disparar um evento para que a UI possa atualizar os badges
            document.dispatchEvent(new CustomEvent('chat:unreadCountUpdated', {
                detail: {
                    type: 'private',
                    conversationId: conversationId,
                    newCount: 0
                }
            }));

        } catch (error) {
            console.error("Erro ao marcar mensagens como lidas:", error);
        }
    }
}




    getUnreadCount(type, conversationId = null) {
        const key = conversationId ? `${type}_${conversationId}` : type;
        return this.unreadCounts.get(key) || 0;
    }

    getTotalUnreadCount() {
        let total = 0;
        this.unreadCounts.forEach(count => {
            total += count;
        });
        return total;
    }

    getOnlineUsers() {
        return Array.from(this.onlineUsers.entries());
    }

    getConversations() {
        return Array.from(this.conversations.entries());
    }

    async getGlobalMessages() {
        const snapshot = await this.database.ref("globalMessages").limitToLast(this.maxMessagesPerLoad).once("value");
        const messages = [];
        snapshot.forEach(child => {
            messages.push({ id: child.key, ...child.val() });
        });
        return messages;
    }



    async getPrivateMessages(conversationId) {
        const userId = this.currentUser.uid;
        const fullConversationId = this.getConversationId(userId, conversationId);
        const snapshot = await this.database.ref(`privateMessages/${fullConversationId}`).limitToLast(this.maxMessagesPerLoad).once("value");
        const messages = [];
        snapshot.forEach(child => {
            messages.push({ id: child.key, ...child.val() });
        });
        return messages;
    }


    
    async getGroupMessages(groupId) {
        const snapshot = await this.database.ref(`groups/${groupId}/messages`).limitToLast(this.maxMessagesPerLoad).once("value");
        const messages = [];
        snapshot.forEach(child => {
            messages.push({ id: child.key, ...child.val() });
        });
        return messages;
    }

    dispatchEvent(name, detail = {}) {
        const event = new CustomEvent(`chat:${name}`, { detail });
        document.dispatchEvent(event);
    }

    isReady() {
        return this.isInitialized;
    }

    cleanup() {
        // Remove todos os listeners do Firebase
        this.messageListeners.forEach((ref, key) => {
            ref.off();
            console.log(`Removed Firebase listener for: ${key}`);
        });
        this.messageListeners.clear();
        this.onlineUsers.clear();
        this.conversations.clear();
        this.unreadCounts.clear();
        this.isInitialized = false;
        this.currentUser = null;
        console.log("ChatManager cleaned up.");
    }

    
}

window.ChatManager = ChatManager;


