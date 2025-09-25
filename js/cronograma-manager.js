// Cronograma Manager - Handles all Firebase operations for study schedule
class CronogramaManager {
    constructor() {
        if (!window.firebaseServices) {
            console.error("Firebase services not available.");
            return;
        }
        this.database = window.firebaseServices.database;
        this.auth = window.firebaseServices.auth;
        this.currentUser = null;
        this.authReady = false;

        this.init();
    }

    init() {
        this.authPromise = new Promise((resolve) => {
            const unsubscribe = this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.authReady = true;
                console.log("Firebase Auth state checked. User:", user ? user.uid : "None");
                unsubscribe();
                resolve(user);
            });
        });
    }

    async ensureAuthReady() {
        if (!this.authReady) {
            await this.authPromise;
        }
        if (!this.currentUser) {
            throw new Error("Usuário não autenticado. Faça o login para continuar.");
        }
        return this.currentUser;
    }

    getCurrentUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }

    async loadUserSchedule() {
        const user = await this.ensureAuthReady();
        try {
            const snapshot = await this.database.ref(`userSchedules/${user.uid}`).once("value");
            return snapshot.val() || {};
        } catch (error) {
            console.error("Error loading user schedule:", error);
            throw error;
        }
    }

    async addScheduleItem(dayOfWeek, scheduleData) {
        const user = await this.ensureAuthReady();
        this.validateScheduleData(scheduleData);

        const newItemRef = this.database.ref(`userSchedules/${user.uid}/${dayOfWeek}`).push();
        const itemData = {
            ...scheduleData,
            createdAt: window.firebase.database.ServerValue.TIMESTAMP,
            updatedAt: window.firebase.database.ServerValue.TIMESTAMP
        };
        await newItemRef.set(itemData);
        console.log("Item adicionado com sucesso no Firebase:", newItemRef.key);
        return newItemRef.key;
    }

    async updateScheduleItem(dayOfWeek, itemId, scheduleData) {
        const user = await this.ensureAuthReady();
        this.validateScheduleData(scheduleData);

        const itemData = { ...scheduleData, updatedAt: window.firebase.database.ServerValue.TIMESTAMP };
        await this.database.ref(`userSchedules/${user.uid}/${dayOfWeek}/${itemId}`).update(itemData);
    }

    async deleteScheduleItem(dayOfWeek, itemId) {
        const user = await this.ensureAuthReady();
        await this.database.ref(`userSchedules/${user.uid}/${dayOfWeek}/${itemId}`).remove();
    }

    validateScheduleData(data) {
        if (!data.subject || data.subject.trim().length === 0) {
            throw new Error("O nome da Disciplina é obrigatório.");
        }
    }

    getDayName(dayKey) {
        const names = {
            'domingo': 'Domingo',
            'segunda': 'Segunda-feira',
            'terca': 'Terça-feira',
            'quarta': 'Quarta-feira',
            'quinta': 'Quinta-feira',
            'sexta': 'Sexta-feira',
            'sabado': 'Sábado'
        };
        return names[dayKey] || dayKey;
    }

    formatDuration(minutes) {
        if (!minutes) return '';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m > 0 ? `${m}min` : ''}`.trim() : `${m}min`;
    }

    async listenUserSchedule(callback) {
        await this.ensureAuthReady();
        const ref = this.database.ref(`userSchedules/${this.currentUser.uid}`);
        this._scheduleRef = ref;
        this._scheduleListener = (snapshot) => {
            const data = snapshot.val() || {};
            callback(data);
        };
        ref.on("value", this._scheduleListener);
    }

    stopListeningUserSchedule() {
        if (this._scheduleRef && this._scheduleListener) {
            this._scheduleRef.off("value", this._scheduleListener);
            this._scheduleRef = null;
            this._scheduleListener = null;
        }
    }
}

// Instância global
if (!window.cronogramaManager) {
    window.cronogramaManager = new CronogramaManager();
}

// -------------------- LOADING + INICIALIZAÇÃO -------------------- //
async function iniciarApp() {
    const loading = document.getElementById("loading-screen");
    const container = document.getElementById("schedule-container"); // seu container no HTML

    try {
        // Espera autenticação Firebase
        const user = await window.cronogramaManager.ensureAuthReady();

        // Busca dados iniciais
        const dados = await window.cronogramaManager.loadUserSchedule();

        // Renderiza no DOM
        renderSchedule(dados, container);

        // Agora pode esconder loading
        loading.style.display = "none";

        // Escuta mudanças em tempo real
        window.cronogramaManager.listenUserSchedule((novosDados) => {
            renderSchedule(novosDados, container);
        });

        // Ativa troca de professor
        monitoraTempo(minhaAcao);

    } catch (err) {
        console.error("Erro ao iniciar app:", err);
        loading.innerText = "Erro ao carregar. Recarregue a página.";
    }
}

function renderSchedule(dados, container) {
    if (!container) return;
    container.innerHTML = "";

    for (const dia in dados) {
        const bloco = document.createElement("div");
        bloco.className = "dia";

        const titulo = document.createElement("h3");
        titulo.textContent = window.cronogramaManager.getDayName(dia);
        bloco.appendChild(titulo);

        for (const id in dados[dia]) {
            const item = dados[dia][id];
            const itemDiv = document.createElement("div");
            itemDiv.className = "item";
            itemDiv.textContent = `${item.subject} - ${window.cronogramaManager.formatDuration(item.duration)}`;
            bloco.appendChild(itemDiv);
        }

        container.appendChild(bloco);
    }
}

// -------------------- TROCA PROFESSOR -------------------- //
function monitoraTempo(actionFunction) {
    let lastHour = -1;

    function checkHour() {
        const now = new Date();
        const currentHour = now.getHours();

        if (currentHour !== lastHour) {
            actionFunction(currentHour);
            lastHour = currentHour;
        }
    }

    checkHour();
    setInterval(checkHour, 60000);
}

function minhaAcao(hour) {
    const imagens = [
        "./professores/policialcivil.png", "./professores/guardacivil.png",
        "./professores/bombeiromilitar.png", "./professores/policialrodoviario.png",
        "./professores/policialpenal.png", "./professores/policialmilitar.png",
        "./professores/policialfederal.png", "./professores/policialcivil.png",
        "./professores/guardacivil.png", "./professores/bombeiromilitar.png",
        "./professores/policialrodoviario.png", "./professores/policialpenal.png",
        "./professores/policialmilitar.png", "./professores/policialfederal.png",
        "./professores/policialcivil.png", "./professores/guardacivil.png",
        "./professores/bombeiromilitar.png", "./professores/policialrodoviario.png",
        "./professores/policialpenal.png", "./professores/policialmilitar.png",
        "./professores/policialfederal.png", "./professores/policialcivil.png",
        "./professores/guardacivil.png", "./professores/bombeiromilitar.png"
    ];

    const nomeElement3 = document.getElementById("imgOfProfessor");

    if (nomeElement3) {
        nomeElement3.src = imagens[hour] || "img/default.png";
        nomeElement3.alt = `Imagem para o intervalo ${hour}h - ${hour + 1}h`;
    }
}

// Quando DOM pronto → inicia app
document.addEventListener("DOMContentLoaded", iniciarApp);
