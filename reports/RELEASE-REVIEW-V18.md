# Release review v18

## Verdict

```text
PASS_RELEASE_CANDIDATE
```

## Implemented

- Lazy Google Forms RSVP dialog.
- Full-screen RSVP fallback link.
- Lazy Google Maps dialog.
- Local motion CSS with reduced-motion.
- Google Fonts retained.
- Local Váy Cưới MP3 plus Pancake fallback.
- RSVP script data synchronized.
- Single-source consistency test.
- Privacy-safe general share by default.

## External gates

- Google Form responder access and iframe behavior must be checked in incognito.
- `guestNameEntry` is not known yet, so prefill is not active.
- Exact embedded map result must be visually checked against the family's pin.
- GitHub Pages and Apps Script live deployment are not performed in this build.
