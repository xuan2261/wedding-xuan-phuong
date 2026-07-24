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
assert.equal(groom.gifts.length, 1);

const bride = load("#to=Gia%20đình%20cô%20Lan&event=bride");
assert.equal(bride.event.id, "bride");
assert.equal(bride.event.timeline.length, 3);
assert.equal(bride.gifts[0].id, "bride");

const nhaTrang = load("#event=nhatrang");
assert.equal(nhaTrang.event.dateDisplay, "15.08.2026");
assert.equal(nhaTrang.event.mapsUrl, "");
assert.equal(nhaTrang.gifts.length, 2);
assert.equal(nhaTrang.sharing.title, "Tiệc Báo Hỷ Nha Trang · Thanh Xuân & Thị Phượng");

const multi = load("#events=bride,groom&event=bride");
assert.deepEqual([...multi.eventContext.invitedEventIds], ["bride", "groom"]);
assert.equal(multi.eventContext.activeEventId, "bride");

const invalid = load("#events=unknown&event=unknown");
assert.equal(invalid.event.id, "groom");
console.log("PASS: multi-event config resolution");
