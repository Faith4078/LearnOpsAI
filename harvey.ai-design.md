---
version: alpha
name: Harvey Legal Dark
description: A cinematic, high-contrast legal-tech system blending editorial typography with restrained, premium controls.
colors:
  primary: "#FAFAF9"
  secondary: "#0F0E0D"
  tertiary: "#374151"
  neutral: "#111111"
  surface: "#0F0E0D"
  on-surface: "#FAFAF9"
  error: "#B91C1C"
  border: "#374151"
typography:
  headline-display:
    fontFamily: HarveySerifFont
    fontSize: 48px
    fontWeight: 400
    lineHeight: 50.4px
    letterSpacing: -0.6px
  headline-lg:
    fontFamily: HarveySansFont
    fontSize: 39px
    fontWeight: 400
    lineHeight: 47px
    letterSpacing: -0.28px
  headline-md:
    fontFamily: HarveySansFont
    fontSize: 31px
    fontWeight: 400
    lineHeight: 37px
    letterSpacing: -0.28px
  headline-sm:
    fontFamily: HarveySansFont
    fontSize: 25px
    fontWeight: 400
    lineHeight: 30px
    letterSpacing: 0px
  body-lg:
    fontFamily: HarveySansFont
    fontSize: 20px
    fontWeight: 400
    lineHeight: 30px
    letterSpacing: 0px
  body-md:
    fontFamily: HarveySansFont
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-sm:
    fontFamily: HarveySansFont
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  label-lg:
    fontFamily: HarveySansFont
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
    letterSpacing: 0px
  label-md:
    fontFamily: HarveySansFont
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0px
  label-sm:
    fontFamily: HarveySansFont
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.02em
  nav-md:
    fontFamily: HarveySansFont
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
    letterSpacing: 0px
  quote-lg:
    fontFamily: HarveySerifFont
    fontSize: 24px
    fontWeight: 400
    lineHeight: 32px
    letterSpacing: -0.3px
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 56px
  xl: 112px
  gutter: 140px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: 16px 20px
    height: 48px
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: 16px 20px
    height: 48px
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: 0px
    height: 24px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 16px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px 16px
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 8px 12px
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.nav-md}"
    rounded: "{rounded.none}"
    padding: 0px
  banner-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: 0px
# Harvey Legal Dark

## Overview
Harvey presents as premium, focused, and highly professional, with a cinematic dark canvas that puts editorial messaging and polished photography first. The tone is confident rather than flashy, aimed at law firms and in-house legal teams that value clarity, precision, and trust. The interface feels spacious and restrained, with very few ornamental gestures beyond typography and contrast.

## Colors
- **Primary (#FAFAF9):** The bright off-white used for most text, buttons, and key UI accents. It reads as crisp and authoritative against the dark backdrop.
- **Secondary (#0F0E0D):** The core near-black surface color and atmospheric background tone. It creates the brand’s moody, premium first impression.
- **Tertiary (#374151):** A muted slate used for borders and subtle separation. It supports structure without becoming visually loud.
- **Neutral (#111111):** A deep neutral for supporting contrast relationships when pure surface black is too stark.
- **Surface (#0F0E0D):** The primary container and page surface color, reinforcing the unified dark mode feel.
- **On-surface (#FAFAF9):** The default readable foreground on dark surfaces, used for navigation, body copy, and controls.
- **Error (#B91C1C):** Reserved for validation and destructive states; it should remain subdued so it doesn’t break the calm visual system.
- **Border (#374151):** The default divider and outline tone, intentionally low-contrast to preserve the refined, editorial look.

## Typography
Harvey combines a bespoke serif for hero headlines with a clean sans-serif for the rest of the interface. `headline-display` uses HarveySerifFont at 48px for the main hero statement, giving the brand its elegant, magazine-like presence; the supporting headline levels step down through Harvey Sans at 39px, 31px, and 25px with tight negative tracking. Body copy stays readable and spacious at 20px or 16px, while labels and navigation use Harvey Sans with medium weight to feel precise and utilitarian. Uppercase styling is not dominant; instead, the system relies on size, weight, and letter spacing, with only small-label text benefiting from slightly tighter, utility-oriented tracking.

## Layout
The composition is built around a full-bleed hero with generous negative space and a strong split between left-aligned copy and right-aligned imagery. Navigation sits on top of the hero with a lightweight, horizontal structure, while the bottom customer-logo strip acts like a secondary band anchoring the page. Spacing follows a dramatic scale: compact 8px and 16px steps for controls, then large 56px, 112px, and 140px jumps for section breathing room and hero framing. Containers should stay wide and uncluttered; avoid dense grids and prefer large margins, broad gutters, and asymmetric editorial layouts.

## Elevation & Depth
Depth is created more through layered photography, tonal overlays, and contrast than through shadows. The system is intentionally flat: the provided shadow tokens are effectively none, and surfaces depend on border contrast, transparency, and image masking for hierarchy. Buttons are defined by fill versus outline treatment rather than elevation, which keeps the interface calm and high-end. When a component needs separation, use a subtle 1px border in slate rather than a drop shadow.

## Shapes
The shape language is disciplined and modest. Interactive controls use a small 4px radius, while cards can soften slightly to 8px to feel composed but not decorative. The overall feel is architectural and controlled, with roundedness used sparingly and never to create a playful tone. Large pills are acceptable only for chips or tag-like elements.

## Components
Buttons are the primary interactive pattern. `button-primary` is a filled off-white button with dark text, 16px 20px padding, 48px height, and a 4px radius; it should be the dominant call to action. `button-secondary` reverses that treatment with a transparent background and white outline, suitable for dark hero sections and secondary actions. `button-tertiary` is text-only and should be used for lightweight actions such as links or small utility triggers. Avoid oversized, heavily shadowed, or highly saturated buttons.

Cards should feel quiet and contained. Use the `card` token with the dark surface, a subtle slate border, 16px padding, and an 8px radius. Cards should not float; they should sit naturally within the page flow and rely on spacing and border lines for separation.

Inputs should be minimal and legible, with a dark background, light text, modest padding, and a small radius. Favor clear focus states and thin borders over filled or embossed treatments. Placeholder text and helper text should remain understated so they do not compete with content.

Navigation links use medium-weight sans-serif styling and remain mostly text-only, with no capsule backgrounds. Dropdown indicators should be small and restrained. Chips, tags, and logo pills should remain slim and low-profile, with full or near-full rounding only when the content calls for a badge-like shape.

## Do's and Don'ts
- Do keep contrast high and typography crisp on the dark surface.
- Do favor large editorial headlines paired with restrained supporting text.
- Do use borders and spacing to separate sections instead of shadows.
- Do keep controls compact, with 4px to 8px radii and consistent padding.
- Don't introduce bright secondary hues that compete with the monochrome system.
- Don't use heavy elevation, glossy effects, or skeuomorphic treatments.
- Don't over-round containers or turn the interface into a playful consumer style.
- Don't crowd layouts; preserve the spacious, cinematic rhythm of the page.
