# Wedding Xuân & Phượng — release-readiness audit v19.4

**Build audited:** `v19.4-20260724`  
**Verdict:** `SOURCE_RELEASE_CANDIDATE_NOT_YET_GUEST_READY`

## 13-skill workflow

```text
integrity gate
→ requirements and live-parity audit
→ online invitation research
→ brainstorm
→ architecture/planning
→ visual/motion and mobile UI/UX
→ accessibility/privacy
→ code review
→ root-cause debug
→ fix/cook
→ static/contract/browser testing
→ optimization loop
→ Fable evidence judge
```

The uploaded integrity report records PASS for all 13 skill archives. Their
workflows are used as the audit method; the archives are not embedded in the
wedding release.

## Source strengths confirmed

- Cinematic opening, simple mode and guided story controls are present.
- Four event profiles and four static event share pages are present.
- Audio fade uses bounded volume values and story autoplay has regression tests.
- Data Saver / slow-network behavior reduces automatic media work.
- RSVP has a phone-contact fallback while the multi-event Form is unavailable.
- Focus moves to the revealed hero after opening the cover.
- Long personalized guest names are hardened for short landscape screens.
- Guest links can be generated from per-guest CSV data.
- CI builds a clean `dist`, runs browser checks, deploys Pages and verifies the
  root marker plus all four event entry pages.

## Remaining release blockers

1. Multi-event Google Form URLs and guest-name entry IDs are not configured.
2. Nha Trang and Sài Gòn venue names, addresses and Maps links are incomplete.
3. Bride-home Google Maps pin is not verified.
4. RSVP deadlines and event end times are not supplied.
5. Final guest segmentation CSV is not supplied.
6. Physical Android/iPhone and Zalo/Messenger testing is incomplete.
7. Live RSVP submit and wishes pending → approved → displayed E2E is incomplete.

## Upgrade in this branch

The branch adds `tools/release_readiness.py`, a deterministic auditor that reads
`tools/wedding-data.json` and distinguishes source correctness from guest-release
readiness. It reports blockers and warnings per event, writes JSON/Markdown
artifacts, and supports `--strict` for a final release gate.

CI now:

1. executes `tests/release_readiness_check.py`;
2. generates release-readiness JSON and Markdown evidence;
3. uploads the evidence as a workflow artifact;
4. keeps deployment behavior unchanged until the user deliberately enables a
   strict guest-release policy.

## Recommended sequence

```text
merge audit tooling
→ complete venue/map data
→ create and connect multi-event RSVP
→ enter deadlines/end times
→ import guest segmentation CSV
→ run strict readiness audit
→ deploy
→ test Android/iPhone/Zalo/Messenger
→ run live RSVP and wishes E2E
→ send invitations
```

## Fable evidence verdict

```text
SOURCE v19.4                         ACCEPT
RELEASE-READINESS AUDITOR            ACCEPT
MORE DECORATIVE ANIMATION             REJECT FOR NOW
CLAIMING GUEST-READY FROM LOCAL TESTS REJECT
FINAL                                 NOT YET GUEST READY
```
