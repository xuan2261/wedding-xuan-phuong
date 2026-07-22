/**
 * SỔ LỜI CHÚC CƯỚI — GOOGLE APPS SCRIPT WEB APP
 *
 * Luồng:
 * - POST: lưu lời chúc ở trạng thái pending.
 * - GET?action=list&callback=...: chỉ trả lời chúc approved bằng JSONP.
 * - Google Sheet là màn hình kiểm duyệt.
 *
 * Trước khi deploy:
 * 1. Chạy setupWeddingWishes().
 * 2. Deploy > New deployment > Web app.
 * 3. Execute as: Me.
 * 4. Who has access: Anyone.
 * 5. Dán URL /exec vào config.js của website và bật wishes.enabled.
 */

const WISHES_APP = Object.freeze({
  version: "1.1.0",
  spreadsheetTitle: "Lời chúc cưới - Thanh Xuân & Thị Phượng",
  sheetName: "Lời chúc",
  siteOrigin: "https://xuan2261.github.io",
  cacheKey: "approved-wedding-wishes-v1",
  cacheSeconds: 300,
  clientCooldownSeconds: 180,
  duplicateWindowSeconds: 86400,
  maxApprovedResults: 100,
  minFormOpenMs: 1200,
  minNameLength: 2,
  maxNameLength: 50,
  maxRelationshipLength: 40,
  minMessageLength: 5,
  maxMessageLength: 280,
});

const WISHES_HEADERS = Object.freeze([
  "id",
  "createdAt",
  "displayName",
  "relationship",
  "message",
  "status",
  "approvedAt",
  "sortOrder",
  "featured",
  "clientKey",
]);

const WISHES_STATUS = Object.freeze({
  pending: "pending",
  approved: "approved",
  hidden: "hidden",
});


function setupWeddingWishes() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty("WISHES_SPREADSHEET_ID");
  let spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create(WISHES_APP.spreadsheetTitle);
    spreadsheetId = spreadsheet.getId();
    properties.setProperty("WISHES_SPREADSHEET_ID", spreadsheetId);
  }

  const sheet = ensureWishesSheet_(spreadsheet);
  ensureModerationTrigger_(spreadsheet);
  clearWeddingWishesCache();

  const result = {
    message: "Đã chuẩn bị Google Sheet và trigger kiểm duyệt.",
    spreadsheetId,
    spreadsheetUrl: spreadsheet.getUrl(),
    sheetName: sheet.getName(),
    siteOrigin: WISHES_APP.siteOrigin,
    nextStep:
      "Deploy dự án thành Web app, chọn Execute as Me và Who has access: Anyone.",
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}


