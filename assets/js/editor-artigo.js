// Editor de Artigos - JavaScript
let currentPostId = null;
let currentPostStatus = 'draft';
let editorMode = 'html'; // 'html' ou 'markdown'
const EDITOR_STORAGE_SHARE_URL = 'blog360_studio_share_url_v1';

function extractMissingColumnFromError(err) {
    const message = (err && (err.message || err.details || err.hint || String(err))) || '';
    const match = message.match(/'([^']+)'\s+column/i);
    return match ? match[1] : null;
}

async function saveWithSchemaFallback(supabaseClient, basePostData, postId) {
    const payload = { ...basePostData };
    const removed = [];

    for (let attempt = 0; attempt < 8; attempt++) {
        let result;
        if (postId) {
            result = await supabaseClient
                .from('blog360_posts')
                .update(payload)
                .eq('id', postId)
                .select();
        } else {
            result = await supabaseClient
                .from('blog360_posts')
                .insert([payload])
                .select();
        }

        if (!result.error) return { result, removedColumns: removed };

        const missingColumn = extractMissingColumnFromError(result.error);
        if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
            delete payload[missingColumn];
            removed.push(missingColumn);
            continue;
        }

        throw result.error;
    }

    throw new Error('Não foi possível adaptar o payload ao schema atual da tabela blog360_posts.');
}

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthentication();
    initEditor();
    const estudioPayload = peekBlog360EstudioPayload();
    const urlParams = new URLSearchParams(window.location.search);
    const postIdFromUrl = urlParams.get('id');
    if (postIdFromUrl) {
        currentPostId = postIdFromUrl;
        await loadPost(postIdFromUrl);
    }
    if (estudioPayload) {
        applyBlog360EstudioPayload(estudioPayload);
    }
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

/** Lê payload do Estúdio sem remover (para carregar o rascunho antes de aplicar). */
function peekBlog360EstudioPayload() {
    try {
        const raw = sessionStorage.getItem('blog360_estudio_payload');
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (!p || typeof p !== 'object') return null;
        return p;
    } catch (e) {
        console.warn('peekBlog360EstudioPayload:', e);
        return null;
    }
}

function consumeBlog360EstudioPayload() {
    const p = peekBlog360EstudioPayload();
    if (p) sessionStorage.removeItem('blog360_estudio_payload');
    return p;
}

/** Abre o Estúdio mantendo o ID do rascunho (imagem volta para o mesmo artigo). */
function openEstudioFromEditor() {
    const base = 'admin-estudio-conteudo.html';
    if (currentPostId) {
        window.location.href = `${base}?post_id=${encodeURIComponent(currentPostId)}`;
        return;
    }
    const title = (document.getElementById('post-title') && document.getElementById('post-title').value.trim()) || '';
    if (title && !window.confirm(
        'Este artigo ainda não foi salvo como rascunho. Salve o rascunho primeiro para a capa voltar ao mesmo artigo.\n\nAbrir o Estúdio mesmo assim?'
    )) {
        return;
    }
    window.location.href = base;
}

