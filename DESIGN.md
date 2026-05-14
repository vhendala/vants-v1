---
name: Vants
description: Neo-banco latinoamericano — investimentos + pagamentos em uma conta.
colors:
  trust-blue: "oklch(56% 0.13 218)"
  blue-deep: "oklch(40% 0.115 218)"
  blue-light: "oklch(94% 0.036 218)"
  hero-surface: "oklch(50% 0.125 218)"
  yield-green: "oklch(74% 0.13 155)"
  ink: "oklch(14% 0.008 218)"
  ink-secondary: "oklch(40% 0.007 218)"
  muted: "oklch(58% 0.006 218)"
  surface: "oklch(96% 0.005 218)"
  base: "oklch(98.5% 0.004 218)"
  border: "oklch(91% 0.006 218)"
  white-tinted: "oklch(99% 0.003 218)"
typography:
  display:
    fontFamily: "'Zain', sans-serif"
    fontSize: "clamp(4rem, 9.5vw, 10.5rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "'Zain', sans-serif"
    fontSize: "clamp(2.5rem, 4.5vw, 4.75rem)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  title:
    fontFamily: "'Zain', sans-serif"
    fontSize: "2.1rem"
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Manrope', sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "'Manrope', sans-serif"
    fontSize: "0.65rem"
    fontWeight: 800
    lineHeight: 1.4
    letterSpacing: "0.3em"
  numeral:
    fontFamily: "'Inter', sans-serif"
    fontSize: "inherit"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "\"tnum\""
rounded:
  pill: "100px"
  card: "2rem"
  surface: "0.75rem"
  chip: "100px"
spacing:
  xs: "0.65rem"
  sm: "1rem"
  md: "1.75rem"
  lg: "3rem"
  xl: "5rem"
  section: "clamp(5rem, 10vw, 9rem)"
components:
  button-primary:
    backgroundColor: "{colors.white-tinted}"
    textColor: "{colors.blue-deep}"
    rounded: "{rounded.pill}"
    padding: "0.65rem 1.6rem"
  button-primary-hover:
    backgroundColor: "{colors.white-tinted}"
    textColor: "{colors.blue-deep}"
    padding: "0.65rem 1.6rem"
  button-hero:
    backgroundColor: "{colors.white-tinted}"
    textColor: "{colors.blue-deep}"
    rounded: "{rounded.pill}"
    padding: "1rem 2.5rem"
  button-cta:
    backgroundColor: "{colors.white-tinted}"
    textColor: "{colors.blue-deep}"
    rounded: "{rounded.pill}"
    padding: "1.1rem 3rem"
  button-ghost-nav:
    backgroundColor: "transparent"
    textColor: "oklch(99% 0 0 / 0.65)"
    rounded: "0"
    padding: "0"
  nav-default:
    backgroundColor: "transparent"
    height: "auto"
    padding: "2rem 5%"
  nav-scrolled:
    backgroundColor: "{colors.blue-deep}"
    padding: "1.1rem 5%"
---

# Design System: Vants

## 1. Overview

**Creative North Star: "The Quiet Accumulator"**

The Vants visual system is a direct expression of the product's core insight: money that never stops working. The interface embodies the same quality as the underlying machine — invisible, precise, always running. Nothing interrupts the accumulation. On a surface level, the design is light, clean, and typographically grounded. Below that surface, every decision enforces financial gravity: the hero commits to brand blue without hedging; the numerals use tabular figures without exception; the spacing breathes without drifting into decorative excess.

The palette is a single tonal system built on one hue (218°, a blue that reads as institutional without reading as cold). There is no secondary accent. There is no decorative gradient. Color carries meaning: blue for surface and trust, green for financial growth, ink for text hierarchy, and that is the complete vocabulary. The typography pairs a heavy geometric display face (Zain) with a warm sans (Manrope), with Inter reserved exclusively for tabular numerals. The system competes with Nubank and Revolut on craft; it does not compete with Binance on stimulus.

The register is brand. Marketing surfaces run Committed to the blue: the first fold is blue, not a photo of São Paulo, not a gradient skyline, not stock imagery. Typography is the hero. Subsequent sections return to light, creating a tonal arc across the page.

