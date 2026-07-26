# AK-DEBUG Full Audit — Wedding Xuân & Phượng v20.2

Generated: 2026-07-26 09:20 UTC  
Target: `xuan2261/wedding-xuan-phuong` / `main` at `2ad2e61`  
Method: reproduce → static/data audit → security/privacy audit → fresh multi-viewport render → root-cause fix → full CI → evidence judge.

## Verdict before fix

`FAIL_DEPLOY_CONTRACT_WITH_RUNTIME_TECHNICAL_PASS`

The v20.1 source and pull-request gates passed, but the production deploy workflow still verified the old build `v19.4-20260724`. Therefore PR success did not prove that the v20.1 merge could complete the post-deploy live verification.

## Root causes fixed

| Severity | Finding | Root cause | Resolution |
|---|---|---|---|
| P0 | Main deploy verification pinned to v19.4 | Build ID duplicated in workflow | Read `BUILD.json` dynamically during live verification |
| P1 | README/package/config comments remained v19.x | Release metadata updated incompletely | Synchronize to `v20.2-20260726` / package `20.2.0` |
| P1 | Apps Script still returned “Quý vị” | Backend copy was outside the prior replacement scope | Normalize backend copy to “Quý khách” |
| P2 | RSVP `tel:` fallback had `target=_blank` | HTML inherited external-link attributes | Remove blank-tab behavior |
| P2 | Cover session key named v19 | Legacy cache namespace | Version key as `wedding-cover-opened-v20-2` |
| P1 | Visual overlap could regress without rendered evidence | Earlier checks were stronger structurally than visually | Add fresh 320/390/430/568-landscape/1440 Playwright safe-zone screenshots and geometry gates |

## Remaining release blockers — intentionally not fabricated

- Multi-event Google Form URLs and RSVP entry IDs are not configured.
- Nha Trang and Sài Gòn venue addresses/maps are incomplete.
- Bride-side map pin remains unverified.
- RSVP deadlines, event end times and final guest grouping are incomplete.
- Physical Android, iPhone Safari, Zalo and Messenger testing remains required.
- Bank account and QR data are shipped in public static `config.js`; hiding the button is not access control. This is acceptable only if the couple explicitly accepts public discoverability.
- The public Apps Script endpoint is moderation-safe for display, but `clientKey`, `openedAt` and `siteOrigin` are client supplied; they reduce casual spam but are not strong authentication or abuse prevention.

## New gates

- Build/package/workflow metadata consistency.
- No stale v19.4 production deploy marker.
- No “Quý vị” in the wishes backend.
- No blank tab on `tel:` RSVP.
- No visible simple-mode button or seam.
- Multi-viewport hero and closing safe-zone geometry.
- Screenshot artifacts for visual review.

## Release decision

`SOURCE_READY_AFTER_CI; GUEST_READY_BLOCKED_BY_REAL_DATA_AND_PHYSICAL_E2E`
