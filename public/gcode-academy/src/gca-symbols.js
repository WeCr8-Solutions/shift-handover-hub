// ═══════════════════════════════════════════════════════════════════
// GCA.SYMBOLS.JS — Proper GD&T SVG Symbol Pack
// ASME Y14.5-2018 compliant inline SVG definitions
// No font dependency — renders correctly on all devices/browsers
// WeCr8 Solutions LLC | v1.0.0
// ═══════════════════════════════════════════════════════════════════

// SVG builder helper — all symbols rendered at 40x40 viewBox
// stroke-based line art matching ASME Y14.5 drafting standard
const _s = (paths, extra='') =>
  `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${paths}</svg>`;

const GCA_SYMBOLS = {

  // ── FORM ─────────────────────────────────────────────────────────
  // Straightness: single horizontal line with end ticks
  straightness: {
    name: 'Straightness', type: 'Form', datumReq: false,
    standard: 'ASME Y14.5-2018 §12.4',
    svg: _s(`<line x1="6" y1="20" x2="34" y2="20"/>
      <line x1="6" y1="14" x2="6" y2="26"/>
      <line x1="34" y1="14" x2="34" y2="26"/>`)
  },

  // Flatness: two parallel horizontal lines
  flatness: {
    name: 'Flatness', type: 'Form', datumReq: false,
    standard: 'ASME Y14.5-2018 §12.3',
    svg: _s(`<line x1="6" y1="15" x2="34" y2="15"/>
      <line x1="6" y1="25" x2="34" y2="25"/>`)
  },

  // Circularity (Roundness): circle only
  circularity: {
    name: 'Circularity', type: 'Form', datumReq: false,
    standard: 'ASME Y14.5-2018 §12.5',
    svg: _s(`<circle cx="20" cy="20" r="12"/>`)
  },

  // Cylindricity: circle with left/right vertical lines
  cylindricity: {
    name: 'Cylindricity', type: 'Form', datumReq: false,
    standard: 'ASME Y14.5-2018 §12.6',
    svg: _s(`<ellipse cx="20" cy="20" rx="7" ry="12"/>
      <line x1="6" y1="8" x2="6" y2="32"/>
      <line x1="34" y1="8" x2="34" y2="32"/>`)
  },

  // ── PROFILE ──────────────────────────────────────────────────────
  // Profile of a Line: arc above flat baseline
  profile_line: {
    name: 'Profile of a Line', type: 'Profile', datumReq: false,
    standard: 'ASME Y14.5-2018 §11.5',
    svg: _s(`<path d="M6 28 Q20 6 34 28"/>
      <line x1="6" y1="28" x2="34" y2="28"/>`)
  },

  // Profile of a Surface: filled arc above flat baseline
  profile_surface: {
    name: 'Profile of a Surface', type: 'Profile', datumReq: false,
    standard: 'ASME Y14.5-2018 §11.5',
    svg: _s(`<path d="M6 28 Q20 6 34 28 Z" stroke-width="2.2"/>
      <path d="M6 28 Q20 10 34 28" stroke-width="1.5" stroke-dasharray="2 2"/>`)
  },

  // ── ORIENTATION ──────────────────────────────────────────────────
  // Angularity: angle symbol — two lines meeting at acute angle
  angularity: {
    name: 'Angularity', type: 'Orientation', datumReq: true,
    standard: 'ASME Y14.5-2018 §10.3',
    svg: _s(`<line x1="8" y1="32" x2="20" y2="10"/>
      <line x1="20" y1="10" x2="32" y2="32"/>
      <line x1="10" y1="26" x2="30" y2="26"/>`)
  },

  // Perpendicularity: L-shape (90° symbol)
  perpendicularity: {
    name: 'Perpendicularity', type: 'Orientation', datumReq: true,
    standard: 'ASME Y14.5-2018 §10.2',
    svg: _s(`<line x1="8" y1="32" x2="32" y2="32"/>
      <line x1="20" y1="32" x2="20" y2="8"/>`)
  },

  // Parallelism: two parallel diagonal lines
  parallelism: {
    name: 'Parallelism', type: 'Orientation', datumReq: true,
    standard: 'ASME Y14.5-2018 §10.1',
    svg: _s(`<line x1="6" y1="14" x2="34" y2="14"/>
      <line x1="6" y1="26" x2="34" y2="26"/>`)
  },

  // ── LOCATION ─────────────────────────────────────────────────────
  // True Position: circle with crosshairs (⌖ shape)
  true_position: {
    name: 'True Position', type: 'Location', datumReq: true,
    standard: 'ASME Y14.5-2018 §9.4',
    svg: _s(`<circle cx="20" cy="20" r="10"/>
      <line x1="20" y1="6" x2="20" y2="34"/>
      <line x1="6" y1="20" x2="34" y2="20"/>`)
  },

  // Concentricity (removed in Y14.5-2018, still taught for 2009)
  // Shown with deprecated note
  concentricity: {
    name: 'Concentricity †', type: 'Location', datumReq: true,
    standard: 'ASME Y14.5-2009 (removed 2018)',
    deprecated: true,
    svg: _s(`<circle cx="20" cy="20" r="4"/>
      <circle cx="20" cy="20" r="12"/>`,
      `opacity="0.6"`)
  },

  // Symmetry (removed in Y14.5-2018, still taught for 2009)
  symmetry: {
    name: 'Symmetry †', type: 'Location', datumReq: true,
    standard: 'ASME Y14.5-2009 (removed 2018)',
    deprecated: true,
    svg: _s(`<line x1="6" y1="13" x2="34" y2="20"/>
      <line x1="6" y1="27" x2="34" y2="20"/>
      <line x1="6" y1="13" x2="6" y2="27"/>`,
      `opacity="0.6"`)
  },

  // ── RUNOUT ───────────────────────────────────────────────────────
  // Circular Runout: single arrow looping around axis line
  circular_runout: {
    name: 'Circular Runout', type: 'Runout', datumReq: true,
    standard: 'ASME Y14.5-2018 §14.3',
    svg: _s(`<path d="M12 20 A8 8 0 1 1 28 20" stroke-width="2.2"/>
      <polyline points="28,20 34,18 34,26"/>
      <line x1="20" y1="8" x2="20" y2="32" stroke-dasharray="3 2"/>`)
  },

  // Total Runout: double arrow looping around axis line
  total_runout: {
    name: 'Total Runout', type: 'Runout', datumReq: true,
    standard: 'ASME Y14.5-2018 §14.4',
    svg: _s(`<path d="M10 16 A10 6 0 1 1 30 16" stroke-width="2.2"/>
      <path d="M10 24 A10 6 0 0 0 30 24" stroke-width="2.2"/>
      <polyline points="28,15 34,13 34,21"/>
      <line x1="20" y1="6" x2="20" y2="34" stroke-dasharray="3 2"/>`)
  },

  // ── MODIFIERS ────────────────────────────────────────────────────
  mmc: {
    name: 'Maximum Material Condition', type: 'Modifier', datumReq: false,
    standard: 'ASME Y14.5-2018 §5.8',
    svg: _s(`<circle cx="20" cy="20" r="13" stroke-width="2.2"/>
      <text x="20" y="26" text-anchor="middle" font-size="14" font-weight="bold" stroke="none" fill="currentColor" font-family="serif">M</text>`)
  },

  lmc: {
    name: 'Least Material Condition', type: 'Modifier', datumReq: false,
    standard: 'ASME Y14.5-2018 §5.9',
    svg: _s(`<circle cx="20" cy="20" r="13" stroke-width="2.2"/>
      <text x="20" y="26" text-anchor="middle" font-size="14" font-weight="bold" stroke="none" fill="currentColor" font-family="serif">L</text>`)
  },

  projected_tolerance: {
    name: 'Projected Tolerance Zone', type: 'Modifier', datumReq: false,
    standard: 'ASME Y14.5-2018 §9.7',
    svg: _s(`<circle cx="20" cy="20" r="13" stroke-width="2.2"/>
      <text x="20" y="26" text-anchor="middle" font-size="14" font-weight="bold" stroke="none" fill="currentColor" font-family="serif">P</text>`)
  },

  free_state: {
    name: 'Free State', type: 'Modifier', datumReq: false,
    standard: 'ASME Y14.5-2018 §5.5',
    svg: _s(`<circle cx="20" cy="20" r="13" stroke-width="2.2"/>
      <text x="20" y="26" text-anchor="middle" font-size="14" font-weight="bold" stroke="none" fill="currentColor" font-family="serif">F</text>`)
  },

  diameter: {
    name: 'Diameter', type: 'Modifier', datumReq: false,
    standard: 'ASME Y14.5-2018',
    svg: _s(`<circle cx="20" cy="20" r="12" stroke-width="2.2"/>
      <line x1="10" y1="30" x2="30" y2="10" stroke-width="2.2"/>`)
  },

  // ── SPECIAL / REFERENCE ──────────────────────────────────────────
  feature_control_frame: {
    name: 'Feature Control Frame', type: 'Reference', datumReq: false,
    standard: 'ASME Y14.5-2018 §3.4',
    svg: _s(`<rect x="4" y="12" width="14" height="16" rx="1"/>
      <rect x="18" y="12" width="14" height="16" rx="1"/>
      <text x="11" y="24" text-anchor="middle" font-size="11" stroke="none" fill="currentColor" font-family="serif">⊥</text>
      <text x="25" y="24" text-anchor="middle" font-size="10" stroke="none" fill="currentColor">.005</text>`)
  },

  datum_feature: {
    name: 'Datum Feature Symbol', type: 'Reference', datumReq: false,
    standard: 'ASME Y14.5-2018 §7.3',
    svg: _s(`<rect x="10" y="12" width="20" height="16" rx="1"/>
      <text x="20" y="24" text-anchor="middle" font-size="13" font-weight="bold" stroke="none" fill="currentColor">A</text>
      <line x1="20" y1="28" x2="20" y2="34"/>
      <polygon points="16,34 24,34 20,38" fill="currentColor" stroke="none"/>`)
  },

  all_around: {
    name: 'All Around', type: 'Modifier', datumReq: false,
    standard: 'ASME Y14.5-2018 §11.5.3',
    svg: _s(`<circle cx="20" cy="20" r="9" stroke-width="2.2"/>
      <line x1="20" y1="6" x2="20" y2="11"/>
      <line x1="20" y1="20" x2="20" y2="6"/>`)
  },

  // ── SUPPLEMENTAL (Y14.5-2018 additions) ──────────────────────────
  independency: {
    name: 'Independency (ISO)', type: 'Modifier', datumReq: false,
    standard: 'ISO 14405-1 / Y14.5-2018 Annex',
    svg: _s(`<circle cx="20" cy="20" r="13" stroke-width="2.2"/>
      <text x="20" y="26" text-anchor="middle" font-size="14" font-weight="bold" stroke="none" fill="currentColor" font-family="serif">I</text>`)
  },

  unequal_bilateral: {
    name: 'Unequal Bilateral Profile', type: 'Profile', datumReq: false,
    standard: 'ASME Y14.5-2018 §11.5.4',
    svg: _s(`<path d="M6 28 Q20 6 34 28"/>
      <line x1="6" y1="28" x2="34" y2="28"/>
      <text x="34" y="20" font-size="10" stroke="none" fill="currentColor" font-family="sans-serif">U</text>`)
  },
};

