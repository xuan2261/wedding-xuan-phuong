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


  function splitDisplayName(value) {
    const words = String(value || "").trim().split(/\s+/).filter(Boolean);
    if (words.length <= 1) return [words[0] || "", ""];
    return [words.slice(0, -1).join(" "), words[words.length - 1]];
  }

  function setHeroNames(groomName, brideName) {
    const [groomLine1, groomLine2] = splitDisplayName(groomName);
    const [brideLine1, brideLine2] = splitDisplayName(brideName);

    setText("[data-hero-groom-line1]", groomLine1);
    setText("[data-hero-groom-line2]", groomLine2);
    setText("[data-hero-bride-line1]", brideLine1);
    setText("[data-hero-bride-line2]", brideLine2);
    setText("[data-hero-accessible]", `${groomName} và ${brideName}`);
  }

  function setBalancedInvitationHeading(value) {
    const words = String(value || "").trim().split(/\s+/).filter(Boolean);
    const splitAt = Math.max(1, Math.ceil(words.length / 2));
    setText("[data-invitation-heading-line1]", words.slice(0, splitAt).join(" "));
    setText("[data-invitation-heading-line2]", words.slice(splitAt).join(" "));
  }


  function wishesAreReady() {
    const wishes = config.wishes;
    if (!wishes || !wishes.enabled) return false;

    return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/.test(
      String(wishes.apiUrl || "").trim()
    );
  }

  function giftsAreReady() {
    if (!Array.isArray(config.gifts) || config.gifts.length === 0) return false;

    const placeholderNumbers = new Set(["11111111", "222222"]);
    return config.gifts.every((gift) => {
      const accountNumber = String(gift.accountNumber || "").replace(/\s+/g, "");
      return (
        gift.bankName &&
        gift.accountName &&
        gift.qrImage &&
        accountNumber.length >= 6 &&
        !placeholderNumbers.has(accountNumber)
      );
    });
  }

  function applyConfig() {
    const { couple, event, invitation, rsvp, site } = config;

    document.title = `Lễ Thành Hôn · ${couple.groomDisplayName} & ${couple.brideDisplayName}`;

    setText("[data-groom-display]", couple.groomDisplayName);
    setText("[data-bride-display]", couple.brideDisplayName);
    setHeroNames(couple.groomDisplayName, couple.brideDisplayName);
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

    setBalancedInvitationHeading(invitation.heading);
    setText("[data-invitation-message]", invitation.message);
    setText("[data-rsvp-deadline]", rsvp.deadline);
    setText("[data-footer]", site.footer);

    const mapsLink = $("[data-maps-link]");
    mapsLink.href = event.mapsUrl;

    const rsvpButton = $("#rsvpButton");
    const rsvpNote = $("#rsvpNote");
    const giftButton = $("#giftButton");
    const wishButton = $("#wishButton");
    const wishesSection = $("#wishes");

    giftButton.hidden = !giftsAreReady();

    const wishesReady = wishesAreReady();
    wishButton.hidden = !wishesReady;
    wishesSection.hidden = !wishesReady;

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


  const wishState = {
    items: [],
    visibleCount: 0,
    loadingScript: null,
    loadingTimer: null,
    submitTimer: null,
    submitting: false
  };

  function getWishClientKey() {
    const storageKey = "wedding-wish-client-key-v1";

    try {
      const existing = window.localStorage.getItem(storageKey);
      if (existing) return existing;

      const generated =
        window.crypto?.randomUUID?.() ||
        `client-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

      window.localStorage.setItem(storageKey, generated);
      return generated;
    } catch {
      return `session-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    }
  }

  function getLastWishSubmittedAt() {
    try {
      return Number(window.localStorage.getItem("wedding-wish-submitted-at-v1")) || 0;
    } catch {
      return 0;
    }
  }

  function rememberWishSubmission() {
    try {
      window.localStorage.setItem(
        "wedding-wish-submitted-at-v1",
        String(Date.now())
      );
    } catch {
      // Chế độ riêng tư có thể từ chối localStorage; server vẫn có rate limit.
    }
  }

  function setWishFormStatus(message, state = "") {
    const status = $("#wishFormStatus");
    status.textContent = message;
    status.dataset.state = state;
  }

  function createWishCard(wish) {
    const card = document.createElement("article");
    card.className = "wish-card";
    if (wish.featured) card.classList.add("wish-card--featured");

    const message = document.createElement("p");
    message.className = "wish-card__message";
    message.textContent = wish.message;

    const author = document.createElement("p");
    author.className = "wish-card__author";
    author.textContent = `— ${wish.displayName}`;

    if (wish.relationship) {
      const relationship = document.createElement("span");
      relationship.className = "wish-card__relationship";
      relationship.textContent = wish.relationship;
      author.append(relationship);
    }

    card.append(message, author);
    return card;
  }

  function renderWishes() {
    const wishes = config.wishes;
    const grid = $("#wishesGrid");
    const status = $("#wishesStatus");
    const loadMore = $("#wishesLoadMore");
    const visible = wishState.items.slice(0, wishState.visibleCount);

    grid.replaceChildren(...visible.map(createWishCard));

    if (wishState.items.length === 0) {
      status.textContent =
        "Hãy là người đầu tiên gửi lời chúc đến Thanh Xuân và Thị Phượng.";
      status.hidden = false;
    } else {
      status.hidden = true;
    }

    loadMore.hidden = wishState.visibleCount >= wishState.items.length;
    loadMore.textContent = `Xem thêm lời chúc (${wishState.items.length - wishState.visibleCount})`;
  }

  function cleanupWishJsonp(callbackName) {
    window.clearTimeout(wishState.loadingTimer);
    wishState.loadingTimer = null;

    if (wishState.loadingScript) {
      wishState.loadingScript.remove();
      wishState.loadingScript = null;
    }

    if (window.__weddingWishCallbacks) {
      delete window.__weddingWishCallbacks[callbackName];
    }
  }

  function loadApprovedWishes() {
    if (!wishesAreReady()) return;

    const wishes = config.wishes;
    const status = $("#wishesStatus");
    status.hidden = false;
    status.textContent = "Đang tải những lời chúc đã được duyệt…";

    window.__weddingWishCallbacks ||= {};
    const callbackName = `cb_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;
    const callbackPath = `__weddingWishCallbacks.${callbackName}`;

    window.__weddingWishCallbacks[callbackName] = (payload) => {
      cleanupWishJsonp(callbackName);

      if (!payload?.ok || !Array.isArray(payload.wishes)) {
        status.textContent =
          "Chưa tải được lời chúc. Quý vị vẫn có thể gửi lời chúc mới.";
        return;
      }

      wishState.items = payload.wishes
        .filter(
          (wish) =>
            wish &&
            typeof wish.displayName === "string" &&
            typeof wish.message === "string"
        )
        .map((wish) => ({
          id: String(wish.id || ""),
          displayName: wish.displayName.trim(),
          relationship: String(wish.relationship || "").trim(),
          message: wish.message.trim(),
          featured: Boolean(wish.featured)
        }));

      wishState.visibleCount = Math.min(
        wishes.initialDisplayLimit,
        wishState.items.length
      );
      renderWishes();
    };

    const url = new URL(wishes.apiUrl);
    url.searchParams.set("action", "list");
    url.searchParams.set("callback", callbackPath);
    url.searchParams.set("_", String(Date.now()));

    const script = document.createElement("script");
    script.src = url.toString();
    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.addEventListener("error", () => {
      cleanupWishJsonp(callbackName);
      status.textContent =
        "Chưa tải được lời chúc. Quý vị vẫn có thể gửi lời chúc mới.";
    });

    wishState.loadingScript = script;
    wishState.loadingTimer = window.setTimeout(() => {
      cleanupWishJsonp(callbackName);
      status.textContent =
        "Máy chủ lời chúc phản hồi chậm. Vui lòng thử lại sau.";
    }, wishes.requestTimeoutMs);

    document.head.append(script);
  }

  function setupWishes() {
    if (!wishesAreReady()) return;

    const wishes = config.wishes;
    const dialog = $("#wishDialog");
    const form = $("#wishForm");
    const displayName = $("#wishDisplayName");
    const relationship = $("#wishRelationship");
    const message = $("#wishMessage");
    const counter = $("#wishMessageCount");
    const consent = $("#wishConsent");
    const submitButton = $("#wishSubmitButton");
    const clientKey = $("#wishClientKey");
    const openedAt = $("#wishOpenedAt");
    const requestId = $("#wishRequestId");
    const siteOrigin = $("#wishSiteOrigin");
    const openButtons = [$("#wishButton"), $("#wishesSectionButton")];
    const closeButtons = $$("[data-close-wish-dialog]", dialog);
    const loadMore = $("#wishesLoadMore");

    form.action = wishes.apiUrl;
    displayName.maxLength = wishes.maxNameLength;
    relationship.maxLength = wishes.maxRelationshipLength;
    message.minLength = wishes.minMessageLength;
    message.maxLength = wishes.maxMessageLength;
    clientKey.value = getWishClientKey();
    siteOrigin.value = window.location.origin;

    const updateCounter = () => {
      counter.textContent = `${message.value.length}/${wishes.maxMessageLength}`;
    };

    const openDialog = () => {
      openedAt.value = String(Date.now());
      requestId.value = "";
      setWishFormStatus("");
      dialog.showModal();
      window.setTimeout(() => displayName.focus(), 0);
    };

    openButtons.forEach((button) => {
      button.addEventListener("click", openDialog);
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", () => dialog.close());
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", () => {
      window.clearTimeout(wishState.submitTimer);
      wishState.submitTimer = null;
      wishState.submitting = false;
      submitButton.disabled = false;
    });

    message.addEventListener("input", updateCounter);
    updateCounter();

    loadMore.addEventListener("click", () => {
      wishState.visibleCount = Math.min(
        wishState.visibleCount + wishes.pageSize,
        wishState.items.length
      );
      renderWishes();
    });

    form.addEventListener("submit", (event) => {
      const normalizedName = displayName.value.trim();
      const normalizedRelationship = relationship.value.trim();
      const normalizedMessage = message.value.trim();
      const elapsed = Date.now() - Number(openedAt.value || 0);
      const cooldownMs = wishes.cooldownSeconds * 1000;
      const lastSubmittedAt = getLastWishSubmittedAt();

      displayName.value = normalizedName;
      relationship.value = normalizedRelationship;
      message.value = normalizedMessage;
      updateCounter();

      if (
        !form.checkValidity() ||
        normalizedName.length < 2 ||
        normalizedMessage.length < wishes.minMessageLength ||
        normalizedMessage.length > wishes.maxMessageLength ||
        !consent.checked
      ) {
        event.preventDefault();
        form.reportValidity();
        setWishFormStatus(
          "Vui lòng kiểm tra lại các trường bắt buộc.",
          "error"
        );
        return;
      }

      if (elapsed < 1200) {
        event.preventDefault();
        setWishFormStatus(
          "Vui lòng dành thêm một chút thời gian cho lời chúc.",
          "error"
        );
        return;
      }

      if (Date.now() - lastSubmittedAt < cooldownMs) {
        event.preventDefault();
        const seconds = Math.ceil(
          (cooldownMs - (Date.now() - lastSubmittedAt)) / 1000
        );
        setWishFormStatus(
          `Quý vị vừa gửi lời chúc. Vui lòng chờ khoảng ${seconds} giây trước khi gửi lại.`,
          "error"
        );
        return;
      }

      if (wishState.submitting) {
        event.preventDefault();
        return;
      }

      wishState.submitting = true;
      submitButton.disabled = true;
      requestId.value =
        window.crypto?.randomUUID?.() ||
        `request-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      setWishFormStatus("Đang gửi lời chúc…");

      wishState.submitTimer = window.setTimeout(() => {
        wishState.submitting = false;
        submitButton.disabled = false;
        setWishFormStatus(
          "Chưa nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.",
          "error"
        );
      }, wishes.requestTimeoutMs);
    });

    const allowedMessageOrigins = new Set([
      "https://script.google.com",
      "https://script.googleusercontent.com"
    ]);

    window.addEventListener("message", (event) => {
      if (!allowedMessageOrigins.has(event.origin)) return;

      const payload = event.data;
      if (
        !payload ||
        payload.type !== "wedding-wish-result-v1" ||
        payload.requestId !== requestId.value
      ) {
        return;
      }

      window.clearTimeout(wishState.submitTimer);
      wishState.submitTimer = null;
      wishState.submitting = false;
      submitButton.disabled = false;

      if (payload.ok) {
        rememberWishSubmission();
        setWishFormStatus(
          "Cảm ơn Quý vị! Lời chúc đã được gửi và sẽ xuất hiện sau khi được hai gia đình duyệt.",
          "success"
        );
        form.reset();
        clientKey.value = getWishClientKey();
        siteOrigin.value = window.location.origin;
        openedAt.value = String(Date.now());
        requestId.value = "";
        updateCounter();
        return;
      }

      setWishFormStatus(
        payload.message ||
          "Chưa thể gửi lời chúc. Vui lòng thử lại sau.",
        "error"
      );
    });

    loadApprovedWishes();
  }

  function setupGiftDialog() {
    const dialog = $("#giftDialog");
    const grid = $("#giftGrid");
    const openButton = $("#giftButton");
    const closeButton = $("[data-close-dialog]", dialog);

    if (!giftsAreReady()) return;

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
    const openInvitationButton = $("#openInvitationButton");
    const mutedIcon = $("[data-music-icon=\"muted\"]", button);
    const playingIcon = $("[data-music-icon=\"playing\"]", button);
    const screenReaderLabel = $(".sr-only", button);

    if (!music.enabled) return;

    button.hidden = false;
    audio.src = music.file;
    audio.setAttribute("aria-label", music.title);

    // Âm lượng mặc định vừa phải. Có thể đặt music.volume trong config.js.
    const configuredVolume =
      typeof music.volume === "number" ? music.volume : 0.75;
    audio.volume = Math.min(1, Math.max(0, configuredVolume));

    const syncMusicButton = () => {
      const isPlaying = !audio.paused && !audio.ended;
      const accessibleLabel = isPlaying
        ? "Tắt nhạc nền"
        : "Bật nhạc nền";

      button.setAttribute("aria-pressed", String(isPlaying));
      button.setAttribute("aria-label", accessibleLabel);
      button.title = accessibleLabel;

      mutedIcon.toggleAttribute("hidden", isPlaying);
      playingIcon.toggleAttribute("hidden", !isPlaying);
      screenReaderLabel.textContent = accessibleLabel;
    };

    const playMusic = async ({ silent = false } = {}) => {
      try {
        await audio.play();
        syncMusicButton();
        return true;
      } catch (error) {
        syncMusicButton();

        // NotAllowedError thường là do chính sách autoplay của trình duyệt.
        if (!silent && error?.name !== "NotAllowedError") {
          showToast(
            "Không phát được nhạc. Hãy kiểm tra assets/audio/music.mp3."
          );
        }

        return false;
      }
    };

    const pauseMusic = () => {
      audio.pause();
      syncMusicButton();
    };

    button.addEventListener("click", async () => {
      if (audio.paused) {
        await playMusic();
      } else {
        pauseMusic();
      }
    });

    // "Mở thiệp" là thao tác chủ động của khách nên trình duyệt cho phép
    // bắt đầu nhạc tại đây. Đây là cách ổn định hơn autoplay khi vừa tải trang.
    openInvitationButton?.addEventListener("click", () => {
      if (audio.paused) {
        void playMusic({ silent: true });
      }
    });

    // Đồng bộ icon ngay cả khi audio bị dừng bởi hệ điều hành/trình duyệt.
    ["play", "pause", "ended", "volumechange"].forEach((eventName) => {
      audio.addEventListener(eventName, syncMusicButton);
    });

    syncMusicButton();

    // Thử autoplay trên các trình duyệt/tài khoản đã cấp quyền trước đó.
    // Nếu bị chặn, code sẽ im lặng chờ khách bấm "Mở thiệp".
    void playMusic({ silent: true });
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
  setupWishes();
  setupLightbox();
  setupMusic();
})();
