
class ChatUI {
    constructor() {
        this.isOpen = false;
        this.currentTab = 'global';
        this.currentConversation = null;
        this.messageCache = new Map();
        this.userCache = new Map();
        this.searchTimeout = null;
        this.elements = {};
        this.init();
    }

    async init() {
        try {
               document.addEventListener('chat:chatReady', () => {
                this.setupUI();
            });
            
            console.log('ChatUI initialized');
        } catch (error) {
            console.error('Error initializing ChatUI:', error);
        }
    }


    setupUI() {
        this.createChatElements();
        this.setupEventListeners();
        this.loadInitialData();
                    this.setupChatEventListeners();
                        this.setupSwipeGestures(); // <-- ADICIONE ESTA LINHA AQUI


    }

    createChatElements() {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'chat-toggle-btn';
        toggleBtn.innerHTML = `
            💬
            <span class="chat-notification-badge"></span>
        `;
        document.body.appendChild(toggleBtn);
        this.elements.toggleBtn = toggleBtn;

        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.innerHTML = this.getChatWindowHTML();
        document.body.appendChild(chatWindow);
        this.elements.chatWindow = chatWindow;

        const profileModal = document.createElement('div');
        profileModal.className = 'chat-profile-modal';
        profileModal.innerHTML = this.getProfileModalHTML();
        document.body.appendChild(profileModal);
        this.elements.profileModal = profileModal;

        this.cacheElements();

           // NOVO: Adicionar o modal de confirmação de exclusão
        const deleteModal = document.createElement('div');
        deleteModal.className = 'chat-delete-modal'; // Usaremos esta classe para o CSS
        deleteModal.innerHTML = this.getDeleteModalHTML();
        document.body.appendChild(deleteModal);
        this.elements.deleteModal = deleteModal; // Cache o elemento

        this.cacheElements();
    }

    // NOVO: Adicionar a função que retorna o HTML do novo modal
    getDeleteModalHTML() {
        return `
            <div class="chat-delete-content">
                <h4 class="chat-delete-title">Confirmar Exclusão</h4>
                <p class="chat-delete-text">
                    Você tem certeza de que deseja excluir esta conversa? Esta ação não pode ser desfeita.
                </p>
                <div class="chat-delete-actions">
                    <button class="chat-delete-btn secondary" id="cancelDeleteBtn">
                        Cancelar
                    </button>
                    <button class="chat-delete-btn primary" id="confirmDeleteBtn">
                        Excluir
                    </button>
                </div>
            </div>
        `;
    }

