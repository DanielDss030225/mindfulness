// Rich Text Editor for Social Feed
// Version 3.1 - Mantém o foco e a seleção após aplicar espaçamento

class RichTextEditor {
    constructor(editorId) {
        this.editor = document.getElementById(editorId);
        this.boldButton = document.querySelector(".toolbar-btn-bold");
        this.lineSpacingButton = document.querySelector(".toolbar-btn-line-height");
        this.linkButton = document.querySelector(".toolbar-btn-link");
        
        // AJUSTE: Adiciona uma propriedade para armazenar a seleção do usuário
        this.savedRange = null;

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
            this.saveSelection(); // AJUSTE: Salva a seleção
        });
        
        this.editor.addEventListener('mouseup', () => {
            this.updateToolbarState();
            this.saveSelection(); // AJUSTE: Salva a seleção
        });

        // AJUSTE: Salva a seleção também quando o editor perde o foco (blur)
        this.editor.addEventListener('blur', () => {
            this.saveSelection();
        });
        
        // Tratamento de colagem para manter apenas negrito e parágrafos
        this.editor.addEventListener('paste', (e) => {
            this.handlePaste(e);
        });
        
        // Detecção de links apenas quando espaço é pressionado
        this.editor.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                setTimeout(() => this.autoDetectLinks(), 50);
            }
        });
        
        console.log('Rich Text Editor inicializado com sucesso!');
    }

    // AJUSTE: Nova função para salvar a seleção atual do usuário
    saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            // Salva o "range" (a área selecionada)
            this.savedRange = selection.getRangeAt(0).cloneRange();
        }
    }

    // AJUSTE: Nova função para restaurar a seleção salva
    restoreSelection() {
        if (this.savedRange) {
            const selection = window.getSelection();
            selection.removeAllRanges(); // Limpa seleções existentes
            selection.addRange(this.savedRange); // Adiciona a seleção salva
        }
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
                // AJUSTE: Não foca mais o editor aqui, a restauração da seleção cuidará disso.
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

            while (element && element.nodeType !== 1) {
                element = element.parentNode;
            }

            if (element && element !== this.editor) {
                return element.style.lineHeight || '1';
            }
        }

        if (this.editor.children.length > 0) {
            return this.editor.children[0].style.lineHeight || '1';
        }

        return '1';
    }

    // AJUSTE: Função applyLineSpacing modificada para restaurar a seleção
    applyLineSpacing(spacing) {
        // Primeiro, restaura o foco e a seleção para que saibamos onde aplicar o estilo
        this.editor.focus();
        this.restoreSelection();

        const selection = window.getSelection();
        
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            // Há texto selecionado - aplica apenas às linhas que contêm parte da seleção
            const range = selection.getRangeAt(0);
            this.applySpacingToSelectedLines(range, spacing);
        } else {
            // Não há seleção ou cursor está posicionado - aplica a todo o editor
            this.applyLineSpacingToAllChildren(spacing);
        }
        
        // AJUSTE: Restaura a seleção novamente para garantir que ela permaneça visível
        this.editor.focus();
        this.restoreSelection();
    }

    applySpacingToSelectedLines(range, spacing) {
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;
        
        const startElement = this.findBlockElement(startContainer);
        const endElement = this.findBlockElement(endContainer);
        
        if (startElement && endElement) {
            if (startElement === endElement) {
                // Seleção está dentro de um único elemento
                startElement.style.lineHeight = spacing;
                console.log(`Espaçamento ${spacing} aplicado à linha selecionada.`);
            } else {
                // Seleção abrange múltiplos elementos
                const elementsToStyle = this.getElementsBetween(startElement, endElement);
                elementsToStyle.forEach(element => {
                    element.style.lineHeight = spacing;
                });
                console.log(`Espaçamento ${spacing} aplicado a ${elementsToStyle.length} linhas selecionadas.`);
            }
        } else {
            // Fallback: aplica a todos os filhos
            this.applyLineSpacingToAllChildren(spacing);
        }
    }

    findBlockElement(node) {
        let current = node;
        while (current && current !== this.editor) {
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

    getElementsBetween(startElement, endElement) {
        const elements = [];
        const allChildren = Array.from(this.editor.children);
        
        const startIndex = allChildren.indexOf(startElement);
        const endIndex = allChildren.indexOf(endElement);
        
        if (startIndex !== -1 && endIndex !== -1) {
            const minIndex = Math.min(startIndex, endIndex);
            const maxIndex = Math.max(startIndex, endIndex);
            
            for (let i = minIndex; i <= maxIndex; i++) {
                elements.push(allChildren[i]);
            }
        }
        
        return elements;
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
                    `<a href="${url}" target="_blank" class="link-button"><p class="link-p">${url}</p></a> `
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
    
    handlePaste(e) {
        // Previne o comportamento padrão de colagem
        e.preventDefault();
        
        // Obtém o conteúdo da área de transferência
        const clipboardData = e.clipboardData || window.clipboardData;
        const htmlData = clipboardData.getData('text/html');
        const textData = clipboardData.getData('text/plain');
        
        if (htmlData) {
            // Se há conteúdo HTML, processa para manter apenas negrito e parágrafos
            const cleanedHtml = this.cleanPastedHtml(htmlData);
            this.insertCleanedContent(cleanedHtml);
        } else if (textData) {
            // Se há apenas texto simples, insere normalmente
            this.insertPlainText(textData);
        }
        
        console.log('Conteúdo colado e formatado conforme regras do projeto.');
    }
    
    cleanPastedHtml(html) {
        // Cria um elemento temporário para processar o HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Processa recursivamente todos os elementos
        this.processElement(tempDiv);
        
        return tempDiv.innerHTML;
    }
    
    processElement(element) {
        // Processa todos os nós filhos
        const children = Array.from(element.childNodes);
        
        children.forEach(child => {
            if (child.nodeType === 1) { // Elemento
                const tagName = child.tagName.toLowerCase();
                
                if (tagName === 'b' || tagName === 'strong') {
                    // Mantém elementos de negrito, mas remove outros estilos
                    this.cleanElementStyles(child);
                    this.processElement(child); // Processa filhos
                } else if (tagName === 'p' || tagName === 'div' || tagName === 'br') {
                    // Mantém elementos de parágrafo/quebra, mas remove estilos
                    this.cleanElementStyles(child);
                    this.processElement(child); // Processa filhos
                } else if (tagName === 'span') {
                    // Para spans, verifica se tem negrito via CSS
                    const fontWeight = child.style.fontWeight || window.getComputedStyle(child).fontWeight;
                    if (fontWeight === 'bold' || fontWeight === '700' || fontWeight > 400) {
                        // Converte span com negrito em elemento strong
                        const strong = document.createElement('strong');
                        strong.innerHTML = child.innerHTML;
                        child.parentNode.replaceChild(strong, child);
                        this.processElement(strong);
                    } else {
                        // Remove o span mas mantém o conteúdo
                        this.unwrapElement(child);
                    }
                } else {
                    // Para outros elementos, remove a tag mas mantém o conteúdo
                    this.unwrapElement(child);
                }
            }
            // Nós de texto são mantidos como estão
        });
    }
    
    cleanElementStyles(element) {
        // Remove todos os atributos de estilo e classes
        element.removeAttribute('style');
        element.removeAttribute('class');
        element.removeAttribute('color');
        element.removeAttribute('bgcolor');
        element.removeAttribute('face');
        element.removeAttribute('size');
        
        // Remove outros atributos de formatação comuns
        const attributesToRemove = ['font-family', 'font-size', 'color', 'background-color', 'background'];
        attributesToRemove.forEach(attr => {
            element.removeAttribute(attr);
        });
    }
    
    unwrapElement(element) {
        // Move todos os filhos para antes do elemento e remove o elemento
        const parent = element.parentNode;
        while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
    }
    
    insertCleanedContent(html) {
        // Insere o conteúdo limpo na posição do cursor
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            // Cria um fragmento de documento com o HTML limpo
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
            
            range.insertNode(fragment);
            
            // Move o cursor para o final do conteúdo inserido
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    
    insertPlainText(text) {
        // Insere texto simples na posição do cursor
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);
            
            // Move o cursor para o final do texto inserido
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
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



//teste
  // Initial check
   const editor = document.getElementById('post-caption-editor');
   //TESTE
    let postContentInput = document.getElementById("postContentInput"); // Referência ao textarea original

  function checkIfOnlyBr() {
    const content = editor.innerHTML.trim();

    if (content === '<br>') {
         // Limpa o editor após a publicação
            editor.innerHTML = '';
            postContentInput.value = ''; // Limpa também o textarea oculto
      alert('O conteúdo não está vazio (ERRO)');
      
    }
  }

  // Update on input
  editor.addEventListener('input', checkIfOnlyBr);

