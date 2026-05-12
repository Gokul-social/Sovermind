---
name: SoverMind
colors:
  surface: '#0f1511'
  surface-dim: '#0f1511'
  surface-bright: '#353a37'
  surface-container-lowest: '#0a0f0c'
  surface-container-low: '#181d19'
  surface-container: '#1c211d'
  surface-container-high: '#262b28'
  surface-container-highest: '#313632'
  on-surface: '#dfe4de'
  on-surface-variant: '#b9cac4'
  inverse-surface: '#dfe4de'
  inverse-on-surface: '#2c322e'
  outline: '#84948f'
  outline-variant: '#3b4a45'
  surface-tint: '#00dfbe'
  primary: '#70ffe0'
  on-primary: '#00382e'
  primary-container: '#00e5c3'
  on-primary-container: '#006152'
  inverse-primary: '#006b5a'
  secondary: '#b1cdba'
  on-secondary: '#1d3528'
  secondary-container: '#354f40'
  on-secondary-container: '#a3bfac'
  tertiary: '#ffe3c2'
  on-tertiary: '#452b00'
  tertiary-container: '#ffc064'
  on-tertiary-container: '#764d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#42fdda'
  primary-fixed-dim: '#00dfbe'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#005143'
  secondary-fixed: '#ccead5'
  secondary-fixed-dim: '#b1cdba'
  on-secondary-fixed: '#062014'
  on-secondary-fixed-variant: '#334c3d'
  tertiary-fixed: '#ffddb3'
  tertiary-fixed-dim: '#ffb94f'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#624000'
  background: '#0f1511'
  on-background: '#dfe4de'
  surface-variant: '#313632'
typography:
  headline-lg:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Source Serif 4
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  label-sm:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.05em
spacing:
  unit: 4px
  container-padding: 20px
  gutter: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system establishes a visual language defined as **Biopunk Brutalism**. It positions the product as a sovereign, clinical instrument that lives locally on the user’s device. The aesthetic rejects the "softness" of modern consumer health apps in favor of a raw, engineered interface that feels like a life-support system or a laboratory terminal.

The emotional response should be one of **absolute privacy and biological vitality**. By combining the cold, structural rigidity of brutalist utility with the vibrant, organic glow of bioluminescent accents, the UI signals both technical precision and a deep connection to human biology. It is an interface that doesn't just display data; it monitors a living organism.

## Colors

The palette is rooted in the "Deep Lab" spectrum. The foundation is a near-black **#0a0f0c**, providing a void-like depth that ensures the glowing elements achieve maximum vibrance.

- **Bioluminescent Teal (#00e5c3):** Used for primary actions, active states, and "living" data points. It represents the AI’s presence and health.
- **Deep Forest (#122b1e):** Used for structural containers and subtle backgrounds, grounding the UI in an organic, moss-like tone.
- **Warm Amber (#f0a832):** Reserved strictly for warnings, biological alerts, and critical telemetry.
- **Muted Slate (#64748b):** Provides a technical, non-distracting layer for metadata and secondary information.

## Typography

This design system utilizes a high-contrast typographic pairing to bridge the gap between "machine" and "human."

**Headings (Syne):** Brutalist, wide, and aggressive. These should feel like they are etched into the interface. Use tight tracking for a more "constructed" feel.

**Body (Source Serif 4):** A humanist serif that provides a literary, authoritative, and calming reading experience for health insights. It offsets the coldness of the UI with a sense of traditional medical wisdom.

**Data & Labels (IBM Plex Mono):** Monospaced type is used for all numerical data, timestamps, and UI labels to reinforce the feeling of a precise, offline diagnostic tool.

## Layout & Spacing

The layout is governed by a **Rigid Technical Grid**. On mobile, we use a 4-column system with visible or implied "raw" grid lines. 

- **Exposed Architecture:** Layout borders and dividers are often visible, using 1px strokes of the Deep Forest green.
- **Rhythm:** A 4px baseline grid ensures medical precision. Vertical stacking follows a strict hierarchy (8px for related items, 16px for component groups).
- **Safe Zones:** Generous 20px side margins ensure that data is never cramped, allowing the "Biopunk" textures to breathe in the periphery.

## Elevation & Depth

Standard material shadows are forbidden in this design system. Depth is communicated through **Luminance and Containment**:

1.  **Inner Glows:** Instead of drop shadows, active elements use subtle inner glows (0 0 10px) in Bioluminescent Teal to appear "energized."
2.  **Tonal Recess:** Secondary areas are carved out using the Deep Forest (#122b1e) color, creating a "sunken" feel relative to the near-black background.
3.  **Glass Layers:** High-priority modals use a heavy backdrop blur (20px) with a 10% opacity Teal tint, simulating a lens over a biological sample.
4.  **Scanlines:** A faint, fixed-position hexagonal overlay or scanline texture provides a sense of digital "skin" across the entire interface.

## Shapes

The shape language is **Angular and Crystalline**. 

- **Sharp Corners:** Most containers and buttons use 0px border radius to maintain the brutalist utility aesthetic.
- **Hexagonal Clipping:** Specialized data visualizations and profile avatars should use hexagonal masks, referencing molecular structures and biological cells.
- **Chamfered Edges:** For primary buttons, a 45-degree "cut" on one corner is preferred over standard rounding to emphasize the "engineered" nature of the design system.

## Components

**Buttons:** High-contrast blocks. The primary button is a solid Bioluminescent Teal block with black IBM Plex Mono text. Secondary buttons are 1px Teal outlines with no fill.

**Cards:** Containers do not use shadows. They are defined by 1px Deep Forest borders. On-tap, the border "pulses" or glows with Teal light.

**Input Fields:** Raw horizontal lines (like a terminal) rather than boxes. The label sits above the line in Monospaced slate. Upon focus, the line turns Teal and a "scanning" glow effect travels from left to right.

**Checkboxes/Radios:** These are rendered as small hexagons. When selected, they fill with a Teal dot that has a faint outer glow.

**Data Visualizations:** Charts must use the Teal accent for data lines, with the Amber color used for "outside of range" metrics. Use raw grid lines in the background of all charts.

**Health Status:** Use a "Biometric Pulse" component—a glowing, animated waveform that sits at the top of the main dashboard, indicating the AI is actively monitoring the device's local data.