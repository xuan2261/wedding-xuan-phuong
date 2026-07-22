# Hero layout implementation — v8

## Decision

Implemented the approved option: two horizontal-reading name stacks at the left and right edges. No `writing-mode` or 90-degree rotation is used.

## Visual hierarchy

- Groom: `Thanh` / `Xuân` on the left.
- Bride: `Thị` / `Phượng` on the right.
- Center area remains clear for faces.
- Date and primary action stay near the bottom.
- Invitation heading is forced into balanced lines: `Trân trọng` / `kính mời`.

## Accessibility

The visual name groups are `aria-hidden`; the single H1 exposes `Thanh Xuân và Thị Phượng` through an `sr-only` span. Text remains real HTML text rather than being baked into an image.

## Responsive breakpoints

Validated at 360×800, 390×844, 430×932, 768×1024 and 1440×900.
