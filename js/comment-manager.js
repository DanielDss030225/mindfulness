// 🔹 Configurações
const COMMENTS_BATCH_SIZE = 5;
let allComments = [];
let renderedCount = 0;
let pendingDelete = null; // Guarda o comentário a ser deletado

// 🔹 SVGs dos botões de curtir
const likedIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#2a87f0ff"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>`;
const notLikedIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#434343"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>`;

// 🔹 Carregar comentários de uma questão
function loadCommentsForQuestion(questionId) {
  const commentsRef = window.firebaseServices.database.ref(`questoes/${questionId}/comentarios`);
  commentsRef.once("value", snapshot => {
    allComments = [];
    snapshot.forEach(child => {
      allComments.push({ id: child.key, data: child.val() });
    });

    allComments.sort((a, b) => b.data.timestamp - a.data.timestamp);

    renderedCount = 0;
    const list = document.getElementById("comments-list");
    list.innerHTML = "";

    if (!allComments.length) {
      list.innerHTML = `<p class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>`;
      document.getElementById("load-more-comments").style.display = "none";
    } else {
      renderNextComments(questionId);
    }
  });
}

// 🔹 Renderizar próximos comentários
function renderNextComments(questionId) {
  const list = document.getElementById("comments-list");
  const currentUser = window.firebaseServices.auth.currentUser?.uid;
  const nextBatch = allComments.slice(renderedCount, renderedCount + COMMENTS_BATCH_SIZE);

  const noCommentsMsg = list.querySelector(".no-comments");
  if (noCommentsMsg) noCommentsMsg.remove();

  nextBatch.forEach(({ id, data }) => {
    renderComment(id, data, questionId, list, currentUser, false);
  });

  renderedCount += nextBatch.length;
  const loadMoreBtn = document.getElementById("load-more-comments");
  loadMoreBtn.style.display = renderedCount >= allComments.length ? "none" : "block";

  if (!allComments.length && renderedCount === 0) {
    list.innerHTML = `<p class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>`;
  }
}

// 🔹 Adicionar comentário
function addComment(questionId, user, text) {
  const newCommentRef = window.firebaseServices.database.ref(`questoes/${questionId}/comentarios`).push();
  const newComment = {
    userId: user.uid,
    userName: user.displayName || "Usuário",
    userPhoto: user.photoURL || "default-profile.png",
    text,
    timestamp: Date.now(),
    likesByUser: {}
  };

  newCommentRef.set(newComment, err => {
    if (err) return alert("Erro ao enviar comentário.");
    const list = document.getElementById("comments-list");
    renderComment(newCommentRef.key, newComment, questionId, list, user.uid, true);
    allComments.unshift({ id: newCommentRef.key, data: newComment });
    renderedCount++;
  });
}

// 🔹 Enviar comentário
document.getElementById("submit-comment").addEventListener("click", () => {
  const editor = document.getElementById("comment-editor");
  let text = normalizeEditorLineBreaks(editor.innerHTML);
  text = sanitizeCommentHTML(text);

  if (!text.replace(/(<br\s*\/?>|\s)+/g, '').length) return alert("O comentário não pode estar vazio.");

  const user = window.firebaseServices.auth.currentUser;
  if (!user) return alert("Você precisa estar logado para comentar.");

  const questionId = window.gameLogic.questions[window.gameLogic.currentQuestionIndex].id;
  addComment(questionId, user, text);
  editor.innerHTML = "";
});

// 🔹 Renderiza um comentário
function renderComment(commentId, data, questionId, list, currentUser, prepend = false) {
  const likesByUser = data.likesByUser || {};
  const totalLikes = Object.keys(likesByUser).length;
  const likedByCurrentUser = currentUser && likesByUser[currentUser];

  const date = new Date(data.timestamp);
  const formattedTime = date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const div = document.createElement("div");
  div.classList.add("comment");

  const deleteButtonHTML = currentUser === data.userId ? 
    `<button class="delete-btn" data-cid="${commentId}" data-qid="${questionId}">🗑️</button>` : '';

  div.innerHTML = `
    <div class="comment-header">
      <img src="${data.userPhoto || 'default-profile.png'}" class="comment-avatar">
      <span class="comment-user">${data.userName || "Usuário"}</span>
      <span class="comment-time">${formattedTime}</span>
      ${deleteButtonHTML}
    </div>
    <div class="comment-text">${data.text}</div>
    <div style="width: 100%; display: flex; justify-content: flex-end; align-items: center; gap: 5px;">
      <button class="like-btn ${likedByCurrentUser ? 'liked' : ''}" data-cid="${commentId}" data-qid="${questionId}">
        ${likedByCurrentUser ? likedIconSVG : notLikedIconSVG} 
        <span class="like-count" style="color:${likedByCurrentUser ? '#2a87f0' : '#434343'}">${totalLikes}</span>
      </button>
    </div>
  `;

  if (prepend) list.prepend(div);
  else list.appendChild(div);
}

