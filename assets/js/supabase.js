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
      this.auth = this.client.auth;
      this.from = (...args) => this.client ? this.client.from(...args) : null;
      console.log('✅ Supabase Client criado com sucesso');
    } else {
      console.warn('⚠️ Supabase JS não carregado. Adicione o script no HTML.');
      this.client = null;
      this.from = () => null;
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
   * Buscar posts publicados (blog360_posts, status = 'published')
   * ATENÇÃO: Esta função usa filtro .or() que pode não funcionar bem.
   * A função client.getPosts() adicionada ao cliente raw é mais completa.
   */
  async getPosts(limit = 20, offset = 0, categoria = null) {
    try {
      if (!this.client) return { success: false, data: [], error: 'Cliente não disponível' };
      
      // Buscar todos os posts (select * evita erro se colunas tiverem nome diferente)
      let query = this.client
        .from('blog360_posts')
        .select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false, nullsFirst: false });

      const { data: allData, error } = await query;
      if (error) throw error;
      
      // Filtrar posts publicados manualmente
      let filteredData = (allData || []).filter(function(post) {
        // Considerar publicado se tem published_at OU status published OU publicado = true
        if (post.status === 'published' || post.publicado === true || post.published_at) {
          return true;
        }
        // Posts antigos sem status podem ser considerados publicados se têm created_at antigo
        if (!post.status && !post.hasOwnProperty('publicado') && post.created_at) {
          try {
            var createdDate = new Date(post.created_at);
            var now = new Date();
            var daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
            return daysDiff > 1; // Mais de 1 dia = considerado publicado
          } catch (e) {
            return false;
          }
        }
        return false;
      });
      
      // Aplicar filtro de categoria
      if (categoria) {
        filteredData = filteredData.filter(function(post) {
          return post.categoria === categoria;
        });
      }
      
      // Aplicar paginação
      var paginatedData = filteredData.slice(offset, offset + limit);
      
      return { success: true, data: paginatedData };
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Buscar post por slug (exclui só draft/private para incluir artigos antigos)
   */
  async getPostBySlug(slug) {
    try {
      if (!this.client) return { success: false, data: null, error: 'Cliente não disponível' };
      const { data, error } = await this.client
        .from('blog360_posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { success: true, data: null };
      if (data.status === 'draft' || data.status === 'private') return { success: true, data: null };
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao buscar post:', error);
      return { success: false, data: null, error: error.message };
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
  // Se já existe, retornar
  if (supabaseClient) {
    return supabaseClient;
  }
  
  // Verificar se Supabase JS está carregado
  if (!window.supabase) {
    console.error('❌ Supabase JS não está carregado. Certifique-se de incluir o script do CDN.');
    return null;
  }
  
  // Obter credenciais
  const supabaseUrl = window.VITE_SUPABASE_URL;
  const supabaseKey = window.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Credenciais do Supabase não configuradas');
    return null;
  }
  
  // Criar cliente do Supabase diretamente
  const client = window.supabase.createClient(supabaseUrl, supabaseKey);
  
  // Adicionar getPosts para a home do blog (usa status = 'published' ou publicado = true)
  client.getPosts = async function(limit = 50, offset = 0, categoria = null) {
    try {
      console.log('🔍 Buscando posts com:', { limit, offset, categoria });
      
      // Buscar todos os posts (select * evita erro se colunas tiverem nome diferente)
      let query = this
        .from('blog360_posts')
        .select('*');
      
      // Filtrar por status publicado (tentar múltiplas condições)
      // Primeiro, tentar buscar todos e filtrar depois se necessário
      query = query.order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false, nullsFirst: false });
      
      const { data: allData, error: allError } = await query;
      
      if (allError) {
        console.error('❌ Erro na query inicial:', allError);
        throw allError;
      }
      
      console.log('📊 Total de posts encontrados (antes do filtro):', allData ? allData.length : 0);
      
      // Filtrar posts publicados manualmente (incluir artigos antigos)
      let filteredData = (allData || []).filter(function(post) {
        // Excluir apenas rascunhos explícitos
        if (post.status === 'draft' || post.status === 'private') {
          return false;
        }
        // Considerar publicado se:
        // 1. status === 'published' ou publicado === true
        if (post.status === 'published' || post.publicado === true) {
          return true;
        }
        // 2. Tem published_at
        if (post.published_at) {
          return true;
        }
        // 3. Tem created_at (artigos antigos sem status preenchido)
        if (post.created_at) {
          return true;
        }
        // 4. Fallback: tem slug e título (evita esconder posts antigos)
        if (post.slug && (post.titulo || post.title)) {
          return true;
        }
        return false;
      });
      
      // Aplicar filtro de categoria se fornecido
      if (categoria) {
        filteredData = filteredData.filter(function(post) {
          return post.categoria === categoria;
        });
      }
      
      // Aplicar paginação
      var paginatedData = filteredData.slice(offset, offset + limit);
      
      console.log('✅ Posts filtrados:', {
        total: filteredData.length,
        paginados: paginatedData.length,
        categoria: categoria || 'todas'
      });
      
      return { success: true, data: paginatedData };
    } catch (error) {
      console.error('❌ Erro ao buscar posts:', error);
      console.error('   Detalhes:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return { success: false, data: [], error: error.message };
    }
  };
  
  // Adicionar getPostBySlug para a página do post (inclui artigos antigos sem status)
  client.getPostBySlug = async function(slug) {
    try {
      const { data, error } = await this
        .from('blog360_posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { success: true, data: null };
      if (data.status === 'draft' || data.status === 'private') return { success: true, data: null };
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao buscar post:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  // Listar protocolos ativos (página Protocolos do blog)
  client.getProtocols = async function() {
    try {
      const { data, error } = await this
        .from('blog360_protocols')
        .select('id, titulo, descricao_curta, arquivo_url, ordem')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Erro ao buscar protocolos:', error);
      return { success: false, data: [], error: error.message };
    }
  };

  // Listar ebooks ativos (página Ebooks do blog)
  client.getEbooks = async function() {
    try {
      const { data, error } = await this
        .from('blog360_ebooks')
        .select('id, titulo, descricao_curta, descricao_completa, arquivo_url, imagem_capa_url, tipo_envio, ordem')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Erro ao buscar ebooks:', error);
      return { success: false, data: [], error: error.message };
    }
  };

  // Listar quizzes (admin: todos; blog: só ativos via RLS)
  client.getQuizzes = async function(activeOnly) {
    try {
      var query = this.from('blog360_quizzes').select('id, title, slug, description, active, created_at').order('created_at', { ascending: false });
      if (activeOnly === true) query = query.eq('active', true);
      var res = await query;
      if (res.error) throw res.error;
      return { success: true, data: res.data || [] };
    } catch (error) {
      console.error('Erro ao buscar quizzes:', error);
      return { success: false, data: [], error: error.message };
    }
  };

  // Buscar quiz por slug (para página do blog) – com perguntas, opções e resultados
  client.getQuizBySlug = async function(slug) {
    try {
      var qRes = await this.from('blog360_quizzes').select('*').eq('slug', slug).eq('active', true).maybeSingle();
      if (qRes.error) throw qRes.error;
      if (!qRes.data) return { success: true, data: null };
      var quiz = qRes.data;
      var qqRes = await this.from('blog360_quiz_questions').select('id, sort_order, question_text').eq('quiz_id', quiz.id).order('sort_order', { ascending: true });
      if (qqRes.error) throw qqRes.error;
      var questions = qqRes.data || [];
      for (var i = 0; i < questions.length; i++) {
        var optRes = await this.from('blog360_quiz_options').select('option_letter, option_text').eq('question_id', questions[i].id).order('option_letter');
        questions[i].options = (optRes.data || []).sort(function(a, b) { return (a.option_letter > b.option_letter) ? 1 : -1; });
      }
      quiz.questions = questions;
      var resRes = await this.from('blog360_quiz_results').select('result_letter, title, message').eq('quiz_id', quiz.id);
      if (resRes.error) throw resRes.error;
      quiz.results = resRes.data || [];
      return { success: true, data: quiz };
    } catch (error) {
      console.error('Erro ao buscar quiz por slug:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  // Buscar quiz por id com perguntas/opções/resultados (admin)
  client.getQuizById = async function(id) {
    try {
      var qRes = await this.from('blog360_quizzes').select('*').eq('id', id).maybeSingle();
      if (qRes.error) throw qRes.error;
      if (!qRes.data) return { success: true, data: null };
      var quiz = qRes.data;
      var qqRes = await this.from('blog360_quiz_questions').select('id, sort_order, question_text').eq('quiz_id', quiz.id).order('sort_order', { ascending: true });
      if (qqRes.error) throw qqRes.error;
      var questions = qqRes.data || [];
      for (var i = 0; i < questions.length; i++) {
        var optRes = await this.from('blog360_quiz_options').select('option_letter, option_text').eq('question_id', questions[i].id).order('option_letter');
        questions[i].options = optRes.data || [];
      }
      quiz.questions = questions;
      var resRes = await this.from('blog360_quiz_results').select('result_letter, title, message').eq('quiz_id', quiz.id);
      quiz.results = resRes.data || [];
      return { success: true, data: quiz };
    } catch (error) {
      console.error('Erro ao buscar quiz por id:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  supabaseClient = client;
  console.log('✅ Cliente Supabase criado (getPosts/getPostBySlug/getProtocols/getQuizzes/getQuizBySlug/getQuizById)');
  
  return supabaseClient;
}

// Auto-inicializar se Supabase estiver disponível
if (typeof window !== 'undefined') {
  window.initSupabase = initSupabase;
}

// Para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupabaseClient, initSupabase };
}
