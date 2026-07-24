# 13-skill implementation — Wedding v18.1

## Chain

brainstorm → planning → design → UI/UX → code review → debug → fix/cook → test → optimization loop → Fable evidence judge

## Implemented

- P0 iframe hidden: fixed.
- P0 mobile dialog clipping: fixed with grid rows.
- P0 motion transform collision: fixed with `--layout-transform`.
- P1 landscape hero: compact two-name row and 500px minimum height.
- P1 feature crop: desktop/tablet focal point set to 25%.
- P1 no-JS RSVP: restored real anchor href.
- P1 CI reproducibility: package-lock and npm ci.
- P1 stale docs: build marker synchronized.
- P2 landscape lightbox: compact layout added.
- Exact Google Maps pin: coordinates from the shared Maps redirect.

## External action still required

The live Google Form remains remote state. Run `updateWeddingRsvpContactInfo()` and then `tools/check-live-rsvp.ps1`.
