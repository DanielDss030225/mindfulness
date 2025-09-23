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
        this.authReady = false; // Flag para controlar o estado da autenticação

        this.init();
    }

    // A inicialização agora usa uma Promise para garantir que a autenticação foi verificada
    init() {
        this.authPromise = new Promise((resolve) => {
            const unsubscribe = this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.authReady = true;
                console.log("Firebase Auth state checked. User:", user ? user.uid : "None");
                unsubscribe(); // Remove o listener após a primeira verificação
                resolve(user);
            });
        });
    }

    // Função para garantir que a autenticação está pronta antes de qualquer ação
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
            throw new Error("O nome da matéria é obrigatório.");
        }
    }

    getDayName(dayKey) {
        const names = { 'domingo': 'Domingo', 'segunda': 'Segunda-feira', 'terca': 'Terça-feira', 'quarta': 'Quarta-feira', 'quinta': 'Quinta-feira', 'sexta': 'Sexta-feira', 'sabado': 'Sábado' };
        return names[dayKey] || dayKey;
    }
    
    formatDuration(minutes) {
        if (!minutes) return '';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m > 0 ? `${m}min` : ''}`.trim() : `${m}min`;
    }

// adiciona dentro de CronogramaManager
async listenUserSchedule(callback) {
    await this.ensureAuthReady();
    const ref = this.database.ref(`userSchedules/${this.currentUser.uid}`);
    // guarda ref/handler para poder remover depois
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

// Cria a instância imediatamente quando o script é lido.
if (!window.cronogramaManager) {
    window.cronogramaManager = new CronogramaManager();
}




//função para trocar professor
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

        // Executa logo ao carregar
        checkHour();

        // Depois verifica a cada minuto
        setInterval(checkHour, 60000);
    }


 function minhaAcao(hour) {
    // Array com imagens correspondentes a cada hora do dia
    const imagens = [
      "./professores/policialcivil.png",        // 0h-1h
        "./professores/guardacivil.png",            // 1h-2h
        "./professores/bombeiromilitar.png",            // 2h-3h
       "./professores/policialrodoviario.png",             // 3h-4h
       "./professores/policialpenal.png",             // 4h-5h
      "./professores/policialmilitar.png",        // 5h-6h
        "./professores/policialfederal.png",             // 6h-7h
       "./professores/policialcivil.png",            // 7h-8h
        "./professores/guardacivil.png",           // 8h-9h
       "./professores/bombeiromilitar.png",             // 9h-10h
       "./professores/policialrodoviario.png",            // 10h-11h
    "./professores/policialpenal.png",           // 11h-12h
        "./professores/policialmilitar.png",              // 12h-13h
      "./professores/policialfederal.png",           // 13h-14h
        "./professores/policialcivil.png",             // 14h-15h
          "./professores/guardacivil.png",              // 15h-16h
           "./professores/bombeiromilitar.png",            // 16h-17h
         "./professores/policialrodoviario.png",  // 17h-18h
        "./professores/policialpenal.png", // 18h-19h
        "./professores/policialmilitar.png",            // 19h-20h
       "./professores/policialfederal.png",           // 20h-21h
        "./professores/policialcivil.png",           // 21h-22h
         "./professores/guardacivil.png",           // 22h-23h
        "./professores/bombeiromilitar.png",             // 23h-0h
    ];

   

    // Seleciona os elementos
  
  const nomeElement3 = document.getElementById("imgOfProfessor");

   



    if (nomeElement3) {
        nomeElement3.src = imagens[hour] || "img/default.png";
        nomeElement3.alt = `Imagem para o intervalo ${hour}h - ${hour + 1}h`;
    }


}



    window.addEventListener("DOMContentLoaded", () => {
        monitoraTempo(minhaAcao);
    });
