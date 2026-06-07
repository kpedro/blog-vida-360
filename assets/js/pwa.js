(function () {
  var DISMISS_KEY = "vida360_pwa_install_dismissed";

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.navigator.standalone === true
    );
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isDismissed() {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch (_err) {
      return false;
    }
  }

  function dismissBanner() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch (_err) {
      /* ignorar */
    }
  }

  function shouldShowBannerHere() {
    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    return path === "" || path === "/" || path === "/index.html";
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function (err) {
        console.warn("[Vida 360] Service worker não registrado:", err);
      });
    });
  }

  function mountInstallBanner(deferredPrompt, iosHint) {
    if (!shouldShowBannerHere() || isStandalone() || isDismissed()) return;
    if (!deferredPrompt && !iosHint) return;

    var wrap = document.createElement("section");
    wrap.className = "vida360-pwa-install";
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "Instalar aplicativo Vida 360");

    var html =
      '<div class="vida360-pwa-install__header">' +
      '<div>' +
      '<p class="vida360-pwa-install__title">Instalar Vida 360º no computador ou celular</p>' +
      '<p class="vida360-pwa-install__text">Abre em janela própria, como um app — acesse pelo menu Iniciar, barra de tarefas ou tela inicial.</p>' +
      "</div>" +
      '<button type="button" class="vida360-pwa-install__close" aria-label="Fechar">✕</button>' +
      "</div>";

    if (deferredPrompt) {
      html +=
        '<button type="button" class="vida360-pwa-install__btn" data-action="install">' +
        "Instalar aplicativo" +
        "</button>";
    }

    if (iosHint && !deferredPrompt) {
      html +=
        '<p class="vida360-pwa-install__ios">No iPhone ou iPad: Safari → Compartilhar → "Adicionar à Tela de Início". Abre direto na <strong>home do blog</strong>.</p>';
    }

    wrap.innerHTML = html;

    wrap.querySelector(".vida360-pwa-install__close").addEventListener("click", function () {
      dismissBanner();
      wrap.remove();
    });

    var installBtn = wrap.querySelector('[data-action="install"]');
    if (installBtn && deferredPrompt) {
      installBtn.addEventListener("click", function () {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () {
          wrap.remove();
        });
      });
    }

    var home = document.getElementById("home");
    if (home && home.parentNode) {
      home.parentNode.insertBefore(wrap, home);
      return;
    }

    document.body.insertBefore(wrap, document.body.firstChild);
  }

  registerServiceWorker();

  document.addEventListener("DOMContentLoaded", function () {
    if (isStandalone() || isDismissed() || !shouldShowBannerHere()) return;

    var deferredPrompt = null;
    var iosHint = isIos() && !isStandalone();

    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredPrompt = event;
      mountInstallBanner(deferredPrompt, iosHint);
    });

    window.addEventListener("appinstalled", function () {
      deferredPrompt = null;
      var existing = document.querySelector(".vida360-pwa-install");
      if (existing) existing.remove();
    });

    if (iosHint) {
      setTimeout(function () {
        if (!deferredPrompt) mountInstallBanner(null, iosHint);
      }, 800);
    }
  });
})();
