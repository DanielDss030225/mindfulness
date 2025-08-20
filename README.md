# Mindfulness - Jogo Educativo de Questões

## Descrição

O Mindfulness é um jogo educativo interativo desenvolvido em HTML, CSS e JavaScript que utiliza Firebase para autenticação e banco de dados em tempo real. O jogo permite que usuários resolvam questões de concursos públicos de forma gamificada, com acompanhamento de desempenho e interação social.

## Características Principais

### 🎯 Sistema de Quiz Inteligente
- Questões organizadas por categorias (Português, Inglês, Direito, etc.)
- Filtragem por questões inéditas ou de bancas anteriores
- Opção "Aleatórias" que mescla questões de todas as categorias
- Máximo de 50 questões por quiz
- Sistema de pontuação e tempo

### 👨‍🏫 Personagem Professor
- Professor animado como personagem principal
- Mensagens motivacionais interativas
- Feedback visual e sonoro durante o jogo

### 📊 Acompanhamento de Desempenho
- Gráfico pizza mostrando estatísticas do usuário
- Quantidade de questões resolvidas, acertadas e erradas
- Histórico de quizzes realizados
- Sistema de revisão de questões

### 💬 Sistema de Comentários
- Comentários em questões para discussão
- Interação entre usuários
- Sistema de curtidas
- Moderação de conteúdo

### ⚙️ Painel Administrativo
- Adicionar questões com editor de texto rico
- Gerenciar categorias
- Suporte a formatação (negrito, itálico)
- Interface intuitiva para administradores

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Autenticação**: Firebase Auth
- **Gráficos**: Chart.js
- **Responsivo**: CSS Grid e Flexbox

## Estrutura do Projeto

```
mindfulness/
├── index.html              # Página principal
├── css/
│   ├── main.css            # Estilos principais
│   ├── auth.css            # Estilos de autenticação
│   ├── game.css            # Estilos do jogo
│   ├── admin.css           # Estilos do painel admin
│   └── profile.css         # Estilos do perfil
├── js/
│   ├── main.js             # Controlador principal
│   ├── firebase-config.js  # Configuração Firebase
│   ├── auth.js             # Gerenciador de autenticação
│   ├── database.js         # Gerenciador de banco de dados
│   ├── ui-manager.js       # Gerenciador de interface
│   ├── game-logic.js       # Lógica do jogo
│   ├── admin.js            # Painel administrativo
│   ├── profile.js          # Página de perfil
│   └── comments.js         # Sistema de comentários
└── assets/
    ├── images/             # Imagens do projeto
    └── sounds/             # Sons e efeitos
```

## Configuração do Firebase

O projeto utiliza as seguintes configurações do Firebase:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyCUBq48bAHvNjbleWHEDbROUCAH6kf9Lr0",
    authDomain: "mindfulness-1cf9f.firebaseapp.com",
    projectId: "mindfulness-1cf9f",
    storageBucket: "mindfulness-1cf9f.firebasestorage.app",
    messagingSenderId: "823279481835",
    appId: "1:823279481835:web:8cd69e5d49970c6acc5fae",
    measurementId: "G-M49BDQ3XLS"
};
```

## Credenciais de Administrador

- **Email**: danielintheend@gmail.com
- **Senha**: 123456

## Funcionalidades Implementadas

### ✅ Autenticação
- Login e registro de usuários
- Gerenciamento de sessão
- Controle de acesso administrativo

### ✅ Interface do Usuário
- Design responsivo e moderno
- Navegação intuitiva
- Animações e transições suaves
- Tema com gradientes e cores atrativas

### ✅ Sistema de Questões
- Estrutura de dados para questões
- Categorização e filtragem
- Editor de texto rico para administradores
- Suporte a formatação de texto

### ✅ Gamificação
- Personagem professor interativo
- Sistema de pontuação
- Mensagens motivacionais
- Feedback visual

### ✅ Estatísticas e Perfil
- Gráficos de desempenho
- Histórico de atividades
- Sistema de revisão
- Exportação de dados

### ✅ Interação Social
- Sistema de comentários
- Curtidas e interações
- Moderação de conteúdo

## Como Executar

1. **Servidor Local**:
   ```bash
   cd mindfulness
   python3 -m http.server 8000
   ```

2. **Acesse**: http://localhost:8000

3. **Login**: Use as credenciais de administrador ou crie uma nova conta

## Estrutura do Banco de Dados

### Usuários
```
users/
  {userId}/
    name: string
    email: string
    isAdmin: boolean
    createdAt: timestamp
```

### Questões
```
questions/
  {questionId}/
    text: string
    alternatives: array[4]
    correctAnswer: number (0-3)
    category: string
    comment: string
    createdBy: userId
    createdAt: timestamp
```

### Categorias
```
categories/
  {categoryId}/
    name: string
    description: string
    createdAt: timestamp
```

### Estatísticas do Usuário
```
userStats/
  {userId}/
    totalQuestions: number
    correctAnswers: number
    wrongAnswers: number
    totalScore: number
```

### Comentários
```
comments/
  {questionId}/
    {commentId}/
      text: string
      userId: string
      authorName: string
      likedBy: object
      createdAt: timestamp
```

## Recursos Avançados

### 🎨 Design Responsivo
- Compatível com desktop, tablet e mobile
- Interface adaptativa
- Otimizado para touch

### 🔒 Segurança
- Autenticação segura via Firebase
- Validação de dados
- Controle de acesso por roles

### 📈 Performance
- Carregamento otimizado
- Cache de dados
- Lazy loading de conteúdo

### 🌐 Acessibilidade
- Suporte a leitores de tela
- Navegação por teclado
- Alto contraste

## Próximas Funcionalidades

- [ ] Sistema de conquistas e badges
- [ ] Ranking global de usuários
- [ ] Modo offline
- [ ] Notificações push
- [ ] Exportação de relatórios
- [ ] API para integração externa
- [ ] Modo escuro
- [ ] Suporte a múltiplos idiomas

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste thoroughly
5. Submeta um pull request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## Suporte

Para suporte técnico ou dúvidas:
- Email: danielintheend@gmail.com
- Documentação: Consulte os comentários no código

## Changelog

### v1.0.0 (2025-01-03)
- Lançamento inicial
- Sistema completo de quiz
- Autenticação Firebase
- Interface responsiva
- Sistema de comentários
- Painel administrativo
- Estatísticas de usuário

---

**Desenvolvido com ❤️ para educação e aprendizado**

