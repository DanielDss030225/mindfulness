// Post View JavaScript - VERSÃO CORRIGIDA
class PostView {
    constructor() {
        this.postId = null;
        this.currentUser = null;
        this.currentUserPhotoURL = null; // Nova propriedade para armazenar foto do usuário atual
        this.post = null;
        this.comments = [];
        this.userPhotos = new Map(); // Cache para fotos de perfil dos usuários
        
        this.init();
    }

    init() {
        // Get post ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.postId = urlParams.get('id');
        
        if (!this.postId) {
            this.showError('ID da publicação não encontrado');
            return;
        }

        // Initialize Firebase auth state listener
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserProfile();
                this.setupCurrentUserPhotoListener(); // Novo listener para foto do usuário atual
                this.loadPost();
                this.loadComments();
                this.setupEventListeners();
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'index.html';
            }
        });
    }

    // Novo método para escutar mudanças na foto de perfil do usuário atual
    setupCurrentUserPhotoListener() {
        if (!this.currentUser) return;
        
        const userPhotoRef = firebase.database().ref(`users/${this.currentUser.uid}/profile/photoURL`);
        userPhotoRef.on('value', (snapshot) => {
            const photoURL = snapshot.val();
            this.currentUserPhotoURL = photoURL || this.getDefaultAvatarURL();
            this.updateCurrentUserAvatar();
        });
    }

    // Método para atualizar avatar do usuário atual na interface
    updateCurrentUserAvatar() {
        const currentUserAvatar = document.getElementById('currentUserAvatar');
        if (currentUserAvatar && this.currentUserPhotoURL) {
            currentUserAvatar.src = this.currentUserPhotoURL;
        }
    }

    // Método para obter URL padrão do avatar
    getDefaultAvatarURL() {
        return 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e';
    }

    // Método para buscar foto de perfil de qualquer usuário
    async getUserPhotoURL(userId) {
        // Verifica cache primeiro
        if (this.userPhotos.has(userId)) {
            return this.userPhotos.get(userId);
        }

        try {
            const userRef = firebase.database().ref(`users/${userId}/profile/photoURL`);
            const snapshot = await userRef.once('value');
            const photoURL = snapshot.val() || this.getDefaultAvatarURL();
            
            // Armazena no cache
            this.userPhotos.set(userId, photoURL);
            return photoURL;
        } catch (error) {
            console.error('Erro ao buscar foto do usuário:', error);
            const defaultURL = this.getDefaultAvatarURL();
            this.userPhotos.set(userId, defaultURL);
            return defaultURL;
        }
    }

    async loadUserProfile() {
        try {
            const userRef = firebase.database().ref(`users/${this.currentUser.uid}/profile`);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();
            
            if (userData && userData.photoURL) {
                this.currentUserPhotoURL = userData.photoURL;
            } else {
                this.currentUserPhotoURL = this.getDefaultAvatarURL();
            }
            
            this.updateCurrentUserAvatar();
        } catch (error) {
            console.error('Erro ao carregar perfil do usuário:', error);
            this.currentUserPhotoURL = this.getDefaultAvatarURL();
            this.updateCurrentUserAvatar();
        }
    }

    async loadPost() {
        try {
            // Corrigindo referência para socialPosts ao invés de posts
            const postRef = firebase.database().ref(`socialPosts/${this.postId}`);
            const snapshot = await postRef.once('value');
            const postData = snapshot.val();
            
            if (!postData) {
                this.showError('Publicação não encontrada');
                return;
            }

            this.post = { id: this.postId, ...postData };
            await this.renderPost();
            this.updateShareLink();
        } catch (error) {
            console.error('Erro ao carregar publicação:', error);
            this.showError('Erro ao carregar publicação');
        }
    }



// Em js/post-view.js, dentro da classe PostView

