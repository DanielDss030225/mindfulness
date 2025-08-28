// Link Preview Manager - Gera previews para links compartilhados
class LinkPreviewManager {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.maxCacheSize = 100;
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas
        
        // Regex para detectar URLs
        this.urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
        
        // Domínios conhecidos com tratamento especial
        this.specialDomains = {
            'youtube.com': this.handleYouTubeLink.bind(this),
            'youtu.be': this.handleYouTubeLink.bind(this),
            'twitter.com': this.handleTwitterLink.bind(this),
            'x.com': this.handleTwitterLink.bind(this),
            'instagram.com': this.handleInstagramLink.bind(this),
            'github.com': this.handleGitHubLink.bind(this)
        };
        
        this.init();
    }

    init() {
        // Carrega cache do localStorage
        this.loadCache();
        
        // Limpa cache expirado periodicamente
        setInterval(() => this.cleanExpiredCache(), 60 * 60 * 1000); // A cada hora
        
        console.log('LinkPreviewManager initialized');
    }

    loadCache() {
        try {
            const cached = localStorage.getItem('mindfulness_link_cache');
            if (cached) {
                const data = JSON.parse(cached);
                this.cache = new Map(data.entries);
            }
        } catch (error) {
            console.warn('Error loading link cache:', error);
        }
    }

    saveCache() {
        try {
            const data = {
                entries: Array.from(this.cache.entries()),
                timestamp: Date.now()
            };
            localStorage.setItem('mindfulness_link_cache', JSON.stringify(data));
        } catch (error) {
            console.warn('Error saving link cache:', error);
        }
    }

    cleanExpiredCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [url, data] of this.cache.entries()) {
            if (now - data.timestamp > this.cacheExpiry) {
                this.cache.delete(url);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`Cleaned ${cleaned} expired cache entries`);
            this.saveCache();
        }
    }

    detectLinks(text) {
        const matches = text.match(this.urlRegex);
        return matches || [];
    }

    async generatePreview(url) {
        // Verifica cache primeiro
        const cached = this.cache.get(url);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        // Verifica se já há uma requisição pendente para esta URL
        if (this.pendingRequests.has(url)) {
            return this.pendingRequests.get(url);
        }

        // Cria nova requisição
        const promise = this.fetchPreview(url);
        this.pendingRequests.set(url, promise);

        try {
            const preview = await promise;
            
            // Armazena no cache
            this.cache.set(url, {
                data: preview,
                timestamp: Date.now()
            });
            
            // Limita tamanho do cache
            if (this.cache.size > this.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            this.saveCache();
            return preview;
            
        } finally {
            this.pendingRequests.delete(url);
        }
    }

    async fetchPreview(url) {
        try {
            // Verifica se é um domínio especial
            const domain = this.extractDomain(url);
            if (this.specialDomains[domain]) {
                return await this.specialDomains[domain](url);
            }

            // Para outros domínios, usa uma abordagem genérica
            return await this.fetchGenericPreview(url);
            
        } catch (error) {
            console.warn('Error fetching preview for', url, error);
            return this.createFallbackPreview(url);
        }
    }

    async fetchGenericPreview(url) {
        // Como não podemos fazer requisições CORS diretas para sites externos,
        // vamos criar um preview básico baseado na URL
        const domain = this.extractDomain(url);
        const path = this.extractPath(url);
        
        return {
            url: url,
            title: this.generateTitleFromUrl(url),
            description: `Conteúdo de ${domain}`,
            image: this.getDefaultImageForDomain(domain),
            domain: domain,
            type: 'website'
        };
    }

    handleYouTubeLink(url) {
        const videoId = this.extractYouTubeVideoId(url);
        if (!videoId) return this.createFallbackPreview(url);

        return {
            url: url,
            title: 'Vídeo do YouTube',
            description: 'Clique para assistir no YouTube',
            image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            domain: 'youtube.com',
            type: 'video',
            videoId: videoId
        };
    }

    handleTwitterLink(url) {
        return {
            url: url,
            title: 'Post do Twitter/X',
            description: 'Clique para ver o tweet',
            image: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png',
            domain: 'twitter.com',
            type: 'social'
        };
    }

    handleInstagramLink(url) {
        return {
            url: url,
            title: 'Post do Instagram',
            description: 'Clique para ver no Instagram',
            image: 'https://static.cdninstagram.com/rsrc.php/v3/yt/r/30PrGfR3xhI.png',
            domain: 'instagram.com',
            type: 'social'
        };
    }

    handleGitHubLink(url) {
        const parts = url.split('/');
        const user = parts[3];
        const repo = parts[4];
        
        let title = 'Repositório GitHub';
        if (user && repo) {
            title = `${user}/${repo}`;
        }

        return {
            url: url,
            title: title,
            description: 'Repositório no GitHub',
            image: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
            domain: 'github.com',
            type: 'code'
        };
    }

    createFallbackPreview(url) {
        const domain = this.extractDomain(url);
        
        return {
            url: url,
            title: domain,
            description: 'Clique para abrir o link',
            image: this.getDefaultImageForDomain(domain),
            domain: domain,
            type: 'website'
        };
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return 'link';
        }
    }

    extractPath(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname;
        } catch {
            return '';
        }
    }

    extractYouTubeVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
            /youtube\.com\/embed\/([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    generateTitleFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            
            if (path === '/' || path === '') {
                return urlObj.hostname.replace('www.', '');
            }
            
            // Tenta extrair um título do path
            const segments = path.split('/').filter(s => s);
            const lastSegment = segments[segments.length - 1];
            
            if (lastSegment) {
                return lastSegment
                    .replace(/[-_]/g, ' ')
                    .replace(/\.[^.]+$/, '') // Remove extensão
                    .replace(/\b\w/g, l => l.toUpperCase()); // Capitaliza
            }
            
            return urlObj.hostname.replace('www.', '');
        } catch {
            return 'Link';
        }
    }

    getDefaultImageForDomain(domain) {
        const defaultImages = {
            'youtube.com': 'https://www.youtube.com/favicon.ico',
            'twitter.com': 'https://abs.twimg.com/favicons/twitter.ico',
            'x.com': 'https://abs.twimg.com/favicons/twitter.ico',
            'instagram.com': 'https://static.cdninstagram.com/rsrc.php/v3/yt/r/30PrGfR3xhI.png',
            'github.com': 'https://github.githubassets.com/favicons/favicon.png',
            'google.com': 'https://www.google.com/favicon.ico',
            'facebook.com': 'https://static.xx.fbcdn.net/rsrc.php/yo/r/iRmz9lCMBD2.ico'
        };

        return defaultImages[domain] || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }

    renderPreview(preview) {
        if (!preview) return '';

        const { url, title, description, image, domain, type } = preview;
        
        const imageHtml = image ? `
            <div class="link-preview-image">
                <img src="${image}" alt="${title}" onerror="this.style.display='none'">
            </div>
        ` : '';

        const typeIcon = this.getTypeIcon(type);

        return `
            <div class="link-preview" data-url="${url}">
                ${imageHtml}
                <div class="link-preview-content">
                    <div class="link-preview-header">
                        <span class="link-preview-type-icon">${typeIcon}</span>
                        <span class="link-preview-domain">${domain}</span>
                    </div>
                    <div class="link-preview-title">${this.escapeHtml(title)}</div>
                    <div class="link-preview-description">${this.escapeHtml(description)}</div>
                    <div class="link-preview-url">${this.truncateUrl(url)}</div>
                </div>
                <div class="link-preview-actions">
                    <button class="link-preview-open" onclick="window.open('${url}', '_blank')">
                        Abrir
                    </button>
                </div>
            </div>
        `;
    }

    getTypeIcon(type) {
        const icons = {
            'video': '🎥',
            'social': '📱',
            'code': '💻',
            'website': '🌐',
            'image': '🖼️',
            'document': '📄'
        };

        return icons[type] || '🔗';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateUrl(url, maxLength = 50) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    }

    // Método para processar mensagem e adicionar previews
    async processMessageWithPreviews(messageText) {
        const links = this.detectLinks(messageText);
        if (links.length === 0) return { text: messageText, previews: [] };

        const previews = [];
        
        for (const link of links) {
            try {
                const preview = await this.generatePreview(link);
                if (preview) {
                    previews.push(preview);
                }
            } catch (error) {
                console.warn('Error generating preview for', link, error);
            }
        }

        return {
            text: messageText,
            previews: previews
        };
    }

    // Método para renderizar mensagem com previews
    renderMessageWithPreviews(messageText, previews = []) {
        let html = `<div class="message-text">${this.escapeHtml(messageText)}</div>`;
        
        if (previews.length > 0) {
            html += '<div class="message-previews">';
            previews.forEach(preview => {
                html += this.renderPreview(preview);
            });
            html += '</div>';
        }

        return html;
    }

    // Método para limpar cache manualmente
    clearCache() {
        this.cache.clear();
        localStorage.removeItem('mindfulness_link_cache');
        console.log('Link preview cache cleared');
    }

    // Método para obter estatísticas do cache
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            pendingRequests: this.pendingRequests.size
        };
    }
}

// Inicializa o LinkPreviewManager globalmente
window.linkPreviewManager = new LinkPreviewManager();

