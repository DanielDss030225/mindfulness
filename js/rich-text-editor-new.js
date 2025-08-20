// Rich Text Editor for Social Feed
// Version 3.0 - Com dropdown de espaçamento

class RichTextEditor {
    constructor(editorId) {
        this.editor = document.getElementById(editorId);
        this.boldButton = document.querySelector(".toolbar-btn-bold");
        this.lineSpacingButton = document.querySelector(".toolbar-btn-line-spacing");
        this.linkButton = document.querySelector(".toolbar-btn-link");
        
        if (!this.editor) {
            console.warn(`Editor de texto rico #${editorId} não encontrado.`);
            return;
        }
        
        this.init();
    }
    
    init() {
        console.log('Inicializando Rich Text Editor...');
        
        // Configurar o editor
        this.editor.contentEditable = true;
        this.editor.style.minHeight = '100px';
        this.editor.style.padding = '10px';
        this.editor.style.border = '1px solid #ddd';
        this.editor.style.borderRadius = '4px';
        this.editor.style.outline = 'none';
        
        // Event listeners para os botões
        if (this.boldButton) {
            this.boldButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleBold();
            });
        }
        
        if (this.lineSpacingButton) {
            this.lineSpacingButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleLineSpacing();
            });
        }
        
        if (this.linkButton) {
            this.linkButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.insertLink();
            });
        }
        
        // Event listeners para o editor
        this.editor.addEventListener('keyup', () => {
            this.updateToolbarState();
        });
        
        this.editor.addEventListener('mouseup', () => {
            this.updateToolbarState();
        });
        
        // Detecção de links apenas quando espaço é pressionado
        this.editor.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                setTimeout(() => this.autoDetectLinks(), 50);
            }
        });
        
        console.log('Rich Text Editor inicializado com sucesso!');
    }
    
    toggleBold() {
        // Usa execCommand para aplicar/remover negrito
        document.execCommand('bold', false, null);
        this.editor.focus();
        this.updateToolbarState();
    }
    
    toggleLineSpacing() {
        // Remove qualquer dropdown existente
        this.removeExistingDropdown();
        
        // Cria o dropdown menu
        const dropdown = this.createLineSpacingDropdown();
        
        // Posiciona o dropdown próximo ao botão
        this.positionDropdown(dropdown);
        
        // Adiciona o dropdown ao DOM
        document.body.appendChild(dropdown);
        
        // Adiciona event listener para fechar o dropdown ao clicar fora
        setTimeout(() => {
            document.addEventListener('click', this.closeDropdownHandler.bind(this), { once: true });
        }, 100);
    }

    createLineSpacingDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'line-spacing-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            min-width: 120px;
            padding: 5px 0;
        `;

        const spacingOptions = [
            { value: '1', label: 'Simples (1.0)' },
            { value: '1.15', label: 'Compacto (1.15)' },
            { value: '1.5', label: 'Médio (1.5)' },
            { value: '2', label: 'Duplo (2.0)' },
            { value: '2.5', label: 'Expandido (2.5)' }
        ];

        spacingOptions.forEach(option => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = option.label;
            item.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                font-size: 14px;
                color: #333;
                transition: background-color 0.2s;
            `;

            // Destaca a opção atual
            const currentSpacing = this.getCurrentLineSpacing();
            if (currentSpacing === option.value) {
                item.style.backgroundColor = '#e3f2fd';
                item.style.fontWeight = 'bold';
            }

            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f5f5f5';
            });

            item.addEventListener('mouseleave', () => {
                if (currentSpacing !== option.value) {
                    item.style.backgroundColor = '';
                }
            });

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.applyLineSpacing(option.value);
                this.removeExistingDropdown();
                this.editor.focus();
            });

            dropdown.appendChild(item);
        });

        return dropdown;
    }

    positionDropdown(dropdown) {
        if (!this.lineSpacingButton) return;

        const buttonRect = this.lineSpacingButton.getBoundingClientRect();
        dropdown.style.left = buttonRect.left + 'px';
        dropdown.style.top = (buttonRect.bottom + 5) + 'px';
    }

    removeExistingDropdown() {
        const existingDropdown = document.querySelector('.line-spacing-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
    }

    closeDropdownHandler(event) {
        const dropdown = document.querySelector('.line-spacing-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
            this.removeExistingDropdown();
        }
    }

    getCurrentLineSpacing() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            let element = range.commonAncestorContainer;

            // Encontra o elemento pai se for um nó de texto
            while (element && element.nodeType !== 1) {
                element = element.parentNode;
            }

            if (element && element !== this.editor) {
                return element.style.lineHeight || '1';
            }
        }

        // Se não houver seleção, verifica o primeiro filho
        if (this.editor.children.length > 0) {
            return this.editor.children[0].style.lineHeight || '1';
        }

        return '1';
    }

    applyLineSpacing(spacing) {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            let element = range.commonAncestorContainer;

            // Encontra o elemento de bloco pai
            while (element && element !== this.editor && element.nodeType !== 1) {
                element = element.parentNode;
            }

            if (element && element !== this.editor) {
                element.style.lineHeight = spacing;
                console.log(`Espaçamento alterado para: ${spacing} no elemento selecionado.`);
            } else {
                // Se não houver seleção específica, aplica a todos os filhos de bloco
                this.applyLineSpacingToAllChildren(spacing);
            }
        } else {
            // Se não houver seleção, aplica a todos os filhos de bloco
            this.applyLineSpacingToAllChildren(spacing);
        }
    }

    applyLineSpacingToAllChildren(spacing) {
        const children = this.editor.children;
        for (let i = 0; i < children.length; i++) {
            if (children[i].nodeType === 1) { // Apenas elementos
                children[i].style.lineHeight = spacing;
            }
        }
        console.log(`Espaçamento alterado para: ${spacing} em todos os elementos de bloco.`);
    }
    
    insertLink() {
        const url = prompt('Digite a URL do link:');
        if (url) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const selectedText = selection.toString();
                
                if (selectedText.trim() !== '') {
                    // Há texto selecionado
                    document.execCommand('createLink', false, url);
                    // Adiciona target="_blank" ao link criado
                    const links = this.editor.querySelectorAll('a[href="' + url + '"]');
                    links.forEach(link => {
                        link.target = '_blank';
                        link.className = 'link-button';
                    });
                } else {
                    // Não há texto selecionado, insere o link
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_blank';
                    link.className = 'link-button';
                    link.textContent = url;
                    
                    range.insertNode(link);
                    range.setStartAfter(link);
                    range.setEndAfter(link);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        }
        this.editor.focus();
    }
    
    autoDetectLinks() {
        const content = this.editor.innerHTML;
        const text = this.editor.textContent;
        
        // Regex para detectar URLs que terminam com espaço
        const urlRegex = /(https?:\/\/[^\s<"']+)\s/gi;
        
        let match;
        let hasChanges = false;
        
        while ((match = urlRegex.exec(text)) !== null) {
            const url = match[1];
            
            // Verifica se a URL já não está em um link
            if (!content.includes(`href="${url}"`)) {
                // Salva a posição do cursor
                const selection = window.getSelection();
                let savedRange = null;
                
                if (selection.rangeCount > 0) {
                    savedRange = selection.getRangeAt(0).cloneRange();
                }
                
                // Substitui a URL por um link
                const newContent = content.replace(
                    new RegExp(`(${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s`, 'g'),
                    `<a href="${url}" target="_blank" class="link-button"><p class="link-p">${url}</p></a>`
                );
                
                if (newContent !== content) {
                    this.editor.innerHTML = newContent;
                    hasChanges = true;
                    
                    // Restaura a posição do cursor
                    if (savedRange) {
                        try {
                            selection.removeAllRanges();
                            selection.addRange(savedRange);
                        } catch (e) {
                            // Se não conseguir restaurar, coloca o cursor no final
                            const range = document.createRange();
                            range.selectNodeContents(this.editor);
                            range.collapse(false);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                }
                break; // Processa apenas um link por vez
            }
        }
        
        if (hasChanges) {
            this.editor.focus();
        }
    }
    
    updateToolbarState() {
        if (!this.boldButton) return;
        
        const isBold = document.queryCommandState('bold');
        
        if (isBold) {
            this.boldButton.classList.add('active');
            this.boldButton.style.backgroundColor = '#007bff';
            this.boldButton.style.color = 'white';
        } else {
            this.boldButton.classList.remove('active');
            this.boldButton.style.backgroundColor = '';
            this.boldButton.style.color = '';
        }
    }
    
    getContent() {
 let content = this.editor.innerHTML;
    // Se o conteúdo for apenas <br> ou <div><br></div>, retorne uma string vazia
    if (content === '<br>' || content.toLowerCase() === '<div><br></div>') {
        return '';
    }
    return content;    }
    
    setContent(content) {
        this.editor.innerHTML = content;
    }
    
    clear() {
        this.editor.innerHTML = '';
         // Opcional: para garantir que não haja <br> residual, embora o navegador possa reinserir
    if (this.editor.innerHTML === '<br>') {
        this.editor.innerHTML = '';
    }
    }
}

// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando Rich Text Editor...');
    
    // Aguarda um pouco para garantir que todos os elementos estejam carregados
    setTimeout(() => {
        window.richTextEditor = new RichTextEditor('post-caption-editor');
    }, 100);
});

// Exporta para uso global
window.RichTextEditor = RichTextEditor;

