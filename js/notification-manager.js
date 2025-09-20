// Notification Manager - Gerencia notificações do chat
class NotificationManager {
    constructor() {
        this.isEnabled = true;
       // this.soundEnabled = false;
        this.browserNotificationsEnabled = false;
        this.audioContext = null;
        this.notificationSound = null;
        
        // Configurações de som
        this.soundSettings = {
            frequency: 800,
            duration: 0.2,
            volume: 0.1
        };
        
        this.init();
    }

    async init() {
        try {
            // Carrega configurações do localStorage
            this.loadSettings();
            
            // Solicita permissão para notificações do navegador
            await this.requestNotificationPermission();
            
            // Configura listeners para eventos do chat
            this.setupChatEventListeners();
            
            // Inicializa contexto de áudio
            this.initAudioContext();
            
            console.log('NotificationManager initialized');
        } catch (error) {
            console.error('Error initializing NotificationManager:', error);
        }
    }

    loadSettings() {
        const settings = localStorage.getItem('mindfulness_chat_notifications');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.isEnabled = parsed.enabled !== false;
            this.soundEnabled = parsed.sound !== false;
            this.browserNotificationsEnabled = parsed.browser === true;
        }
    }

    saveSettings() {
        const settings = {
            enabled: this.isEnabled,
            sound: this.soundEnabled,
            browser: this.browserNotificationsEnabled
        };
        localStorage.setItem('mindfulness_chat_notifications', JSON.stringify(settings));
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.browserNotificationsEnabled = permission === 'granted';
            this.saveSettings();
        }
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio context not available:', error);
        }
    }

    setupChatEventListeners() {
        // Escuta por novas mensagens

        
        document.addEventListener('chat:newMessage', (event) => {
            this.handleNewMessage(event.detail);
        });

       /* // Escuta quando o chat fica pronto
        document.addEventListener('chat:chatReady', () => {
            this.showWelcomeNotification();
        });*/

        // Escuta mudanças de usuários online
        document.addEventListener('chat:onlineUsersUpdated', (event) => {
            this.handleOnlineUsersUpdate(event.detail);
        });
    }