**Key Characteristics:**
- Single-hue tonal palette at 218°, no secondary accent colors
- Committed Blue hero: first fold always runs in brand blue, never neutral
- Zain display at weight 900, tracked tight, line-height below 1.0 on large headlines
- Tabular numerals (Inter) for every financial figure, always — balance amounts, yields, percentages
- Flat surfaces at rest; structural lift only on the App Mock card and hover states
- Prose sections left-aligned with typographic rhythm; never centered stacks
- No images on marketing surfaces — typography and data carry the visual voice

## 2. Colors: The São Paulo Cerâmica Palette

A single-hue system at H=218°, spanning near-black to near-white. Every surface in the product — hero, sections, text, borders — is a step on the same ramp.

### Primary
- **São Paulo Cerâmica** (`oklch(56% 0.13 218)`, ~`#3883A3`): Trust Blue. Used as brand accent on interactive elements, section labels, highlights in the comparison table, and the Vants column background. Named for the glazed blue tiles of mid-century São Paulo and Buenos Aires architecture: warm, trustworthy, distinctly Latin American.
- **Night Tide** (`oklch(40% 0.115 218)`, ~`#1D5F8A`): Deep Blue. Used as the hero CTA section background, the nav-scrolled state, and all button text. Darker, more authoritative than Trust Blue; used where weight matters.
- **Deep Cerâmica** (`oklch(50% 0.125 218)`, ~`#2A70A0`): Hero Surface. The hero section background. Slightly lighter than Night Tide to allow the watermark and ambient highlight to read. Not used elsewhere.

### Secondary
- **Compounding Green** (`oklch(74% 0.13 155)`, ~`#3AB07A`): Yield signal color. Exclusive to positive financial figures (daily yield, portfolio gains, the live rate indicator). Never used decoratively. Its restriction is its meaning: if it appears, money is growing.

### Neutral
- **São Paulo Asphalt** (`oklch(14% 0.008 218)`, ~`#0F1623`): Primary text. All body copy and the app-mock background. The chroma of 0.008 tints it blue-ward; it reads as near-black but never as harsh neutral black.
- **Deep Concrete** (`oklch(40% 0.007 218)`, ~`#4B5468`): Secondary text. Paragraph copy, sub-labels, muted states.
- **Worn Concrete** (`oklch(58% 0.006 218)`, ~`#606878`): Muted labels. Section labels, table secondary column, timestamp text in the app mock.
- **Pale Stone** (`oklch(96% 0.005 218)`, ~`#F1F4F7`): Section surface. Alternating light section backgrounds (the Loop section, the Comparison section). Distinct from base without being visually heavy.
- **Daylight Canvas** (`oklch(98.5% 0.004 218)`, ~`#F8FAFC`): Base background. Default page background, the Problem section, the Yield section.
- **Hairline** (`oklch(91% 0.006 218)`, ~`#E1E5EC`): Borders. Used for stat row dividers, loop step borders, table row separators. Never as a decorative element.
- **Clean Surface** (`oklch(99% 0.003 218)`, ~`#FAFCFE`): Near-white. Infra strip, footer column backgrounds, button fill on blue surfaces. The chroma of 0.003 is barely perceptible but anchors it to the palette hue.
- **Morning Wash** (`oklch(94% 0.036 218)`, ~`#DBE8F3`): Blue tint. Used exclusively as the Vants column background in the comparison table and the blue-light surface for UI highlights.

### Named Rules
**The Single Hue Rule.** Every color in the system lives at H=218°. Compounding Green (H=155°) is the only exception, and it is reserved for yield signals only. Introducing a second accent hue — a warm coral, an amber, a purple — breaks the palette contract and signals a different product.

**The Committed Hero Rule.** Brand marketing surfaces never open on a neutral background. The first fold runs full-bleed in Deep Cerâmica or Night Tide. Restrained is a product register choice; brand surfaces get Committed. A white hero with a blue button is a landing page. A blue hero with white type is a brand.

**The Green Discipline Rule.** Compounding Green appears only when a number represents financial growth. If it appears in a decorative context (a feature icon, a badge, an illustration accent), it loses its meaning. The color earns its power through restriction.

## 3. Typography

