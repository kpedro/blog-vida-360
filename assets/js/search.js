// Sistema de Busca de Posts (usa artigos do Supabase)
(function() {
    var posts = [];
    var searchResultsEl = null;

    function getSearchResultsEl() {
        return document.getElementById('search-results');
    }

    function loadPostsFromSupabase() {
        return new Promise(function(resolve) {
            function tryLoad(attempts) {
                var client = window.supabaseClient;
                if (client && client.getPosts) {
                    client.getPosts(100, 0).then(function(r) {
                        if (r.success && r.data && r.data.length) {
                            posts = r.data;
                        }
                        resolve();
                    }).catch(function() { resolve(); });
                    return;
                }
                if (attempts >= 25) {
                    resolve();
                    return;
                }
                setTimeout(function() { tryLoad(attempts + 1); }, 200);
            }
            tryLoad(0);
        });
    }

    function search(query, container) {
        if (!container) return;
        query = (query || '').trim().toLowerCase();
        if (query.length < 2) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        var results = posts.filter(function(post) {
            var titulo = (post.titulo || post.title || '').toLowerCase();
            var resumo = (post.resumo || post.excerpt || '').toLowerCase();
            var categoria = (post.categoria || '').toLowerCase();
            var text = titulo + ' ' + resumo + ' ' + categoria;
            return text.indexOf(query) !== -1;
        });

        if (results.length === 0) {
            container.innerHTML = '<p class="no-results" style="margin:0;color:#666;">Nenhum resultado encontrado.</p>';
            container.style.display = 'block';
            return;
        }

        var html = '<h3 style="margin:0 0 12px 0;font-size:1.1rem;">Resultados da Busca:</h3><ul class="search-results-list" style="list-style:none;padding:0;margin:0;">';
        results.forEach(function(post) {
            var slug = post.slug || '';
            var titulo = (post.titulo || post.title || 'Artigo').trim();
            var cat = (post.categoria || '').trim();
            html += '<li style="margin-bottom:10px;"><a href="post.html?post=' + encodeURIComponent(slug) + '" style="color:var(--blue-primary);text-decoration:none;">' +
                '<strong>' + escapeHtml(titulo) + '</strong>' +
                (cat ? ' <span style="color:#888;font-size:0.9em;">(' + escapeHtml(cat) + ')</span>' : '') +
                '</a></li>';
        });
        html += '</ul>';
        container.innerHTML = html;
        container.style.display = 'block';
    }

    function escapeHtml(s) {
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function setupSearch() {
        var searchInput = document.getElementById('search-input');
        searchResultsEl = getSearchResultsEl();
        if (!searchInput) return;

        searchInput.addEventListener('input', function(e) {
            search(e.target.value.trim(), getSearchResultsEl());
        });
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                search(searchInput.value.trim(), getSearchResultsEl());
            }
        });
    }

    function init() {
        loadPostsFromSupabase().then(function() {
            setupSearch();
        });
    }

    if (document.getElementById('search-input')) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
})();