    getChatWindowHTML() {
        return `
            <div class="chat-header">
                <h3>Chat</h3>
                 <div class="chat-search">
                        <input type="text" class="chat-search-input" placeholder="Pesquisar usuários..." id="userSearchInput">
                    </div>
                <div class="chat-header-actions">
                   <!-- <button class="chat-header-btn" id="chatSettingsBtn" title="Configurações">
                        ⚙️
                    </button>-->
                    <button class="chat-header-btn" id="chatCloseBtn" title="Fechar">
                        ✕
                    </button>
                </div>
            </div>
             <div class="chat-users-list" id="onlineUsersList">
                    
                        <div class="chat-loading">
                            <div class="chat-loading-spinner"></div>
                        </div>
                    </div>
            <div class="chat-tabs">
                <button class="chat-tab active" data-tab="global">
                    Global
                    <span class="chat-tab-badge2"></span>
                </button>
                <button class="chat-tab" data-tab="private">
                    Privadas
                    <span class="chat-tab-badge"></span>
                </button>
                
            </div>
            
            <div class="chat-content">

                <!-- Painel Global -->
                <div class="chat-panel active" data-panel="global">
                   
                   
<div class="fundoMensagens">
                    <div class="chat-messages" id="globalMessages">
                        <div class="chat-loading">
                            <div class="chat-loading-spinner"></div>
                        </div>
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

                            <div class="chat-empty-title">Nenhuma conversa</div>
                            <div class="chat-empty-description">Clique em um usuário online para iniciar uma conversa</div>
                            
                        </div>

                       </div>
                                          <div id="fundoUSER" class="fundoUser">              <img id="userIMG" src="https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e" alt="Foto do usuário" class="user-avatar">
 <h2 id="userNOME">Olá, Selecione uma conversa para começar.</h2> </div>     

                       <div class="fundoMensagens2">

                       <div class="chat-messages2" id="privateMessages" style="display: none;">
                        <!-- Mensagens da conversa privada selecionada -->

                      </div>
                      </div>
 
                      <div class="chat-input-area" id="privateInputArea" style="display: flex;">
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
                    <div class="chat-input-area" id="groupInputArea" style="display: fl;">
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
        this.elements.toggleBtn = document.querySelector('.chat-toggle-btn');
        this.elements.chatWindow = document.querySelector('.chat-window');
        this.elements.closeBtn = document.getElementById('chatCloseBtn');
        this.elements.settingsBtn = document.getElementById('chatSettingsBtn');
        this.elements.tabs = document.querySelectorAll('.chat-tab');
        this.elements.panels = document.querySelectorAll('.chat-panel');
        this.elements.userSearchInput = document.getElementById('userSearchInput');
        this.elements.onlineUsersList = document.getElementById('onlineUsersList');
        this.elements.globalMessages = document.getElementById('globalMessages');
        this.elements.globalMessageInput = document.getElementById('globalMessageInput');
        this.elements.globalSendBtn = document.getElementById('globalSendBtn');
        this.elements.privateConversations = document.getElementById('privateConversations');
        this.elements.privateMessages = document.getElementById('privateMessages');
        this.elements.privateMessageInput = document.getElementById('privateMessageInput');
        this.elements.privateSendBtn = document.getElementById('privateSendBtn');
        this.elements.privateInputArea = document.getElementById('privateInputArea');
        this.elements.groupConversations = document.getElementById('groupConversations');
        this.elements.groupMessages = document.getElementById('groupMessages');
        this.elements.groupMessageInput = document.getElementById('groupMessageInput');
        this.elements.groupSendBtn = document.getElementById('groupSendBtn');
        this.elements.groupInputArea = document.getElementById('groupInputArea');
        this.elements.profileModal = document.querySelector('.chat-profile-modal');
        this.elements.profileAvatar = document.querySelector('.chat-profile-avatar');
        this.elements.profileName = document.querySelector('.chat-profile-name');
        this.elements.profileEmail = document.querySelector('.chat-profile-email');
        this.elements.startPrivateChatBtn = document.getElementById('startPrivateChatBtn');
        this.elements.closeProfileBtn = document.getElementById('closeProfileBtn');
        this.elements.notificationBadge = document.querySelector('.chat-notification-badge');
        // NOVO: Adicionar os elementos do novo modal ao cache
        this.elements.deleteModal = document.querySelector('.chat-delete-modal');
        this.elements.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        this.elements.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    }

    setupEventListeners() {
        this.elements.toggleBtn.addEventListener('click', () => this.toggleChat());
        this.elements.closeBtn.addEventListener('click', () => this.closeChat());
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
            
        });
       
        this.elements.userSearchInput.addEventListener('input', (e) => {

            let valorPesquisa = (e.target.value);
            if (valorPesquisa.trim() == "") {
            this.elements.onlineUsersList.style.display = "none";

            } else {
           this.elements.onlineUsersList.style.display = "block";
  
            }

            this.handleUserSearch(e.target.value);
        });
       // this.elements.globalSendBtn.addEventListener('click', () => this.sendGlobalMessage());
       // this.elements.privateSendBtn.addEventListener('click', () => this.sendPrivateMessage());
       // this.elements.groupSendBtn.addEventListener('click', () => this.sendGroupMessage());
        // DENTRO de setupEventListeners na classe ChatUI

// ADICIONE estas linhas:

// Para o chat Global
this.elements.globalSendBtn.addEventListener('mousedown', (event) => {
    // Previne que o botão receba o foco, mantendo o teclado aberto.
    event.preventDefault(); 
    this.sendGlobalMessage();
});

// Para o chat Privado
this.elements.privateSendBtn.addEventListener('mousedown', (event) => {
    event.preventDefault();
    this.sendPrivateMessage();
});

// Para o chat em Grupo (se estiver usando)
/*
this.elements.groupSendBtn.addEventListener('mousedown', (event) => {
    event.preventDefault();
    this.sendGroupMessage();
});
*/

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
        
        [this.elements.globalMessageInput, this.elements.privateMessageInput, this.elements.groupMessageInput].forEach(textarea => {
            textarea.addEventListener('input', () => this.autoResizeTextarea(textarea));
        });
        
        this.elements.closeProfileBtn.addEventListener('click', () => this.closeProfileModal());
        this.elements.startPrivateChatBtn.addEventListener('click', () => this.startPrivateChat());
        
        this.elements.profileModal.addEventListener('click', (e) => {
            if (e.target === this.elements.profileModal) {
                this.closeProfileModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });

        // Adiciona listener para cliques na lista de usuários online
        this.elements.onlineUsersList.addEventListener('click', (e) => {
            const userItem = e.target.closest('.chat-user-item');
            if (userItem) {
                const userId = userItem.dataset.userId;
                if (userId) {
                    this.openProfileModal(userId);
                }
            }
        });

// DENTRO DA CLASSE ChatUI, na função setupEventListeners

// Adiciona listener para cliques nos avatares/nomes dentro das mensagens globais
this.elements.globalMessages.addEventListener('click', (e) => {
    // Procura pelo elemento clicado ou um "pai" que tenha o link
    const userLink = e.target.closest('.chat-message-avatar-link, .chat-message-sender-link, chat-message-avatar');
    
    if (userLink) {
        const userId = userLink.dataset.userId;
        if (userId) {
            this.openProfileModal(userId);
        }
    }
});

 // NOVO: Listeners para o modal de exclusão
    this.elements.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
    this.elements.confirmDeleteBtn.addEventListener('click', () => this.confirmDeletion());
    
    // Fecha o modal se o usuário clicar fora da caixa de diálogo
    this.elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === this.elements.deleteModal) {
            this.closeDeleteModal();
        }
    });



// Fechar o chat ao clicar fora (ignorando modais)
document.addEventListener('click', (event) => {
    const chatWindow = this.elements.chatWindow;
    const toggleBtn = this.elements.toggleBtn;
    const profileModal = this.elements.profileModal;
    const deleteModal = this.elements.deleteModal;

    const clickedOutsideChat =
        this.isOpen &&
        chatWindow &&
        !chatWindow.contains(event.target) &&
        !toggleBtn.contains(event.target) &&
        !profileModal.contains(event.target) &&
        !deleteModal.contains(event.target);

    if (clickedOutsideChat) {
        this.closeChat();
    }
});



    }

    setupChatEventListeners() {
        document.addEventListener('chat:newMessage', (event) => {
            this.handleNewMessage(event.detail);
        });
        document.addEventListener('chat:onlineUsersUpdated', (event) => {
            this.updateOnlineUsers(event.detail);
        });
        document.addEventListener('chat:conversationsUpdated', (event) => {
            this.updateConversations(event.detail);
        });
        document.addEventListener('chat:openConversation', (event) => {
            this.openConversation(event.detail.type, event.detail.conversationId);
        });
    }

toggleChat() {

    const botao = document.querySelector('.chat-toggle-btn');
    

    if (this.isOpen) {
        this.closeChat();
        botao.style.display = 'block';
    } else {
        this.openChat();
        botao.style.display = 'none';

        // espera 500ms e então rola para o fim
        setTimeout(() => {
            const fundoMensagens = document.querySelector(".fundoMensagens");
            if (fundoMensagens) {
                fundoMensagens.scrollTop = fundoMensagens.scrollHeight;
            }

            const fundoMensagens2 = document.querySelector(".fundoMensagens2");
            if (fundoMensagens2) {
                fundoMensagens2.scrollTop = fundoMensagens2.scrollHeight;
            }
              const chatmessages = document.querySelector(".chat-messages");
            if (chatmessages) {
                chatmessages.scrollTop = chatmessages.scrollHeight;
            }
              const chatmessages2 = document.querySelector(".chat-messages2");
            if (chatmessages2) {
                chatmessages2.scrollTop = chatmessages2.scrollHeight;
            }
           
           
            let userNOME = document.getElementById("userNOME").textContent
    let fundoUSER = document.getElementById("fundoUSER");

  if (userNOME == "030225") {

fundoUSER.style.display = "none";

  } else {
fundoUSER.style.display = "flex";


  }
        }, 500);
    }

const badge = document.querySelector(".chat-notification-badge");
const badgeInterno = document.querySelector(".chat-tab-badge");

if (badge.style.display == "none") {
      console.log("o elemento está com display none");

badgeInterno.style.display = "none";

} else if (!badge) {
  console.log("o elemento não está no dom");
    badgeInterno.style.display = "none";

} else {
    console.log("tudo certo com o elemento.");
}

}



     async openChat() { // 1. Transforme a função em 'async'
        this.isOpen = true;
        this.elements.chatWindow.classList.add('active');
        this.elements.toggleBtn.classList.add('active');
        
         // CORREÇÃO: Chame a função que busca os dados sob demanda.
    if (window.chatManager) {
        await window.chatManager.fetchInitialConversations();
    }

        this.focusCurrentInput();
        this.markCurrentMessagesAsRead();
        this.switchTab('global');
    }

// DENTRO DA CLASSE ChatUI

closeChat() {
    let valorPesquisado =  this.elements.userSearchInput.value;

    if (valorPesquisado) {
    this.elements.userSearchInput.value = "";
    this.elements.userSearchInput.focus();
        this.elements.onlineUsersList.style.display = "none";

    } else {

          document.getElementById("userIMG").src =
  "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";

        this.elements.onlineUsersList.style.display = "none";
    this.elements.userSearchInput.value = "";
    
        

            



    const botao = document.querySelector('.chat-toggle-btn');

    this.isOpen = false;
    this.elements.chatWindow.classList.remove('active');
    this.elements.toggleBtn.classList.remove('active');
    botao.style.display = 'block';

    // --- INÍCIO DA CORREÇÃO ---
    // Zera a referência da conversa que estava aberta.

                this.elements.privateMessages.innerHTML = '';
                this.elements.privateMessages.style.display = 'flex';
                this.elements.privateInputArea.style.display = 'flex';
                document.getElementById("userNOME").textContent = "Olá, Selecione uma conversa para começar."; // Reseta o header
                document.getElementById("fundoUSER").style.display = "flex";
                           


                this.currentConversation = null;
            

    // --- FIM DA CORREÇÃO ---
    }
}


    switchTab(tabName) {
        this.elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        this.elements.panels.forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabName);
        });
        this.currentTab = tabName;
        this.loadTabData(tabName);
        this.focusCurrentInput();
        this.markCurrentMessagesAsRead();

const fundoMensagens = document.querySelector(".fundoMensagens");
const fundoMensagens2 = document.querySelector(".fundoMensagens2");

setTimeout(() => {
    fundoMensagens.scrollTop = fundoMensagens.scrollHeight;
        fundoMensagens2.scrollTop = fundoMensagens2.scrollHeight;

}, 500);

    }

 // DENTRO DA CLASSE ChatUI

    async loadInitialData() {
        this.elements.privateConversations.innerHTML = '<div class="chat-loading"><div class="chat-loading-spinner"></div></div>';
        this.elements.globalMessages.innerHTML = '<div class="chat-loading"><div class="chat-loading-spinner"></div></div>';

        try {
            if (window.chatManager && window.chatManager.isReady()) {
                // Agora podemos confiar no cache, pois 'chatReady' só é disparado após o fetch inicial.
                const conversations = window.chatManager.getConversations();
                this.updateConversations(conversations); // <<-- A ordenação será aplicada nos dados corretos

                const onlineUsers = window.chatManager.getOnlineUsers();
                this.updateOnlineUsers(onlineUsers);
            }
            await this.loadGlobalMessages();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.elements.privateConversations.innerHTML = '<div class="chat-empty-state">Erro ao carregar conversas.</div>';
        }
    }


  // DENTRO DA CLASSE ChatUI

async loadTabData(tabName) {
    switch (tabName) {
        case 'global':
            // A aba global é a única que busca ativamente um histórico de mensagens ao ser aberta.
            await this.loadGlobalMessages();
            break;
        case 'private':
            // Não é necessário fazer nada aqui.
            // A lista de conversas privadas já é mantida em tempo real pelo listener 'conversationsUpdated'.
            // Apenas garantimos que a lista de conversas seja exibida.
            this.elements.privateConversations.style.display = 'flex';
            break;
        case 'groups':
            // Similar ao 'private', a lista de grupos também é atualizada em tempo real.
            // Não há necessidade de uma função de carregamento separada aqui.
            this.elements.groupConversations.style.display = 'flex';
            break;
    }
}



    
    async loadGlobalMessages() {

        this.elements.globalMessages.innerHTML = '<div class="chat-loading"><div class="chat-loading-spinner"></div></div>';
        try {
            const messages = await window.chatManager.getGlobalMessages();
            this.renderMessages(this.elements.globalMessages, messages);
            
        } catch (error) {
            console.error('Error loading global messages:', error);
            this.elements.globalMessages.innerHTML = '<div class="chat-empty-state">Erro ao carregar mensagens globais.</div>';
        }
   
   
    }





    async loadPrivateMessages(conversationId) {
        this.elements.privateMessages.innerHTML = '<div class="chat-loading"><div class="chat-loading-spinner"></div></div>';
        try {
            const messages = await window.chatManager.getPrivateMessages(conversationId);
            this.renderMessages(this.elements.privateMessages, messages);
        } catch (error) {
            console.error('Error loading private messages:', error);
            this.elements.privateMessages.innerHTML = '<div class="chat-empty-state">Erro ao carregar mensagens privadas.</div>';
        }
    }

    async loadGroupMessages(groupId) {
        this.elements.groupMessages.innerHTML = '<div class="chat-loading"><div class="chat-loading-spinner"></div></div>';
        try {
            const messages = await window.chatManager.getGroupMessages(groupId);
            this.renderMessages(this.elements.groupMessages, messages);
        } catch (error) {
            console.error('Error loading group messages:', error);
            this.elements.groupMessages.innerHTML = '<div class="chat-empty-state">Erro ao carregar mensagens de grupo.</div>';
        }
    }

    renderMessages(container, messages) {
        container.innerHTML = '';
        if (messages.length === 0) {
            container.innerHTML = '<div class="chat-empty-state" style="display:none;">Nenhuma mensagem ainda.</div>';
            return;
        }
        messages.sort((a, b) => a.timestamp - b.timestamp);
        messages.forEach(message => {
            container.appendChild(this.createMessageElement(message));
        });
        container.scrollTop = container.scrollHeight;
    }

 // DENTRO DA CLASSE ChatUI
createMessageElement(message) {
    const messageElement = document.createElement('div');

    // --- AJUSTE PRINCIPAL (PASSO 1) ---
    // Adiciona um ID único ao elemento PAI da mensagem.
    // É crucial que o objeto 'message' tenha uma propriedade 'id' única.
    // Se o nome da propriedade for outro (ex: messageId, _id), ajuste aqui.
    if (message.id) {
        messageElement.id = `message-${message.id}`;
    } else {
        // Fallback para evitar erros, embora não previna duplicação se o ID estiver ausente.
        console.warn('Objeto de mensagem recebido sem um "id". A prevenção de duplicação pode falhar.', message);
    }
    // --- FIM DO AJUSTE ---

    const isMyMessage = message.senderId === window.chatManager.currentUser.uid;
    messageElement.className = `chat-message ${isMyMessage ? 'mine' : 'other'}`;
    messageElement.dataset.messageData = JSON.stringify(message);

    const senderName = message.senderName || 'Desconhecido';
    const senderProfilePicture = message.senderProfilePicture || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e';
    const timestamp = message.timestamp ? new Date(message.timestamp ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    let messageContent = message.message;
    if (message.type === 'link' && message.linkPreview) {
        const preview = message.linkPreview;
        messageContent += `
            <div class="chat-link-preview">
                ${preview.image ? `<img src="${preview.image}" alt="Preview Image">` : ''}
                <div class="chat-link-details">
                    <div class="chat-link-title">${preview.title || ''}</div>
                    <div class="chat-link-description">${preview.description || ''}</div>
                    <a href="${preview.url}" target="_blank" class="chat-link-url">${preview.url}</a>
                </div>
            </div>
        `;
    }

    // O restante da sua lógica para construir o innerHTML permanece exatamente o mesmo.
    if (!isMyMessage) {
        messageElement.innerHTML = `
        <div class="fundoMensagem">
            <a class="chat-message-avatar-link" data-user-id="${message.senderId}" title="Ver perfil de ${senderName}">
                <img class="chat-message-avatar" src="${senderProfilePicture}" alt="${senderName}">
            </a>
            <div class="chat-message-content">
                <div class="chat-message-info">
                
                    <a class="chat-message-sender-link" data-user-id="${message.senderId}" title="Ver perfil de ${senderName}">
                        <span class="chat-message-sender">${senderName}</span>
                    </a>
                    <span class="chat-message-time">${timestamp}</span>
                </div>
                <div class="chat-message-text">${messageContent}</div>
        </div>
        </div>
        `;
    } else {
        messageElement.innerHTML = `
         <div class="fundoMensagem">
            <img class="chat-message-avatar" src="${senderProfilePicture}" alt="${senderName}">
            <div class="chat-message-content">
                <div class="chat-message-info">
                    <span class="chat-message-sender">${senderName}</span>
                    <span class="chat-message-time">${timestamp}</span>
                </div>
                <div class="chat-message-text">${messageContent}</div>
            </div>
             </div>
        `;
    }
    
    return messageElement;
}




handleNewMessage(detail) {
    const { type, message, conversationId, unreadCount } = detail;

     // --- INÍCIO DA CORREÇÃO ---
    // Verificação Adicional: Se a mensagem recebida é do usuário atual,
    // não faça nada, pois ela já foi adicionada à tela no momento do envio.
    if (message.senderId === window.chatManager.currentUser.uid) {
        return;
    }
    // --- FIM DA CORREÇÃO ---

    let targetContainer;

    // ... (sua lógica para encontrar o targetContainer não muda) ...
    if (type === 'global' && this.currentTab === 'global') {
        targetContainer = this.elements.globalMessages;
    } else if (type === 'private' && conversationId === this.currentConversation && this.currentTab === 'private') {
        this.markCurrentMessagesAsRead();

        targetContainer = this.elements.privateMessages;
    } else if (type === 'group' && conversationId === this.currentConversation && this.currentTab === 'groups') {
        targetContainer = this.elements.groupMessages;
    }



     if (targetContainer) {
        const messageId = `message-${message.id}`;

        // Esta verificação já previne que a mensagem (que acabou de voltar do Firebase)
        // seja adicionada novamente, pois ela já foi inserida localmente por sendGlobalMessage.
        if (document.getElementById(messageId)) {
            return; 
        }

        // Este código agora só será executado para mensagens de OUTROS usuários.
        const messageElement = this.createMessageElement(message); // Corrigido para usar this.
        targetContainer.appendChild(messageElement);
        targetContainer.scrollTop = targetContainer.scrollHeight;
    }
    // Atualiza badge de notificação e contadores de não lidas
    this.updateNotificationBadges(type, conversationId, unreadCount);

}



    
    updateOnlineUsers(users) {
        this.elements.onlineUsersList.innerHTML = '';
        if (users.length === 0) {
            this.elements.onlineUsersList.innerHTML = '<div class="chat-empty-state">Nenhum usuário com este nome.</div>';
            return;
        }
        users.forEach(([userId, userData]) => {
            const userItem = document.createElement('div');
            userItem.className = 'chat-user-item';
            userItem.dataset.userId = userId;
            userItem.innerHTML = `
                <div class="fundoUserOnline"> 

                    <img src="${userData.profilePicture || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e'}" alt="${userData.name}" class="chat-user-avatar">
                    <span class="chat-user-name">${userData.name || 'Novato'} </span>
                                                <span class="chat-user-status online">

    </span>

                    </div>
            `;
            this.elements.onlineUsersList.appendChild(userItem);
        });
    }

   // Dentro da classe ChatUI

// 1. Transforme a função em 'async'
// DENTRO DA CLASSE ChatUI

// DENTRO DA CLASSE ChatUI

// DENTRO DA CLASSE ChatUI

async updateConversations(conversations) {
    const container = this.elements.privateConversations;

    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="chat-empty-state">
                <div class="chat-empty-title">Nenhuma conversa</div>
                <div class="chat-empty-description">Clique em um usuário online para iniciar uma conversa</div>
            </div>`;
        return;
    }

