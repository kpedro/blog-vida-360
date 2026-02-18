/**
 * Quiz - Lógica por maioria (A / B / C)
 * Blog Vida 360º - Suplementação e quizzes dinâmicos
 */
(function () {
    'use strict';

    var TOTAL_STEPS = 4;
    var WHATSAPP_NUMBER = '5592994314016';

    // Resultados por maioria (Maioria A / B / C)
    var RESULT_BY_MAJORITY = {
        A: { id: 'A', title: 'Base bem estruturada', message: 'Pela suas respostas, sua rotina parece bem estruturada em alimentação, movimento e cuidados. Manter a consistência e, se quiser, fazer acompanhamento com profissional para ajustes finos pode ser o próximo passo.' },
        B: { id: 'B', title: 'Ajustes necessários', message: 'Alguns pontos indicam que vale a pena reorganizar hábitos: alimentação, sono e atividade física. Pequenos ajustes fazem diferença. Considere conversar com um profissional para um plano personalizado.' },
        C: { id: 'C', title: 'Precisa reorganizar rotina', message: 'Sua rotina e respostas sugerem que o foco primeiro deve ser a base: alimentação, sono e movimento. Quando isso estiver mais estável, a suplementação pode ser avaliada com um profissional. Converse com médico ou nutricionista.' }
    };

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
        if (progressBar) {
            progressBar.style.width = pct + '%';
            progressBar.setAttribute('aria-valuenow', Math.round(pct));
        }
    }

    function showStep(step) {
        currentStep = step;
        steps.forEach(function (el) {
            var n = parseInt(el.getAttribute('data-step'), 10);
            el.classList.toggle('active', n === step);
        });
        if (btnPrev) btnPrev.style.visibility = step === 1 ? 'hidden' : 'visible';
        if (btnNext) btnNext.textContent = step === TOTAL_STEPS ? 'Ver resultado' : 'Próxima →';
        updateProgress();
    }

    /** Retorna a letra da maioria (A, B ou C) a partir das respostas */
    function getMajorityLetter() {
        var counts = { A: 0, B: 0, C: 0 };
        ['q1', 'q2', 'q3', 'q4'].forEach(function (name) {
            var input = form.querySelector('input[name="' + name + '"]:checked');
            if (input && counts.hasOwnProperty(input.value)) counts[input.value]++;
        });
        var max = Math.max(counts.A, counts.B, counts.C);
        if (counts.A === max) return 'A';
        if (counts.B === max) return 'B';
        return 'C';
    }

    function getResultByMajority(letter) {
        return RESULT_BY_MAJORITY[letter] || RESULT_BY_MAJORITY.B;
    }

    function showResult() {
        var letter = getMajorityLetter();
        var band = getResultByMajority(letter);
        if (resultTitle) resultTitle.textContent = band.title;
        if (resultMessage) resultMessage.textContent = band.message;
        if (ctaWhatsapp) {
            var text = encodeURIComponent('Olá! Fiz o quiz de suplementação. Meu resultado: "' + band.title + '". Gostaria de saber mais.');
            ctaWhatsapp.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text;
        }

        if (form) form.style.display = 'none';
        var prog = document.querySelector('.quiz-progress');
        if (prog) prog.style.display = 'none';
        var nav = document.querySelector('.quiz-nav');
        if (nav) nav.style.display = 'none';
        if (quizResult) quizResult.classList.add('active');
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

    if (btnNext) btnNext.addEventListener('click', goNext);
    if (btnPrev) btnPrev.addEventListener('click', goPrev);
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); goNext(); });
})();
