# Wedding Xuân & Phượng v19.0 — Multi-Event Implementation

**Build:** `v19.0-20260723`  
**Verdict:** `PASS_DRAFT_MULTI_EVENT_RELEASE_CANDIDATE`  
**Ready to send guests:** **No — pending RSVP, Maps and segmentation data**

## Implemented events

| Event | Date | Timeline | Venue | Runtime status |
|---|---|---|---|---|
| Nhà gái | 29/07/2026 | 09h00 · 09h30 · 10h00 | Tư gia nhà gái | Confirmed partial |
| Nhà trai | 30/07/2026 | 08h30 · 10h00 | Tư gia nhà trai | Confirmed partial |
| Báo Hỷ Nha Trang | 15/08/2026 | 17h00 · 18h00 | Nhà hàng Nha Trang | Draft |
| Báo Hỷ Sài Gòn | 22/08/2026 | 17h00 · 18h00 | Nhà hàng hải sản Seasan | Draft |

## URL model

```text
#to=Gia%20đình%20cô%20Lan&event=bride
#to=Anh%20Minh&event=groom
#to=Chị%20Hương&event=nhatrang
#to=Nhóm%20bạn&events=nhatrang,saigon&event=nhatrang
```

Old links containing only `#to=...` continue to use `groom`.

## Safety gates

- The old one-event Google Form is not opened from v19.
- RSVP remains visibly pending until the new Form is created.
- Nha Trang/Sài Gòn map actions are hidden because the supplied link duplicates the bride link.
- Bride Maps opens externally only; embedded map is disabled until verified.
- End times and RSVP deadlines remain empty instead of being guessed.

## Test result

```text
Static/contract/syntax checks   14/14 PASS
Inline Chromium event cases     5/5 PASS
Clean dist                       PASS
Image and QR decode              PASS
```

## Required next actions

1. Run `tools/create-google-forms-rsvp-multi-event.gs`.
2. Paste `prefilledUrls` and `guestNameEntry` into each event profile.
3. Confirm deadline, end time, Nha Trang/Sài Gòn venue and Maps data.
4. Complete guest grouping using `tools/create-guest-links.html`.
5. Test the live site and submit RSVP on Android, iPhone, Zalo and Messenger.
