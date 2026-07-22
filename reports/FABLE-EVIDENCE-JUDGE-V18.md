# Fable Evidence Judge — v18

## Proven locally

- Source ZIP v17 input integrity passed before extraction.
- RSVP and map iframe have no initial `src`.
- Browser smoke observes zero initial Form/Map/Wishes requests.
- First RSVP click produces one Form request with `embedded=true`.
- First Map click produces one Map request.
- Reopening RSVP does not create a second request.
- Audio remains paused at initial load and has two sources.
- Google Forms helper scripts use 10h00, 28/07/2026 and full address.
- Static, contract, consistency, assets/QR and syntax gates pass.

## Not proven

- Live Google Form allows all intended guests without sign-in.
- Google Form completion can be detected by the parent page; cross-origin rules prevent that.
- Map iframe resolves to the exact family pin on every device.
- Remote Pancake audio remains permanently available.
- GitHub Pages serves this exact build.
- Apps Script backend 1.5.0 is live.

## Verdict

```text
ACCEPT SOURCE V18 RELEASE CANDIDATE
REQUIRE INCOGNITO FORM CHECK
REQUIRE MAP PIN VISUAL CHECK
REQUIRE LIVE DEPLOYMENT AND E2E
```
