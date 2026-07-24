# Live external status — v18.1

## Google Form

Public responder form is reachable, but at audit time still displays:

- Guest time: 08h00
- Venue: Nhà hàng XXX
- Address without 346 Nguyễn Huệ
- RSVP deadline: 20/07/2026

Run `updateWeddingRsvpContactInfo()` from `tools/update-google-forms-rsvp-contact.gs`, then run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/check-live-rsvp.ps1
```

## GitHub Pages

Public site is still an older release and displays 08h00 and RSVP 24.07.2026. Deploy v18.1 and run `tools/check-live-build.ps1`.
