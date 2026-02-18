/**
 * Quiz dinâmico (carregado do Supabase) - quiz.html?quiz=slug
 * Lógica: maioria A / B / C
 */
(function () {
    'use strict';

    var WHATSAPP_NUMBER = '5592994314016';
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('quiz') || '';

    if (!slug) {
        window.location.href = 'quiz-suplementacao.html';
        return;
    }

    var loadingEl = document.getElementById('quiz-loading');
    var errorEl = document.getElementById('quiz-error');
    var wrapEl = document.getElementById('quiz-wrap');
    var quizData = null;

    function showLoading(show) {
        if (loadingEl) loadingEl.style.display = show ? 'block' : 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (wrapEl) wrapEl.style.display = show ? 'none' : 'block';
    }

    function showError() {
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (wrapEl) wrapEl.style.display = 'none';
    }

    function escapeHtml(s) {
        if (!s) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function renderQuiz(data) {
        quizData = data;
        document.getElementById('quiz-title').textContent = data.title || 'Quiz';
        var descEl = document.getElementById('quiz-description');
        descEl.textContent = data.description || 'Responda em poucos minutos';
        if (!data.description) descEl.style.display = 'none';

        var form = document.getElementById('quiz-form');
        form.innerHTML = '';
        var questions = data.questions || [];
        var totalSteps = questions.length;
        if (totalSteps === 0) {
            form.innerHTML = '<p class="quiz-error">Nenhuma pergunta configurada.</p>';
            return;
        }

        questions.forEach(function (q, i) {
            var step = document.createElement('div');
            step.className = 'quiz-step' + (i === 0 ? ' active' : '');
            step.setAttribute('data-step', String(i + 1));
            var opts = q.options || [];
            var optA = opts.find(function (o) { return o.option_letter === 'A'; });
            var optB = opts.find(function (o) { return o.option_letter === 'B'; });
            var optC = opts.find(function (o) { return o.option_letter === 'C'; });
            step.innerHTML = '<h2>' + (i + 1) + '. ' + escapeHtml(q.question_text || '') + '</h2>' +
                '<ul class="quiz-options">' +
                '<li><input type="radio" name="q' + (i + 1) + '" id="q' + (i + 1) + '_a" value="A" ' + (i === 0 ? 'required' : '') + '><label for="q' + (i + 1) + '_a">' + escapeHtml((optA && optA.option_text) || 'A') + '</label></li>' +
                '<li><input type="radio" name="q' + (i + 1) + '" id="q' + (i + 1) + '_b" value="B"><label for="q' + (i + 1) + '_b">' + escapeHtml((optB && optB.option_text) || 'B') + '</label></li>' +
                '<li><input type="radio" name="q' + (i + 1) + '" id="q' + (i + 1) + '_c" value="C"><label for="q' + (i + 1) + '_c">' + escapeHtml((optC && optC.option_text) || 'C') + '</label></li>' +
                '</ul>';
            form.appendChild(step);
        });

        var nav = document.createElement('div');
        nav.className = 'quiz-nav';
        nav.innerHTML = '<button type="button" id="quiz-prev" class="quiz-btn quiz-btn-prev" style="visibility:hidden">← Anterior</button>' +
            '<button type="button" id="quiz-next" class="quiz-btn quiz-btn-next">Próxima →</button>';
        form.appendChild(nav);

        initQuizLogic(totalSteps);
    }

    function getMajorityLetter(totalSteps) {
        var form = document.getElementById('quiz-form');
        var counts = { A: 0, B: 0, C: 0 };
        for (var i = 1; i <= totalSteps; i++) {
            var input = form.querySelector('input[name="q' + i + '"]:checked');
            if (input && counts.hasOwnProperty(input.value)) counts[input.value]++;
        }
        var max = Math.max(counts.A, counts.B, counts.C);
        if (counts.A === max) return 'A';
        if (counts.B === max) return 'B';
        return 'C';
    }

    function getResultByLetter(letter) {
        var results = (quizData && quizData.results) || [];
        var r = results.find(function (x) { return x.result_letter === letter; });
        return r ? { title: r.title || '', message: r.message || '' } : { title: 'Resultado', message: '' };
    }

    function initQuizLogic(totalSteps) {
        var form = document.getElementById('quiz-form');
        var steps = form.querySelectorAll('.quiz-step');
        var progressBar = document.getElementById('quiz-progress-bar');
        var btnPrev = document.getElementById('quiz-prev');
        var btnNext = document.getElementById('quiz-next');
        var quizResult = document.getElementById('quiz-result');
        var resultTitle = document.getElementById('result-title');
        var resultMessage = document.getElementById('result-message');
        var ctaWhatsapp = document.getElementById('cta-whatsapp');
        var currentStep = 1;

        function updateProgress() {
            var pct = (currentStep / totalSteps) * 100;
            if (progressBar) {
                progressBar.style.width = pct + '%';
                progressBar.setAttribute('aria-valuenow', Math.round(pct));
            }
        }

        function showStep(step) {
            currentStep = step;
            steps.forEach(function (el, i) {
                el.classList.toggle('active', (i + 1) === step);
            });
            if (btnPrev) btnPrev.style.visibility = step === 1 ? 'hidden' : 'visible';
            if (btnNext) btnNext.textContent = step === totalSteps ? 'Ver resultado' : 'Próxima →';
            updateProgress();
        }

        function showResult() {
            var letter = getMajorityLetter(totalSteps);
            var band = getResultByLetter(letter);
            if (resultTitle) resultTitle.textContent = band.title;
            if (resultMessage) resultMessage.textContent = band.message;
            if (ctaWhatsapp) {
                var text = encodeURIComponent('Olá! Fiz o quiz. Meu resultado: "' + band.title + '". Gostaria de saber mais.');
                ctaWhatsapp.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text;
            }
            form.style.display = 'none';
            var prog = form.previousElementSibling;
            if (prog && prog.classList.contains('quiz-progress')) prog.style.display = 'none';
            if (btnPrev && btnNext) { btnPrev.style.display = 'none'; btnNext.style.display = 'none'; }
            if (quizResult) quizResult.classList.add('active');
        }

        function goNext() {
            var stepInput = form.querySelector('input[name="q' + currentStep + '"]:checked');
            if (currentStep < totalSteps) {
                if (!stepInput) return;
                showStep(currentStep + 1);
            } else {
                if (!stepInput) return;
                showResult();
            }
        }

        function goPrev() {
            if (currentStep > 1) showStep(currentStep - 1);
        }

        if (btnNext) btnNext.addEventListener('click', goNext);
        if (btnPrev) btnPrev.addEventListener('click', goPrev);
        form.addEventListener('submit', function (e) { e.preventDefault(); goNext(); });
    }

    function init() {
        if (typeof initSupabase === 'function') window.supabaseClient = initSupabase();
        var client = window.supabaseClient;
        if (!client || !client.getQuizBySlug) {
            setTimeout(init, 150);
            return;
        }
        client.getQuizBySlug(slug).then(function (res) {
            showLoading(false);
            if (!res.success || !res.data) {
                showError();
                return;
            }
            renderQuiz(res.data);
        }).catch(function () {
            showLoading(false);
            showError();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