**Display Font:** Zain (sans-serif, geometric-heavy, weight 900 for all display usage)
**Body Font:** Manrope (humanist sans, weights 400–800)
**Numeral Font:** Inter (weight 700, tabular-nums feature active at all times)

**Character:** Zain provides the brand's physical weight: it reads as designed-not-defaulted, has a geometric quality that feels financially serious, and its condensed forms at weight 900 compress well at large sizes without feeling narrow. Manrope provides warmth and legibility at small sizes, softening the system's institutional edge. Inter appears only as a functional tool for financial figures; it has no presence in headlines or body.

### Hierarchy
- **Display** (Zain, 900, `clamp(4rem, 9.5vw, 10.5rem)`, line-height 0.88, tracking -0.04em): Hero headlines only. One per page, maximum two lines. The extreme line-height below 1.0 is intentional at this size; multiline display at normal leading reads as bloated.
- **Headline** (Zain, 900, `clamp(2.5rem, 4.5vw, 4.75rem)`, line-height 0.92, tracking -0.03em): Section headings (h2). Applied to the Problem, Loop, Yield, Comparison, and CTA section titles.
- **Title** (Zain, 800, `2.1rem`, line-height 1.0, tracking -0.02em): Sub-section titles and step headings (h3). Used for Core Loop step titles.
- **Body** (Manrope, 400–500, `1.05rem`, line-height 1.7): Paragraph copy. Max line length 50ch on desktop. Never exceeded; body copy that runs full-width reads as unedited.
- **Label** (Manrope, 800, `0.62rem–0.72rem`, line-height 1.4, tracking 0.3em, ALL CAPS): Section labels, infra logos, table headers, step notes, nav links. Spacing at 0.3em provides legibility at 0.62rem without requiring larger type.
- **Numeral** (Inter, 700, `font-variant-numeric: tabular-nums`): All financial figures — balances, percentages, volume stats, market numbers. Applied as a modifier class (`tabular`) on any element containing a financial value, regardless of surrounding type size or role.

### Named Rules
**The Living Number Rule.** Every financial figure — balance, percentage, return, market stat — uses Inter with `font-variant-numeric: tabular-nums`. This is non-negotiable. A balance that shifts its glyph width when digits change breaks financial trust. Numerals that align to consistent column widths feel like the product knows what it's doing.

**The Italic Discipline Rule.** Italic is not a texture. It is not applied to headings by default. If italic appears in every heading, it has lost its job. Reserve italic for one or two moments of genuine rhetorical emphasis per surface. The original Vants landing page violated this: every heading was italic, producing a page that felt stylized but arbitrary.

**The Sub-1.0 Display Rule.** Display headlines set at `clamp(4rem, 9.5vw, 10.5rem)` use line-height 0.88. At display scale, normal leading creates ugly air between lines. Sub-1.0 leading tightens the headline into a visual block, which is the intended effect. Never apply sub-1.0 leading below 3rem.

## 4. Elevation

Flat-by-default. The system does not use ambient shadows on surfaces at rest. Tonal layering — Daylight Canvas → Pale Stone → Clean Surface — communicates surface depth without a shadow vocabulary. This is a deliberate choice: ambient box-shadows at rest are a SaaS template tell. They say "this was scaffolded," not "this was designed."

Two structural exceptions exist.

**The App Mock shadow** (`0 48px 88px oklch(14% 0.008 218 / 0.20)`) is the only shadow on a resting surface. Its function is to read the mock as a physical artifact, distinct from the page surface — a phone screen lifted off the background. This shadow is proportional to the mock's scale (2rem border-radius, large card) and uses the brand ink color at low opacity rather than neutral black.

**Button hover lift** is a transient state shadow, not a resting state. Primary and hero buttons translate `translateY(-2px)` to `translateY(-3px)` on hover with an ink-tinted shadow at 0.3–0.45 opacity. This provides touch-like feedback without decorating the resting state.

