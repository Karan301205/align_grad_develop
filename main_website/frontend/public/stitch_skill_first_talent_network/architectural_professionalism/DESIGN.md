---
name: Architectural Professionalism
colors:
  surface: '#f9f9ff'
  surface-dim: '#d7d9e5'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#ebedf9'
  surface-container-high: '#e6e8f3'
  surface-container-highest: '#e0e2ed'
  on-surface: '#181c24'
  on-surface-variant: '#414755'
  inverse-surface: '#2d3039'
  inverse-on-surface: '#eef0fc'
  outline: '#727786'
  outline-variant: '#c1c6d7'
  surface-tint: '#0059c7'
  primary: '#0057c2'
  on-primary: '#ffffff'
  primary-container: '#006ef2'
  on-primary-container: '#fefcff'
  inverse-primary: '#afc6ff'
  secondary: '#425d97'
  on-secondary: '#ffffff'
  secondary-container: '#a2befe'
  on-secondary-container: '#2f4b85'
  tertiary: '#9f3c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c84d00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#afc6ff'
  on-primary-fixed: '#001a43'
  on-primary-fixed-variant: '#004398'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#afc6ff'
  on-secondary-fixed: '#001943'
  on-secondary-fixed-variant: '#28457e'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#f9f9ff'
  on-background: '#181c24'
  surface-variant: '#e0e2ed'
typography:
  display-lg:
    fontFamily: Eb Garamond
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Eb Garamond
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Eb Garamond
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Domine
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Domine
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-mono:
    fontFamily: Karla
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  cert-heading:
    fontFamily: Eb Garamond
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 16px
  column-count: '12'
---

## Brand & Style

The design system is engineered for high-stakes professional environments, specifically bridging the gap between elite candidates and corporate HR departments. The brand personality is authoritative, precise, and structural, eschewing modern trends of softness and fluidity in favor of a rigid, institutional aesthetic. 

The design style is a refined **Corporate Minimalist** approach with subtle **Architectural** influences. It utilizes sharp edges, high-contrast typography, and a mathematical grid to evoke a sense of stability and meritocracy. Every pixel serves a functional purpose, creating an emotional response of trust, seriousness, and efficiency. Visual noise is eliminated to ensure that data—resumes, certifications, and analytics—remains the primary focus.

## Colors

The palette is anchored in high-contrast neutrality but incorporates strategic splashes of color to guide the user's eye and indicate status.

- **Primary (Vibrant Blue):** Used for primary calls to action, active navigation states, and highlighting key interactive elements. It represents intelligence and digital proficiency.
- **Secondary (Steel Blue):** Utilized for structural elements, secondary buttons, and supporting visual accents.
- **Tertiary (Deep Orange):** Used sparingly as an accent color for warnings, high-priority notifications, or specific calls to attention that require immediate notice.
- **Neutral (Medium Gray/Slate):** Used for primary text and heavy borders to ensure maximum legibility and authority while maintaining a neutral, document-like feel.
- **Surface (White):** A stark white background ensures a clean, professional workspace.

Avoid any use of gradients, glows, or vibrant "neon" shades. All colors must be flat and solid.

## Typography

This design system uses a triple-font strategy to balance academic authority with modern readability:
1. **EB Garamond (Headlines):** A classic serif that provides an air of prestige, heritage, and high-level certification.
2. **Domine (Body):** A robust serif specifically designed for screen reading, ensuring long-form candidate data is comfortable to consume.
3. **Karla (Labels/Data):** A grotesque sans-serif that offers a clean, technical contrast for metadata and small UI labels.

Text should follow a strict hierarchy. Use uppercase for labels and small headings to mimic official forms and certificates.

## Layout & Spacing

The layout is governed by a strict **12-column Fixed Grid** on desktop (1280px max-width) that transitions to a **Fluid Grid** on smaller breakpoints. 

- **The 4px Rule:** All spacing (padding, margins, gap) must be increments of 4px.
- **Sectional Borders:** Instead of using white space alone to separate content, use 1px solid borders in `#747781`.
- **Data Density:** Maintain high information density. Use narrow gutters (24px) to allow for complex data tables and side-by-side comparisons of candidate profiles.
- **Alignment:** All elements must align to the top-left of their grid container. Center alignment should be avoided except for specific modal actions.

## Elevation & Depth

This design system rejects the use of shadows and blurs. Depth is achieved entirely through **Tonal Layering** and **Line Work**.

- **Level 0 (Base):** The main background (`#FFFFFF`).
- **Level 1 (Containers):** Elements are defined by 1px or 2px solid borders (`#747781`). 
- **Level 2 (Active/Overlays):** Modals and dropdowns do not float with shadows; instead, they use a thick 2px solid border with a high-contrast offset (reminiscent of architectural blueprints).
- **Separators:** Use horizontal and vertical rules to divide content within a single card or page, maintaining the "official document" aesthetic.

## Shapes

The shape language is strictly **Rectilinear**. 

- All buttons, input fields, cards, and tags must have a border-radius of **0px**.
- Icons should be selected from sets that feature sharp corners and consistent stroke weights (e.g., 2px strokes).
- Any decorative elements should be limited to geometric patterns (dots, grids, or straight lines) that reinforce the structured nature of the platform.

## Components

### Buttons
- **Primary:** Solid `#0273FC` background, white text, 0px radius. High-contrast hover state (background turns `#5B76B2`).
- **Secondary:** White background, 1px `#747781` border, black text.
- **Tertiary:** Text only, bold, underlined on hover.

### Inputs & Selects
- 1px solid `#747781` borders that turn 2px `#0273FC` on focus. No glowing outlines.
- Labels sit above the input in `Karla` typography.

### Certification Cards
- Designed to look like physical documents. Heavy 2px top border in `#0273FC`.
- Use of a "Seal of Authenticity" icon in the corner.
- Backgrounds may use a subtle neutral tint to distinguish them from standard UI cards.

### Data Tables
- Header rows in `#5B76B2` with white text.
- Row zebra-striping using light gray tones.
- All cells separated by 1px borders to maximize the "spreadsheet" efficiency for HR users.

### Status Chips
- Square edges. Solid background with high-contrast text. 
- Colors: Success (Primary Blue), Pending (Gray), Warning (Deep Orange). No pastel variants.