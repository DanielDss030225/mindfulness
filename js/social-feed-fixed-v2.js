// Social Feed Manager - Handles social media functionality with real-time updates
class SocialFeedManager {
    constructor() {
        this.posts = [];
        this.currentUser = null;
        this.currentUserPhotoURL = null; // Nova variável para armazenar a photoURL atualizada
        this.postsRef = null;
        
        // Lazy loading properties
        this.postsPerPage = 5; // Número de posts por página
        this.lastPostKey = null; // Chave do último post carregado
        this.isLoading = false; // Flag para evitar múltiplas requisições
        this.hasMorePosts = true; // Flag para verificar se há mais posts
        this.allPostsLoaded = false; // Flag para verificar se todos os posts foram carregados
        
        this.init();
    }

    init() {
        // Initialize Firebase references
        this.postsRef = firebase.database().ref('socialPosts');
        this.setupEventListeners();
        this.loadCurrentUser();
        this.setupScrollListener(); // Novo listener para scroll
        this.checkForSharedPost(); // Verificar se há um post específico na URL
    }

    loadCurrentUser() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                this.updateUserProfileInPost();
                this.loadInitialPosts(); // Carregar posts iniciais
                this.setupProfilePictureListener(user.uid);
            }
        });
    }

    setupProfilePictureListener(userId) {
        // Escuta mudanças na foto de perfil do usuário em tempo real
        const userProfileRef = firebase.database().ref(`users/${userId}/profile/photoURL`);
        userProfileRef.on('value', (snapshot) => {
            const newPhotoURL = snapshot.val();
            if (newPhotoURL && this.currentUser) {
                // Armazena a URL atualizada em uma variável separada
                this.currentUserPhotoURL = newPhotoURL;
                
                // Atualiza a foto de perfil na área de criação de posts
                this.updateUserProfileInPost();
                
                // Atualiza todos os posts existentes do usuário no feed
                this.updateUserPostsProfilePicture(userId, newPhotoURL);
                
                // Atualiza todos os comentários existentes do usuário no feed
                this.updateUserCommentsProfilePicture(userId, newPhotoURL);
            }
        });
    }

    updateUserPostsProfilePicture(userId, newPhotoURL) {
        // Atualiza a foto de perfil em todos os posts do usuário no feed
        const userPosts = document.querySelectorAll(`[data-post-id]`);
        userPosts.forEach(postElement => {
            const postAvatar = postElement.querySelector('.post-avatar');
            if (postAvatar) {
                // Verifica se o post pertence ao usuário atual
                const postId = postElement.getAttribute('data-post-id');
                this.updatePostAvatarIfUserOwns(postId, userId, newPhotoURL);
            }
        });
    }

    async updatePostAvatarIfUserOwns(postId, userId, newPhotoURL) {
        try {
            const postRef = this.postsRef.child(postId);
            const snapshot = await postRef.once('value');
            const post = snapshot.val();
            
            if (post && post.authorId === userId) {
                // Atualiza a foto de perfil no banco de dados
                await postRef.update({
                    authorPhotoURL: newPhotoURL
                });
                
                // Atualiza a foto de perfil na UI imediatamente
                const postElement = document.querySelector(`[data-post-id="${postId}"]`);
                if (postElement) {
                    const postAvatar = postElement.querySelector('.post-avatar');
                    if (postAvatar) {
                        postAvatar.src = newPhotoURL;
                    }
                }
            }
        } catch (error) {
            console.error('Error updating post avatar:', error);
        }
    }

    updateUserCommentsProfilePicture(userId, newPhotoURL) {
        // Atualiza a foto de perfil em todos os comentários e sub-comentários do usuário no feed
        console.log('Atualizando fotos de perfil para userId:', userId, 'nova URL:', newPhotoURL);
        
        // Busca todos os avatares de comentários (incluindo sub-comentários)
        const commentAvatars = document.querySelectorAll('.comment-avatar');
        console.log('Total de avatares encontrados:', commentAvatars.length);
        
        commentAvatars.forEach((avatar, index) => {
            const commentElement = avatar.closest('.comment-item');
            if (commentElement) {
                console.log(`Processando avatar ${index + 1}:`, {
                    commentId: commentElement.getAttribute('data-comment-id'),
                    replyId: commentElement.getAttribute('data-reply-id'),
                    isSubComment: commentElement.classList.contains('sub-comment')
                });
                this.updateCommentAvatarIfUserOwns(commentElement, userId, newPhotoURL);
            }
        });
        
        // Busca especificamente por sub-comentários que podem ter sido perdidos
        const subComments = document.querySelectorAll('.sub-comment');
        console.log('Sub-comentários encontrados diretamente:', subComments.length);
        
        subComments.forEach((subComment, index) => {
            const avatar = subComment.querySelector('.comment-avatar');
            if (avatar) {
                console.log(`Processando sub-comentário ${index + 1}:`, {
                    replyId: subComment.getAttribute('data-reply-id'),
                    hasAvatar: !!avatar
                });
                this.updateCommentAvatarIfUserOwns(subComment, userId, newPhotoURL);
            }
        });
    }

    async updateCommentAvatarIfUserOwns(commentElement, userId, newPhotoURL) {
        try {
            const commentId = commentElement.getAttribute('data-comment-id');
            const replyId = commentElement.getAttribute('data-reply-id');
            const postElement = commentElement.closest('[data-post-id]');
            
            if (!postElement) return;
            
            const postId = postElement.getAttribute('data-post-id');
            
            if (replyId) {
                // É uma resposta (sub-comentário)
                console.log('Processando sub-comentário (resposta)');
                const parentCommentId = commentElement.closest('[data-comment-id]')?.getAttribute('data-comment-id');
                if (!parentCommentId) {
                    console.log('ID do comentário pai não encontrado para resposta');
                    return;
                }
                
                const replyRef = this.postsRef.child(postId).child('comments').child(parentCommentId).child('replies').child(replyId);
                const snapshot = await replyRef.once('value');
                const reply = snapshot.val();
                
                console.log('Dados da resposta:', reply);
                
                if (reply && reply.authorId === userId) {
                    console.log('Atualizando resposta do usuário no Firebase');
                    await replyRef.update({
                        authorPhotoURL: newPhotoURL
                    });
                    
                    const avatar = commentElement.querySelector('.comment-avatar');
                    if (avatar) {
                        console.log('Atualizando avatar da resposta na UI');
                        avatar.src = newPhotoURL;
                    }
                } else {
                    console.log('Resposta não pertence ao usuário ou não existe');
                }
            } else if (commentId) {
                // É um comentário principal
                console.log('Processando comentário principal');
                const commentRef = this.postsRef.child(postId).child('comments').child(commentId);
                const snapshot = await commentRef.once('value');
                const comment = snapshot.val();
                
                console.log('Dados do comentário:', comment);
                
                if (comment && comment.authorId === userId) {
                    console.log('Atualizando comentário do usuário no Firebase');
                    await commentRef.update({
                        authorPhotoURL: newPhotoURL
                    });
                    
                    const avatar = commentElement.querySelector('.comment-avatar');
                    if (avatar) {
                        console.log('Atualizando avatar do comentário na UI');
                        avatar.src = newPhotoURL;
                    }
                } else {
                    console.log('Comentário não pertence ao usuário ou não existe');
                }
            }
        } catch (error) {
            console.error('Error updating comment avatar:', error);
        }
    }

    updateUserProfileInPost() {
        const currentUserProfilePic = document.getElementById('currentUserProfilePicPost');
        const postContentInput = document.getElementById('postContentInput');
        
        if (currentUserProfilePic && this.currentUser) {
            // Usa a URL atualizada se disponível, senão usa a do currentUser
            const photoURL = this.currentUserPhotoURL || this.currentUser.photoURL || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e';
            currentUserProfilePic.src = photoURL;
        }
        
        if (postContentInput && this.currentUser) {
            const userName = this.currentUser.displayName || 'Usuário';
            postContentInput.placeholder = `Você gostaria de dizer algo, ${userName}?`;
        }
    }

    setupEventListeners() {
        // Create post button
        const createPostBtn = document.getElementById('createPostBtn');
        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => this.createPost());
        }

        // Select image button
        const selectImageBtn = document.getElementById('selectImageBtn');
        const postImageInput = document.getElementById('postImageInput');
        if (selectImageBtn && postImageInput) {
            selectImageBtn.addEventListener('click', () => postImageInput.click());
            postImageInput.addEventListener('change', (e) => this.handleImageSelection(e));
        }

        // Remove image button
        const removeImageBtn = document.getElementById('removeImageBtn');
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => this.removeSelectedImage());
        }

        // Enter key to post
        const postContentInput = document.getElementById('postContentInput');
        if (postContentInput) {
            postContentInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.createPost();
                }
            });
        }

        // ✅ Event delegation CORRIGIDO para botões de curtir comentários e respostas
        document.addEventListener('click', (e) => {
            // Debug: log todos os cliques em elementos com classe comment-like-btn
            if (e.target.classList.contains('comment-like-btn')) {
                console.log('Comment like button clicked:', {
                    commentId: e.target.dataset.commentId,
                    replyId: e.target.dataset.replyId,
                    classes: e.target.className
                });
            }
            
            // Botão de curtir comentário (não sub-comentário)
            if (e.target.classList.contains('comment-like-btn') && 
                e.target.dataset.commentId && 
                !e.target.dataset.replyId) {
                e.preventDefault();
                e.stopPropagation();
                const commentId = e.target.dataset.commentId;
                const postElement = e.target.closest('[data-post-id]');
                if (postElement) {
                    const postId = postElement.dataset.postId;
                    console.log('Comment like triggered:', { postId, commentId });
                    this.toggleCommentLike(postId, commentId);
                }
            }
            
            // Botão de curtir resposta (sub-comentário)
            else if (e.target.classList.contains('comment-like-btn') && 
                     e.target.dataset.replyId) {
                e.preventDefault();
                e.stopPropagation();
                const replyId = e.target.dataset.replyId;
                const commentElement = e.target.closest('[data-comment-id]');
                const postElement = e.target.closest('[data-post-id]');
                if (commentElement && postElement) {
                    const commentId = commentElement.dataset.commentId;
                    const postId = postElement.dataset.postId;
                    console.log('Reply like triggered via delegation:', { postId, commentId, replyId });
                    this.toggleReplyLike(postId, commentId, replyId);
                }
            }
            
            // Botão de responder
            else if (e.target.classList.contains('comment-reply-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const commentId = e.target.dataset.commentId;
                const postElement = e.target.closest('[data-post-id]');
                if (postElement && commentId) {
                    const postId = postElement.dataset.postId;
                    this.showReplyInput(postId, commentId);
                }
            }
        });
    }

    setupRealtimeListeners() {
        // Listen for new posts
        this.postsRef.on('child_added', (snapshot) => {
            const post = { id: snapshot.key, ...snapshot.val() };
            this.addPostToUI(post);
        });

        // Listen for post updates (likes, comments)
        this.postsRef.on('child_changed', (snapshot) => {
            const post = { id: snapshot.key, ...snapshot.val() };
            this.updatePostInUI(post);
        });

        // Listen for post deletions
        this.postsRef.on('child_removed', (snapshot) => {
            this.removePostFromUI(snapshot.key);
        });

        // Listen for real-time comment updates
        this.postsRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const posts = snapshot.val();
                Object.keys(posts).forEach(postId => {
                    this.setupCommentListeners(postId);
                });
            }
        });
    }

    setupCommentListeners(postId) {
        const commentsRef = this.postsRef.child(postId).child('comments');
        
        // Listen for new comments
        commentsRef.on('child_added', (snapshot) => {
            const comment = { id: snapshot.key, ...snapshot.val() };
            this.addCommentToUI(postId, comment);
            this.setupReplyListeners(postId, snapshot.key);
        });

        // Listen for comment updates
        commentsRef.on('child_changed', (snapshot) => {
            const comment = { id: snapshot.key, ...snapshot.val() };
            this.updateCommentInUI(postId, comment);
        });

        // Listen for comment deletions
        commentsRef.on('child_removed', (snapshot) => {
            this.removeCommentFromUI(postId, snapshot.key);
        });
    }

    setupReplyListeners(postId, commentId) {
        const repliesRef = this.postsRef.child(postId).child('comments').child(commentId).child('replies');
        
        // Listen for new replies
        repliesRef.on('child_added', (snapshot) => {
            const reply = { id: snapshot.key, ...snapshot.val() };
            this.addReplyToUI(postId, commentId, reply);
        });

        // Listen for reply updates
        repliesRef.on('child_changed', (snapshot) => {
            const reply = { id: snapshot.key, ...snapshot.val() };
            this.updateReplyInUI(postId, commentId, reply);
        });

        // Listen for reply deletions
        repliesRef.on('child_removed', (snapshot) => {
            this.removeReplyFromUI(postId, commentId, snapshot.key);
        });
    }

    addCommentToUI(postId, comment) {
        const commentsContainer = document.getElementById(`comments-${postId}`);
        if (!commentsContainer) return;

        // Evita duplicação
        const existingComment = commentsContainer.querySelector(`[data-comment-id="${comment.id}"]`);
        if (existingComment) return;

        const commentElementWrapper = document.createElement('div');
        commentElementWrapper.innerHTML = this.createCommentHTML(comment.id, comment);
        const commentElement = commentElementWrapper.firstElementChild;

        // Inserir o novo comentário no início do contêiner (mais recente primeiro)
        if (commentsContainer.firstChild) {
            commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
        } else {
            commentsContainer.appendChild(commentElement);
        }
        this.updateCommentCount(postId);
    }

    updateCommentInUI(postId, comment) {
        const commentElement = document.querySelector(`[data-comment-id="${comment.id}"]`);
        if (commentElement) {
            const newCommentElement = document.createElement('div');
            newCommentElement.innerHTML = this.createCommentHTML(comment.id, comment);
            const newElement = newCommentElement.firstElementChild;
            
            commentElement.replaceWith(newElement);
        }
    }

    removeCommentFromUI(postId, commentId) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.remove();
            this.updateCommentCount(postId);
        }
    }

    addReplyToUI(postId, commentId, reply) {
        let subCommentsContainer = document.querySelector(`[data-comment-id="${commentId}"] .sub-comments-list`);
        
        // Cria container se não existir
        if (!subCommentsContainer) {
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentElement) {
                subCommentsContainer = document.createElement('div');
                subCommentsContainer.className = 'sub-comments-list';
                commentElement.appendChild(subCommentsContainer);
            }
        }

        if (subCommentsContainer) {
            // ✅ Evita duplicação
            const existingReply = subCommentsContainer.querySelector(`[data-reply-id="${reply.id}"]`);
            if (existingReply) return;

            const replyElement = document.createElement('div');
            replyElement.innerHTML = this.createReplyHTML(reply.id, reply);
            const newReplyElement = replyElement.firstElementChild;

            subCommentsContainer.appendChild(newReplyElement);
        }
    }

    updateReplyInUI(postId, commentId, reply) {
        const replyElement = document.querySelector(`[data-reply-id="${reply.id}"]`);
        if (replyElement) {
            const newReplyElement = document.createElement('div');
            newReplyElement.innerHTML = this.createReplyHTML(reply.id, reply);
            const newElement = newReplyElement.firstElementChild;
            
            replyElement.replaceWith(newElement);
        }
    }

    removeReplyFromUI(postId, commentId, replyId) {
        const replyElement = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (replyElement) {
            replyElement.remove();
            
            // Remove sub-comments container if empty
            const subCommentsContainer = document.querySelector(`[data-comment-id="${commentId}"] .sub-comments-list`);
            if (subCommentsContainer && subCommentsContainer.children.length === 0) {
                subCommentsContainer.remove();
            }
        }
    }

    // ✅ NOVA FUNÇÃO: Curtir/descurtir comentário
    async toggleCommentLike(postId, commentId) {
        if (!this.currentUser) {
            alert('Você precisa estar logado para curtir.');
            return;
        }

        try {
            const commentRef = this.postsRef.child(postId).child('comments').child(commentId);
            const snapshot = await commentRef.once('value');
            const comment = snapshot.val();

            if (!comment) return;

            const likes = comment.likes || {};
            const userLiked = likes[this.currentUser.uid];

            if (userLiked) {
                // Remove like
                delete likes[this.currentUser.uid];
            } else {
                // Add like
                likes[this.currentUser.uid] = {
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    userName: this.currentUser.displayName || 'Usuário'
                };
            }

            // Update comment
            await commentRef.update({
                likes: likes,
                likesCount: Object.keys(likes).length
            });

            // ✅ Atualiza UI imediatamente
            this.updateCommentLikeUI(commentId, likes, userLiked);

        } catch (error) {
            console.error('Error toggling comment like:', error);
        }
    }

    // ✅ NOVA FUNÇÃO: Curtir/descurtir resposta
    async toggleReplyLike(postId, commentId, replyId) {
        if (!this.currentUser) {
            alert('Você precisa estar logado para curtir.');
            return;
        }

        try {
            const replyRef = this.postsRef.child(postId).child('comments').child(commentId).child('replies').child(replyId);
            const snapshot = await replyRef.once('value');
            const reply = snapshot.val();

            if (!reply) return;

            const likes = reply.likes || {};
            const userLiked = likes[this.currentUser.uid];

            if (userLiked) {
                // Remove like
                delete likes[this.currentUser.uid];
            } else {
                // Add like
                likes[this.currentUser.uid] = {
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    userName: this.currentUser.displayName || 'Usuário'
                };
            }

            // Update reply
            await replyRef.update({
                likes: likes,
                likesCount: Object.keys(likes).length
            });

            // ✅ Atualiza UI imediatamente
            this.updateReplyLikeUI(replyId, likes, userLiked);

        } catch (error) {
            console.error('Error toggling reply like:', error);
        }
    }

    // ✅ NOVA FUNÇÃO: Atualiza UI do botão de curtir do comentário
    updateCommentLikeUI(commentId, likes, wasLiked) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const likeBtn = commentElement.querySelector('.comment-like-btn');
        if (!likeBtn) return;

        const likesCount = Object.keys(likes).length;
        const isLiked = !wasLiked; // Inverte porque já foi alterado

        // Atualiza texto e estilo do botão
        if (isLiked) {
            likeBtn.textContent = `Curtiu ${likesCount > 0 ? `(${likesCount})` : ''}`;
            likeBtn.classList.add('liked');
        } else {
            likeBtn.textContent = `Curtir ${likesCount > 0 ? `(${likesCount})` : ''}`;
            likeBtn.classList.remove('liked');
        }
    }

    // ✅ NOVA FUNÇÃO: Atualiza UI do botão de curtir da resposta
    updateReplyLikeUI(replyId, likes, wasLiked) {
        const replyElement = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (!replyElement) return;

        const likeBtn = replyElement.querySelector('.comment-like-btn');
        if (!likeBtn) return;

        const likesCount = Object.keys(likes).length;
        const isLiked = !wasLiked; // Inverte porque já foi alterado

        // Atualiza texto e estilo do botão
        if (isLiked) {
            likeBtn.textContent = `Curtiu ${likesCount > 0 ? `(${likesCount})` : ''}`;
            likeBtn.classList.add('liked');
        } else {
            likeBtn.textContent = `Curtir ${likesCount > 0 ? `(${likesCount})` : ''}`;
            likeBtn.classList.remove('liked');
        }
    }

    updateCommentCount(postId) {
        // Update comment count in the action bar
        const commentBtn = document.querySelector(`[data-post-id="${postId}"].comment-btn`);
        if (commentBtn) {
            const commentsContainer = document.getElementById(`comments-${postId}`);
            const commentCount = commentsContainer ? commentsContainer.children.length : 0;
            
            const commentCountSpan = commentBtn.querySelector('.comment-count');
            if (commentCount > 0) {
                if (commentCountSpan) {
                    commentCountSpan.textContent = `(${commentCount})`;
                } else {
                    const newCountSpan = document.createElement('span');
                    newCountSpan.className = 'comment-count';
                    newCountSpan.textContent = `(${commentCount})`;
                    commentBtn.appendChild(newCountSpan);
                }
            } else if (commentCountSpan) {
                commentCountSpan.remove();
            }
        }
    }

    handleImageSelection(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imagePreview = document.getElementById('imagePreview');
                const imagePreviewContainer = document.getElementById('imagePreviewContainer');
                
                if (imagePreview && imagePreviewContainer) {
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    }

    removeSelectedImage() {
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        const postImageInput = document.getElementById('postImageInput');
        
        if (imagePreviewContainer) {
            imagePreviewContainer.style.display = 'none';
        }
        if (postImageInput) {
            postImageInput.value = '';
        }
    }

    async createPost() {
        const postContentInput = document.getElementById('postContentInput');
        const postImageInput = document.getElementById('postImageInput');
        const createPostBtn = document.getElementById('createPostBtn');
        
        // Show progress bar immediately when button is clicked
        this.showUploadProgress();
        this.updateUploadProgress(0);
        
        // Disable the post button
        createPostBtn.disabled = true;
        createPostBtn.textContent = "Publicando...";
        
        if (!this.currentUser) {
            this.hideUploadProgress();
            createPostBtn.disabled = false;
            createPostBtn.textContent = "Publicar";
            alert('Você precisa estar logado para publicar.');
            return;
        }

        const content = postContentInput.value.trim();
        const imageFile = postImageInput.files[0];

        if (!content && !imageFile) {
            this.hideUploadProgress();
            createPostBtn.disabled = false;
            createPostBtn.textContent = "Publicar";
            alert('Adicione algum conteúdo ou imagem para publicar.');
            return;
        }

        try {
            let imageUrl = null;
            
            // Upload image if selected
            if (imageFile) {
                this.updateUploadProgress(10);
                
                const storageRef = firebase.storage().ref();
                const imageRef = storageRef.child(`social-posts/${Date.now()}_${imageFile.name}`);
                
                // Create upload task with progress monitoring
                const uploadTask = imageRef.put(imageFile);
                
                // Monitor upload progress
                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            // Calculate progress percentage
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            const adjustedProgress = 10 + (progress * 0.6); // 10% to 70% for upload
                            this.updateUploadProgress(adjustedProgress);
                        },
                        (error) => {
                            console.error('Upload error:', error);
                            reject(error);
                        },
                        async () => {
                            // Upload completed successfully
                            this.updateUploadProgress(70);
                            try {
                                imageUrl = await uploadTask.snapshot.ref.getDownloadURL();
                                this.updateUploadProgress(80);
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        }
                    );
                });
            } else {
                this.updateUploadProgress(80);
            }

            // Create post object
            this.updateUploadProgress(85);
            
            // Usar a photoURL mais recente disponível
            const currentPhotoURL = this.currentUserPhotoURL || this.currentUser.photoURL || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e';

            const post = {
                content: content,
                imageUrl: imageUrl,
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || 'Usuário',
                authorPhotoURL: currentPhotoURL,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                likes: {},
                likesCount: 0,
                comments: {},
                commentsCount: 0
            };

            // Save to Firebase
            await this.postsRef.push(post);
            
            this.updateUploadProgress(100);

            // Clear form after a short delay
            setTimeout(() => {
                postContentInput.value = '';
                this.removeSelectedImage();
                this.hideUploadProgress();
                
                // Re-enable the post button
                createPostBtn.disabled = false;
                createPostBtn.textContent = 'Publicar';
            }, 1500);

            console.log('Post created successfully');
        } catch (error) {
            console.error('Error creating post:', error);
            this.hideUploadProgress();
            createPostBtn.disabled = false;
            createPostBtn.textContent = "Publicar";
            alert('Erro ao criar publicação. Tente novamente.');
        }
    }

    async loadInitialPosts() {
        const postsContainer = document.getElementById('postsContainer');
        if (postsContainer) {
            postsContainer.innerHTML = `
                <div class="loading-posts">
                    <div class="loading-spinner"></div>
                    <p>Carregando publicações...</p>
                </div>
            `;
        }

        this.isLoading = true;
        this.lastPostKey = null;
        this.hasMorePosts = true;
        this.allPostsLoaded = false;

        try {
            const query = this.postsRef
                .orderByKey()
                .limitToLast(this.postsPerPage);

            const snapshot = await query.once('value');
            
            if (snapshot.exists()) {
                const posts = [];
                snapshot.forEach(childSnapshot => {
                    posts.unshift({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });

                // Remove loading message
                const loadingPosts = postsContainer.querySelector('.loading-posts');
                if (loadingPosts) {
                    loadingPosts.remove();
                }

                // Add posts to UI
                posts.forEach(post => {
                    this.addPostToUI(post, false); // false = não adicionar no início
                });

                // Update pagination info
                if (posts.length > 0) {
                    this.lastPostKey = posts[posts.length - 1].id;
                }

                if (posts.length < this.postsPerPage) {
                    this.hasMorePosts = false;
                    this.allPostsLoaded = true;
                    this.showNoMorePostsMessage();
                }

                // Setup real-time listeners for new posts only
                this.setupNewPostListener();
            } else {
                // No posts found
                postsContainer.innerHTML = `
                    <div class="no-posts">
                        <p>Nenhuma publicação encontrada. Seja o primeiro a publicar!</p>
                    </div>
                `;
                this.hasMorePosts = false;
                this.allPostsLoaded = true;
            }
        } catch (error) {
            console.error('Error loading initial posts:', error);
            postsContainer.innerHTML = `
                <div class="error-posts">
                    <p>Erro ao carregar publicações. Tente novamente.</p>
                </div>
            `;
        } finally {
            this.isLoading = false;
        }
    }

    async loadMorePosts() {
        if (this.isLoading || !this.hasMorePosts || this.allPostsLoaded) {
            return;
        }

        this.isLoading = true;
        this.showLoadingMoreMessage();

        try {
            const query = this.postsRef
                .orderByKey()
                .endAt(this.lastPostKey)
                .limitToLast(this.postsPerPage + 1); // +1 para excluir o último post já carregado

            const snapshot = await query.once('value');
            
            if (snapshot.exists()) {
                const posts = [];
                snapshot.forEach(childSnapshot => {
                    // Pular o último post já carregado
                    if (childSnapshot.key !== this.lastPostKey) {
                        posts.unshift({
                            id: childSnapshot.key,
                            ...childSnapshot.val()
                        });
                    }
                });

                // Add posts to UI
                posts.forEach(post => {
                    this.addPostToUI(post, false); // false = adicionar no final
                });

                // Update pagination info
                if (posts.length > 0) {
                    this.lastPostKey = posts[posts.length - 1].id;
                }

                if (posts.length < this.postsPerPage) {
                    this.hasMorePosts = false;
                    this.allPostsLoaded = true;
                    this.showNoMorePostsMessage();
                }
            } else {
                this.hasMorePosts = false;
                this.allPostsLoaded = true;
                this.showNoMorePostsMessage();
            }
        } catch (error) {
            console.error('Error loading more posts:', error);
        } finally {
            this.isLoading = false;
            this.hideLoadingMoreMessage();
        }
    }

    addPostToUI(post, addToBeginning = true) {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;
        
        // Check if post already exists in UI
        const existingPost = document.querySelector(`[data-post-id="${post.id}"]`);
        if (existingPost) {
            // Update existing post
            this.updatePostInUI(post);
            return;
       }

        // Remove no posts message if it exists
        const noPosts = postsContainer.querySelector('.no-posts');
        if (noPosts) {
            noPosts.remove();
        }

        // Remove error message if it exists
        const errorPosts = postsContainer.querySelector('.error-posts');
        if (errorPosts) {
            errorPosts.remove();
        }

        const postElement = this.createPostElement(post);
        
        // Add to beginning or end of container based on parameter
        if (addToBeginning && postsContainer.firstChild) {
            postsContainer.insertBefore(postElement, postsContainer.firstChild);
        } else {
            postsContainer.appendChild(postElement);
        }
        this.setupCommentListeners(post.id);
    }

    updatePostInUI(post) {
        const existingPost = document.querySelector(`[data-post-id="${post.id}"]`);
        if (existingPost) {
            // Verificar se os comentários estavam visíveis antes da atualização
            const commentsSection = existingPost.querySelector('.comments-section');
            const commentBtn = existingPost.querySelector('.comment-btn');
            const wasCommentsVisible = commentsSection && commentsSection.style.display !== 'none';
            
            // Criar novo elemento do post
            const newPostElement = this.createPostElement(post);
            
            // Se os comentários estavam visíveis, restaurar o estado
            if (wasCommentsVisible) {
                const newCommentsSection = newPostElement.querySelector('.comments-section');
                const newCommentBtn = newPostElement.querySelector('.comment-btn');
                const newCommentBtnText = newCommentBtn?.querySelector('span:nth-child(2)');
                
                if (newCommentsSection && newCommentBtn && newCommentBtnText) {
                    newCommentsSection.style.display = 'block';
                    newCommentBtnText.textContent = 'Ocultar Comentários';
                }
            }
            
            // Substituir o elemento antigo pelo novo
            existingPost.replaceWith(newPostElement);
            this.setupCommentListeners(post.id);
        }
    }

    removePostFromUI(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.remove();
        }
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post-item';
        postDiv.setAttribute('data-post-id', post.id);

        const timeAgo = this.getTimeAgo(post.timestamp);
        const isLiked = post.likes && this.currentUser && post.likes[this.currentUser.uid];

        postDiv.innerHTML = `
            <div class="post-header">
<img src="${post.authorPhotoURL}" alt="User Avatar" class="post-avatar" 
     onclick="window.location.href='user-profile.html?userId=${post.authorId}'" 
     style="cursor: pointer;">                <div>
<a href="user-profile.html?userId=${post.authorId}" class="author-link" 
   style="text-decoration: none; color: inherit; font-weight: 600;">
    ${post.authorName}
</a>                    
                    <div class="post-time">${timeAgo}</div>
                </div>
            </div>
            
            ${post.content ? `<div class="post-content">${post.content}</div>` : ''}
            
            ${post.imageUrl ? `
                <div class="post-image-container" >

<img src="${post.imageUrl}" alt="Post Image" class="post-image" onclick="window.location.href='post.html?id=${post.id}'">

                </div>
            ` : ''}
            
            <div class="post-actions-bar">
                <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                    <span class="icon">${isLiked ? '❤️' : '🤍'}</span>
                    <span class="like-text">${isLiked ? 'Curtiu' : 'Curtir'}</span>
                    ${post.likesCount > 0 ? `<span class="like-count">(${post.likesCount})</span>` : ''}
                </button>
                <button class="action-btn comment-btn" data-post-id="${post.id}" onclick="window.location.href = 'post.html?id=${post.id}'">
                    <span class="icon">💬</span>
                    <span>Ver Comentários</span>
                    ${post.commentsCount > 0 ? `<span class="comment-count">(${post.commentsCount})</span>` : ''}
                </button>
                <button class="action-btn share-btn" data-post-id="${post.id}">
                    <span class="icon">📤</span>
                    <span>Compartilhar</span>
                </button>
            </div>
            
             <div class="comments-section" data-post-id="${post.id}" style="display: none;">
                <div class="add-comment-input">
                    <img src="${this.currentUserPhotoURL || this.currentUser?.photoURL || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e'}" alt="Your Avatar" class="comment-avatar">
                    <textarea placeholder="Escreva um comentário..." rows="1" class="comment-input" data-post-id="${post.id}"></textarea>
                    <button class="comment-submit-btn" data-post-id="${post.id}">Enviar</button>
                </div>
                <div class="comments-list" id="comments-${post.id}">
                    <!-- Comentários serão inseridos via listeners em tempo real -->
                </div>
                <div class="comment-post-footer">
                    <button class="comment-post-btn" data-post-id="${post.id}">
                        <span class="icon">💬</span>
                        <span>Comentar publicação</span>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.addPostEventListeners(postDiv, post.id);

        return postDiv;
    }

    renderComments(comments) {
        if (!comments || Object.keys(comments).length === 0) {
            return '';
        }

        return Object.entries(comments)
            .sort(([,a], [,b]) => b.timestamp - a.timestamp)
            .map(([commentId, comment]) => this.createCommentHTML(commentId, comment))
            .join("");
    }

    createCommentHTML(commentId, comment) {
        const timeAgo = this.getTimeAgo(comment.timestamp);
        const likesCount = comment.likesCount || 0;
        const isLiked = comment.likes && this.currentUser && comment.likes[this.currentUser.uid];
        const formattedText = this.formatCommentText(comment.text);
        
        return `
            <div class="comment-item" data-comment-id="${commentId}">
                <div class="comment-main-content">
                    <img src="${comment.authorPhotoURL}" alt="User Avatar" class="comment-avatar">
                    <div class="comment-content-container">
                        <div class="comment-author">${comment.authorName}</div>
                        <div class="comment-text">${formattedText}</div>
                    </div>
                </div>
                <div class="comment-actions">
                    <span class="comment-like-btn ${isLiked ? 'liked' : ''}" data-comment-id="${commentId}">
                        ${isLiked ? 'Curtiu' : 'Curtir'} ${likesCount > 0 ? `(${likesCount})` : ''}
                    </span>
                    <span class="comment-reply-btn" data-comment-id="${commentId}">Responder</span>
                    <span class="comment-time">${timeAgo}</span>
                </div>
                ${comment.replies ? `
                    <div class="sub-comments-list">
                        ${this.renderSubComments(comment.replies)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    createReplyHTML(replyId, reply) {
        const timeAgo = this.getTimeAgo(reply.timestamp);
        const likesCount = reply.likesCount || 0;
        const isLiked = reply.likes && this.currentUser && reply.likes[this.currentUser.uid];
        const formattedText = this.formatCommentText(reply.text);
        
        return `
            <div class="comment-item sub-comment" data-reply-id="${replyId}">
                <div class="comment-main-content">
                    <img src="${reply.authorPhotoURL}" alt="User Avatar" class="comment-avatar">
                    <div class="comment-content-container">
                        <div class="comment-author">${reply.authorName}</div>
                        <div class="comment-text">${formattedText}</div>
                    </div>
                </div>
                <div class="comment-actions">
                    <span class="comment-like-btn ${isLiked ? 'liked' : ''}" data-reply-id="${replyId}">
                        ${isLiked ? 'Curtiu' : 'Curtir'} ${likesCount > 0 ? `(${likesCount})` : ''}
                    </span>
                    <span class="comment-time">${timeAgo}</span>
                </div>
            </div>
        `;
    }

    renderSubComments(replies) {
        return Object.entries(replies)
            .sort(([,a], [,b]) => b.timestamp - a.timestamp)
            .map(([replyId, reply]) => this.createReplyHTML(replyId, reply))
            .join("");
    }

    addPostEventListeners(postElement, postId) {
        // Like button
        const likeBtn = postElement.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.toggleLike(postId));
        }

        // Comment button - removido para usar onclick inline
        // const commentBtn = postElement.querySelector(".comment-btn");
        // if (commentBtn) {
        //     commentBtn.addEventListener("click", () => {
        //         this.toggleCommentsVisibility(postId);
        //     });
        // }

        // Comment input enter key
        const commentInput = postElement.querySelector(".comment-input");
        if (commentInput) {
            commentInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.submitComment(postId);
                }
            });
        }

        // Comment submit button
        const commentSubmitBtn = postElement.querySelector(".comment-submit-btn");
        if (commentSubmitBtn) {
            commentSubmitBtn.addEventListener("click", () => {
                this.submitComment(postId);
            });
        }

        // Share button
        const shareBtn = postElement.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.sharePost(postId));
        }

        // Comment post button (novo botão)
        const commentPostBtn = postElement.querySelector('.comment-post-btn');
        if (commentPostBtn) {
            commentPostBtn.addEventListener('click', () => this.focusCommentInput(postId));
        }
    }

    async toggleLike(postId) {
        if (!this.currentUser) {
            alert('Você precisa estar logado para curtir.');
            return;
        }

        try {
            const postRef = this.postsRef.child(postId);
            const snapshot = await postRef.once('value');
            const post = snapshot.val();

            if (!post) return;

            const likes = post.likes || {};
            const userLiked = likes[this.currentUser.uid];

            if (userLiked) {
                // Remove like
                delete likes[this.currentUser.uid];
            } else {
                // Add like
                likes[this.currentUser.uid] = {
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    userName: this.currentUser.displayName || 'Usuário'
                };
            }

            // Update post
            await postRef.update({
                likes: likes,
                likesCount: Object.keys(likes).length
            });

        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    async submitComment(postId) {
        const commentInput = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
        
        if (!commentInput || !this.currentUser) return;

        const commentText = commentInput.value.trim();
        if (!commentText) return;

        try {
            // Usar a photoURL mais recente disponível
            const currentPhotoURL = this.currentUserPhotoURL || this.currentUser.photoURL || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e';

            const comment = {
                text: commentText,
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || 'Usuário',
                authorPhotoURL: currentPhotoURL,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                likes: {},
                likesCount: 0
            };

            const postRef = this.postsRef.child(postId);
            const commentsRef = postRef.child('comments');
            
            // Add comment
            await commentsRef.push(comment);
            
            // Update comments count
            const snapshot = await commentsRef.once('value');
            const commentsCount = snapshot.numChildren();
            await postRef.update({ commentsCount });

            // Clear input
            commentInput.value = '';

        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    }

    async submitReply(postId, commentId, replyText) {
        if (!this.currentUser || !replyText.trim()) return;

        try {
            // Usar a photoURL mais recente disponível
            const currentPhotoURL = this.currentUserPhotoURL || this.currentUser.photoURL || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e';

            const reply = {
                text: replyText.trim(),
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || 'Usuário',
                authorPhotoURL: currentPhotoURL,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                likes: {},
                likesCount: 0
            };

            const repliesRef = this.postsRef.child(postId).child('comments').child(commentId).child('replies');
            await repliesRef.push(reply);

        } catch (error) {
            console.error('Error submitting reply:', error);
        }
    }

    showReplyInput(postId, commentId) {
        // Remove any existing reply inputs
        const existingReplyInputs = document.querySelectorAll('.reply-input-container');
        existingReplyInputs.forEach(input => input.remove());

        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const replyInputContainer = document.createElement('div');
        replyInputContainer.className = 'reply-input-container';
        replyInputContainer.innerHTML = `
            <div class="add-comment-input" style="margin-left: 40px; margin-top: 5px;">
                <img src="${this.currentUserPhotoURL || this.currentUser?.photoURL || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e'}" alt="Your Avatar" class="comment-avatar">
                <textarea placeholder="Escreva uma resposta..." rows="1" class="reply-input"></textarea>
                <button class="reply-submit-btn">Enviar</button>
                <button class="reply-cancel-btn">Cancelar</button>
            </div>
        `;

        // Inserir a barra de resposta antes dos subcomentários existentes
        const subCommentsList = commentElement.querySelector('.sub-comments-list');
        if (subCommentsList) {
            // Se há subcomentários, inserir antes deles
            commentElement.insertBefore(replyInputContainer, subCommentsList);
        } else {
            // Se não há subcomentários, adicionar no final do comentário
            commentElement.appendChild(replyInputContainer);
        }

        // Add event listeners
        const replyInput = replyInputContainer.querySelector('.reply-input');
        const replySubmitBtn = replyInputContainer.querySelector('.reply-submit-btn');
        const replyCancelBtn = replyInputContainer.querySelector('.reply-cancel-btn');

        replySubmitBtn.addEventListener('click', async () => {
            await this.submitReply(postId, commentId, replyInput.value);
            replyInputContainer.remove();
        });

        replyCancelBtn.addEventListener('click', () => {
            replyInputContainer.remove();
        });

        replyInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                await this.submitReply(postId, commentId, replyInput.value);
                replyInputContainer.remove();
            }
        });

        replyInput.focus();
    }

    async sharePost(postId) {
        try {
            // Gerar URL exclusiva para a publicação na nova página
            const baseUrl = window.location.origin;
            const shareUrl = `${baseUrl}/mindfulness/post.html?id=${postId}`;
            
            // Copiar para a área de transferência
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareUrl);
                this.showShareModal(shareUrl, 'Link copiado para a área de transferência!');
            } else {
                // Fallback para navegadores mais antigos
                this.showShareModal(shareUrl, 'Copie o link abaixo:');
            }
        } catch (error) {
            console.error('Error sharing post:', error);
            alert('Erro ao compartilhar publicação.');
        }
    }

    showShareModal(shareUrl, message) {
        // Criar modal de compartilhamento
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-content">
                <div class="share-modal-header">
                    <h3>Compartilhar Publicação</h3>
                    <button class="share-modal-close">&times;</button>
                </div>
                <div class="share-modal-body">
                    <p>${message}</p>
                    <div class="share-url-container">
                        <input type="text" value="${shareUrl}" readonly class="share-url-input">
                        <button class="copy-url-btn">Copiar</button>
                    </div>
                    <div class="share-options">
                        <button class="share-option-btn" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}', '_blank')">
                            <span class="icon">📘</span> Facebook
                        </button>
                        <button class="share-option-btn" onclick="window.open('https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}', '_blank')">
                            <span class="icon">🐦</span> Twitter
                        </button>
                        <button class="share-option-btn" onclick="window.open('https://wa.me/?text=${encodeURIComponent(shareUrl)}', '_blank')">
                            <span class="icon">💬</span> WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners para o modal
        const closeBtn = modal.querySelector('.share-modal-close');
        const copyBtn = modal.querySelector('.copy-url-btn');
        const urlInput = modal.querySelector('.share-url-input');

        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        copyBtn.addEventListener('click', async () => {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(shareUrl);
                    copyBtn.textContent = 'Copiado!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copiar';
                    }, 2000);
                } else {
                    urlInput.select();
                    document.execCommand('copy');
                    copyBtn.textContent = 'Copiado!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copiar';
                    }, 2000);
                }
            } catch (error) {
                console.error('Error copying to clipboard:', error);
            }
        });

        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Auto-selecionar o texto do input
        urlInput.select();
    }

    // Função para verificar se há um post específico na URL ao carregar a página
    checkForSharedPost() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('post');
        
        if (postId) {
            // Destacar o post específico quando a página carregar
            setTimeout(() => {
                this.highlightSharedPost(postId);
            }, 2000); // Aguardar o carregamento dos posts
        }
    }

    highlightSharedPost(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            // Rolar até o post
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Destacar o post
            postElement.style.border = '3px solid #1877f2';
            postElement.style.boxShadow = '0 0 20px rgba(24, 119, 242, 0.3)';
            
            // Remover o destaque após alguns segundos
            setTimeout(() => {
                postElement.style.border = '';
                postElement.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
            }, 5000);
        }
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
        
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}min`;
        return 'Agora';
    }

    // Progress bar management functions (replicated from profile-picture.js)
    showUploadProgress() {
        this.hideUploadProgress();
        const progressHTML = `
            <div id="uploadProgress" class="upload-progress">
                <h3>Publicando a sua ideia...</h3>
                <div class="upload-progress-bar">
                    <div id="uploadProgressFill" class="upload-progress-fill" style="width: 0%"></div>
                </div>
                <p id="uploadProgressText">0%</p>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", progressHTML);
    }

    updateUploadProgress(progress) {
        const progressFill = document.getElementById("uploadProgressFill");
        const progressText = document.getElementById("uploadProgressText");

        if (progressFill && progressText) {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    hideUploadProgress() {
        const progressElement = document.getElementById("uploadProgress");
        if (progressElement) progressElement.remove();
    }

    // Focus on comment input (nova função)
    focusCommentInput(postId) {
        const commentsSection = document.querySelector(`.comments-section[data-post-id="${postId}"]`);
        const commentInput = commentsSection?.querySelector('.comment-input');
        
        if (commentInput) {
            // Rolar suavemente até o input de comentário
            commentInput.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Dar foco no input após um pequeno delay
            setTimeout(() => {
                commentInput.focus();
                commentInput.select(); // Selecionar qualquer texto existente
            }, 300);
        }
    }

    // Toggle comments visibility
    toggleCommentsVisibility(postId) {
        const commentsSection = document.querySelector(`.comments-section[data-post-id="${postId}"]`);
        const commentBtn = document.querySelector(`.comment-btn[data-post-id="${postId}"]`);
        const commentBtnText = commentBtn?.querySelector('span:nth-child(2)');
        
        if (!commentsSection || !commentBtn || !commentBtnText) return;

        const isVisible = commentsSection.style.display !== 'none';
        
        if (isVisible) {
            // Hide comments
            commentsSection.style.display = 'none';
            commentBtnText.textContent = 'Comentar';
        } else {
            // Show comments and focus on input
            commentsSection.style.display = 'block';
            commentBtnText.textContent = 'Ocultar Comentários';
            const commentInput = commentsSection.querySelector('.comment-input');
            if (commentInput) {
                setTimeout(() => {
                    commentInput.focus();
                }, 100);
            }
        }
    }

    // Lazy loading functions
    setupScrollListener() {
        const socialFeedContainer = document.querySelector('.social-feed-container');
        if (!socialFeedContainer) {
            console.error('Social feed container not found');
            return;
        }

        socialFeedContainer.addEventListener('scroll', () => {
            this.handleScroll(socialFeedContainer);
        });
    }

    handleScroll(container) {
        // Verificar se chegou perto do final do container
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        // Carregar mais posts quando estiver a 200px do final
        const threshold = 200;
        
        if (scrollTop + clientHeight >= scrollHeight - threshold) {
            this.loadMorePosts();
        }
    }

    setupNewPostListener() {
        // Listener apenas para novos posts criados após o carregamento inicial
        this.postsRef.on('child_added', (snapshot) => {
            const post = { id: snapshot.key, ...snapshot.val() };
            
            // Verificar se é um post realmente novo (timestamp mais recente que o último carregado)
            if (this.lastPostKey && snapshot.key > this.lastPostKey) {
                this.addPostToUI(post, true); // Adicionar no início
            }
        });

        // Listener para atualizações de posts existentes
        this.postsRef.on('child_changed', (snapshot) => {
            const post = { id: snapshot.key, ...snapshot.val() };
            this.updatePostInUI(post);
        });

        // Listener para remoção de posts
        this.postsRef.on('child_removed', (snapshot) => {
            this.removePostFromUI(snapshot.key);
        });
    }

    showLoadingMoreMessage() {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;

        // Remove existing loading message
        const existingLoading = postsContainer.querySelector('.loading-more-posts');
        if (existingLoading) {
            existingLoading.remove();
        }

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-more-posts';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Carregando mais publicações...</p>
        `;
        postsContainer.appendChild(loadingDiv);
    }

    hideLoadingMoreMessage() {
        const loadingMore = document.querySelector('.loading-more-posts');
        if (loadingMore) {
            loadingMore.remove();
        }
    }

    showNoMorePostsMessage() {
        const postsContainer = document.getElementById('postsContainer');
        if (!postsContainer) return;

        // Remove existing message
        const existingMessage = postsContainer.querySelector('.no-more-posts');
        if (existingMessage) {
            return; // Já existe a mensagem
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'no-more-posts';
        messageDiv.innerHTML = `
            <p>🎉 Você viu todas as publicações!</p>
        `;
        postsContainer.appendChild(messageDiv);
    }
}

// Initialize Social Feed Manager
window.socialFeedManager = new SocialFeedManager();

