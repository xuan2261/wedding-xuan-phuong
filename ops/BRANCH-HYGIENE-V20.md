# Branch hygiene — Photoshop v20

## Policy

- `main` is never deleted or force-updated by cleanup automation.
- A branch referenced by an open pull request is always kept.
- Squash-merged branches are deleted from merged pull-request evidence rather than Git ancestry alone.
- Temporary orphan branches are deleted only when they are on an explicit reviewed allowlist.

## Current active work

`images/refresh-photoshop-v20` remains protected while PR #13 is open and draft. It must not be merged in its current diagnostic form because it contains staging payloads, one-off recovery workflows, temporary files and reports.

The production image update should ultimately be delivered from a clean branch created from the latest `main`, containing only:

- final responsive image assets;
- production cache-reference updates;
- permanent image-processing/verification code that is still needed;
- tests required to guard the release.

## Cleanup candidates

Merged PR branches:

- `audit/v19.4-release-readiness`
- `hardening/v19.5-release-gates`
- `chore/dependency-rollup-and-redeploy`
- `ops/pages-live-watch-and-branch-cleanup`
- `ops/recover-image-pack-v20-history`
- `fix/image-pack-recovery-evidence`

Reviewed temporary orphan branches:

- `staging/v20-binary-upload`
- `images/refresh-photoshop-v20-final`

## Safety invariants

- no force-push to `main`;
- no deletion of branches used by open pull requests;
- no deletion of fork branches by this workflow;
- no staging ZIP/Base64/debug payload in the production branch;
- every cleanup decision is logged as `KEEP`, `DELETE`, `SKIP`, `APPROVED`, or `BLOCKED`.
