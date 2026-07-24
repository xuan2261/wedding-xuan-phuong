from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "tools/create-guest-links.html").read_text(encoding="utf-8")
template = ROOT / "tools/guest-list-template.csv"
required = [
    'id="guestCsvFile"',
    'id="downloadTemplateButton"',
    'const parseCsv =',
    'const importGuestCsv =',
    'invitationCode',
    'maxGuestCount',
]
missing = [token for token in required if token not in html]
if missing or not template.exists():
    print("FAIL: guest link CSV tool", missing)
    raise SystemExit(1)
print("PASS: guest link CSV import/export tool")
