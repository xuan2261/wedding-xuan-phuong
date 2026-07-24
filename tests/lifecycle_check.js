const fs = require("node:fs");
const path = require("node:path");

const config = fs.readFileSync(path.join(__dirname, "..", "config.js"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const closeFields = config.match(/rsvpClosesAt:\s*"/g) || [];
const dayEndFields = config.match(/weddingDayEndsAt:\s*"2026-(?:07|08)-/g) || [];

assert(closeFields.length === 4, `Phải có lifecycle riêng cho 4 sự kiện: ${closeFields.length}`);
assert(dayEndFields.length === 4, `Phải có ngày kết thúc riêng cho 4 sự kiện: ${dayEndFields.length}`);
assert(!config.includes('rsvpClosesAt: "2026-07-29T00:00:00+07:00"'), "Không được dùng global RSVP close cũ");
assert(app.includes("document.body.dataset.weddingPhase = phase"), "Thiếu wedding phase");
assert(app.includes("rsvpButton.hidden = true"), "Thiếu auto close RSVP");
assert(app.includes("grid.hidden = true"), "Thiếu lifecycle countdown state");

console.log("PASS: multi-event lifecycle contract");
