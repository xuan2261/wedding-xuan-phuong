(() => {
  "use strict";

  function sanitizeGuestName(value, maxLength = 80) {
    return String(value ?? "")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, Math.max(1, Number(maxLength) || 80));
  }

  function readGuestName(locationLike, options = {}) {
    const parameter = String(options.parameter || "to");
    const maxLength = Number(options.maxLength) || 80;
    const hash = String(locationLike?.hash || "").replace(/^#/, "");
    const search = String(locationLike?.search || "");

    const hashValue = new URLSearchParams(hash).get(parameter);
    const searchValue = new URLSearchParams(search).get(parameter);

    return sanitizeGuestName(hashValue || searchValue || "", maxLength);
  }

  function buildRsvpUrl(baseUrl, guestName, entryName) {
    const normalizedGuest = sanitizeGuestName(guestName);
    const normalizedEntry = String(entryName || "").trim();
    const url = new URL(String(baseUrl || ""), window.location.href);

    if (normalizedGuest && /^entry\.\d+$/.test(normalizedEntry)) {
      url.searchParams.set(normalizedEntry, normalizedGuest);
    }

    return url.toString();
  }

  function buildPersonalizedUrl(baseUrl, guestName, parameter = "to") {
    const url = new URL(String(baseUrl || ""), window.location.href);
    const normalizedGuest = sanitizeGuestName(guestName);

    if (normalizedGuest) {
      url.hash = new URLSearchParams({
        [String(parameter || "to")]: normalizedGuest
      }).toString();
    } else {
      url.hash = "";
    }

    return url.toString();
  }

  window.WEDDING_GUEST_UTILS = Object.freeze({
    sanitizeGuestName,
    readGuestName,
    buildRsvpUrl,
    buildPersonalizedUrl
  });
})();