async renderPost() {
    const postArticle = document.getElementById('postArticle');
    
    const timeAgo = this.getTimeAgo(this.post.timestamp);
    const isLiked = this.post.likes && this.currentUser.uid && this.post.likes[this.currentUser.uid];
    const isAuthor = this.currentUser && this.post.authorId === this.currentUser.uid;
    const authorPhotoURL = await this.getUserPhotoURL(this.post.authorId);
    
    postArticle.innerHTML = `
        <div class="post-header">
            <a href="../user-profile.html?userId=${this.post.authorId}" class="author-link" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;">
                <img src="${authorPhotoURL}" 
                     alt="Avatar do autor" class="post-avatar">
                <div class="post-author-info">
                    <div class="post-author">${this.post.authorName || 'Usuário'}</div>
                    <div class="post-time">${timeAgo}</div>
                </div>
            </a>

            ${isAuthor ? `
                <button id="deletePostBtn" class="delete-post-btn" title="Excluir publicação">
                    <span class="icon">🗑️</span> Excluir
                </button>
            ` : ''}
        </div>
        
        
        ${this.post.imageUrl ? `
            <div class="post-image-container">
                <img src="${this.post.imageUrl}" alt="Post Image" class="post-image">
            </div>
        ` : ''}
                ${this.post.content ? `<div class="post-content">${this.formatPostText(this.post.content)}</div>` : ''}

        <div class="post-actions-bar">
            <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${this.postId}">
                <span class="icon">${isLiked ? '❤️' : '🤍'}</span>
                <span class="like-text">${isLiked ? 'Curtiu' : 'Curtir'}</span>
                ${this.post.likesCount > 0 ? `<span class="like-count">(${this.post.likesCount})</span>` : ''}
            </button>
            
            <button class="action-btn comment-btn-focus" onclick="document.getElementById('commentInput').focus()">
                <span class="icon">💬</span>
                <span id="comentarLabel">Comentar</span>
                <span id="quantidadeComentarios">0</span>
               
            </button>

            <button class="action-btn share-btn-post" onclick="postView.openShareModal()">
                <span class="icon">📤</span>
                <span class="conpartilharLabel">Compartilhar</span>
            </button>
        </div>
    `;

    // Botão de like
    const likeBtn = postArticle.querySelector('.like-btn');
    likeBtn.addEventListener('click', () => this.toggleLike());

    // Botão de excluir
    const deleteBtn = document.getElementById('deletePostBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => this.confirmDeletePost());
    }
}

// *** NOVO: Método para confirmar e deletar a publicação ***
async confirmDeletePost() {
    // Exibe um modal de confirmação
    const confirmation = window.confirm('Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita.');

    if (confirmation) {
        try {
            // Deleta o post do Firebase
            await firebase.database().ref(`socialPosts/${this.postId}`).remove();
            
            // Informa o usuário e redireciona
            alert('Publicação excluída com sucesso!');
            window.location.href = 'index.html'; // Redireciona para o feed
        } catch (error) {
            console.error('Erro ao excluir a publicação:', error);
            alert('Ocorreu um erro ao excluir a publicação. Tente novamente.');
        }
    }
}










    

    formatPostText(text) {
        if (!text) return '';
        
        // Convert URLs to clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="post-link">$1</a>');
        
        // Convert line breaks to <br>
      
        
        return text;
    }

 // Em js/post-view.js, substitua a função toggleLike inteira por esta:

