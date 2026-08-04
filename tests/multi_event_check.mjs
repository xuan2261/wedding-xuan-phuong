import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

function load(hash) {
  const code = fs.readFileSync("config.js", "utf8");
  const context = {
    window: { location: { hash } },
    URLSearchParams,
    Object,
    console
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window.WEDDING_CONFIG;
}

const groom = load("");
assert.equal(groom.event.id, "groom");
assert.equal(groom.event.dateDisplay, "30.07.2026");
// Tiệc nhà trai và nhà gái vẫn hiện cả hai tài khoản.
assert.equal(groom.gifts.length, 2);
assert.equal([...groom.gifts].map((gift) => gift.id).join(","), "groom,bride");

const bride = load("#to=Gia%20đình%20cô%20Lan&event=bride");
assert.equal(bride.event.id, "bride");
assert.equal(bride.event.timeline.length, 3);
assert.equal(bride.gifts.length, 2);
assert.equal([...bride.gifts].map((gift) => gift.id).join(","), "groom,bride");
assert.equal(bride.gifts[0].buttonLabel, "Quà mừng cưới chú rể");
assert.equal(bride.gifts[1].buttonLabel, "Quà mừng cưới cô dâu");

const nhaTrang = load("#event=nhatrang");
assert.equal(nhaTrang.event.dateDisplay, "15.08.2026");
// Gia đình đã chốt địa điểm và xác minh điểm ghim, nên map Nha Trang đã bật.
assert.ok(nhaTrang.event.mapsUrl.startsWith("https://maps.app.goo.gl/"), "Nha Trang thiếu link map");
assert.equal(nhaTrang.event.mapsVerified, true);
assert.ok(nhaTrang.event.venueName.includes("Xavia"), "Sai địa điểm Nha Trang");
assert.equal(nhaTrang.gifts.length, 1);
assert.equal(nhaTrang.gifts[0].id, "groom");
assert.equal(nhaTrang.gifts[0].buttonLabel, "Quà mừng cưới chú rể");
assert.equal(nhaTrang.sharing.title, "Tiệc Báo Hỷ Nha Trang · Thanh Xuân & Thị Phượng");

const saiGon = load("#event=saigon");
assert.equal(saiGon.event.venueName, "Sảnh Lorien, Sesan Restaurant");
assert.equal(saiGon.event.addressLine1, "14-15-16 Einstein");
assert.equal(saiGon.gifts.length, 1);
assert.equal(saiGon.gifts[0].id, "bride");
assert.equal(saiGon.gifts[0].buttonLabel, "Quà mừng cưới cô dâu");

const multi = load("#events=bride,groom&event=bride");
assert.deepEqual([...multi.eventContext.invitedEventIds], ["bride", "groom"]);
assert.equal(multi.eventContext.activeEventId, "bride");

const invalid = load("#events=unknown&event=unknown");
assert.equal(invalid.event.id, "groom");
console.log("PASS: multi-event config resolution");
