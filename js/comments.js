// Comments Manager - Handles user comments and interactions
class CommentsManager {
    constructor() {
        this.currentQuestionId = null;
        this.comments = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Submit comment button
        const submitCommentBtn = document.getElementById('submitComment');
        if (submitCommentBtn) {
            submitCommentBtn.addEventListener('click', () => this.submitComment());
        }

        // Comment textarea enter key
        const commentTextarea = document.getElementById('newComment');
        if (commentTextarea) {
            commentTextarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.submitComment();
                }
            });

            // Auto-resize textarea
            commentTextarea.addEventListener('input', () => {
                this.autoResizeTextarea(commentTextarea);
            });
        }

        // Close comments modal
        const commentsModal = document.getElementById('comments-modal');
        if (commentsModal) {
            const closeBtn = commentsModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeCommentsModal());
            }

            // Click outside to close
            commentsModal.addEventListener('click', (e) => {
                if (e.target === commentsModal) {
                    this.closeCommentsModal();

                }
            });
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    async loadComments(questionId) {
        this.currentQuestionId = questionId;
        
        try {
            // Show loading state
            this.showCommentsLoading();
            
            // Get comments from database
            this.comments = await window.databaseManager.getQuestionComments(questionId);
            
            // Update UI
            this.updateCommentsUI();
            
        } catch (error) {
            console.error('Error loading comments:', error);
            this.showCommentsError();
        }
    }

    showCommentsLoading() {
        const commentsList = document.getElementById('commentsList');
        if (commentsList) {
            commentsList.innerHTML = `
                <div class="comments-loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando comentários...</p>
                </div>
            `;
        }
    }

    showCommentsError() {
        const commentsList = document.getElementById('commentsList');
        if (commentsList) {
            commentsList.innerHTML = `
                <div class="comments-error">
                    <p>Erro ao carregar comentários. Tente novamente.</p>
                    <button class="btn-secondary" onclick="window.commentsManager.loadComments('${this.currentQuestionId}')">
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    updateCommentsUI() {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        if (this.comments.length === 0) {
            commentsList.innerHTML = `
                <div class="no-comments">
                    <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                </div>
            `;
            return;
        }

        // Sort comments by creation date (newest first)
        const sortedComments = [...this.comments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        const commentsHTML = sortedComments.map(comment => this.createCommentHTML(comment)).join('');
        commentsList.innerHTML = commentsHTML;

        // Add event listeners to comment actions
        this.setupCommentActions();
    }

    createCommentHTML(comment) {
        const user = window.authManager.getCurrentUser();
        const isOwner = user && comment.userId === user.uid;
        const isAdmin = window.authManager.isUserAdmin();
        const canDelete = isOwner || isAdmin;

        const timeAgo = this.getTimeAgo(comment.createdAt);
        const formattedText = this.formatCommentText(comment.text);

        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="author-avatar">
                            ${comment.authorName ? comment.authorName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div class="author-info">
                            <span class="author-name">${comment.authorName || 'Usuário'}</span>
                            <span class="comment-time">${timeAgo}</span>
                        </div>
                    </div>
                    ${canDelete ? `
                        <button class="comment-delete" data-comment-id="${comment.id}" title="Excluir comentário">
                            ×
                        </button>
                    ` : ''}
                </div>
                <div class="comment-content">
                    ${formattedText}
                </div>
                <div class="comment-actions">
                    <button class="comment-like ${comment.likedBy && comment.likedBy[user?.uid] ? 'liked' : ''}" 
                            data-comment-id="${comment.id}">
                        👍 ${Object.keys(comment.likedBy || {}).length || 0}
                    </button>
                    <button class="comment-reply" data-comment-id="${comment.id}">
                        💬 Responder
                    </button>
                </div>
                ${comment.replies && comment.replies.length > 0 ? `
                    <div class="comment-replies">
                        ${comment.replies.map(reply => this.createReplyHTML(reply)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    createReplyHTML(reply) {
        const user = window.authManager.getCurrentUser();
        const isOwner = user && reply.userId === user.uid;
        const isAdmin = window.authManager.isUserAdmin();
        const canDelete = isOwner || isAdmin;

        const timeAgo = this.getTimeAgo(reply.createdAt);
        const formattedText = this.formatCommentText(reply.text);

        return `
            <div class="reply-item" data-reply-id="${reply.id}">
                <div class="reply-header">
                    <div class="reply-author">
                        <div class="author-avatar small">
                            ${reply.authorName ? reply.authorName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div class="author-info">
                            <span class="author-name">${reply.authorName || 'Usuário'}</span>
                            <span class="reply-time">${timeAgo}</span>
                        </div>
                    </div>
                    ${canDelete ? `
                        <button class="reply-delete" data-reply-id="${reply.id}" title="Excluir resposta">
                            ×
                        </button>
                    ` : ''}
                </div>
                <div class="reply-content">
                    ${formattedText}
                </div>
            </div>
        `;
    }

    formatCommentText(text) {
        // Basic text formatting and sanitization
        let formattedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Detect and format URLs
        const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
        formattedText = formattedText.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="comment-link">$1</a>');

        // Detect and format www links
        const wwwRegex = /(^|[^\/])(www\.[^\s<>"{}|\\^`[\]]+)/gi;
        formattedText = formattedText.replace(wwwRegex, '$1<a href="http://$2" target="_blank" rel="noopener noreferrer" class="comment-link">$2</a>');

        return formattedText;
    }

    getTimeAgo(timestamp) {
        if (!timestamp) return 'Agora';

        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} dia${days > 1 ? 's' : ''} atrás`;
        } else if (hours > 0) {
            return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
        } else if (minutes > 0) {
            return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
        } else {
            return 'Agora';
        }
    }

    setupCommentActions() {
        // Delete comment buttons
        const deleteButtons = document.querySelectorAll('.comment-delete');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.dataset.commentId;
                this.deleteComment(commentId);
            });
        });

        // Like comment buttons
        const likeButtons = document.querySelectorAll('.comment-like');
        likeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.dataset.commentId;
                this.toggleCommentLike(commentId);
            });
        });

        // Reply buttons
        
    }

    async submitComment() {
        const user = window.authManager.getCurrentUser();
        if (!user) {
            window.uiManager.showModal('Erro', 'Você precisa estar logado para comentar.');
            return;
        }

        const commentTextarea = document.getElementById('newComment');
        if (!commentTextarea) return;

        const commentText = commentTextarea.value.trim();
        if (!commentText) {
            window.uiManager.showModal('Erro', 'Por favor, digite um comentário.');
            return;
        }

        if (commentText.length > 500) {
            window.uiManager.showModal('Erro', 'Comentário muito longo. Máximo de 500 caracteres.');
            return;
        }

        try {
            // Disable submit button
            const submitBtn = document.getElementById('submitComment');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
            }

            // Get user data
            const userData = await window.authManager.getUserData();

            // Create comment data
            const commentData = {
                text: commentText,
                userId: user.uid,
                authorName: userData?.name || user.displayName || user.email,
                questionId: this.currentQuestionId,
                likedBy: {}
            };

            // Save comment to database
            await window.databaseManager.addComment(this.currentQuestionId, commentData);

            // Clear textarea
            commentTextarea.value = '';
            this.autoResizeTextarea(commentTextarea);

            // Reload comments
            await this.loadComments(this.currentQuestionId);

            // Show success message
            window.uiManager.showNotification('Comentário adicionado com sucesso!', 'success');

        } catch (error) {
            console.error('Error submitting comment:', error);
            window.uiManager.showModal('Erro', 'Erro ao enviar comentário. Tente novamente.');
        } finally {
            // Re-enable submit button
            const submitBtn = document.getElementById('submitComment');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Comentário';
            }
        }
    }

    async deleteComment(commentId) {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        // Show confirmation
        window.uiManager.showModal(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir este comentário?',
            'warning',
            true
        );

        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');

        modalConfirm.onclick = async () => {
            try {
                window.uiManager.hideModal();
                
                // Delete comment from database
                await window.databaseManager.deleteComment(this.currentQuestionId, commentId);
                
                // Reload comments
                await this.loadComments(this.currentQuestionId);
                
                window.uiManager.showNotification('Comentário excluído com sucesso!', 'success');
                
            } catch (error) {
                console.error('Error deleting comment:', error);
                window.uiManager.showModal('Erro', 'Erro ao excluir comentário.');
            }
        };

        modalCancel.onclick = () => {
            window.uiManager.hideModal();
        };
    }

    async toggleCommentLike(commentId) {
        const user = window.authManager.getCurrentUser();
        if (!user) {
            window.uiManager.showModal('Erro', 'Você precisa estar logado para curtir comentários.');
            return;
        }

        try {
            // Find comment
            const comment = this.comments.find(c => c.id === commentId);
            if (!comment) return;

            // Toggle like
            const likedBy = comment.likedBy || {};
            const isLiked = likedBy[user.uid];

            if (isLiked) {
                delete likedBy[user.uid];
            } else {
                likedBy[user.uid] = true;
            }

            // Update in database
            await window.firebaseServices.database.ref(`comments/${this.currentQuestionId}/${commentId}/likedBy`).set(likedBy);

            // Update local data
            comment.likedBy = likedBy;

            // Update UI
            this.updateCommentsUI();

        } catch (error) {
            console.error('Error toggling comment like:', error);
            window.uiManager.showNotification('Erro ao curtir comentário.', 'error');
        }
    }

   

    closeCommentsModal() {
        const commentsModal = document.getElementById('comments-modal');
        if (commentsModal) {
            commentsModal.classList.remove('active');
        }

        // Clear current question
        this.currentQuestionId = null;
        this.comments = [];

        // Clear comment form
        const commentTextarea = document.getElementById('newComment');
        if (commentTextarea) {
            commentTextarea.value = '';
            this.autoResizeTextarea(commentTextarea);
        }
    }

    // Show comments modal for a specific question
    showCommentsForQuestion(questionId) {
        window.uiManager.showCommentsModal(questionId);
    }

    // Get comment count for a question
    async getCommentCount(questionId) {
        try {
            const comments = await window.databaseManager.getQuestionComments(questionId);
            return comments.length;
        } catch (error) {
            console.error('Error getting comment count:', error);
            return 0;
        }
    }

    // Moderate comments (admin only)
    async moderateComment(commentId, action) {
        if (!window.authManager.isUserAdmin()) {
            window.uiManager.showModal('Acesso Negado', 'Apenas administradores podem moderar comentários.');
            return;
        }

        try {
            switch (action) {
                case 'hide':
                    await window.firebaseServices.database.ref(`comments/${this.currentQuestionId}/${commentId}/hidden`).set(true);
                    break;
                case 'unhide':
                    await window.firebaseServices.database.ref(`comments/${this.currentQuestionId}/${commentId}/hidden`).remove();
                    break;
                case 'delete':
                    await this.deleteComment(commentId);
                    return;
            }

            // Reload comments
            await this.loadComments(this.currentQuestionId);
            
            window.uiManager.showNotification('Ação de moderação realizada com sucesso!', 'success');

        } catch (error) {
            console.error('Error moderating comment:', error);
            window.uiManager.showModal('Erro', 'Erro ao moderar comentário.');
        }
    }

    // Report inappropriate comment
    async reportComment(commentId, reason) {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            const reportData = {
                commentId,
                questionId: this.currentQuestionId,
                reportedBy: user.uid,
                reason,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            await window.firebaseServices.database.ref('reports/comments').push(reportData);
            
            window.uiManager.showNotification('Comentário reportado. Obrigado!', 'success');

        } catch (error) {
            console.error('Error reporting comment:', error);
            window.uiManager.showNotification('Erro ao reportar comentário.', 'error');
        }
    }
}

// Initialize Comments Manager
window.commentsManager = new CommentsManager();