async toggleLike() {
    const postRef = firebase.database().ref(`socialPosts/${this.postId}`);
    const likeRef = postRef.child(`likes/${this.currentUser.uid}`);
    const likesCountRef = postRef.child('likesCount');

    try {
        const snapshot = await likeRef.once('value');
        const isCurrentlyLiked = snapshot.exists();

        // Atualiza a interface do usuário imediatamente para uma resposta rápida
        this.updateLikeButtonUI(!isCurrentlyLiked);

        if (isCurrentlyLiked) {
            // Usuário está descurtindo
            await likeRef.remove(); // Remove o like do usuário
            await likesCountRef.transaction(currentCount => {
                return (currentCount || 0) - 1; // Decrementa o contador
            });
        } else {
            // Usuário está curtindo
            await likeRef.set(true); // Adiciona o like do usuário
            await likesCountRef.transaction(currentCount => {
                return (currentCount || 0) + 1; // Incrementa o contador
            });
        }

        // Opcional: Recarregar apenas os dados de contagem se necessário,
        // mas a atualização da UI já foi feita.
        // Para manter a consistência total, você pode recarregar o post,
        // mas a atualização otimista da UI já melhora a experiência.

    } catch (error) {
        console.error('Erro ao curtir publicação:', error);
        // Se der erro, reverta a UI para o estado anterior
        this.updateLikeButtonUI(isCurrentlyLiked); 
    }
}

