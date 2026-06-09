-- Atualiza artigo ponte publicado: remove menção doTERRA, alinha com Amway/Forja
UPDATE public.blog360_posts
SET
  conteudo_markdown = REPLACE(
    conteudo_markdown,
    'A Forja **não vende óleos, suplementos ou qualquer marca específica**. Ela organiza **como você trabalha a rede** que já escolheu — doTERRA, outra empresa ou mais de uma, se fizer sentido para você.',
    'A Forja **não vende produtos no blog**. Ela organiza **como você trabalha a rede** — na operação do Kadson, com foco em **Amway** e método replicável para a equipe.'
  ),
  updated_at = NOW()
WHERE slug = 'o-que-e-sistema-forja-campea'
  AND conteudo_markdown LIKE '%doTERRA%';
