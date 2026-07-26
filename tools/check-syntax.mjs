/**
 * Kiểm tra cú pháp các file JavaScript của website và các file Apps Script.
 *
 * Trước đây việc này nằm rải trong workflow dưới dạng vài dòng `node --check`
 * cộng một vòng lặp bash, nên chỉ chạy được trên CI Linux và không ai gọi được
 * ở máy. Gom vào đây để `npm test` và workflow dùng chung một đường.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeFiles = ["app.js", "config.js", "guest-utils.js", "event-entry.js"];
const scriptDir = path.join(root, "tools");
const appsScriptFiles = readdirSync(scriptDir)
  .filter((name) => name.endsWith(".gs"))
  .map((name) => path.join("tools", name));

// node --check suy ra kiểu module từ phần mở rộng, mà .gs thì nó không biết.
// Chép sang .js trong thư mục tạm rồi mới kiểm tra.
const staging = mkdtempSync(path.join(tmpdir(), "wedding-syntax-"));
const failures = [];

function check(relativePath) {
  const absolute = path.join(root, relativePath);
  let target = absolute;

  if (relativePath.endsWith(".gs")) {
    target = path.join(staging, `${path.basename(relativePath, ".gs")}.js`);
    copyFileSync(absolute, target);
  }

  try {
    execFileSync(process.execPath, ["--check", target], { stdio: "pipe" });
  } catch (error) {
    failures.push(`${relativePath}\n${String(error.stderr || error.message).trim()}`);
  }
}

try {
  [...runtimeFiles, ...appsScriptFiles].forEach(check);
} finally {
  rmSync(staging, { recursive: true, force: true });
}

if (failures.length) {
  console.error("FAIL: lỗi cú pháp\n" + failures.join("\n\n"));
  process.exit(1);
}

console.log(
  `PASS: cú pháp ${runtimeFiles.length} file website và ${appsScriptFiles.length} file Apps Script`
);