// Adicione este novo método auxiliar à sua classe PostView
// Ele atualiza apenas o botão, sem recarregar o post inteiro.
updateLikeButtonUI(isLiked) {
    const likeBtn = document.querySelector(`.like-btn[data-post-id="${this.postId}"]`);
    if (!likeBtn) return;

    const icon = likeBtn.querySelector('.icon');
    const likeText = likeBtn.querySelector('.like-text');
    const likeCountSpan = likeBtn.querySelector('.like-count');
    
    let currentCount = 0;
    if (likeCountSpan && likeCountSpan.textContent) {
        // Extrai o número de dentro dos parênteses, ex: "(4)" -> 4
        currentCount = parseInt(likeCountSpan.textContent.replace(/\D/g, ''), 10);
    }

    if (isLiked) {
        likeBtn.classList.add('liked');
        icon.textContent = '❤️';
        likeText.textContent = 'Curtiu';
        // Atualiza a contagem para +1
        if (likeCountSpan) {
            likeCountSpan.textContent = `(${(isNaN(currentCount) ? 0 : currentCount) + 1})`;
        }
    } else {
        likeBtn.classList.remove('liked');
        icon.textContent = '🤍';
        likeText.textContent = 'Curtir';
        // Atualiza a contagem para -1
        const newCount = (isNaN(currentCount) ? 1 : currentCount) - 1;
        if (likeCountSpan) {
            if (newCount > 0) {
                likeCountSpan.textContent = `(${newCount})`;
            } else {
                likeCountSpan.textContent = ''; // Oculta a contagem se for zero
            }
        }
    }
}


    async loadComments() {
        try {
            // Corrigindo referência para socialPosts/postId/comments
            const commentsRef = firebase.database().ref(`socialPosts/${this.postId}/comments`);
            
            commentsRef.on('value', async (snapshot) => {
                const commentsData = snapshot.val();
                this.comments = commentsData ? Object.entries(commentsData).map(([id, data]) => ({
                    id,
                    ...data
                })) : [];
                
                await this.renderComments();
                this.updateCommentsCount();
            });
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
        }
    }

    async renderComments() {
        const commentsList = document.getElementById('commentsList');
        
        if (this.comments.length === 0) {
            commentsList.innerHTML = `
                <div class="no-comments">
                <h2>Nenhum comentário ainda.</h2>
                    <p>Seja o primeiro a comentar!</p>
                </div>
            `;
                                    document.getElementById("commentsSection").style.display = "none";

            return;
        }

        // Sort comments by timestamp
        const sortedComments = this.comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Renderizar comentários com fotos de perfil corretas
        const commentsHTML = await Promise.all(
            sortedComments.map(comment => this.renderComment(comment))
        );
        
        commentsList.innerHTML = commentsHTML.join('');
        
        // Setup comment interactions
        this.setupCommentInteractions();
    }


    
 async renderComment(comment) {
   
    const timeAgo = this.getTimeAgo(comment.timestamp);
    const isLiked = comment.likes && comment.likes[this.currentUser.uid];
    const likesCount = comment.likes ? Object.keys(comment.likes).length : 0;
    
    // Buscar foto de perfil do autor do comentário
    const authorPhotoURL = await this.getUserPhotoURL(comment.authorId);
    
    // Renderizar respostas se existirem
    let repliesHTML = '';
    if (comment.replies) {
        const repliesArray = Object.entries(comment.replies).map(([id, data]) => ({ id, ...data }));
        const sortedReplies = repliesArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const repliesHTMLArray = await Promise.all(
            sortedReplies.map(reply => this.renderReply(reply))
        );
        
        repliesHTML = `
            <div class="sub-comments-list" data-comment-id="${comment.id}">
        <h2>Respostas</h2>
        ${repliesHTMLArray.join('')}
    </div>
        `;
    }
    
    return `
        <div class="comment-item" data-comment-id="${comment.id}">
        <div class="fundoComent">
            <div class="comment-main-content">
                <a href="../user-profile.html?userId=${comment.authorId}" class="author-link" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;">
                    <img src="${authorPhotoURL}" alt="Avatar do usuário" class="comment-avatar">
                    <div class="comment-content-container">
                        <div class="comment-author">${comment.authorName || 'Usuário'}</div>
                          <span class="comment-time">${timeAgo}</span>
                    </div>
                </a>
                <div class="comment-text">${this.formatCommentText(comment.text)}</div>
            </div>
            <div class="comment-actions">
           
            <button class="comment-like-btn ${isLiked ? 'liked' : ''}" data-comment-id="${comment.id}">
             <span>${isLiked ? 'Curtiu' : 'Curtir'}</span>
                     ${likesCount > 0 ? `(${likesCount})` : ''}
                    
                </button>

                <button class="comment-reply-btn" data-comment-id="${comment.id}">Responder</button>
              
            </div>
            </div>
  
            
            <div class="reply-form" id="replyForm-${comment.id}" style="display: block;">
                <div class="comment-form">
                    <img src="${this.currentUserPhotoURL || this.getDefaultAvatarURL()}" alt="Seu Avatar" class="comment-avatar">
                    <div class="comment-input-container">
                        <textarea placeholder="Escreva uma resposta..." class="texAreaClass" rows="2"></textarea>
                        <div class="comment-actions">
                            <button class="submit-reply-btn" data-comment-id="${comment.id}">Responder</button>
                            <button class="cancel-reply-btn" data-comment-id="${comment.id}">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
                      ${repliesHTML}
        </div>
    `;
}


 async renderReply(reply) {
    const timeAgo = this.getTimeAgo(reply.timestamp);
    const isLiked = reply.likes && reply.likes[this.currentUser.uid];
    const likesCount = reply.likes ? Object.keys(reply.likes).length : 0;
    
    // Buscar foto de perfil do autor da resposta
    const authorPhotoURL = await this.getUserPhotoURL(reply.authorId);
    
    return `
        <div class="comment-item sub-comment" data-reply-id="${reply.id}">
            <div class="comment-main-content">
                <a href="../user-profile.html?userId=${reply.authorId}" class="author-link" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;">
                    <img src="${authorPhotoURL}" alt="Avatar do usuário" class="comment-avatar">
                    <div class="comment-content-container">
                        <div class="comment-author">${reply.authorName || 'Usuário'}</div>
                        <span class="comment-time">${timeAgo}</span>
                    </div>
                </a>
                <div class="comment-text">${this.formatCommentText(reply.text)}</div>
            </div>
            <div class="comment-actions">
                <button class="reply-like-btn ${isLiked ? 'liked' : ''}" data-reply-id="${reply.id}">
                
                    Curtir ${likesCount > 0 ? `(${likesCount})` : 'Curtiu'}
                </button>
                
            </div>
        </div>
    `;
}





    formatCommentText(text) {
        if (!text) return '';
        
        // Convert URLs to clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="comment-link">$1</a>');
        
        // Convert line breaks to <br>
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    setupCommentInteractions() {
        // Like comment buttons
document.querySelectorAll('.comment-like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const commentId = e.currentTarget.dataset.commentId;
        this.toggleCommentLike(commentId, e.currentTarget);
    });
});

        // Like reply buttons
