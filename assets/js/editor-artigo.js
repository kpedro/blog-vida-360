// Editor de Artigos - JavaScript
let currentPostId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthentication();
    initEditor();
    loadPostIfEditing();
});

// Verificar autenticação
async function checkAuthentication() {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient || !supabaseClient.auth) {
        console.error('❌ Supabase não inicializado no editor');
        window.location.href = 'admin-login.html';
        return;
    }
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        console.warn('⚠️ Nenhuma sessão encontrada');
        window.location.href = 'admin-login.html';
    }
}

// Inicializar editor
function initEditor() {
    // Contador de caracteres do título
    document.getElementById('post-title').addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('title-count').textContent = count;
        updatePreview();
        calculateSEOScore();
    });
    
    // Contador de caracteres do resumo
    document.getElementById('post-excerpt').addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('excerpt-count').textContent = count;
        updatePreview();
        calculateSEOScore();
    });
    
    // Contador de palavras do conteúdo
    document.getElementById('editor-content').addEventListener('input', () => {
        const text = document.getElementById('editor-content').innerText;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        document.getElementById('content-count').textContent = words;
        calculateSEOScore();
    });
    
    // Preview da imagem
    document.getElementById('image-url').addEventListener('input', (e) => {
        const url = e.target.value;
        if (url) {
            const preview = document.getElementById('image-preview');
            preview.src = url;
            preview.style.display = 'block';
        }
    });
    
    // Atualizar preview ao mudar categoria
    document.getElementById('post-category').addEventListener('change', updatePreview);
}

// Carregar post se estiver editando
function loadPostIfEditing() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (postId) {
        currentPostId = postId;
        loadPost(postId);
    }
}

// Carregar post existente (colunas do Supabase: titulo, resumo, categoria, autor, tags, imagem_destaque, conteudo)
async function loadPost(postId) {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');
        const { data, error } = await supabaseClient
            .from('blog360_posts')
            .select('*')
            .eq('id', postId)
            .single();
        
        if (error) throw error;
        
        // Preencher formulário (suporta nomes em PT e EN para compatibilidade)
        document.getElementById('post-title').value = data.titulo || data.title || '';
        document.getElementById('post-category').value = data.categoria || data.category || '';
        document.getElementById('post-author').value = data.autor || data.author || '';
        document.getElementById('post-excerpt').value = data.resumo || data.excerpt || '';
        document.getElementById('post-tags').value = Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || '');
        document.getElementById('image-url').value = data.imagem_destaque || data.image_url || '';
        document.getElementById('editor-content').innerHTML = data.conteudo || data.content || '';
        
        updatePreview();
        calculateSEOScore();
    } catch (error) {
        console.error('Erro ao carregar post:', error);
        alert('Erro ao carregar o artigo');
    }
}

// Formatar texto
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('editor-content').focus();
}

// Inserir heading
function insertHeading(tag) {
    const selection = window.getSelection();
    const text = selection.toString() || 'Título';
    document.execCommand('insertHTML', false, `<${tag}>${text}</${tag}>`);
}