### Shadow Vocabulary
- **App Mock Lift** (`0 48px 88px oklch(14% 0.008 218 / 0.20)`): Structural. Renders the mock as a physical object above the page surface. Used once: on the Yield section app mock.
- **Button Hover Glow** (`0 8px 24px oklch(50% 0.125 218 / 0.30)` to `0 18px 42px oklch(30% 0.11 218 / 0.45)`): Transient. Appears on button hover as a depth signal. The blue tint in the shadow connects it to the button's visual language. Disappears on mouse-out.

### Named Rules
**The Flat-by-Default Rule.** Surfaces are flat at rest. No `box-shadow` on cards, table rows, section containers, or stat rows unless they require structural separation from the background. If a layout requires a shadow to communicate depth, the layout is wrong.

## 5. Components

### Buttons

Four distinct button roles; all use `border-radius: 100px` (pill). The pill form is the only rounded token used for interactive elements.

- **Primary (Nav):** Clean Surface (`oklch(99% 0.003 218)`) background, Night Tide text, `0.65rem 1.6rem` padding, `0.72rem` / 800 weight Manrope. This is the nav CTA and infra-strip button.
- **Hero:** Same fill as Primary, larger padding (`1rem 2.5rem`), body-size font (`0.88rem`). Used in the hero section where the button must hold its own against display-scale headlines.
- **CTA (Final Section):** Largest variant. `1.1rem 3rem` padding. Used on the Night Tide CTA section background.
- **Ghost Nav:** No background, no border. `0.72rem` Manrope 700, Clean Surface / 65% opacity on blue backgrounds. Transitions to full opacity on hover. Used for the "Entrar" secondary nav action.

**Hover treatment (Primary, Hero, CTA):** `translateY(-2px to -3px)` + brand-blue shadow glow. Easing: `cubic-bezier(0.16, 1, 0.3, 1)`. Duration: 250ms. No color change on hover; the lift is the signal.

**The Pill-Only Rule.** Interactive elements use `border-radius: 100px`. The surface rounded tokens (`0.75rem`, `2rem`) are for containers and mocks, never for buttons. Mixing radii on interactive elements signals inconsistency.

### Stat Row

The primary data primitive for comparison figures. A horizontal pair: uppercase label (left) + large tabular numeral (right), separated by a 1px Hairline border-bottom. The Vants highlight variant applies Trust Blue to both label and numeral.

- **Default:** Manrope 700 label at `0.72rem` / Worn Concrete; Inter 700 numeral at `2rem` / São Paulo Asphalt
- **Highlight (is-vants):** Both label and numeral in Trust Blue
- **Border:** 1px Hairline, top and bottom. Structural, not decorative.

### Loop Step (Signature Component)

The Core Loop section's editorial sequence. Three columns separated by 1px Hairline borders. Each step: large muted ordinal (Zain 900, `5.5rem`, Hairline color) as a spatial anchor, then title (Zain 800, `2.1rem`), body (Manrope 400, `0.92rem`, max 30ch), and a small uppercase note in Trust Blue below.

The ordinal at Hairline color reads as typographic decoration, not a competing element. It gives each step a spatial landmark without creating visual noise.

### App Mock (Signature Component)

The product's single UI artifact on the landing page. Dark card (`oklch(14% 0.008 218)` background, `2rem` border-radius) with three zones: balance header, activity feed, and live status bar.

- **Balance header:** Small Manrope label (`0.62rem`, Worn Concrete / 38%), large Inter tabular balance (`2.15rem`, Clean Surface), Inter gain in Compounding Green.
- **Rate pill:** `0.68rem` Inter, Compounding Green on green/12% background. This is the only badge in the system. Its placement inside the mock reads as app UI, not hero-metric decoration.
- **Activity feed:** Row list with name (Manrope 600, `0.85rem`) and timestamp (Manrope, `0.68rem`, 32% white). Debit amounts in 55% white; credit amounts in Compounding Green.
- **Live status bar:** Animated pulse dot (Compounding Green), uppercase Manrope status label, Inter tabular live rate. The pulse animation is the only animation in the system besides scroll reveals and hover transitions.

### Navigation

Fixed position. Two states: transparent (on hero blue) and Night Tide (on scroll). Logo: Zain 900, `2.25rem`, Clean Surface. Nav links: Manrope 700, `0.72rem`, uppercase, tracking 0.1em, 65% white → 100% white on hover. Nav CTA: Primary Button (pill). Ghost "Entrar" left of CTA.

