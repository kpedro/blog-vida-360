/**
 * Carrega faixa de oportunidade (blog360_site_settings) em #site-opportunity-strip
 * Requer: @supabase/supabase-js, assets/js/supabase.js (initSupabase)
 */
(function () {
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
        if (!client || !client.getSiteSettings) return;

        var res = await client.getSiteSettings();
        if (!res.success || !res.data) return;
        var s = res.data;
        var active = !!s.faixa_oportunidade_ativo;
        var text = (s.faixa_oportunidade_texto || '').trim();
        if (!active || !text) {
            root.classList.add('is-hidden');
            root.innerHTML = '';
            root.removeAttribute('data-active');
            return;
        }

        var link = (s.faixa_oportunidade_link || '').trim();
        var cta = (s.faixa_oportunidade_cta || '').trim() || 'Saiba mais';

        var inner = '<div class="site-opportunity-strip__inner">';
        inner += '<p class="site-opportunity-strip__text">' + escHtml(text) + '</p>';
        if (/^https?:\/\//i.test(link)) {
            inner += '<a class="site-opportunity-strip__cta" href="' + escAttr(link) + '" target="_blank" rel="noopener noreferrer sponsored">' + escHtml(cta) + '</a>';
        }
        inner += '</div>';
        root.innerHTML = inner;
        root.classList.remove('is-hidden');
        root.setAttribute('data-active', 'true');
    }

    function run() {
        setTimeout(function () { loadOpportunityStrip(); }, 280);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
