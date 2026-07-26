/**
 * Chạy thẳng logic của tools/wedding-rsvp-webapp.gs trong Node với một Google
 * Sheet giả lập.
 *
 * Hai quyết định được kiểm ở đây đều ảnh hưởng tới con số gia đình đặt cỗ:
 * lần gửi nào bị coi là bấm đúp, và câu trả lời nào được tính khi khách đổi ý.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "tools", "wedding-rsvp-webapp.gs"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createSheet(rows, headerCount) {
  const grid = rows.map((row) => row.slice());
  return {
    name: "",
    getLastRow: () => grid.length + 1,
    getRange(startRow, startColumn, numRows, numColumns) {
      return {
        getValues: () =>
          grid
            .slice(startRow - 2, startRow - 2 + numRows)
            .map((row) => row.slice(startColumn - 1, startColumn - 1 + numColumns)),
        setValues: (values) => {
          values.forEach((row, index) => {
            grid[startRow - 2 + index] = row.slice();
          });
          return { setFontWeight: () => {} };
        },
        setFontWeight: () => ({}),
      };
    },
    appendRow: (row) => grid.push(row.slice()),
    clear: () => grid.splice(0, grid.length),
    setFrozenRows: () => {},
    setColumnWidth: () => {},
    rows: grid,
    headerCount,
  };
}

// Chỉ nạp phần khai báo hàm; các API Google được thay bằng bản giả tối thiểu.
const context = {
  Logger: { log: () => {} },
  SpreadsheetApp: { flush: () => {} },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => "fake-id" }) },
  console,
  Date,
  Number,
  String,
  Math,
  Object,
  JSON,
};
vm.createContext(context);
// Khai báo const trong file .gs nằm ở phạm vi từ vựng của script chứ không lên
// đối tượng global, nên phải bắc cầu ra ngoài mới đọc được từ Node.
vm.runInContext(
  `${source}
;globalThis.__exported = { RSVP_APP, RSVP_HEADERS, RSVP_ATTENDING };`,
  context
);

const { RSVP_APP, RSVP_HEADERS, RSVP_ATTENDING } = context.__exported;
const { isRepeatedRsvp_ } = context;
assert(typeof isRepeatedRsvp_ === "function", "Không nạp được isRepeatedRsvp_");

const now = new Date("2026-07-27T10:00:00+07:00");
const minutesAgo = (minutes) => new Date(now.getTime() - minutes * 60000);

const baseAnswer = {
  clientKey: "client-abc-123456",
  guestName: "Anh Minh",
  attending: RSVP_ATTENDING.yes,
  partySize: 2,
  guestOf: "Chú rể",
  eventLabel: "Lễ và tiệc nhà trai 30/07",
  message: "Chúc mừng hai bạn",
};

const rowFrom = (answer, when) => [
  when,
  answer.guestName,
  answer.attending,
  answer.partySize,
  answer.guestOf,
  answer.eventLabel,
  answer.message,
  "https://example.test/",
  answer.clientKey,
  "request-id",
];

// 1. Bấm đúp: y hệt, cách một phút -> bỏ qua, giữ một dòng.
assert(
  isRepeatedRsvp_(createSheet([rowFrom(baseAnswer, minutesAgo(1))], RSVP_HEADERS.length), baseAnswer, now),
  "Gửi lại y hệt trong vòng cửa sổ phải bị coi là bấm đúp"
);

// 2. Đổi ý trong vòng cửa sổ -> PHẢI ghi dòng mới. Đây là lỗi cũ: lần gửi sau bị
//    nuốt trong im lặng mà thiệp vẫn báo thành công.
const changes = [
  ["đổi sang không tham dự", { attending: RSVP_ATTENDING.no, partySize: 0 }],
  ["đổi số người", { partySize: 4 }],
  ["đổi bên mời", { guestOf: "Cô dâu" }],
  ["đổi sự kiện", { eventLabel: "Tiệc nhà gái 29/07" }],
  ["đổi lời nhắn", { message: "Bọn mình sẽ tới sớm" }],
];
for (const [label, change] of changes) {
  const updated = { ...baseAnswer, ...change };
  assert(
    !isRepeatedRsvp_(createSheet([rowFrom(baseAnswer, minutesAgo(1))], RSVP_HEADERS.length), updated, now),
    `Khách ${label} thì phải được ghi thành dòng mới`
  );
}

// 3. Y hệt nhưng đã quá cửa sổ chống trùng -> ghi dòng mới.
const outsideWindow = RSVP_APP.duplicateWindowSeconds / 60 + 1;
assert(
  !isRepeatedRsvp_(
    createSheet([rowFrom(baseAnswer, minutesAgo(outsideWindow))], RSVP_HEADERS.length),
    baseAnswer,
    now
  ),
  "Quá cửa sổ chống trùng thì phải ghi dòng mới"
);

// 4. Cùng máy nhưng khác người -> ghi bình thường (một nhà dùng chung điện thoại).
assert(
  !isRepeatedRsvp_(
    createSheet([rowFrom(baseAnswer, minutesAgo(1))], RSVP_HEADERS.length),
    { ...baseAnswer, guestName: "Chị Hương" },
    now
  ),
  "Cùng client key nhưng khác tên phải ghi được"
);

// 5. Tổng hợp: mỗi khách chỉ tính câu trả lời mới nhất.
const spreadsheet = (() => {
  const history = createSheet(
    [
      rowFrom({ ...baseAnswer, attending: RSVP_ATTENDING.yes, partySize: 2 }, minutesAgo(60)),
      rowFrom({ ...baseAnswer, attending: RSVP_ATTENDING.no, partySize: 0 }, minutesAgo(10)),
      rowFrom({ ...baseAnswer, guestName: "Chị Hương", partySize: 3 }, minutesAgo(30)),
    ],
    RSVP_HEADERS.length
  );
  const sheets = { [RSVP_APP.sheetName]: history };
  return {
    getSheetByName: (name) => sheets[name] || null,
    insertSheet: (name) => {
      sheets[name] = createSheet([], 8);
      return sheets[name];
    },
    getUrl: () => "https://example.test/sheet",
    sheets,
  };
})();

context.getWishesSpreadsheet_ = () => spreadsheet;
context.summarizeWeddingRsvp();

const summary = spreadsheet.sheets[RSVP_APP.summarySheetName];
assert(summary, "Thiếu tab tổng hợp");
assert(
  summary.rows.length === 2,
  `Tổng hợp phải có đúng một dòng mỗi khách: ${summary.rows.length}`
);

const minh = summary.rows.find((row) => row[1] === "Anh Minh");
assert(minh, "Thiếu dòng tổng hợp của Anh Minh");
assert(
  minh[2] === RSVP_ATTENDING.no && minh[3] === 0,
  `Tổng hợp phải lấy câu trả lời mới nhất: ${minh[2]} / ${minh[3]}`
);
assert(minh[7] === 2, `Phải đếm đúng số lần gửi: ${minh[7]}`);

console.log("PASS: RSVP dedup theo nội dung và tổng hợp theo câu trả lời mới nhất");
