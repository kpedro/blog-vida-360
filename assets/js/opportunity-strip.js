/**
 * Carrega faixa de oportunidade (blog360_site_settings) em #site-opportunity-strip
 * Requer: @supabase/supabase-js, assets/js/supabase.js (initSupabase)
 */
(function () {
    var FALLBACK_STRIP = {
        text: 'Construa sua rede com método: conheça o Sistema Forja Campeã — duplicação, treinamento e ferramentas com IA.',
        cta: 'Conhecer o Sistema',
        link: 'produtos.html',
    };

    function isLegacyOpportunityCopy(text) {
        return /amway|renda extra,\s*tempo livre|sua oportunidade|óleos essenciais da doTERRA|empreenda com propósito:\s*leve os óleos/i.test(
            String(text || '')
        );
    }

    function normalizeOpportunityBranding(text) {
        var t = String(text || '').trim();
        if (isLegacyOpportunityCopy(t)) return FALLBACK_STRIP.text;
        return t;
    }

    function normalizeOpportunityCta(cta) {
        var c = String(cta || '').trim();
        if (!c || /descubra agora|conhecer a doTERRA/i.test(c)) return FALLBACK_STRIP.cta;
        return c;
    }

    function normalizeOpportunityLink(link) {
        var l = String(link || '').trim();
        if (!l || /^https?:\/\/wa\.me\//i.test(l)) return FALLBACK_STRIP.link;
        return l;
    }

    function escHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    function escAttr(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;');
    }

    function renderStrip(root, text, cta, link) {
        var inner = '<div class="site-opportunity-strip__inner">';
        inner += '<p class="site-opportunity-strip__text">' + escHtml(text) + '</p>';
        if (link) {
            var rel = /^https?:\/\//i.test(link) ? 'noopener noreferrer sponsored' : 'noopener noreferrer';
            var target = /^https?:\/\//i.test(link) ? ' target="_blank"' : '';
            inner += '<a class="site-opportunity-strip__cta" href="' + escAttr(link) + '"' + target + ' rel="' + rel + '">' + escHtml(cta) + '</a>';
        }
        inner += '</div>';
        root.innerHTML = inner;
        root.classList.remove('is-hidden');
        root.setAttribute('data-active', 'true');
    }

    async function loadOpportunityStrip() {
        var root = document.getElementById('site-opportunity-strip');
        if (!root) return;

        var client = window.supabaseClient;
        if (typeof initSupabase === 'function' && !client) {
            client = initSupabase();
            window.supabaseClient = client;
        }
        var attempts = 0;
        while ((!client || !client.getSiteSettings) && attempts < 18) {
            await new Promise(function (r) { setTimeout(r, 200); });
            if (!window.supabaseClient && typeof initSupabase === 'function') {
                window.supabaseClient = initSupabase();
            }
            client = window.supabaseClient;
            attempts++;
        }
        if (!client || !client.getSiteSettings) {
            renderStrip(root, FALLBACK_STRIP.text, FALLBACK_STRIP.cta, FALLBACK_STRIP.link);
            return;
        }

        var res = await client.getSiteSettings();
        if (!res.success || !res.data) {
            renderStrip(root, FALLBACK_STRIP.text, FALLBACK_STRIP.cta, FALLBACK_STRIP.link);
            return;
        }
        var s = res.data;
        var active = !!s.faixa_oportunidade_ativo;
        var text = normalizeOpportunityBranding((s.faixa_oportunidade_texto || '').trim());
        if (!active || !text) {
            renderStrip(root, FALLBACK_STRIP.text, FALLBACK_STRIP.cta, FALLBACK_STRIP.link);
            return;
        }

        var link = normalizeOpportunityLink(s.faixa_oportunidade_link);
        var cta = normalizeOpportunityCta(s.faixa_oportunidade_cta) || 'Saiba mais';

        renderStrip(root, text, cta, link || FALLBACK_STRIP.link);
    }

    function run() {
        var root = document.getElementById('site-opportunity-strip');
        if (root) {
            // Render imediato para não depender de Supabase/configuração.
            renderStrip(root, FALLBACK_STRIP.text, FALLBACK_STRIP.cta, FALLBACK_STRIP.link);
        }
        setTimeout(function () {
            loadOpportunityStrip().catch(function () {
                // Mantém fallback já renderizado em caso de erro.
            });
        }, 280);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
