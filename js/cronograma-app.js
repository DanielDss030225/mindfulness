// Funções globais para serem acessadas pelo HTML (onclick)
function abrirModal(dayKey) {
    if (window.cronogramaApp) {
        window.cronogramaApp.abrirModal(dayKey);
    } else {
        console.error("CronogramaApp não inicializado.");
        alert("A aplicação ainda está carregando. Por favor, tente novamente em um instante.");
    }
}

function fecharModal() {
    if (window.cronogramaApp) {
        window.cronogramaApp.fecharModal();
    }
}

function voltarMenu() {
     window.location.href = "index.html";
  
  /*   const voltar = localStorage.getItem("voltarAoCronograma");
  const paginaAtual = window.location.pathname;

  // verifica se já está em estudoProgramado.html
  if (paginaAtual.includes("estudoProgramado.html")) {
    // remove o valor salvo
    localStorage.removeItem("voltarAoCronograma");
    // redireciona para index
   
  } else {
    // se tiver valor salvo, vai para estudoProgramado
    if (voltar === "true") {
      window.location.href = "estudoProgramado.html";
    } else {
      window.location.href = "index.html";
    }
  }*/


}

// Classe principal da aplicação do cronograma
class CronogramaApp {
    constructor() {
        this.currentDay = null;
        this.currentItemId = null;
        this.isEditing = false;
        this.scheduleData = {};
    }

    // Aguarda inicialização do Firebase
    async waitForFirebase() {
        while (!window.cronogramaManager) {
            await new Promise(r => setTimeout(r, 100));
        }
        await window.cronogramaManager.authPromise;
        while (!window.databaseManager) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    // Inicialização da aplicação
    async init() {
        console.log("Cronograma App initialized");
        await this.waitForFirebase();

        try {
            await window.cronogramaManager.ensureAuthReady();
        } catch (err) {
           
            window.location.href = "index.html";
            return;
        }

        this.setupEventListeners();
        this.loadUserInfo(); // não bloqueante

        // Listener em tempo real para atualização do DOM
        window.cronogramaManager.listenUserSchedule((schedule) => {
            this.scheduleData = schedule || {};
            this.renderAllDays();
        });
    }

    // Configuração de event listeners
    setupEventListeners() {
        // Submit do formulário
        const form = document.getElementById('scheduleForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        } else {
            console.warn("Elemento 'scheduleForm' não encontrado.");
        }

        // Botão de fechar modal
        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.fecharModal());
        }

