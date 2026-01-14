// ============================================
// Sistema de Captura de Leads - Blog Vida 360º
// ============================================

class LeadCapture {
  constructor() {
    // Tentar obter o cliente Supabase
    this.supabase = this.getSupabaseClient();
    this.init();
  }

  getSupabaseClient() {
    // Se já existe, usar
    if (window.supabaseClient && window.supabaseClient.client) {
      console.log('✅ Usando Supabase Client existente');
      return window.supabaseClient;
    }
    
    // Tentar inicializar se a função existir
    if (typeof initSupabase === 'function') {
      console.log('🔄 Tentando inicializar Supabase Client...');
      const client = initSupabase();
      if (client && client.client) {
        console.log('✅ Supabase Client inicializado com sucesso');
        return client;
      } else {
        console.warn('⚠️ Supabase Client inicializado mas sem cliente válido');
      }
    } else {
      console.warn('⚠️ Função initSupabase não encontrada');
    }
    
    console.warn('⚠️ Supabase Client não disponível. Usando fallback local.');
    return null;
  }

  init() {
    // Inicializar formulários de captura
    this.initNewsletterForms();
    this.initPopup();
    this.trackScroll();
  }

  // ============================================
  // FORMULÁRIOS DE NEWSLETTER
  // ============================================

  initNewsletterForms() {
    // Formulários com classe 'newsletter-form'
    const forms = document.querySelectorAll('.newsletter-form');
    
    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleNewsletterSubmit(form);
      });
    });
  }

  async handleNewsletterSubmit(form) {
    const formData = new FormData(form);
    const email = formData.get('email') || form.querySelector('input[type="email"]')?.value;
    const nome = formData.get('nome') || form.querySelector('input[name="nome"]')?.value || null;
    const origem = form.dataset.origem || 'form';

    // Validação
    if (!this.validateEmail(email)) {
      this.showMessage(form, 'Por favor, insira um email válido.', 'error');
      return;
    }

    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    }

    try {
      // Verificar se Supabase está disponível
      if (!this.supabase || !this.supabase.client) {
        console.warn('⚠️ Supabase não disponível, usando fallback localStorage');
        this.saveLeadLocal(email, nome, origem);
        this.showMessage(form, '✨ Cadastro realizado! Em breve você receberá nosso conteúdo.', 'success');
        form.reset();
        return;
      }

      console.log('🔍 Verificando se email já existe...', email);
      
      // Verificar se email já existe
      const emailCheck = await this.supabase.checkEmailExists(email);
      console.log('📧 Resultado verificação email:', emailCheck);
      
      if (emailCheck.exists) {
        this.showMessage(form, 'Este email já está cadastrado! Obrigado! 🎉', 'success');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        return;
      }

      console.log('➕ Criando novo lead...', { email, nome, origem });
      
      // Criar novo lead
      const result = await this.supabase.createLead(email, nome, [], origem);
      console.log('📊 Resultado createLead:', result);
      
      if (!result.success) {
        console.error('❌ Erro ao criar lead:', result.error);
        throw new Error(result.error || 'Erro ao cadastrar');
      }

      if (!result.data || !result.data.id) {
        console.error('❌ Lead criado mas sem dados retornados:', result);
        throw new Error('Lead criado mas dados não retornados');
      }

      console.log('✅ Lead criado com sucesso! ID:', result.data.id);

      // Inscrever na newsletter
      try {
        const newsletterResult = await this.supabase.subscribeToNewsletter(result.data.id, origem);
        console.log('📬 Resultado newsletter:', newsletterResult);
      } catch (err) {
        console.warn('⚠️ Erro ao inscrever na newsletter (não crítico):', err);
      }
      
      // Registrar evento
      try {
        await this.supabase.trackEvent('form_submit', window.location.pathname, {
          tipo: 'newsletter',
          origem
        });
        console.log('📈 Evento registrado');
      } catch (err) {
        console.warn('⚠️ Erro ao registrar evento (não crítico):', err);
      }

      // Enviar email de boas-vindas (via API)
      console.log('🔄 Iniciando envio de email de boas-vindas...');
      try {
        await this.sendWelcomeEmail(email, nome);
        console.log('✅ Processo de envio de email concluído');
      } catch (err) {
        console.error('❌ Erro ao enviar email de boas-vindas:', err);
        console.error('   - Erro completo:', err);
        // Não bloquear o fluxo - email é opcional
      }

      this.showMessage(form, '🎉 Cadastro realizado com sucesso! Verifique seu email.', 'success');
      form.reset();
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      this.showMessage(form, 'Ops! Algo deu errado. Tente novamente.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }

  // ============================================
  // POP-UP INTELIGENTE
  // ============================================

  initPopup() {
    // Verificar se popup já foi mostrado nesta sessão
    if (sessionStorage.getItem('popup_shown')) {
      return;
    }

    // Criar popup
    this.createPopup();

    // Mostrar após 60 segundos OU 50% do scroll
    let scrollTriggered = false;
    let timeTriggered = false;

    // Timer: 60 segundos
    setTimeout(() => {
      if (!scrollTriggered && !sessionStorage.getItem('popup_shown')) {
        timeTriggered = true;
        this.showPopup();
      }
    }, 60000);

    // Scroll: 50% da página
    window.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercent >= 50 && !timeTriggered && !sessionStorage.getItem('popup_shown')) {
        scrollTriggered = true;
        this.showPopup();
      }
    }, { once: true });
  }

  createPopup() {
    // Verificar se popup já existe
    if (document.getElementById('newsletter-popup')) {
      return;
    }

    const popup = document.createElement('div');
    popup.id = 'newsletter-popup';
    popup.className = 'newsletter-popup';
    popup.innerHTML = `
      <div class="popup-overlay"></div>
      <div class="popup-content">
        <button class="popup-close" aria-label="Fechar">&times;</button>
        <h2>📧 Receba Conteúdo Exclusivo!</h2>
        <p>Cadastre-se e receba nosso <strong>Guia Completo de Bem-Estar</strong> grátis!</p>
        <form class="newsletter-form" data-origem="popup">
          <input 
            type="email" 
            name="email" 
            placeholder="Seu melhor email" 
            required
            aria-label="Email"
          >
          <button type="submit">Quero Receber Grátis</button>
        </form>
        <p class="popup-privacy">🔒 Seus dados estão seguros. Sem spam.</p>
      </div>
    `;

    document.body.appendChild(popup);

    // Event listeners
    popup.querySelector('.popup-close').addEventListener('click', () => this.hidePopup());
    popup.querySelector('.popup-overlay').addEventListener('click', () => this.hidePopup());
    
    // ESC para fechar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('show')) {
        this.hidePopup();
      }
    });
  }

  showPopup() {
    const popup = document.getElementById('newsletter-popup');
    if (popup) {
      popup.classList.add('show');
      sessionStorage.setItem('popup_shown', 'true');
      document.body.style.overflow = 'hidden';
    }
  }

  hidePopup() {
    const popup = document.getElementById('newsletter-popup');
    if (popup) {
      popup.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  // ============================================
  // TRACKING DE SCROLL
  // ============================================

  trackScroll() {
    let maxScroll = 0;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (currentScroll > maxScroll) {
        maxScroll = currentScroll;
      }
    });

    // Registrar scroll máximo ao sair da página
    window.addEventListener('beforeunload', () => {
      if (this.supabase && this.supabase.client) {
        this.supabase.trackEvent('scroll', window.location.pathname, {
          max_scroll: maxScroll,
          scroll_percent: (maxScroll / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        });
      }
    });
  }

  // ============================================
  // UTILITÁRIOS
  // ============================================

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  showMessage(form, message, type = 'success') {
    // Remover mensagem anterior
    const existingMsg = form.querySelector('.form-message');
    if (existingMsg) {
      existingMsg.remove();
    }

    // Criar nova mensagem
    const msg = document.createElement('div');
    msg.className = `form-message form-message-${type}`;
    msg.textContent = message;
    
    form.insertBefore(msg, form.firstChild);

    // Remover após 5 segundos
    setTimeout(() => {
      msg.remove();
    }, 5000);
  }

  async sendWelcomeEmail(email, nome) {
    console.log('📧 [sendWelcomeEmail] Iniciando...', { email, nome });
    
    try {
      // Determinar URL da API baseado no ambiente
      const apiUrl = this.getApiUrl();
      
      console.log('📧 Enviando email de boas-vindas para:', email);
      console.log('   - API URL:', `${apiUrl}/api/send-email`);
      console.log('   - URL completa:', window.location.href);
      
      // Chamar API do Vercel para enviar email via Resend
      const response = await fetch(`${apiUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          nome: nome || 'Amigo',
          tipo: 'welcome'
        })
      });

      console.log('   - Status da resposta:', response.status);
      console.log('   - Response OK?', response.ok);

      const data = await response.json();
      console.log('   - Dados da resposta:', data);

      if (!response.ok) {
        console.error('❌ Erro ao enviar email:', data);
        console.error('   - Status:', response.status);
        console.error('   - Erro:', data.error);
        console.error('   - Detalhes:', data.details);
        throw new Error(data.error || 'Erro ao enviar email');
      }

      console.log('✅ Email de boas-vindas enviado com sucesso!');
      console.log('   - Message ID:', data.messageId);
      console.log('   - Mensagem:', data.message);
    } catch (error) {
      console.error('⚠️ Erro ao enviar email de boas-vindas:', error);
      console.error('   - Tipo do erro:', error.name);
      console.error('   - Mensagem:', error.message);
      console.error('   - Stack:', error.stack);
      // Não bloquear o fluxo se o email falhar
      // O lead já foi salvo no Supabase, o email é opcional
    }
  }

  getApiUrl() {
    // Se estiver em produção (Vercel), usar a URL do domínio
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // Retornar a URL base do site
      return window.location.origin;
    }
    
    // Em desenvolvimento local, usar URL do Vercel (se configurada)
    // Ou retornar vazio para desabilitar em dev
    return window.location.origin;
  }

  saveLeadLocal(email, nome, origem) {
    const leads = JSON.parse(localStorage.getItem('leads_pending') || '[]');
    leads.push({ email, nome, origem, timestamp: Date.now() });
    localStorage.setItem('leads_pending', JSON.stringify(leads));
  }
}

// Auto-inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.leadCapture = new LeadCapture();
  });
} else {
  window.leadCapture = new LeadCapture();
}
