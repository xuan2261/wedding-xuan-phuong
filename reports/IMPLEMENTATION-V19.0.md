# 13-skill implementation — v19 Multi-Event Wedding Journey

## Workflow

```text
integrity gate
→ requirement discovery
→ guest segmentation brainstorm
→ multi-event architecture
→ content/design
→ mobile-first UI/UX
→ privacy/operations review
→ code review
→ root-cause debug
→ fix/cook
→ static/browser tests
→ optimization loop
→ Fable evidence judge
```

## Implemented

- Four event profiles with safe default `groom`.
- Personalized URLs using `event` and `events`.
- Multi-event switcher for guests invited to more than one event.
- Event-specific invitation copy, timeline, venue, contact, calendar, gifts, sharing and lifecycle.
- Safety handling for unverified Maps and incomplete venues.
- Legacy one-event Google Form disabled in runtime.
- New Apps Script creates a separate multi-event Form and prefilled URLs.
- Four event-specific ICS files.
- Offline guest-link generator supports single and multiple events.
- GitHub Actions verifies, builds `dist`, uploads and deploys Pages.

## Known draft fields

- RSVP URLs and entry IDs.
- RSVP deadlines.
- Event end times.
- Nha Trang/Sài Gòn exact address, hall and map.
- Bride map pin verification.
- Guest grouping and companion limits.

## Verdict

```text
ACCEPT MULTI-EVENT ARCHITECTURE
DO NOT DEPLOY AS FINAL INVITATION UNTIL RSVP AND MAP DATA ARE COMPLETED
SAFE TO CONTINUE ITERATIVE DATA ENTRY
```
