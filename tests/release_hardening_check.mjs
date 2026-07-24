import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const config = readFileSync(new URL("../config.js", import.meta.url), "utf8");

const checks = [
  ["adaptive data state", app.includes("getAdaptiveDataState") && app.includes("dataMode")],
  ["constrained story preload", app.includes("constrainedPreloadImageLimit")],
  ["constrained music", app.includes("data-saver-blocked")],
  ["focus after cover", app.includes("focusTarget.focus({ preventScroll: true })")],
  ["contact fallback setup", app.includes("setupAttendanceContactDialog")],
  ["contact dialog DOM", index.includes('id="attendanceContactDialog"')],
  ["cover data hint", index.includes('id="coverDataHint"')],
  ["hero focus target", index.includes('id="hero-title" tabindex="-1"')],
  ["cover overflow hardening", styles.includes("overscroll-behavior: contain")],
  ["adaptive config", config.includes("disableAutoStoryOnConstrainedNetwork")]
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failures.length) {
  console.error("FAIL: v19.4 release hardening", failures);
  process.exit(1);
}
console.log("PASS: v19.4 adaptive, contact and focus hardening");