    const emptyState = container.querySelector('.chat-empty-state, .chat-loading');
    if (emptyState) {
        emptyState.remove();
    }

    const sortedConversations = conversations.sort(([, a], [, b]) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

    // Cria um fragmento de documento para otimizar a manipulação do DOM
    const fragment = document.createDocumentFragment();

    // Mapeia os elementos existentes para reuso ou remoção
    const existingItems = new Map();
    container.querySelectorAll('.chat-conversation-item').forEach(item => {
        existingItems.set(item.dataset.conversationId, item);
    });

    // Itera sobre as conversas ordenadas para atualizar a UI.
    for (const [convId, convData] of sortedConversations) {
        if (convData.type !== 'private') continue;

        let conversationItem = container.querySelector(`.chat-conversation-item[data-conversation-id="${convData.id}"]`);

        if (!conversationItem) {
            conversationItem = document.createElement('div');
            conversationItem.className = 'chat-conversation-item';
            conversationItem.dataset.conversationId = convData.id;
            container.prepend(conversationItem);

            // Adiciona o listener de clique para abrir a conversa APENAS na criação do elemento
            conversationItem.addEventListener('click', () => this.openConversation('private', convData.id));
        }

        let name = convData.otherUserName || 'Carregando...';
        let avatar = convData.otherUserProfilePic || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e';

        if (!convData.otherUserName) {
            const otherUserData = await window.chatManager.getUserData(convData.id);
            if (otherUserData) {
                name = otherUserData.name || 'Novato';
                avatar = otherUserData.profilePicture || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e';
            }
        }

        const unreadBadge = convData.unreadCount > 0 ? `<span class="chat-conversation-badge">🔴</span>` : '';
        const displayName = name.length > 10 ? name.slice(0, 10) + '...' : name;
        const lastMessage = convData.lastMessage || '';
        const displayMessage = lastMessage.length > 15 ? lastMessage.substring(0, 15) + '...' : lastMessage;

        conversationItem.innerHTML = `
            <img src="${avatar}" alt="${displayName}" class="chat-conversation-avatar">
            <div class="chat-conversation-info">
                <span class="chat-conversation-name">${displayName}</span>
                <span class="chat-conversation-last-message">${displayMessage}</span>
            </div>
            ${unreadBadge}
        `;

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'chat-conversation-delete';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Excluir conversa';
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            this.openDeleteModal(convData.id);
        });
        conversationItem.appendChild(deleteBtn);
        fragment.appendChild(conversationItem);

