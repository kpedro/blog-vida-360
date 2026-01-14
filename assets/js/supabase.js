// ============================================
// Supabase Client - Blog Vida 360º
// ============================================

// Importar Supabase JS (via CDN ou npm)
// Para usar via CDN, adicione no HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

class SupabaseClient {
  constructor() {
    // Usar apenas window.* pois estamos em script normal (não módulo ES6)
    this.supabaseUrl = window.VITE_SUPABASE_URL;
    this.supabaseKey = window.VITE_SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️ Supabase credentials não configuradas');
      this.client = null;
      return;
    }

    // Se usando via CDN, window.supabase já existe
    if (window.supabase) {
      this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
      console.log('✅ Supabase Client criado com sucesso');
    } else {
      console.warn('⚠️ Supabase JS não carregado. Adicione o script no HTML.');
      this.client = null;
    }
  }

  // ============================================
  // LEADS
  // ============================================

  /**
   * Criar novo lead
   */
  async createLead(email, nome = null, interesses = [], origem = 'website') {
    try {
      if (!this.client) {
        console.error('❌ Supabase client não disponível');
        return { success: false, error: 'Cliente Supabase não inicializado' };
      }

      console.log('📤 Enviando INSERT para blog360_leads:', { email, nome, origem });
      
      const { data, error } = await this.client
        .from('blog360_leads')
        .insert({
          email,
          nome,
          interesses,
          origem,
          score: 0,
          ativo: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        console.error('   Código:', error.code);
        console.error('   Mensagem:', error.message);
        console.error('   Detalhes:', error.details);
        console.error('   Hint:', error.hint);
        throw error;
      }

      console.log('✅ Lead inserido com sucesso:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erro ao criar lead:', error);
      return { success: false, error: error.message || 'Erro desconhecido' };
    }
  }

  /**
   * Verificar se email já existe
   */
  async checkEmailExists(email) {
    try {
      if (!this.client) {
        console.warn('⚠️ Supabase client não disponível para verificar email');
        return { exists: false, data: null };
      }

      const { data, error } = await this.client
        .from('blog360_leads')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      // Se não encontrar, retorna null (não erro)
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar email:', error);
        throw error;
      }
      
      return { exists: !!data, data };
    } catch (error) {
      console.error('❌ Erro ao verificar email:', error);
      return { exists: false, error: error.message };
    }
  }

  /**
   * Atualizar score do lead
   */
  async updateLeadScore(leadId, score) {
    try {
      const { data, error } = await this.client
        .from('blog360_leads')
        .update({ score })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao atualizar score:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // POSTS
  // ============================================

  /**
   * Buscar posts publicados
   */
  async getPosts(limit = 10, offset = 0, categoria = null) {
    try {
      let query = this.client
        .from('posts')
        .select('*')
        .eq('publicado', true)
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (categoria) {
        query = query.eq('categoria', categoria);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar post por slug
   */
  async getPostBySlug(slug) {
    try {
      const { data, error } = await this.client
        .from('blog360_posts')
        .select('*')
        .eq('slug', slug)
        .eq('publicado', true)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao buscar post:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Incrementar views do post
   */
  async incrementPostViews(postId) {
    try {
      const { data, error } = await this.client
        .rpc('increment_views', { post_id: postId });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      // Fallback: atualizar manualmente
      const { data: post } = await this.client
        .from('blog360_posts')
        .select('views')
        .eq('id', postId)
        .single();

      if (post) {
        await this.client
          .from('blog360_posts')
          .update({ views: post.views + 1 })
          .eq('id', postId);
      }
      return { success: true };
    }
  }

  // ============================================
  // AFFILIATE LINKS
  // ============================================

  /**
   * Buscar links de afiliados ativos
   */
  async getAffiliateLinks(categoria = null, destacado = false) {
    try {
      let query = this.client
        .from('blog360_affiliate_links')
        .select('*')
        .eq('ativo', true)
        .order('clicks', { ascending: false });

      if (categoria) {
        query = query.eq('categoria', categoria);
      }

      if (destacado) {
        query = query.eq('destacado', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao buscar links:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Registrar clique em link de afiliado
   */
  async trackAffiliateClick(linkId) {
    try {
      const { data: link } = await this.client
        .from('blog360_affiliate_links')
        .select('clicks')
        .eq('id', linkId)
        .single();

      if (link) {
        await this.client
          .from('blog360_affiliate_links')
          .update({ clicks: link.clicks + 1 })
          .eq('id', linkId);
      }

      // Registrar no analytics
      await this.trackEvent('click', 'affiliate_link', { link_id: linkId });

      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Registrar evento de analytics
   */
  async trackEvent(evento, pagina = null, metadata = {}) {
    try {
      const sessionId = this.getSessionId();
      
      const { data, error } = await this.client
        .from('blog360_analytics')
        .insert({
          evento,
          pagina: pagina || window.location.pathname,
          session_id: sessionId,
          metadata
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao registrar evento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gerar/obter session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  // ============================================
  // NEWSLETTER
  // ============================================

  /**
   * Inscrever lead na newsletter
   */
  async subscribeToNewsletter(leadId, fonte = 'form') {
    try {
      const { data, error } = await this.client
        .from('blog360_newsletter_subscriptions')
        .insert({
          lead_id: leadId,
          status: 'active',
          fonte
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao inscrever na newsletter:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exportar instância global
let supabaseClient = null;

function initSupabase() {
  if (!supabaseClient) {
    supabaseClient = new SupabaseClient();
  }
  return supabaseClient;
}

// Auto-inicializar se Supabase estiver disponível
if (typeof window !== 'undefined') {
  window.initSupabase = initSupabase;
  window.supabaseClient = supabaseClient;
}

// Para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupabaseClient, initSupabase };
}
