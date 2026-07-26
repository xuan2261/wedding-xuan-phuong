from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER = "VISUAL OVERLAP HOTFIX V20.1"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8", newline="\n")


def replace_all_guest_wording() -> None:
    allowed_suffixes = {".html", ".js", ".py", ".md", ".json", ".yml", ".yaml"}
    excluded_parts = {".git", "dist", "reports", "node_modules"}

    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in allowed_suffixes:
            continue
        if any(part in excluded_parts for part in path.relative_to(ROOT).parts):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        updated = text.replace("Quý vị", "Quý khách")
        if updated != text:
            path.write_text(updated, encoding="utf-8", newline="\n")


def update_index() -> None:
    path = "index.html"
    text = read(path)
    text = text.replace('content="v19.4-20260724"', 'content="v20.1-20260726"')
    text = text.replace('styles.css?v=5.5', 'styles.css?v=5.6')
    text = text.replace('assets/css/wedding-motion.css?v=1.3', 'assets/css/wedding-motion.css?v=1.4')
    text = text.replace('config.js?v=5.5', 'config.js?v=5.6')
    text = text.replace('app.js?v=5.5', 'app.js?v=5.6')

    text = re.sub(
        r'\n\s*<div class="invitation-cover__seam" aria-hidden="true"></div>\s*',
        "\n",
        text,
        count=1,
    )
    text = re.sub(
        r'\n\s*<button\s+class="invitation-cover__simple"\s+id="coverSimpleButton"\s+type="button"\s*>\s*Xem thiệp đơn giản\s*</button>\s*',
        "\n",
        text,
        count=1,
        flags=re.S,
    )
    text = text.replace("Chạm vào con dấu để mở thiệp.", "Chạm con dấu để mở thiệp")
    write(path, text)


def update_config() -> None:
    path = "config.js"
    text = read(path)
    text = text.replace('buildId: "v19.4-20260724"', 'buildId: "v20.1-20260726"')
    text = text.replace('release: "v19.4"', 'release: "v20.1"')
    text = text.replace(
        'status: "release-candidate-share-story-hardening"',
        'status: "visual-safe-zones-and-cover-refinement"',
    )
    text = text.replace("simpleModeEnabled: true", "simpleModeEnabled: false")
    write(path, text)


def update_app() -> None:
    path = "app.js"
    text = read(path)
    text = text.replace('    const simpleButton = $("#coverSimpleButton");\n', "")
    text = text.replace(
        '    simpleButton?.addEventListener("click", () => openInvitation({ simpleMode: true }));\n'
        '    if (simpleButton && settings.simpleModeEnabled === false) simpleButton.hidden = true;\n',
        "",
    )
    text = text.replace("-1280.webp?v=16", "-1280.webp?v=20")
    write(path, text)


