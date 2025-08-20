class SocialFeedManager {
    constructor() {
        this.posts = [];
        this.currentUser = null;
        this.currentUserPhotoURL = null;
        this.postsRef = null;
        this.postsPerPage = 20; // Quantidade de posts a carregar por vez
        this.lastVisiblePostTimestamp = null; // Timestamp do último post carregado para paginação
        this.lastVisiblePostId = null; // ID do último post carregado para paginação
        this.isLoadingPosts = false; // Flag para evitar carregamentos múltiplos
        this.allPostsLoaded = false; // Flag para indicar se todos os posts foram carregados
        this.init();
    }

    init() {
        this.postsRef = firebase.database().ref("socialPosts");
        this.setupEventListeners();
        this.loadCurrentUser();
        this.setupRealtimeListeners();
        this.checkForSharedPost();
        this.setupScrollListener(); // Novo listener de rolagem
    }

    loadCurrentUser() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                this.updateUserProfileInPost();
                this.loadInitialPosts(); // Carrega os primeiros 20 posts
                this.setupProfilePictureListener(user.uid);
            }
        });
    }

    setupProfilePictureListener(userId) {
        const userProfileRef = firebase.database().ref(`users/${userId}/profile/photoURL`);
        userProfileRef.on("value", (snapshot) => {
            const newPhotoURL = snapshot.val();
            if (newPhotoURL && this.currentUser) {
                this.currentUserPhotoURL = newPhotoURL;
                this.updateUserProfileInPost();
                this.updateUserPostsProfilePicture(userId, newPhotoURL);
                this.updateUserCommentsProfilePicture(userId, newPhotoURL);
            }
        });
    }

    updateUserPostsProfilePicture(userId, newPhotoURL) {
        const userPosts = document.querySelectorAll(`[data-post-id]`);
        userPosts.forEach(postElement => {
            const postAvatar = postElement.querySelector(".post-avatar");
            if (postAvatar) {
                const postId = postElement.getAttribute("data-post-id");
                this.updatePostAvatarIfUserOwns(postId, userId, newPhotoURL);
            }
        });
    }

    async updatePostAvatarIfUserOwns(postId, userId, newPhotoURL) {
        try {
            const postRef = this.postsRef.child(postId);
            const snapshot = await postRef.once("value");
            const post = snapshot.val();
            
            if (post && post.authorId === userId) {
                await postRef.update({
                    authorPhotoURL: newPhotoURL
                });
                
                const postElement = document.querySelector(`[data-post-id="${postId}"]`);
                if (postElement) {
                    const postAvatar = postElement.querySelector(".post-avatar");
                    if (postAvatar) {
                        postAvatar.src = newPhotoURL;
                    }
                }
            }
        } catch (error) {
            console.error("Error updating post avatar:", error);
        }
    }

    updateUserCommentsProfilePicture(userId, newPhotoURL) {
        const commentAvatars = document.querySelectorAll(".comment-avatar");
        commentAvatars.forEach((avatar) => {
            const commentElement = avatar.closest(".comment-item");
            if (commentElement) {
                this.updateCommentAvatarIfUserOwns(commentElement, userId, newPhotoURL);
            }
        });
        
        const subComments = document.querySelectorAll(".sub-comment");
        subComments.forEach((subComment) => {
            const avatar = subComment.querySelector(".comment-avatar");
            if (avatar) {
                this.updateCommentAvatarIfUserOwns(subComment, userId, newPhotoURL);
            }
        });
    }

    async updateCommentAvatarIfUserOwns(commentElement, userId, newPhotoURL) {
        try {
            const commentId = commentElement.getAttribute("data-comment-id");
            const replyId = commentElement.getAttribute("data-reply-id");
            const postElement = commentElement.closest("[data-post-id]");
            
            if (!postElement) return;
            
            const postId = postElement.getAttribute("data-post-id");
            
            if (replyId) {
                const parentCommentId = commentElement.closest("[data-comment-id]")?.getAttribute("data-comment-id");
                if (!parentCommentId) {
                    return;
                }
                
                const replyRef = this.postsRef.child(postId).child("comments").child(parentCommentId).child("replies").child(replyId);
                const snapshot = await replyRef.once("value");
                const reply = snapshot.val();
                
                if (reply && reply.authorId === userId) {
                    await replyRef.update({
                        authorPhotoURL: newPhotoURL
                    });
                    
                    const avatar = commentElement.querySelector(".comment-avatar");
                    if (avatar) {
                        avatar.src = newPhotoURL;
                    }
                }
            } else if (commentId) {
                const commentRef = this.postsRef.child(postId).child("comments").child(commentId);
                const snapshot = await commentRef.once("value");
                const comment = snapshot.val();
                
                if (comment && comment.authorId === userId) {
                    await commentRef.update({
                        authorPhotoURL: newPhotoURL
                    });
                    
                    const avatar = commentElement.querySelector(".comment-avatar");
                    if (avatar) {
                        avatar.src = newPhotoURL;
                    }
                }
            }
        } catch (error) {
            console.error("Error updating comment avatar:", error);
        }
    }

    updateUserProfileInPost() {
        const currentUserProfilePic = document.getElementById("currentUserProfilePicPost");
        const postContentInput = document.getElementById("postContentInput");
        
        if (currentUserProfilePic && this.currentUser) {
            const photoURL = this.currentUserPhotoURL || this.currentUser.photoURL || "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";
            currentUserProfilePic.src = photoURL;
        }
        
        if (postContentInput && this.currentUser) {
            const userName = this.currentUser.displayName || "Usuário";
            postContentInput.placeholder = `Você gostaria de dizer algo, ${userName}?`;
        }
    }

    setupEventListeners() {
        const createPostBtn = document.getElementById("createPostBtn");
        if (createPostBtn) {
            createPostBtn.addEventListener("click", () => this.createPost());
        }

        const selectImageBtn = document.getElementById("selectImageBtn");
        const postImageInput = document.getElementById("postImageInput");
        if (selectImageBtn && postImageInput) {
            selectImageBtn.addEventListener("click", () => postImageInput.click());
            postImageInput.addEventListener("change", (e) => this.handleImageSelection(e));
        }

        const removeImageBtn = document.getElementById("removeImageBtn");
        if (removeImageBtn) {
            removeImageBtn.addEventListener("click", () => this.removeSelectedImage());
        }

        const postContentInput = document.getElementById("postContentInput");
        if (postContentInput) {
            postContentInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                    this.createPost();
                }
            });
        }

        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("comment-like-btn") && 
                e.target.dataset.commentId && 
                !e.target.dataset.replyId) {
                e.preventDefault();
                e.stopPropagation();
                const commentId = e.target.dataset.commentId;
                const postElement = e.target.closest("[data-post-id]");
                if (postElement) {
                    const postId = postElement.dataset.postId;
                    this.toggleCommentLike(postId, commentId);
                }
            }
            
            else if (e.target.classList.contains("comment-like-btn") && 
                     e.target.dataset.replyId) {
                e.preventDefault();
                e.stopPropagation();
                const replyId = e.target.dataset.replyId;
                const commentElement = e.target.closest("[data-comment-id]");
                const postElement = e.target.closest("[data-post-id]");
                if (commentElement && postElement) {
                    const commentId = commentElement.dataset.commentId;
                    const postId = postElement.dataset.postId;
                    this.toggleReplyLike(postId, commentId, replyId);
                }
            }
            
            else if (e.target.classList.contains("comment-reply-btn")) {
                e.preventDefault();
                e.stopPropagation();
                const commentId = e.target.dataset.commentId;
                const postElement = e.target.closest("[data-post-id]");
                if (postElement && commentId) {
                    const postId = postElement.dataset.postId;
                    this.showReplyInput(postId, commentId);
                }
            }
        });
    }

    setupRealtimeListeners() {
        this.postsRef.orderByChild("timestamp").limitToLast(1).on("child_added", (snapshot) => {
            const post = { id: snapshot.key, ...snapshot.val() };
            if (!this.posts.some(p => p.id === post.id)) {
                this.addPostToUI(post, true); 
            }
        });

        this.postsRef.on("child_changed", (snapshot) => {
            const post = { id: snapshot.key, ...snapshot.val() };
            this.updatePostInUI(post);
        });

        this.postsRef.on("child_removed", (snapshot) => {
            this.removePostFromUI(snapshot.key);
        });

        this.postsRef.on("value", (snapshot) => {
            if (snapshot.exists()) {
                const posts = snapshot.val();
                Object.keys(posts).forEach(postId => {
                    this.setupCommentListeners(postId);
                });
            }
        });
    }

    setupCommentListeners(postId) {
        const commentsRef = this.postsRef.child(postId).child("comments");
        
        commentsRef.on("child_added", (snapshot) => {
            const comment = { id: snapshot.key, ...snapshot.val() };
            this.addCommentToUI(postId, comment);
            this.setupReplyListeners(postId, snapshot.key);
        });

        commentsRef.on("child_changed", (snapshot) => {
            const comment = { id: snapshot.key, ...snapshot.val() };
            this.updateCommentInUI(postId, comment);
        });

        commentsRef.on("child_removed", (snapshot) => {
            this.removeCommentFromUI(postId, snapshot.key);
        });
    }

    setupReplyListeners(postId, commentId) {
        const repliesRef = this.postsRef.child(postId).child("comments").child(commentId).child("replies");
        
        repliesRef.on("child_added", (snapshot) => {
            const reply = { id: snapshot.key, ...snapshot.val() };
            this.addReplyToUI(postId, commentId, reply);
        });

        repliesRef.on("child_changed", (snapshot) => {
            const reply = { id: snapshot.key, ...snapshot.val() };
            this.updateReplyInUI(postId, commentId, reply);
        });

        repliesRef.on("child_removed", (snapshot) => {
            this.removeReplyFromUI(postId, commentId, snapshot.key);
        });
    }

    addCommentToUI(postId, comment) {
        const commentsContainer = document.getElementById(`comments-${postId}`);
        if (!commentsContainer) return;

        const existingComment = commentsContainer.querySelector(`[data-comment-id="${comment.id}"]`);
        if (existingComment) return;

        const commentElementWrapper = document.createElement("div");
        commentElementWrapper.innerHTML = this.createCommentHTML(comment.id, comment);
        const commentElement = commentElementWrapper.firstElementChild;

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
            const newCommentElement = document.createElement("div");
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
        
        if (!subCommentsContainer) {
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentElement) {
                subCommentsContainer = document.createElement("div");
                subCommentsContainer.className = "sub-comments-list";
                commentElement.appendChild(subCommentsContainer);
            }
        }

        if (subCommentsContainer) {
            const existingReply = subCommentsContainer.querySelector(`[data-reply-id="${reply.id}"]`);
            if (existingReply) return;

            const replyElement = document.createElement("div");
            replyElement.innerHTML = this.createReplyHTML(reply.id, reply);
            const newReplyElement = replyElement.firstElementChild;

            subCommentsContainer.appendChild(newReplyElement);
        }
    }

    updateReplyInUI(postId, commentId, reply) {
        const replyElement = document.querySelector(`[data-reply-id="${reply.id}"]`);
        if (replyElement) {
            const newReplyElement = document.createElement("div");
            newReplyElement.innerHTML = this.createReplyHTML(reply.id, reply);
            const newElement = newReplyElement.firstElementChild;
            
            replyElement.replaceWith(newElement);
        }
    }

    removeReplyFromUI(postId, commentId, replyId) {
        const replyElement = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (replyElement) {
            replyElement.remove();
            
            const subCommentsContainer = document.querySelector(`[data-comment-id="${commentId}"] .sub-comments-list`);
            if (subCommentsContainer && subCommentsContainer.children.length === 0) {
                subCommentsContainer.remove();
            }
        }
    }

    async toggleCommentLike(postId, commentId) {
        if (!this.currentUser) {
            alert("Você precisa estar logado para curtir.");
            return;
        }

        try {
            const commentRef = this.postsRef.child(postId).child("comments").child(commentId);
            const snapshot = await commentRef.once("value");
            const comment = snapshot.val();

            if (!comment) return;

            const likes = comment.likes || {};
            const userLiked = likes[this.currentUser.uid];

            if (userLiked) {
                delete likes[this.currentUser.uid];
            } else {
                likes[this.currentUser.uid] = {
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    userName: this.currentUser.displayName || "Usuário"
                };
            }

            await commentRef.update({
                likes: likes,
                likesCount: Object.keys(likes).length
            });

            this.updateCommentLikeUI(commentId, likes, userLiked);

        } catch (error) {
            console.error("Error toggling comment like:", error);
        }
    }

    async toggleReplyLike(postId, commentId, replyId) {
        if (!this.currentUser) {
            alert("Você precisa estar logado para curtir.");
            return;
        }

        try {
            const replyRef = this.postsRef.child(postId).child("comments").child(commentId).child("replies").child(replyId);
            const snapshot = await replyRef.once("value");
            const reply = snapshot.val();

            if (!reply) return;

            const likes = reply.likes || {};
            const userLiked = likes[this.currentUser.uid];

            if (userLiked) {
                delete likes[this.currentUser.uid];
            } else {
                likes[this.currentUser.uid] = {
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    userName: this.currentUser.displayName || "Usuário"
                };
            }

            await replyRef.update({
                likes: likes,
                likesCount: Object.keys(likes).length
            });

            this.updateReplyLikeUI(replyId, likes, userLiked);

        } catch (error) {
            console.error("Error toggling reply like:", error);
        }
    }

    updateCommentLikeUI(commentId, likes, wasLiked) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const likeBtn = commentElement.querySelector(".comment-like-btn");
        if (!likeBtn) return;

        const likesCount = Object.keys(likes).length;
        const isLiked = !wasLiked;

        if (isLiked) {
            likeBtn.textContent = `Curtiu ${likesCount > 0 ? `(${likesCount})` : ""}`;
            likeBtn.classList.add("liked");
        } else {
            likeBtn.textContent = `Curtir ${likesCount > 0 ? `(${likesCount})` : ""}`;
            likeBtn.classList.remove("liked");
        }
    }

    updateReplyLikeUI(replyId, likes, wasLiked) {
        const replyElement = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (!replyElement) return;

        const likeBtn = replyElement.querySelector(".comment-like-btn");
        if (!likeBtn) return;

        const likesCount = Object.keys(likes).length;
        const isLiked = !wasLiked;

        if (isLiked) {
            likeBtn.textContent = `Curtiu ${likesCount > 0 ? `(${likesCount})` : ""}`;
            likeBtn.classList.add("liked");
        } else {
            likeBtn.textContent = `Curtir ${likesCount > 0 ? `(${likesCount})` : ""}`;
            likeBtn.classList.remove("liked");
        }
    }

    updateCommentCount(postId) {
        const commentBtn = document.querySelector(`[data-post-id="${postId}"].comment-btn`);
        if (commentBtn) {
            const commentsContainer = document.getElementById(`comments-${postId}`);
            const commentCount = commentsContainer ? commentsContainer.children.length : 0;
            
            const commentCountSpan = commentBtn.querySelector(".comment-count");
            if (commentCount > 0) {
                if (commentCountSpan) {
                    commentCountSpan.textContent = `(${commentCount})`;
                } else {
                    const newCountSpan = document.createElement("span");
                    newCountSpan.className = "comment-count";
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
                const imagePreview = document.getElementById("imagePreview");
                const imagePreviewContainer = document.getElementById("imagePreviewContainer");
                
                if (imagePreview && imagePreviewContainer) {
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.style.display = "block";
                }
            };
            reader.readAsDataURL(file);
        }
    }

    removeSelectedImage() {
        const imagePreviewContainer = document.getElementById("imagePreviewContainer");
        const postImageInput = document.getElementById("postImageInput");
        
        if (imagePreviewContainer) {
            imagePreviewContainer.style.display = "none";
        }
        if (postImageInput) {
            postImageInput.value = "";
        }
    }

    async createPost() {
        const postContentInput = document.getElementById("postContentInput");
        const postImageInput = document.getElementById("postImageInput");
        const createPostBtn = document.getElementById("createPostBtn");
        
        this.showUploadProgress();
        this.updateUploadProgress(0);
        
        createPostBtn.disabled = true;
        createPostBtn.textContent = "Publicando...";
        
        if (!this.currentUser) {
            this.hideUploadProgress();
            createPostBtn.disabled = false;
            createPostBtn.textContent = "Publicar";
            alert("Você precisa estar logado para publicar.");
            return;
        }

        const content = postContentInput.value.trim();
        const imageFile = postImageInput.files[0];

        if (!content && !imageFile) {
            this.hideUploadProgress();
            createPostBtn.disabled = false;
            createPostBtn.textContent = "Publicar";
            alert("Adicione algum conteúdo ou imagem para publicar.");
            return;
        }

        try {
            let imageUrl = null;
            
            if (imageFile) {
                this.updateUploadProgress(10);
                
                const storageRef = firebase.storage().ref();
                const imageRef = storageRef.child(`social-posts/${Date.now()}_${imageFile.name}`);
                
                const uploadTask = imageRef.put(imageFile);
                
                await new Promise((resolve, reject) => {
                    uploadTask.on("state_changed",
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            const adjustedProgress = 10 + (progress * 0.6);
                            this.updateUploadProgress(adjustedProgress);
                        },
                        (error) => {
                            console.error("Upload error:", error);
                            reject(error);
                        },
                        async () => {
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

            this.updateUploadProgress(85);
            
            const currentPhotoURL = this.currentUserPhotoURL || this.currentUser.photoURL || "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";

            const post = {
                content: content,
                imageUrl: imageUrl,
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || "Usuário",
                authorPhotoURL: currentPhotoURL,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                likes: {},
                likesCount: 0,
                comments: {},
                commentsCount: 0
            };

            await this.postsRef.push(post);
            
            this.updateUploadProgress(100);

            setTimeout(() => {
                postContentInput.value = "";
                this.removeSelectedImage();
                this.hideUploadProgress();
                
                createPostBtn.disabled = false;
                createPostBtn.textContent = "Publicar";
            }, 1500);

            console.log("Post created successfully");
        } catch (error) {
            console.error("Error creating post:", error);
            this.hideUploadProgress();
            createPostBtn.disabled = false;
            createPostBtn.textContent = "Publicar";
            alert("Erro ao criar publicação. Tente novamente.");
        }
    }

    loadInitialPosts() {
        const postsContainer = document.getElementById("postsContainer");
        if (postsContainer) {
            postsContainer.innerHTML = `
                <div class="loading-posts" id="initialLoadingSpinner">
                    <div class="loading-spinner"></div>
                    <p>Carregando publicações...</p>
                </div>
            `;
        }
        this.posts = []; 
        this.lastVisiblePostTimestamp = null; 
        this.lastVisiblePostId = null;
        this.allPostsLoaded = false;
        this.loadMorePosts();
    }

    async loadMorePosts() {
        if (this.isLoadingPosts || this.allPostsLoaded) {
            return;
        }
        this.isLoadingPosts = true;

        const postsContainer = document.getElementById("postsContainer");
        let loadingIndicator = document.getElementById("lazyLoadingSpinner");
        if (!loadingIndicator) {
            postsContainer.insertAdjacentHTML("beforeend", `
                <div class="loading-posts" id="lazyLoadingSpinner">
                    <div class="loading-spinner"></div>
                    <p>Carregando mais publicações...</p>
                </div>
            `);
            loadingIndicator = document.getElementById("lazyLoadingSpinner");
        }

        let query = this.postsRef.orderByChild("timestamp");

        if (this.lastVisiblePostTimestamp) {
            // Para paginação, usamos startAt com o timestamp do último post
            // e o id para desempate, e limitamos ao número de posts + 1 para verificar se há mais.
            query = query.startAt(this.lastVisiblePostTimestamp, this.lastVisiblePostId);
        }

        query = query.limitToFirst(this.postsPerPage + 1); 

        try {
            const snapshot = await query.once("value");
            let newPosts = [];
            snapshot.forEach(childSnapshot => {
                newPosts.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });

            // Remove o post que já foi carregado na iteração anterior (se houver)
            if (this.lastVisiblePostTimestamp && newPosts.length > 0 && newPosts[0].id === this.lastVisiblePostId) {
                newPosts.shift(); 
            }

            if (newPosts.length > 0) {
                // Se o número de posts retornados for menor ou igual ao solicitado (postsPerPage), significa que não há mais posts.
                if (newPosts.length <= this.postsPerPage) {
                    this.allPostsLoaded = true;
                }
                
                // Atualiza o timestamp e ID do último post visível para a próxima paginação
                this.lastVisiblePostTimestamp = newPosts[newPosts.length - 1].timestamp;
                this.lastVisiblePostId = newPosts[newPosts.length - 1].id;

                // Adiciona os novos posts à UI
                newPosts.forEach(post => this.addPostToUI(post, false)); 
            } else {
                this.allPostsLoaded = true;
                console.log("Todos os posts foram carregados.");
            }
        } catch (error) {
            console.error("Erro ao carregar posts:", error);
        } finally {
            this.isLoadingPosts = false;
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            const initialLoadingSpinner = document.getElementById("initialLoadingSpinner");
            if (initialLoadingSpinner) {
                initialLoadingSpinner.remove();
            }
        }
    }

    setupScrollListener() {
        const socialFeedContainer = document.querySelector(".social-feed-container");
        if (socialFeedContainer) {
            socialFeedContainer.addEventListener("scroll", () => {
                const { scrollTop, scrollHeight, clientHeight } = socialFeedContainer;
                if (scrollTop + clientHeight >= scrollHeight - 100 && !this.isLoadingPosts && !this.allPostsLoaded) {
                    this.loadMorePosts();
                }
            });
        }
    }

    addPostToUI(post, prepend = false) {
        const postsContainer = document.getElementById("postsContainer");
        if (!postsContainer) return;

        const loadingPosts = postsContainer.querySelector(".loading-posts");
        if (loadingPosts) {
            loadingPosts.remove();
        }

        const postElement = this.createPostElement(post);
        
        if (prepend) {
            postsContainer.insertBefore(postElement, postsContainer.firstChild);
        } else {
            postsContainer.appendChild(postElement);
        }
        this.posts.push(post); 
    }

    updatePostInUI(post) {
        const existingPost = document.querySelector(`[data-post-id="${post.id}"]`);
        if (existingPost) {
            const newPostElement = this.createPostElement(post);
            existingPost.replaceWith(newPostElement);
        }
    }

    removePostFromUI(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.remove();
            this.posts = this.posts.filter(p => p.id !== postId); 
        }
    }

    createPostElement(post) {
        const postDiv = document.createElement("div");
        postDiv.className = "post-item";
        postDiv.setAttribute("data-post-id", post.id);

        const timeAgo = this.getTimeAgo(post.timestamp);
        const isLiked = post.likes && this.currentUser && post.likes[this.currentUser.uid];

        postDiv.innerHTML = `
            <div class="post-header">
                <img src="${post.authorPhotoURL}" alt="User Avatar" class="post-avatar">
                <div>
                    <div class="post-author">${post.authorName}</div>
                    <div class="post-time">${timeAgo}</div>
                </div>
            </div>
            
            ${post.content ? `<div class="post-content">${post.content}</div>` : ""}
            
            ${post.imageUrl ? `
                <div class="post-image-container">
                    <img src="${post.imageUrl}" alt="Post Image" class="post-image">
                </div>
            ` : ""}
            
            <div class="post-actions-bar">
                <button class="action-btn like-btn ${isLiked ? "liked" : ""}" data-post-id="${post.id}">
                    <span class="icon">${isLiked ? "❤️" : "🤍"}</span>
                    <span class="like-text">${isLiked ? "Curtiu" : "Curtir"}</span>
                    ${post.likesCount > 0 ? `<span class="like-count">(${post.likesCount})</span>` : ""}
                </button>
                <button class="action-btn comment-btn" data-post-id="${post.id}">
                    <span class="icon">💬</span>
                    <span>Comentar</span>
                    ${post.commentsCount > 0 ? `<span class="comment-count">(${post.commentsCount})</span>` : ""}
                </button>
                <button class="action-btn share-btn" data-post-id="${post.id}">
                    <span class="icon">📤</span>
                    <span>Compartilhar</span>
                </button>
            </div>
            
            <div class="comments-section" data-post-id="${post.id}">
                <div class="comments-list" id="comments-${post.id}">
                    <!-- Comentários serão inseridos via listeners em tempo real -->
                </div>

                <div class="add-comment-input">
                    <img src="${this.currentUserPhotoURL || this.currentUser?.photoURL || "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e"}" alt="Your Avatar" class="comment-avatar">
                    <textarea placeholder="Escreva um comentário..." rows="1" class="comment-input" data-post-id="${post.id}"></textarea>
                    <button class="comment-submit-btn" data-post-id="${post.id}">Enviar</button>
                </div>
            </div>
        `;

        this.addPostEventListeners(postDiv, post.id);

        return postDiv;
    }

    renderComments(comments) {
        if (!comments || Object.keys(comments).length === 0) {
            return "";
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
        
        return `
            <div class="comment-item" data-comment-id="${commentId}">
                <div class="comment-main-content">
                    <img src="${comment.authorPhotoURL}" alt="User Avatar" class="comment-avatar">
                    <div class="comment-content-container">
                        <div class="comment-author">${comment.authorName}</div>
                        <div class="comment-text">${comment.text}</div>
                    </div>
                </div>
                <div class="comment-actions">
                    <span class="comment-like-btn ${isLiked ? "liked" : ""}" data-comment-id="${commentId}">
                        ${isLiked ? "Curtiu" : "Curtir"} ${likesCount > 0 ? `(${likesCount})` : ""}
                    </span>
                    <span class="comment-reply-btn" data-comment-id="${commentId}">Responder</span>
                    <span class="comment-time">${timeAgo}</span>
                </div>
                ${comment.replies ? `
                    <div class="sub-comments-list">
                        ${this.renderSubComments(comment.replies)}
                    </div>
                ` : ""}
            </div>
        `;
    }

    createReplyHTML(replyId, reply) {
        const timeAgo = this.getTimeAgo(reply.timestamp);
        const likesCount = reply.likesCount || 0;
        const isLiked = reply.likes && this.currentUser && reply.likes[this.currentUser.uid];
        
        return `
            <div class="comment-item sub-comment" data-reply-id="${replyId}">
                <div class="comment-main-content">
                    <img src="${reply.authorPhotoURL}" alt="User Avatar" class="comment-avatar">
                    <div class="comment-content-container">
                        <div class="comment-author">${reply.authorName}</div>
                        <div class="comment-text">${reply.text}</div>
                    </div>
                </div>
                <div class="comment-actions">
                    <span class="comment-like-btn ${isLiked ? "liked" : ""}" data-reply-id="${replyId}">
                        ${isLiked ? "Curtiu" : "Curtir"} ${likesCount > 0 ? `(${likesCount})` : ""}
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
        const likeBtn = postElement.querySelector(".like-btn");
        if (likeBtn) {
            likeBtn.addEventListener("click", () => this.toggleLike(postId));
        }

        const commentBtn = postElement.querySelector(".comment-btn");
        if (commentBtn) {
            commentBtn.addEventListener("click", () => {
                const commentInput = postElement.querySelector(".comment-input");
                if (commentInput) {
                    commentInput.focus();
                }
            });
        }

        const commentInput = postElement.querySelector(".comment-input");
        if (commentInput) {
            commentInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.submitComment(postId);
                }
            });
        }

        const commentSubmitBtn = postElement.querySelector(".comment-submit-btn");
        if (commentSubmitBtn) {
            commentSubmitBtn.addEventListener("click", () => {
                this.submitComment(postId);
            });
        }

        const shareBtn = postElement.querySelector(".share-btn");
        if (shareBtn) {
            shareBtn.addEventListener("click", () => this.sharePost(postId));
        }
    }

    async toggleLike(postId) {
        if (!this.currentUser) {
            alert("Você precisa estar logado para curtir.");
            return;
        }

        try {
            const postRef = this.postsRef.child(postId);
            const snapshot = await postRef.once("value");
            const post = snapshot.val();

            if (!post) return;

            const likes = post.likes || {};
            const userLiked = likes[this.currentUser.uid];

            if (userLiked) {
                delete likes[this.currentUser.uid];
            } else {
                likes[this.currentUser.uid] = {
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    userName: this.currentUser.displayName || "Usuário"
                };
            }

            await postRef.update({
                likes: likes,
                likesCount: Object.keys(likes).length
            });

        } catch (error) {
            console.error("Error toggling like:", error);
        }
    }

    async submitComment(postId) {
        const commentInput = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
        
        if (!commentInput || !this.currentUser) return;

        const commentText = commentInput.value.trim();
        if (!commentText) return;

        try {
            const currentPhotoURL = this.currentUserPhotoURL || this.currentUser.photoURL || "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";

            const comment = {
                text: commentText,
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || "Usuário",
                authorPhotoURL: currentPhotoURL,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                likes: {},
                likesCount: 0
            };

            const postRef = this.postsRef.child(postId);
            const commentsRef = postRef.child("comments");
            
            await commentsRef.push(comment);
            
            const snapshot = await commentsRef.once("value");
            const commentsCount = snapshot.numChildren();
            await postRef.update({ commentsCount });

            commentInput.value = "";

        } catch (error) {
            console.error("Error submitting comment:", error);
        }
    }

    async submitReply(postId, commentId, replyText) {
        if (!this.currentUser || !replyText.trim()) return;

        try {
            const currentPhotoURL = this.currentUserPhotoURL || this.currentUser.photoURL || "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";

            const reply = {
                text: replyText.trim(),
                authorId: this.currentUser.uid,
                authorName: this.currentUser.displayName || "Usuário",
                authorPhotoURL: currentPhotoURL,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                likes: {},
                likesCount: 0
            };

            const repliesRef = this.postsRef.child(postId).child("comments").child(commentId).child("replies");
            await repliesRef.push(reply);

        } catch (error) {
            console.error("Error submitting reply:", error);
        }
    }

    showReplyInput(postId, commentId) {
        const existingReplyInputs = document.querySelectorAll(".reply-input-container");
        existingReplyInputs.forEach(input => input.remove());

        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const replyInputContainer = document.createElement("div");
        replyInputContainer.className = "reply-input-container";
        replyInputContainer.innerHTML = `
            <div class="add-comment-input" style="margin-left: 40px; margin-top: 5px;">
                <img src="${this.currentUserPhotoURL || this.currentUser?.photoURL || "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e"}" alt="Your Avatar" class="comment-avatar">
                <textarea placeholder="Escreva uma resposta..." rows="1" class="reply-input"></textarea>
                <button class="reply-submit-btn">Enviar</button>
                <button class="reply-cancel-btn">Cancelar</button>
            </div>
        `;

        commentElement.appendChild(replyInputContainer);

        const replyInput = replyInputContainer.querySelector(".reply-input");
        const replySubmitBtn = replyInputContainer.querySelector(".reply-submit-btn");
        const replyCancelBtn = replyInputContainer.querySelector(".reply-cancel-btn");

        replySubmitBtn.addEventListener("click", async () => {
            await this.submitReply(postId, commentId, replyInput.value);
            replyInputContainer.remove();
        });

        replyCancelBtn.addEventListener("click", () => {
            replyInputContainer.remove();
        });

        replyInput.addEventListener("keydown", async (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                await this.submitReply(postId, commentId, replyInput.value);
                replyInputContainer.remove();
            }
        });

        replyInput.focus();
    }

    async sharePost(postId) {
        try {
            const baseUrl = window.location.origin + window.location.pathname;
            const shareUrl = `${baseUrl}?post=${postId}`;
            
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareUrl);
                this.showShareModal(shareUrl, "Link copiado para a área de transferência!");
            } else {
                this.showShareModal(shareUrl, "Copie o link abaixo:");
            }
        } catch (error) {
            console.error("Error sharing post:", error);
            alert("Erro ao compartilhar publicação.");
        }
    }

    showShareModal(shareUrl, message) {
        const modal = document.createElement("div");
        modal.className = "share-modal";
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
                        <button class="share-option-btn" onclick="window.open(\'https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}\', \'_blank\')">
                            <span class="icon">📘</span> Facebook
                        </button>
                        <button class="share-option-btn" onclick="window.open(\'https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}\', \'_blank\')">
                            <span class="icon">🐦</span> Twitter
                        </button>
                        <button class="share-option-btn" onclick="window.open(\'https://wa.me/?text=${encodeURIComponent(shareUrl)}\', \'_blank\')">
                            <span class="icon">💬</span> WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector(".share-modal-close");
        const copyBtn = modal.querySelector(".copy-url-btn");
        const urlInput = modal.querySelector(".share-url-input");

        closeBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
        });

        copyBtn.addEventListener("click", async () => {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(shareUrl);
                    copyBtn.textContent = "Copiado!";
                    setTimeout(() => {
                        copyBtn.textContent = "Copiar";
                    }, 2000);
                } else {
                    urlInput.select();
                    document.execCommand("copy");
                    copyBtn.textContent = "Copiado!";
                    setTimeout(() => {
                        copyBtn.textContent = "Copiar";
                    }, 2000);
                }
            } catch (error) {
                console.error("Error copying to clipboard:", error);
            }
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        urlInput.select();
    }

    checkForSharedPost() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get("post");
        
        if (postId) {
            setTimeout(() => {
                this.highlightSharedPost(postId);
            }, 2000);
        }
    }

    highlightSharedPost(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.scrollIntoView({ behavior: "smooth", block: "center" });
            
            postElement.style.border = "3px solid #1877f2";
            postElement.style.boxShadow = "0 0 20px rgba(24, 119, 242, 0.3)";
            
            setTimeout(() => {
                postElement.style.border = "";
                postElement.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.1)";
            }, 5000);
        }
    }

    getTimeAgo(timestamp) {
        if (!timestamp) return "Agora";
        
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}min`;
        return "Agora";
    }

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
}

window.socialFeedManager = new SocialFeedManager();








