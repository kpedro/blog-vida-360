// Admin Dashboard JavaScript (usa window.supabaseClient após DOMContentLoaded)
// Updated: 2026-02-17 - Removida declaração duplicada de supabaseClient
// Usar apenas window.supabaseClient para evitar conflito com supabase.js
const ABOUT_PHOTO_STORAGE_KEY = 'blog360_about_photo_url';
const ABOUT_PHOTO_FALLBACK = 'assets/images/og-banner.png';
const ABOUT_PHOTO_BUCKET_CANDIDATES = ['blog-media', 'blog360-media', 'public'];
let aboutPhotoPendingFile = null;

// Verificar autenticação ao carregar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📦 Dashboard carregado. Verificando Supabase...');
    
    // Aguardar um pouco para garantir que os scripts foram carregados
    if (!window.supabaseClient) {
        console.warn('⚠️ Supabase client não encontrado. Aguardando...');
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Usar window.supabaseClient diretamente (sem criar variável local)
    const supabaseClient = window.supabaseClient;
    
    if (!supabaseClient) {
        console.error('❌ Supabase não inicializado após espera');
        console.log('window.supabaseClient:', window.supabaseClient);
        console.log('window.VITE_SUPABASE_URL:', window.VITE_SUPABASE_URL);
        console.log('window.VITE_SUPABASE_ANON_KEY:', window.VITE_SUPABASE_ANON_KEY ? 'Definida' : 'Não definida');
        window.location.href = 'admin-login.html';
        return;
    }
    
    console.log('✅ Supabase client encontrado');
    await checkAuthentication();
    await loadUserInfo();
    initTabs();
    await loadDashboardData();
});

// Verificar se está autenticado
function getLoginUrl() {
    return window.location.origin + window.location.pathname.replace('admin-dashboard.html', 'admin-login.html') + '?reason=session';
}

async function checkAuthentication() {
    console.log('🔍 Verificando autenticação...');
    
    const client = window.supabaseClient;
    if (!client || !client.auth) {
        console.error('❌ Supabase não inicializado');
        window.location.replace(getLoginUrl());
        return;
    }

    // Primeiro tentar getSession() (mais rápido, usa cache)
        const { data: { session } } = await client.auth.getSession();
    console.log('📋 Sessão encontrada (getSession):', session ? 'Sim' : 'Não');
    
    if (session) {
        console.log('✅ Usuário autenticado:', session.user.email);
        return; // Sessão válida, pode continuar
    }

    // Se não encontrou sessão, tentar getUser() (faz requisição ao servidor)
    console.log('🔄 Sessão não encontrada no cache. Verificando com servidor...');
    const { data: { user }, error } = await client.auth.getUser();
    
    if (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        window.location.replace(getLoginUrl());
        return;
    }
    
    if (!user) {
        console.warn('⚠️ Nenhum usuário autenticado encontrado');
        window.location.replace(getLoginUrl());
        return;
    }
    
    console.log('✅ Usuário autenticado (getUser):', user.email);
}

// Carregar informações do usuário
async function loadUserInfo() {
    try {
        const userEmailElement = document.getElementById('user-email');
        if (!userEmailElement) {
            console.warn('⚠️ Elemento user-email não encontrado');
            return;
        }

        // Usar window.supabaseClient diretamente
        const client = window.supabaseClient;
        if (!client || !client.auth) {
            console.error('❌ Supabase client não disponível em loadUserInfo');
            userEmailElement.textContent = 'Erro ao conectar';
            return;
        }

        console.log('🔍 Carregando informações do usuário...');
        const { data: { user }, error } = await client.auth.getUser();
        
        if (error) {
            console.error('❌ Erro ao carregar informações do usuário:', error);
            userEmailElement.textContent = 'Erro ao carregar';
            return;
        }
        
        if (user && user.email) {
            userEmailElement.textContent = user.email;
            console.log('✅ Email do usuário carregado:', user.email);
        } else {
            // Tentar pegar da sessão como fallback
            const { data: { session } } = await client.auth.getSession();
            if (session && session.user && session.user.email) {
                userEmailElement.textContent = session.user.email;
                console.log('✅ Email do usuário carregado da sessão:', session.user.email);
            } else {
                userEmailElement.textContent = 'Usuário não encontrado';
                console.warn('⚠️ Usuário não encontrado');
            }
        }
    } catch (err) {
        console.error('❌ Erro em loadUserInfo:', err);
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = 'Erro ao carregar';
        }
    }
}

