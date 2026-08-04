import fs from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const index = fs.readFileSync("index.html", "utf8");
const config = fs.readFileSync("config.js", "utf8");
const runtime = fs.readFileSync("wedding-film.js", "utf8");
const css = fs.readFileSync("assets/css/wedding-film.css", "utf8");
const data = JSON.parse(fs.readFileSync("tools/wedding-data.json", "utf8"));

assert(index.includes('id="wedding-film"'), "Thiếu section Wedding Film");
assert(index.includes('id="weddingFilmDialog"'), "Thiếu dialog Wedding Film");
assert(index.includes('loading="lazy"'), "Poster Wedding Film phải lazy-load");
assert(index.includes("https://www.youtube-nocookie.com"), "CSP chưa cho phép YouTube privacy-enhanced iframe");
assert(!/<iframe[^>]+youtube/i.test(index), "Không được có YouTube iframe trong HTML initial");
assert(config.includes('provider: "youtube"'), "Provider Wedding Film phải là YouTube");
assert(config.includes('videoId: "9kv5T3W9fxo"'), "Sai YouTube video ID");
assert(config.includes('weddingFilm: Object.freeze(SOURCE.weddingFilm)'), "Wedding Film chưa export vào runtime config");
assert(data.weddingFilm?.videoId === "9kv5T3W9fxo", "wedding-data chưa đồng bộ video ID");
assert(runtime.includes("https://www.youtube-nocookie.com"), "Runtime chưa dùng Privacy Enhanced Mode");
assert(runtime.includes('referrerPolicy = "strict-origin-when-cross-origin"'), "Iframe YouTube phải gửi origin referrer để tránh lỗi 153");
assert(runtime.includes("audio.pause()"), "Wedding Film chưa pause nhạc nền");
assert(runtime.includes("audio.play()"), "Wedding Film chưa restore nhạc nền");
assert(runtime.includes("playerHost.replaceChildren"), "Wedding Film chưa unload player khi đóng");
assert(css.includes("aspect-ratio: 16 / 9"), "Player phải giữ tỷ lệ 16:9");

console.log("PASS: YouTube Wedding Film static contract");
