(() => {
  "use strict";

  const config = window.WEDDING_CONFIG;

  if (!config) {
    console.error("Không tìm thấy WEDDING_CONFIG trong config.js");
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function setText(selector, value) {
    $$(selector).forEach((element) => {
      element.textContent = value;
    });
  }

  function applyConfig() {
    const { couple, event, invitation, rsvp, site } = config;

    document.title = `Lễ Thành Hôn · ${couple.groomDisplayName} & ${couple.brideDisplayName}`;

    setText("[data-groom-display]", couple.groomDisplayName);
    setText("[data-bride-display]", couple.brideDisplayName);
    setText("[data-groom-full]", couple.groomFullName);
    setText("[data-bride-full]", couple.brideFullName);

    setText("[data-date-display]", event.dateDisplay);
    setText("[data-weekday]", event.weekday);
    setText("[data-guest-time]", event.guestTime);
    setText("[data-ceremony-time]", event.ceremonyTime);
    setText("[data-lunar-date]", event.lunarDate);
    setText("[data-venue-name]", event.venueName);
    setText("[data-address-line1]", event.addressLine1);
    setText("[data-address-line2]", event.addressLine2);

    setText("[data-invitation-heading]", invitation.heading);
    setText("[data-invitation-message]", invitation.message);
    setText("[data-rsvp-deadline]", rsvp.deadline);
    setText("[data-footer]", site.footer);

    const mapsLink = $("[data-maps-link]");
    mapsLink.href = event.mapsUrl;

    const rsvpButton = $("#rsvpButton");
    const rsvpNote = $("#rsvpNote");

    if (rsvp.url) {
      rsvpButton.href = rsvp.url;
      rsvpButton.removeAttribute("aria-disabled");
      rsvpButton.textContent = "Xác nhận tham dự";
    } else {
      rsvpButton.removeAttribute("target");
      rsvpButton.setAttribute("aria-disabled", "true");
      rsvpButton.textContent = "RSVP sẽ cập nhật";
      rsvpNote.hidden = false;
      rsvpButton.addEventListener("click", (event) => {
        event.preventDefault();
        showToast("Chưa có link Google Forms. Hãy cập nhật trong config.js.");
      });
    }
  }

  function setupReveal() {
    const elements = $$(".reveal");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );

    elements.forEach((element) => observer.observe(element));
  }

  function setupCountdown() {
    const target = new Date(config.event.isoDateTime).getTime();
    const fields = {
      days: $("[data-days]"),
      hours: $("[data-hours]"),
      minutes: $("[data-minutes]"),
      seconds: $("[data-seconds]")
    };

    let timer;

    const update = () => {
      const difference = Math.max(0, target - Date.now());
      const days = Math.floor(difference / 86_400_000);
      const hours = Math.floor((difference % 86_400_000) / 3_600_000);
      const minutes = Math.floor((difference % 3_600_000) / 60_000);
      const seconds = Math.floor((difference % 60_000) / 1_000);

      fields.days.textContent = String(days).padStart(2, "0");
      fields.hours.textContent = String(hours).padStart(2, "0");
      fields.minutes.textContent = String(minutes).padStart(2, "0");
      fields.seconds.textContent = String(seconds).padStart(2, "0");

      if (difference === 0) {
        clearInterval(timer);
      }
    };

    update();
    timer = window.setInterval(update, 1000);
  }

  function setupGiftDialog() {
    const dialog = $("#giftDialog");
    const grid = $("#giftGrid");
    const openButton = $("#giftButton");
    const closeButton = $("[data-close-dialog]", dialog);

    grid.replaceChildren(
      ...config.gifts.map((gift) => {
        const card = document.createElement("article");
        card.className = "gift-card";

        const image = document.createElement("img");
        image.src = gift.qrImage;
        image.alt = `Mã QR ${gift.label}`;

        const title = document.createElement("h3");
        title.textContent = gift.label;

        const bank = document.createElement("p");
        bank.textContent = gift.bankName;

        const name = document.createElement("p");
        name.textContent = gift.accountName;

        const number = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = gift.accountNumber;
        number.append(strong);

        const copy = document.createElement("button");
        copy.type = "button";
        copy.className = "button button--secondary copy-button";
        copy.textContent = "Sao chép số tài khoản";
        copy.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(gift.accountNumber);
            showToast(`Đã sao chép: ${gift.accountNumber}`);
          } catch {
            showToast(`Số tài khoản: ${gift.accountNumber}`);
          }
        });

        card.append(image, title, bank, name, number, copy);
        return card;
      })
    );

    openButton.addEventListener("click", () => dialog.showModal());
    closeButton.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  function setupLightbox() {
    const dialog = $("#lightboxDialog");
    const image = $("#lightboxImage");
    const closeButton = $("[data-close-lightbox]", dialog);

    $$("[data-lightbox]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.lightbox;
        const sourceImage = $("img", button);
        image.src = `assets/images/${key}-1280.webp?v=5`;
        image.alt = sourceImage.alt;
        dialog.showModal();
      });
    });

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  function setupMusic() {
    const { music } = config;
    const button = $("#musicButton");
    const audio = $("#weddingMusic");

    if (!music.enabled) return;

    button.hidden = false;
    audio.src = music.file;
    audio.setAttribute("aria-label", music.title);

    button.addEventListener("click", async () => {
      if (audio.paused) {
        try {
          await audio.play();
          button.setAttribute("aria-pressed", "true");
          $(".sr-only", button).textContent = "Tắt nhạc nền";
        } catch {
          showToast("Không phát được nhạc. Hãy kiểm tra assets/audio/music.mp3.");
        }
      } else {
        audio.pause();
        button.setAttribute("aria-pressed", "false");
        $(".sr-only", button).textContent = "Bật nhạc nền";
      }
    });
  }

  let toastTimer;

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  applyConfig();
  setupReveal();
  setupCountdown();
  setupGiftDialog();
  setupLightbox();
  setupMusic();
})();
