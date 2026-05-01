/**
 * Widget principal: Chat n8n (substitui Instagram quando configurado)
 * Fallback: botão Instagram quando webhook ainda não foi configurado.
 */
(function () {
    var existingFloat = document.querySelector('.whatsapp-float');
    if (existingFloat) {
        existingFloat.remove();
    }

    var CONFIG_CACHE_KEY = 'blog360_specialist_chat_config';
    var DEFAULT_LINK_COMPRA = 'https://doterra.me/ITKQz';
    var DEFAULT_LINK_CADASTRO = 'https://doterra.me/pntJ4H';
    var DEFAULT_WHATSAPP_NUMBER = '5592994314016';
    /** Mensagem inicial no campo de texto do WhatsApp (ajuda a abrir a conversa com contexto). */
    var DEFAULT_WHATSAPP_PREFILL =
        'Olá, Kadson! Vim pelo blog Vida 360º pelo assistente de IA e gostaria de continuar a conversa aqui no WhatsApp.';
    var DEFAULT_WHATSAPP =
        'https://wa.me/' + DEFAULT_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(DEFAULT_WHATSAPP_PREFILL);
    var cfg = {
        webhookUrl: '',
        linkCompra: DEFAULT_LINK_COMPRA,
        linkCadastro: DEFAULT_LINK_CADASTRO,
        agentName: 'Especialista Vida 360º'
    };

    function saveLocalConfig() {
        try { localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(cfg)); } catch (e) {}
    }

    function loadLocalConfig() {
        try {
            var raw = localStorage.getItem(CONFIG_CACHE_KEY);
            if (!raw) return;
            var j = JSON.parse(raw);
            cfg.webhookUrl = j.webhookUrl || cfg.webhookUrl;
            cfg.linkCompra = j.linkCompra || cfg.linkCompra;
            cfg.linkCadastro = j.linkCadastro || cfg.linkCadastro;
            cfg.agentName = j.agentName || cfg.agentName;
        } catch (e) {}
    }

    async function loadRemoteConfig() {
        var supabaseUrl = window.VITE_SUPABASE_URL || 'https://qrjmvqedoypxmnvfdetg.supabase.co';
        var anon = window.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyam12cWVkb3lweG1udmZkZXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDc3MjYsImV4cCI6MjA3OTIyMzcyNn0.QjhD8GQsNiNX58EvVUJvf9seNYGR6ruLvpF1lHpSX8E';
        try {
            var url = supabaseUrl + '/rest/v1/blog360_site_settings?id=eq.1&select=agente_chat_webhook_url,agente_chat_link_compra,agente_chat_link_cadastro,agente_chat_nome';
            var res = await fetch(url, {
                headers: {
                    apikey: anon,
                    Authorization: 'Bearer ' + anon,
                    Accept: 'application/json'
                }
            });
            if (!res.ok) return;
            var rows = await res.json();
            var row = Array.isArray(rows) && rows.length ? rows[0] : null;
            if (!row) return;
            cfg.webhookUrl = row.agente_chat_webhook_url || cfg.webhookUrl;
            cfg.linkCompra = row.agente_chat_link_compra || cfg.linkCompra;
            cfg.linkCadastro = row.agente_chat_link_cadastro || cfg.linkCadastro;
            cfg.agentName = row.agente_chat_nome || cfg.agentName;
            saveLocalConfig();
        } catch (e) {}
    }

    function addInstagramButton() {
        var link = document.createElement('a');
        link.href = 'https://www.instagram.com/vida360.bemestar/';
        link.className = 'whatsapp-float';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', 'Abrir Instagram do Vida 360º');
        link.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm8.9 1.3a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/></svg>';
        document.body.appendChild(link);
    }

    function injectN8nCustomStyles() {
        if (document.getElementById('blog360-n8n-chat-theme')) return;
        var style = document.createElement('style');
        style.id = 'blog360-n8n-chat-theme';
        style.textContent = [
            ':root {',
            '  --chat--color-primary: #7f3f98;',
            '  --chat--color-primary-shade-50: #6d2d86;',
            '  --chat--color-primary-shade-100: #5b256f;',
            '  --chat--color-secondary: #f4ecf7;',
            '  --chat--color-secondary-shade-50: #eadcf1;',
            '  --chat--color-white: #ffffff;',
            '  --chat--color-light: #fbf8fd;',
            '  --chat--color-light-shade-50: #f4ecf7;',
            '  --chat--color-light-shade-100: #eadcf1;',
            '  --chat--color-medium: #6b7280;',
            '  --chat--color-dark: #2b1236;',
            '  --chat--border-radius: 22px;',
            '  --chat--spacing: 0.9rem;',
            '}',
            '',
            '.n8n-chat .chat-window, .n8n-chat .chat-layout, .chat-window, .chat-layout {',
            '  border-radius: 26px !important;',
            '  border: 1px solid #eadcf1 !important;',
            '  box-shadow: 0 14px 32px rgba(109, 45, 134, 0.16) !important;',
            '  max-height: min(80vh, 680px) !important;',
            '  overflow: hidden !important;',
            '  background: #ffffff !important;',
            '}',
            '',
            '.n8n-chat .chat-header, .chat-header {',
            '  background: linear-gradient(135deg, #7f3f98, #9b59b6) !important;',
            '  color: #fff !important;',
            '  padding: 0.72rem 1rem !important;',
            '  min-height: auto !important;',
            '  display: flex !important;',
            '  flex-direction: column !important;',
            '  justify-content: center !important;',
            '  gap: 0.3rem !important;',
            '  position: relative !important;',
            '  overflow: hidden !important;',
            '}',
            '',
            '.n8n-chat .chat-header::before, .chat-header::before {',
            '  content: "" !important;',
            '  position: absolute !important;',
            '  inset: 0 !important;',
            '  background: linear-gradient(135deg, #7f3f98, #9b59b6) !important;',
            '  z-index: 0 !important;',
            '}',
            '',
            '.n8n-chat .chat-header > *, .chat-header > * {',
            '  position: relative !important;',
            '  z-index: 1 !important;',
            '}',
            '.n8n-chat .chat-header-wrapper, .chat-header-wrapper, .n8n-chat .chat-header-container, .chat-header-container, .n8n-chat .chat-window-header, .chat-window-header {',
            '  background: linear-gradient(135deg, #7f3f98, #9b59b6) !important;',
            '  border: 0 !important;',
            '}',
            '',
            '.n8n-chat .chat-header h1, .n8n-chat .chat-header h2, .n8n-chat .chat-header p, .chat-header h1, .chat-header h2, .chat-header p {',
            '  color: #fff !important;',
            '  margin: 0 !important;',
            '  line-height: 1.25 !important;',
            '}',
            '',
            '.n8n-chat .chat-header p, .chat-header p {',
            '  opacity: 0.95 !important;',
            '  font-size: 0.95rem !important;',
            '}',
            '',
            '.n8n-chat .chat-header button,',
            '.n8n-chat .chat-header [role="button"],',
            '.n8n-chat .chat-header .chat-window-close,',
            '.n8n-chat .chat-header .chat-close-button,',
            '.n8n-chat .chat-header [class*="close"],',
            '.n8n-chat .chat-header [class*="button"],',
            '.n8n-chat .chat-header [class*="action"],',
            '.chat-header button,',
            '.chat-header [role="button"],',
            '.chat-header .chat-window-close,',
            '.chat-header .chat-close-button,',
            '.chat-header [class*="close"],',
            '.chat-header [class*="button"],',
            '.chat-header [class*="action"] {',
            '  background: transparent !important;',
            '  background-color: transparent !important;',
            '  color: #ffffff !important;',
            '  border: 0 !important;',
            '  box-shadow: none !important;',
            '}',
            '',
            '.n8n-chat .chat-header button::before,',
            '.n8n-chat .chat-header button::after,',
            '.n8n-chat .chat-header [class*="close"]::before,',
            '.n8n-chat .chat-header [class*="close"]::after,',
            '.n8n-chat .chat-header [class*="button"]::before,',
            '.n8n-chat .chat-header [class*="button"]::after,',
            '.chat-header button::before,',
            '.chat-header button::after,',
            '.chat-header [class*="close"]::before,',
            '.chat-header [class*="close"]::after,',
            '.chat-header [class*="button"]::before,',
            '.chat-header [class*="button"]::after {',
            '  background: transparent !important;',
            '  background-color: transparent !important;',
            '}',
            '',
            '.n8n-chat .chat-message.chat-message-from-bot .chat-message-markdown,',
            '.n8n-chat .chat-message.chat-message-from-bot .chat-message-text,',
            '.chat-message.chat-message-from-bot .chat-message-markdown,',
            '.chat-message.chat-message-from-bot .chat-message-text {',
            '  background: #f4ecf7 !important;',
            '  color: #2b1236 !important;',
            '  border: 1px solid #eadcf1 !important;',
            '  border-radius: 18px !important;',
            '  padding: 0.62rem 0.82rem !important;',
            '  text-align: left !important;',
            '  line-height: 1.55 !important;',
            '  letter-spacing: 0 !important;',
            '  white-space: pre-line !important;',
            '}',
            '',
            '/* Ligações clicáveis (markdown do n8n ou o nosso linkify): cor e sublinhado perceptíveis. */',
            '.n8n-chat .chat-message.chat-message-from-bot .chat-message-markdown a,',
            '.n8n-chat .chat-message.chat-message-from-bot .chat-message-text a,',
            '.chat-message.chat-message-from-bot .chat-message-markdown a,',
            '.chat-message.chat-message-from-bot .chat-message-text a {',
            '  color: #5b21b6 !important;',
            '  text-decoration: underline !important;',
            '  font-weight: 600 !important;',
            '  cursor: pointer !important;',
            '  pointer-events: auto !important;',
            '  word-break: break-word !important;',
            '}',
            '',
            '.n8n-chat .chat-message.chat-message-from-user .chat-message-markdown,',
            '.n8n-chat .chat-message.chat-message-from-user .chat-message-text,',
            '.chat-message.chat-message-from-user .chat-message-markdown,',
            '.chat-message.chat-message-from-user .chat-message-text {',
            '  background: linear-gradient(135deg, #7f3f98, #9b59b6) !important;',
            '  color: #fff !important;',
            '  border: 1px solid #6d2d86 !important;',
            '  box-shadow: 0 4px 14px rgba(109, 45, 134, 0.22) !important;',
            '  border-radius: 18px !important;',
            '  padding: 0.7rem 0.88rem !important;',
            '  text-align: left !important;',
            '  line-height: 1.5 !important;',
            '  white-space: pre-line !important;',
            '}',
            '',
            '.n8n-chat .chat-message.chat-message-from-user, .chat-message.chat-message-from-user {',
            '  background: #ffffff !important;',
            '}',
            '',
            '.n8n-chat .chat-message.chat-message-from-user *:not(code),',
            '.chat-message.chat-message-from-user *:not(code) {',
            '  color: #fff !important;',
            '}',
            '',
            '.n8n-chat .chat-footer textarea,',
            '.n8n-chat .chat-footer input,',
            '.chat-footer textarea,',
            '.chat-footer input {',
            '  border: 1px solid #d9c2e3 !important;',
            '  background: #fff !important;',
            '  border-radius: 14px !important;',
            '  padding: 0.62rem 0.78rem !important;',
            '}',
            '',
            '.n8n-chat .chat-body, .chat-body {',
            '  background: #ffffff !important;',
            '  padding: 0.18rem 0.28rem 0.08rem !important;',
            '}',
            '',
            '.n8n-chat .chat-message-list, .chat-message-list {',
            '  padding-top: 4px !important;',
            '  padding-bottom: 6px !important;',
            '}',
            '.n8n-chat .chat-message-list > :first-child, .chat-message-list > :first-child {',
            '  margin-top: 0 !important;',
            '}',
            '',
            '.n8n-chat .chat-message, .chat-message {',
            '  margin-bottom: 0.38rem !important;',
            '}',
            '.n8n-chat .chat-message.chat-message-from-bot:first-of-type, .chat-message.chat-message-from-bot:first-of-type {',
            '  margin-top: 0.12rem !important;',
            '}',
            '',
            '.n8n-chat .chat-footer button, .chat-footer button, .chat-footer svg {',
            '  color: #7f3f98 !important;',
            '}',
            '',
            '.n8n-chat .chat-footer button, .chat-footer button {',
            '  background: #f4ecf7 !important;',
            '  border-radius: 14px !important;',
            '  width: 44px !important;',
            '  height: 44px !important;',
            '}',
            '',
            '.n8n-chat .chat-message .blog360-inline-chat-link,',
            '.chat-message .blog360-inline-chat-link {',
            '  color: #6d2d86 !important;',
            '  text-decoration: underline !important;',
            '  word-break: break-word !important;',
            '}',
            '',
            '.n8n-chat .chat-window-toggle, .chat-window-toggle {',
            '  background: linear-gradient(135deg, #7f3f98, #9b59b6) !important;',
            '  box-shadow: 0 10px 22px rgba(109, 45, 134, 0.28) !important;',
            '  border-radius: 999px !important;',
            '}',
            '',
            '.blog360-chat-quick-actions {',
            '  display: grid !important;',
            '  grid-template-columns: 1fr !important;',
            '  gap: 0.38rem !important;',
            '  margin: 0 0.72rem 0.34rem !important;',
            '  padding: 0.44rem 0 0 !important;',
            '  border-top: 1px solid #efe7f4 !important;',
            '  background: #ffffff !important;',
            '}',
            '.blog360-chat-quick-title {',
            '  margin: 0 !important;',
            '  color: #6b7280 !important;',
            '  font-size: 0.9rem !important;',
            '  line-height: 1.35 !important;',
            '}',
            '.blog360-chat-quick-grid {',
            '  display: flex !important;',
            '  flex-wrap: wrap !important;',
            '  gap: 0.42rem !important;',
            '  width: 100% !important;',
            '}',
            '.blog360-chat-quick-grid button {',
            '  display: inline-flex !important;',
            '  align-items: center !important;',
            '  justify-content: center !important;',
            '  font-weight: 600 !important;',
            '  font-size: 0.9rem !important;',
            '  line-height: 1.15 !important;',
            '  border-radius: 12px !important;',
            '  padding: 0.52rem 0.8rem !important;',
            '  border: 1px solid #e7dbee !important;',
            '  color: #5f2d76 !important;',
            '  background: #ffffff !important;',
            '  cursor: pointer !important;',
            '  width: auto !important;',
            '  min-width: 0 !important;',
            '  white-space: nowrap !important;',
            '  text-align: center !important;',
            '  box-shadow: 0 1px 2px rgba(17,24,39,.06) !important;',
            '}',
            '.blog360-chat-quick-grid button:hover {',
            '  background: #f7effc !important;',
            '  transform: translateY(-1px) !important;',
            '}',
            '.blog360-chat-quick-grid button.primary {',
            '  color: #fff !important;',
            '  border-color: #7f3f98 !important;',
            '  background: linear-gradient(135deg, #7f3f98, #9b59b6) !important;',
            '}',
            '.blog360-chat-quick-grid button.whatsapp {',
            '  color: #5f2d76 !important;',
            '  border-color: #d7c1e4 !important;',
            '  background: #ffffff !important;',
            '}',
            '.blog360-chat-quick-grid button:nth-child(1), .blog360-chat-quick-grid button:nth-child(2) {',
            '  flex: 1 1 calc(50% - 0.3rem) !important;',
            '}',
            '.blog360-chat-quick-grid button:nth-child(3) {',
            '  flex: 0 1 auto !important;',
            '  margin-left: auto !important;',
            '  margin-right: auto !important;',
            '  min-width: 170px !important;',
            '}',
            '@media (max-width: 520px) { .blog360-chat-quick-grid button { width: 100% !important; white-space: normal !important; } .blog360-chat-quick-grid button:nth-child(3){min-width:0 !important;} }',
            '',
            '.n8n-chat .chat-message .chat-message-header,',
            '.n8n-chat .chat-message .chat-message-sender,',
            '.n8n-chat .chat-message .chat-message-author,',
            '.n8n-chat .chat-message .chat-message-role,',
            '.n8n-chat .chat-message .chat-message-label,',
            '.n8n-chat .chat-message .chat-message-meta,',
            '.chat-message .chat-message-header,',
            '.chat-message .chat-message-sender,',
            '.chat-message .chat-message-author,',
            '.chat-message .chat-message-role,',
            '.chat-message .chat-message-label,',
            '.chat-message .chat-message-meta {',
            '  display: none !important;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    function repairBrokenPtBrText() {
        var replacements = {
            'In��cio': 'Início',
            'Pol��tica': 'Política',
            'Recomenda����es': 'Recomendações',
            'Navega��ǜo': 'Navegação',
            'TransparǦncia': 'Transparência',
            'conteǧdo': 'conteúdo',
            'saǧde': 'saúde',
            'vocǦ': 'você',
            'nǜo': 'não',
            'orienta��ǜo': 'orientação',
            'indica��ǜo': 'indicação',
            'Pr��ximo passo': 'Próximo passo',
            'seguran��a': 'segurança',
            'estǭticos': 'estáticos',
            'rǭpida': 'rápida',
            'Ǹ': 'é',
            '��leos': 'óleos',
            'equil�brio': 'equilíbrio',
            'dǧvidas': 'dúvidas'
        };

        function replaceText(value) {
            if (!value) return value;
            var output = value;
            Object.keys(replacements).forEach(function (broken) {
                if (output.indexOf(broken) !== -1) {
                    output = output.split(broken).join(replacements[broken]);
                }
            });
            return output;
        }

        function patchNodeText(root) {
            if (!root || !root.childNodes) return;
            var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
            var node;
            while ((node = walker.nextNode())) {
                var original = node.nodeValue;
                var fixed = replaceText(original);
                if (fixed !== original) node.nodeValue = fixed;
            }
        }

        function patchAttributes() {
            document.querySelectorAll('[title],[aria-label],[placeholder],[alt]').forEach(function (el) {
                ['title', 'aria-label', 'placeholder', 'alt'].forEach(function (attr) {
                    var original = el.getAttribute(attr);
                    if (!original) return;
                    var fixed = replaceText(original);
                    if (fixed !== original) el.setAttribute(attr, fixed);
                });
            });
        }

        patchNodeText(document.body);
        patchAttributes();
    }

    function normalizeChatLanguage() {
        var replacements = {
            'Type your message..': 'Digite sua mensagem...',
            'Type your message...': 'Digite sua mensagem...',
            'Write a message...': 'Digite sua mensagem...',
            'New conversation': 'Nova conversa',
            'Close chat': 'Fechar chat',
            'Powered by n8n': 'Atendimento Vida 360º',
            'Hi there!': 'Ola! Bem-vindo(a)!',
            'How can I help you?': 'Como posso ajudar voce hoje?'
        };

        function replaceInNode(node) {
            if (!node || !node.childNodes) return;
            var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
            var textNode;
            while ((textNode = walker.nextNode())) {
                var text = textNode.nodeValue;
                if (!text || !text.trim()) continue;
                Object.keys(replacements).forEach(function (key) {
                    if (text.indexOf(key) !== -1) {
                        textNode.nodeValue = text.replace(key, replacements[key]);
                    }
                });
            }
        }

        function applyTranslations() {
            document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(function (el) {
                var ph = el.getAttribute('placeholder') || '';
                if (replacements[ph]) {
                    el.setAttribute('placeholder', replacements[ph]);
                }
            });
            replaceInNode(document.body);
        }

        applyTranslations();
        var observer = new MutationObserver(function () { applyTranslations(); });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    function normalizeBotMessageText(linkPack) {
        linkPack = linkPack || {};

        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        /** Ao ler só `textContent`, links renderizados em <a href> aparecem sem URL — recupera os href antes de limpar. */
        function flattenDomAnchorsToPlain(root) {
            if (!root) return '';
            var out = '';
            function walk(node) {
                if (!node) return;
                if (node.nodeType === Node.TEXT_NODE) {
                    out += node.nodeValue || '';
                    return;
                }
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                var tag = node.tagName.toUpperCase();
                if (tag === 'SCRIPT' || tag === 'STYLE') return;
                if (tag === 'BR') {
                    out += '\n';
                    return;
                }
                if (tag === 'A') {
                    var href = (node.getAttribute('href') || '').trim().replace(/^javascript:/i, '');
                    var label = (node.textContent || '').trim();
                    if (/^https?:\/\//i.test(href)) {
                        var block = '';
                        if (label && label !== href) block += label + '\n';
                        block += href;
                        out += block + '\n\n';
                        return;
                    }
                }
                var ch = node.firstChild;
                while (ch) {
                    walk(ch);
                    ch = ch.nextSibling;
                }
                if (/^P|DIV|LI|SECTION|HEADER|BLOCKQUOTE$/i.test(tag)) out += '\n';
                if (/^H[1-6]$/i.test(tag)) out += '\n';
            }
            walk(root);
            return out;
        }

        function expandMarkdownLinks(s) {
            return s.replace(/\[([^\]]+)\]\(\s*(https?:\/\/[^)\\s]+)\s*\)/g, function (_m, label, url) {
                var lbl = String(label || '').trim();
                var u = String(url || '').trim();
                if (!u) return _m;
                if (lbl && lbl !== u) return lbl + '\n' + u + '\n\n';
                return u + '\n\n';
            });
        }

        function ensureMandatoryUrls(plainText, pack) {
            var out = String(plainText || '');
            function has(u) {
                return !!(u && out.indexOf(u) !== -1);
            }

            function appendBlock(lines, url) {
                if (!url || !/^https?:\/\//i.test(url) || has(url)) return;
                var trimmed = out.replace(/\s+$/, '');
                out = trimmed.length ? trimmed + '\n\n' + lines.join('\n') + '\n' + url : lines.join('\n') + '\n' + url;
            }

            var lc = out.toLowerCase();
            var wantsPc =
                /\b(cliente\s+preferencial|preferred\s+customer)\b/i.test(lc) ||
                /\bcadastro\s+como\s+cliente\s+preferencial\b/i.test(lc);
            var wantsConsultor =
                /\b(cadastro|cadastrar-me|cadastrar|ser)\b[^\n]{0,80}\bconsultor/i.test(lc) ||
                /\bconsultor[^\n]{0,40}\b(bem\s*-?\s*estar|doterra|oportunidade|cadastro)/i.test(lc);
            var wantsWa =
                /\bwhatsapp\b|\bwa\s*\.?\s*me\b|\bzap\b/i.test(lc) ||
                (/\bkadson\b/i.test(lc) && /\b(contato|falar|mensagem)\b/i.test(lc));

            if (wantsPc && pack.linkCompra) appendBlock(['Link (cliente preferencial doTERRA):'], pack.linkCompra);
            if (wantsConsultor && pack.linkCadastro) appendBlock(['Link (cadastro consultor(a) de bem-estar):'], pack.linkCadastro);
            if (wantsWa && pack.linkWhatsapp) appendBlock(['WhatsApp do Kadson (mensagem já sugerida):'], pack.linkWhatsapp);

            return out.replace(/\n{3,}/g, '\n\n').trim();
        }

        function cleanPlainFromElement(el, pack) {
            var merged = flattenDomAnchorsToPlain(el).trim();
            if (!merged) merged = el.textContent || '';
            merged = String(merged).replace(/\r\n/g, '\n');
            merged = merged.replace(/\\n/g, '\n');
            merged = merged.replace(/^\s*["“]+/, '').replace(/["”]+\s*$/, '');
            merged = expandMarkdownLinks(merged);
            merged = merged.replace(/\*\*([^*\n]+)\*\*/g, '$1');
            merged = merged.replace(/\*([^*\n]+)\*/g, '$1');
            merged = merged.replace(/^\s*[-*]\s+/gm, '• ');
            merged = merged.replace(/\n{3,}/g, '\n\n');
            merged = merged.trim();

            merged = ensureMandatoryUrls(merged, pack);
            return merged.trim();
        }

        /** Permite apenas estes hosts em texto solto (para URL que não coincide byte-a-byte com o pack). */
        function stripTrailingLinkPunctuation(u) {
            return String(u || '').replace(/\s+$/g, '').replace(/[)\].,;:!'»]+$/, '');
        }

        function isAllowlistedHttpsUrl(u) {
            try {
                var raw = stripTrailingLinkPunctuation(String(u || '').trim());
                if (!/^https:\/\//i.test(raw)) return '';
                var parsed = new URL(raw);
                if (parsed.protocol !== 'https:') return '';
                var host = (parsed.hostname || '').replace(/^www\./i, '').toLowerCase();
                if (host === 'doterra.me') {
                    var firstSeg = ((parsed.pathname || '/').replace(/^\//, '').split('/') || []).filter(Boolean)[0] || '';
                    if (!/^[A-Za-z0-9]+$/.test(firstSeg)) return '';
                    return parsed.origin + '/' + firstSeg + (parsed.search || '') + (parsed.hash || '');
                }
                if (host === 'wa.me') {
                    var head = ((parsed.pathname || '').replace(/^\//, '').split('/') || []).filter(Boolean)[0] || '';
                    if (!/^\d{8,18}$/.test(head)) return '';
                    return 'https://wa.me/' + head + (parsed.search || '') + (parsed.hash || '');
                }
                return '';
            } catch (e3) {
                return '';
            }
        }

        /** Sobe `<a>` com href allowlist sobre texto plano; pack entra primeiro (URLs exatas configuradas). */
        function trustedLinkifyHtml(s, pack) {
            var urlsPack = [];
            ['linkWhatsapp', 'linkCadastro', 'linkCompra'].forEach(function (k) {
                if (pack[k]) urlsPack.push(String(pack[k]));
            });

            /** Parte texto em `{t|link}` por URLs exatas configuradas */
            function splitSegmentsByExact(segmentsExact, needles) {
                var ordered = needles.slice().sort(function (a, b) { return b.length - a.length; });
                var segs = segmentsExact;
                ordered.forEach(function (u) {
                    var nextSegs = [];
                    segs.forEach(function (seg) {
                        if (seg.type !== 't') {
                            nextSegs.push(seg);
                            return;
                        }
                        var str = seg.val;
                        var idx = 0;
                        var pos = str.indexOf(u, idx);
                        while ((pos = str.indexOf(u, idx)) !== -1) {
                            if (pos > idx) nextSegs.push({ type: 't', val: str.slice(idx, pos) });
                            nextSegs.push({ type: 'a', val: u });
                            idx = pos + String(u).length;
                        }
                        if (idx < str.length) nextSegs.push({ type: 't', val: str.slice(idx) });
                    });
                    segs = nextSegs;
                });
                return segs;
            }

            /** Dentro dos pedaços de texto, apanha qualquer https://… allowlist pelo scan. */
            function splitTextByAllowlistedHttps(segList) {
                var outSegs = [];
                segList.forEach(function (seg) {
                    if (seg.type !== 't') {
                        outSegs.push(seg);
                        return;
                    }
                    var chunk = seg.val || '';
                    var i = 0;
                    while (i < chunk.length) {
                        var at = chunk.indexOf('https://', i);
                        if (at === -1) {
                            outSegs.push({ type: 't', val: chunk.slice(i) });
                            break;
                        }
                        if (at > i) outSegs.push({ type: 't', val: chunk.slice(i, at) });

                        var tailFromHttps = chunk.slice(at);
                        var ws = tailFromHttps.search(/\s/);
                        var rawToken = ws === -1 ? tailFromHttps : tailFromHttps.slice(0, ws);
                        var token = stripTrailingLinkPunctuation(rawToken);
                        var safeHref = isAllowlistedHttpsUrl(token);

                        if (safeHref) {
                            outSegs.push({ type: 'a', val: safeHref });
                            i = at + rawToken.length;
                        } else {
                            outSegs.push({ type: 't', val: chunk.slice(at, at + 'https://'.length) });
                            i = at + 'https://'.length;
                        }
                    }
                });
                return outSegs;
            }

            var base = [{ type: 't', val: String(s || '') }];
            var afterPack = splitSegmentsByExact(base, urlsPack.filter(Boolean));
            var finalSegs = splitTextByAllowlistedHttps(afterPack);

            var html = '';
            finalSegs.forEach(function (seg) {
                if (seg.type === 'a')
                    html += '<a href="' + escapeHtml(seg.val) + '" target="_blank" rel="noopener noreferrer" class="blog360-inline-chat-link">' +
                        escapeHtml(seg.val) + '</a>';
                else html += escapeHtml(seg.val).replace(/\n/g, '<br>');
            });
            return html;
        }

        var normalizeQueued = false;
        /** Vue/n8n volta a gravar innerHTML ao renderizar Markdown — volta a aplicar pouco depois. */
        function scheduleApply() {
            if (normalizeQueued) return;
            normalizeQueued = true;
            queueMicrotask(function () {
                normalizeQueued = false;
                applyInner();
                requestAnimationFrame(applyInner);
                setTimeout(applyInner, 40);
                setTimeout(applyInner, 140);
            });
        }

        function applyInner() {
            var selectors = [
                '.n8n-chat .chat-message.chat-message-from-bot .chat-message-text',
                '.n8n-chat .chat-message.chat-message-from-bot .chat-message-markdown',
                '.chat-message.chat-message-from-bot .chat-message-text',
                '.chat-message.chat-message-from-bot .chat-message-markdown'
            ];
            document.querySelectorAll(selectors.join(',')).forEach(function (el) {
                try {
                    if (el.closest && el.closest('.blog360-chat-quick-actions')) return;
                    var cleaned = cleanPlainFromElement(el, linkPack);
                    if (!cleaned) return;
                    var rendered = trustedLinkifyHtml(cleaned, linkPack).trim();
                    var cur = String(el.innerHTML || '').replace(/\s+/g, ' ').trim();
                    var nxt = String(rendered || '').replace(/\s+/g, ' ').trim();
                    if (cur === nxt) return;
                    el.innerHTML = rendered;
                    el.style.whiteSpace = 'normal';
                    if (el.setAttribute) el.setAttribute('data-blog360-plain', cleaned);
                } catch (e2) {}
            });
        }

        scheduleApply();
        var observer = new MutationObserver(function () {
            scheduleApply();
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    function injectQuickActions(linkCompra, linkCadastro, linkWhatsapp) {
        function apply() {
            var body = document.querySelector('.n8n-chat .chat-body, .chat-body');
            if (!body) return;
            if (body.querySelector('.blog360-chat-quick-actions')) return;

            var wrap = document.createElement('div');
            wrap.className = 'blog360-chat-quick-actions';
            wrap.innerHTML = [
                '<p class="blog360-chat-quick-title">Escolha uma opção ou digite abaixo:</p>',
                '<div class="blog360-chat-quick-grid">',
                '  <button type="button" class="primary" data-link="' + linkCompra + '">Cliente preferencial</button>',
                '  <button type="button" data-link="' + linkCadastro + '">Cadastro consultor</button>',
                '  <button type="button" class="whatsapp" data-link="' + linkWhatsapp + '">Falar no WhatsApp</button>',
                '</div>'
            ].join('');

            var firstElement = body.firstElementChild;
            if (firstElement) {
                body.insertBefore(wrap, firstElement);
            } else {
                body.appendChild(wrap);
            }
            wrap.querySelectorAll('button[data-link]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var url = btn.getAttribute('data-link');
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                });
            });
        }

        apply();
        var observer = new MutationObserver(function () { apply(); });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function initN8nWidget(webhookUrl) {
        if (window.__blog360N8nChatInit) return;
        window.__blog360N8nChatInit = true;

        var cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
        document.head.appendChild(cssLink);
        injectN8nCustomStyles();

        var linkCompra = cfg.linkCompra || DEFAULT_LINK_COMPRA;
        var linkCadastro = cfg.linkCadastro || DEFAULT_LINK_CADASTRO;
        var linkWhatsapp = DEFAULT_WHATSAPP;

        var moduleScript = document.createElement('script');
        moduleScript.type = 'module';
        moduleScript.textContent = [
            "import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';",
            "createChat({",
            "  webhookUrl: " + JSON.stringify(webhookUrl) + ",",
            "  mode: 'window',",
            "  showWelcomeScreen: false,",
            "  initialMessages: [",
            "    'Ola! Sou o assistente Vida 360º. Escolha uma opcao rapida abaixo ou digite sua duvida.'",
            "  ],",
            "  i18n: {",
            "    en: {",
            "      title: " + JSON.stringify(cfg.agentName || 'Especialista Vida 360º') + ",",
            "      subtitle: 'Tire duvidas sobre bem-estar e doTERRA',",
            "      footer: '',",
            "      getStarted: 'Iniciar conversa',",
            "      inputPlaceholder: 'Digite sua mensagem...',",
            "      closeButtonTooltip: 'Fechar chat'",
            "    }",
            "  }",
            "});"
        ].join('\n');
        document.body.appendChild(moduleScript);
        normalizeChatLanguage();
        normalizeBotMessageText({
            linkCompra: linkCompra,
            linkCadastro: linkCadastro,
            linkWhatsapp: linkWhatsapp
        });
        injectQuickActions(linkCompra, linkCadastro, linkWhatsapp);
    }

    loadLocalConfig();
    repairBrokenPtBrText();
    loadRemoteConfig().finally(function () {
        if (cfg.webhookUrl && /^https?:\/\//i.test(cfg.webhookUrl)) {
            initN8nWidget(cfg.webhookUrl);
        } else {
            addInstagramButton();
        }
    });
})();
