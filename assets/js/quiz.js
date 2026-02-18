/**
 * Quiz: Você realmente precisa de suplementação?
 * Blog Vida 360º - Lógica do quiz e CTA WhatsApp
 */
(function () {
    'use strict';

    var TOTAL_STEPS = 4;
    var WHATSAPP_NUMBER = '5592994314016';

    var form = document.getElementById('quiz-form');
    var steps = document.querySelectorAll('.quiz-step');
    var progressBar = document.getElementById('quiz-progress-bar');
    var btnPrev = document.getElementById('quiz-prev');
    var btnNext = document.getElementById('quiz-next');
    var quizResult = document.getElementById('quiz-result');
    var resultTitle = document.getElementById('result-title');
    var resultMessage = document.getElementById('result-message');
    var ctaWhatsapp = document.getElementById('cta-whatsapp');

    if (!form || !steps.length) return;

    var currentStep = 1;

    function updateProgress() {
        var pct = (currentStep / TOTAL_STEPS) * 100;
        progressBar.style.width = pct + '%';
        progressBar.setAttribute('aria-valuenow', Math.round(pct));
    }

    function showStep(step) {
        currentStep = step;
        steps.forEach(function (el) {
            var n = parseInt(el.getAttribute('data-step'), 10);
            el.classList.toggle('active', n === step);
        });
        btnPrev.style.visibility = step === 1 ? 'hidden' : 'visible';
        btnNext.textContent = step === TOTAL_STEPS ? 'Ver resultado' : 'Próxima →';
        updateProgress();
    }

    function getScore() {
        var score = 0;
        ['q1', 'q2', 'q3', 'q4'].forEach(function (name) {
            var input = form.querySelector('input[name="' + name + '"]:checked');
            if (input) score += parseInt(input.value, 10);
        });
        return score;
    }

    function getResultBand(score) {
        if (score <= 2) return { id: 'base', title: 'Sua base está boa', message: 'Pela sua rotina e respostas, sua alimentação e hábitos parecem bem estruturados. Manter consistência e, se quiser, fazer acompanhamento com profissional para ajustes finos pode ser o próximo passo.' };
        if (score <= 5) return { id: 'avaliar', title: 'Vale avaliar com calma', message: 'Alguns sinais indicam que pode valer a pena conversar com um profissional para avaliar se suplementação faz sentido para você. Priorize sempre alimentação e sono; suplementos são complementos, nunca substitutos.' };
        return { id: 'sinais', title: 'Sinais indicam que pode ajudar', message: 'Sua rotina e respostas sugerem que vale a pena uma avaliação profissional. Suplementação pode ser um suporte útil quando bem indicada. Converse com médico ou nutricionista para um plano personalizado.' };
    }

    function showResult() {
        var score = getScore();
        var band = getResultBand(score);
        resultTitle.textContent = band.title;
        resultMessage.textContent = band.message;
        var text = encodeURIComponent('Olá! Fiz o quiz de suplementação. Meu resultado: "' + band.title + '". Gostaria de saber mais.');
        ctaWhatsapp.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text;

        form.style.display = 'none';
        document.querySelector('.quiz-progress').style.display = 'none';
        document.querySelector('.quiz-nav').style.display = 'none';
        quizResult.classList.add('active');

        // Opcional: salvar resultado no Supabase (crie tabela blog360_quiz_respostas ou use leads com email)
        // Ex.: window.supabaseClient.from('blog360_quiz_respostas').insert({ quiz_id: 'suplementacao', score, band: band.id });
    }

    function goNext() {
        var stepInput = form.querySelector('input[name="q' + currentStep + '"]:checked');
        if (currentStep < TOTAL_STEPS) {
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

    btnNext.addEventListener('click', goNext);
    btnPrev.addEventListener('click', goPrev);

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        goNext();
    });
})();
