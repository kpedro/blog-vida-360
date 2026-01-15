// Campanhas de Email - JavaScript
let selectedTemplate = 'newsletter';
let currentCampaignId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthentication();
    initCampaignEditor();
    loadEstimatedStats();
});

// Verificar autenticação
async function checkAuthentication() {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient || !supabaseClient.client) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    const { data: { session } } = await supabaseClient.client.auth.getSession();
    if (!session) {
        window.location.href = 'admin-login.html';
    }
}

// Inicializar editor de campanha
function initCampaignEditor() {
    // Atualizar preview ao digitar
    document.getElementById('campaign-subject').addEventListener('input', updateEmailPreview);
    document.getElementById('campaign-preheader').addEventListener('input', updateEmailPreview);
    document.getElementById('sender-name').addEventListener('input', updateEmailPreview);
    document.getElementById('email-editor').addEventListener('input', updateEmailPreview);
    
    // Atualizar estatísticas ao mudar segmento
    document.getElementById('campaign-segment').addEventListener('change', loadEstimatedStats);
}

// Selecionar template
function selectTemplate(template) {
    selectedTemplate = template;
    
    // Remover seleção anterior
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Adicionar seleção ao clicado
    event.target.closest('.template-card').classList.add('selected');
    
    // Carregar template
    loadTemplate(template);
}

// Carregar template
function loadTemplate(template) {
    const editor = document.getElementById('email-editor');
    
    const templates = {
        newsletter: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0;">Vida 360º</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Newsletter</p>
                </div>
                
                <div style="padding: 30px; background: white;">
                    <h2>Olá, {{nome}}!</h2>
                    <p>Bem-vindo à nossa newsletter semanal com as melhores dicas de saúde, bem-estar e produtividade.</p>
                    
                    <h3 style="color: #2C3E50; margin-top: 30px;">📚 Artigos em Destaque</h3>
                    <p>Confira os artigos mais lidos desta semana...</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: #E74C3C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ler Artigos</a>
                    </div>
                </div>
                
                <div style="background: #F5F7FA; padding: 20px; text-align: center; font-size: 12px; color: #7F8C8D;">
                    <p>Você está recebendo este email porque se inscreveu em nossa newsletter.</p>
                    <p><a href="#" style="color: #7F8C8D;">Cancelar inscrição</a></p>
                </div>
            </div>
        `,
        promocional: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background: #E74C3C; color: white; padding: 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 36px;">🎁 OFERTA ESPECIAL</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Exclusivo para você, {{nome}}!</p>
                </div>
                
                <div style="padding: 30px; background: white; text-align: center;">
                    <h2 style="color: #2C3E50;">Aproveite esta oportunidade única!</h2>
                    <p style="font-size: 18px;">Descrição da oferta aqui...</p>
                    
                    <div style="background: #FFF3CD; padding: 20px; margin: 30px 0; border-radius: 10px;">
                        <p style="font-size: 24px; font-weight: bold; color: #E74C3C; margin: 0;">50% OFF</p>
                        <p style="margin: 5px 0 0 0;">Por tempo limitado!</p>
                    </div>
                    
                    <a href="#" style="background: #27AE60; color: white; padding: 20px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 18px; font-weight: bold;">APROVEITAR AGORA</a>
                </div>
                
                <div style="background: #F5F7FA; padding: 20px; text-align: center; font-size: 12px; color: #7F8C8D;">
                    <p><a href="#" style="color: #7F8C8D;">Cancelar inscrição</a></p>
                </div>
            </div>
        `,
        educacional: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background: #3498DB; color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0;">📚 Conteúdo Educacional</h1>
                    <p style="margin: 10px 0 0 0;">Aprenda algo novo hoje!</p>
                </div>
                
                <div style="padding: 30px; background: white;">
                    <h2>Olá, {{nome}}!</h2>
                    <p>Preparamos um conteúdo especial para você aprender mais sobre...</p>
                    
                    <div style="background: #F8F9FA; padding: 20px; margin: 20px 0; border-left: 4px solid #3498DB;">
                        <h3 style="margin-top: 0; color: #2C3E50;">💡 Dica do Dia</h3>
                        <p>Sua dica educacional aqui...</p>
                    </div>
                    
                    <h3 style="color: #2C3E50;">📖 Recursos Recomendados</h3>
                    <ul style="line-height: 2;">
                        <li>Recurso 1</li>
                        <li>Recurso 2</li>
                        <li>Recurso 3</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: #3498DB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Acessar Conteúdo</a>
                    </div>
                </div>
                
                <div style="background: #F5F7FA; padding: 20px; text-align: center; font-size: 12px; color: #7F8C8D;">
                    <p><a href="#" style="color: #7F8C8D;">Cancelar inscrição</a></p>
                </div>
            </div>
        `,
        anuncio: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0;">📢 Novidades!</h1>
                    <p style="margin: 10px 0 0 0;">Temos algo importante para compartilhar</p>
                </div>
                
                <div style="padding: 30px; background: white;">
                    <h2>Olá, {{nome}}!</h2>
                    <p>Estamos animados em anunciar...</p>
                    
                    <div style="background: #D5F4E6; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center;">
                        <h3 style="margin: 0; color: #27AE60;">✨ Grande Novidade!</h3>
                        <p style="margin: 10px 0 0 0;">Descrição do anúncio aqui...</p>
                    </div>
                    
                    <p>Detalhes adicionais sobre o anúncio...</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: #E74C3C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Saiba Mais</a>
                    </div>
                </div>
                
                <div style="background: #F5F7FA; padding: 20px; text-align: center; font-size: 12px; color: #7F8C8D;">
                    <p><a href="#" style="color: #7F8C8D;">Cancelar inscrição</a></p>
                </div>
            </div>
        `
    };
    
    editor.innerHTML = templates[template] || templates.newsletter;
    updateEmailPreview();
}

