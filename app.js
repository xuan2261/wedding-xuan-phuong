(() => {
  "use strict";

  const config = window.WEDDING_CONFIG;

  if (!config) {
    console.error("Không tìm thấy WEDDING_CONFIG trong config.js");
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const guestUtils = window.WEDDING_GUEST_UTILS;

  const guestState = {
    name: "",
    isPersonalized: false
  };

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



  function setupPersonalization() {
    const personalization = config.personalization || {};
    const fallbackName = String(
      personalization.fallbackName || "Quý vị"
    ).trim();

    if (!personalization.enabled || !guestUtils) {
      guestState.name = fallbackName;
      setText("[data-guest-name]", guestState.name);
      return;
    }

    const fromUrl = guestUtils.readGuestName(window.location, {
      parameter: personalization.parameter,
      maxLength: personalization.maxLength
    });

    let fromSession = "";

    if (!fromUrl && personalization.persistSession) {
      try {
        fromSession = guestUtils.sanitizeGuestName(
          window.sessionStorage.getItem(personalization.sessionKey),
          personalization.maxLength
        );
      } catch {
        // sessionStorage có thể bị chặn trong chế độ riêng tư.
      }
    }

    guestState.name = fromUrl || fromSession || fallbackName;
    guestState.isPersonalized = Boolean(fromUrl || fromSession);

    if (fromUrl && personalization.persistSession) {
      try {
        window.sessionStorage.setItem(
          personalization.sessionKey,
          fromUrl
        );
      } catch {
        // Không ảnh hưởng đến khả năng hiển thị tên trong lượt truy cập này.
      }
    }

    setText("[data-guest-name]", guestState.name);
  }

  function buildRsvpUrl() {
    if (!config.rsvp?.url) return "";

    if (!guestUtils) {
      return config.rsvp.url;
    }

    return guestUtils.buildRsvpUrl(
      config.rsvp.url,
      guestState.isPersonalized ? guestState.name : "",
      config.rsvp.guestNameEntry
    );
  }

  function buildEmbeddedRsvpUrl() {
    const regularUrl = buildRsvpUrl();
    if (!regularUrl) return "";

    try {
      const url = new URL(regularUrl, window.location.href);
      if (config.rsvp?.embedded !== false) {
        url.searchParams.set("embedded", "true");
      }
      return url.toString();
    } catch {
      return regularUrl;
    }
  }

  function setupFamilies() {
    const section = $("#families");
    const families = config.families;

    if (!section || !families?.enabled) {
      if (section) section.hidden = true;
      return;
    }

    const values = {
      "groom-father": families.groom?.father,
      "groom-mother": families.groom?.mother,
      "groom-location": families.groom?.location,
      "bride-father": families.bride?.father,
      "bride-mother": families.bride?.mother,
      "bride-location": families.bride?.location
    };

    let hasAnyValue = false;

    Object.entries(values).forEach(([key, rawValue]) => {
      const element = document.querySelector(
        `[data-family-field="${key}"]`
      );
      const value = String(rawValue || "").trim();

      if (!element || !value) return;

      hasAnyValue = true;
      element.hidden = false;

      const detail = $("dd", element);
      if (detail) {
        detail.textContent = value;
      } else {
        element.textContent = value;
      }
    });

    section.hidden = !hasAnyValue;
  }

  function setupEventActions() {
    const event = config.event;
    const copyAddressButton = $("#copyAddressButton");
    const directionContactButton = $("#directionContactButton");
    const venueNotes = $("#venueNotes");

    const fullAddress = [
      event.addressLine1,
      event.addressLine2
    ].filter(Boolean).join(", ");

    copyAddressButton?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(fullAddress);
        showToast("Đã sao chép địa chỉ.");
      } catch {
        window.prompt("Sao chép địa chỉ:", fullAddress);
      }
    });

    if (directionContactButton && config.contact?.groomPhone) {
      directionContactButton.href =
        `tel:${String(config.contact.groomPhone).replace(/\s+/g, "")}`;
    } else if (directionContactButton) {
      directionContactButton.hidden = true;
    }

    const noteMap = {
      landmark: event.landmarkNote,
      entrance: event.entranceNote,
      parking: event.parkingNote
    };

    let hasNote = false;
    Object.entries(noteMap).forEach(([key, rawValue]) => {
      const element = document.querySelector(
        `[data-venue-note="${key}"]`
      );
      const value = String(rawValue || "").trim();

      if (!element || !value) return;
      hasNote = true;
      element.hidden = false;
      element.textContent = value;
    });

    if (venueNotes) venueNotes.hidden = !hasNote;
  }

  function setupShareAndCalendar() {
    const shareButton = $("#shareButton");
    const personalizedCopyButton = $("#copyPersonalizedLinkButton");
    const calendarButton = $("#calendarButton");
    const personalization = config.personalization || {};

    if (calendarButton) {
      if (config.calendar?.enabled && config.calendar.file) {
        calendarButton.href = config.calendar.file;
      } else {
        calendarButton.hidden = true;
      }
    }

    const getGeneralShareUrl = () => {
      try {
        const url = new URL(
          config.site?.domain || window.location.href,
          window.location.href
        );
        url.hash = "";
        return url.toString();
      } catch {
        return String(config.site?.domain || window.location.href).split("#")[0];
      }
    };

    const getPersonalizedShareUrl = () => {
      if (!guestUtils || !guestState.isPersonalized) {
        return getGeneralShareUrl();
      }

      return guestUtils.buildPersonalizedUrl(
        getGeneralShareUrl(),
        guestState.name,
        personalization.parameter
      );
    };

    if (personalizedCopyButton) {
      const personalizedCopyEnabled =
        config.sharing?.personalizedCopyEnabled !== false;

      personalizedCopyButton.hidden =
        !personalizedCopyEnabled || !guestState.isPersonalized;

      personalizedCopyButton.addEventListener("click", async () => {
        const url = getPersonalizedShareUrl();

        try {
          await navigator.clipboard.writeText(url);
          showToast("Đã sao chép link có tên khách mời.");
        } catch {
          window.prompt("Sao chép link có tên khách mời:", url);
        }
      });
    }

    if (!shareButton) return;

    if (!config.sharing?.enabled) {
      shareButton.hidden = true;
      return;
    }

    shareButton.addEventListener("click", async () => {
      const shouldSharePersonalized =
        config.sharing.sharePersonalizedByDefault === true &&
        guestState.isPersonalized;
      const shareUrl = shouldSharePersonalized
        ? getPersonalizedShareUrl()
        : getGeneralShareUrl();

      const shareData = {
        title:
          config.sharing.title ||
          document.title,
        text:
          config.sharing.text ||
          "Trân trọng kính mời Quý vị đến chung vui.",
        url: shareUrl
      };

      try {
        if (
          typeof navigator.share === "function" &&
          (!navigator.canShare || navigator.canShare(shareData))
        ) {
          await navigator.share(shareData);
          return;
        }

        await navigator.clipboard.writeText(shareUrl);
        showToast("Đã sao chép đường dẫn thiệp chung.");
      } catch (error) {
        if (error?.name === "AbortError") return;

        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast("Đã sao chép đường dẫn thiệp chung.");
        } catch {
          window.prompt("Sao chép đường dẫn thiệp chung:", shareUrl);
        }
      }
    });
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
    setText("[data-ceremony-label]", event.ceremonyLabel);
    setText("[data-ceremony-note]", event.ceremonyNote);
    setText("[data-reception-label]", event.receptionLabel);
    setText("[data-reception-note]", event.receptionNote);
    setText("[data-lunar-date]", event.lunarDate);
    setText("[data-venue-name]", event.venueName);
    setText("[data-address-line1]", event.addressLine1);
    setText("[data-address-line2]", event.addressLine2);

    setBalancedInvitationHeading(invitation.heading);
    setText("[data-invitation-message]", invitation.message);
    setText("[data-rsvp-deadline]", rsvp.deadline);
    setText("[data-footer]", site.footer);

    $$("[data-maps-link]").forEach((link) => {
      link.href = event.mapsUrl;
    });

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
      rsvpButton.disabled = false;
      rsvpButton.removeAttribute("aria-disabled");
      rsvpButton.textContent = "Xác nhận tham dự";
    } else {
      rsvpButton.disabled = true;
      rsvpButton.setAttribute("aria-disabled", "true");
      rsvpButton.textContent = "RSVP sẽ cập nhật";
      rsvpNote.hidden = false;
    }
  }

  function setupReveal() {
    const motion = config.motion || {};
    const elements = $$(".reveal");
    const loadElements = $$(".motion-load");
    const reduceMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!motion.enabled || reduceMotion) {
      document.documentElement.classList.add("motion-ready");
      [...elements, ...loadElements].forEach((element) => {
        element.classList.add("is-visible");
      });
      return;
    }

    document.documentElement.classList.add("motion-ready");

    [...elements, ...loadElements].forEach((element, index) => {
      const explicit = Number(element.dataset.motionDelay);
      const delay = Number.isFinite(explicit)
        ? explicit
        : Math.min(index * Number(motion.staggerMs || 70), 350);
      element.style.setProperty("--motion-delay", `${delay}ms`);
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadElements.forEach((element) => {
          element.classList.add("is-visible");
        });
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          if (motion.revealOnce !== false) {
            observer.unobserve(entry.target);
          }
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
    submitting: false,

    // idle → loading → loaded; lỗi quay lại idle để có thể retry.
    loadStatus: "idle",
    observer: null,
    fallbackCleanup: null
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

  function setWishesStatus(message, state = "") {
    const status = $("#wishesStatus");
    status.hidden = false;
    status.textContent = message;
    status.dataset.state = state;
  }

  function resetWishLoadForRetry(message) {
    wishState.loadStatus = "idle";
    setWishesStatus(message, "error");
    $("#wishesRetry").hidden = false;
  }

  function stopWishLazyObserver() {
    wishState.observer?.disconnect();
    wishState.observer = null;

    wishState.fallbackCleanup?.();
    wishState.fallbackCleanup = null;
  }

  function loadApprovedWishes() {
    if (
      !wishesAreReady() ||
      wishState.loadStatus === "loading" ||
      wishState.loadStatus === "loaded"
    ) {
      return;
    }

    wishState.loadStatus = "loading";
    stopWishLazyObserver();
    $("#wishesRetry").hidden = true;
    setWishesStatus("Đang tải những lời chúc đã được duyệt…", "loading");

    const wishes = config.wishes;

    window.__weddingWishCallbacks ||= {};
    const callbackName = `cb_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;
    const callbackPath = `__weddingWishCallbacks.${callbackName}`;

    window.__weddingWishCallbacks[callbackName] = (payload) => {
      cleanupWishJsonp(callbackName);

      if (!payload?.ok || !Array.isArray(payload.wishes)) {
        resetWishLoadForRetry(
          "Chưa tải được lời chúc. Quý vị vẫn có thể gửi lời chúc mới."
        );
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
      wishState.loadStatus = "loaded";
      $("#wishesRetry").hidden = true;
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
      resetWishLoadForRetry(
        "Chưa tải được lời chúc. Quý vị vẫn có thể gửi lời chúc mới."
      );
    });

    wishState.loadingScript = script;
    wishState.loadingTimer = window.setTimeout(() => {
      cleanupWishJsonp(callbackName);
      resetWishLoadForRetry(
        "Máy chủ lời chúc phản hồi chậm. Vui lòng thử lại sau."
      );
    }, wishes.requestTimeoutMs);

    document.head.append(script);
  }

  function setupWishLazyLoading(section) {
    const wishes = config.wishes;
    const rootMargin = wishes.preloadRootMargin || "1200px 0px";

    if ("IntersectionObserver" in window) {
      wishState.observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          loadApprovedWishes();
        },
        {
          root: null,
          rootMargin,
          threshold: 0.01
        }
      );

      wishState.observer.observe(section);
      return;
    }

    // Fallback không tải theo timer cố định; chỉ kiểm tra khi scroll/resize.
    const preloadDistance = Number.parseInt(rootMargin, 10) || 1200;
    const throttleMs = wishes.fallbackCheckThrottleMs || 180;
    let scheduled = false;
    let lastRun = 0;

    const cleanup = () => {
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      window.removeEventListener("orientationchange", scheduleCheck);
    };

    const checkDistance = () => {
      scheduled = false;
      const now = Date.now();

      if (now - lastRun < throttleMs) {
        scheduleCheck();
        return;
      }

      lastRun = now;
      const rect = section.getBoundingClientRect();

      if (
        rect.top <= window.innerHeight + preloadDistance &&
        rect.bottom >= -preloadDistance
      ) {
        cleanup();
        loadApprovedWishes();
      }
    };

    const scheduleCheck = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(checkDistance);
    };

    wishState.fallbackCleanup = cleanup;
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck, { passive: true });
    window.addEventListener("orientationchange", scheduleCheck, { passive: true });
    scheduleCheck();
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
    const wishesSection = $("#wishes");
    const openButtons = [$("#wishButton"), $("#wishesSectionButton")];
    const closeButtons = $$("[data-close-wish-dialog]", dialog);
    const loadMore = $("#wishesLoadMore");
    const retryButton = $("#wishesRetry");

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
      // Khách chủ động quan tâm: tải ngay nếu danh sách chưa được tải.
      loadApprovedWishes();

      openedAt.value = String(Date.now());
      requestId.value = "";
      setWishFormStatus("");

      if (
        guestState.isPersonalized &&
        !displayName.value.trim()
      ) {
        displayName.value = guestState.name;
      }

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

    retryButton.addEventListener("click", loadApprovedWishes);

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

    function isAllowedWishMessageOrigin(origin) {
      try {
        const url = new URL(origin);
        if (url.protocol !== "https:") return false;

        const hostname = url.hostname.toLowerCase();

        return (
          hostname === "script.google.com" ||
          hostname === "script.googleusercontent.com" ||
          hostname.endsWith("-script.googleusercontent.com")
        );
      } catch {
        return false;
      }
    }

    window.addEventListener("message", (event) => {
      if (!isAllowedWishMessageOrigin(event.origin)) return;

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

      if (payload.ok && payload.stored === true) {
        rememberWishSubmission();
        setWishFormStatus(
          "Cảm ơn Quý vị! Lời chúc đã được lưu và sẽ xuất hiện sau khi được hai gia đình duyệt.",
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

      if (payload.ok) {
        setWishFormStatus(
          payload.message ||
            "Máy chủ đã phản hồi nhưng chưa xác nhận lưu lời chúc. Vui lòng thử lại sau.",
          "error"
        );
        return;
      }

      setWishFormStatus(
        payload.message ||
          "Chưa thể gửi lời chúc. Vui lòng thử lại sau.",
        "error"
      );
    });

    setWishesStatus(
      "Những lời chúc sẽ được tải khi Quý vị cuộn đến gần khu vực này."
    );
    setupWishLazyLoading(wishesSection);
  }

  function setupRsvpDialog() {
    const trigger = $("#rsvpButton");
    const dialog = $("#rsvpDialog");
    const frame = $("#rsvpFrame");
    const loading = $("#rsvpLoading");
    const externalLink = $("#rsvpExternalLink");
    const closeButtons = $$("[data-close-rsvp-dialog]", dialog);

    if (!trigger || !dialog || !frame || !config.rsvp?.url) return;

    let loaded = false;

    const close = () => {
      dialog.close();
      trigger.focus();
    };

    trigger.addEventListener("click", () => {
      const regularUrl = buildRsvpUrl();
      const embeddedUrl = buildEmbeddedRsvpUrl();

      externalLink.href = regularUrl;

      if (!loaded) {
        loading.hidden = false;
        frame.src = embeddedUrl;
        loaded = true;
      }

      dialog.showModal();
    });

    frame.addEventListener("load", () => {
      loading.hidden = true;
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", close);
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
  }

  function setupMapDialog() {
    const trigger = $("#mapButton");
    const dialog = $("#mapDialog");
    const frame = $("#mapFrame");
    const loading = $("#mapLoading");
    const closeButtons = $$("[data-close-map-dialog]", dialog);
    const embedUrl = String(config.event?.mapEmbedUrl || "").trim();

    if (!trigger || !dialog || !frame) return;

    if (!embedUrl) {
      trigger.hidden = true;
      return;
    }

    let loaded = false;

    const close = () => {
      dialog.close();
      trigger.focus();
    };

    trigger.addEventListener("click", () => {
      if (!loaded) {
        loading.hidden = false;
        frame.src = embedUrl;
        loaded = true;
      }

      dialog.showModal();
    });

    frame.addEventListener("load", () => {
      loading.hidden = true;
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", close);
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
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
    const caption = $("#lightboxCaption");
    const counter = $("#lightboxCounter");
    const closeButton = $("[data-close-lightbox]", dialog);
    const previousButton = $("[data-lightbox-prev]", dialog);
    const nextButton = $("[data-lightbox-next]", dialog);
    const items = $$("[data-lightbox]");
    let currentIndex = -1;
    let touchStartX = null;

    const normalizeIndex = (index) =>
      (index + items.length) % items.length;

    const preloadNext = (index) => {
      if (items.length < 2) return;

      const nextIndex = normalizeIndex(index + 1);
      const key = items[nextIndex].dataset.lightbox;
      const preload = new Image();
      preload.src = `assets/images/${key}-1280.webp?v=16`;
    };

    const render = (index) => {
      currentIndex = normalizeIndex(index);
      const button = items[currentIndex];
      const key = button.dataset.lightbox;
      const sourceImage = $("img", button);

      image.src = `assets/images/${key}-1280.webp?v=16`;
      image.alt = sourceImage.alt;
      caption.textContent = sourceImage.alt;
      counter.textContent = `${currentIndex + 1} / ${items.length}`;
      preloadNext(currentIndex);
    };

    const open = (index) => {
      render(index);
      dialog.showModal();
    };

    items.forEach((button, index) => {
      button.addEventListener("click", () => open(index));
    });

    previousButton.addEventListener("click", () => {
      render(currentIndex - 1);
    });

    nextButton.addEventListener("click", () => {
      render(currentIndex + 1);
    });

    closeButton.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        render(currentIndex - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        render(currentIndex + 1);
      }
    });

    dialog.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0]?.clientX ?? null;
      },
      { passive: true }
    );

    dialog.addEventListener(
      "touchend",
      (event) => {
        if (touchStartX === null) return;

        const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
        const distance = touchEndX - touchStartX;
        touchStartX = null;

        if (Math.abs(distance) < 45) return;
        render(currentIndex + (distance < 0 ? 1 : -1));
      },
      { passive: true }
    );

    dialog.addEventListener("close", () => {
      image.removeAttribute("src");
      caption.textContent = "";
      counter.textContent = "";
      currentIndex = -1;
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

    const configuredSources = Array.isArray(music.sources)
      ? music.sources.filter((source) => source?.src)
      : music.file
        ? [{ src: music.file, type: "audio/mpeg" }]
        : [];

    if (configuredSources.length === 0) {
      button.hidden = true;
      return;
    }

    audio.replaceChildren(
      ...configuredSources.map((sourceConfig) => {
        const source = document.createElement("source");
        source.src = sourceConfig.src;
        source.type = sourceConfig.type || "audio/mpeg";
        if (sourceConfig.role) {
          source.dataset.role = sourceConfig.role;
        }
        return source;
      })
    );

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
            "Không phát được nhạc. Vui lòng thử lại hoặc kiểm tra kết nối."
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

  setupPersonalization();
  applyConfig();
  setupFamilies();
  setupEventActions();
  setupShareAndCalendar();
  setupRsvpDialog();
  setupMapDialog();
  setupReveal();
  setupCountdown();
  setupGiftDialog();
  setupWishes();
  setupLightbox();
  setupMusic();
})();