// Logout
async function logout() {
    const client = window.supabaseClient;
    if (client && client.auth) {
        await client.auth.signOut();
    }
    window.location.href = 'admin-login.html';
}

// Sistema de Tabs
function initTabs() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover active de todos
            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            // Adicionar active no clicado
            link.classList.add('active');
            const tabId = link.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            // Carregar dados da tab
            loadTabData(tabId);
        });
    });
}

// Carregar dados da tab
async function loadTabData(tabId) {
    switch(tabId) {
        case 'visao-geral':
            await loadOverviewData();
            break;
        case 'inscritos':
            await loadAllLeads();
            break;
        case 'postagens':
            await loadAllPosts();
            break;
        case 'campanhas':
            await loadAllCampaigns();
            break;
        case 'protocolos':
            await loadAllProtocols();
            break;
        case 'ebooks':
            await loadAllEbooks();
            break;
        case 'quizzes':
            await loadAllQuizzes();
            break;
    }
}

// Carregar dados do dashboard
async function loadDashboardData() {
    await loadStats();
    await loadRecentLeads();
    await loadAboutPhotoSettings();
}

// Carregar estatísticas
async function loadStats() {
    try {
        const client = window.supabaseClient;
        if (!client) {
            console.error('❌ Supabase client não disponível');
            return;
        }
        
        const { count: totalLeads } = await client
            .from('blog360_leads')
            .select('*', { count: 'exact', head: true });
        document.getElementById('stat-total-leads').textContent = totalLeads ?? 0;

        const { count: totalPosts } = await client
            .from('blog360_posts')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published');
        document.getElementById('stat-total-posts').textContent = totalPosts ?? 0;

        const { count: totalCampaigns } = await client
            .from('blog360_email_campaigns')
            .select('*', { count: 'exact', head: true })
            .not('enviado_em', 'is', null);
        document.getElementById('stat-total-campaigns').textContent = totalCampaigns ?? 0;
        document.getElementById('stat-open-rate').textContent = '0%';
    } catch (error) {
        console.error('Erro ao carregar stats:', error);
        document.getElementById('stat-total-posts').textContent = '0';
    }
}

