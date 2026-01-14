// Sistema de Comentários Persistente
class CommentSystem {
    constructor() {
        this.storageKey = 'blog-vida-360-comments';
        this.init();
    }

    init() {
        this.loadComments();
        this.setupForm();
    }

    // Carregar comentários do localStorage
    loadComments() {
        const postKey = new URLSearchParams(window.location.search).get('post');
        if (!postKey) return;

        const commentsDiv = document.getElementById('comments');
        if (!commentsDiv) return;

        const allComments = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        const postComments = allComments[postKey] || [];

        if (postComments.length === 0) {
            commentsDiv.innerHTML = '<h3>Comentários:</h3><p>Ainda não há comentários. Seja o primeiro a comentar!</p>';
            return;
        }

        let html = '<h3>Comentários (' + postComments.length + '):</h3>';
        postComments.forEach((comment, index) => {
            const date = new Date(comment.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            html += `
                <div class="comment" data-index="${index}">
                    <div class="comment-header">
                        <strong>${this.escapeHtml(comment.name)}</strong>
                        <span class="comment-date">${date}</span>
                    </div>
                    <p>${this.escapeHtml(comment.comment)}</p>
                </div>
            `;
        });

        commentsDiv.innerHTML = html;
    }

    // Configurar formulário
    setupForm() {
        const form = document.getElementById('comment-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addComment();
        });
    }

    // Adicionar comentário
    addComment() {
        const postKey = new URLSearchParams(window.location.search).get('post');
        if (!postKey) {
            alert('Erro: Post não identificado.');
            return;
        }

        const nameInput = document.getElementById('name');
        const commentInput = document.getElementById('comment');

        if (!nameInput || !commentInput) return;

        const name = nameInput.value.trim();
        const comment = commentInput.value.trim();

        if (!name || !comment) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        // Validar tamanho
        if (name.length > 100) {
            alert('Nome muito longo. Máximo 100 caracteres.');
            return;
        }

        if (comment.length > 1000) {
            alert('Comentário muito longo. Máximo 1000 caracteres.');
            return;
        }

        // Carregar comentários existentes
        const allComments = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        if (!allComments[postKey]) {
            allComments[postKey] = [];
        }

        // Adicionar novo comentário
        const newComment = {
            name: name,
            comment: comment,
            date: new Date().toISOString()
        };

        allComments[postKey].push(newComment);

        // Salvar
        localStorage.setItem(this.storageKey, JSON.stringify(allComments));

        // Limpar formulário
        nameInput.value = '';
        commentInput.value = '';

        // Recarregar comentários
        this.loadComments();

        // Feedback visual
        this.showSuccessMessage();
    }

    // Mostrar mensagem de sucesso
    showSuccessMessage() {
        const form = document.getElementById('comment-form');
        if (!form) return;

        const message = document.createElement('div');
        message.className = 'success-message';
        message.textContent = '✅ Comentário enviado com sucesso!';
        message.style.cssText = 'background: #4CAF50; color: white; padding: 10px; border-radius: 5px; margin-top: 10px; text-align: center;';
        
        form.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // Escapar HTML para prevenir XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new CommentSystem();
});
