# Wedding Xuân & Phượng — v19.3 Full Debug, Audit & Upgrade

**Build:** `v19.3-20260724`  
**Nguồn:** `v19.2.1`  
**Phán quyết:** `LOCAL_RELEASE_CANDIDATE_BLOCKED_BY_LIVE_DATA_AND_DEPLOYMENT`

## 13-skill chain

```text
integrity gate
→ requirements / multi-event audit
→ online wedding-invitation research
→ brainstorm
→ architecture and planning
→ visual / motion design review
→ mobile-first UI/UX
→ accessibility and privacy
→ code review
→ root-cause debug
→ fix/cook
→ static + Chromium regression test
→ optimization loop
→ Fable evidence judge
```

Báo cáo toàn vẹn đã tải lên xác nhận 13/13 archive skill giải nén thành công. Các archive không được đưa vào runtime; workflow của chúng được dùng làm phương pháp audit và triển khai.

## Fresh verdict

```text
STATIC / CONTRACT / SYNTAX      PASS
IMAGE / QR DECODE               PASS
HTML IDS / LOCAL REFERENCES     PASS
7-VIEWPORT CHROMIUM AUDIT       7/7 PASS
AUTO-STORY + IMAGE PREP         PASS
AUDIO VOLUME RANGE              PASS
EVENT SHARE ENTRY PAGES         4/4 PASS
CLEAN DIST                      PASS
LIVE GITHUB PAGES               STALE / NOT DEPLOYED
MULTI-EVENT RSVP                NOT CONFIGURED
FINAL MAP DATA                  INCOMPLETE
```

## Root causes found and fixed

### 1. Link preview did not truly belong to each event

The main app selected an event from the URL fragment and changed metadata at runtime. That is suitable for the interactive browser UI, but is not a dependable contract for external preview crawlers. V19.3 generates:

```text
events/bride/
events/groom/
events/nhatrang/
events/saigon/
```

Each page has static Open Graph/Twitter title, description, image, canonical URL and build marker, then redirects the guest—while preserving the guest name and invited-event list—to the main website.

### 2. Auto-story could reach a lazy image before it was ready

The browser Intervention message about lazy images is informational, but an automatic story can scroll faster than the browser fetches and decodes a lower section. V19.3 prepares up to four images in the current/next chapter:

```text
loading = eager
fetchPriority = high
await image.decode()
maximum wait = 700 ms
```

Failures and slow networks do not block navigation because the wait is bounded.

### 3. Audio fade still mixed two near-but-not-identical clocks

V19.2.1 clamped every volume value to `[0,1]`, which fixed the reported IndexSizeError. V19.3 additionally uses the timestamp from the first `requestAnimationFrame` callback as the fade origin, instead of comparing it with an independently sampled `performance.now()`.

### 4. Music continued when the invitation tab was hidden

Music now pauses on `visibilitychange` and `pagehide`. It does not automatically resume when the guest returns; the guest remains in control.

### 5. Story debug state collided with the live chapter selector

The body used `data-story-chapter` while the visible label also used `data-story-chapter`. This made generic selectors resolve to the body after story start. The debug attribute is now `data-story-chapter-index`; the actual chapter label has `aria-live="polite"` and `aria-atomic="true"`.

### 6. A successful deploy action did not prove the public URL was current

The GitHub workflow now checks, after deployment:

```text
root wedding-build marker
release.json build ID
4 static event entry pages
```

The local PowerShell and Python live-check tools perform the same verification.

## Upgrade inventory

- Static share previews for all four events.
- Share/copy buttons and offline guest-link tool use event entry URLs.
- `release.json` exposes the deployed build/event manifest.
- Guided story preloads and decodes next-scene imagery.
- Music pause on hidden tab and hardened rAF time origin.
- Accessible live chapter naming.
- Post-deploy smoke gate.
- New tests: story assets, share pages, event URL helper and lockfile parity.

## Fresh Chromium evidence

```text
320×568    PASS
360×800    PASS
390×844    PASS
430×932    PASS
568×320    PASS
768×1024   PASS
1440×900   PASS
```

Verified:

- no horizontal overflow;
- nine album images remain present;
- hero faces remain safe in portrait/landscape screenshots;
- no Form, Map or QR request at initial load;
- Story chapter reaches 4/8 automatically in the accelerated regression;
- three images were prepared/decoded before the story reached the couple section;
- audio volume remained inside `[0,1]`;
- event-aware share URL points to `/events/groom/`;
- no page error or console error in the fresh harness.

## Source inventory

```text
Source files          221
Source size           15.48 MiB
Dist files            47
Dist size             7.52 MiB
HTML IDs              95
Duplicate HTML IDs    0
Missing local refs    0
Changed/new files     44
```

## Release blockers not fabricated or hidden

- Multi-event RSVP Form has not been created and URLs are empty.
- Nha Trang and Sài Gòn addresses/maps are incomplete.
- Bride map pin is not verified.
- RSVP deadlines and event end times are not supplied.
- Guest grouping is not supplied.
- Public GitHub Pages is still serving an older single-event build until v19.3 is deployed.
- Physical Android/iPhone and Zalo/Messenger tests have not been completed.


## Recommended next gate

1. Create and connect the multi-event RSVP Form.
2. Verify the bride-home map pin.
3. Replace draft Nha Trang and Sài Gòn venues/maps.
4. Supply RSVP deadlines and event end times.
5. Deploy v19.3, then run `tools/check-live-build.ps1` or `.py`.
6. Test Android, iPhone, Zalo and Messenger.
7. Run one live RSVP and one wish submit → pending → approved → displayed cycle.

## Fable evidence judge

```text
SOURCE v19.3                     ACCEPT
SOCIAL EVENT PREVIEWS            ACCEPT
AUTO-STORY IMAGE PREPARATION     ACCEPT
AUDIO FADE HARDENING             ACCEPT
ACCESSIBILITY / PAUSE CONTROL    ACCEPT
POST-DEPLOY VERIFICATION         ACCEPT

LIVE WEBSITE                     STALE
MULTI-EVENT RSVP                 NOT CONFIGURED
DRAFT MAP DATA                   BLOCKING
PHYSICAL DEVICE E2E              NOT PROVEN

FINAL: LOCAL RELEASE CANDIDATE, NOT YET GUEST-READY
```
