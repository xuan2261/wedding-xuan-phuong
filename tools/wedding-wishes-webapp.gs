/**
 * SỔ LỜI CHÚC CƯỚI — GOOGLE APPS SCRIPT WEB APP (release v17)
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
  version: "1.5.0",
  spreadsheetTitle: "Lời chúc cưới - Thanh Xuân & Thị Phượng",
  sheetName: "Lời chúc",
  siteOrigin: "https://xuan2261.github.io",
  cacheKey: "approved-wedding-wishes-v1",
  cacheSeconds: 300,
  clientCooldownSeconds: 180,
  duplicateWindowSeconds: 21600,
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

  // Honeypot: trong giai đoạn vận hành thực tế, không báo thành công giả.
  // Điều này giúp frontend chỉ báo thành công khi Sheet đã được ghi thật.
  const honeypotValue = normalizePlainText_(parameters.website, 120);
  if (honeypotValue) {
    console.warn(
      JSON.stringify({
        event: "honeypot-triggered",
        requestId,
        valueLength: honeypotValue.length,
      })
    );

    return {
      ok: false,
      stored: false,
      code: "SPAM_GUARD",
      message:
        "Biểu mẫu có dữ liệu tự động điền không hợp lệ. " +
        "Vui lòng tải lại trang và thử lại.",
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
    const submissionId = Utilities.getUuid();
    const rowNumber = findNextWishRow_(sheet);

    sheet
      .getRange(rowNumber, 1, 1, WISHES_HEADERS.length)
      .setValues([[
        submissionId,
        now,
        safeSheetCell_(displayName),
        safeSheetCell_(relationship),
        safeSheetCell_(message),
        WISHES_STATUS.pending,
        "",
        "",
        "", // Ô trống là checkbox chưa chọn; không ghi FALSE hàng loạt.
        safeSheetCell_(clientKey),
      ]]);

    applyWishValidationRules_(sheet, rowNumber, 1);
    SpreadsheetApp.flush();

    const storedId = sheet.getRange(rowNumber, 1).getDisplayValue();
    if (storedId !== submissionId) {
      throw new Error(
        `Không xác minh được hàng vừa lưu tại dòng ${rowNumber}.`
      );
    }

    console.info(
      JSON.stringify({
        event: "wish-stored",
        requestId,
        submissionId,
        spreadsheetId: spreadsheet.getId(),
        sheetId: sheet.getSheetId(),
        sheetName: sheet.getName(),
        rowNumber,
        status: WISHES_STATUS.pending,
      })
    );

    // Cache là tối ưu best-effort. Một lỗi cache không được phép
    // biến một hàng đã xác minh lưu thành phản hồi thất bại.
    try {
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
    } catch (cacheError) {
      console.warn(
        JSON.stringify({
          event: "wish-cache-write-failed",
          requestId,
          submissionId,
          message: String(cacheError),
        })
      );
    }

    return {
      ok: true,
      stored: true,
      pending: true,
      submissionId,
      rowNumber,
      message:
        "Lời chúc đã được lưu và đang chờ hai gia đình duyệt.",
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
  const lastWishRow = findLastWishDataRow_(sheet);

  if (lastWishRow < 2) {
    cache.put(WISHES_APP.cacheKey, "[]", WISHES_APP.cacheSeconds);
    return [];
  }

  const values = sheet
    .getRange(1, 1, lastWishRow, WISHES_HEADERS.length)
    .getDisplayValues();
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


/**
 * Chẩn đoán vùng dữ liệu đang dùng.
 */