handleNewMessage(messageData) {
    if (!this.isEnabled) return;

    const { type, message, conversationId, unreadCount } = messageData;

    // 🚫 Ignora mensagens enviadas pelo próprio usuário
    if (message.senderId && window.currentUserId && message.senderId === window.currentUserId) {
        return;
    }

    // 🚫 Ignora mensagens que já foram lidas
    if (typeof unreadCount !== "undefined" && unreadCount === 0) {
        return;
    }

    // 🚫 Ignora se a janela do chat já estiver aberta e focada
    if (this.isChatWindowFocused(type, conversationId)) return;

    // 🚫 Ignora mensagens globais para notificações do navegador
    if (type === 'global') return;

    // ✅ Mostra notificação do navegador se habilitado
    if (this.browserNotificationsEnabled) {
        this.showBrowserNotification(type, message, conversationId);
    }

    // ✅ Atualiza badge de notificações
    this.updateNotificationBadge();
}


   /* showVisualNotification(type, message, conversationId) {
        // Cria elemento de notificação visual
        const notification = document.createElement('div');
        notification.className = 'chat-notification';
        
        const typeText = this.getTypeDisplayName(type, conversationId);
        const senderName = message.senderName || 'Usuário';
        const messagePreview = this.truncateMessage(message.message);
        
        notification.innerHTML = `
         <div class="chat-notification-header">
                <img src="${message.senderProfilePic}" alt="${senderName}" class="chat-notification-avatar">
                <div class="chat-notification-info">
                    <div class="chat-notification-sender">${senderName}</div>
                    <div class="chat-notification-type">${typeText}</div>
                </div>
                <button class="chat-notification-close">&times;</button>
            </div>
            <div class="chat-notification-message">${messagePreview}</div>
        `;

         //Adiciona estilos inline para garantir que funcione
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
            cursor: pointer;
        `; 

        // Adiciona event listeners
        const closeBtn = notification.querySelector('.chat-notification-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideVisualNotification(notification);
        });

        notification.addEventListener('click', () => {
            this.openChatToConversation(type, conversationId);
            this.hideVisualNotification(notification);
        });

        // Adiciona ao DOM
        document.body.appendChild(notification);

        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                this.hideVisualNotification(notification);
            }
        }, 1000);
    }*/

    hideVisualNotification(notification) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }

    showBrowserNotification(type, message, conversationId) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const typeText = this.getTypeDisplayName(type, conversationId);
        const senderName = message.senderName;
        const messagePreview = this.truncateMessage(message.message);

        const notification = new Notification(`${senderName} - ${typeText}`, {
            body: messagePreview,
            icon: message.senderProfilePic || '/favicon.ico',
            tag: `chat_${type}_${conversationId || 'global'}`,
            requireInteraction: false
        });

        notification.onclick = () => {
            window.focus();
            this.openChatToConversation(type, conversationId);
            notification.close();
        };

        // Fecha automaticamente após 5 segundos
        setTimeout(() => notification.close(), 5000);
    }

   /* playNotificationSound() {
        if (!this.audioContext || !this.soundEnabled) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(this.soundSettings.frequency, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.soundSettings.volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + this.soundSettings.duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + this.soundSettings.duration);
        } catch (error) {
            console.warn('Error playing notification sound:', error);
        }
    } */

    updateNotificationBadge() {
        if (!window.chatManager) return;

        const totalUnread = window.chatManager.getTotalUnreadCount();
        const badge = document.querySelector('.chat-notification-badge');
        
        if (badge) {
            if (totalUnread > 0) {
                badge.textContent = totalUnread > 99 ? '99+' : totalUnread.toString();
                badge.style.display = 'block';
                badge.classList.add('pulse');
                
                setTimeout(() => badge.classList.remove('pulse'), 1000);
            } else {
                badge.style.display = 'none';
            }
        }

        // Atualiza título da página se necessário
        this.updatePageTitle(totalUnread);
    }

    updatePageTitle(unreadCount) {
        const originalTitle = 'PlataformaBizurada - A Plataforma do concurseiro!';
        
        if (unreadCount > 0) {
            document.title = `(${unreadCount}) ${originalTitle}`;
        } else {
            document.title = originalTitle;
        }
    }


   /*  showWelcomeNotification() {
        if (!this.isEnabled) return;

        const notification = document.createElement('div');
        notification.className = 'chat-welcome-notification';
        notification.innerHTML = `
            <div class="chat-welcome-content">
                <div class="chat-welcome-icon">💬</div>
                <div class="chat-welcome-text">
                    <strong>Chat ativado!</strong><br>
                    Você pode conversar com outros usuários agora.
                </div>
                <button class="chat-welcome-close">&times;</button>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 280px;
            animation: slideInUp 0.3s ease;
        `;

        const closeBtn = notification.querySelector('.chat-welcome-close');
        closeBtn.addEventListener('click', () => {
            this.hideVisualNotification(notification);
            
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                this.hideVisualNotification(notification);
            }
        }, 1000);
    }*/

    handleOnlineUsersUpdate(users) {
        // Pode implementar notificações quando amigos ficam online
        // Por enquanto, apenas atualiza silenciosamente
    }

    getTypeDisplayName(type, conversationId) {
        switch (type) {
            case 'global':
                return 'Chat Global';
            case 'private':
                return 'Mensagem Privada';
            case 'group':
                return 'Grupo';
            default:
                return 'Chat';
        }
    }

    truncateMessage(message, maxLength = 100) {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    }

    isChatWindowFocused(type, conversationId) {
        // Verifica se a janela do chat está aberta e focada na conversa específica
        const chatWindow = document.querySelector('.chat-window');
        if (!chatWindow || !chatWindow.classList.contains('active')) return false;

        const activeTab = document.querySelector('.chat-tab.active');
        if (!activeTab) return false;

        const activeTabType = activeTab.dataset.type;
        const activeConversationId = activeTab.dataset.conversationId;

        return activeTabType === type && activeConversationId === conversationId;
    }

    openChatToConversation(type, conversationId) {
        // Dispara evento para abrir o chat na conversa específica
        const event = new CustomEvent('chat:openConversation', {
            detail: { type, conversationId }
        });
        document.dispatchEvent(event);

    }

    // Métodos públicos para configurações
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.saveSettings();
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        this.saveSettings();
    }

    setBrowserNotificationsEnabled(enabled) {
        this.browserNotificationsEnabled = enabled;
        this.saveSettings();
        
        if (enabled && Notification.permission !== 'granted') {
            this.requestNotificationPermission();
        }
    }

    getSettings() {
        return {
            enabled: this.isEnabled,
            sound: this.soundEnabled,
            browser: this.browserNotificationsEnabled
        };
    }

    // Método para testar notificação
    testNotification() {
        const testMessage = {
            senderName: 'Sistema',
            senderProfilePic: 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e',
            message: 'Esta é uma notificação de teste!'
        };

        this.handleNewMessage({
            type: 'global',
            message: testMessage,
            conversationId: null,
            unreadCount: 1
        });
    }
}

// Inicializa o NotificationManager globalmente
window.notificationManager = new NotificationManager();

