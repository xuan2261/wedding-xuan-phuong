# Fable Evidence Judge — v17

## Proven

- Source contains build marker v17-20260722.
- Static, contract, personalization and syntax checks pass.
- Images and both QR codes decode.
- Five viewport browser harness passes.
- Personalized name is rendered as text and fallback exists.
- No initial audio playback.
- Wishes remain lazy-loaded.
- Cache TTL is within 21600 seconds and cache failure is non-fatal after storage.
- Lightbox navigation and counter work in harness.
- ICS has two events at 08h30 and 10h00.

## Not proven

- GitHub Pages live is serving v17.
- Apps Script deployment 1.5.0 is active.
- Real Google Forms prefill, because `guestNameEntry` is not supplied.
- Live submit → pending → approve → display.
- Native share sheet on physical devices.
- Apple/Google/Outlook calendar behavior on physical devices.
- Physical iOS Safari and Android Chrome.

## Judge result

```text
ACCEPT SOURCE V17 RELEASE CANDIDATE
REQUIRE DEPLOYMENT AND LIVE E2E
DO NOT CLAIM OPTIONAL FAMILY/PREFILL DATA IS COMPLETE
```