/** Conteúdo vindo do Estúdio de conteúdo (sessionStorage blog360_estudio_payload) */
function applyBlog360EstudioPayload(incoming) {
    try {
        const p = incoming || consumeBlog360EstudioPayload();
        if (!p) return;
        sessionStorage.removeItem('blog360_estudio_payload');

        if (p.postId) currentPostId = String(p.postId);

        const imageOnly = p.imageOnly === true || (!p.body && !!p.imageDataUrl && !p.title && !p.excerpt);
        const body = p.body ? String(p.body) : '';

        if (!imageOnly) {
            if (p.title) document.getElementById('post-title').value = String(p.title).slice(0, 120);
            if (p.excerpt) document.getElementById('post-excerpt').value = String(p.excerpt).slice(0, 200);

            if (body) {
                const md = document.getElementById('markdown-editor');
                const htmlEd = document.getElementById('editor-content');
                if (typeof isMarkdown === 'function' && isMarkdown(body)) {
                    md.value = body;
                    htmlEd.innerHTML = '';
                    if (typeof editorMode !== 'undefined' && editorMode === 'html') {
                        toggleEditorMode();
                    } else {
                        md.style.display = 'block';
                        htmlEd.style.display = 'none';
                        editorMode = 'markdown';
                        document.getElementById('markdown-actions').style.display = 'block';
                        document.getElementById('markdown-hint').style.display = 'inline';
                        document.getElementById('btn-mode-switch').textContent = '🌐 HTML';
                        const toolbarButtons = ['btn-bold', 'btn-italic', 'btn-underline', 'btn-h2', 'btn-h3', 'btn-link', 'btn-image'];
                        toolbarButtons.forEach(function (id) {
                            const b = document.getElementById(id);
                            if (b) b.disabled = true;
                        });
                    }
                } else {
                    htmlEd.innerHTML = body;
                }
            }
        }

        if (p.imageDataUrl && String(p.imageDataUrl).startsWith('data:')) {
            const urlInput = document.getElementById('image-url');
            const preview = document.getElementById('image-preview');
            if (urlInput) urlInput.value = p.imageDataUrl;
            if (preview) {
                preview.src = p.imageDataUrl;
                preview.style.display = 'block';
            }
        }
        const socialU = p.socialImageUrl && String(p.socialImageUrl).trim();
        if (socialU && /^https?:\/\//i.test(socialU)) {
            const si = document.getElementById('social-image-url');
            const sp = document.getElementById('social-image-preview');
            if (si) si.value = socialU;
            if (sp) {
                sp.src = socialU;
                sp.style.display = 'block';
            }
        }

        updatePreview();
        calculateSEOScore();
        const wc = document.getElementById('content-count');
        if (wc && body && !imageOnly) {
            const words = body.trim().split(/\s+/).filter(function (w) { return w.length > 0; }).length;
            wc.textContent = words;
        }
        alert(
            imageOnly
                ? 'Capa do Estúdio aplicada ao artigo. O texto do rascunho foi mantido — salve o rascunho quando estiver pronto.'
                : 'Conteúdo do Estúdio aplicado ao artigo. Revise e publique quando estiver pronto.'
        );
        refreshEditorShareUi(true);
    } catch (e) {
        console.warn('applyBlog360EstudioPayload:', e);
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
        refreshEditorShareUi(true);
    });
    
    // Contador de caracteres do resumo
    document.getElementById('post-excerpt').addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('excerpt-count').textContent = count;
        updatePreview();
        calculateSEOScore();
        refreshEditorShareUi(true);
    });
    
    // Contador de palavras do conteúdo HTML
    document.getElementById('editor-content').addEventListener('input', () => {
        const text = document.getElementById('editor-content').innerText;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        document.getElementById('content-count').textContent = words;
        calculateSEOScore();
        refreshEditorShareUi(true);
    });
    
    // Contador de palavras do conteúdo Markdown
    document.getElementById('markdown-editor').addEventListener('input', () => {
        const text = document.getElementById('markdown-editor').value;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        document.getElementById('content-count').textContent = words;
        calculateSEOScore();
        refreshEditorShareUi(true);
    });
    
    // Detectar Markdown ao colar no editor HTML
    document.getElementById('editor-content').addEventListener('paste', (e) => {
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        if (isMarkdown(pastedText)) {
            e.preventDefault();
            if (confirm('Parece que você colou Markdown. Deseja converter para HTML automaticamente?')) {
                convertMarkdownToHtml(pastedText);
            } else {
                document.execCommand('insertText', false, pastedText);
            }
        }
    });
    
    // Preview da imagem
    document.getElementById('image-url').addEventListener('input', (e) => {
        const url = e.target.value;
        const preview = document.getElementById('image-preview');
        if (url && preview) {
            preview.src = url;
            preview.style.display = 'block';
        } else if (preview) {
            preview.style.display = 'none';
        }
    });

    const socialIn = document.getElementById('social-image-url');
    if (socialIn) {
        socialIn.addEventListener('input', (e) => {
            const url = (e.target.value || '').trim();
            const preview = document.getElementById('social-image-preview');
            if (url && preview && /^https?:\/\//i.test(url)) {
                preview.src = url;
                preview.style.display = 'block';
            } else if (preview) {
                preview.style.display = 'none';
            }
        });
    }
    
    // Atualizar preview ao mudar categoria
    document.getElementById('post-category').addEventListener('change', () => {
        updatePreview();
        refreshEditorShareUi(true);
    });

    initEditorShareSocial();
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

        currentPostStatus = data.status || (data.publicado ? 'published' : 'draft');
        
        // Preencher formulário (suporta nomes em PT e EN para compatibilidade)
        document.getElementById('post-title').value = data.titulo || data.title || '';
        document.getElementById('post-category').value = data.categoria || data.category || '';
        document.getElementById('post-author').value = data.autor || data.author || '';
        document.getElementById('post-excerpt').value = data.resumo || data.excerpt || '';
        document.getElementById('post-tags').value = Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || '');
        document.getElementById('image-url').value = data.imagem_destaque || data.image_url || '';
        
        // Carregar conteúdo: mesma prioridade que post.html (evita conteudo legado com metatags)
        let content = typeof window.pickBlog360PostBodyRaw === 'function'
            ? window.pickBlog360PostBodyRaw(data)
            : (data.conteudo || data.content || data.conteudo_markdown || '');
        if (content && window.marked && isMarkdown(content)) {
            document.getElementById('markdown-editor').value = content;
            if (editorMode === 'html') {
                toggleEditorMode();
            }
        } else if (content) {
            if (typeof window.sanitizeArticleHtml === 'function') {
                content = window.sanitizeArticleHtml(content);
            }
            document.getElementById('editor-content').innerHTML = content;
        }
        
        const socialIn = document.getElementById('social-image-url');
        if (socialIn && (data.imagem_social_url || data.social_image_url)) {
            const su = String(data.imagem_social_url || data.social_image_url || '').trim();
            if (su) {
                socialIn.value = su;
                const sp = document.getElementById('social-image-preview');
                if (sp && /^https?:\/\//i.test(su)) {
                    sp.src = su;
                    sp.style.display = 'block';
                }
            }
        }

        const imgUrl = data.imagem_destaque || data.image_url || '';
        if (imgUrl) {
            const preview = document.getElementById('image-preview');
            if (preview) {
                preview.src = imgUrl;
                preview.style.display = 'block';
            }
        }

        updatePreview();
        calculateSEOScore();
        refreshEditorShareUi(true);
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

