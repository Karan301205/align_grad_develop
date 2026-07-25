---
name: Executive Recruiter Elite
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e4'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fe'
  surface-container: '#eeedf8'
  surface-container-high: '#e8e7f2'
  surface-container-highest: '#e3e1ed'
  on-surface: '#1a1b23'
  on-surface-variant: '#434654'
  inverse-surface: '#2f3038'
  inverse-on-surface: '#f1effb'
  outline: '#747685'
  outline-variant: '#c4c5d6'
  surface-tint: '#2754cf'
  primary: '#2754cf'
  on-primary: '#ffffff'
  primary-container: '#466ee9'
  on-primary-container: '#000319'
  inverse-primary: '#b6c4ff'
  secondary: '#4f5c8c'
  on-secondary: '#ffffff'
  secondary-container: '#bac7fd'
  on-secondary-container: '#455281'
  tertiary: '#a63a0b'
  on-tertiary: '#ffffff'
  tertiary-container: '#c75224'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164f'
  on-primary-fixed-variant: '#003bb0'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b7c4fa'
  on-secondary-fixed: '#081844'
  on-secondary-fixed-variant: '#374472'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#822800'
  background: '#fbf8ff'
  on-background: '#1a1b23'
  surface-variant: '#e3e1ed'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered to evoke **Trust & Success**. It moves away from the casual "startup" aesthetic of light-blue tints and focuses on a **Corporate / Modern** style that feels premium and authoritative. The target audience—high-stakes recruiters and hiring managers—requires a UI that minimizes noise and maximizes data clarity.

The visual narrative is defined by:
- **Precision:** Clean, high-contrast surfaces and purposeful alignment.
- **Authority:** A sophisticated vibrant blue palette paired with professional indigo and burnt orange accents.
- **Breathability:** Generous white space to prevent cognitive overload during candidate screening.
- **Subtlety:** Soft depth and layered surfaces instead of harsh borders, creating a tactile "desktop" feel.

## Colors

The palette is anchored in **Royal Blue (#466EE9)**, providing an energetic yet professional grounding force for core branding and primary actions. **Indigo Slate (#6875A6)** provides secondary depth, while **Burnt Orange (#973000)** is used surgically for high-value alerts or urgent status updates.

- **Primary:** Vibrant royal blue for core branding and typography.
- **Secondary:** A professional, muted indigo-slate for supporting UI elements and professional status indicators.
- **Tertiary:** A sophisticated burnt orange for contrast and specific callouts.
- **Neutral:** A range of professional mid-tone grays (#767680) for secondary text and borders.
- **Surfaces:** Pure White (#FFFFFF) for primary cards to pop against a subtle gray background.

## Typography

This design system uses **Hanken Grotesk** for headlines to provide a sharp, contemporary edge that feels more "premium" than standard system fonts. **Inter** is utilized for all body and UI elements to ensure maximum legibility at small sizes, which is critical for resume scanning and data tables.

- Use **Headline XL** only for main dashboard welcomes.
- **Label MD** should be used for section headers within cards (e.g., "SKILLS" or "EXPERIENCE") to create a structured hierarchy.
- Line heights are intentionally generous (1.5x for body) to improve readability in dense candidate profiles.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop (1280px max-width) to maintain a centered, professional focus. 

- **Grid:** 12-column system with 24px gutters.
- **Vertical Rhythm:** A strict 8px base unit. Component internal padding should default to 16px or 24px for a "premium" feel.
- **Mobile:** Transition to a single-column fluid layout with 16px side margins. 
- **Recruiter Efficiency:** Information-dense areas (like applicant lists) should use a 12px "Compact" vertical spacing, while profile pages should use 32px "Generous" spacing to denote importance.

## Elevation & Depth

To avoid the "flat and cheap" look of thin borders, the design system utilizes **Tonal Layers** and **Ambient Shadows**.

- **Level 0 (Background):** A clean, light neutral canvas provides a stable foundation.
- **Level 1 (Cards/Containers):** Pure White (#FFFFFF) with a very soft, diffused shadow (0px 4px 20px rgba(20, 72, 195, 0.05)).
- **Level 2 (Interactive/Floating):** Use for dropdowns and active state cards. Shadow increases in spread and slightly in opacity (0px 8px 30px rgba(20, 72, 195, 0.08)).
- **Borders:** Instead of black or dark blue, use subtle neutral-gray definition to maintain a crisp look.

## Shapes

The shape language is **Soft (Level 1)**. This balance provides a precise, professional feel that is sharper and more clinical than rounded styles, remaining modern without feeling "bubbly."

- **Standard Elements:** 0.25rem (4px) for buttons, input fields, and small cards.
- **Large Containers:** 0.5rem (8px) for main dashboard sections and modal overlays.
- **Special Case:** "Status Chips" (e.g., 'Verified') may use a pill-shape (full round) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Royal Blue background, white text. No border. Soft shadow.
- **Secondary:** Indigo Slate background. Used for secondary navigation or supporting actions.
- **Ghost:** Neutral-600 text, no background. Used for secondary navigation like "Cancel."

### Input Fields
- Use a solid 1px neutral border. 
- On focus, transition border to Royal Blue (not blue) and add a subtle 2px outer glow.
- Labels must always be visible above the field in **Label-MD**.

### Cards
- White background, 4px corner radius.
- Use a subtle border *and* the Level 1 soft shadow to create a crisp, premium look.
- Header sections within cards should have a subtle neutral-gray bottom-border.

### Chips / Tags
- **Skill Tags:** Light neutral background with darker neutral text.
- **Status Tags:** Indigo or Burnt Orange backgrounds depending on the severity and context of the status.

### Navigation
- Sidebar should be high-contrast: Royal Blue (#466EE9) with lighter indigo icons. 
- Active state: White icon and a 4px highlight indicator bar on the left.