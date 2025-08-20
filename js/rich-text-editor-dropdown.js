// Rich Text Editor Dropdown Handler
// Gerencia o dropdown HTML estático de espaçamento entre linhas

class RichTextEditorDropdownHandler {
    constructor() {
        this.savedRange = null;
        this.init();
    }

    init() {
        console.log('Inicializando manipulador do dropdown de espaçamento...');
        
        // Encontra todos os links do dropdown
        const dropdownLinks = document.querySelectorAll('.dropdown-content a[data-value]');
        
        if (dropdownLinks.length === 0) {
            console.warn('Nenhum link de dropdown encontrado.');
            return;
        }

        // Adiciona event listeners para cada link
        dropdownLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const spacing = link.getAttribute('data-value');
                this.applyLineSpacing(spacing);
                
                // Fecha o dropdown após aplicar o espaçamento
                this.closeDropdown();
            });
        });

        // Adiciona funcionalidade de abrir/fechar dropdown no botão
        const dropdownButton = document.querySelector('.toolbar-btn-line-height');
        if (dropdownButton) {
            dropdownButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        // Adiciona listener para fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            this.handleOutsideClick(e);
        });

        // Salva a seleção quando o usuário interage com o editor
        const editor = document.getElementById('post-caption-editor');
        if (editor) {
            editor.addEventListener('keyup', () => {
                this.saveSelection();
            });
            
            editor.addEventListener('mouseup', () => {
                this.saveSelection();
            });

            editor.addEventListener('blur', () => {
                this.saveSelection();
            });
        }

        console.log('Manipulador do dropdown inicializado com sucesso!');
    }

    toggleDropdown() {
        const dropdown = document.querySelector('.dropdown');
        const dropdownContent = dropdown?.querySelector('.dropdown-content');
        
        if (dropdownContent) {
            const isVisible = dropdownContent.style.display === 'block';
            
            if (isVisible) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        }
    }

    openDropdown() {
        const dropdown = document.querySelector('.dropdown');
        const dropdownContent = dropdown?.querySelector('.dropdown-content');
        
        if (dropdownContent) {
            dropdownContent.style.display = 'block';
            console.log('Dropdown aberto');
        }
    }

    closeDropdown() {
        const dropdown = document.querySelector('.dropdown');
        const dropdownContent = dropdown?.querySelector('.dropdown-content');
        
        if (dropdownContent) {
            dropdownContent.style.display = 'none';
            console.log('Dropdown fechado');
        }
    }

    handleOutsideClick(event) {
        const dropdown = document.querySelector('.dropdown');
        
        if (dropdown && !dropdown.contains(event.target)) {
            this.closeDropdown();
        }
    }

    saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            this.savedRange = selection.getRangeAt(0).cloneRange();
        }
    }

    restoreSelection() {
        if (this.savedRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.savedRange);
        }
    }

    applyLineSpacing(spacing) {
        const editor = document.getElementById("post-caption-editor");
        if (!editor) {
            console.warn("Editor não encontrado.");
            return;
        }

        editor.focus();
        this.restoreSelection();

        const selection = window.getSelection();

        // Se houver uma seleção não colapsada, aplica apenas à seleção
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            this.applySpacingToSelectedLines(range, spacing);
        } else {
            // Se não houver seleção, aplica a todo o editor (comportamento padrão)
            this.applyLineSpacingToAllChildren(spacing);
        }

        // Restaura a seleção novamente para mantê-la visível
        editor.focus();
        this.restoreSelection();

        console.log(`Espaçamento ${spacing} aplicado via dropdown HTML.`);
    }

    applySpacingToSelectedLines(range, spacing) {
        const editor = document.getElementById("post-caption-editor");
        let commonAncestor = range.commonAncestorContainer;

        // Se o commonAncestor for um TextNode, suba para o elemento pai
        if (commonAncestor.nodeType === Node.TEXT_NODE) {
            commonAncestor = commonAncestor.parentNode;
        }

        // Encontra todos os elementos de bloco dentro da seleção
        const blockElements = [];
        const treeWalker = document.createTreeWalker(
            commonAncestor,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: (node) => {
                    // Verifica se o nó está dentro do editor e é um elemento de bloco
                    if (editor.contains(node) && this.isBlockElement(node)) {
                        // Verifica se o nó está parcial ou totalmente dentro do range
                        const nodeRange = document.createRange();
                        nodeRange.selectNode(node);
                        if (range.intersectsNode(node)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            },
            false
        );

        let currentNode = treeWalker.nextNode();
        while (currentNode) {
            blockElements.push(currentNode);
            currentNode = treeWalker.nextNode();
        }

        // Se nenhum elemento de bloco foi encontrado, tenta aplicar ao container pai da seleção
        if (blockElements.length === 0) {
            let parentBlock = this.findBlockElement(range.startContainer);
            if (parentBlock && editor.contains(parentBlock)) {
                parentBlock.style.lineHeight = spacing;
            } else {
                // Fallback: se não encontrar um bloco específico, aplica a todos os filhos
                this.applyLineSpacingToAllChildren(spacing);
            }
        } else {
            // Aplica o espaçamento a todos os elementos de bloco encontrados
            blockElements.forEach(element => {
                element.style.lineHeight = spacing;
            });
        }
    }

    findBlockElement(node) {
        let current = node;
        const editor = document.getElementById('post-caption-editor');
        
        while (current && current !== editor) {
            if (current.nodeType === 1 && this.isBlockElement(current)) {
                return current;
            }
            current = current.parentNode;
        }
        return null;
    }

    isBlockElement(element) {
        const blockTags = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE'];
        return blockTags.includes(element.tagName) || 
               window.getComputedStyle(element).display === 'block';
    }

    applyLineSpacingToAllChildren(spacing) {
        const editor = document.getElementById('post-caption-editor');
        
        // Se o editor contém apenas texto direto, envolve em um div primeiro
        if (editor.childNodes.length > 0 && editor.children.length === 0) {
            const textContent = editor.textContent;
            editor.innerHTML = '';
            const div = document.createElement('div');
            div.textContent = textContent;
            editor.appendChild(div);
        }
        
        // Aplica o espaçamento a todos os elementos filhos
        const children = editor.children;
        for (let i = 0; i < children.length; i++) {
            if (children[i].nodeType === 1) {
                children[i].style.lineHeight = spacing;
            }
        }
    }
}

// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando manipulador do dropdown...');
    
    setTimeout(() => {
        window.richTextEditorDropdownHandler = new RichTextEditorDropdownHandler();
    }, 200);
});

// Exporta para uso global
window.RichTextEditorDropdownHandler = RichTextEditorDropdownHandler;

