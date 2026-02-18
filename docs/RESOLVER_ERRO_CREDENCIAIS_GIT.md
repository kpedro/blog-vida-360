# Como resolver erro SEC_E_NO_CREDENTIALS no Git (Windows)

O erro `SEC_E_NO_CREDENTIALS` acontece quando o Git não consegue acessar suas credenciais do GitHub no Windows. Segue como resolver.

---

## Solução 1: Usar Personal Access Token (recomendado)

### Passo 1: Criar um Personal Access Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome (ex: "Blog Vida 360 - Cursor")
4. Selecione escopos:
   - ✅ **repo** (acesso completo aos repositórios)
5. Clique em **"Generate token"**
6. **Copie o token** (você só verá uma vez!)

### Passo 2: Configurar o Git para usar o token

**Opção A: Configurar globalmente (mais fácil)**

```powershell
git config --global credential.helper wincred
```

Depois, ao fazer `git push`, o Git pedirá:
- **Username:** seu usuário do GitHub (ex: `kpedro`)
- **Password:** cole o **Personal Access Token** (não sua senha!)

**Opção B: Usar o token diretamente na URL (temporário)**

```powershell
git remote set-url origin https://SEU_TOKEN@github.com/kpedro/blog-vida-360.git
```

Substitua `SEU_TOKEN` pelo token que você criou.

---

## Solução 2: Usar SSH em vez de HTTPS

### Passo 1: Gerar chave SSH (se ainda não tiver)

```powershell
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```

Pressione Enter para aceitar o local padrão. Se pedir senha, pode deixar vazio ou criar uma.

### Passo 2: Adicionar a chave pública ao GitHub

1. Copie o conteúdo de `C:\Users\Kadson\.ssh\id_ed25519.pub`
2. Acesse: https://github.com/settings/keys
3. Clique em **"New SSH key"**
4. Cole a chave e salve

### Passo 3: Alterar a URL do repositório para SSH

```powershell
cd C:\Users\Kadson\blog-vida-360
git remote set-url origin git@github.com:kpedro/blog-vida-360.git
```

Agora `git push` não pedirá credenciais.

---

## Solução 3: Limpar e reconfigurar credenciais do Windows

Se você já tinha credenciais salvas e elas estão corrompidas:

### Passo 1: Abrir Credential Manager

1. Pressione `Win + R`
2. Digite: `control /name Microsoft.CredentialManager`
3. Vá em **"Credentiales do Windows"**
4. Procure por entradas relacionadas a `git:https://github.com` ou `github.com`
5. **Remova** essas entradas

### Passo 2: Reconfigurar o helper

```powershell
git config --global credential.helper manager-core
```

Ou:

```powershell
git config --global credential.helper wincred
```

### Passo 3: Tentar push novamente

```powershell
git push origin main
```

Quando pedir credenciais:
- **Username:** seu usuário GitHub
- **Password:** Personal Access Token (não sua senha!)

---

## Solução 4: Usar GitHub CLI (gh)

### Instalar GitHub CLI

1. Baixe: https://cli.github.com/
2. Ou via winget: `winget install GitHub.cli`

### Autenticar

```powershell
gh auth login
```

Escolha:
- GitHub.com
- HTTPS
- Login via navegador

Depois disso, o Git usará automaticamente as credenciais do `gh`.

---

## Verificar configuração atual

```powershell
# Ver URL do remote
git remote -v

# Ver helper configurado
git config --global credential.helper

# Ver todas as configs
git config --list --global
```

---

## Recomendação rápida

**Para resolver agora:**

1. Crie um Personal Access Token: https://github.com/settings/tokens
2. Configure o helper:
   ```powershell
   git config --global credential.helper manager-core
   ```
3. Faça push:
   ```powershell
   cd C:\Users\Kadson\blog-vida-360
   git push origin main
   ```
4. Quando pedir:
   - **Username:** `kpedro`
   - **Password:** cole o **token** (não sua senha)

**Para longo prazo:** use SSH (Solução 2) — mais seguro e não expira.

---

## Troubleshooting

**"Ainda pede senha mesmo com token"**
- Certifique-se de usar o **token**, não sua senha do GitHub
- Verifique se o token tem escopo `repo`

**"Token expirado"**
- Crie um novo token e use-o como senha

**"Ainda dá erro"**
- Tente usar SSH (Solução 2)
- Ou use GitHub CLI (Solução 4)
