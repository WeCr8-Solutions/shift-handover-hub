

# Make the Entire Hero Visible Without Scrolling

## Problem

The hero logo was scaled to extremely large sizes (`h-72` on mobile up to `h-[40rem]` / 640px on desktop). Combined with the heading, subtitle, three CTA buttons, and stats grid, the hero section far exceeds a single viewport height. Users must scroll just to see the call-to-action.

## Approach

Use `dvh` (dynamic viewport height) to constrain the hero section to the screen, and scale the logo to fill available space without pushing content off-screen. The key is making the hero section itself `min-h-[100dvh]` with a flex column layout so elements distribute within the viewport.

## Changes to `src/pages/Landing.tsx`

1. **Hero section container**: Change from fixed padding to `min-h-[100dvh] flex flex-col justify-center` so the entire section fits the viewport
2. **Reduce top/bottom padding**: Use minimal padding (`pt-16 pb-8`) since the nav is fixed and takes ~56-64px
3. **Scale logo back to reasonable sizes**: `h-20 sm:h-28 md:h-36 lg:h-44` -- still 3-4x larger than the nav logo but not viewport-breaking
4. **Reduce spacing**: Tighten `mb-` values between logo, badge, heading, subtitle, buttons, and stats so everything breathes but fits
5. **Keep all content**: Logo, badge, h1, subtitle, 3 buttons, and stats grid all remain visible

### Size reference
- Nav bar: ~64px
- Logo at `h-44` (lg): 176px
- Heading + subtitle: ~200px
- Buttons row: ~48px
- Stats grid: ~80px
- Gaps/margins: ~120px
- Total: ~688px -- fits in 768px+ viewport with room to spare

On mobile (`h-20` = 80px logo), total is ~500px which fits comfortably in any phone viewport.