// Ordered display list (matches teaching sequence)
GCA_SYMBOLS._order = [
  'straightness','flatness','circularity','cylindricity',
  'profile_line','profile_surface',
  'angularity','perpendicularity','parallelism',
  'true_position','concentricity','symmetry',
  'circular_runout','total_runout',
  'diameter','mmc','lmc','projected_tolerance','free_state',
  'feature_control_frame','datum_feature','all_around',
  'independency','unequal_bilateral'
];

// Type grouping for rendering
GCA_SYMBOLS._groups = {
  'Form':        ['straightness','flatness','circularity','cylindricity'],
  'Profile':     ['profile_line','profile_surface','unequal_bilateral'],
  'Orientation': ['angularity','perpendicularity','parallelism'],
  'Location':    ['true_position','concentricity','symmetry'],
  'Runout':      ['circular_runout','total_runout'],
  'Modifiers':   ['diameter','mmc','lmc','projected_tolerance','free_state','all_around','independency'],
  'Reference':   ['feature_control_frame','datum_feature'],
};

// ─── Plain-English definitions + machinist application notes ────────
// Used by the GD&T learn-more drawer in gca-engine-v1.js
const GCA_SYM_INFO = {
  straightness:        { def: 'Controls how straight a line element on a surface or axis must be — no datum needed.',                                  app: 'On a turned shaft, this limits axial bow. Inspect with an indicator on a surface plate or between centers.' },
  flatness:            { def: 'Controls how flat a surface must be between two parallel planes — no datum needed.',                                   app: 'Common on mating faces. Sweep with a dial indicator on a surface plate; total reading must stay inside the zone.' },
  circularity:         { def: 'Controls how round a single cross-section must be — no datum needed.',                                                 app: 'Use a V-block + indicator or a roundness tester. Out-of-round bores cause leakage and bearing failure.' },
  cylindricity:        { def: 'Combines circularity, straightness, and taper into one envelope along a cylinder.',                                   app: 'Tightest single OD/ID control. Best inspected on a CMM or roundness machine — a caliper cannot verify it.' },
  profile_line:        { def: 'Controls the form of a 2D cross-section profile (curved or complex edges).',                                           app: 'Common on cam profiles, turbine blade sections. Inspect with optical comparator or CMM scan.' },
  profile_surface:     { def: 'Controls the entire 3D surface form within a tolerance zone — can also locate when datums are referenced.',           app: 'Use for blends, filleted regions, freeform surfaces. CMM with surface scan is standard.' },
  angularity:          { def: 'Controls how close to a specified angle a surface, axis, or median plane must be — datum required.',                  app: 'Inspect with a sine bar set to the basic angle, then sweep with an indicator. Tolerance applies perpendicular to the surface.' },
  perpendicularity:    { def: 'Special case of angularity at exactly 90° to a datum.',                                                                app: 'Square a face to Datum A by indicating from the surface plate. Critical for press fits and bearing seats.' },
  parallelism:         { def: 'Controls how parallel a surface or axis is to a datum.',                                                               app: 'Sweep the controlled face with an indicator referenced from the datum. Critical for slides and shim packs.' },
  true_position:       { def: 'Locates a feature axis (or center plane) within a cylindrical (or rectangular) tolerance zone — datum required.',     app: 'Standard hole-pattern control. Pair with MMC to gain bonus tolerance when the feature is at material condition.' },
  concentricity:       { def: 'Median-points control between two cylindrical features sharing an axis — removed from Y14.5-2018 but still seen.',    app: 'Modern drawings use Position or Runout instead. If you see it, treat as Runout for inspection.' },
  symmetry:            { def: 'Median-plane control about a datum plane — removed from Y14.5-2018 but still seen.',                                   app: 'Replaced by Position. Inspect with a CMM measuring median points of opposing surfaces.' },
  circular_runout:     { def: 'Combined circularity + coaxiality at one cross-section, measured with the part rotated about a datum axis.',           app: 'Set part on V-blocks or between centers, sweep one location with an indicator — total movement is the runout.' },
  total_runout:        { def: 'Runout taken along the full length of the surface — controls form, orientation, and location together.',               app: 'Same as circular runout but indicator traverses axially while part rotates. Tightest single-control on shafts.' },
  diameter:             { def: 'Modifier — tolerance zone is cylindrical instead of two parallel planes.',                                            app: 'Always paired with Position on hole patterns. The Ø symbol means the hole axis must stay inside a cylinder.' },
  mmc:                 { def: 'Maximum Material Condition: tolerance applies when the feature has the most material (smallest hole / largest pin).', app: 'Earns "bonus tolerance" — as the hole grows, allowable position error grows by the same amount. Verify with a functional gauge.' },
  lmc:                 { def: 'Least Material Condition: tolerance applies when the feature has the least material (largest hole / smallest pin).',  app: 'Used to protect minimum wall thickness or edge distance. Less common than MMC.' },
  projected_tolerance: { def: 'Projects the tolerance zone above the surface by a stated height — usually for threaded or press-fit holes.',          app: 'Critical for tapped holes that must accept long studs. Inspect using a gage pin extending the projected height.' },
  free_state:          { def: 'Tolerance applies to the part in its unrestrained state — for thin or flexible parts.',                                app: 'Composite parts and sheet metal. Inspect without clamping; the part may flex into tolerance only when restrained for use.' },
  feature_control_frame:{ def: 'The rectangular frame that contains the GD&T callout: characteristic | tolerance | datums.',                         app: 'Read left-to-right: symbol, tolerance value (with modifier), then primary/secondary/tertiary datum letters.' },
  datum_feature:       { def: 'Identifier (A, B, C…) attached to a real surface that establishes a Datum Reference Frame.',                           app: 'On the floor, your work zero (G54) on the primary face IS Datum A. Edge-finding establishes Datums B and C.' },
  all_around:          { def: 'Modifier on a profile callout meaning the tolerance applies to every surface in the cross-section view.',              app: 'Common on pocket profiles and ID/OD pairs. The circle on the leader line means "go all the way around".' },
  independency:        { def: 'Form is controlled independently of size — Rule #1 (envelope principle) does NOT apply to this feature.',              app: 'ISO standard. Lets a long shaft have generous form tolerance even though size is tight.' },
  unequal_bilateral:   { def: 'Profile tolerance with an unequal split between the two sides of true profile (uses the U modifier).',                 app: 'Cosmetic A-surfaces often need more material on the visible side and less on the back side.' },
};

