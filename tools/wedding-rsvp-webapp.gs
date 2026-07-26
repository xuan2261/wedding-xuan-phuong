/**
 * XÁC NHẬN THAM DỰ (RSVP) — MODULE APPS SCRIPT
 *
 * File này KHÔNG phải một project riêng. Hãy thêm nó vào ĐÚNG project Apps Script
 * đang chạy sổ lời chúc (wedding-wishes-webapp.gs) để:
 * - dùng chung một Google Sheet, đúng như gia đình đã chốt;
 * - dùng chung một URL /exec, không phải deploy và quản lý hai web app;
 * - tái sử dụng các hàm chuẩn hoá dữ liệu đã có sẵn ở file lời chúc.
 *
 * Các bước cài đặt:
 * 1. Mở project Apps Script của sổ lời chúc (Extensions > Apps Script từ Sheet,
 *    hoặc script.google.com > project đang deploy).
 * 2. Thêm file mới, dán toàn bộ nội dung này vào.
 * 3. Chạy setupWeddingRsvp() một lần để tạo tab "Xác nhận tham dự".
 * 4. Deploy > Manage deployments > sửa deployment đang chạy > New version > Deploy.
 *    URL /exec giữ nguyên nên sổ lời chúc không bị gián đoạn.
 * 5. Dán URL /exec đó vào config.js: rsvpForm.apiUrl.
 *
 * Lưu ý: doPost() nằm ở file lời chúc và định tuyến sang đây khi form=rsvp.
 */

const RSVP_APP = Object.freeze({
  version: "1.0.0",
  sheetName: "Xác nhận tham dự",
  clientCooldownSeconds: 60,
  duplicateWindowSeconds: 300,
  minFormOpenMs: 1200,
  minNameLength: 2,
  maxNameLength: 80,
  maxMessageLength: 280,
  maxPartySize: 20,
});

const RSVP_HEADERS = Object.freeze([
  "Thời điểm",
  "Họ và tên",
  "Tham dự",
  "Số người",
  "Khách của",
  "Sự kiện",
  "Lời nhắn",
  "Link khách nhận",
  "Client key",
  "Request ID",
]);

const RSVP_ATTENDING = Object.freeze({ yes: "Có", no: "Không" });
const RSVP_GUEST_OF = Object.freeze({ groom: "Chú rể", bride: "Cô dâu" });
const RSVP_EVENT_LABELS = Object.freeze({
  bride: "Tiệc nhà gái 29/07",
  groom: "Lễ và tiệc nhà trai 30/07",
  nhatrang: "Báo hỷ Nha Trang 15/08",
  saigon: "Báo hỷ Sài Gòn 22/08",
});

/**
 * Tạo tab RSVP trong đúng Google Sheet của sổ lời chúc. Chạy một lần.
 */
function setupWeddingRsvp() {
  const spreadsheet = getWishesSpreadsheet_();
  const sheet = getOrCreateRsvpSheet_(spreadsheet);

  Logger.log(
    "Tab RSVP: %s | Sheet: %s",
    sheet.getName(),
    spreadsheet.getUrl()
  );
}

function getOrCreateRsvpSheet_(spreadsheet) {
  const existing = spreadsheet.getSheetByName(RSVP_APP.sheetName);
  if (existing) return existing;

  const sheet = spreadsheet.insertSheet(RSVP_APP.sheetName);
  sheet.getRange(1, 1, 1, RSVP_HEADERS.length).setValues([RSVP_HEADERS.slice()]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, RSVP_HEADERS.length).setFontWeight("bold");
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(6, 190);
  sheet.setColumnWidth(7, 320);

  return sheet;
}

/**
 * Được doPost() ở file lời chúc gọi khi form=rsvp.
 */
function handleWeddingRsvpPost(parameters) {
  const requestId = normalizeRequestId_(parameters.requestId);

  let result;

  try {
    result = submitWeddingRsvp_(parameters);
  } catch (error) {
    console.error(error);

    result = {
      ok: false,
      stored: false,
      code: "SUBMIT_FAILED",
      message: "Chưa lưu được xác nhận. Quý khách vui lòng thử lại sau.",
    };
  }

  return createIframeResponse_({
    type: "wedding-rsvp-result-v1",
    requestId,
    ...result,
  });
}

