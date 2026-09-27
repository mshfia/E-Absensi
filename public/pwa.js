(() => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    });
  }

  const installContainer = document.getElementById("installAppContainer");
  const installButton = document.getElementById("installApp");
  const isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;
  let installPrompt;

  if (!installContainer || !installButton || isStandalone) {
    return;
  }

  if (isIos) {
    installContainer.classList.add("visible");
    installButton.addEventListener("click", () => {
      window.alert(
        "Di Safari, ketuk Bagikan lalu pilih Tambahkan ke Layar Utama.",
      );
    });
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    installContainer.classList.add("visible");
  });

  installButton.addEventListener("click", async () => {
    if (!installPrompt) {
      return;
    }

    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installContainer.classList.remove("visible");
  });

  window.addEventListener("appinstalled", () => {
    installContainer.classList.remove("visible");
    installPrompt = null;
  });
})();
