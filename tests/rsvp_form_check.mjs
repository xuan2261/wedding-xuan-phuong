import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const index = read("index.html");
const app = read("app.js");
const config = read("config.js");
const wishesScript = read("tools/wedding-wishes-webapp.gs");
const rsvpScript = read("tools/wedding-rsvp-webapp.gs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Biểu mẫu nằm ngay trên thiệp, không phải iframe Google Form.
assert(index.includes('id="rsvpForm"'), "Thiếu biểu mẫu xác nhận trên thiệp");
assert(
  /id="rsvpForm"[^>]*method="post"[^>]*target="rsvpSubmitFrame"/.test(index),
  "Biểu mẫu phải POST vào iframe ẩn để tránh CORS"
);
assert(index.includes('id="rsvpSubmitFrame"'), "Thiếu iframe nhận kết quả gửi");
assert(index.includes('name="form" value="rsvp"'), "Thiếu cờ định tuyến form=rsvp");

// Hai câu hỏi chọn một đứng cạnh nhau bắt buộc phải có nhãn nhóm, nếu không cả
// khách lẫn trình đọc màn hình đều hiểu nhầm thành một danh sách duy nhất.
const legends = index.match(/<legend>/g) || [];
assert(legends.length >= 2, `Thiếu nhãn nhóm cho các câu hỏi chọn một: ${legends.length}`);
assert(index.includes('id="rsvpWebsite"'), "Thiếu honeypot chống bot");

// Trường bắt buộc tối thiểu theo thoả thuận với gia đình.
["rsvpGuestName", "rsvpPartySize", "rsvpEventSelect", "rsvpMessage"].forEach((id) => {
  assert(index.includes(`id="${id}"`), `Thiếu trường ${id}`);
});

// Chưa dán URL /exec thì biểu mẫu phải tự ẩn, thiệp giữ nguyên nút liên hệ —
// không được hiện một biểu mẫu bấm vào là hỏng.
assert(app.includes("if (!settings.enabled || !apiUrl)"), "Biểu mẫu chưa tự ẩn khi thiếu apiUrl");
assert(app.includes("isTrustedAppsScriptOrigin"), "Thiếu kiểm tra origin của postMessage");
assert(
  app.includes('payload.type !== "wedding-rsvp-result-v1"'),
  "Thiếu kiểm tra loại thông điệp kết quả"
);
assert(
  app.includes("payload.ok && payload.stored === true"),
  "Chỉ được báo thành công khi Sheet đã ghi thật"
);
assert(app.includes("RSVP_CLIENT_KEY"), "RSVP phải dùng khoá lưu trữ riêng");
assert(
  app.includes("RSVP_SUBMITTED_AT_KEY") && !app.includes("rememberSubmission(WISH_SUBMITTED_AT_KEY);\n        setStatus"),
  "Cooldown RSVP không được dùng chung khoá với lời chúc"
);

const apiUrl = (config.match(/rsvpForm:[\s\S]*?apiUrl:\s*"([^"]*)"/) || [])[1];
assert(apiUrl !== undefined, "config.js thiếu khối rsvpForm");
assert(
  apiUrl === "" || /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(apiUrl),
  `apiUrl phải là URL /exec của Apps Script: ${apiUrl}`
);

// Dùng chung một project, một deployment và một Google Sheet với sổ lời chúc.
assert(
  wishesScript.includes('String(parameters.form || "") === "rsvp"') &&
    wishesScript.includes("handleWeddingRsvpPost(parameters)"),
  "doPost chưa định tuyến sang module RSVP"
);
assert(
  rsvpScript.includes("getWishesSpreadsheet_()"),
  "RSVP phải ghi vào đúng Google Sheet của sổ lời chúc"
);
assert(
  rsvpScript.includes('type: "wedding-rsvp-result-v1"'),
  "Apps Script phải trả đúng loại kết quả cho thiệp"
);
assert(rsvpScript.includes("LockService"), "Thiếu khoá chống ghi trùng dòng");

console.log("PASS: inline RSVP form and Google Sheet contract");