function submitWeddingRsvp_(parameters) {
  const requestId = normalizeRequestId_(parameters.requestId);

  // Honeypot: bot điền mọi trường, khách thật không thấy trường này.
  if (normalizePlainText_(parameters.website, 120)) {
    console.warn(JSON.stringify({ event: "rsvp-honeypot", requestId }));

    return {
      ok: false,
      stored: false,
      code: "SPAM_GUARD",
      message: "Biểu mẫu có dữ liệu tự động điền. Vui lòng tải lại trang và thử lại.",
    };
  }

  const openedAt = Number(parameters.openedAt || 0);
  if (openedAt > 0 && Date.now() - openedAt < RSVP_APP.minFormOpenMs) {
    return {
      ok: false,
      stored: false,
      code: "TOO_FAST",
      message: "Vui lòng dành thêm một chút thời gian rồi gửi lại.",
    };
  }

  const guestName = normalizePlainText_(parameters.guestName, RSVP_APP.maxNameLength);
  if (guestName.length < RSVP_APP.minNameLength) {
    return {
      ok: false,
      stored: false,
      code: "INVALID_NAME",
      message: "Vui lòng nhập họ và tên của Quý khách.",
    };
  }

  const attending = RSVP_ATTENDING[String(parameters.attending || "").trim()];
  if (!attending) {
    return {
      ok: false,
      stored: false,
      code: "INVALID_ATTENDING",
      message: "Vui lòng chọn Quý khách có tham dự hay không.",
    };
  }

  const guestOf = RSVP_GUEST_OF[String(parameters.guestOf || "").trim()] || "";
  const eventId = String(parameters.eventId || "").trim();
  const eventLabel = RSVP_EVENT_LABELS[eventId] || eventId || "Chưa rõ";
  const message = normalizePlainText_(parameters.message, RSVP_APP.maxMessageLength);
  const guestLink = normalizePlainText_(parameters.guestLink, 300);
  const clientKey = normalizeClientKey_(parameters.clientKey);

  // Không tham dự thì số người luôn là 0, tránh số rác làm lệch tổng hợp.
  const rawPartySize = Math.floor(Number(parameters.partySize));
  const partySize = attending === RSVP_ATTENDING.no
    ? 0
    : Math.min(
        RSVP_APP.maxPartySize,
        Math.max(1, Number.isFinite(rawPartySize) ? rawPartySize : 1)
      );

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return {
      ok: false,
      stored: false,
      code: "BUSY",
      message: "Hệ thống đang bận. Quý khách vui lòng thử lại sau ít phút.",
    };
  }

  try {
    const sheet = getOrCreateRsvpSheet_(getWishesSpreadsheet_());
    const now = new Date();

    // Khách bấm gửi hai lần liên tiếp là chuyện thường trên điện thoại; chỉ ghi
    // một dòng thay vì để gia đình phải tự lọc trùng trong Sheet.
    if (clientKey && isDuplicateRsvp_(sheet, clientKey, guestName, now)) {
      return {
        ok: true,
        stored: true,
        code: "DUPLICATE_IGNORED",
        message: "Xác nhận của Quý khách đã được ghi nhận trước đó.",
      };
    }

    sheet.appendRow([
      now,
      guestName,
      attending,
      partySize,
      guestOf,
      eventLabel,
      message,
      guestLink,
      clientKey,
      requestId,
    ]);
    SpreadsheetApp.flush();

    return { ok: true, stored: true, code: "STORED" };
  } finally {
    lock.releaseLock();
  }
}

function isDuplicateRsvp_(sheet, clientKey, guestName, now) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const windowMs = RSVP_APP.duplicateWindowSeconds * 1000;
  const startRow = Math.max(2, lastRow - 24);
  const rows = sheet
    .getRange(startRow, 1, lastRow - startRow + 1, RSVP_HEADERS.length)
    .getValues();

  return rows.some((row) => {
    const timestamp = row[0] instanceof Date ? row[0].getTime() : 0;
    if (!timestamp || now.getTime() - timestamp > windowMs) return false;
    return String(row[8]) === clientKey && String(row[1]) === guestName;
  });
}

/**
 * Tổng hợp nhanh để gia đình xem số khách theo từng sự kiện.
 */
function summarizeWeddingRsvp() {
  const sheet = getOrCreateRsvpSheet_(getWishesSpreadsheet_());
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log("Chưa có xác nhận nào.");
    return;
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, RSVP_HEADERS.length).getValues();
  const totals = {};

  rows.forEach((row) => {
    const eventLabel = String(row[5] || "Chưa rõ");
    const attending = String(row[2]) === RSVP_ATTENDING.yes;
    if (!totals[eventLabel]) totals[eventLabel] = { guests: 0, yes: 0, no: 0 };
    totals[eventLabel][attending ? "yes" : "no"] += 1;
    if (attending) totals[eventLabel].guests += Number(row[3]) || 0;
  });

  Object.keys(totals).forEach((eventLabel) => {
    const item = totals[eventLabel];
    Logger.log(
      "%s — nhận lời: %s, từ chối: %s, tổng số người: %s",
      eventLabel,
      item.yes,
      item.no,
      item.guests
    );
  });
}
