// Profile Picture Manager - Handles profile picture upload and display
class ProfilePictureManager {
    constructor() {
        this.storage = window.firebaseServices.storage;
        this.database = window.firebaseServices.database;
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserProfilePicture();
    }

    setupEventListeners() {
        const changeBtn = document.getElementById('changeProfilePictureBtn');
        const fileInput = document.getElementById('profilePictureInput');

        if (changeBtn && fileInput) {
            changeBtn.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.uploadProfilePicture(file);
            });
        }

        //const userAvatar = document.getElementById('userProfilePic');
        //if (userAvatar && fileInput) {
           // userAvatar.addEventListener('click', () => fileInput.click());
      //  }
    }

    async uploadProfilePicture(file) {
        const user = window.authManager.getCurrentUser();
        if (!user) {
            window.uiManager.showModal("Erro", "Usuário não autenticado.");
            return;
        }

        if (!this.validateFile(file)) return;

        try {
            this.showUploadProgress();

            const storageRef = this.storage.ref(`profile-pictures/${user.uid}/${Date.now()}_${file.name}`);
            const uploadTask = storageRef.put(file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    this.updateUploadProgress(progress);
                },
                (error) => {
                    console.error('Upload error:', error);
                    this.hideUploadProgress();
                    window.uiManager.showModal("Erro", "Erro ao fazer upload da imagem. Tente novamente.");
                },
                async () => {
                    try {
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        await this.updateUserProfilePicture(user.uid, downloadURL);
                        this.updateProfilePictureDisplay(downloadURL);
                        this.hideUploadProgress();
                        window.uiManager.showModal("Sucesso", "Foto de perfil atualizada com sucesso!", "success");

                        // ✅ Recarregar após alteração da imagem de perfil
                        if (window.authManager && typeof window.authManager.reloadApp === 'function') {
                            window.authManager.reloadApp();
                        }
                    } catch (error) {
                        console.error('Error getting download URL:', error);
                        this.hideUploadProgress();
                        window.uiManager.showModal("Erro", "Erro ao processar a imagem. Tente novamente.");
                    }
                }
            );

        } catch (error) {
            console.error('Error uploading profile picture:', error);
            this.hideUploadProgress();
            window.uiManager.showModal("Erro", "Erro ao fazer upload da imagem.");
        }
    }

    validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            window.uiManager.showModal("Erro", "Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WebP.");
            return false;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            window.uiManager.showModal("Erro", "Arquivo muito grande. O tamanho máximo é 5MB.");
            return false;
        }

        return true;
    }

    async updateUserProfilePicture(userId, photoURL) {
        try {
            await this.database.ref(`users/${userId}/profile`).update({
                photoURL: photoURL,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });

            const user = window.firebaseServices.auth.currentUser;
            if (user) {
                await user.updateProfile({ photoURL });
            }
        } catch (error) {
            console.error('Error updating user profile picture:', error);
            throw error;
        }
    }

    updateProfilePictureDisplay(photoURL) {
        const elements = [
            document.getElementById('userProfilePic'),
            document.getElementById('profilePictureDisplay')
        ];

        elements.forEach(element => {
            if (element) element.src = photoURL;
        });
    }

    async loadUserProfilePicture() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            this.database.ref(`users/${user.uid}/profile/photoURL`).on('value', (snapshot) => {
                let photoURL = snapshot.val();

                if (!photoURL && user.photoURL) {
                    photoURL = user.photoURL;
                    this.updateUserProfilePicture(user.uid, photoURL);
                }

                if (photoURL) {
                    this.updateProfilePictureDisplay(photoURL);
                } else {
                    const defaultURL = "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";
                    this.updateProfilePictureDisplay(defaultURL);
                }
            });
        } catch (error) {
            console.error('Error loading user profile picture:', error);
        }
    }

    showUploadProgress() {
        this.hideUploadProgress();
        const progressHTML = `
            <div id="uploadProgress" class="upload-progress">
                <h3>Alterando foto de perfil...</h3>
                <div class="upload-progress-bar">
                    <div id="uploadProgressFill" class="upload-progress-fill" style="width: 0%"></div>
                </div>
                <p id="uploadProgressText">0%</p>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', progressHTML);
    }

    updateUploadProgress(progress) {
        const progressFill = document.getElementById('uploadProgressFill');
        const progressText = document.getElementById('uploadProgressText');

        if (progressFill && progressText) {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    hideUploadProgress() {
        const progressElement = document.getElementById('uploadProgress');
        if (progressElement) progressElement.remove();
    }

    async getUserProfilePictureURL(userId) {
        try {
            const snapshot = await this.database.ref(`users/${userId}/profile/photoURL`).once('value');
            return snapshot.val() || null;
        } catch (error) {
            console.error('Error getting user profile picture URL:', error);
            return null;
        }
    }

    async deleteProfilePicture() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            await this.database.ref(`users/${user.uid}/profile/photoURL`).remove();
            await user.updateProfile({ photoURL: null });

            const defaultURL = "https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e";
            this.updateProfilePictureDisplay(defaultURL);

            window.uiManager.showModal("Sucesso", "Foto de perfil removida com sucesso!", "success");
        } catch (error) {
            console.error("Error deleting profile picture:", error);
            window.uiManager.showModal("Erro", "Erro ao remover foto de perfil.");
        }
    }

    cleanup() {
        const user = window.authManager.getCurrentUser();
        if (user) {
            this.database.ref(`users/${user.uid}/profile/photoURL`).off();
        }
    }

    reinitialize() {
        this.cleanup();
        this.loadUserProfilePicture();
    }
}

// Initialize Profile Picture Manager
window.profilePictureManager = new ProfilePictureManager();