        // Outros event listeners podem ser adicionados aqui
    }

    // Carrega dados do usuário
    async loadUserInfo() {
        const user = window.cronogramaManager.currentUser;
        if (!user) return;

        const userNameElement = document.getElementById('userName');
        const userProfilePic = document.getElementById('userProfilePic');

        try {
            const userData = await window.databaseManager.getUserData(user.uid);

            if (userNameElement) {
                userNameElement.textContent = userData?.name || user.displayName || 'Usuário';
            } else {
                console.warn("Elemento 'userName' não encontrado.");
            }

            if (userProfilePic) {
                userProfilePic.src = userData?.profilePic || user.photoURL || 'https://firebasestorage.googleapis.com/v0/b/orange-fast.appspot.com/o/ICONE%20PERFIL.png?alt=media&token=d092ec7f-77b9-404d-82d0-b6ed3ce6810e';
            } else {
                console.warn("Elemento 'userProfilePic' não encontrado.");
            }

        } catch (error) {
            console.error("Failed to load user data from database:", error);
            if (userNameElement) userNameElement.textContent = user.displayName || 'Usuário';
            if (userProfilePic && user.photoURL) userProfilePic.src = user.photoURL;
        }
    }

    // Renderiza todos os dias da semana
    renderAllDays() {
        const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        days.forEach(day => this.renderDay(day));
    }

    renderDay(dayKey) {
        const container = document.getElementById(`${dayKey}-items`);
        if (!container) return;

        const dayData = this.scheduleData[dayKey] || {};
        const items = Object.entries(dayData).map(([id, item]) => ({ id, ...item }));
        items.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

        container.innerHTML = ''; // limpa

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum item adicionado</div>';
            return;
        }

        items.forEach(item => {
            const element = this.createItemElement(item, dayKey);
            container.appendChild(element);
        });
    }

    createItemElement(item, dayKey) {
        const el = document.createElement('div');
        el.className = 'schedule-item';
        el.addEventListener('click', () => this.editItem(dayKey, item.id));

        const header = document.createElement('div');
        header.className = 'item-header';

        const subj = document.createElement('span');
        subj.className = 'item-subject';
        subj.textContent = item.subject || '';

        const right = document.createElement('div');
        if (item.time) {
            const timeSpan = document.createElement('span');
            timeSpan.className = 'item-time';
            timeSpan.textContent = item.time;
            right.appendChild(timeSpan);
        }
        if (item.duration) {
            const dur = document.createElement('small');
            dur.style.color = '#888';
            dur.style.marginLeft = '10px';
            dur.textContent = `(${window.cronogramaManager.formatDuration(parseInt(item.duration))})`;
            right.appendChild(dur);
        }

        header.appendChild(subj);
        header.appendChild(right);
        el.appendChild(header);

        if (item.description) {
            const desc = document.createElement('div');
            desc.className = 'item-description';
            desc.textContent = item.description;
            el.appendChild(desc);
        }

        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.title = 'Editar';
        editBtn.innerHTML = `Editar`;
        editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); this.editItem(dayKey, item.id); });

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete';
        delBtn.title = 'Excluir';
        delBtn.innerHTML = `Excluir`;
        delBtn.addEventListener('click', (ev) => { ev.stopPropagation(); this.deleteItem(dayKey, item.id); });

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        el.appendChild(actions);

        return el;
    }

    escapeHtml(text = '' ) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    abrirModal(dayKey) {
        this.currentDay = dayKey;
        this.currentItemId = null;
        this.isEditing = false;

        const modal = document.getElementById('scheduleModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('scheduleForm');

        if (!modal || !modalTitle || !form) return;

        modalTitle.textContent = `Adicionar Item - ${window.cronogramaManager.getDayName(dayKey)}`;
        form.reset();
        modal.classList.add('active');
        setTimeout(() => form.subject.focus(), 100);
    }

    async editItem(dayKey, itemId) {
        this.currentDay = dayKey;
        this.currentItemId = itemId;
        this.isEditing = true;

        const item = this.scheduleData[dayKey]?.[itemId];
        if (!item) { this.showError("Item não encontrado"); return; }

        const modal = document.getElementById('scheduleModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('scheduleForm');

        if (!modal || !modalTitle || !form) return;

        modalTitle.textContent = `Editar Item - ${window.cronogramaManager.getDayName(dayKey)}`;
        form.subject.value = item.subject || '';
        form.description.value = item.description || '';
        form.time.value = item.time || '';
        form.duration.value = item.duration || '';
        modal.classList.add('active');
        setTimeout(() => form.subject.focus(), 100);
    }

    fecharModal() {
        const modal = document.getElementById('scheduleModal');
        if (modal) modal.classList.remove('active');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const scheduleData = {
            subject: formData.get('subject').trim(),
            description: formData.get('description').trim(),
            time: formData.get('time'),
            duration: formData.get('duration')
        };
        Object.keys(scheduleData).forEach(key => { if (!scheduleData[key]) delete scheduleData[key]; });

        this.showLoading(true);
        try {
            if (this.isEditing) {
                await window.cronogramaManager.updateScheduleItem(this.currentDay, this.currentItemId, scheduleData);
                this.showSuccess("Item atualizado!");
                if (this.scheduleData[this.currentDay]) {
                    this.scheduleData[this.currentDay][this.currentItemId] = { ...this.scheduleData[this.currentDay][this.currentItemId], ...scheduleData };
                    this.renderDay(this.currentDay);
                }
            } else {
                const newId = await window.cronogramaManager.addScheduleItem(this.currentDay, scheduleData);
                this.showSuccess("Item adicionado!");
                this.scheduleData[this.currentDay] = this.scheduleData[this.currentDay] || {};
                this.scheduleData[this.currentDay][newId] = { id: newId, ...scheduleData };
                this.renderDay(this.currentDay);
            }
            this.fecharModal();
        } catch (error) {
            this.showError(error.message || "Erro ao salvar");
        } finally {
            this.showLoading(false);
        }
    }
//esse
  async deleteItem(dayKey, itemId) {
  const confirmDelete = await showConfirmCustom("Tem certeza que deseja excluir este item?");
  if (!confirmDelete) return;

  this.showLoading(true);
  try {
    await window.cronogramaManager.deleteScheduleItem(dayKey, itemId);
    this.showSuccess("Item excluído!");
    await this.loadInitialData();
  } catch (error) {
    this.showError("Erro ao excluir");
  } finally {
    this.showLoading(false);
  }
}


    async loadInitialData() {
        this.showLoading(true);
        try {
            await this.loadUserInfo();
            this.scheduleData = await window.cronogramaManager.loadUserSchedule();
            this.renderAllDays();
        } catch (error) {
            console.error("Error loading initial data:", error);
            this.showError("Erro ao carregar dados iniciais");
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.toggle('active', show);
    }

    showNotification(message, type = 'info') {
        alert(`${type.toUpperCase()}: ${message}`);
    }

   showSuccess(message) { 
  showModal(message, "success"); 
}

showError(message) { 
  showModal(message, "error"); 
}


}

function showModal(message, type = "success") {
  const modal = document.getElementById("customModal");
  const content = document.getElementById("modalContent");
  const closeBtn = document.getElementById("modalClose");

  // define cor pelo tipo
  if (type === "success") {
    content.className = "modal-content modal-success";
  } else {
    content.className = "modal-content modal-error";
  }

  // insere a mensagem
  content.textContent = message;

  // mostra modal
  modal.style.display = "flex";

  // fechar ao clicar no X
  closeBtn.onclick = () => { modal.style.display = "none"; };

  // fechar ao clicar fora
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };

  // fechar automático depois de 3s (opcional)
  setTimeout(() => {
    modal.style.display = "none";
  }, 3000);
}

// substitui suas funções atuais:
function showSuccess(message) {
  showModal(message, "success");
}

function showError(message) {
  showModal(message, "error");
}

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', () => {
    window.cronogramaApp = new CronogramaApp();
    window.cronogramaApp.init();
});


   

function showConfirmCustom(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModalCustom");
    const msg = document.getElementById("confirmMessageCustom");
    const yesBtn = document.getElementById("confirmYesCustom");
    const noBtn = document.getElementById("confirmNoCustom");

    msg.textContent = message;
    modal.style.display = "flex";

    const cleanup = () => {
      modal.style.display = "none";
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
    };

    const onYes = () => { cleanup(); resolve(true); };
    const onNo = () => { cleanup(); resolve(false); };

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}