// Inserir link
function insertLink() {
    const url = prompt('Digite a URL:');
    if (url) {
        const text = window.getSelection().toString() || url;
        document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${text}</a>`);
    }
}

// Inserir imagem
function insertImage() {
    const url = prompt('Digite a URL da imagem:');
    if (url) {
        document.execCommand('insertHTML', false, `<img src="${url}" alt="Imagem" style="max-width: 100%; height: auto; margin: 20px 0;">`);
    }
}

// Upload de imagem
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('image-preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            document.getElementById('image-url').value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Atualizar preview
function updatePreview() {
    const title = document.getElementById('post-title').value || 'Título do seu artigo';
    const excerpt = document.getElementById('post-excerpt').value || 'Descrição do artigo aparecerá aqui...';
    const category = document.getElementById('post-category').value || 'artigo';
    
    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-description').textContent = excerpt;
    
    // Gerar slug
    const slug = title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    document.getElementById('preview-slug').textContent = slug;
}

// Calcular SEO Score
function calculateSEOScore() {
    let score = 0;
    
    const title = document.getElementById('post-title').value;
    const excerpt = document.getElementById('post-excerpt').value;
    const content = document.getElementById('editor-content').innerText;
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // Título (0-25 pontos)
    if (title.length >= 30 && title.length <= 60) score += 25;
    else if (title.length > 0) score += 10;
    
    // Descrição (0-25 pontos)
    if (excerpt.length >= 120 && excerpt.length <= 160) score += 25;
    else if (excerpt.length > 0) score += 10;
    
    // Conteúdo (0-30 pontos)
    if (words >= 300) score += 30;
    else if (words >= 150) score += 15;
    else if (words > 0) score += 5;
    
    // Imagem (0-10 pontos)
    if (document.getElementById('image-url').value) score += 10;
    
    // Tags (0-10 pontos)
    if (document.getElementById('post-tags').value) score += 10;
    
    // Atualizar display
    const scoreElement = document.getElementById('seo-score');
    scoreElement.textContent = score;
    
    scoreElement.className = 'score-circle';
    if (score >= 80) scoreElement.classList.add('score-good');
    else if (score >= 50) scoreElement.classList.add('score-medium');
    else scoreElement.classList.add('score-bad');
}

// Salvar rascunho
async function saveDraft() {
    await savePost('draft');
}

// Publicar post
async function publishPost() {
    if (!validatePost()) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
    }
    
    if (confirm('Tem certeza que deseja publicar este artigo?')) {
        await savePost('published');
    }
}

// Validar post
function validatePost() {
    const title = document.getElementById('post-title').value;
    const category = document.getElementById('post-category').value;
    const excerpt = document.getElementById('post-excerpt').value;
    const content = document.getElementById('editor-content').innerText;
    
    return title && category && excerpt && content.length > 100;
}

// Salvar post (colunas existentes no Supabase: titulo, slug, conteudo_markdown, resumo, categoria, tags, imagem_destaque, publicado, status, published_at, content, author)
async function savePost(status) {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            throw new Error('Supabase não inicializado');
        }
        
        const title = document.getElementById('post-title').value.trim();
        const category = document.getElementById('post-category').value;
        const authorVal = document.getElementById('post-author').value.trim();
        const excerpt = document.getElementById('post-excerpt').value.trim();
        const tagsStr = document.getElementById('post-tags').value.trim();
        const imageUrl = document.getElementById('image-url').value.trim();
        const contentHtml = document.getElementById('editor-content').innerHTML;
        
        if (!title || !category || !excerpt) {
            alert('Por favor, preencha todos os campos obrigatórios (Título, Categoria e Resumo)');
            return;
        }
        
        const slug = title.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'artigo';
        
        const tagsArray = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
        const publishedAt = status === 'published' ? new Date().toISOString() : null;
        
        const postData = {
            titulo: title,
            slug,
            conteudo_markdown: contentHtml || '', // NOT NULL no Supabase
            resumo: excerpt || null,
            categoria: category || null,
            tags: tagsArray,
            imagem_destaque: imageUrl || null,
            publicado: status === 'published',
            status: status,
            published_at: publishedAt,
            content: contentHtml,
            author: authorVal || null
        };
        
        let result;
        if (currentPostId) {
            result = await supabaseClient
                .from('blog360_posts')
                .update(postData)
                .eq('id', currentPostId)
                .select();
        } else {
            result = await supabaseClient
                .from('blog360_posts')
                .insert([postData])
                .select();
            if (result.data && result.data[0]) currentPostId = result.data[0].id;
        }
        
        if (result.error) {
            console.error('Erro do Supabase:', result.error);
            throw result.error;
        }
        
        alert(status === 'published' ? '✅ Artigo publicado com sucesso!' : '💾 Rascunho salvo!');
        if (status === 'published') {
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        }
    } catch (error) {
        console.error('Erro ao salvar post:', error);
        alert('Erro ao salvar o artigo: ' + (error.message || 'Erro desconhecido') + '. Verifique o console.');
    }
}
