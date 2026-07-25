---
name: Executive Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
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
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
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
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  xxxl: 64px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system is anchored in the principles of **Institutional Minimalist**. It is designed to evoke a sense of absolute reliability, precision, and high-stakes competence for enterprise recruitment and skill verification. 

The aesthetic draws from modern high-performance tools, utilizing a "reduced" visual language where quality is communicated through whitespace, typographic scale, and structural alignment rather than decorative elements. The emotional response is one of calm authority—moving away from "tech-startup" playfulness toward "infrastructure-grade" stability. The interface should feel like a premium physical workspace: organized, quiet, and tactile.

## Colors
The palette is monochromatic and restrained, prioritizing the **Slate** and **Navy** scales to establish a professional foundation.

- **Primary & Branding:** #0F172A is used for high-impact text and primary action states.
- **Surface Strategy:** Use #FFFFFF for primary content cards and #F8FAFC for the global background to create a subtle "layered" effect. 
- **Accents:** Functional colors (Green, Amber, Blue) are used only for status indication and data visualization. They are desaturated slightly to avoid breaking the minimalist aesthetic.
- **Borders:** Use #E2E8F0 for standard dividers and #CBD5E1 for interactive element strokes.

## Typography
This design system utilizes **Inter** exclusively to maintain a systematic, utilitarian feel. The hierarchy is driven by significant size differentials and strategic use of font weights.

- **Headlines:** Use SemiBold (600) for page titles and section headers. Apply negative letter-spacing to larger sizes to maintain a "tight" professional appearance.
- **Body:** Use a 1.5x to 1.6x line-height ratio for long-form text (candidate bios, skill descriptions) to ensure maximum readability.
- **Labels:** Small labels use Bold weight with increased tracking for legibility at small scales, particularly in data tables and status badges.

## Layout & Spacing
The layout relies on a strict **8px linear grid system**. 

- **Desktop:** Use a 12-column fluid grid for dashboard content, with a maximum container width of 1280px for centered layouts. Margins should be at least 48px on large screens to allow the interface to "breathe."
- **Padding:** Use "Generous Inner Padding" (24px - 32px) for cards and containers. 
- **Density:** Maintain low density in management views to prevent cognitive overload. Information-heavy tables should utilize 16px vertical cell padding.

## Elevation & Depth
Depth is created through **Ambient Layering** rather than traditional drop shadows.

- **Level 0 (Background):** #F8FAFC.
- **Level 1 (Cards/Surface):** White (#FFFFFF) with a 1px border (#E2E8F0).
- **Level 2 (Hover/Active):** A multi-layered shadow: 
  *   Shadow 1: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`
  *   Shadow 2: `0 4px 6px -1px rgba(15, 23, 42, 0.1)`
- **Level 3 (Modals/Popovers):** A deep, diffused shadow to indicate significant elevation: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)`.

Avoid any inner shadows or heavy blurs. The goal is a sharp, architectural sense of depth.

## Shapes
The shape language is "Soft," shifting toward a more structured and professional aesthetic with tighter corner radii.

- **Containers & Cards:** Use an **8px (0.5rem)** radius to define the primary layout areas.
- **Interactive Elements:** Buttons, input fields, and dropdowns use a **4px (0.25rem)** radius. This reduced radius emphasizes precision and aligns with the system's "institutional" character.
- **Status Badges:** Use a fully rounded (9999px) pill shape for status indicators to differentiate them from buttons.

## Components

### Buttons
- **Primary:** Solid #0F172A background, white text. No gradient. 4px radius.
- **Secondary:** White background, #E2E8F0 border, #1E293B text. 
- **Ghost:** Transparent background, #475569 text, visible background on hover (#F1F5F9).

### Input Fields
- **Default State:** 1px solid #E2E8F0 border, 4px radius, #F8FAFC background.
- **Focus State:** 1px solid #3B82F6 border with a 3px soft blue outer glow (ring).
- **Typography:** Use `body-sm` for placeholder text in #94A3B8.

### Tables
- **Header:** #F8FAFC background, `label-sm` (uppercase) typography, 1px bottom border only.
- **Cells:** 16px vertical padding, 1px subtle #F1F5F9 bottom border.
- **Interactive Rows:** Subtle #F8FAFC background change on hover.

### Status Badges
- **Success:** Soft green background (#ECFDF5), dark green text (#065F46).
- **Neutral:** Soft gray background (#F1F5F9), dark gray text (#334155).
- **Structure:** Pill-shaped, semi-bold text, 12px font size.

### Cards
- Always 1px border (#E2E8F0) and Level 1 or 2 elevation. 8px radius.
- Use `headline-sm` for card titles with 24px bottom margin.