        // Remove o item do mapa de existentes, pois ele foi reusado ou criado
        existingItems.delete(convData.id);
    }

    // Remove da UI as conversas que não existem mais nos dados (restantes no existingItems)
    existingItems.forEach(item => item.remove());

    // Adiciona todos os elementos (novos e atualizados) de uma vez ao DOM
    container.innerHTML = ""; // Limpa o container antes de adicionar o fragmento
    container.appendChild(fragment);
}


// DENTRO DA CLASSE ChatUI

async openConversation(type, conversationId) {

    // 1. Obter a contagem de mensagens não lidas para esta conversa.
    const unreadCount = window.chatManager.getUnreadCount(type, conversationId);

    // 2. Se houver mensagens não lidas, mostre o alerta e ATUALIZE AMBOS os badges.
    if (unreadCount > 0) {

        // --- INÍCIO DA LÓGICA DE SUBTRAÇÃO ---

        // Subtração do Badge de Notificação GERAL (`chat-notification-badge`)
        const mainNotificationBadge = this.elements.notificationBadge;
        if (mainNotificationBadge && mainNotificationBadge.style.display !== 'none') {
            const currentTotal = parseInt(mainNotificationBadge.textContent, 10);
            const newTotal = currentTotal - unreadCount;

            if (newTotal > 0) {
                mainNotificationBadge.textContent = newTotal;
            } else {
                mainNotificationBadge.style.display = 'none';
                mainNotificationBadge.textContent = '0';
            }
        }

        // Subtração do Badge da ABA ESPECÍFICA (`chat-tab-badge`)
        // Primeiro, encontramos a aba correta com base no 'type' da conversa.
        const tabElement = document.querySelector(`.chat-tab[data-tab="${type}"]`);
        if (tabElement) {
            const tabBadge = tabElement.querySelector('.chat-tab-badge');
            if (tabBadge && tabBadge.style.display !== 'none') {
                const currentTabTotal = parseInt(tabBadge.textContent, 10);
                const newTabTotal = currentTabTotal - unreadCount;
                
                if (newTabTotal > 0) {
                    tabBadge.textContent = newTabTotal;
                } else {
                    tabBadge.style.display = 'none';
                    tabBadge.textContent = '0';
                }
            }
        }
        // --- FIM DA LÓGICA DE SUBTRAÇÃO ---
    }

    // 3. Agora, podemos prosseguir com a lógica original da função.
    const fundoMensagens = document.querySelector(".fundoMensagens");
    fundoMensagens.scrollTop = fundoMensagens.scrollHeight;
    const fundoMensagens2 = document.querySelector(".fundoMensagens2");
    fundoMensagens2.scrollTop = fundoMensagens2.scrollHeight;

    this.currentConversation = conversationId;
    
    // switchTab chama markCurrentMessagesAsRead, que fará a marcação oficial no backend.
    this.switchTab(type); 

    if (type === 'private') {
        this.elements.privateMessages.style.display = 'block';
        this.elements.privateInputArea.style.display = 'flex';
        this.elements.privateConversations.style.display = 'flex';
        this.loadPrivateMessages(conversationId);

        const userIdToDisplay = conversationId;
        const userData = await window.chatManager.getUserData(userIdToDisplay);
        
        if (userData) {
            document.getElementById("userNOME").textContent = userData.name || "Novato";
            document.getElementById("userIMG").src = userData.profilePicture || "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";
        }

    } else if (type === 'group' ) {
        this.elements.groupMessages.style.display = 'block';
        this.elements.groupInputArea.style.display = 'flex';
        this.elements.groupConversations.style.display = 'flex';
        this.loadGroupMessages(conversationId);
    }
    
    let userNOME = document.getElementById("userNOME").textContent;
    let fundoUSER = document.getElementById("fundoUSER");

    if (userNOME == "030225") {
        fundoUSER.style.display = "none";
    } else {
        fundoUSER.style.display = "flex";
    }


}


    async sendGlobalMessage() {
     

        const messageInput = this.elements.globalMessageInput;
        const messageText = messageInput.value.trim();
        if (messageText === '') return;

        try {
            const messageId = await window.chatManager.sendMessage('global', messageText);
            // Exibir a própria mensagem imediatamente
            const currentUser = window.chatManager.currentUser;
            const messageData = {
                id: messageId,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'Você',
                senderProfilePicture: currentUser.photoURL || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e',
                message: messageText,
                timestamp: Date.now(),
                type: window.chatManager.detectMessageType(messageText)
            };
            if (messageData.type === 'link') {
                messageData.linkPreview = await window.chatManager.generateLinkPreview(messageText);
            }
            this.elements.globalMessages.appendChild(this.createMessageElement(messageData));
            this.elements.globalMessages.scrollTop = this.elements.globalMessages.scrollHeight;
            messageInput.value = '';
            this.autoResizeTextarea(messageInput);
        } catch (error) {
            console.error('Error sending global message:', error);
            alert('Erro ao enviar mensagem global: ' + error.message);
        }
const fundoMensagens = document.querySelector(".fundoMensagens");
fundoMensagens.scrollTop = fundoMensagens.scrollHeight;
const fundoMensagens2 = document.querySelector(".fundoMensagens2");
fundoMensagens2.scrollTop = fundoMensagens2.scrollHeight;

const chatmessages = document.querySelector(".chat-messages");
chatmessages.scrollTop = chatmessages.scrollHeight;
const chatmessages2 = document.querySelector(".chat-messages2");
chatmessages2.scrollTop = chatmessages2.scrollHeight;

//document.getElementById("globalMessageInput").focus();
    // Adicione esta linha no final da função
    }

    async sendPrivateMessage() {
        const messageInput = this.elements.privateMessageInput;
        const messageText = messageInput.value.trim();
        if (messageText === '' || !this.currentConversation) return;

        try {
            const messageId = await window.chatManager.sendMessage('private', messageText, this.currentConversation);
            // Exibir a própria mensagem imediatamente
            const currentUser = window.chatManager.currentUser;
            const messageData = {
                id: messageId,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'Você',
                senderProfilePicture: currentUser.photoURL || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e',
                message: messageText,
                timestamp: Date.now(),
                type: window.chatManager.detectMessageType(messageText)
            };
            if (messageData.type === 'link') {
                messageData.linkPreview = await window.chatManager.generateLinkPreview(messageText);
            }
            this.elements.privateMessages.appendChild(this.createMessageElement(messageData));
            this.elements.privateMessages.scrollTop = this.elements.privateMessages.scrollHeight;
            messageInput.value = '';
            this.autoResizeTextarea(messageInput);
        } catch (error) {
            console.error('Error sending private message:', error);
            alert('Erro ao enviar mensagem privada: ' + error.message);
        }
          const fundoMensagens2 = document.querySelector(".fundoMensagens2");
fundoMensagens2.scrollTop = fundoMensagens2.scrollHeight;
//document.getElementById("privateMessageInput").focus();

    }

    /*async sendGroupMessage() {
        const messageInput = this.elements.groupMessageInput;
        const messageText = messageInput.value.trim();
        if (messageText === '' || !this.currentConversation) return;

        try {
            const messageId = await window.chatManager.sendMessage('group', messageText, this.currentConversation);
            // Exibir a própria mensagem imediatamente
            const currentUser = window.chatManager.currentUser;
            const messageData = {
                id: messageId,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'Você',
                senderProfilePicture: currentUser.photoURL || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e',
                message: messageText,
                timestamp: Date.now(),
                type: window.chatManager.detectMessageType(messageText)
            };
            if (messageData.type === 'link') {
                messageData.linkPreview = await window.chatManager.generateLinkPreview(messageText);
            }
            this.elements.groupMessages.appendChild(this.createMessageElement(messageData));
            this.elements.groupMessages.scrollTop = this.elements.groupMessages.scrollHeight;
            messageInput.value = '';
            this.autoResizeTextarea(messageInput);
        } catch (error) {
            console.error('Error sending group message:', error);
            alert('Erro ao enviar mensagem de grupo: ' + error.message);
        }
    }*/

    handleUserSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(async () => {
            if (query.trim().length < 2) {
                // Se a busca estiver vazia, recarrega usuários online
                const onlineUsers = window.chatManager.getOnlineUsers();
                this.updateOnlineUsers(onlineUsers);
                return;
            }
            try {
                const results = await window.chatManager.searchUsers(query);
                this.updateOnlineUsers(results.map(user => [user.id, user])); // Adapta o formato para updateOnlineUsers
            } catch (error) {
                console.error('Error searching users:', error);
                this.elements.onlineUsersList.innerHTML = '<div class="chat-empty-state">Erro ao pesquisar usuários.</div>';
            }
        }, 500);
    }

   // Dentro da classe ChatUI