// Carregar últimos inscritos
async function loadRecentLeads() {
    try {
        const client = window.supabaseClient;
        if (!client) {
            console.error('❌ Supabase client não disponível');
            return;
        }
        
        const { data: leads, error } = await client
            .from('blog360_leads')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const tbody = document.getElementById('recent-leads');
        
        if (!leads || leads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum inscrito ainda</td></tr>';
            return;
        }
        
        tbody.innerHTML = leads.map(lead => `
            <tr>
                <td>${lead.email}</td>
                <td>${lead.nome || '-'}</td>
                <td>${formatDate(lead.created_at)}</td>
                <td>${lead.origem || 'Direto'}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar leads:', error);
        document.getElementById('recent-leads').innerHTML = 
            '<tr><td colspan="4" class="empty-state">Erro ao carregar dados</td></tr>';
    }
}

// Carregar todos os inscritos
async function loadAllLeads() {
    try {
        const client = window.supabaseClient;
        if (!client) {
            console.error('❌ Supabase client não disponível');
            return;
        }
        
        const { data: leads, error } = await client
            .from('blog360_leads')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('all-leads');
        
        if (!leads || leads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum inscrito ainda</td></tr>';
            return;
        }
        
        tbody.innerHTML = leads.map(lead => `
            <tr>
                <td>${lead.email}</td>
                <td>${lead.nome || '-'}</td>
                <td>${formatDate(lead.created_at)}</td>
                <td>${lead.origem || 'Direto'}</td>
                <td><span class="badge published">Ativo</span></td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar todos os leads:', error);
    }
}

// Carregar todas as postagens (Supabase blog360_posts)
async function loadAllPosts() {
    const tbody = document.getElementById('all-posts');
    try {
        const client = window.supabaseClient;
        if (!client) {
            console.error('❌ Supabase client não disponível');
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erro ao conectar ao Supabase</td></tr>';
            return;
        }
        
        const { data: posts, error } = await client
            .from('blog360_posts')
            .select('id, titulo, categoria, status, published_at, created_at')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!posts || posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma postagem ainda. <a href="admin-editor-artigo.html">Criar primeiro artigo</a></td></tr>';
            return;
        }
        tbody.innerHTML = posts.map(post => {
            const titulo = post.titulo || post.title || 'Sem título';
            const categoria = post.categoria || post.category || '-';
            const status = post.status || 'draft';
            const dataExibir = post.published_at || post.created_at;
            return `<tr>
                <td><strong>${escapeHtml(titulo)}</strong></td>
                <td>${escapeHtml(categoria)}</td>
                <td><span class="badge ${status === 'published' ? 'published' : 'draft'}">${status === 'published' ? 'Publicado' : 'Rascunho'}</span></td>
                <td>${formatDate(dataExibir)}</td>
                <td class="action-buttons">
                    <a href="admin-editor-artigo.html?id=${post.id}" class="btn-icon" title="Editar">✏️</a>
                    <button type="button" class="btn-icon" title="Excluir" data-id="${post.id}" data-titulo="${escapeHtml(titulo).replace(/"/g, '&quot;')}" onclick="deletePost(this)">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar postagens:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erro ao carregar. Verifique a tabela blog360_posts no Supabase.</td></tr>';
    }
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
async function deletePost(btn) {
    const id = btn && btn.dataset && btn.dataset.id;
    const titulo = (btn && btn.dataset && btn.dataset.titulo) ? btn.dataset.titulo : 'este artigo';
    if (!id) return;
    const msgConfirm = 'Excluir o artigo "' + titulo + '"? Esta acao nao pode ser desfeita.';
    if (!confirm(msgConfirm)) return;
    try {
        const client = window.supabaseClient;
        if (!client) {
            alert('Erro: Supabase não disponível');
            return;
        }
        const { error } = await client.from('blog360_posts').delete().eq('id', id);
        if (error) throw error;
        alert('Artigo excluido.');
        loadAllPosts();
        loadStats();
    } catch (e) {
        console.error(e);
        alert('Erro ao excluir. Tente novamente.');
    }
}
window.deletePost = deletePost;

// Carregar todas as campanhas
async function loadAllCampaigns() {
    const tbody = document.getElementById('all-campaigns');
    try {
        const client = window.supabaseClient;
        if (!client) {
            console.error('❌ Supabase client não disponível');
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Erro ao conectar ao Supabase</td></tr>';
            return;
        }
        
        const { data: campaigns, error } = await client
            .from('blog360_email_campaigns')
            .select('id, nome, name, assunto, subject, status, enviado_em, created_at')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!campaigns || campaigns.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div style="padding: 2rem;">
                            <p style="font-size: 18px; margin-bottom: 10px;">📧 Nenhuma campanha criada ainda</p>
                            <p style="color: #7F8C8D;">Crie sua primeira campanha em <a href="admin-nova-campanha.html">Nova Campanha</a>.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        tbody.innerHTML = campaigns.map(c => {
            const nome = c.nome || c.name || 'Sem nome';
            const assunto = c.assunto || c.subject || '-';
            const dataExibir = c.enviado_em || c.created_at;
            const enviada = !!c.enviado_em;
            return `<tr>
                <td><strong>${escapeHtml(nome)}</strong></td>
                <td>${escapeHtml(assunto)}</td>
                <td>${c.enviados ?? '-'}</td>
                <td>${c.abertos ?? '-'}</td>
                <td>${formatDate(dataExibir)}</td>
                <td><span class="badge ${enviada ? 'published' : 'draft'}">${enviada ? 'Enviado' : 'Rascunho'}</span></td>
            </tr>`;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Erro ao carregar. Verifique a tabela blog360_email_campaigns no Supabase.</td></tr>';
    }
}

// Exportar leads para CSV
async function exportLeads() {
    try {
        const client = window.supabaseClient;
        if (!client) {
            alert('Erro: Supabase não disponível');
            return;
        }
        
        const { data: leads, error } = await client
            .from('blog360_leads')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!leads || leads.length === 0) {
            alert('Nenhum lead para exportar');
            return;
        }
        
        // Criar CSV
        const headers = ['Email', 'Nome', 'Data de Cadastro', 'Origem'];
        const rows = leads.map(lead => [
            lead.email,
            lead.nome || '',
            formatDate(lead.created_at),
            lead.origem || 'Direto'
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `leads-blog-vida360-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('Exportação concluída!');
        
    } catch (error) {
        console.error('Erro ao exportar leads:', error);
        alert('Erro ao exportar leads. Tente novamente.');
    }
}

// --- Protocolos (blog360_protocols) ---
async function loadAllProtocols() {
    const tbody = document.getElementById('all-protocols');
    if (!tbody) return;
    try {
        const client = window.supabaseClient;
        if (!client) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erro ao conectar ao Supabase</td></tr>';
            return;
        }
        const { data: list, error } = await client
            .from('blog360_protocols')
            .select('*')
            .order('ordem', { ascending: true })
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum protocolo cadastrado. Clique em "+ Novo Protocolo" para adicionar.</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(p => {
            const url = p.arquivo_url || '';
            const urlShort = url.length > 40 ? url.substring(0, 37) + '...' : url;
            return `<tr>
                <td><strong>${escapeHtml(p.titulo || '')}</strong></td>
                <td>${escapeHtml((p.descricao_curta || '').slice(0, 50))}${(p.descricao_curta || '').length > 50 ? '…' : ''}</td>
                <td>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(urlShort)}</a> <button type="button" class="btn-icon" title="Copiar link" onclick="copyProtocolLink('${url.replace(/'/g, "\\'")}')">📋</button>` : '-'}</td>
                <td><span class="badge ${p.ativo ? 'published' : 'draft'}">${p.ativo ? 'Sim' : 'Não'}</span></td>
                <td class="action-buttons">
                    <button type="button" class="btn-icon" title="Editar" onclick='openProtocolModal(${JSON.stringify(p)})'>✏️</button>
                    <button type="button" class="btn-icon" title="Excluir" data-id="${p.id}" data-titulo="${(p.titulo || '').replace(/"/g, '&quot;')}" onclick="deleteProtocol(this)">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar protocolos:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erro ao carregar. Execute o SQL BLOG360_PROTOCOLOS.sql no Supabase.</td></tr>';
    }
}
function openProtocolModal(protocol) {
    const modal = document.getElementById('protocol-modal');
    const titleEl = document.getElementById('protocol-modal-title');
    document.getElementById('protocol-id').value = protocol ? protocol.id : '';
    document.getElementById('protocol-titulo').value = protocol ? (protocol.titulo || '') : '';
    document.getElementById('protocol-descricao').value = protocol ? (protocol.descricao_curta || '') : '';
    document.getElementById('protocol-arquivo-url').value = protocol ? (protocol.arquivo_url || '') : '';
    document.getElementById('protocol-ativo').checked = protocol ? !!protocol.ativo : true;
    titleEl.textContent = protocol ? 'Editar Protocolo' : 'Novo Protocolo';
    if (modal) modal.style.display = 'flex';
}
function closeProtocolModal() {
    const modal = document.getElementById('protocol-modal');
    if (modal) modal.style.display = 'none';
}
async function saveProtocol() {
    const id = document.getElementById('protocol-id').value.trim();
    const titulo = document.getElementById('protocol-titulo').value.trim();
    const arquivo_url = document.getElementById('protocol-arquivo-url').value.trim();
    if (!titulo) {
        alert('Preencha o título.');
        return;
    }
    if (!arquivo_url) {
        alert('Preencha a URL do PDF (link do arquivo).');
        return;
    }
    try {
        const client = window.supabaseClient;
        if (!client) {
            alert('Erro: Supabase não disponível');
            return;
        }
        const payload = {
            titulo,
            descricao_curta: document.getElementById('protocol-descricao').value.trim() || null,
            arquivo_url: arquivo_url || null,
            ativo: document.getElementById('protocol-ativo').checked,
            updated_at: new Date().toISOString()
        };
        if (id) {
            const { error } = await client.from('blog360_protocols').update(payload).eq('id', id);
            if (error) throw error;
            alert('Protocolo atualizado.');
        } else {
            const { error } = await client.from('blog360_protocols').insert(payload);
            if (error) throw error;
            alert('Protocolo criado.');
        }
        closeProtocolModal();
        loadAllProtocols();
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar. Verifique se a tabela blog360_protocols existe no Supabase.');
    }
}
async function deleteProtocol(btn) {
    const id = btn && btn.dataset && btn.dataset.id;
    const titulo = (btn && btn.dataset && btn.dataset.titulo) ? btn.dataset.titulo : 'este protocolo';
    if (!id) return;
    if (!confirm('Excluir o protocolo "' + titulo + '"?')) return;
    try {
        const client = window.supabaseClient;
        if (!client) {
            alert('Erro: Supabase não disponível');
            return;
        }
        const { error } = await client.from('blog360_protocols').delete().eq('id', id);
        if (error) throw error;
        alert('Protocolo excluído.');
        loadAllProtocols();
    } catch (e) {
        console.error(e);
        alert('Erro ao excluir.');
    }
}
function copyProtocolLink(url) {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => alert('Link copiado!')).catch(() => alert('Copie o link manualmente.'));
}
window.openProtocolModal = openProtocolModal;
window.closeProtocolModal = closeProtocolModal;
window.saveProtocol = saveProtocol;
window.deleteProtocol = deleteProtocol;
window.copyProtocolLink = copyProtocolLink;

