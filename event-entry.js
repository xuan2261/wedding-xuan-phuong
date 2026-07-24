(() => {
  "use strict";

  const eventId = String(document.body?.dataset.eventId || "").trim().toLowerCase();
  const params = new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));
  if (eventId) params.set("event", eventId);
  const destination = new URL("../../", window.location.href);
  destination.hash = params.toString();

  const fallback = document.querySelector("[data-event-entry-link]");
  if (fallback) fallback.href = destination.toString();

  window.location.replace(destination.toString());
})();