// Inserir variável
function insertVariable(variable) {
    const editor = document.getElementById('email-editor');
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(variable);
    range.insertNode(textNode);
    editor.focus();
    updateEmailPreview();
}

// Inserir botão CTA
function insertButton() {
    const text = prompt('Texto do botão:', 'Clique Aqui');
    const url = prompt('URL do link:', '#');
    
    if (text && url) {
        const button = `<div style="text-align: center; margin: 30px 0;"><a href="${url}" style="background: #E74C3C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">${text}</a></div>`;
        document.execCommand('insertHTML', false, button);
        updateEmailPreview();
    }
}

// Inserir divisor
function insertDivider() {
    const divider = '<hr style="border: none; border-top: 2px solid #ECF0F1; margin: 30px 0;">';
    document.execCommand('insertHTML', false, divider);
    updateEmailPreview();
}

// Inserir imagem
function insertImage() {
    const url = prompt('URL da imagem:');
    if (url) {
        const img = `<img src="${url}" alt="Imagem" style="max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px;">`;
        document.execCommand('insertHTML', false, img);
        updateEmailPreview();
    }
}

// Atualizar preview do email
function updateEmailPreview() {
    const senderName = document.getElementById('sender-name').value || 'Vida 360º';
    const subject = document.getElementById('campaign-subject').value || 'Assunto do email';
    const preheader = document.getElementById('campaign-preheader').value || 'Preview text';
    const content = document.getElementById('email-editor').innerHTML;
    
    document.getElementById('preview-sender').textContent = senderName;
    document.getElementById('preview-subject').textContent = subject;
    document.getElementById('preview-preheader').textContent = preheader;
    document.getElementById('preview-content').innerHTML = content;
}

// Carregar estatísticas estimadas
async function loadEstimatedStats() {
    try {
        const supabaseClient = window.supabaseClient;
        const segment = document.getElementById('campaign-segment').value;
        
        // Buscar total de leads
        let query = supabaseClient.client.from('blog360_leads').select('*', { count: 'exact', head: true });
        
        // Aplicar filtros baseado no segmento
        if (segment === 'active') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            query = query.gte('created_at', thirtyDaysAgo.toISOString());
        } else if (segment === 'new') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            query = query.gte('created_at', sevenDaysAgo.toISOString());
        }
        
        const { count } = await query;
        
        document.getElementById('estimated-recipients').textContent = count || 0;
        document.getElementById('estimated-opens').textContent = '25%'; // Estimativa
        document.getElementById('estimated-clicks').textContent = '5%'; // Estimativa
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Salvar rascunho da campanha
async function saveCampaignDraft() {
    await saveCampaign('draft');
}

// Enviar campanha
async function sendCampaign() {
    if (!validateCampaign()) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
    }
    
    if (confirm('Tem certeza que deseja enviar esta campanha? Esta ação não pode ser desfeita.')) {
        await saveCampaign('sent');
    }
}

// Validar campanha
function validateCampaign() {
    const name = document.getElementById('campaign-name').value;
    const subject = document.getElementById('campaign-subject').value;
    const segment = document.getElementById('campaign-segment').value;
    const content = document.getElementById('email-editor').innerHTML;
    
    return name && subject && segment && content.length > 50;
}

// Salvar campanha
async function saveCampaign(status) {
    try {
        const supabaseClient = window.supabaseClient;
        
        const campaignData = {
            name: document.getElementById('campaign-name').value,
            subject: document.getElementById('campaign-subject').value,
            preheader: document.getElementById('campaign-preheader').value,
            sender_name: document.getElementById('sender-name').value,
            sender_email: document.getElementById('sender-email').value,
            segment: document.getElementById('campaign-segment').value,
            template: selectedTemplate,
            content: document.getElementById('email-editor').innerHTML,
            status: status,
            sent_at: status === 'sent' ? new Date().toISOString() : null
        };
        
        let result;
        if (currentCampaignId) {
            result = await supabaseClient.client
                .from('blog360_campaigns')
                .update(campaignData)
                .eq('id', currentCampaignId);
        } else {
            result = await supabaseClient.client
                .from('blog360_campaigns')
                .insert([campaignData])
                .select();
            
            if (result.data && result.data[0]) {
                currentCampaignId = result.data[0].id;
            }
        }
        
        if (result.error) throw result.error;
        
        if (status === 'sent') {
            alert('✅ Campanha enviada com sucesso!');
            // Aqui você integraria com um serviço de email como Resend
            await sendEmailsToSubscribers(campaignData);
        } else {
            alert('💾 Rascunho salvo!');
        }
        
        window.location.href = 'admin-dashboard.html';
    } catch (error) {
        console.error('Erro ao salvar campanha:', error);
        alert('Erro ao salvar a campanha. Tente novamente.');
    }
}

// Enviar emails para inscritos (integração futura com Resend)
async function sendEmailsToSubscribers(campaignData) {
    // TODO: Integrar com Resend API
    console.log('Enviando campanha:', campaignData);
    // Aqui você faria a integração real com o Resend
}
