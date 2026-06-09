-- Faixa global do site: ponte editorial → Sistema Forja Campeã
UPDATE public.blog360_site_settings
SET
  faixa_oportunidade_ativo = true,
  faixa_oportunidade_texto = 'Construa sua rede com método: conheça o Sistema Forja Campeã — duplicação, treinamento e ferramentas com IA.',
  faixa_oportunidade_link = 'produtos.html',
  faixa_oportunidade_cta = 'Conhecer o Sistema',
  updated_at = NOW()
WHERE id = 1;
