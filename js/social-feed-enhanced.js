// Social Feed Enhanced - Integração com Rich Text Editor
// Este arquivo estende o SocialFeedManager original para trabalhar com o editor de texto rico

// Aguarda o carregamento do DOM e do SocialFeedManager original
document.addEventListener("DOMContentLoaded", () => {
    // Aguarda um pouco para garantir que o SocialFeedManager original foi carregado
    setTimeout(() => {
        initializeRichTextIntegration();
    }, 100);
});

function initializeRichTextIntegration() {
    // Verifica se o SocialFeedManager existe
    if (typeof window.socialFeedManager === 'undefined') {
        console.log('SocialFeedManager não encontrado, tentando novamente...');
        setTimeout(initializeRichTextIntegration, 500);
        return;
    }

    const socialFeedManager = window.socialFeedManager;
    const postCaptionEditor = document.getElementById("post-caption-editor");
    const createPostBtn = document.getElementById("createPostBtn");
    let postContentInput = document.getElementById("postContentInput"); // Referência ao textarea original

    // Se o editor de texto rico existe, integra com o sistema original
    if (postCaptionEditor && createPostBtn) {
        console.log('Integrando editor de texto rico com SocialFeedManager...');
        
        // Cria o elemento postContentInput se não existir (garantia)
        if (!postContentInput) {
            postContentInput = document.createElement('textarea');
            postContentInput.id = 'postContentInput';
            postContentInput.style.display = 'none'; // Esconde o textarea
            document.body.appendChild(postContentInput);
            console.log('Elemento postContentInput criado (hidden).');
        }

        // Substitui a função original de criação de posts
        const originalCreatePost = socialFeedManager.createPost;
        
        socialFeedManager.createPost = function() {
            const richContent = postCaptionEditor.innerHTML.trim();
            const plainContent = postCaptionEditor.textContent.trim();
            
            if (plainContent === 'br') {
                window.showModal('Erro', 'Por favor, digite algo para publicar.');
                return;
            }

            // Atribui o conteúdo HTML do editor rico ao textarea original
            postContentInput.value = richContent;

            // Chama a função original de criação de posts (que agora lerá de postContentInput.value)
            originalCreatePost.call(this);
            
            // Limpa o editor após a publicação
            postCaptionEditor.innerHTML = '';
            postContentInput.value = ''; // Limpa também o textarea oculto
        };

        // Sincroniza o editor rico com o input original quando necessário (para garantir que o valor esteja sempre atualizado)
        postCaptionEditor.addEventListener('input', () => {
            postContentInput.value = postCaptionEditor.innerHTML;
        });

        console.log('Integração do editor de texto rico concluída.');
    }

    // Melhora a renderização de posts para suportar conteúdo HTML rico
    const originalRenderPost = socialFeedManager.renderPost;
    if (originalRenderPost) {
        socialFeedManager.renderPost = function(post, container) {
            // Chama a função original
            const result = originalRenderPost.call(this, post, container);
            
            // Processa links no conteúdo dos posts após renderização
            setTimeout(() => {
                processLinksInPosts();
            }, 100);
            
            return result;
        };
    }
}

// Função para processar links em posts existentes
function processLinksInPosts() {
    const postContents = document.querySelectorAll('.post-content');
    postContents.forEach(content => {
        // Processa apenas se ainda não foi processado
        if (!content.dataset.linksProcessed) {
            const html = content.innerHTML;
            const urlRegex = /(https?:\/\/[^\s<"']+)/gi;
            
            // Verifica se há URLs que não estão em tags <a>
            const hasUnprocessedUrls = urlRegex.test(html) && !html.includes('class="link-button"');
            
            if (hasUnprocessedUrls) {
                const newHtml = html.replace(urlRegex, (url) => {
                    // Verifica se a URL já está em uma tag <a>
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const existingLinks = tempDiv.querySelectorAll('a');
                    let isAlreadyLink = false;
                    existingLinks.forEach(link => {
                        if (link.href === url || link.textContent === url) {
                            isAlreadyLink = true;
                        }
                    });

                    if (!isAlreadyLink) {
                        return `<a href="${url}" target="_blank" class="link-button"><p class="link-p">${url}</p></a>`;
                    }
                    return url;
                });
                
                content.innerHTML = newHtml;
            }
            
            content.dataset.linksProcessed = 'true';
        }
    });
}

// Observa mudanças no container de posts para processar novos posts
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Processa links nos novos posts adicionados
            setTimeout(() => {
                processLinksInPosts();
            }, 100);
        }
    });
});

// Inicia a observação quando o container de posts estiver disponível
document.addEventListener("DOMContentLoaded", () => {
    const postsContainer = document.getElementById("postsContainer");
    if (postsContainer) {
        observer.observe(postsContainer, {
            childList: true,
            subtree: true
        });
    }
});