document.querySelectorAll('.reply-like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();     // impede submit/navegação
        e.stopPropagation();    // impede subir pro <a>

        const replyId = e.currentTarget.dataset.replyId; // garante que vem do botão
        this.toggleReplyLike(replyId, e.currentTarget);
    });
});

        
        // Reply buttons
        document.querySelectorAll('.comment-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.dataset.commentId;
                this.showReplyForm(commentId);
            });
        });

        // Submit reply buttons
      // Clique normal no botão "Responder"
document.querySelectorAll('.submit-reply-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const commentId = e.target.dataset.commentId;
        this.submitReply(commentId);
    });
});

// Enter dentro do textarea dispara o botão correspondente
document.querySelectorAll('.texAreaClass').forEach(textarea => {
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault();

            // Acha o botão submit que está mais próximo desse textarea
            const submitBtn = textarea
                .parentElement
                .querySelector('.submit-reply-btn');

            if (submitBtn) submitBtn.click();
        }
    });
});


        // Cancel reply buttons
        document.querySelectorAll('.cancel-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.dataset.commentId;
                this.hideReplyForm(commentId);
            });
        });
    }


// 1. SUBSTITUIR o método toggleCommentLike por este:
async toggleCommentLike(commentId, buttonElement) {
    try {
        const likeRef = firebase.database().ref(`socialPosts/${this.postId}/comments/${commentId}/likes/${this.currentUser.uid}`);
        const snapshot = await likeRef.once('value');
        const isCurrentlyLiked = snapshot.exists();
        
        // Atualiza a UI imediatamente
        this.updateCommentLikeButtonUI(buttonElement, !isCurrentlyLiked);
        
        if (isCurrentlyLiked) {
            await likeRef.remove();
        } else {
            await likeRef.set(true);
        }
    } catch (error) {
        console.error('Erro ao curtir comentário:', error);
        // Reverte a UI em caso de erro
        this.updateCommentLikeButtonUI(buttonElement, isCurrentlyLiked);
    }
}
   // 2. SUBSTITUIR o método toggleReplyLike por este:
async toggleReplyLike(replyId, buttonElement) {
    // Salva o scroll atual da lista de respostas antes de qualquer mudança
    const list = buttonElement.closest(".sub-comments-list");
    const scrollTop = list ? list.scrollTop : 0;

    let isCurrentlyLiked = false;

    try {
        // Encontra o comentário pai que contém essa reply
        const comment = this.comments.find(c => c.replies && c.replies.hasOwnProperty(replyId));
        if (!comment) return;

        const likeRef = firebase.database().ref(
            `socialPosts/${this.postId}/comments/${comment.id}/replies/${replyId}/likes/${this.currentUser.uid}`
        );
        const snapshot = await likeRef.once('value');
        isCurrentlyLiked = snapshot.exists();

        // Atualiza UI imediatamente
        this.updateCommentLikeButtonUI(buttonElement, !isCurrentlyLiked);

        // Atualiza o like no Firebase
        if (isCurrentlyLiked) {
            await likeRef.remove();
        } else {
            await likeRef.set(true);
        }

        // Restaura scroll depois que o DOM for atualizado
        if (list) {
            this.observeRepliesScroll(comment.id, scrollTop);
        }

    } catch (error) {
        console.error('Erro ao curtir resposta:', error);
        // Reverte a UI caso dê erro
        this.updateCommentLikeButtonUI(buttonElement, isCurrentlyLiked);
    }
}


     showReplyForm(commentId) {
        // Hide all other reply forms
        document.querySelectorAll('.reply-form').forEach(form => {
            form.style.display = 'block';
        });
        
        // Show the specific reply form
        const replyForm = document.getElementById(`replyForm-${commentId}`);
        if (replyForm) {
            replyForm.style.display = 'block';
            replyForm.querySelector('textarea').focus();
        }
    } 

    hideReplyForm(commentId) {
        const replyForm = document.getElementById(`replyForm-${commentId}`);
        if (replyForm) {
            replyForm.style.display = 'none';
            replyForm.querySelector('textarea').value = '';
        }
    }

