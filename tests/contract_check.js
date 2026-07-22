const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

function acceptsSuccess(payload) {
  return Boolean(payload && payload.ok && payload.stored === true);
}

const cases = [
  [{ ok: true, stored: true }, true],
  [{ ok: true, stored: false }, false],
  [{ ok: true }, false],
  [{ ok: false, stored: true }, false],
  [null, false]
];

for (const [payload, expected] of cases) {
  const actual = acceptsSuccess(payload);
  if (actual !== expected) {
    throw new Error(`Contract mismatch for ${JSON.stringify(payload)}`);
  }
}

if (!app.includes("payload.ok && payload.stored === true")) {
  throw new Error("app.js does not enforce stored === true");
}

console.log("PASS: wishes storage contract");
