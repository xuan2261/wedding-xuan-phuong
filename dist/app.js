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

  function getNowMs() {
    const isLocalTest =
      window.__WEDDING_TEST_MODE__ === true ||
      ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const testValue = isLocalTest ? window.__WEDDING_TEST_NOW__ : "";
    const parsedTest = testValue ? Date.parse(testValue) : Number.NaN;
    return Number.isFinite(parsedTest) ? parsedTest : Date.now();
  }

  function parseOptionalDateMs(value) {
    const parsed = value ? Date.parse(value) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }

  const guestState = {
    name: "",
    isPersonalized: false,
    activeEventId: config.eventContext?.activeEventId || config.event?.id || "groom",
    invitedEventIds: [...(config.eventContext?.invitedEventIds || [config.event?.id || "groom"])]
  };

  function getAdaptiveDataState() {
    const settings = config.openingExperience || {};
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = String(connection?.effectiveType || "").toLowerCase();
    const constrainedTypes = Array.isArray(settings.constrainedEffectiveTypes)
      ? settings.constrainedEffectiveTypes.map((value) => String(value).toLowerCase())
      : ["slow-2g", "2g"];
    const saveData = settings.respectDataSaver !== false && connection?.saveData === true;
    const constrainedNetwork = constrainedTypes.includes(effectiveType);
    const constrained = Boolean(saveData || constrainedNetwork);

    document.body.dataset.dataMode = constrained ? "constrained" : "standard";
    if (effectiveType) document.body.dataset.effectiveConnection = effectiveType;

    return Object.freeze({
      constrained,
      saveData,
      effectiveType
    });
  }

  const adaptiveDataState = getAdaptiveDataState();

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

  function renderEventTimeline(items) {
    const timeline = $("#eventTimeline");
    if (!timeline) return;

    const safeItems = Array.isArray(items) ? items : [];
    timeline.replaceChildren(...safeItems.map((item) => {
      const listItem = document.createElement("li");
      const time = document.createElement("time");
      time.textContent = String(item.time || "");
      if (item.datetime) time.dateTime = item.datetime;

      const content = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = String(item.label || "Sự kiện");
      const note = document.createElement("p");
      note.textContent = String(item.note || "");
      content.append(title, note);
      listItem.append(time, content);
      return listItem;
    }));
  }

  function setupEventSwitcher() {
    const nav = $("#eventSwitcher");
    const links = $("#eventSwitcherLinks");
    if (!nav || !links || guestState.invitedEventIds.length <= 1) {
      if (nav) nav.hidden = true;
      return;
    }

    const catalog = new Map((config.eventCatalog || []).map((item) => [item.id, item]));
    const personalization = config.personalization || {};
    const baseUrl = config.site?.domain || window.location.href;

    links.replaceChildren(...guestState.invitedEventIds.map((eventId) => {
      const event = catalog.get(eventId);
      const anchor = document.createElement("a");
      anchor.className = "button button--secondary";
      if (eventId === guestState.activeEventId) {
        anchor.classList.add("is-active");
        anchor.setAttribute("aria-current", "page");
      }
      anchor.textContent = event?.shortTitle || eventId;
      anchor.href = guestUtils?.buildInvitationUrl
        ? guestUtils.buildInvitationUrl(baseUrl, {
            guestName: guestState.isPersonalized ? guestState.name : "",
            guestParameter: personalization.parameter,
            eventParameter: personalization.eventParameter,
            eventsParameter: personalization.eventsParameter,
            invitedEventIds: guestState.invitedEventIds,
            activeEventId: eventId
          })
        : `#event=${encodeURIComponent(eventId)}`;
      return anchor;
    }));

    nav.hidden = false;
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
    const venueStatusNote = $("#venueStatusNote");

    const fullAddress = [event.addressLine1, event.addressLine2]
      .filter(Boolean)
      .join(", ");

    if (copyAddressButton) {
      const canCopyAddress = Boolean(fullAddress) && event.status !== "draft";
      copyAddressButton.hidden = !canCopyAddress;
      copyAddressButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(fullAddress);
          showToast("Đã sao chép địa chỉ.");
        } catch {
          window.prompt("Sao chép địa chỉ:", fullAddress);
        }
      });
    }

    if (directionContactButton && config.contact?.directionPhone) {
      directionContactButton.href =
        `tel:${String(config.contact.directionPhone).replace(/\s+/g, "")}`;
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
      const element = document.querySelector(`[data-venue-note="${key}"]`);
      const value = String(rawValue || "").trim();
      if (!element || !value) return;
      hasNote = true;
      element.hidden = false;
      element.textContent = value;
    });
    if (venueNotes) venueNotes.hidden = !hasNote;

    if (venueStatusNote) {
      const status = String(event.venueStatusNote || "").trim();
      venueStatusNote.hidden = !status;
      venueStatusNote.textContent = status;
    }
  }

  function setupShareAndCalendar() {
    const shareButton = $("#shareButton");
    const personalizedCopyButton = $("#copyPersonalizedLinkButton");
    const calendarButton = $("#calendarButton");
    const personalization = config.personalization || {};

    if (calendarButton) {
      if (config.calendar?.enabled && config.calendar.file) {
        calendarButton.href = config.calendar.file;
        calendarButton.hidden = false;
        setText("[data-calendar-label]", config.calendar.label || "Thêm vào lịch");
      } else {
        calendarButton.hidden = true;
      }
    }

    const buildShareUrl = (includeGuest) => {
      const baseUrl = config.site?.domain || window.location.href;
      const options = {
        guestName: includeGuest && guestState.isPersonalized ? guestState.name : "",
        guestParameter: personalization.parameter,
        eventParameter: personalization.eventParameter,
        eventsParameter: personalization.eventsParameter,
        invitedEventIds: guestState.invitedEventIds,
        activeEventId: guestState.activeEventId
      };

      if (guestUtils?.buildEventEntryUrl) {
        return guestUtils.buildEventEntryUrl(baseUrl, guestState.activeEventId, options);
      }
      if (guestUtils?.buildInvitationUrl) {
        return guestUtils.buildInvitationUrl(baseUrl, options);
      }
      return String(baseUrl).split("#")[0];
    };

    if (personalizedCopyButton) {
      personalizedCopyButton.hidden =
        config.sharing?.personalizedCopyEnabled === false || !guestState.isPersonalized;
      personalizedCopyButton.addEventListener("click", async () => {
        const url = buildShareUrl(true);
        try {
          await navigator.clipboard.writeText(url);
          showToast("Đã sao chép link có tên khách mời và đúng sự kiện.");
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
      const shareUrl = buildShareUrl(config.sharing.sharePersonalizedByDefault === true);
      const shareData = {
        title: config.sharing.title || document.title,
        text: config.sharing.text || "Trân trọng kính mời Quý vị đến chung vui.",
        url: shareUrl
      };
      try {
        if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(shareData))) {
          await navigator.share(shareData);
          return;
        }
        await navigator.clipboard.writeText(shareUrl);
        showToast("Đã sao chép đường dẫn sự kiện.");
      } catch (error) {
        if (error?.name === "AbortError") return;
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast("Đã sao chép đường dẫn sự kiện.");
        } catch {
          window.prompt("Sao chép đường dẫn sự kiện:", shareUrl);
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

  function formatPhone(value) {
    const digits = String(value || "").replace(/\D+/g, "");
    if (digits.length === 10) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    return digits || "Chưa cập nhật";
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
    const { couple, event, invitation, labels, rsvp, site } = config;

    document.title = `${event.title} · ${couple.groomDisplayName} & ${couple.brideDisplayName}`;
    document.body.dataset.eventId = event.id;
    document.body.dataset.eventStatus = event.status || "confirmed";

    setText("[data-groom-display]", couple.groomDisplayName);
    setText("[data-bride-display]", couple.brideDisplayName);
    setHeroNames(couple.groomDisplayName, couple.brideDisplayName);
    setText("[data-groom-full]", couple.groomFullName);
    setText("[data-bride-full]", couple.brideFullName);
    setText("[data-hero-kicker]", event.heroKicker || "Save the date");
    setText("[data-cover-event]", event.title || event.heroKicker || "Thiệp cưới");
    setText("[data-cover-weekday]", event.weekday || "");
    setText("[data-date-display]", event.dateDisplay);
    setText("[data-weekday]", event.weekday);
    setText("[data-lunar-date]", event.lunarDate || "");
    setText("[data-venue-name]", event.venueName);
    setText("[data-address-line1]", event.addressLine1);
    setText("[data-address-line2]", event.addressLine2);
    setText("[data-guest-invitation-lead]", invitation.guestLead);
    setText("[data-invitation-event-name]", invitation.eventName);
    setText("[data-event-section-kicker]", labels.eventKicker);
    setText("[data-event-section-title]", labels.eventTitle);
    setText("[data-countdown-kicker]", labels.countdownKicker);
    setText("[data-countdown-title]", labels.countdownTitle);
    setText("[data-actions-title]", labels.actionsTitle);
    setText("[data-actions-description]", labels.actionsDescription);
    setText("[data-rsvp-dialog-event]", event.shortTitle);
    setText("[data-gift-dialog-event]", event.shortTitle);
    setText("[data-attendance-contact-event]", event.shortTitle);
    setText("[data-groom-phone]", formatPhone(config.contact?.groomPhone));
    setText("[data-bride-phone]", formatPhone(config.contact?.bridePhone));

    const coverDate = $(".invitation-cover__date time");
    if (coverDate && event.isoDateTime) {
      coverDate.dateTime = String(event.isoDateTime).slice(0, 10);
    }

    const lunar = $("[data-lunar-date]");
    if (lunar) lunar.hidden = !String(event.lunarDate || "").trim();

    setBalancedInvitationHeading(invitation.heading);
    setText("[data-invitation-message]", invitation.message);
    setText("[data-footer]", site.footer);
    renderEventTimeline(event.timeline);

    const deadlineCopy = $("#rsvpDeadlineCopy");
    if (deadlineCopy) {
      deadlineCopy.hidden = !String(rsvp.deadline || "").trim();
      setText("[data-rsvp-deadline]", rsvp.deadline || "");
    }

    const mapsLinks = $$("[data-maps-link]");
    mapsLinks.forEach((link) => {
      const hasMap = Boolean(String(event.mapsUrl || "").trim());
      link.hidden = !hasMap;
      if (hasMap) link.href = event.mapsUrl;
    });

    const mapButton = $("#mapButton");
    if (mapButton) mapButton.hidden = !String(event.mapEmbedUrl || "").trim();

    const rsvpButton = $("#rsvpButton");
    const rsvpNote = $("#rsvpNote");
    const giftButton = $("#giftButton");
    const wishButton = $("#wishButton");
    const wishesSection = $("#wishes");

    giftButton.hidden = !giftsAreReady();
    const wishesReady = wishesAreReady();
    wishButton.hidden = !wishesReady;
    wishesSection.hidden = !wishesReady;

    if (rsvp.enabled && rsvp.url) {
      rsvpButton.href = buildRsvpUrl();
      rsvpButton.removeAttribute("aria-disabled");
      rsvpButton.textContent = "Xác nhận tham dự";
      rsvpNote.hidden = true;
    } else {
      const fallbackPhone = String(config.contact?.directionPhone || "").replace(/\D+/g, "");
      if (fallbackPhone) {
        rsvpButton.href = `tel:${fallbackPhone}`;
        rsvpButton.removeAttribute("aria-disabled");
        rsvpButton.dataset.rsvpFallback = "contact";
        rsvpButton.textContent = "Liên hệ xác nhận";
      } else {
        rsvpButton.removeAttribute("href");
        rsvpButton.setAttribute("aria-disabled", "true");
        rsvpButton.textContent = "RSVP sẽ cập nhật";
      }
      rsvpNote.hidden = false;
      rsvpNote.textContent = rsvp.pendingMessage || "Biểu mẫu RSVP sẽ được cập nhật sau.";
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

    window.addEventListener("wedding:cover-opened", () => {
      if (reduceMotion || !loadElements.length) return;

      loadElements.forEach((element) => {
        element.classList.remove("is-visible");
      });

      void document.documentElement.offsetWidth;

      requestAnimationFrame(() => {
        loadElements.forEach((element) => {
          element.classList.add("is-visible");
        });
      });
    });
  }

  function setupGuidedStory() {
    const settings = config.openingExperience || {};
    const player = $("#storyPlayer");
    const button = $("#storyButton");
    const previousButton = $("#storyPreviousButton");
    const nextButton = $("#storyNextButton");
    const playIcon = $("[data-story-icon=\"play\"]", button);
    const pauseIcon = $("[data-story-icon=\"pause\"]", button);
    const label = $("[data-story-label]", player);
    const counter = $("[data-story-counter]", player);
    const chapter = $("[data-story-chapter]", player);
    const progress = $("[data-story-progress]", player);
    const reduceMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let timer = 0;
    let running = false;
    let completed = false;
    let currentIndex = 0;
    let stops = [];
    let scrollFrame = 0;
    let suppressScrollSyncUntil = 0;

    const refreshStops = () => {
      stops = $$("[data-story-stop]").filter((element) => {
        if (element.hidden) return false;
        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      currentIndex = Math.min(currentIndex, Math.max(0, stops.length - 1));
      return stops;
    };

    const titleFor = (element, index) =>
      String(element?.dataset.storyTitle || `Phần ${index + 1}`).trim();

    const holdFor = (element) => {
      const explicit = Number(element?.dataset.storyHold);
      return Number.isFinite(explicit) && explicit >= 1500
        ? explicit
        : Number(settings.storyHoldMs || 6500);
    };

    const prepareStoryAssets = async (index) => {
      if (settings.preloadNextScene === false) return;
      const target = stops[index];
      if (!target) return;

      const configuredLimit = adaptiveDataState.constrained
        ? Number(settings.constrainedPreloadImageLimit) || 1
        : Number(settings.preloadImageLimit) || 4;
      const limit = Math.max(1, configuredLimit);
      const waitMs = Math.max(100, Number(settings.preloadWaitMs) || 700);
      const images = $$('img', target).slice(0, limit);
      if (!images.length) return;

      document.body.dataset.storyAssetState = "preparing";
      images.forEach((image) => {
        image.loading = "eager";
        image.fetchPriority = adaptiveDataState.constrained ? "auto" : "high";
        image.dataset.storyPreloaded = "true";
      });

      const decodeTasks = images.map(async (image) => {
        try {
          if (typeof image.decode === "function") {
            await image.decode();
          } else if (!image.complete) {
            await new Promise((resolve) => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            });
          }
        } catch {
          // Decode errors must not block navigation; the browser can still paint the image.
        }
      });

      await Promise.race([
        Promise.allSettled(decodeTasks),
        new Promise((resolve) => window.setTimeout(resolve, waitMs))
      ]);
      document.body.dataset.storyAssetState = "ready";
    };

    const resetProgress = (duration = 0) => {
      if (!progress) return;
      progress.style.transition = "none";
      progress.style.width = "0%";
      void progress.offsetWidth;

      if (duration > 0 && running) {
        progress.style.transition = `width ${duration}ms linear`;
        requestAnimationFrame(() => {
          progress.style.width = "100%";
        });
      }
    };

    const syncPlayer = () => {
      if (!player || !button) return;
      const count = Math.max(1, stops.length);
      const position = Math.min(currentIndex + 1, count);
      const replay = completed && !running;

      player.hidden = false;
      document.body.dataset.storyState = completed
        ? "completed"
        : running
          ? "running"
          : "paused";
      document.body.dataset.storyChapterIndex = String(position);
      button.setAttribute("aria-pressed", String(running));
      button.setAttribute(
        "aria-label",
        running
          ? "Tạm dừng xem thiệp tự động"
          : replay
            ? "Xem lại thiệp từ đầu"
            : "Bắt đầu xem thiệp tự động"
      );
      button.title = button.getAttribute("aria-label");

      if (label) {
        label.textContent = running
          ? "Đang tự xem"
          : replay
            ? "Xem lại"
            : "Tự xem";
      }
      if (counter) counter.textContent = `${position}/${count}`;
      if (chapter) chapter.textContent = titleFor(stops[currentIndex], currentIndex);

      playIcon?.toggleAttribute("hidden", running);
      pauseIcon?.toggleAttribute("hidden", !running);
      if (previousButton) previousButton.disabled = currentIndex <= 0;
      if (nextButton) nextButton.disabled = currentIndex >= stops.length - 1;
    };

    const clearTimer = () => {
      window.clearTimeout(timer);
      timer = 0;
    };

    const nearestIndex = () => {
      refreshStops();
      if (!stops.length) return 0;

      const targetY = window.innerHeight * 0.24;
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      stops.forEach((element, index) => {
        const distance = Math.abs(element.getBoundingClientRect().top - targetY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      return bestIndex;
    };

    const pause = ({ announce = false, reason = "user" } = {}) => {
      if (!running) return;
      running = false;
      clearTimer();
      resetProgress();
      syncPlayer();
      document.body.dataset.storyPauseReason = reason;
      if (announce) showToast("Đã tạm dừng chế độ xem tự động.");
    };

    const scrollToCurrent = () => {
      const target = stops[currentIndex];
      if (!target) return;
      suppressScrollSyncUntil = performance.now() + (reduceMotion ? 80 : 950);
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });
    };

    const finish = () => {
      running = false;
      completed = true;
      clearTimer();
      resetProgress();
      syncPlayer();
    };

    const scheduleNext = (delayMs) => {
      clearTimer();
      resetProgress(delayMs);
      timer = window.setTimeout(async () => {
        refreshStops();
        if (!running || !stops.length) return;
        if (currentIndex >= stops.length - 1) {
          finish();
          return;
        }
        currentIndex += 1;
        completed = false;
        await prepareStoryAssets(currentIndex);
        if (!running) return;
        scrollToCurrent();
        syncPlayer();
        void prepareStoryAssets(currentIndex + 1);
        scheduleNext(holdFor(stops[currentIndex]));
      }, Math.max(250, delayMs));
    };

    const start = ({ fromStart = false, initialDelayMs = 0 } = {}) => {
      refreshStops();
      if (!player || !button || !stops.length || reduceMotion ||
          document.body.classList.contains("simple-mode")) {
        if (player) player.hidden = true;
        return false;
      }

      currentIndex = fromStart || completed ? 0 : nearestIndex();
      completed = false;
      running = true;
      delete document.body.dataset.storyPauseReason;
      if (fromStart) scrollToCurrent();
      syncPlayer();
      void prepareStoryAssets(currentIndex);
      void prepareStoryAssets(currentIndex + 1);
      scheduleNext(
        initialDelayMs > 0
          ? initialDelayMs
          : holdFor(stops[currentIndex])
      );
      return true;
    };

    const move = (delta) => {
      refreshStops();
      if (!stops.length) return;
      pause({ reason: "navigation" });
      currentIndex = Math.max(0, Math.min(stops.length - 1, currentIndex + delta));
      completed = currentIndex >= stops.length - 1;
      scrollToCurrent();
      syncPlayer();
    };

    const show = () => {
      refreshStops();
      if (player) {
        player.hidden = reduceMotion || document.body.classList.contains("simple-mode");
        if (!player.hidden) syncPlayer();
      }
    };

    button?.addEventListener("click", () => {
      if (running) pause({ reason: "toggle" });
      else start({ fromStart: completed });
    });
    previousButton?.addEventListener("click", () => move(-1));
    nextButton?.addEventListener("click", () => move(1));

    if (settings.pauseOnInteraction !== false) {
      const pauseForInteraction = (event) => {
        if (!running || player?.contains(event.target)) return;
        pause({ announce: true, reason: "interaction" });
      };

      window.addEventListener("wheel", pauseForInteraction, { passive: true });
      window.addEventListener("touchstart", pauseForInteraction, { passive: true });
      window.addEventListener("pointerdown", pauseForInteraction, { passive: true });
      window.addEventListener("keydown", (event) => {
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]
          .includes(event.key)) {
          pauseForInteraction(event);
        }
      });
    }

    window.addEventListener("scroll", () => {
      if (running || scrollFrame || performance.now() < suppressScrollSyncUntil) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const index = nearestIndex();
        if (index !== currentIndex) {
          currentIndex = index;
          completed = currentIndex >= stops.length - 1;
          syncPlayer();
        }
      });
    }, { passive: true });

    if (settings.pauseOnDialogs !== false && "MutationObserver" in window) {
      const dialogs = $$('dialog').filter((dialog) => dialog.id !== "invitationCover");
      const observer = new MutationObserver((entries) => {
        if (entries.some((entry) => entry.target.open)) {
          pause({ reason: "dialog" });
        }
      });
      dialogs.forEach((dialog) => observer.observe(dialog, {
        attributes: true,
        attributeFilter: ["open"]
      }));
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pause({ reason: "hidden-tab" });
    });

    return Object.freeze({
      start,
      pause,
      show,
      refreshStops,
      next: () => move(1),
      previous: () => move(-1),
      getState: () => Object.freeze({
        running,
        completed,
        currentIndex,
        chapterCount: stops.length
      })
    });
  }

  function setupOpeningExperience(storyController) {
    const settings = config.openingExperience || {};
    const dialog = $("#invitationCover");
    const openButton = $("#coverOpenButton");
    const simpleButton = $("#coverSimpleButton");
    const autoStory = $("#coverAutoStory");
    const dataHint = $("#coverDataHint");
    const focusTarget = $("#hero-title");
    const reduceMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const params = new URLSearchParams(window.location.search);
    const skipForTest = window.__WEDDING_SKIP_COVER__ === true;
    const skipByUrl = params.get("skipCover") === "1";
    const sessionKey = "wedding-cover-opened-v19";
    let opening = false;

    if (!settings.enabled || !dialog || !openButton) {
      storyController?.show();
      return;
    }

    if (autoStory) {
      const disableForData = adaptiveDataState.constrained &&
        settings.disableAutoStoryOnConstrainedNetwork !== false;
      autoStory.checked =
        settings.autoStoryDefault !== false && !reduceMotion && !disableForData;
      autoStory.disabled = reduceMotion;
      if (dataHint) dataHint.hidden = !disableForData;
    }

    let openedInSession = false;
    if (settings.rememberSession) {
      try {
        openedInSession = window.sessionStorage.getItem(sessionKey) === "yes";
      } catch {
        // sessionStorage có thể bị chặn.
      }
    }

    const skipCover = skipForTest || skipByUrl || openedInSession;

    const finishOpening = (shouldStartStory, simpleMode = false) => {
      if (dialog.open) dialog.close();
      dialog.classList.remove("is-opening");
      document.body.classList.remove("invitation-is-opening");
      document.body.classList.add("invitation-opened");
      document.body.classList.toggle("simple-mode", simpleMode);

      try {
        if (settings.rememberSession) {
          window.sessionStorage.setItem(sessionKey, "yes");
        }
      } catch {
        // Không ảnh hưởng đến trải nghiệm hiện tại.
      }

      window.dispatchEvent(new CustomEvent("wedding:cover-opened"));
      storyController?.show();

      requestAnimationFrame(() => {
        if (focusTarget && typeof focusTarget.focus === "function") {
          focusTarget.focus({ preventScroll: true });
        }
      });

      if (shouldStartStory && !reduceMotion) {
        const startOptions = {
          fromStart: true,
          initialDelayMs: Number(settings.storyStartDelayMs || 2600)
        };

        // Đợi dialog đóng và layout ổn định qua hai frame rồi mới bắt đầu.
        // Nếu DOM/ảnh vừa cập nhật khiến lần đầu chưa có story stop, retry đúng một lần.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const started = storyController?.start(startOptions) === true;
            document.body.dataset.storyAutostart = started ? "started" : "retrying";

            if (started) {
              window.dispatchEvent(new CustomEvent("wedding:story-autostarted"));
              return;
            }

            window.setTimeout(() => {
              storyController?.refreshStops();
              const retried = storyController?.start(startOptions) === true;
              document.body.dataset.storyAutostart = retried ? "started" : "blocked";
              if (retried) {
                window.dispatchEvent(new CustomEvent("wedding:story-autostarted"));
              } else {
                showToast("Không thể tự chạy. Quý vị có thể bấm nút Tự xem để tiếp tục.");
              }
            }, 240);
          });
        });
      } else {
        document.body.dataset.storyAutostart = simpleMode
          ? "simple-mode"
          : reduceMotion
            ? "reduced-motion"
            : "disabled";
      }
    };

    const openInvitation = ({ simpleMode = false } = {}) => {
      if (opening) return;
      opening = true;
      const shouldStartStory = !simpleMode && Boolean(autoStory?.checked) && !reduceMotion;

      window.dispatchEvent(
        new CustomEvent("wedding:invitation-open", {
          detail: { autoStory: shouldStartStory, simpleMode }
        })
      );

      if (reduceMotion || simpleMode) {
        finishOpening(false, true);
        return;
      }

      document.body.classList.add("invitation-is-opening");
      dialog.classList.add("is-opening");

      window.setTimeout(
        () => finishOpening(shouldStartStory, false),
        Math.max(700, Number(settings.openingDurationMs || 1280))
      );
    };

    openButton.addEventListener("click", () => openInvitation());
    simpleButton?.addEventListener("click", () => openInvitation({ simpleMode: true }));
    if (simpleButton && settings.simpleModeEnabled === false) simpleButton.hidden = true;
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      openInvitation({ simpleMode: true });
    });

    if (skipCover) {
      document.body.classList.add("invitation-opened");
      storyController?.show();
      return;
    }

    requestAnimationFrame(() => {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      openButton.focus({ preventScroll: true });
    });
  }

  function setupCountdown() {
    const target = new Date(config.event.isoDateTime).getTime();
    const lifecycle = config.lifecycle || {};
    const grid = $("#countdownGrid");
    const title = $("#countdown-title");
    const kicker = $(".countdown .section-kicker");
    const message = $("#countdownMessage");
    const rsvpButton = $("#rsvpButton");
    const rsvpNote = $("#rsvpNote");
    const giftButton = $("#giftButton");
    const fields = {
      days: $("[data-days]"),
      hours: $("[data-hours]"),
      minutes: $("[data-minutes]"),
      seconds: $("[data-seconds]")
    };

    const now = getNowMs();
    const weddingDayStartsAt =
      parseOptionalDateMs(lifecycle.weddingDayStartsAt) ?? target;
    const weddingDayEndsAt =
      parseOptionalDateMs(lifecycle.weddingDayEndsAt) ?? target;
    const rsvpClosesAt = parseOptionalDateMs(lifecycle.rsvpClosesAt);
    const giftsHideAt = parseOptionalDateMs(lifecycle.giftsHideAt);

    let phase = "before";
    if (lifecycle.enabled && now >= weddingDayEndsAt) {
      phase = "after";
    } else if (lifecycle.enabled && now >= weddingDayStartsAt) {
      phase = "today";
    }

    document.body.dataset.weddingPhase = phase;

    if (rsvpClosesAt && now >= rsvpClosesAt && rsvpButton) {
      rsvpButton.hidden = true;
      if (rsvpNote) {
        rsvpNote.hidden = false;
        rsvpNote.textContent =
          lifecycle.rsvpClosedMessage ||
          "Cổng xác nhận tham dự đã khép lại. Quý vị vui lòng liên hệ trực tiếp cô dâu hoặc chú rể nếu cần hỗ trợ.";
      }
    }

    if (giftsHideAt && now >= giftsHideAt && giftButton) {
      giftButton.hidden = true;
    }

    if (phase !== "before") {
      grid.hidden = true;
      message.hidden = false;

      if (phase === "today") {
        kicker.textContent = "Ngày chung đôi";
        title.textContent = "Hôm nay là ngày chung đôi";
        message.textContent =
          lifecycle.weddingDayMessage ||
          "Hai gia đình hân hạnh được đón tiếp Quý vị.";
      } else {
        kicker.textContent = "Lời cảm ơn";
        title.textContent = "Cảm ơn Quý vị đã chung vui";
        message.textContent =
          lifecycle.postWeddingMessage ||
          "Thanh Xuân, Thị Phượng và hai gia đình trân trọng cảm ơn Quý vị.";
      }
      return;
    }

    let timer;
    const update = () => {
      const difference = Math.max(0, target - getNowMs());
      const days = Math.floor(difference / 86_400_000);
      const hours = Math.floor((difference % 86_400_000) / 3_600_000);
      const minutes = Math.floor((difference % 3_600_000) / 60_000);
      const seconds = Math.floor((difference % 60_000) / 1_000);

      fields.days.textContent = String(days).padStart(2, "0");
      fields.hours.textContent = String(hours).padStart(2, "0");
      fields.minutes.textContent = String(minutes).padStart(2, "0");
      fields.seconds.textContent = String(seconds).padStart(2, "0");

      if (difference === 0) {
        window.clearInterval(timer);
        window.setTimeout(setupCountdown, 0);
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

    const clearInvalidState = (control) => {
      if (control.validity?.valid) control.removeAttribute("aria-invalid");
    };

    [displayName, relationship, message, consent].forEach((control) => {
      control.addEventListener("input", () => clearInvalidState(control));
      control.addEventListener("change", () => clearInvalidState(control));
    });

    const focusFirstInvalidControl = () => {
      const invalid = form.querySelector(":invalid");
      if (!invalid) return;
      invalid.setAttribute("aria-invalid", "true");
      invalid.focus({ preventScroll: true });
      invalid.scrollIntoView({ block: "center", behavior: "smooth" });
    };

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
        focusFirstInvalidControl();
        setWishFormStatus(
          "Vui lòng kiểm tra trường được đánh dấu và bổ sung nội dung còn thiếu.",
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

  function setupAttendanceContactDialog() {
    const trigger = $("#rsvpButton");
    const dialog = $("#attendanceContactDialog");
    const recommendation = $("#attendanceContactRecommendation");
    if (!trigger || !dialog || config.rsvp?.enabled) return;

    const contacts = {
      groom: String(config.contact?.groomPhone || "").replace(/\D+/g, ""),
      bride: String(config.contact?.bridePhone || "").replace(/\D+/g, "")
    };
    const preferredRole = config.event?.directionPhoneRole === "bride" ? "bride" : "groom";
    const preferredLabel = preferredRole === "bride" ? "cô dâu" : "chú rể";

    $$('[data-attendance-call]', dialog).forEach((link) => {
      const role = link.dataset.attendanceCall;
      const phone = contacts[role];
      link.hidden = !phone;
      if (phone) link.href = `tel:${phone}`;
    });

    if (recommendation) {
      recommendation.textContent = `Đối với ${config.event.shortTitle}, Quý vị có thể ưu tiên liên hệ ${preferredLabel}.`;
    }

    $$('[data-attendance-copy]', dialog).forEach((button) => {
      button.addEventListener("click", async () => {
        const role = button.dataset.attendanceCopy;
        const phone = contacts[role];
        if (!phone) return;
        try {
          await navigator.clipboard.writeText(phone);
          showToast(`Đã sao chép: ${formatPhone(phone)}`);
        } catch {
          window.prompt("Sao chép số điện thoại:", phone);
        }
      });
    });

    if (typeof dialog.showModal !== "function") return;
    const closeButtons = $$('[data-close-attendance-contact]', dialog);
    const close = () => {
      if (dialog.open) dialog.close();
      trigger.focus();
    };

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      dialog.showModal();
    });
    closeButtons.forEach((button) => button.addEventListener("click", close));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
  }

  function setupRsvpDialog() {
    const trigger = $("#rsvpButton");
    const dialog = $("#rsvpDialog");
    const frame = $("#rsvpFrame");
    const loading = $("#rsvpLoading");
    const externalLink = $("#rsvpExternalLink");

    if (!trigger || !config.rsvp?.url) return;

    const regularUrl = buildRsvpUrl();
    trigger.href = regularUrl;
    externalLink.href = regularUrl;

    if (
      !dialog ||
      !frame ||
      typeof dialog.showModal !== "function"
    ) {
      return;
    }

    const closeButtons = $$('[data-close-rsvp-dialog]', dialog);
    let loaded = false;

    const close = () => {
      if (dialog.open) dialog.close();
      trigger.focus();
    };

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const embeddedUrl = buildEmbeddedRsvpUrl();

      if (!loaded) {
        frame.hidden = false;
        frame.setAttribute("aria-busy", "true");
        loading.hidden = false;
        frame.src = embeddedUrl;
        loaded = true;
      }

      dialog.showModal();
    });

    frame.addEventListener("load", () => {
      frame.hidden = false;
      frame.setAttribute("aria-busy", "false");
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
    const embedUrl = String(config.event?.mapEmbedUrl || "").trim();

    if (!trigger || !dialog || !frame) return;

    if (!embedUrl) {
      trigger.hidden = true;
      return;
    }

    const closeButtons = $$('[data-close-map-dialog]', dialog);
    let loaded = false;

    const close = () => {
      if (dialog.open) dialog.close();
      trigger.focus();
    };

    trigger.addEventListener("click", () => {
      if (!loaded) {
        frame.hidden = false;
        frame.setAttribute("aria-busy", "true");
        loading.hidden = false;
        frame.src = embedUrl;
        loaded = true;
      }

      dialog.showModal();
    });

    frame.addEventListener("load", () => {
      frame.hidden = false;
      frame.setAttribute("aria-busy", "false");
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

    if (!giftsAreReady() || !dialog || !grid || !openButton) return;

    let initialized = false;

    const buildGiftCards = () => {
      if (initialized) return;

      grid.replaceChildren(
        ...config.gifts.map((gift) => {
          const card = document.createElement("article");
          card.className = "gift-card";

          const image = document.createElement("img");
          image.src = gift.qrImage;
          image.alt = `Mã QR ${gift.label}`;
          image.loading = "lazy";
          image.decoding = "async";
          image.width = 800;
          image.height = 800;

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

      initialized = true;
    };

    openButton.addEventListener("click", () => {
      buildGiftCards();
      dialog.showModal();
    });
    closeButton?.addEventListener("click", () => dialog.close());
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
    const coverOpenButton = $("#coverOpenButton");
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

    // HTMLMediaElement.volume chỉ chấp nhận giá trị trong [0, 1].
    // Một số bản Edge có thể cung cấp timestamp rAF hơi nhỏ hơn performance.now(),
    // nên mọi giá trị trung gian đều phải được clamp ở cả hai đầu.
    const clampVolume = (value, fallback = 0) => {
      const numeric = Number(value);
      return Math.min(1, Math.max(0, Number.isFinite(numeric) ? numeric : fallback));
    };

    const configuredVolume = clampVolume(
      typeof music.volume === "number" ? music.volume : 0.35,
      0.35
    );
    const duckedVolume = Math.min(configuredVolume, 0.12);
    const setAudioVolume = (value) => {
      const safeVolume = clampVolume(value, audio.volume);
      if (Math.abs(audio.volume - safeVolume) > 0.0001) {
        audio.volume = safeVolume;
      }
      return safeVolume;
    };

    setAudioVolume(configuredVolume);
    let volumeAnimation = 0;
    let volumeFadeGeneration = 0;

    const cancelVolumeFade = () => {
      volumeFadeGeneration += 1;
      window.cancelAnimationFrame(volumeAnimation);
      volumeAnimation = 0;
    };

    const fadeVolume = (target, duration = 320) => {
      cancelVolumeFade();
      const generation = volumeFadeGeneration;
      const safeTarget = clampVolume(target, configuredVolume);
      const startVolume = clampVolume(audio.volume, configuredVolume);
      const safeDuration = Math.max(0, Number(duration) || 0);

      if (safeDuration === 0 || Math.abs(safeTarget - startVolume) < 0.0001) {
        setAudioVolume(safeTarget);
        return;
      }

      let startedAt = null;
      const step = (timestamp) => {
        if (generation !== volumeFadeGeneration) return;

        // Dùng timestamp của chính requestAnimationFrame làm mốc thời gian.
        // Điều này tránh trộn hai time origin có giá trị gần nhau nhưng không hoàn toàn giống nhau.
        const frameTime = Number.isFinite(Number(timestamp))
          ? Number(timestamp)
          : performance.now();
        if (startedAt === null) startedAt = frameTime;
        const elapsed = Math.max(0, frameTime - startedAt);
        const ratio = Math.min(1, Math.max(0, elapsed / safeDuration));
        const nextVolume = startVolume + (safeTarget - startVolume) * ratio;
        setAudioVolume(nextVolume);

        if (ratio < 1) {
          volumeAnimation = requestAnimationFrame(step);
        } else {
          volumeAnimation = 0;
        }
      };

      volumeAnimation = requestAnimationFrame(step);
    };

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

    const playMusic = async ({ silent = false, fadeIn = false } = {}) => {
      try {
        if (fadeIn) setAudioVolume(0);
        const playResult = audio.play();
        if (playResult && typeof playResult.then === "function") {
          await playResult;
        }
        if (fadeIn) fadeVolume(configuredVolume, 1200);
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
      cancelVolumeFade();
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
    const startMusicFromInvitation = () => {
      const seal = $(".guest-invitation__seal");
      if (seal && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        seal.classList.remove("is-celebrating");
        void seal.offsetWidth;
        seal.classList.add("is-celebrating");
      }
      const blockAutomaticMusic = adaptiveDataState.constrained &&
        config.openingExperience?.disableAutoMusicOnConstrainedNetwork !== false;
      if (blockAutomaticMusic) {
        document.body.dataset.musicAutostart = "data-saver-blocked";
        syncMusicButton();
        return;
      }
      if (audio.paused) {
        document.body.dataset.musicAutostart = "requested";
        void playMusic({ silent: true, fadeIn: true });
      }
    };

    openInvitationButton?.addEventListener("click", startMusicFromInvitation);
    coverOpenButton?.addEventListener("click", startMusicFromInvitation);

    // Đồng bộ icon ngay cả khi audio bị dừng bởi hệ điều hành/trình duyệt.
    ["play", "pause", "ended", "volumechange"].forEach((eventName) => {
      audio.addEventListener(eventName, syncMusicButton);
    });

    if ("MutationObserver" in window) {
      const dialogs = $$("dialog").filter((dialog) => dialog.id !== "invitationCover");
      const syncDialogVolume = () => {
        const anyOpen = dialogs.some((dialog) => dialog.open);
        if (!audio.paused) fadeVolume(anyOpen ? duckedVolume : configuredVolume, 240);
      };
      const dialogObserver = new MutationObserver(syncDialogVolume);
      dialogs.forEach((dialog) => dialogObserver.observe(dialog, {
        attributes: true,
        attributeFilter: ["open"]
      }));
    }

    let pausedByVisibility = false;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && !audio.paused) {
        pausedByVisibility = true;
        document.body.dataset.musicPauseReason = "hidden-tab";
        pauseMusic();
        return;
      }
      if (!document.hidden && pausedByVisibility) {
        pausedByVisibility = false;
        document.body.dataset.musicPauseReason = "awaiting-user";
        syncMusicButton();
      }
    });
    window.addEventListener("pagehide", () => {
      if (!audio.paused) pauseMusic();
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
  setupEventSwitcher();
  setupFamilies();
  setupEventActions();
  setupShareAndCalendar();
  setupAttendanceContactDialog();
  setupRsvpDialog();
  setupMapDialog();
  setupReveal();
  setupCountdown();
  setupGiftDialog();
  setupWishes();
  setupLightbox();
  const storyController = setupGuidedStory();
  setupMusic();
  setupOpeningExperience(storyController);
})();