function applyFeaturedImageDataUrl(dataUrl) {
    if (!dataUrl || !String(dataUrl).startsWith('data:image/')) return;
    const preview = document.getElementById('image-preview');
    const urlInput = document.getElementById('image-url');
    if (urlInput) urlInput.value = dataUrl;
    if (preview) {
        preview.src = dataUrl;
        preview.style.display = 'block';
    }
    calculateSEOScore();
    refreshEditorShareUi(true);
}

// Upload de imagem no corpo do artigo (toolbar)
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        applyFeaturedImageDataUrl(e.target.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

/** Capa de destaque na barra lateral — PNG/JPG já com texto na imagem */
function handleFeaturedImageUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
        alert('Selecione um ficheiro de imagem (PNG, JPEG ou WebP).');
        event.target.value = '';
        return;
    }
    if (file.size > 12 * 1024 * 1024) {
        alert('Imagem demasiado grande (máx. 12 MB).');
        event.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        applyFeaturedImageDataUrl(e.target.result);
    };
    reader.onerror = () => alert('Não foi possível ler o ficheiro.');
    reader.readAsDataURL(file);
    event.target.value = '';
}

// Alternar entre modo HTML e Markdown
function toggleEditorMode() {
    const htmlEditor = document.getElementById('editor-content');
    const markdownEditor = document.getElementById('markdown-editor');
    const modeSwitch = document.getElementById('btn-mode-switch');
    const markdownActions = document.getElementById('markdown-actions');
    const markdownHint = document.getElementById('markdown-hint');
    const toolbarButtons = ['btn-bold', 'btn-italic', 'btn-underline', 'btn-h2', 'btn-h3', 'btn-link', 'btn-image'];
    
    if (editorMode === 'html') {
        // Mudar para Markdown
        editorMode = 'markdown';
        htmlEditor.style.display = 'none';
        markdownEditor.style.display = 'block';
        markdownActions.style.display = 'block';
        markdownHint.style.display = 'inline';
        modeSwitch.textContent = '🌐 HTML';
        modeSwitch.title = 'Alternar para modo HTML';
        
        // Desabilitar botões da toolbar (exceto upload)
        toolbarButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = true;
        });
        
        // Converter HTML atual para Markdown se houver conteúdo
        if (htmlEditor.innerHTML.trim()) {
            const htmlContent = htmlEditor.innerHTML;
            markdownEditor.value = convertHtmlToMarkdown(htmlContent);
        }
        markdownEditor.focus();
    } else {
        // Mudar para HTML
        editorMode = 'html';
        htmlEditor.style.display = 'block';
        markdownEditor.style.display = 'none';
        markdownActions.style.display = 'none';
        markdownHint.style.display = 'none';
        modeSwitch.textContent = '📝 Markdown';
        modeSwitch.title = 'Alternar para modo Markdown';
        
        // Habilitar botões da toolbar
        toolbarButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });
        
        // Converter Markdown atual para HTML se houver conteúdo
        if (markdownEditor.value.trim()) {
            const markdownContent = markdownEditor.value;
            htmlEditor.innerHTML = convertMarkdownToHtml(markdownContent, false);
        }
        htmlEditor.focus();
    }
}