// --- Ebooks (blog360_ebooks) ---
async function loadAllEbooks() {
    const tbody = document.getElementById('all-ebooks');
    if (!tbody) return;
    try {
        const client = window.supabaseClient;
        if (!client) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erro ao conectar ao Supabase</td></tr>';
            return;
        }
        const { data: list, error } = await client
            .from('blog360_ebooks')
            .select('*')
            .order('ordem', { ascending: true })
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum ebook cadastrado. Clique em "+ Novo Ebook" para adicionar.</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(e => {
            const tipoMap = { whatsapp: 'WhatsApp', download: 'Download', ambos: 'Ambos' };
            return `<tr>
                <td><strong>${escapeHtml(e.titulo || '')}</strong></td>
                <td>${escapeHtml((e.descricao_curta || '').slice(0, 60))}${(e.descricao_curta || '').length > 60 ? '…' : ''}</td>
                <td><span class="badge ${e.tipo_envio === 'download' ? 'published' : 'draft'}">${tipoMap[e.tipo_envio] || e.tipo_envio}</span></td>
                <td><span class="badge ${e.ativo ? 'published' : 'draft'}">${e.ativo ? 'Sim' : 'Não'}</span></td>
                <td class="action-buttons">
                    <button type="button" class="btn-icon" title="Editar" onclick='openEbookModal(${JSON.stringify(e)})'>✏️</button>
                    <button type="button" class="btn-icon" title="Excluir" data-id="${e.id}" data-titulo="${(e.titulo || '').replace(/"/g, '&quot;')}" onclick="deleteEbook(this)">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar ebooks:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erro ao carregar. Execute o SQL BLOG360_EBOOKS.sql no Supabase.</td></tr>';
    }
}
function openEbookModal(ebook) {
    const modal = document.getElementById('ebook-modal');
    const titleEl = document.getElementById('ebook-modal-title');
    document.getElementById('ebook-id').value = ebook ? ebook.id : '';
    document.getElementById('ebook-titulo').value = ebook ? (ebook.titulo || '') : '';
    document.getElementById('ebook-descricao-curta').value = ebook ? (ebook.descricao_curta || '') : '';
    document.getElementById('ebook-descricao-completa').value = ebook ? (ebook.descricao_completa || '') : '';
    document.getElementById('ebook-arquivo-url').value = ebook ? (ebook.arquivo_url || '') : '';
    document.getElementById('ebook-imagem-url').value = ebook ? (ebook.imagem_capa_url || '') : '';
    document.getElementById('ebook-tipo-envio').value = ebook ? (ebook.tipo_envio || 'whatsapp') : 'whatsapp';
    document.getElementById('ebook-ativo').checked = ebook ? !!ebook.ativo : true;
    titleEl.textContent = ebook ? 'Editar Ebook' : 'Novo Ebook';
    if (modal) modal.style.display = 'flex';
}
function closeEbookModal() {
    const modal = document.getElementById('ebook-modal');
    if (modal) modal.style.display = 'none';
}
async function saveEbook() {
    const id = document.getElementById('ebook-id').value.trim();
    const titulo = document.getElementById('ebook-titulo').value.trim();
    const arquivo_url = document.getElementById('ebook-arquivo-url').value.trim();
    if (!titulo) {
        alert('Preencha o título.');
        return;
    }
    if (!arquivo_url) {
        alert('Preencha a URL do arquivo (PDF).');
        return;
    }
    try {
        const client = window.supabaseClient;
        if (!client) {
            alert('Erro: Supabase não disponível');
            return;
        }
        const payload = {
            titulo,
            descricao_curta: document.getElementById('ebook-descricao-curta').value.trim() || null,
            descricao_completa: document.getElementById('ebook-descricao-completa').value.trim() || null,
            arquivo_url: arquivo_url || null,
            imagem_capa_url: document.getElementById('ebook-imagem-url').value.trim() || null,
            tipo_envio: document.getElementById('ebook-tipo-envio').value || 'whatsapp',
            ativo: document.getElementById('ebook-ativo').checked,
            updated_at: new Date().toISOString()
        };
        if (id) {
            const { error } = await client.from('blog360_ebooks').update(payload).eq('id', id);
            if (error) throw error;
            alert('Ebook atualizado.');
        } else {
            const { error } = await client.from('blog360_ebooks').insert(payload);
            if (error) throw error;
            alert('Ebook criado.');
        }
        closeEbookModal();
        loadAllEbooks();
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar. Verifique se a tabela blog360_ebooks existe no Supabase.');
    }
}
async function deleteEbook(btn) {
    const id = btn && btn.dataset && btn.dataset.id;
    const titulo = (btn && btn.dataset && btn.dataset.titulo) ? btn.dataset.titulo : 'este ebook';
    if (!id) return;
    if (!confirm('Excluir o ebook "' + titulo + '"?')) return;
    try {
        const client = window.supabaseClient;
        if (!client) {
            alert('Erro: Supabase não disponível');
            return;
        }
        const { error } = await client.from('blog360_ebooks').delete().eq('id', id);
        if (error) throw error;
        alert('Ebook excluído.');
        loadAllEbooks();
    } catch (e) {
        console.error(e);
        alert('Erro ao excluir.');
    }
}
window.openEbookModal = openEbookModal;
window.closeEbookModal = closeEbookModal;
window.saveEbook = saveEbook;
window.deleteEbook = deleteEbook;

// --- Quizzes (blog360_quizzes) ---
async function loadAllQuizzes() {
    const tbody = document.getElementById('all-quizzes');
    if (!tbody) return;
    try {
        const client = window.supabaseClient;
        if (!client || !client.getQuizzes) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erro ao conectar ao Supabase</td></tr>';
            return;
        }
        const result = await client.getQuizzes(false);
        if (!result.success || !result.data) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum quiz. Clique em "+ Novo Quiz" para criar.</td></tr>';
            return;
        }
        const list = result.data;
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum quiz. Clique em "+ Novo Quiz" para criar.</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(q => `
            <tr>
                <td><strong>${escapeHtml(q.title || '')}</strong></td>
                <td><code>${escapeHtml(q.slug || '')}</code></td>
                <td><span class="badge ${q.active ? 'published' : 'draft'}">${q.active ? 'Sim' : 'Não'}</span></td>
                <td>${formatDate(q.created_at)}</td>
                <td class="action-buttons">
                    <a href="admin-editor-quiz.html?id=${q.id}" class="btn-icon" title="Editar">✏️</a>
                    <button type="button" class="btn-icon" title="${q.active ? 'Desativar' : 'Ativar'}" onclick="toggleQuizActive('${q.id}', ${!!q.active})">${q.active ? '👁️' : '🔒'}</button>
                    <button type="button" class="btn-icon" title="Excluir" onclick="deleteQuiz('${q.id}', '${(q.title || '').replace(/'/g, "\\'")}')">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar quizzes:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erro ao carregar. Execute BLOG360_QUIZZES.sql no Supabase.</td></tr>';
    }
}
async function toggleQuizActive(quizId, currentlyActive) {
    try {
        const client = window.supabaseClient;
        if (!client) return;
        const { error } = await client.from('blog360_quizzes').update({ active: !currentlyActive, updated_at: new Date().toISOString() }).eq('id', quizId);
        if (error) throw error;
        loadAllQuizzes();
    } catch (e) {
        console.error(e);
        alert('Erro ao atualizar.');
    }
}
async function deleteQuiz(quizId, title) {
    if (!confirm('Excluir o quiz "' + (title || '') + '"?')) return;
    try {
        const client = window.supabaseClient;
        if (!client) return;
        const { error } = await client.from('blog360_quizzes').delete().eq('id', quizId);
        if (error) throw error;
        alert('Quiz excluído.');
        loadAllQuizzes();
    } catch (e) {
        console.error(e);
        alert('Erro ao excluir.');
    }
}
window.toggleQuizActive = toggleQuizActive;
window.deleteQuiz = deleteQuiz;