// 🔹 Curtir/Descurtir comentário
function toggleLikeComment(questionId, commentId) {
  const currentUser = window.firebaseServices.auth.currentUser;
  if (!currentUser) return alert("Você precisa estar logado para curtir.");

  const likeRef = window.firebaseServices.database.ref(`questoes/${questionId}/comentarios/${commentId}/likesByUser/${currentUser.uid}`);
  likeRef.transaction(currentValue => currentValue ? null : true);

  const btn = document.querySelector(`.like-btn[data-cid="${commentId}"]`);
  if (!btn) return;

  const likeCountSpan = btn.querySelector(".like-count");
  let totalLikes = parseInt(likeCountSpan.textContent) || 0;
  const isCurrentlyLiked = btn.classList.contains("liked");
  const newLikedState = !isCurrentlyLiked;

  btn.classList.toggle("liked", newLikedState);
  totalLikes = newLikedState ? totalLikes + 1 : totalLikes - 1;
  likeCountSpan.textContent = totalLikes;
  likeCountSpan.style.color = newLikedState ? '#2a87f0' : '#434343';

  const likeBtnSvg = btn.querySelector("svg");
  if (likeBtnSvg) likeBtnSvg.outerHTML = newLikedState ? likedIconSVG : notLikedIconSVG;
}

// 🔹 Modal de confirmação de deleção
function showDeleteModal(questionId, commentId, divElement) {
  pendingDelete = { questionId, commentId, divElement };
  document.getElementById("delete-confirm-modal").style.display = "flex";
}

function hideDeleteModal() {
  pendingDelete = null;
  document.getElementById("delete-confirm-modal").style.display = "none";
}

// 🔹 Deletar comentário
function deleteComment(questionId, commentId, divElement) {
  const currentUser = window.firebaseServices.auth.currentUser;
  if (!currentUser) return alert("Você precisa estar logado para deletar.");

  const commentRef = window.firebaseServices.database.ref(`questoes/${questionId}/comentarios/${commentId}`);
  commentRef.once("value", snapshot => {
    const data = snapshot.val();
    if (!data) return;
    if (data.userId !== currentUser.uid) return alert("Você só pode deletar seus próprios comentários.");

    commentRef.remove(err => {
      if (err) return alert("Erro ao deletar comentário.");
      divElement.remove();
      allComments = allComments.filter(c => c.id !== commentId);
      renderedCount--;
    });
  });
}

// 🔹 Delegation para curtidas e deletar
document.getElementById("comments-list").addEventListener("click", e => {
  const likeBtn = e.target.closest(".like-btn");
  if (likeBtn) return toggleLikeComment(likeBtn.dataset.qid, likeBtn.dataset.cid);

  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn) {
    const divComment = deleteBtn.closest(".comment");
    showDeleteModal(deleteBtn.dataset.qid, deleteBtn.dataset.cid, divComment);
  }
});

// 🔹 Botões do modal
document.getElementById("confirm-delete-btn").addEventListener("click", () => {
  if (!pendingDelete) return;
  const { questionId, commentId, divElement } = pendingDelete;
  deleteComment(questionId, commentId, divElement);
  hideDeleteModal();
});

document.getElementById("cancel-delete-btn").addEventListener("click", hideDeleteModal);

// 🔹 Botão "Ver mais"
document.getElementById("load-more-comments").addEventListener("click", () => {
  const questionId = window.gameLogic.questions[window.gameLogic.currentQuestionIndex].id;
  renderNextComments(questionId);
});

// 🔹 Sanitização de HTML mantendo <b>, <i>, <u>, <p>, <br>
function sanitizeCommentHTML(html) {
  const div = document.createElement("div");
  div.innerHTML = html;

  const allowedTags = ['B', 'I', 'U', 'EM', 'STRONG', 'BR', 'P'];

  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return;
    else if (node.nodeType === Node.ELEMENT_NODE) {
      if (!allowedTags.includes(node.tagName)) {
        const frag = document.createDocumentFragment();
        node.childNodes.forEach(child => frag.appendChild(child.cloneNode(true)));
        node.replaceWith(frag);
      } else {
        Array.from(node.attributes).forEach(attr => node.removeAttribute(attr.name));
        Array.from(node.childNodes).forEach(cleanNode);
      }
    }
  }

  Array.from(div.childNodes).forEach(cleanNode);
  return div.innerHTML;
}

// 🔹 Normaliza quebras de linha do editor (Enter) em <br>
function normalizeEditorLineBreaks(html) {
  const div = document.createElement("div");
  div.innerHTML = html;

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/\r?\n/).forEach((line, index, arr) => {
        frag.appendChild(document.createTextNode(line));
        if (index < arr.length - 1) frag.appendChild(document.createElement('br'));
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(processNode);
      if ((node.tagName === 'DIV' || node.tagName === 'P') && node.childNodes.length > 0) {
        const frag = document.createDocumentFragment();
        Array.from(node.childNodes).forEach(child => frag.appendChild(child.cloneNode(true)));
        frag.appendChild(document.createElement('br'));
        node.replaceWith(frag);
      }
    }
  }

  Array.from(div.childNodes).forEach(processNode);
  return div.innerHTML;
}

// 🔹 Toolbar do editor
document.querySelectorAll(".comment-editor-toolbar button").forEach(btn => {
  btn.addEventListener("click", () => {
    const command = btn.dataset.command;
    if (command === "insertLineBreak") {
      document.execCommand('insertHTML', false, '<br>');
    } else {
      document.execCommand(command, false, null);
    }
  });
});