async openProfileModal(userId) { // 1. Adicione 'async' aqui
    try {
        // 2. Use 'await' para esperar a Promise ser resolvida
        const userData = await window.chatManager.getUserData(userId); 

        if (userData) {
            // Agora 'userData' contém os dados corretos do usuário
            this.elements.profileAvatar.src = userData.profilePicture || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e';
            this.elements.profileName.textContent = userData.name || 'Novato';
            this.elements.profileEmail.textContent = userData.email || '';
            this.elements.startPrivateChatBtn.dataset.targetUserId = userId;
            this.elements.profileModal.classList.add('active' );
        } else {
            console.error(`Não foi possível encontrar dados para o usuário com ID: ${userId}`);
            // Opcional: Exibir uma mensagem de erro para o usuário
        }
    } catch (error) {
        console.error("Erro ao abrir o modal de perfil:", error);
    }
}


    closeProfileModal() {
        this.elements.profileModal.classList.remove('active');
    }

    startPrivateChat() {
          this.elements.onlineUsersList.style.display = "none";
    this.elements.userSearchInput.value = "";
        const targetUserId = this.elements.startPrivateChatBtn.dataset.targetUserId;
        if (targetUserId) {
            this.closeProfileModal();
            this.openConversation('private', targetUserId);
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }

// DENTRO DA CLASSE ChatUI

// DENTRO DA CLASSE ChatUI

focusCurrentInput() {
    // Verifica se o dispositivo atual é propenso a ter um teclado virtual.
    // A propriedade 'ontouchstart' em 'window' é um bom indicador de um dispositivo de toque.
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Se for um dispositivo de toque, NÃO focamos no input para evitar abrir o teclado.
    if (isTouchDevice) {
        return;
    }

    // Se for um desktop, o comportamento de focar no input é mantido.
    let inputElement;
    if (this.currentTab === 'global') {
        inputElement = this.elements.globalMessageInput;
    } else if (this.currentTab === 'private') {
        inputElement = this.elements.privateMessageInput;
    } else if (this.currentTab === 'groups') {
        inputElement = this.elements.groupMessageInput;
    }
    
    if (inputElement) {
        // Atrasar um pouco o foco pode ajudar a garantir que o elemento esteja visível.
        setTimeout(() => inputElement.focus(), 100);
    }
}



    //CLIQUE NAS CONVERSAS
    markCurrentMessagesAsRead() {
        if (this.currentTab === 'global') {

            window.chatManager.markMessagesAsRead('global');
        } else if (this.currentTab === 'private' && this.currentConversation) {
    
            window.chatManager.markMessagesAsRead('private', this.currentConversation);

        } else if (this.currentTab === 'groups' && this.currentConversation) {

            window.chatManager.markMessagesAsRead('group', this.currentConversation);
        }
    }

    
    updateNotificationBadges(type, conversationId, unreadCount) {
        const totalUnread = window.chatManager.getTotalUnreadCount();

        if (totalUnread > 0) {
            this.elements.notificationBadge.textContent = totalUnread;
            this.elements.notificationBadge.style.display = 'block';
        } else {
            this.elements.notificationBadge.style.display = 'none';
        }

        let tabBadge;
        if (type === 'global') {
            tabBadge = this.elements.tabs[0].querySelector('.chat-tab-badge');
        } else if (type === 'private') {
            
            tabBadge = this.elements.tabs[1].querySelector('.chat-tab-badge');

        } else if (type === 'group') {
            tabBadge = this.elements.tabs[2].querySelector('.chat-tab-badge');
        }

        if (tabBadge) {
            const mainBadge = document.querySelector('.chat-notification-badge').textContent;
 
            const tabUnread = window.chatManager.getUnreadCount(type, conversationId);
            if (mainBadge > 0) {
                tabBadge.textContent = mainBadge;
                tabBadge.style.display = 'block';
            } else {
                tabBadge.style.display = 'none';
            }
        }
    }

   
    // DENTRO DA CLASSE ChatUI

    openDeleteModal(conversationId) {
        // Armazena o ID da conversa que será excluída no próprio botão de confirmação
        this.elements.confirmDeleteBtn.dataset.conversationId = conversationId;
        this.elements.deleteModal.classList.add('active');
    }

    closeDeleteModal() {
        this.elements.deleteModal.classList.remove('active');
        // Limpa o ID armazenado para segurança
        delete this.elements.confirmDeleteBtn.dataset.conversationId;
    }

    async confirmDeletion() {
        const conversationId = this.elements.confirmDeleteBtn.dataset.conversationId;
        if (!conversationId) return;

        try {
            // Chama a função que vamos criar no ChatManager
            await window.chatManager.deletePrivateConversation(conversationId);
            
            // Se a conversa excluída era a que estava aberta, limpa a tela https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e
            if (this.currentConversation === conversationId) {
                this.elements.privateMessages.innerHTML = '';
                this.elements.privateMessages.style.display = 'flex';
                this.elements.privateInputArea.style.display = 'flex';
                document.getElementById("userNOME").textContent = "Olá, Selecione outra conversa e continue conversando."; // Reseta o header
                document.getElementById("fundoUSER").style.display = "flex";
                             document.getElementById("userIMG").src =
  "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";


                this.currentConversation = null;
            }

        } catch (error) {
            console.error("Erro ao excluir a conversa:", error);
            alert("Não foi possível excluir a conversa. Tente novamente.");
        } finally {

            // Fecha o modal independentemente do resultado
            this.closeDeleteModal();
        }

    }


// DENTRO DA CLASSE ChatUI

/**
 * Configura os listeners para gestos de swipe (deslizar) na área de conteúdo do chat.
 * Permite a navegação entre as abas 'global' e 'private' em dispositivos de toque.
 */
setupSwipeGestures() {
    const swipeArea = this.elements.chatWindow.querySelector('.chat-content');
    if (!swipeArea) return;

    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 200; // A distância mínima em pixels para registrar um swipe

    swipeArea.addEventListener('touchstart', (event) => {
        // Captura a posição inicial do toque
        touchStartX = event.changedTouches[0].screenX;
    }, { passive: true }); // Use passive: true para melhor performance de rolagem

    swipeArea.addEventListener('touchend', (event) => {
        // Captura a posição final do toque
        touchEndX = event.changedTouches[0].screenX;
        handleSwipe();
    });

    const handleSwipe = () => {
        const swipeDistance = touchEndX - touchStartX;

        // Verifica se a distância do swipe é significativa
        if (Math.abs(swipeDistance) < swipeThreshold) {
            return; // Não foi um swipe, foi um toque ou um movimento muito curto
        }

        if (swipeDistance > 0) {
            // O dedo moveu-se para a DIREITA
            console.log('Swipe para a direita detectado: mudando para a aba de conversas privadas.');
                        this.switchTab('global');

        } else {
            // O dedo moveu-se para a ESQUERDA
            console.log('Swipe para a esquerda detectado: mudando para a aba de conversas globais.');
                        this.switchTab('private');

        }
    };
}

    
    
}




window.ChatUI = ChatUI;