function inspectWeddingWishesStorage() {
  const spreadsheet = getWishesSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(WISHES_APP.sheetName);

  if (!sheet) {
    throw new Error(`Không tìm thấy tab "${WISHES_APP.sheetName}".`);
  }

  const lastSheetRow = sheet.getLastRow();
  const lastWishDataRow = findLastWishDataRow_(sheet);
  const nextWishRow = findNextWishRow_(sheet);
  const startRow = Math.max(2, lastWishDataRow - 14);
  const rowCount =
    lastWishDataRow >= 2
      ? lastWishDataRow - startRow + 1
      : 0;

  const recentRows = rowCount
    ? sheet
        .getRange(
          startRow,
          1,
          rowCount,
          WISHES_HEADERS.length
        )
        .getDisplayValues()
        .map((row, index) => ({
          rowNumber: startRow + index,
          id: row[0],
          createdAt: row[1],
          displayName: row[2],
          relationship: row[3],
          message: row[4],
          status: row[5],
          approvedAt: row[6],
          sortOrder: row[7],
          featured: row[8],
        }))
    : [];

  const result = {
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    sheetName: sheet.getName(),
    sheetId: sheet.getSheetId(),
    maxRows: sheet.getMaxRows(),
    lastSheetRow,
    lastWishDataRow,
    nextWishRow,
    recentRows,
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}


/**
 * Chạy MỘT LẦN sau khi thay source.
 *
 * - Giữ lại mọi hàng có id, displayName hoặc message.
 * - Xóa FALSE do insertCheckboxes() từng ghi vào các hàng trống.
 * - Dồn dữ liệu thật lên từ hàng 2.
 * - Khôi phục dropdown trạng thái và checkbox featured chỉ cho hàng có dữ liệu.
 */
function repairAndCompactWeddingWishes() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(20000)) {
    throw new Error(
      "Không lấy được khóa sửa bảng. Vui lòng thử lại sau."
    );
  }

  try {
    const spreadsheet = getWishesSpreadsheet_();
    const sheet = spreadsheet.getSheetByName(WISHES_APP.sheetName);

    if (!sheet) {
      throw new Error(`Không tìm thấy tab "${WISHES_APP.sheetName}".`);
    }

    const width = WISHES_HEADERS.length;
    const maxRows = sheet.getMaxRows();
    const rowCount = Math.max(0, maxRows - 1);
    const now = new Date();

    const sourceRows = rowCount
      ? sheet.getRange(2, 1, rowCount, width).getValues()
      : [];

    const statusIndex = WISHES_HEADERS.indexOf("status");
    const approvedAtIndex = WISHES_HEADERS.indexOf("approvedAt");
    const featuredIndex = WISHES_HEADERS.indexOf("featured");

    const wishes = sourceRows
      .filter(isWishDataRow_)
      .map((sourceRow) => {
        const row = sourceRow.slice(0, width);

        if (!String(row[0] || "").trim()) {
          row[0] = Utilities.getUuid();
        }

        if (!row[1]) {
          row[1] = now;
        }

        row[2] = safeSheetCell_(
          normalizePlainText_(row[2], WISHES_APP.maxNameLength)
        );
        row[3] = safeSheetCell_(
          normalizePlainText_(
            row[3],
            WISHES_APP.maxRelationshipLength
          )
        );
        row[4] = safeSheetCell_(
          normalizePlainText_(row[4], WISHES_APP.maxMessageLength)
        );

        const rawStatus = String(row[statusIndex] || "")
          .trim()
          .toLowerCase();

        row[statusIndex] = Object.values(WISHES_STATUS).includes(rawStatus)
          ? rawStatus
          : WISHES_STATUS.pending;

        if (row[statusIndex] === WISHES_STATUS.approved) {
          if (!row[approvedAtIndex]) {
            row[approvedAtIndex] = row[1] || now;
          }
        } else {
          row[approvedAtIndex] = "";
        }

        row[featuredIndex] =
          row[featuredIndex] === true ||
          String(row[featuredIndex] || "").toLowerCase() === "true"
            ? true
            : "";

        row[9] = safeSheetCell_(
          normalizePlainText_(row[9], 100)
        );

        return row;
      });

    if (rowCount > 0) {
      sheet
        .getRange(2, 1, rowCount, width)
        .clearContent();

      sheet
        .getRange(
          2,
          WISHES_HEADERS.indexOf("status") + 1,
          rowCount,
          1
        )
        .clearDataValidations();

      sheet
        .getRange(
          2,
          WISHES_HEADERS.indexOf("featured") + 1,
          rowCount,
          1
        )
        .clearDataValidations();
    }

    if (wishes.length > 0) {
      sheet
        .getRange(2, 1, wishes.length, width)
        .setValues(wishes);

      applyWishValidationRules_(sheet, 2, wishes.length);

      sheet
        .getRange(2, 2, wishes.length, 1)
        .setNumberFormat("yyyy-mm-dd hh:mm:ss");

      sheet
        .getRange(2, 7, wishes.length, 1)
        .setNumberFormat("yyyy-mm-dd hh:mm:ss");
    }

    clearWeddingWishesCache();
    SpreadsheetApp.flush();

    const result = {
      message:
        "Đã dồn các lời chúc thật lên đầu bảng và xóa FALSE ở hàng trống.",
      wishesCount: wishes.length,
      firstDataRow: wishes.length ? 2 : null,
      lastDataRow: wishes.length ? wishes.length + 1 : null,
      nextWishRow: wishes.length + 2,
      spreadsheetUrl: spreadsheet.getUrl(),
      sheetName: sheet.getName(),
    };

    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}


