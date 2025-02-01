document.addEventListener("DOMContentLoaded", function () {
    // Renderização do post
    const markdownFile = new URLSearchParams(window.location.search).get("post"); // Alterado para "post"
    if (markdownFile) {
        fetch(`posts/${markdownFile}.md`) // Adicionado .md para buscar arquivos Markdown
            .then((response) => {
                if (!response.ok) throw new Error("Erro ao carregar o arquivo.");
                return response.text();
            })
            .then((markdown) => {
                const html = marked.parse(markdown); // Converte Markdown para HTML
                document.getElementById("post-content").innerHTML = html;

                // Atualiza a imagem do post (assumindo que a imagem tem o mesmo nome do arquivo Markdown)
                const postImage = document.getElementById("post-image");
                if (postImage) {
                    postImage.src = `assets/img/${markdownFile}.jpg`;
                    postImage.alt = `Imagem do artigo ${markdownFile}`;
                }
            })
            .catch((error) => {
                document.getElementById("post-content").innerHTML = `
                    <p>Erro ao carregar o post! Por favor, tente novamente mais tarde.</p>
                    <p>${error.message}</p>
                `;
            });
    } else {
        document.getElementById("post-content").innerHTML =
            "Nenhum post foi especificado.";
    }

    // Funcionalidade para os comentários
    const commentForm = document.getElementById("comment-form");
    const commentsDiv = document.getElementById("comments");

    commentForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const comment = document.getElementById("comment").value.trim();

        if (name && comment) {
            // Adicionar comentário à lista
            const newComment = document.createElement("div");
            newComment.classList.add("comment");
            newComment.innerHTML = `
                <strong>${name}:</strong>
                <p>${comment}</p>
            `;
            commentsDiv.appendChild(newComment);

            // Limpar formulário
            commentForm.reset();
        }
    });
});