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
  summarySheetName: "Tổng hợp xác nhận",
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

    // Chỉ bỏ qua khi câu trả lời TRÙNG Y HỆT lần gửi trước, tức là khách bấm
    // đúp trên điện thoại. Trước đây chỉ so tên và client key, nên khách đổi ý
    // trong vòng năm phút thì lần gửi sau bị nuốt trong im lặng mà thiệp vẫn
    // báo thành công — mất đúng thông tin gia đình cần.
    const answer = {
      clientKey: clientKey,
      guestName: guestName,
      attending: attending,
      partySize: partySize,
      guestOf: guestOf,
      eventLabel: eventLabel,
      message: message,
    };

    if (clientKey && isRepeatedRsvp_(sheet, answer, now)) {
      return {
        ok: true,
        stored: true,
        duplicate: true,
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

/**
 * Có phải khách vừa gửi lại y hệt câu trả lời cũ không (bấm đúp)?
 *
 * So toàn bộ nội dung chứ không chỉ tên: khách đổi ý phải được ghi thành dòng
 * mới, còn bấm đúp thì chỉ giữ một dòng. Lịch sử được giữ đủ, dòng mới nhất của
 * mỗi khách là câu trả lời hiện hành.
 */
function isRepeatedRsvp_(sheet, answer, now) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const windowMs = RSVP_APP.duplicateWindowSeconds * 1000;
  const startRow = Math.max(2, lastRow - 24);
  const rows = sheet
    .getRange(startRow, 1, lastRow - startRow + 1, RSVP_HEADERS.length)
    .getValues();

  return rows.some(function (row) {
    const timestamp = row[0] instanceof Date ? row[0].getTime() : 0;
    if (!timestamp || now.getTime() - timestamp > windowMs) return false;

    return String(row[8]) === answer.clientKey &&
      String(row[1]) === answer.guestName &&
      String(row[2]) === answer.attending &&
      Number(row[3]) === answer.partySize &&
      String(row[4]) === answer.guestOf &&
      String(row[5]) === answer.eventLabel &&
      String(row[6]) === answer.message;
  });
}


/**
 * Dựng lại tab "Tổng hợp": mỗi khách một dòng, lấy câu trả lời MỚI NHẤT.
 *
 * Tab "Xác nhận tham dự" giữ đủ lịch sử nên một khách đổi ý sẽ có nhiều dòng.
 * Cộng thẳng trên tab đó sẽ đếm trùng, vì vậy con số để gia đình dùng nằm ở đây.
 * Chạy lại hàm này bất cứ lúc nào cần số mới.
 */
function summarizeWeddingRsvp() {
  const spreadsheet = getWishesSpreadsheet_();
  const sheet = getOrCreateRsvpSheet_(spreadsheet);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log("Chưa có xác nhận nào.");
    return;
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, RSVP_HEADERS.length).getValues();

  // Một khách trong một sự kiện chỉ có một câu trả lời hiện hành: dòng gửi sau
  // cùng. Khoá theo cả sự kiện vì cùng một người có thể được mời nhiều tiệc.
  const current = {};
  rows.forEach(function (row) {
    const guestName = String(row[1] || "").trim();
    const eventLabel = String(row[5] || "Chưa rõ");
    if (!guestName) return;

    // Lồng hai mức thay vì ghép khoá bằng ký tự ngăn cách: tên khách là dữ liệu
    // khách tự nhập nên không nên tin nó không chứa ký tự ta chọn làm dấu ngăn.
    if (!current[eventLabel]) current[eventLabel] = {};
    const bucket = current[eventLabel];
    const key = guestName.toLowerCase();

    const timestamp = row[0] instanceof Date ? row[0].getTime() : 0;
    const previous = bucket[key];
    if (previous && previous.timestamp >= timestamp) return;

    bucket[key] = {
      timestamp: timestamp,
      when: row[0],
      guestName: guestName,
      attending: String(row[2]),
      partySize: Number(row[3]) || 0,
      guestOf: String(row[4] || ""),
      eventLabel: eventLabel,
      message: String(row[6] || ""),
      revisions: previous ? previous.revisions + 1 : 1,
    };
  });

  const entries = [];
  Object.keys(current).forEach(function (eventLabel) {
    Object.keys(current[eventLabel]).forEach(function (key) {
      entries.push(current[eventLabel][key]);
    });
  });
  entries.sort(function (a, b) {
    if (a.eventLabel !== b.eventLabel) return a.eventLabel < b.eventLabel ? -1 : 1;
    return a.guestName < b.guestName ? -1 : 1;
  });

  writeRsvpSummarySheet_(spreadsheet, entries);

  const totals = {};
  entries.forEach(function (entry) {
    if (!totals[entry.eventLabel]) {
      totals[entry.eventLabel] = { guests: 0, yes: 0, no: 0 };
    }
    const coming = entry.attending === RSVP_ATTENDING.yes;
    totals[entry.eventLabel][coming ? "yes" : "no"] += 1;
    if (coming) totals[entry.eventLabel].guests += entry.partySize;
  });

  Object.keys(totals).forEach(function (eventLabel) {
    const item = totals[eventLabel];
    Logger.log(
      "%s — nhận lời: %s, từ chối: %s, tổng số người: %s",
      eventLabel,
      item.yes,
      item.no,
      item.guests
    );
  });
  Logger.log("Đã dựng lại tab \"%s\".", RSVP_APP.summarySheetName);
}


function writeRsvpSummarySheet_(spreadsheet, entries) {
  const headers = [
    "Sự kiện",
    "Họ và tên",
    "Tham dự",
    "Số người",
    "Khách của",
    "Lời nhắn",
    "Cập nhật lúc",
    "Số lần gửi",
  ];

  let sheet = spreadsheet.getSheetByName(RSVP_APP.summarySheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(RSVP_APP.summarySheetName);
    sheet.setColumnWidth(1, 190);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(6, 320);
  }

  // Dựng lại từ đầu để không sót dòng của lần tổng hợp trước.
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  sheet.setFrozenRows(1);

  if (entries.length) {
    const values = entries.map(function (entry) {
      return [
        entry.eventLabel,
        entry.guestName,
        entry.attending,
        entry.partySize,
        entry.guestOf,
        entry.message,
        entry.when,
        entry.revisions,
      ];
    });
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  }

  SpreadsheetApp.flush();
}
