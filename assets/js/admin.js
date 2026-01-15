// Admin Dashboard JavaScript
const supabase = window.supabaseClient;

// Verificar autenticação ao carregar
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthentication();
    await loadUserInfo();
    initTabs();
    await loadDashboardData();
});

// Verificar se está autenticado
async function checkAuthentication() {
    if (!supabase) {
        console.error('Supabase não inicializado');
        window.location.href = 'admin-login.html';
        return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'admin-login.html';
    }
}

// Carregar informações do usuário
async function loadUserInfo() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        document.getElementById('user-email').textContent = user.email;
    }
}

// Logout
async function logout() {
    await supabase.auth.signOut();
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
        // Total de leads
        const { count: totalLeads } = await supabase
            .from('blog360_leads')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('stat-total-leads').textContent = totalLeads || 0;
        
        // Total de posts (simulado - ajustar quando tiver tabela)
        document.getElementById('stat-total-posts').textContent = '5';
        
        // Total de campanhas (simulado)
        document.getElementById('stat-total-campaigns').textContent = '0';
        
        // Taxa de abertura (simulado)
        document.getElementById('stat-open-rate').textContent = '0';
        
    } catch (error) {
        console.error('Erro ao carregar stats:', error);
    }
}

// Carregar últimos inscritos
async function loadRecentLeads() {
    try {
        const { data: leads, error } = await supabase
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
        const { data: leads, error } = await supabase
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

// Carregar todas as postagens
async function loadAllPosts() {
    const tbody = document.getElementById('all-posts');
    
    // Dados simulados (substituir por dados reais do Supabase)
    const posts = [
        {
            title: 'Como Cuidar da Saúde Mental no Dia a Dia',
            category: 'Saúde Mental',
            status: 'published',
            date: '2025-01-10'
        },
        {
            title: '7 Hábitos de Pessoas Altamente Produtivas',
            category: 'Produtividade',
            status: 'published',
            date: '2025-01-08'
        },
        {
            title: 'Encontrando o Equilíbrio entre Trabalho e Vida Pessoal',
            category: 'Equilíbrio na Vida',
            status: 'published',
            date: '2025-01-05'
        }
    ];
    
    if (posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma postagem ainda</td></tr>';
        return;
    }
    
    tbody.innerHTML = posts.map(post => `
        <tr>
            <td><strong>${post.title}</strong></td>
            <td>${post.category}</td>
            <td><span class="badge ${post.status === 'published' ? 'published' : 'draft'}">${post.status === 'published' ? 'Publicado' : 'Rascunho'}</span></td>
            <td>${formatDate(post.date)}</td>
            <td class="action-buttons">
                <button class="btn-icon" title="Editar">✏️</button>
                <button class="btn-icon" title="Excluir">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Carregar todas as campanhas
async function loadAllCampaigns() {
    const tbody = document.getElementById('all-campaigns');
    
    // Dados simulados
    const campaigns = [];
    
    if (campaigns.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div style="padding: 2rem;">
                        <p style="font-size: 18px; margin-bottom: 10px;">📧 Nenhuma campanha criada ainda</p>
                        <p style="color: #7F8C8D;">Crie sua primeira campanha de email marketing!</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = campaigns.map(campaign => `
        <tr>
            <td><strong>${campaign.name}</strong></td>
            <td>${campaign.subject}</td>
            <td>${campaign.sent || 0}</td>
            <td>${campaign.opens || 0} (${campaign.openRate || 0}%)</td>
            <td>${formatDate(campaign.date)}</td>
            <td><span class="badge ${campaign.status === 'sent' ? 'published' : 'draft'}">${campaign.status === 'sent' ? 'Enviado' : 'Rascunho'}</span></td>
        </tr>
    `).join('');
}

// Exportar leads para CSV
async function exportLeads() {
    try {
        const { data: leads, error } = await supabase
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
