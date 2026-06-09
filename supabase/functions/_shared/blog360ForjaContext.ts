/**
 * Contexto editorial híbrido — Blog Vida 360º + Sistema Forja Campeã.
 * Usado pelas Edge Functions de IA (Estúdio, coach, assistente, overlay).
 */

export const BLOG360_EDITORIAL_BASE = `O Blog Vida 360º é um blog brasileiro sobre saúde integral, bem-estar, rotina, sono, ansiedade leve, produtividade com equilíbrio e aromaterapia responsável.

Público: leitores que buscam conteúdo acessível, acolhedor e baseado em boas práticas, sem sensacionalismo.
Tom: acolhedor, claro, respeitoso; português brasileiro correto; evitar promessas milagrosas ou linguagem médica que substitua profissional de saúde.`;

export const BLOG360_FORJA_BRIDGE = `Modelo híbrido do blog (obrigatório quando o tema for negócio em rede ou Sistema Forja):
- Vida 360º = conteúdo editorial, SEO e credibilidade (bem-estar + rotina).
- Sistema Forja Campeã = plataforma recomendada para quem constrói marketing de rede com método (Plano 72h, 7 passos de duplicação, liderança em camadas, estúdio e ferramentas).
- O blog NÃO substitui a Forja — indica o sistema quando o assunto é duplicação, equipe parada ou liderança.
- A Forja NÃO vende marca de óleos/suplementos específica; funciona com a rede que a pessoa já escolheu (doTERRA ou outra).
- Sem promessa de renda fixa, lucro garantido ou cura de doenças.
- CTAs honestos: página ponte do blog (/produtos.html) ou forjacampea.com.br/como-funciona — não invente links de convite com token.`;

export const BLOG360_FORJA_CATEGORIES =
  "Categorias editoriais Forja no blog: sistema-forja (hub), plano-72h, duplicacao, lideranca.";

export const BLOG360_MARKETING_FORJA = `Na copy comercial do blog, quando o pedido for oportunidade, convite ou sistema:
- Priorize o Sistema Forja Campeã como recomendação principal do blog (método, 72h, duplicação).
- doTERRA ou produto específico só como caminho secundário/opcional, se o utilizador pedir explicitamente.
- Tom de convite profissional e acolhedor; sem hype de renda nem alegações médicas.`;

export function blog360FullContext(): string {
  return `${BLOG360_EDITORIAL_BASE}\n\n${BLOG360_FORJA_BRIDGE}`;
}
