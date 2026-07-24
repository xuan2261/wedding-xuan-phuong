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

  function readEventContext(locationLike, options = {}) {
    const eventParameter = String(options.eventParameter || "event");
    const eventsParameter = String(options.eventsParameter || "events");
    const validIds = Array.isArray(options.validIds) ? options.validIds.map(String) : [];
    const fallbackId = String(options.fallbackId || validIds[0] || "");
    const params = new URLSearchParams(String(locationLike?.hash || "").replace(/^#/, ""));
    const requestedMany = String(params.get(eventsParameter) || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value, index, values) => validIds.includes(value) && values.indexOf(value) === index);
    const requestedOne = String(params.get(eventParameter) || "").trim().toLowerCase();
    const invitedEventIds = requestedMany.length
      ? requestedMany
      : validIds.includes(requestedOne)
        ? [requestedOne]
        : fallbackId
          ? [fallbackId]
          : [];
    const activeEventId = invitedEventIds.includes(requestedOne)
      ? requestedOne
      : invitedEventIds[0] || fallbackId;
    return { activeEventId, invitedEventIds };
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

  function buildInvitationUrl(baseUrl, options = {}) {
    const url = new URL(String(baseUrl || ""), window.location.href);
    const params = new URLSearchParams();
    const guestName = sanitizeGuestName(options.guestName);
    const guestParameter = String(options.guestParameter || "to");
    const eventParameter = String(options.eventParameter || "event");
    const eventsParameter = String(options.eventsParameter || "events");
    const invitedEventIds = Array.isArray(options.invitedEventIds)
      ? [...new Set(options.invitedEventIds.map(String).filter(Boolean))]
      : [];
    const activeEventId = String(options.activeEventId || invitedEventIds[0] || "");

    if (guestName) params.set(guestParameter, guestName);
    if (invitedEventIds.length > 1) params.set(eventsParameter, invitedEventIds.join(","));
    if (activeEventId) params.set(eventParameter, activeEventId);
    url.hash = params.toString();
    return url.toString();
  }

  function buildEventEntryUrl(baseUrl, eventId, options = {}) {
    const normalizedEventId = String(eventId || options.activeEventId || "").trim().toLowerCase();
    const siteRoot = new URL(String(baseUrl || ""), window.location.href);
    siteRoot.hash = "";
    siteRoot.search = "";
    const rootHref = siteRoot.href.endsWith("/") ? siteRoot.href : `${siteRoot.href}/`;
    const entryBase = normalizedEventId
      ? new URL(`events/${encodeURIComponent(normalizedEventId)}/`, rootHref).toString()
      : rootHref;
    return buildInvitationUrl(entryBase, {
      ...options,
      activeEventId: normalizedEventId || options.activeEventId
    });
  }

  function buildPersonalizedUrl(baseUrl, guestName, parameter = "to") {
    return buildInvitationUrl(baseUrl, {
      guestName,
      guestParameter: parameter
    });
  }

  window.WEDDING_GUEST_UTILS = Object.freeze({
    sanitizeGuestName,
    readGuestName,
    readEventContext,
    buildRsvpUrl,
    buildInvitationUrl,
    buildEventEntryUrl,
    buildPersonalizedUrl
  });
})();
