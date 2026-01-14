// Otimizações de Performance

// Lazy Loading de Imagens
document.addEventListener('DOMContentLoaded', function() {
    if ('loading' in HTMLImageElement.prototype) {
        // Navegador suporta lazy loading nativo
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src || img.src;
        });
    } else {
        // Fallback para navegadores antigos
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
    }
});

// Preload de recursos críticos
const preloadResources = [
    'assets/css/style.css',
    'assets/js/script.js'
];

preloadResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.css') ? 'style' : 'script';
    document.head.appendChild(link);
});

// Cache de dados
const cache = {
    set: function(key, value, ttl = 3600000) { // 1 hora padrão
        const item = {
            value: value,
            expiry: Date.now() + ttl
        };
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify(item));
        } catch (e) {
            console.warn('Cache storage failed:', e);
        }
    },
    get: function(key) {
        try {
            const item = localStorage.getItem(`cache_${key}`);
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            if (Date.now() > parsed.expiry) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }
            return parsed.value;
        } catch (e) {
            return null;
        }
    }
};

// Debounce para busca
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar para uso global
window.blogCache = cache;
window.debounce = debounce;