// Carregar dados da visão geral
async function loadOverviewData() {
    await loadStats();
    await loadRecentLeads();
}

// Formatar data
function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getAboutPhotoUrl(value) {
    const raw = (value || '').trim();
    if (!raw) return ABOUT_PHOTO_FALLBACK;
    if (/^https?:\/\//i.test(raw) || raw.startsWith('assets/')) return raw;
    return ABOUT_PHOTO_FALLBACK;
}

function renderAboutPhotoPreview(value) {
    const preview = document.getElementById('about-photo-preview');
    if (!preview) return;
    preview.src = getAboutPhotoUrl(value);
    preview.onerror = () => {
        preview.src = ABOUT_PHOTO_FALLBACK;
    };
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function resizeImageDataUrl(dataUrl, maxSize = 1000, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
            canvas.width = Math.round(img.width * ratio);
            canvas.height = Math.round(img.height * ratio);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

async function uploadAboutPhotoToStorage(file) {
    const client = window.supabaseClient;
    const rawClient = client && (client.client || client);
    if (!rawClient || !rawClient.storage) {
        throw new Error('Supabase Storage indisponível');
    }
    const ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop().toLowerCase() : 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const path = `about/author-photo-${Date.now()}.${safeExt}`;

    let lastError = null;
    for (const bucket of ABOUT_PHOTO_BUCKET_CANDIDATES) {
        try {
            const { error: uploadError } = await rawClient.storage
                .from(bucket)
                .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg', cacheControl: '3600' });
            if (uploadError) {
                lastError = uploadError;
                continue;
            }
            const { data: publicData } = rawClient.storage.from(bucket).getPublicUrl(path);
            if (publicData && publicData.publicUrl) {
                return publicData.publicUrl;
            }
        } catch (error) {
            lastError = error;
        }
    }
    throw new Error((lastError && lastError.message) || 'Falha ao enviar imagem para o Storage');
}

async function loadAboutPhotoSettings() {
    const input = document.getElementById('about-photo-url');
    const fileInput = document.getElementById('about-photo-file');
    if (!input) return;

    input.value = localStorage.getItem(ABOUT_PHOTO_STORAGE_KEY) || '';
    renderAboutPhotoPreview(input.value);
    input.oninput = function() {
        renderAboutPhotoPreview(input.value);
    };

    if (fileInput) {
        fileInput.onchange = async function() {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            try {
                aboutPhotoPendingFile = file;
                const previewUrl = URL.createObjectURL(file);
                renderAboutPhotoPreview(previewUrl);
                alert('Imagem selecionada. Clique em "Salvar foto da Sobre" para enviar pelo painel admin.');
            } catch (error) {
                console.error('Erro ao processar imagem:', error);
                alert('Não foi possível processar a imagem. Tente outro arquivo.');
            } finally {
                fileInput.value = '';
            }
        };
    }

    try {
        const client = window.supabaseClient;
        if (!client || typeof client.getSiteSettings !== 'function') return;
        const res = await client.getSiteSettings();
        if (res && res.success && res.data && typeof res.data.sobre_foto_url === 'string') {
            input.value = res.data.sobre_foto_url || '';
            localStorage.setItem(ABOUT_PHOTO_STORAGE_KEY, input.value);
            renderAboutPhotoPreview(input.value);
        }
    } catch (error) {
        console.warn('Falha ao carregar foto da Sobre no Supabase. Usando fallback local.', error);
    }
}

async function saveAboutPhotoSettings() {
    const input = document.getElementById('about-photo-url');
    if (!input) return;

    const client = window.supabaseClient;
    let value = (input.value || '').trim();

    try {
        // Funciona também sem Supabase (modo local)
        if (!client || typeof client.saveSiteSettings !== 'function') {
            if (aboutPhotoPendingFile) {
                const rawDataUrl = await fileToDataUrl(aboutPhotoPendingFile);
                value = await resizeImageDataUrl(rawDataUrl);
                aboutPhotoPendingFile = null;
                input.value = value;
            }
            localStorage.setItem(ABOUT_PHOTO_STORAGE_KEY, value || '');
            renderAboutPhotoPreview(value);
            alert('Foto salva localmente neste navegador.');
            return;
        }

        if (aboutPhotoPendingFile) {
            try {
                value = await uploadAboutPhotoToStorage(aboutPhotoPendingFile);
            } catch (uploadError) {
                console.warn('Upload no Storage falhou. Usando fallback otimizado em site_settings.', uploadError);
                const rawDataUrl = await fileToDataUrl(aboutPhotoPendingFile);
                value = await resizeImageDataUrl(rawDataUrl);
            }
            aboutPhotoPendingFile = null;
            input.value = value;
        }
        const result = await client.saveSiteSettings({ sobre_foto_url: value || null, updated_at: new Date().toISOString() });
        if (!result || !result.success) {
            throw new Error((result && result.error) || 'Não foi possível salvar no Supabase');
        }
        localStorage.setItem(ABOUT_PHOTO_STORAGE_KEY, value);
        renderAboutPhotoPreview(value);
        alert('Foto da página Sobre salva com sucesso.');
    } catch (error) {
        console.warn('Falha ao salvar foto da Sobre:', error);
        // Último fallback: salva local mesmo com erro remoto
        try {
            if (aboutPhotoPendingFile) {
                const rawDataUrl = await fileToDataUrl(aboutPhotoPendingFile);
                value = await resizeImageDataUrl(rawDataUrl);
                aboutPhotoPendingFile = null;
                input.value = value;
            }
            localStorage.setItem(ABOUT_PHOTO_STORAGE_KEY, value || '');
            renderAboutPhotoPreview(value);
        } catch (localError) {
            console.warn('Fallback local também falhou:', localError);
        }
        const message = (error && error.message) ? error.message : 'erro desconhecido';
        alert('Não foi possível salvar a foto no painel.\n\nDetalhe: ' + message + '\n\nVerifique bucket público (blog-media/blog360-media/public), policy de upload para admin autenticado e coluna "sobre_foto_url" em blog360_site_settings.');
    }
}

// Expor funções globais
window.logout = logout;
window.exportLeads = exportLeads;
window.saveAboutPhotoSettings = saveAboutPhotoSettings;
