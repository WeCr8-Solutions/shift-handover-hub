# Brand Components — Scope

Logo and mark primitives. These are the only components allowed to render the JobLine.ai logo — do not recreate the logo inline in other components.

## Components
| Component | Use |
|-----------|-----|
| `JobLineLogo` | Full text logo — flyer headers, nav bars, cards |
| `LogoMark` | Icon-only mark — app icon, small spaces, watermarks |

## Props
See `brand.types.ts` → `LogoProps`

## Visual Identity Rules
- Logo always appears on dark navy background (`Colors.navyDeep`)
- "JobLine" = white; ".ai" = teal `#00C9A7`
- Mark squares = dark navy with slight border
- Teal chevron ▶ always to the right of squares
- Minimum logo height: 18pt (scale=1)
