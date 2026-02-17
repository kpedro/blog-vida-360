# Não consigo entrar no painel – o que conferir

## 1. Projeto certo no Supabase

O blog usa estas credenciais (em `admin-login.html` e outras páginas):

- **URL do projeto:** `https://qrjmvqedoypxmnvfdetg.supabase.co`

Confira no Supabase: **Project Settings** (ícone de engrenagem) → **API** → **Project URL**.  
Tem que ser **exatamente** essa URL. Se o seu usuário foi criado em outro projeto, o login não vai funcionar neste.

---

## 2. Definir senha sem depender de email (se o email não chegar)

Foi criado um arquivo **`definir-senha-uma-vez.html`** na pasta do blog. Use **só no seu computador**, uma vez:

1. No Supabase: **Project Settings** (engrenagem) → **API** → copie a chave **service_role** (a secreta, não a anon).
2. Abra no navegador o arquivo **`definir-senha-uma-vez.html`** (duplo clique ou arraste para o Chrome/Edge).
3. Cole a chave **service_role** no campo indicado.
4. O **UID** do usuário kadson.pedro@gmail.com já vem preenchido (`d87aeb18-46c9-4a58-b9e4-0cb910bdce89`). Se for outro usuário, troque.
5. Digite a **nova senha** (mínimo 6 caracteres) e clique em **Definir senha**.
6. Depois entre no painel do blog com **kadson.pedro@gmail.com** e essa nova senha.
7. **Não** coloque a chave service_role em nenhum arquivo do projeto e **não** suba ela no Git. Pode apagar o `definir-senha-uma-vez.html` depois se quiser.

## 3. Redefinir a senha por email (quando o email estiver chegando)

1. Abra a página de login do painel do blog.
2. Digite seu email e clique em **Esqueci minha senha**.
3. Use o link que o Supabase enviar para definir uma nova senha.

---

## 4. URLs de redirecionamento (se usar “Esqueci minha senha”)

No Supabase: **Authentication** → **URL Configuration** → **Redirect URLs**.

Inclua a URL de onde você abre o blog, por exemplo:

- `http://localhost:8080/admin-login.html` (teste local)
- `https://seu-dominio.com/admin-login.html` (produção)
- `https://blog-vida-360.vercel.app/admin-login.html` (se for Vercel)

Salve e tente de novo o “Esqueci minha senha”.

---

## 5. Abrindo pelo mesmo “lugar” que os outros apps

Se você entra em outros apps (por exemplo PedagoFlow) com o mesmo usuário:

- Use a **mesma URL** do projeto no Supabase (a do item 1).
- Abra o blog no **mesmo tipo de ambiente** (local ou produção) em que os outros apps funcionam.

Se o blog estiver em um domínio que ainda não está em **Redirect URLs**, o fluxo de “Esqueci minha senha” pode falhar; o login com email/senha pode funcionar mesmo assim.

---

## 6. Mensagem de erro na tela

Na tela de login, a mensagem em vermelho pode ajudar:

- **“Email ou senha incorretos”** → use **Esqueci minha senha** e defina uma nova senha.
- **“Confirme seu email”** → abra o email de confirmação do Supabase e use o link; ou use “Esqueci minha senha”.
- Outra mensagem → anote o texto exato e confira no Supabase (Authentication / Logs) se aparece algum erro.

---

## Resumo rápido (email não chegou)

1. Abrir **`definir-senha-uma-vez.html`** no navegador (arquivo na pasta do blog).
2. No Supabase: **Project Settings → API** → copiar a chave **service_role**.
3. Colar a chave no arquivo, conferir o UID (já vem o do kadson.pedro@gmail.com), digitar a nova senha e clicar em **Definir senha**.
4. Entrar no painel com **kadson.pedro@gmail.com** e a nova senha.

Se ainda falhar, diga qual mensagem de erro aparece na tela (e se está em localhost ou em produção) para afinar o próximo passo.