function getWeddingWishesAdminInfo() {
  const spreadsheet = getWishesSpreadsheet_();

  const result = {
    spreadsheetUrl: spreadsheet.getUrl(),
    sheetName: WISHES_APP.sheetName,
    approvedStatus: WISHES_STATUS.approved,
    pendingStatus: WISHES_STATUS.pending,
    hiddenStatus: WISHES_STATUS.hidden,
    siteOrigin: WISHES_APP.siteOrigin,
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}


function doGet(e) {
  const parameters = (e && e.parameter) || {};
  const action = String(parameters.action || "list").toLowerCase();

  if (action === "health") {
    return createJsonOrJsonpOutput_(
      {
        ok: true,
        service: "wedding-wishes",
        version: WISHES_APP.version,
      },
      parameters.callback
    );
  }

  if (action !== "list") {
    return createJsonOrJsonpOutput_(
      {
        ok: false,
        code: "INVALID_ACTION",
        message: "Yêu cầu không hợp lệ.",
      },
      parameters.callback
    );
  }

  try {
    return createJsonOrJsonpOutput_(
      {
        ok: true,
        wishes: getApprovedWishes_(),
      },
      parameters.callback
    );
  } catch (error) {
    console.error(error);

    return createJsonOrJsonpOutput_(
      {
        ok: false,
        code: "READ_FAILED",
        message: "Chưa thể tải lời chúc.",
      },
      parameters.callback
    );
  }
}


function doPost(e) {
  const parameters = (e && e.parameter) || {};
  const requestId = normalizeRequestId_(parameters.requestId);

  let result;

  try {
    result = submitWeddingWish_(parameters);
  } catch (error) {
    console.error(error);

    result = {
      ok: false,
      code: "SUBMIT_FAILED",
      message: "Chưa thể lưu lời chúc. Vui lòng thử lại sau.",
    };
  }

  return createIframeResponse_({
    type: "wedding-wish-result-v1",
    requestId,
    ...result,
  });
}


function submitWeddingWish_(parameters) {
  const requestId = normalizeRequestId_(parameters.requestId);

  // Honeypot: giả vờ nhận thành công để bot không biết đã bị phát hiện.
  if (normalizePlainText_(parameters.website, 120)) {
    return {
      ok: true,
      pending: true,
      requestId,
    };
  }

  if (String(parameters.siteOrigin || "") !== WISHES_APP.siteOrigin) {
    return {
      ok: false,
      code: "INVALID_ORIGIN",
      message: "Nguồn gửi lời chúc không hợp lệ.",
      requestId,
    };
  }

  const openedAt = Number(parameters.openedAt || 0);
  if (
    !Number.isFinite(openedAt) ||
    Date.now() - openedAt < WISHES_APP.minFormOpenMs
  ) {
    return {
      ok: false,
      code: "TOO_FAST",
      message: "Vui lòng dành thêm một chút thời gian cho lời chúc.",
      requestId,
    };
  }

  const clientKey = normalizeClientKey_(parameters.clientKey);
  if (!clientKey) {
    return {
      ok: false,
      code: "INVALID_CLIENT",
      message: "Phiên gửi lời chúc không hợp lệ. Vui lòng tải lại trang.",
      requestId,
    };
  }

  const displayName = normalizePlainText_(
    parameters.displayName,
    WISHES_APP.maxNameLength
  );
  const relationship = normalizePlainText_(
    parameters.relationship,
    WISHES_APP.maxRelationshipLength
  );
  const message = normalizePlainText_(
    parameters.message,
    WISHES_APP.maxMessageLength
  );

  const validationError = validateWish_({
    displayName,
    relationship,
    message,
    consent: parameters.consent,
  });

  if (validationError) {
    return {
      ok: false,
      code: "INVALID_CONTENT",
      message: validationError,
      requestId,
    };
  }

  const cache = CacheService.getScriptCache();
  const clientRateKey = `wish-rate-${digestKey_(clientKey)}`;

  if (cache.get(clientRateKey)) {
    return {
      ok: false,
      code: "RATE_LIMIT",
      message:
        "Quý vị vừa gửi lời chúc. Vui lòng chờ một vài phút trước khi gửi lại.",
      requestId,
    };
  }

  const duplicateKey = `wish-duplicate-${digestKey_(
    `${displayName.toLowerCase()}|${message.toLowerCase()}`
  )}`;

  if (cache.get(duplicateKey)) {
    return {
      ok: false,
      code: "DUPLICATE",
      message: "Lời chúc này đã được ghi nhận trước đó.",
      requestId,
    };
  }

  const lock = LockService.getScriptLock();

  if (!lock.tryLock(8000)) {
    return {
      ok: false,
      code: "BUSY",
      message: "Hệ thống đang bận. Vui lòng thử lại sau ít phút.",
      requestId,
    };
  }

  try {
    const spreadsheet = getWishesSpreadsheet_();
    const sheet = ensureWishesSheet_(spreadsheet);
    const now = new Date();

    sheet.appendRow([
      Utilities.getUuid(),
      now,
      safeSheetCell_(displayName),
      safeSheetCell_(relationship),
      safeSheetCell_(message),
      WISHES_STATUS.pending,
      "",
      "",
      false,
      safeSheetCell_(clientKey),
    ]);

    SpreadsheetApp.flush();

    cache.put(
      clientRateKey,
      "1",
      WISHES_APP.clientCooldownSeconds
    );
    cache.put(
      duplicateKey,
      "1",
      WISHES_APP.duplicateWindowSeconds
    );
    cache.remove(WISHES_APP.cacheKey);

    return {
      ok: true,
      pending: true,
      message:
        "Lời chúc đã được gửi và đang chờ hai gia đình duyệt.",
      requestId,
    };
  } finally {
    lock.releaseLock();
  }
}


function validateWish_(wish) {
  if (
    wish.displayName.length < WISHES_APP.minNameLength ||
    wish.displayName.length > WISHES_APP.maxNameLength
  ) {
    return `Tên hiển thị cần từ ${WISHES_APP.minNameLength} đến ${WISHES_APP.maxNameLength} ký tự.`;
  }

  if (wish.relationship.length > WISHES_APP.maxRelationshipLength) {
    return `Mối quan hệ không được vượt quá ${WISHES_APP.maxRelationshipLength} ký tự.`;
  }

  if (
    wish.message.length < WISHES_APP.minMessageLength ||
    wish.message.length > WISHES_APP.maxMessageLength
  ) {
    return `Lời chúc cần từ ${WISHES_APP.minMessageLength} đến ${WISHES_APP.maxMessageLength} ký tự.`;
  }

  if (String(wish.consent || "") !== "yes") {
    return "Quý vị cần đồng ý với việc hiển thị công khai sau khi lời chúc được duyệt.";
  }

  if (
    /<\s*\/?\s*[a-z][^>]*>/i.test(wish.displayName) ||
    /<\s*\/?\s*[a-z][^>]*>/i.test(wish.relationship) ||
    /<\s*\/?\s*[a-z][^>]*>/i.test(wish.message)
  ) {
    return "Nội dung không được chứa mã HTML.";
  }

  if (/https?:\/\/|www\./i.test(wish.message)) {
    return "Lời chúc không được chứa đường dẫn website.";
  }

  return "";
}


function getApprovedWishes_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(WISHES_APP.cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const sheet = ensureWishesSheet_(getWishesSpreadsheet_());
  const values = sheet.getDataRange().getDisplayValues();

  if (values.length <= 1) {
    cache.put(WISHES_APP.cacheKey, "[]", WISHES_APP.cacheSeconds);
    return [];
  }

  const headerIndex = createHeaderIndex_(values[0]);

  const wishes = values
    .slice(1)
    .filter(
      (row) =>
        String(row[headerIndex.status] || "").toLowerCase() ===
        WISHES_STATUS.approved
    )
    .map((row) => ({
      id: String(row[headerIndex.id] || ""),
      displayName: String(row[headerIndex.displayName] || ""),
      relationship: String(row[headerIndex.relationship] || ""),
      message: String(row[headerIndex.message] || ""),
      featured:
        String(row[headerIndex.featured] || "").toLowerCase() === "true",
      sortOrder:
        Number(row[headerIndex.sortOrder]) || Number.MAX_SAFE_INTEGER,
      approvedAt:
        Date.parse(row[headerIndex.approvedAt]) ||
        Date.parse(row[headerIndex.createdAt]) ||
        0,
    }))
    .filter(
      (wish) =>
        wish.displayName &&
        wish.message &&
        wish.displayName.length <= WISHES_APP.maxNameLength &&
        wish.relationship.length <= WISHES_APP.maxRelationshipLength &&
        wish.message.length <= WISHES_APP.maxMessageLength
    )
    .sort((left, right) => {
      if (left.featured !== right.featured) {
        return left.featured ? -1 : 1;
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return right.approvedAt - left.approvedAt;
    })
    .slice(0, WISHES_APP.maxApprovedResults)
    .map(({ sortOrder, approvedAt, ...publicWish }) => publicWish);

  cache.put(
    WISHES_APP.cacheKey,
    JSON.stringify(wishes),
    WISHES_APP.cacheSeconds
  );

  return wishes;
}


function handleWeddingWishesEdit(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();

  if (
    sheet.getName() !== WISHES_APP.sheetName ||
    e.range.getRow() <= 1
  ) {
    return;
  }

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];
  const headerIndex = createHeaderIndex_(headers);
  const statusColumn = headerIndex.status + 1;

  if (e.range.getColumn() === statusColumn) {
    const status = String(e.value || "").toLowerCase();
    const approvedAtCell = sheet.getRange(
      e.range.getRow(),
      headerIndex.approvedAt + 1
    );

    if (status === WISHES_STATUS.approved) {
      if (!approvedAtCell.getValue()) {
        approvedAtCell.setValue(new Date());
      }
    } else {
      approvedAtCell.clearContent();
    }
  }

  clearWeddingWishesCache();
}


function clearWeddingWishesCache() {
  CacheService.getScriptCache().remove(WISHES_APP.cacheKey);
}


function getWishesSpreadsheet_() {
  const spreadsheetId = PropertiesService
    .getScriptProperties()
    .getProperty("WISHES_SPREADSHEET_ID");

  if (!spreadsheetId) {
    throw new Error(
      "Chưa có Google Sheet. Hãy chạy setupWeddingWishes() trước."
    );
  }

  return SpreadsheetApp.openById(spreadsheetId);
}


function ensureWishesSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(WISHES_APP.sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(WISHES_APP.sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([...WISHES_HEADERS]);
  } else {
    const existingHeaders = sheet
      .getRange(1, 1, 1, WISHES_HEADERS.length)
      .getDisplayValues()[0];

    WISHES_HEADERS.forEach((header, index) => {
      if (existingHeaders[index] !== header) {
        sheet.getRange(1, index + 1).setValue(header);
      }
    });
  }

  sheet.setFrozenRows(1);
  sheet
    .getRange(1, 1, 1, WISHES_HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#214b3a")
    .setFontColor("#ffffff");

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(
      [
        WISHES_STATUS.pending,
        WISHES_STATUS.approved,
        WISHES_STATUS.hidden,
      ],
      true
    )
    .setAllowInvalid(false)
    .build();

  const availableRows = Math.max(1, sheet.getMaxRows() - 1);
  sheet
    .getRange(2, WISHES_HEADERS.indexOf("status") + 1, availableRows, 1)
    .setDataValidation(statusRule);
  sheet
    .getRange(2, WISHES_HEADERS.indexOf("featured") + 1, availableRows, 1)
    .insertCheckboxes();

  const widths = [250, 145, 190, 170, 520, 110, 145, 90, 85, 230];
  widths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });

  return sheet;
}


