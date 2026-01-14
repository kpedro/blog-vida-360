// ============================================
// API Route - Enviar Email via Resend
// Vercel Serverless Function
// ============================================

export default async function handler(req, res) {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Obter dados do body
    const { to, nome, tipo = 'welcome' } = req.body;

    // Validar email
    if (!to || !to.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Obter API key do Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY não configurada');
      return res.status(500).json({ error: 'Configuração de email não disponível' });
    }

    // Email de remetente (configurar no Vercel)
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@seudominio.com';

    // Template de email de boas-vindas
    const emailHtml = getWelcomeEmailTemplate(nome || 'Amigo');

    // Enviar email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: '🎉 Bem-vindo ao Blog Vida 360º!',
        html: emailHtml,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao enviar email:', data);
      return res.status(response.status).json({ 
        error: 'Erro ao enviar email', 
        details: data 
      });
    }

    console.log('✅ Email enviado com sucesso:', data.id);

    return res.status(200).json({ 
      success: true, 
      messageId: data.id,
      message: 'Email enviado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro na API:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
}

// ============================================
// TEMPLATE DE EMAIL DE BOAS-VINDAS
// ============================================

function getWelcomeEmailTemplate(nome) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Blog Vida 360º</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Vida 360º</h1>
              <p style="color: #ECF0F1; margin: 10px 0 0 0; font-size: 16px;">Bem-vindo à nossa comunidade!</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #2C3E50; margin: 0 0 20px 0; font-size: 24px;">Olá, ${nome}! 👋</h2>
              
              <p style="color: #34495E; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Que alegria ter você aqui! Você acaba de dar o primeiro passo em direção a uma vida mais plena, equilibrada e realizada.
              </p>

              <p style="color: #34495E; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                No Blog Vida 360º, você encontrará conteúdos exclusivos sobre:
              </p>

              <ul style="color: #34495E; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
                <li>💚 <strong>Saúde e Bem-estar</strong> - Dicas práticas para cuidar do corpo e da mente</li>
                <li>⚡ <strong>Produtividade</strong> - Estratégias para ser mais eficiente e alcançar seus objetivos</li>
                <li>🧠 <strong>Mentalidade</strong> - Desenvolvimento pessoal e crescimento contínuo</li>
                <li>⚖️ <strong>Equilíbrio</strong> - Como conciliar trabalho, vida pessoal e bem-estar</li>
              </ul>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://kpedro.github.io/blog-vida-360/" style="display: inline-block; background-color: #E74C3C; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">Explorar Conteúdos</a>
                  </td>
                </tr>
              </table>

              <p style="color: #7F8C8D; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                <strong>📧 O que você vai receber:</strong><br>
                • Novos artigos exclusivos toda semana<br>
                • Dicas práticas e aplicáveis no dia a dia<br>
                • Conteúdos sobre produtos e serviços que podem transformar sua vida<br>
                • Acesso antecipado a lançamentos e ofertas especiais
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #ECF0F1; padding: 30px; text-align: center;">
              <p style="color: #7F8C8D; font-size: 14px; margin: 0 0 10px 0;">
                <strong>Vida 360º</strong><br>
                Blog de Saúde, Bem-estar e Produtividade
              </p>
              <p style="color: #95A5A6; font-size: 12px; margin: 20px 0 0 0;">
                Você recebeu este email porque se cadastrou em nosso blog.<br>
                Se não foi você, pode ignorar este email.
              </p>
              <p style="color: #95A5A6; font-size: 12px; margin: 10px 0 0 0;">
                <a href="#" style="color: #3498DB; text-decoration: none;">Gerenciar preferências</a> | 
                <a href="#" style="color: #3498DB; text-decoration: none;">Cancelar inscrição</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
