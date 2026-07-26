(() => {
  "use strict";

  const eventId = String(document.body?.dataset.eventId || "").trim().toLowerCase();

  // Gộp cả query string lẫn fragment, cùng thứ tự ưu tiên với config.js và
  // readEventContext (fragment thắng). Trước đây chỉ đọc fragment nên link dạng
  // events/<id>/?to=…&events=… bị mất tên khách và mất luôn danh sách sự kiện —
  // trong khi đúng URL đó lại chạy được ở trang gốc.
  const params = new URLSearchParams(String(window.location.search || ""));
  new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""))
    .forEach((value, key) => params.set(key, value));
  if (eventId) params.set("event", eventId);
  const destination = new URL("../../", window.location.href);
  destination.hash = params.toString();

  const fallback = document.querySelector("[data-event-entry-link]");
  if (fallback) fallback.href = destination.toString();

  window.location.replace(destination.toString());
})();
