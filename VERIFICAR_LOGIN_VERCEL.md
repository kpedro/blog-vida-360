# Como Verificar Login no Vercel

## Problema
O login funciona localmente mas não funciona no Vercel.

## Possíveis Causas

### 1. Variáveis de Ambiente no Vercel
O Vercel pode não estar usando as variáveis de ambiente corretas.

**Solução:**
1. Acesse o dashboard do Vercel: https://vercel.com/dashboard
2. Selecione o projeto `blog-vida-360`
3. Vá em **Settings** → **Environment Variables**
4. Verifique se existem:
   - `VITE_SUPABASE_URL` = `https://qrjmvqedoypxmnvfdetg.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Se não existirem, adicione:**
- Clique em **Add New**
- Nome: `VITE_SUPABASE_URL`
- Valor: `https://qrjmvqedoypxmnvfdetg.supabase.co`
- Ambiente: Production, Preview, Development (marque todos)
- Repita para `VITE_SUPABASE_ANON_KEY`

### 2. Verificar Console do Navegador
1. Abra o site no Vercel
2. Pressione F12 para abrir o DevTools
3. Vá na aba **Console**
4. Tente fazer login
5. Veja se aparecem erros como:
   - "Supabase não inicializado"
   - "Credenciais não configuradas"
   - Erros de CORS

### 3. Verificar se o Usuário Existe no Supabase
1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Vá em **Authentication** → **Users**
3. Verifique se o email `kadson.pedro@gmail.com` existe
4. Verifique se o email está confirmado (coluna "Email Confirmed")

### 4. Testar Credenciais Diretamente
Abra o console do navegador no site do Vercel e execute:

```javascript
console.log('URL:', window.VITE_SUPABASE_URL);
console.log('Key:', window.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'NÃO CONFIGURADA');
console.log('Supabase:', typeof window.supabase !== 'undefined' ? 'Carregado' : 'NÃO CARREGADO');
console.log('Client:', window.supabaseClient ? 'Inicializado' : 'NÃO INICIALIZADO');
```

## Correções Aplicadas

1. ✅ Melhorada inicialização do Supabase para aguardar CDN carregar
2. ✅ Adicionado retry logic para garantir inicialização
3. ✅ Melhorados logs de debug
4. ✅ Adicionada verificação de credenciais antes do login

## Próximos Passos

1. **Aguarde o deploy no Vercel** (alguns segundos após o push)
2. **Teste o login novamente**
3. **Verifique o console** (F12) para ver os logs
4. **Se ainda não funcionar**, verifique as variáveis de ambiente no Vercel

## Se Ainda Não Funcionar

1. Verifique se o email está confirmado no Supabase
2. Tente usar "Esqueci minha senha" para redefinir
3. Verifique se há erros de CORS no console
4. Confirme que as variáveis de ambiente estão configuradas no Vercel
