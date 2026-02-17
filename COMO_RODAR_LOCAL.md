# Como Rodar o Blog Vida 360º Localmente

## Problema Resolvido

Os erros `ERR_CONNECTION_REFUSED` ocorriam porque os arquivos JavaScript não estavam sendo carregados corretamente quando o HTML era aberto diretamente no navegador.

## Solução: Usar Servidor HTTP Local

### Opção 1: Servidor Node.js (Recomendado)

1. Abra o terminal na pasta do projeto
2. Execute:
   ```bash
   node server.js
   ```
3. Abra no navegador: `http://localhost:8000/admin-dashboard.html`

### Opção 2: Python (se tiver Python instalado)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Depois abra: `http://localhost:8000/admin-dashboard.html`

### Opção 3: Live Server (VS Code)

Se você usa VS Code:
1. Instale a extensão "Live Server"
2. Clique com botão direito no arquivo `admin-dashboard.html`
3. Selecione "Open with Live Server"

## Correções Aplicadas

1. ✅ Corrigido uso de `supabase` → `supabaseClient` nas linhas 186 e 192 do `admin.js`
2. ✅ Corrigida inicialização do Supabase para retornar o cliente diretamente
3. ✅ Criado servidor HTTP simples (`server.js`) para desenvolvimento local

## Verificação

Após iniciar o servidor, verifique no console do navegador:
- ✅ Não deve haver erros `ERR_CONNECTION_REFUSED`
- ✅ Deve aparecer: "✅ Supabase inicializado para admin dashboard"
- ✅ Deve aparecer: "✅ Cliente Supabase criado diretamente"