Transition on scroll: `background` and `padding` over 450ms with `cubic-bezier(0.16, 1, 0.3, 1)`. The nav never goes white; it moves between transparent (on the blue hero) and Night Tide (off it). A white nav on a white page is invisible.

### Comparison Table

Full-width `border-collapse: separate`. Feature rows: label column (São Paulo Asphalt, Manrope 700) and competitor column (Worn Concrete, Manrope 400). Vants column: Morning Wash (`oklch(94% 0.036 218)`) background, Night Tide text, Inter tabular-nums, Manrope 700. Column header for Vants: same background with top-radius `0.75rem`; last row: bottom-radius `0.75rem`. This creates a unified "column card" visual without nested cards.

## 6. Do's and Don'ts

### Do:
- **Do** open every brand marketing surface with a full-bleed Committed Blue hero (`oklch(50% 0.125 218)` or deeper). The first impression is the brand color.
- **Do** apply `font-family: 'Inter'; font-variant-numeric: tabular-nums` to every financial figure, including percentages, returns, volume stats, and timestamps with numeric components.
- **Do** use Zain at weight 900 exclusively for display and headline roles. At body sizes Zain loses its character; Manrope carries everything below `2rem`.
- **Do** keep body copy max-width at 50ch for paragraphs. Lines longer than 65ch on a financial interface read as documentation, not product voice.
- **Do** use section labels (Manrope 800, `0.62rem–0.72rem`, ALL CAPS, tracking 0.3em) to set context before every headline. They cost almost no vertical space and remove the headline's need to be self-contained.
- **Do** reserve Compounding Green (`oklch(74% 0.13 155)`) exclusively for positive financial signals. Its rarity is its meaning.
- **Do** use `cubic-bezier(0.16, 1, 0.3, 1)` for all transitions (250ms for UI feedback, 450ms for large state changes like the nav). Ease-out exponential feels responsive; ease-in-out feels mechanical.
- **Do** keep the palette at H=218° for all non-green tokens. Blue chroma should reduce as lightness approaches extremes (borders and text carry chroma of 0.005–0.008; the hero carries 0.125).

### Don't:
- **Don't** use stock photography on brand marketing surfaces. The product brief explicitly rejects "crypto exchange" and "generic fintech" aesthetics; lifestyle stock images are the fastest path to both. Typography and data carry the visual voice.
- **Don't** apply italic to headings by default. Italic used on every heading is not a stylistic choice; it is the absence of a stylistic choice. Use it zero to two times per surface, for deliberate rhetorical emphasis only.
- **Don't** introduce a second accent color outside of Compounding Green. No coral, amber, purple, or warm red. The single-hue system is the brand; diluting it produces a generic fintech palette.
- **Don't** create identical card grids: same-sized cards with icon + heading + text, tiled in a 3-column grid. This is the Core Loop's previous failure. Differentiate through typography (step ordinals), layout variation, or flow sequences.
- **Don't** use the hero-metric template: a large number, small label, supporting stats below, with a gradient accent or badge. This is the SaaS cliché the PRODUCT.md brief explicitly rejects under "Dashboard overload."
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe. The stat row uses horizontal borders as structural separators; that is a structural choice. A colored side-stripe is a decorative choice that reads as template.
- **Don't** add ambient box-shadows to surfaces at rest (cards, section containers, stat rows). Flat surfaces read as deliberate; shadowed surfaces at rest read as scaffolded.
- **Don't** use blockchain cubes, neon glow, circuit patterns, coin illustrations, rocket ships, or any crypto visual language. Vants competes with Nubank and Revolut, not Binance. If a visual element would look correct on a crypto exchange, it is wrong here.
- **Don't** use gradient text (`background-clip: text` with a gradient fill). Use weight or size for emphasis; not color distortion.
- **Don't** use glassmorphism (frosted blur cards). It is decorative, not structural, and signals the exact "cool dark app" aesthetic the brief explicitly rejects.
- **Don't** reference DeFi, blockchain, smart contracts, gas fees, on-chain, seed phrases, wallet addresses, or protocol names in any copy. The technology is invisible; the interface competes with banking apps.
