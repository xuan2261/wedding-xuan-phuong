const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "guest-utils.js"), "utf8");

const sandbox = {
  window: {
    location: {
      href: "https://example.test/wedding/",
      hash: "",
      search: ""
    }
  },
  URL,
  URLSearchParams
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const utils = sandbox.window.WEDDING_GUEST_UTILS;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  utils.sanitizeGuestName("  Gia   đình cô Lan  ") === "Gia đình cô Lan",
  "sanitize whitespace failed"
);
assert(
  utils.sanitizeGuestName("<b>Lan</b>").includes("<b>"),
  "sanitize must preserve plain characters; DOM uses textContent for safety"
);

const guest = utils.readGuestName(
  {
    hash: "#to=Gia%20%C4%91%C3%ACnh%20c%C3%B4%20Lan",
    search: ""
  },
  { parameter: "to", maxLength: 80 }
);
assert(guest === "Gia đình cô Lan", `read guest failed: ${guest}`);

const personalized = utils.buildPersonalizedUrl(
  "https://example.test/wedding/",
  "Anh Minh",
  "to"
);
assert(personalized.endsWith("#to=Anh+Minh"), personalized);

const rsvp = utils.buildRsvpUrl(
  "https://docs.google.com/forms/d/e/example/viewform",
  "Anh Minh",
  "entry.123456"
);
assert(rsvp.includes("entry.123456=Anh+Minh"), rsvp);

const noEntry = utils.buildRsvpUrl(
  "https://docs.google.com/forms/d/e/example/viewform",
  "Anh Minh",
  ""
);
assert(!noEntry.includes("entry."), noEntry);

console.log("PASS: personalization utilities");