// Verificar se texto é Markdown
function isMarkdown(text) {
    if (!text || text.length < 10) return false;
    
    const markdownPatterns = [
        /^#{1,6}\s+/m,                    // Headers (# ## ###)
        /\*\*.*?\*\*/,                    // Bold **text**
        /\*.*?\*/,                        // Italic *text*
        /\[.*?\]\(.*?\)/,                 // Links [text](url)
        /!\[.*?\]\(.*?\)/,                // Images ![alt](url)
        /^[-*+]\s+/m,                     // Unordered lists
        /^\d+\.\s+/m,                     // Ordered lists
        /^```[\s\S]*?```/m,               // Code blocks
        /`[^`]+`/,                        // Inline code
        /^>\s+/m                          // Blockquotes
    ];
    
    return markdownPatterns.some(pattern => pattern.test(text));
}

// Converter Markdown para HTML
function convertMarkdownToHtml(markdownText = null, updateEditor = true) {
    if (!window.marked) {
        alert('Biblioteca Marked.js não carregada. Recarregue a página.');
        return;
    }
    
    const markdown = markdownText || document.getElementById('markdown-editor').value;
    if (!markdown.trim()) {
        alert('Nenhum conteúdo Markdown para converter.');
        return;
    }
    
    try {
        // Configurar marked para converter corretamente
        marked.setOptions({
            breaks: true,
            gfm: true
        });
        
        const html = marked.parse(markdown);
        
        if (updateEditor) {
            document.getElementById('editor-content').innerHTML = html;
            document.getElementById('markdown-editor').value = '';
            toggleEditorMode(); // Voltar para modo HTML
            alert('✅ Markdown convertido para HTML com sucesso!');
        }
        
        return html;
    } catch (error) {
        console.error('Erro ao converter Markdown:', error);
        alert('Erro ao converter Markdown: ' + error.message);
        return null;
    }
}

// Converter HTML para Markdown (conversão básica)
function convertHtmlToMarkdown(htmlText = null) {
    const html = htmlText || document.getElementById('editor-content').innerHTML;
    if (!html.trim()) {
        alert('Nenhum conteúdo HTML para converter.');
        return '';
    }
    
    let markdown = html;
    
    // Converter headers
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
    
    // Converter negrito e itálico
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Converter links
    markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Converter imagens
    markdown = markdown.replace(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)');
    markdown = markdown.replace(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi, '![]($1)');
    
    // Converter listas não ordenadas
    markdown = markdown.replace(/<ul[^>]*>/gi, '');
    markdown = markdown.replace(/<\/ul>/gi, '\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    
    // Converter listas ordenadas (processar cada <ol> separadamente)
    const olMatches = markdown.match(/<ol[^>]*>[\s\S]*?<\/ol>/gi);
    if (olMatches) {
        olMatches.forEach(ol => {
            let olIndex = 1;
            const convertedOl = ol.replace(/<li[^>]*>(.*?)<\/li>/gi, (match, content) => {
                return `${olIndex++}. ${content.trim()}\n`;
            }).replace(/<ol[^>]*>/gi, '').replace(/<\/ol>/gi, '\n');
            markdown = markdown.replace(ol, convertedOl);
        });
    }
    
    // Converter parágrafos
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    
    // Converter quebras de linha
    markdown = markdown.replace(/<br[^>]*>/gi, '\n');
    
    // Remover tags HTML restantes
    markdown = markdown.replace(/<[^>]+>/g, '');
    
    // Decodificar entidades HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = markdown;
    markdown = tempDiv.textContent || tempDiv.innerText || '';
    
    // Limpar espaços extras
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
    
    if (!htmlText) {
        document.getElementById('markdown-editor').value = markdown;
        toggleEditorMode(); // Mudar para modo Markdown
        alert('✅ HTML convertido para Markdown!');
    }
    
    return markdown;
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
    
    // Obter conteúdo baseado no modo atual
    let content = '';
    if (editorMode === 'markdown') {
        content = document.getElementById('markdown-editor').value;
    } else {
        content = document.getElementById('editor-content').innerText;
    }
    
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

const BLOG360_COVERS_BUCKET = 'blog360-covers';

function isPublicHttpImageUrl(value) {
    const v = (value || '').trim();
    if (!/^https?:\/\//i.test(v)) return false;
    if (/^https?:\/\/localhost/i.test(v)) return false;
    if (/^https?:\/\/127\.0\.0\.1/i.test(v)) return false;
    if (/^data:/i.test(v) || /^blob:/i.test(v)) return false;
    return true;
}

/**
 * Envia capa em data URL ao Storage público; devolve URL https para og:image e para o artigo.
 */
async function tryUploadFeaturedDataUrl(supabaseClient, dataUrl, slug) {
    if (!dataUrl || typeof dataUrl !== 'string' || !/^data:image\//i.test(dataUrl) || !/;base64,/i.test(dataUrl)) {
        return { publicUrl: null, error: null };
    }
    const comma = dataUrl.indexOf(',');
    if (comma < 0) return { publicUrl: null, error: 'Data URL inválida' };
    const header = dataUrl.slice(0, comma);
    const base64 = dataUrl.slice(comma + 1).replace(/\s/g, '');
    const mimeMatch = header.match(/^data:(image\/[a-z0-9.+-]+)/i);
    const mime = (mimeMatch ? mimeMatch[1] : 'image/png').toLowerCase();
    let ext = 'png';
    if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('gif')) ext = 'gif';

    let binary;
    try {
        binary = atob(base64);
    } catch (e) {
        return { publicUrl: null, error: 'Base64 inválido' };
    }
    if (binary.length > 4.5 * 1024 * 1024) {
        return { publicUrl: null, error: 'Imagem demasiado grande (máx. ~4,5 MB)' };
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blobType = ext === 'jpg' ? 'image/jpeg' : mime;
    const blob = new Blob([bytes], { type: blobType });

    const safeSlug = (slug || 'post').replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'post';
    const path = `posts/${safeSlug}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabaseClient.storage.from(BLOG360_COVERS_BUCKET).upload(path, blob, {
        contentType: blob.type,
        upsert: false,
    });
    if (upErr) {
        return { publicUrl: null, error: upErr.message || String(upErr) };
    }
    const { data } = supabaseClient.storage.from(BLOG360_COVERS_BUCKET).getPublicUrl(path);
    return { publicUrl: data && data.publicUrl ? data.publicUrl : null, error: null };
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
        const socialImageUrl = (document.getElementById('social-image-url') && document.getElementById('social-image-url').value.trim()) || '';
        
        // Obter conteúdo baseado no modo atual
        let contentHtml = '';
        if (editorMode === 'markdown') {
            const markdownContent = document.getElementById('markdown-editor').value;
            if (markdownContent.trim() && window.marked) {
                contentHtml = marked.parse(markdownContent);
            } else {
                contentHtml = document.getElementById('editor-content').innerHTML;
            }
        } else {
            contentHtml = document.getElementById('editor-content').innerHTML;
        }

        if (typeof window.sanitizeArticleHtml === 'function' && contentHtml) {
            contentHtml = window.sanitizeArticleHtml(contentHtml);
        }
        
        if (!title || !category || !excerpt) {
            alert('Por favor, preencha todos os campos obrigatórios (Título, Categoria e Resumo)');
            return;
        }
        
        const slug = title.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'artigo';
        
        let imageUrlFinal = imageUrl || null;
        let socialUrlFinal = socialImageUrl || null;

        if (imageUrlFinal && /^data:image\//i.test(imageUrlFinal)) {
            const { publicUrl, error: upErr } = await tryUploadFeaturedDataUrl(supabaseClient, imageUrlFinal, slug);
            if (publicUrl) {
                imageUrlFinal = publicUrl;
                if (!socialUrlFinal) socialUrlFinal = publicUrl;
                const imgEl = document.getElementById('image-url');
                if (imgEl) imgEl.value = publicUrl;
                const sEl = document.getElementById('social-image-url');
                if (sEl && !socialImageUrl.trim()) {
                    sEl.value = publicUrl;
                    const sPr = document.getElementById('social-image-preview');
                    if (sPr) {
                        sPr.src = publicUrl;
                        sPr.style.display = 'block';
                    }
                }
                const iPr = document.getElementById('image-preview');
                if (iPr) {
                    iPr.src = publicUrl;
                    iPr.style.display = 'block';
                }
            } else if (upErr && status === 'published') {
                console.warn('Upload capa Storage:', upErr);
            }
        }

        // Regra anti-erro para publicação: precisa de URL pública para preview em redes.
        if (status === 'published') {
            const hasSocialPublic = isPublicHttpImageUrl(socialUrlFinal);
            const hasFeaturedPublic = isPublicHttpImageUrl(imageUrlFinal);
            if (!hasSocialPublic && !hasFeaturedPublic) {
                alert(
                    'Para publicar com preview correto no WhatsApp/Facebook, informe uma imagem pública (https).\n\n' +
                    'Como resolver:\n' +
                    '1) Cole uma URL https em «Imagem para redes sociais», ou\n' +
                    '2) Use uma imagem de capa https, ou\n' +
                    '3) Configure o bucket blog360-covers no Supabase para upload automático da capa.\n\n' +
                    'Sem isso, o link pode sair sem imagem ao compartilhar.'
                );
                return;
            }
            if (!hasSocialPublic && hasFeaturedPublic) {
                socialUrlFinal = imageUrlFinal;
                const sElAuto = document.getElementById('social-image-url');
                if (sElAuto && !sElAuto.value.trim()) sElAuto.value = imageUrlFinal;
            }
        }

        const tagsArray = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
        const publishedAt = status === 'published' ? new Date().toISOString() : null;
        
        const postData = {
            titulo: title,
            slug,
            conteudo_markdown: contentHtml || '', // NOT NULL no Supabase
            resumo: excerpt || null,
            categoria: category || null,
            tags: tagsArray,
            imagem_destaque: imageUrlFinal || null,
            imagem_social_url: socialUrlFinal || null,
            publicado: status === 'published',
            status: status,
            published_at: publishedAt,
            content: contentHtml,
            author: authorVal || null
        };
        
        const { result, removedColumns } = await saveWithSchemaFallback(supabaseClient, postData, currentPostId);
        if (removedColumns && removedColumns.length) {
            console.warn('Colunas ausentes no schema atual, removidas automaticamente:', removedColumns.join(', '));
        }
        if (!currentPostId && result.data && result.data[0]) currentPostId = result.data[0].id;
        currentPostStatus = status;

        refreshEditorShareUi(true);
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

function getEditorCategoryLabel() {
    const sel = document.getElementById('post-category');
    if (!sel || sel.selectedIndex < 0) return '';
    const opt = sel.options[sel.selectedIndex];
    return opt ? String(opt.textContent || opt.label || '').trim() : '';
}

function slugFromTitle(title) {
    return String(title || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getEditorArticleSlug() {
    const slugEl = document.getElementById('preview-slug');
    const fromPreview = slugEl ? String(slugEl.textContent || '').trim() : '';
    if (fromPreview && fromPreview !== 'slug-do-artigo') return fromPreview;
    const title = document.getElementById('post-title') && document.getElementById('post-title').value.trim();
    return slugFromTitle(title) || '';
}

function getEditorShareUrlDefault() {
    const slug = getEditorArticleSlug();
    const base = (window.Vida360ShareMessage && window.Vida360ShareMessage.DEFAULT_SITE) || 'https://www.blogvida360.com.br/';
    const root = base.replace(/\/$/, '');
    if (slug) return `${root}/post.html?post=${encodeURIComponent(slug)}`;
    try {
        const saved = localStorage.getItem(EDITOR_STORAGE_SHARE_URL);
        if (saved && saved.trim()) return saved.trim();
    } catch (_) { /* ignore */ }
    return base;
}

function persistEditorShareUrl(url) {
    try {
        localStorage.setItem(EDITOR_STORAGE_SHARE_URL, String(url || '').trim());
    } catch (_) { /* ignore */ }
}

function getEditorShareUrlValue() {
    const el = document.getElementById('editor-share-url');
    const v = el && String(el.value || '').trim();
    return v || getEditorShareUrlDefault();
}

function getEditorShareSourceText() {
    const title = document.getElementById('post-title') && document.getElementById('post-title').value.trim();
    const excerpt = document.getElementById('post-excerpt') && document.getElementById('post-excerpt').value.trim();
    let body = '';
    if (editorMode === 'markdown') {
        body = document.getElementById('markdown-editor') && document.getElementById('markdown-editor').value.trim();
    } else {
        body = document.getElementById('editor-content') && document.getElementById('editor-content').innerText.trim();
    }
    const parts = [];
    if (title) parts.push(title);
    if (excerpt) parts.push(excerpt);
    if (body) parts.push(body.slice(0, 900));
    return parts.join('\n\n');
}

function buildShareMessageFromEditor() {
    const src = getEditorShareSourceText();
    if (!window.Vida360ShareMessage || typeof window.Vida360ShareMessage.buildShareMessage !== 'function') {
        const link = getEditorShareUrlValue();
        return src ? `${src}\n\n👉 SAIBA MAIS:\n${link}` : '';
    }
    return window.Vida360ShareMessage.buildShareMessage({
        text: src,
        shareUrl: getEditorShareUrlValue(),
        category: getEditorCategoryLabel(),
    });
}

function editorHasShareableContent() {
    const title = document.getElementById('post-title') && document.getElementById('post-title').value.trim();
    const excerpt = document.getElementById('post-excerpt') && document.getElementById('post-excerpt').value.trim();
    return Boolean(title || excerpt);
}

function refreshEditorShareUi(regenerate) {
    const card = document.getElementById('editor-share-social-card');
    const msgEl = document.getElementById('editor-share-message');
    const urlEl = document.getElementById('editor-share-url');
    const draftNote = document.getElementById('editor-share-draft-note');
    const btnDl = document.getElementById('btn-editor-download-cover');
    if (!card || !msgEl) return;

    const visible = editorHasShareableContent();
    card.style.display = visible ? 'block' : 'none';
    if (!visible) {
        msgEl.value = '';
        return;
    }

    if (draftNote) {
        draftNote.style.display = currentPostStatus !== 'published' ? 'block' : 'none';
    }

    if (urlEl) {
        const cur = String(urlEl.value || '').trim();
        const auto = getEditorShareUrlDefault();
        if (!cur) {
            urlEl.value = auto;
        } else if (regenerate === true && getEditorArticleSlug() && auto.includes('post.html?post=')) {
            urlEl.value = auto;
        }
    }

    if (regenerate !== false || !String(msgEl.value || '').trim()) {
        msgEl.value = buildShareMessageFromEditor();
    }

    const coverUrl = document.getElementById('image-url') && document.getElementById('image-url').value.trim();
    const hasLocalCover = /^data:image\//i.test(coverUrl);
    if (btnDl) btnDl.style.display = hasLocalCover ? 'inline-block' : 'none';
}

async function copyEditorShareMessage() {
    const msgEl = document.getElementById('editor-share-message');
    const text = (msgEl && String(msgEl.value || '').trim()) || buildShareMessageFromEditor();
    if (!text) {
        alert('Preencha título ou resumo antes de compartilhar.');
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        alert('Texto copiado. Cole no WhatsApp, Instagram ou Facebook.');
    } catch (_) {
        if (msgEl) {
            msgEl.focus();
            msgEl.select();
        }
        alert('Não foi possível copiar automaticamente. Selecione o texto e use Ctrl+C.');
    }
}

function shareEditorWhatsApp() {
    const text = (document.getElementById('editor-share-message') && document.getElementById('editor-share-message').value.trim())
        || buildShareMessageFromEditor();
    if (!text) {
        alert('Preencha título ou resumo antes de compartilhar.');
        return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

function shareEditorTelegram() {
    const text = (document.getElementById('editor-share-message') && document.getElementById('editor-share-message').value.trim())
        || buildShareMessageFromEditor();
    const url = getEditorShareUrlValue();
    const short = text.split('\n\n👉')[0] || text.slice(0, 500);
    window.open(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(short)}`,
        '_blank',
        'noopener,noreferrer'
    );
}

function shareEditorFacebook() {
    const socialUrl = document.getElementById('social-image-url') && document.getElementById('social-image-url').value.trim();
    const featured = document.getElementById('image-url') && document.getElementById('image-url').value.trim();
    const sharePageUrl = getEditorShareUrlValue();
    if (!sharePageUrl) {
        alert('Informe o link do artigo.');
        return;
    }
    if (currentPostStatus !== 'published' && !isPublicHttpImageUrl(socialUrl) && !isPublicHttpImageUrl(featured)) {
        alert(
            'Para o Facebook mostrar a capa no link, publique o artigo ou preencha «Imagem para redes sociais» com uma URL https pública.\n\n' +
            'A partilha do link será aberta mesmo assim.'
        );
    }
    window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharePageUrl)}`,
        '_blank',
        'noopener,noreferrer,width=600,height=400'
    );
}

function downloadEditorCoverForShare() {
    const coverUrl = document.getElementById('image-url') && document.getElementById('image-url').value.trim();
    if (!coverUrl || !/^data:image\//i.test(coverUrl)) {
        alert('Carregue uma capa no campo «Imagem de destaque» primeiro.');
        return;
    }
    const slug = getEditorArticleSlug() || 'capa';
    const a = document.createElement('a');
    a.href = coverUrl;
    a.download = `vida360-${slug}-${Date.now()}.png`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function initEditorShareSocial() {
    const urlEl = document.getElementById('editor-share-url');
    if (urlEl && !String(urlEl.value || '').trim()) {
        urlEl.value = getEditorShareUrlDefault();
    }
    if (urlEl) {
        urlEl.addEventListener('change', () => {
            persistEditorShareUrl(urlEl.value);
            refreshEditorShareUi(true);
        });
        urlEl.addEventListener('blur', () => persistEditorShareUrl(urlEl.value));
    }
    const imgUrl = document.getElementById('image-url');
    if (imgUrl) {
        imgUrl.addEventListener('input', () => refreshEditorShareUi(false));
    }
    const socialImg = document.getElementById('social-image-url');
    if (socialImg) {
        socialImg.addEventListener('input', () => refreshEditorShareUi(false));
    }

    const btnWa = document.getElementById('btn-editor-share-whatsapp');
    if (btnWa) btnWa.addEventListener('click', shareEditorWhatsApp);
    const btnCp = document.getElementById('btn-editor-share-copy');
    if (btnCp) btnCp.addEventListener('click', () => void copyEditorShareMessage());
    const btnTg = document.getElementById('btn-editor-share-telegram');
    if (btnTg) btnTg.addEventListener('click', shareEditorTelegram);
    const btnFb = document.getElementById('btn-editor-share-facebook');
    if (btnFb) btnFb.addEventListener('click', shareEditorFacebook);
    const btnRf = document.getElementById('btn-editor-share-refresh');
    if (btnRf) btnRf.addEventListener('click', () => refreshEditorShareUi(true));
    const btnDl = document.getElementById('btn-editor-download-cover');
    if (btnDl) btnDl.addEventListener('click', downloadEditorCoverForShare);

    refreshEditorShareUi(true);
}