function ensureModerationTrigger_(spreadsheet) {
  const exists = ScriptApp.getProjectTriggers().some(
    (trigger) =>
      trigger.getHandlerFunction() === "handleWeddingWishesEdit" &&
      trigger.getTriggerSourceId() === spreadsheet.getId()
  );

  if (!exists) {
    ScriptApp.newTrigger("handleWeddingWishesEdit")
      .forSpreadsheet(spreadsheet)
      .onEdit()
      .create();
  }
}


function createHeaderIndex_(headers) {
  const index = {};

  WISHES_HEADERS.forEach((header) => {
    const position = headers.indexOf(header);

    if (position < 0) {
      throw new Error(`Thiếu cột bắt buộc: ${header}`);
    }

    index[header] = position;
  });

  return index;
}


function createJsonOrJsonpOutput_(payload, rawCallback) {
  const callback = normalizeCallback_(rawCallback);
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");

  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}


function createIframeResponse_(payload) {
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  const targetOrigin = JSON.stringify(WISHES_APP.siteOrigin);

  return HtmlService
    .createHtmlOutput(
      [
        "<!doctype html>",
        '<html lang="vi"><head><meta charset="utf-8"></head><body>',
        "<script>",
        `window.parent.postMessage(${json}, ${targetOrigin});`,
        "</script>",
        "</body></html>",
      ].join("")
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function normalizePlainText_(value, maxLength) {
  return String(value || "")
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}


function normalizeClientKey_(value) {
  const normalized = String(value || "").trim();

  return /^[A-Za-z0-9_-]{12,100}$/.test(normalized)
    ? normalized
    : "";
}


function normalizeRequestId_(value) {
  const normalized = String(value || "").trim();

  return /^[A-Za-z0-9_-]{8,120}$/.test(normalized)
    ? normalized
    : "";
}


function normalizeCallback_(value) {
  const callback = String(value || "").trim();

  return /^[A-Za-z_$][0-9A-Za-z_$]*(?:\.[A-Za-z_$][0-9A-Za-z_$]*){0,3}$/.test(
    callback
  )
    ? callback
    : "";
}


function digestKey_(value) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      String(value)
    )
  ).slice(0, 32);
}


function safeSheetCell_(value) {
  const text = String(value || "");

  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}
