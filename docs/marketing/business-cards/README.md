# Business Card Print Specs (VistaPrint / NA Standard)

Source templates archived here:
- `vistaprint-standard-template.pdf` — VistaPrint NA standard-size design template
- `vistaprint-artwork-guidelines.pdf` — VistaPrint artwork preparation guidelines
- `template-front.svg`, `template-back.svg` — bleed/trim/safety guides extracted from template

## Dimensions (NA standard, 3.5″ × 2″ landscape)

| Zone   | Inches          | mm                | Notes                                |
|--------|-----------------|-------------------|--------------------------------------|
| Bleed  | 3.625 × 2.125   | 92.075 × 53.975   | Full document size — extend bg here  |
| Trim   | 3.5 × 2.0       | 88.9  × 50.8      | Final cut line                       |
| Safety | 3.25 × 1.75     | 82.55 × 44.45     | Keep text & QR codes inside this box |

All four edges have 0.125″ (3.175 mm) bleed and 0.125″ safety inset from trim.

## Required output for print services

The Business Card Studio renders **bleed-size** PDFs/PNGs at 300 dpi so the file
can be uploaded directly to VistaPrint, MOO, GotPrint, etc.:

- PNG per side: 1088 × 638 px (3.625″ × 2.125″ @ 300 dpi)
- PDF: 3.625 × 2.125 in, 2 pages (front + back), CMYK-friendly colors

The on-screen preview shows the trim and safety guides; guides are omitted from
the exported file. "Show print guides" can be toggled to preview the bleed area.

## QR code minimum size

VistaPrint recommends QR codes ≥ 0.75″ (19 mm) for reliable scanning. The
studio renders QR codes at ~0.67″ on the front and ~0.85″ on the back side.
