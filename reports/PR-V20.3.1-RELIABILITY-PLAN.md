# PR v20.3.1 — Reliability hardening

## Scope lock

This patch intentionally changes release reliability only. It does not add UI,
animation, music, photo or invitation-content features.

## Decisions

1. **Idempotent branch cleanup**
   - An already deleted branch is the desired final state and must be a successful no-op.
   - Permission, authentication and unrelated API failures must still fail the workflow.
   - The race between ref lookup and deletion is handled explicitly.

2. **Canonical browser gate**
   - Pull-request CI runs `npm run test:browser-all` from `package.json`.
   - This includes the four-event map regression, browser smoke, audio/story and visual safe zones.
   - The workflow no longer maintains a second partial test list.

3. **Fail-closed guest readiness**
   - `automatedReady` covers source/data checks that CI can prove.
   - `manualReady` covers live RSVP/wishes, physical browsers and the privacy decision.
   - `guestReady` is true only when both layers pass.
   - The committed manual evidence starts pending and requires explicit approver metadata.

## Acceptance criteria

- Static regression proves the cleanup and CI contracts.
- Map binding is executed in normal PR CI for bride, groom, Nha Trang and Sài Gòn.
- `release_readiness.py --strict` fails while manual evidence is pending.
- An approved complete fixture passes strict mode.
- No production HTML/CSS/media behavior changes.