async submitReply(commentId) {
    
    const replyForm = document.getElementById(`replyForm-${commentId}`);
    const textarea = replyForm.querySelector('textarea');
    const replyText = textarea.value.trim();

    // Se estiver vazio → foca novamente no textarea e sai da função
    if (!replyText) {
        textarea.focus();
        return;
    }

    // Se tiver texto → envia e foca no body
    try {
        const replyData = {
            text: replyText,
            authorId: this.currentUser.uid,
            authorName: this.currentUser.displayName || 'Usuário',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        const replyRef = firebase.database()
            .ref(`socialPosts/${this.postId}/comments/${commentId}/replies`)
            .push();

        await replyRef.set(replyData);

        this.hideReplyForm(commentId);

        // depois de enviar limpa e tira foco
        textarea.value = "";
        document.body.focus();
// mostra mensagem de sucesso 🎉
showToast("Resposta enviada com sucesso!");
    } catch (error) {
        console.error('Erro ao enviar resposta:', error);
    }
}

    updateCommentsCount() {
        const totalComments = this.comments.reduce((total, comment) => {
            const repliesCount = comment.replies ? Object.keys(comment.replies).length : 0;
            return total + 1 + repliesCount;
        }, 0);
        
        document.getElementById('commentsCount').textContent = `${totalComments} ${totalComments !== 1 ? '' : ''}`;

         setTimeout(() => {
    document.getElementById('quantidadeComentarios').textContent = 
        `${totalComments} ${totalComments !== 1 ? '' : ''}`;
}, 400);

 
        
    }

    setupEventListeners() {
        // Back to feed button
        document.getElementById('backToFeedBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Share post button
        document.getElementById('sharePostBtn').addEventListener('click', () => {
            this.openShareModal();
        });

        // Submit comment button
        document.getElementById('submitCommentBtn').addEventListener('click', () => {
            this.submitComment();
        });

        // Comment input enter key
        const commentInput = document.getElementById('commentInput');
        commentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.submitComment();
            }
        });

        // Share modal close
        const shareModal = document.getElementById('shareModal');
        const modalClose = shareModal.querySelector('.modal-close');
        modalClose.addEventListener('click', () => {
            this.closeShareModal();
        });

        // Click outside modal to close
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                this.closeShareModal();
            }
        });

        // Copy link button
        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            const shareLink = document.getElementById('shareLink');
            shareLink.select();
            document.execCommand('copy');
            
            const copyBtn = document.getElementById('copyLinkBtn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copiado!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });

        // Social share buttons
        document.getElementById('shareWhatsApp').addEventListener('click', () => {
            const shareLink = document.getElementById('shareLink').value;
            const text = `Confira esta publicação: ${shareLink}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        });

        document.getElementById('shareFacebook').addEventListener('click', () => {
            const shareLink = document.getElementById('shareLink').value;
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank');
        });

        document.getElementById('shareTwitter').addEventListener('click', () => {
            const shareLink = document.getElementById('shareLink').value;
            const text = 'Confira esta publicação:';
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`, '_blank');
        });

        document.getElementById('shareEmail').addEventListener('click', () => {
            const shareLink = document.getElementById('shareLink').value;
            const subject = 'Confira esta publicação';
            const body = `Olá! Gostaria de compartilhar esta publicação com você: ${shareLink}`;
            window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        });
    }

    async submitComment() {
        const commentInput = document.getElementById('commentInput');
        const commentText = commentInput.value.trim();
        
        if (!commentText) return;
        
        try {
            const commentData = {
                text: commentText,
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || 'Usuário',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            
            const commentRef = firebase.database().ref(`socialPosts/${this.postId}/comments`).push();
            await commentRef.set(commentData);
            
            commentInput.value = '';
             // ✅ Mostra a seção de comentários caso seja o primeiro
        const commentsSection = document.getElementById('commentsSection');
        if (commentsSection) {
            commentsSection.style.display = 'block';
        }
        } catch (error) {
            console.error('Erro ao enviar comentário:', error);
        }
    }

    openShareModal() {
        document.getElementById('shareModal').style.display = 'flex';
    }

    closeShareModal() {
        document.getElementById('shareModal').style.display = 'none';
    }

    updateShareLink() {
        
        const shareLink = `${window.location.origin}/post.html?id=${this.postId}`;


        document.getElementById('shareLink').value = shareLink;
    }

    getTimeAgo(timestamp) {
        if (!timestamp) return 'Agora';
        
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}min`;
        return 'Agora';
    }

    showError(message) {
        const postArticle = document.getElementById('postArticle');
        postArticle.innerHTML = `
            <div class="error-message">
                <h3>Erro</h3>
                <p>${message}</p>
                <button onclick="window.location.href='index.html'" class="back-btn">
                    Voltar ao Feed
                </button>
            </div>
        `;
    }

    // Método para limpar listeners quando necessário
    cleanup() {
        if (this.currentUser) {
            const userPhotoRef = firebase.database().ref(`users/${this.currentUser.uid}/profile/photoURL`);
            userPhotoRef.off();
        }
        
        const commentsRef = firebase.database().ref(`socialPosts/${this.postId}/comments`);
        commentsRef.off();
    }


// 3. ADICIONAR este novo método:
updateCommentLikeButtonUI(buttonElement, isLiked) {
    if (!buttonElement) return;
    
    // Extrai a contagem atual do texto do botão
    const currentText = buttonElement.textContent;
    const countMatch = currentText.match(/\((\d+)\)/);
    let currentCount = countMatch ? parseInt(countMatch[1], 10) : 0;
    
    if (isLiked) {
        buttonElement.classList.add('liked');
        const newCount = currentCount + 1;
        buttonElement.textContent = `Curtir ${newCount > 0 ? `(${newCount})` : 'Curtiu'}`;
    } else {
        buttonElement.classList.remove('liked');
        const newCount = Math.max(0, currentCount - 1);
        buttonElement.textContent = `Curtiu ${newCount > 0 ? `(${newCount})` : 'Curtiu'}`;
    }
}

observeRepliesScroll(commentId, scrollTop) {
    const container = document.getElementById('commentsList');
    if (!container) return;

    const observer = new MutationObserver(() => {
        const list = container.querySelector(`.sub-comments-list[data-comment-id="${commentId}"]`);
        if (list) {
            list.scrollTop = scrollTop;
            observer.disconnect();
        }
    });

    observer.observe(container, { childList: true, subtree: true });
}


}

// Initialize the post view when the page loads
let postView;
document.addEventListener('DOMContentLoaded', () => {
    postView = new PostView();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (postView) {
        postView.cleanup();
    }
});

function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  container.appendChild(toast);

  // animação de entrada
  setTimeout(() => toast.classList.add('show'), 100);

  // remove depois de 3s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => container.removeChild(toast), 400);
  }, 3000);
}


const scrollTopBtn = document.getElementById('scrollTopBtn');
const postViewContainer = document.querySelector('.post-view-container');

// Exibe o botão ao rolar 200px dentro do container
postViewContainer.addEventListener('scroll', () => {
    if (postViewContainer.scrollTop > 200) {
        scrollTopBtn.style.display = 'block';
    } else {
        scrollTopBtn.style.display = 'none';
    }
});

// Ao clicar, rola suavemente para o topo do container
scrollTopBtn.addEventListener('click', () => {
    postViewContainer.scrollTo({ top: 0, behavior: 'smooth' });
});