function isWishDataRow_(row) {
  return Boolean(
    String(row[0] || "").trim() ||
    String(row[2] || "").trim() ||
    String(row[4] || "").trim()
  );
}


function findLastWishDataRow_(sheet) {
  const upperRow = sheet.getLastRow();

  if (upperRow < 2) {
    return 1;
  }

  const values = sheet
    .getRange(2, 1, upperRow - 1, 5)
    .getDisplayValues();

  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (isWishDataRow_(values[index])) {
      return index + 2;
    }
  }

  return 1;
}


/**
 * Tìm hàng đầu tiên không có id, displayName và message.
 * Vì bỏ qua cột featured, các giá trị FALSE cũ không thể đẩy hàng mới xuống 1001.
 */
function findNextWishRow_(sheet) {
  const maxRows = sheet.getMaxRows();

  if (maxRows < 2) {
    sheet.insertRowsAfter(1, 100);
    return 2;
  }

  const values = sheet
    .getRange(2, 1, maxRows - 1, 5)
    .getDisplayValues();

  const firstEmptyIndex = values.findIndex(
    (row) => !isWishDataRow_(row)
  );

  if (firstEmptyIndex >= 0) {
    return firstEmptyIndex + 2;
  }

  sheet.insertRowsAfter(maxRows, 100);
  return maxRows + 1;
}


function buildWishValidationRules_() {
  const statusRule = SpreadsheetApp
    .newDataValidation()
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

  /*
   * checked = TRUE; unchecked = ô trống.
   * setDataValidation() chỉ đặt quy tắc, không ghi FALSE vào hàng trống.
   */
  const featuredRule = SpreadsheetApp
    .newDataValidation()
    .requireCheckbox(true)
    .setAllowInvalid(false)
    .build();

  return {
    statusRule,
    featuredRule,
  };
}


function applyWishValidationRules_(sheet, startRow, rowCount) {
  if (rowCount <= 0) return;

  const rules = buildWishValidationRules_();

  sheet
    .getRange(
      startRow,
      WISHES_HEADERS.indexOf("status") + 1,
      rowCount,
      1
    )
    .setDataValidation(rules.statusRule);

  sheet
    .getRange(
      startRow,
      WISHES_HEADERS.indexOf("featured") + 1,
      rowCount,
      1
    )
    .setDataValidation(rules.featuredRule);
}


function ensureWishesSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(WISHES_APP.sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(WISHES_APP.sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet
      .getRange(1, 1, 1, WISHES_HEADERS.length)
      .setValues([[...WISHES_HEADERS]]);
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

  /*
   * Chỉ đặt validation cho hàng có dữ liệu thật.
   * Tuyệt đối không gọi insertCheckboxes() trên toàn bộ 999 hàng trống.
   */
  const lastWishDataRow = findLastWishDataRow_(sheet);
  if (lastWishDataRow >= 2) {
    applyWishValidationRules_(
      sheet,
      2,
      lastWishDataRow - 1
    );
  }

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

  // HtmlService chạy trong IFRAME sandbox của Google. Khi response được nạp
  // vào iframe target trên website, window.parent có thể là iframe wrapper
  // googleusercontent trung gian; window.top mới là trang GitHub Pages.

  return HtmlService
    .createHtmlOutput(
      [
        "<!doctype html>",
        '<html lang="vi"><head><meta charset="utf-8"></head><body>',
        "<script>",
        `window.top.postMessage(${json}, ${targetOrigin});`,
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
