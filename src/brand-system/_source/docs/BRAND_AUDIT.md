# Brand Audit — Visual Identity Extraction

**Sources analyzed:**
1. `1000012405.png` — 8-panel flyer sheet (8 layouts × 2 rows)
2. `1000012406.png` — Business card ecosystem (16 cards, 4 product lines × front/back × 2 variants)
3. `1000011678.jpg` — Shop poster sheet (4 variants: manufacturing, generic, welding, auto-repair)

---

## Colors

| Token Name | Hex | Source Evidence |
|------------|-----|-----------------|
| `navyDeep` | `#0D1B2A` | All flyer/card backgrounds — deep dark navy |
| `navyCard` | `#112240` | Inner panel/card surfaces, slightly lighter |
| `navyMid` | `#1A2E45` | Logo mark squares, elevated surfaces |
| `navyBorder` | `#0A1520` | Borders, separators |
| `teal` | `#00C9A7` | `.ai` in logo, key headlines, scan CTAs, QR borders |
| `tealLight` | `#00E0BC` | Brighter teal on hover/press elements |
| `green` | `#1DB954` | "TRY IT FREE", bullet checkmarks, CTA primary labels |
| `greenLight` | `#22D467` | Lighter green CTAs |
| `white` | `#FFFFFF` | Primary headline text, QR background |
| `whiteOff` | `#E8F0F7` | Body text, softer on dark bg |
| `subtext` | `#8899AA` | Secondary labels, footer text |
| `muted` | `#556677` | Micro labels, disabled states |
| `lightBg` | `#F0F4F8` | Back-of-card light variant background |

---

## Typography

**Identified from collateral:**

| Usage | Font | Weight | Evidence |
|-------|------|--------|----------|
| Hero headlines | Montserrat | 800 ExtraBold | "BUILD YOUR CAREER", "KEEP YOUR WORK MOVING" |
| Sub-headlines | Montserrat | 700 Bold | "Your skills. Verified." |
| CTA labels | Montserrat | 800 ExtraBold | "TRY IT FREE", "JOIN THE OAP TODAY" |
| Body copy | Open Sans | 400 Regular | Feature descriptions, bullet text |
| Labels/caps | Open Sans | 600 SemiBold | Footer taglines, small caps |
| G-code display | Source Code Pro | 400 Regular | G-code sample in GCA flyer |
| URL text | Montserrat | 600 SemiBold | "jobline.ai/start", "jobline.ai/talent" |

---

## Logo Mark Analysis

The JobLine.ai logo consists of:
1. **Three dark squares** — arranged horizontally, equal size, small gap between
2. **Teal right-pointing chevron/play mark** (▶) — immediately right of squares, slightly larger
3. **"JobLine"** — white, Montserrat Bold, slightly spaced
4. **".ai"** — same font, teal `#00C9A7`

The mark+text always appears left-aligned on dark navy backgrounds.

---

## Layout Patterns

### Flyer (portrait)
- Logo top-left always
- Hero headline: 2-3 lines, large, uppercase white + teal accent line
- Body/tagline below headline
- Feature list (bullets or icon grid) middle section
- CTA block bottom: QR left, scan text + URL right
- Footer: small caps tagline full-width

### Business Card (landscape 3.5"×2")
- Front: dark navy, logo top-left, headline fills, small CTA bar at bottom with QR
- Back: either dark (navy) or light (off-white) — bullet list + URL + "100% FREE" pill

### Shop Poster
- Same flyer structure but can include horizontal feature columns
- Auto-repair variant adds 3-column feature grid
- Heavy use of green for CTA blocks

---

## Product Lines & URLs

| Product | URL | CTA Color | Tagline Pattern |
|---------|-----|-----------|-----------------|
| Talent System | `/talent` | Green | "REAL PROFILES. REAL OPPORTUNITIES." |
| OAP | `/oap` | Green | "REAL SKILLS. REAL VERIFICATION. REAL OPPORTUNITIES." |
| Learn AI | `/learn` | Green | "AI KNOWLEDGE. MANUFACTURING IMPACT." |
| G Code Academy | `/gca` | Green | "LEARN. PRACTICE. PROGRAM. SUCCEED." |
| Shop Floor (start) | `/start` | Green | "BUILT FOR SMALL SHOPS. BIG IMPACT." |
