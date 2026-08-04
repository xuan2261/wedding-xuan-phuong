(() => {
  "use strict";

  const config = window.WEDDING_CONFIG?.weddingFilm;
  const section = document.querySelector("#wedding-film");
  const openButton = document.querySelector("#weddingFilmOpenButton");
  const dialog = document.querySelector("#weddingFilmDialog");
  const playerHost = document.querySelector("#weddingFilmPlayerHost");
  const externalLink = document.querySelector("#weddingFilmExternalLink");
  const title = document.querySelector("[data-wedding-film-title]");
  const subtitle = document.querySelector("[data-wedding-film-subtitle]");
  const buttonLabel = document.querySelector("[data-wedding-film-button]");

  if (!config?.enabled || config.provider !== "youtube" || !config.videoId || !section || !openButton || !dialog || !playerHost) {
    return;
  }

  const safeVideoId = String(config.videoId).trim();
  if (!/^[A-Za-z0-9_-]{11}$/.test(safeVideoId)) {
    console.error("Wedding Film: YouTube videoId không hợp lệ.");
    return;
  }

  if (title) title.textContent = config.title || "Chuyện chúng mình";
  if (subtitle) subtitle.textContent = config.subtitle || "Một thước phim nhỏ trước ngày chung đôi.";
  if (buttonLabel) buttonLabel.textContent = config.buttonLabel || "Xem video cưới";
  if (externalLink) externalLink.href = config.watchUrl || `https://youtu.be/${safeVideoId}`;
  section.hidden = false;

  const placeholder = () => {
    const message = document.createElement("p");
    message.className = "wedding-film-dialog__loading";
    message.id = "weddingFilmLoading";
    message.textContent = "Video sẽ được tải từ YouTube khi mở.";
    return message;
  };

  const buildEmbedUrl = () => {
    const host = config.privacyEnhanced === false
      ? "https://www.youtube.com"
      : "https://www.youtube-nocookie.com";
    const url = new URL(`${host}/embed/${safeVideoId}`);
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("playsinline", "1");
    url.searchParams.set("rel", "0");
    return url.toString();
  };

  let resumeMusicAfterClose = false;

  const pauseBackgroundMusic = () => {
    const audio = document.querySelector("#weddingMusic");
    resumeMusicAfterClose = Boolean(audio && !audio.paused && !audio.ended);
    if (resumeMusicAfterClose) audio.pause();
  };

  const restoreBackgroundMusic = () => {
    const audio = document.querySelector("#weddingMusic");
    const shouldResume = resumeMusicAfterClose;
    resumeMusicAfterClose = false;
    if (!shouldResume || !audio || !audio.paused) return;
    const result = audio.play();
    if (result && typeof result.catch === "function") {
      result.catch(() => {
        // Một số WebView yêu cầu thêm một thao tác người dùng; nút nhạc nền vẫn
        // là fallback và app.js tự đồng bộ trạng thái play/pause.
      });
    }
  };

  const unloadPlayer = () => {
    playerHost.replaceChildren(placeholder());
    playerHost.removeAttribute("aria-busy");
  };

  const loadPlayer = () => {
    if (playerHost.querySelector("iframe")) return;

    const frame = document.createElement("iframe");
    frame.className = "wedding-film-dialog__iframe";
    frame.title = config.title || "Video cưới Thanh Xuân và Thị Phượng";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.loading = "eager";
    frame.src = buildEmbedUrl();

    playerHost.setAttribute("aria-busy", "true");
    frame.addEventListener("load", () => playerHost.removeAttribute("aria-busy"), { once: true });
    playerHost.replaceChildren(frame);
  };

  const openFilm = () => {
    pauseBackgroundMusic();

    if (typeof dialog.showModal !== "function") {
      window.open(config.watchUrl || `https://youtu.be/${safeVideoId}`, "_blank", "noopener");
      restoreBackgroundMusic();
      return;
    }

    dialog.showModal();
    loadPlayer();
  };

  const closeFilm = () => {
    if (dialog.open) dialog.close();
  };

  openButton.addEventListener("click", openFilm);
  dialog.querySelectorAll("[data-close-wedding-film]").forEach((button) => {
    button.addEventListener("click", closeFilm);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeFilm();
  });
  dialog.addEventListener("close", () => {
    unloadPlayer();
    restoreBackgroundMusic();
    openButton.focus({ preventScroll: true });
  });
})();
