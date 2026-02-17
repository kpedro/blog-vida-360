document.addEventListener("DOMContentLoaded", function () {
    // Se o post foi carregado do Supabase, não buscar .md
    if (window.postLoadedFromSupabase) return;
    const markdownFile = new URLSearchParams(window.location.search).get("post");
    if (markdownFile) {
        // Mostrar loading
        const postContent = document.getElementById("post-content");
        if (postContent) {
            postContent.innerHTML = '<div class="loading">Carregando post...</div>';
        }

        fetch(`posts/${markdownFile}.md`)
            .then((response) => {
                if (!response.ok) throw new Error("Erro ao carregar o arquivo.");
                return response.text();
            })
            .then((markdown) => {
                const html = marked.parse(markdown);
                if (postContent) {
                    postContent.innerHTML = html;
                    
                    // Lazy load de imagens
                    const images = postContent.querySelectorAll('img');
                    images.forEach(img => {
                        img.loading = 'lazy';
                        img.onerror = function() {
                            this.style.display = 'none';
                        };
                    });
                }
            })
            .catch((error) => {
                if (postContent) {
                    postContent.innerHTML = `
                        <div class="error-message">
                            <p>❌ Erro ao carregar o post! Por favor, tente novamente mais tarde.</p>
                            <p><small>${error.message}</small></p>
                        </div>
                    `;
                }
                console.error('Erro ao carregar post:', error);
            });
    } else {
        const postContent = document.getElementById("post-content");
        if (postContent) {
            postContent.innerHTML = "<p>Nenhum post foi especificado.</p>";
        }
    }
});