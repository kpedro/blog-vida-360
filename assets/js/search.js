// Sistema de Busca de Posts
class SearchSystem {
    constructor() {
        this.posts = [];
        this.init();
    }

    async init() {
        await this.loadPosts();
        this.setupSearch();
    }

    // Carregar lista de posts
    async loadPosts() {
        const postsList = [
            { key: 'saude-mental', title: 'Como Cuidar da Saúde Mental no Dia a Dia', category: 'Saúde' },
            { key: 'produtividade', title: '5 Passos para Aumentar sua Produtividade', category: 'Produtividade' },
            { key: 'equilibrio-vida', title: 'Encontrando o Equilíbrio entre Trabalho e Vida Pessoal', category: 'Bem-estar' }
        ];

        // Carregar conteúdo dos posts para busca
        for (const post of postsList) {
            try {
                const response = await fetch(`posts/${post.key}.md`);
                if (response.ok) {
                    const content = await response.text();
                    post.content = content;
                    this.posts.push(post);
                }
            } catch (error) {
                console.error(`Erro ao carregar post ${post.key}:`, error);
            }
        }
    }

    // Configurar busca
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');

        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            this.search(query, searchResults);
        });

        // Buscar ao pressionar Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim().toLowerCase();
                this.search(query, searchResults);
            }
        });
    }

    // Realizar busca
    search(query, resultsContainer) {
        if (!resultsContainer) return;

        if (!query || query.length < 2) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            return;
        }

        const results = this.posts.filter(post => {
            const searchText = `${post.title} ${post.category} ${post.content || ''}`.toLowerCase();
            return searchText.includes(query);
        });

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">Nenhum resultado encontrado.</p>';
            resultsContainer.style.display = 'block';
            return;
        }

        let html = '<h3>Resultados da Busca:</h3><ul class="search-results-list">';
        results.forEach(post => {
            html += `
                <li>
                    <a href="post.html?post=${post.key}">
                        <strong>${post.title}</strong>
                        <span class="category">${post.category}</span>
                    </a>
                </li>
            `;
        });
        html += '</ul>';

        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';
    }
}

// Inicializar busca na página inicial
if (document.getElementById('search-input')) {
    document.addEventListener('DOMContentLoaded', () => {
        new SearchSystem();
    });
}