def update_styles() -> None:
    path = "styles.css"
    text = read(path)
    if MARKER in text:
        return

    override = r'''

/* ========================================================================
   VISUAL OVERLAP HOTFIX V20.1
   Safe text zones for portrait photography + refined cinematic cover.
   ======================================================================== */

.hero-names:focus {
  outline: 0;
}

.hero__shade {
  background:
    linear-gradient(
      to bottom,
      rgba(6, 21, 14, .78) 0%,
      rgba(6, 21, 14, .56) 22%,
      rgba(6, 21, 14, .12) 43%,
      rgba(6, 21, 14, .08) 66%,
      rgba(6, 21, 14, .76) 100%
    ),
    linear-gradient(
      90deg,
      rgba(6, 21, 14, .16) 0%,
      transparent 32%,
      transparent 68%,
      rgba(6, 21, 14, .16) 100%
    );
}

.hero-names {
  top: clamp(88px, 10.5svh, 112px);
  right: clamp(24px, 6vw, 52px);
  left: clamp(24px, 6vw, 52px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  text-align: center;
  filter: drop-shadow(0 3px 14px rgba(0, 0, 0, .58));
}

.hero-name {
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  gap: .18em;
  font-size: clamp(2.35rem, 7.8vw, 4.15rem);
  line-height: .9;
  text-align: center;
}

.hero-name--groom,
.hero-name--bride {
  justify-self: auto;
  --layout-transform: translate3d(0, 0, 0);
  transform: var(--layout-transform);
  align-items: baseline;
}

.hero-names__amp {
  align-self: center;
  margin: -.02em 0 -.08em;
  color: #f3d49b;
  font-size: clamp(1.05rem, 3vw, 1.45rem);
  line-height: 1;
}

.closing {
  place-items: start center;
}

.closing::after {
  background:
    linear-gradient(
      to bottom,
      rgba(8, 30, 20, .68) 0%,
      rgba(8, 30, 20, .34) 27%,
      rgba(8, 30, 20, .04) 54%,
      rgba(8, 30, 20, .38) 100%
    );
}

.closing__content {
  width: min(92%, 620px);
  margin-top: clamp(58px, 8.5svh, 96px);
  padding: 18px 22px 20px;
  border: 1px solid rgba(255, 245, 214, .26);
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(10, 35, 24, .48), rgba(10, 35, 24, .18));
  box-shadow: 0 16px 42px rgba(0, 0, 0, .16);
  backdrop-filter: blur(2px);
  text-shadow: 0 2px 16px rgba(0, 0, 0, .62);
}

.closing__content p {
  font-size: clamp(2.7rem, 9vw, 4.8rem);
  line-height: .98;
}

.closing__content h2 {
  margin-top: 8px;
  font-size: clamp(1.05rem, 3.5vw, 1.55rem);
  line-height: 1.35;
}

.invitation-cover__seam,
.invitation-cover__simple {
  display: none !important;
}

.invitation-cover__stage {
  background:
    radial-gradient(circle at 50% 38%, rgba(207, 171, 104, .13), transparent 25rem),
    var(--green-950);
}

.invitation-cover__panel {
  width: 50.05%;
  background:
    radial-gradient(circle at 16% 12%, rgba(255, 255, 255, .06), transparent 23%),
    radial-gradient(circle at 82% 78%, rgba(209, 174, 105, .055), transparent 30%),
    linear-gradient(150deg, #35684b, #214b3a 54%, #143226);
  box-shadow: inset 0 0 86px rgba(0, 0, 0, .16);
}

.invitation-cover__panel--left {
  box-shadow:
    inset -20px 0 28px -28px rgba(0, 0, 0, .62),
    inset 0 0 86px rgba(0, 0, 0, .16);
}

.invitation-cover__panel--right {
  box-shadow:
    inset 20px 0 28px -28px rgba(0, 0, 0, .62),
    inset 0 0 86px rgba(0, 0, 0, .16);
}

.invitation-cover__panel::before {
  inset: 18px;
  border-color: rgba(246, 232, 196, .24);
  border-radius: 2px;
}

.invitation-cover__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(9px, 2svh, 18px);
  isolation: isolate;
}

.invitation-cover__content::before {
  content: "";
  position: absolute;
  z-index: -1;
  top: 18%;
  left: 50%;
  width: min(86vw, 590px);
  height: 54%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(5, 22, 15, .24), transparent 70%);
  pointer-events: none;
}

.invitation-cover__eyebrow {
  color: #f7e4b7;
  font-size: clamp(1.85rem, 5.8vw, 2.75rem);
  text-shadow: 0 3px 22px rgba(0, 0, 0, .38);
}

.invitation-cover__guest {
  letter-spacing: .12em;
}

.invitation-cover__names {
  margin-block: clamp(10px, 2svh, 22px);
  font-size: clamp(2.2rem, 9vw, 4.8rem);
  line-height: .94;
  text-shadow: 0 4px 24px rgba(0, 0, 0, .3);
}

.invitation-cover__event {
  position: relative;
  padding-inline: 34px;
}

.invitation-cover__event::before,
.invitation-cover__event::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 22px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(247, 228, 183, .72));
}

.invitation-cover__event::before {
  left: 0;
}

.invitation-cover__event::after {
  right: 0;
  transform: rotate(180deg);
}

.invitation-cover__actions {
  gap: 0;
  margin-top: 4px;
}

.invitation-cover__seal {
  border-color: rgba(255, 236, 190, .84);
  box-shadow:
    0 16px 38px rgba(0, 0, 0, .3),
    0 0 0 7px rgba(255, 238, 195, .08),
    inset 0 0 0 4px rgba(255, 235, 188, .15),
    inset 0 0 0 7px rgba(70, 36, 18, .18);
}

.invitation-cover__seal-label {
  top: calc(100% + 12px);
}

.invitation-cover__autoplay {
  margin-top: 24px;
}

@media (max-width: 460px) {
  .hero-names {
    top: clamp(84px, 10svh, 102px);
    right: 18px;
    left: 18px;
  }

  .hero-name {
    font-size: clamp(2.25rem, 10.7vw, 3.05rem);
  }

  .closing__content {
    width: calc(100% - 36px);
    margin-top: clamp(48px, 7svh, 76px);
    padding: 15px 16px 17px;
  }
}

@media (orientation: landscape) and (max-height: 520px) {
  .hero-names {
    top: 50px;
    flex-direction: row;
    justify-content: center;
    gap: .35em;
  }

  .hero-name {
    font-size: clamp(1.75rem, 4.7vw, 2.55rem);
  }

  .hero-names__amp {
    margin: 0;
  }

  .closing__content {
    margin-top: 24px;
  }

  .invitation-cover__content {
    display: grid;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-name--groom,
  .hero-name--bride {
    transform: none !important;
  }
}
'''
    write(path, text.rstrip() + override + "\n")


def cleanup_one_off_files() -> None:
    for relative in (
        "tools/apply_visual_overlap_v20_1.py",
        ".github/workflows/apply-visual-overlap-v20-1.yml",
    ):
        path = ROOT / relative
        if path.exists():
            path.unlink()


def run_checks_and_build() -> None:
    subprocess.run([sys.executable, "tools/build-dist.py"], cwd=ROOT, check=True)
    subprocess.run(["node", "--check", "app.js"], cwd=ROOT, check=True)
    subprocess.run(["node", "--check", "config.js"], cwd=ROOT, check=True)
    subprocess.run(["node", "--check", "guest-utils.js"], cwd=ROOT, check=True)
    subprocess.run([sys.executable, "tests/verify_assets.py"], cwd=ROOT, check=True)
    subprocess.run([sys.executable, "tests/share_entry_pages_check.py"], cwd=ROOT, check=True)
    subprocess.run([sys.executable, "tests/verify_dist.py"], cwd=ROOT, check=True)


def main() -> None:
    replace_all_guest_wording()
    update_index()
    update_config()
    update_app()
    update_styles()
    run_checks_and_build()
    cleanup_one_off_files()
    print("PASS: visual safe zones, refined cover, Quý khách wording and clean dist applied")


if __name__ == "__main__":
    main()
