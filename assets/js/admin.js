// Admin Dashboard JavaScript (usa window.supabaseClient após DOMContentLoaded)
// Updated: 2026-02-17 - Removida declaração duplicada de supabaseClient
// Usar apenas window.supabaseClient para evitar conflito com supabase.js

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
    }
}

// Carregar dados do dashboard
async function loadDashboardData() {
    await loadStats();
    await loadRecentLeads();
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

// Expor funções globais
window.logout = logout;
window.exportLeads = exportLeads;
