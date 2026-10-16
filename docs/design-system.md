# Linkbase Design System: Foundations

Source of truth: `tokens/*.css` in this project. Tailwind class names assume the `tailwind.config` extension at the bottom of this file. Values marked **TBD** are not defined by the system.

## Colors

### Clay (primary accent)
| Token | Hex | Tailwind | Use |
|---|---|---|---|
| clay-50 | `#FBF1EB` | `bg-clay-50` | Tint |
| clay-100 | `#F4DCCF` | `bg-clay-100` | Accent soft fill, avatar fallback |
| clay-300 | `#E0A083` | `bg-clay-300` | Decorative |
| clay-500 | `#B5532F` | `bg-clay-500` | Primary button, featured link, clay section |
| clay-600 | `#9E4626` | `bg-clay-600` | Primary hover, accent headline on cream |
| clay-700 | `#823820` | `bg-clay-700` | Primary pressed, text on clay-100 |
| clay-900 | `#4A1F12` | `bg-clay-900` | TBD |

### Olive (secondary brand / success)
| Token | Hex | Tailwind | Use |
|---|---|---|---|
| olive-50 | `#F2F3E6` | `bg-olive-50` | Tint |
| olive-100 | `#E3E6CC` | `bg-olive-100` | Success soft fill |
| olive-300 | `#B5BE84` | `text-olive-300` | Small text on olive-700 |
| olive-500 | `#6B7A3A` | `bg-olive-500` | Switch on, chart bars |
| olive-600 | `#5A682F` | `text-olive-600` | Success |
| olive-700 | `#46521F` | `bg-olive-700` | Hero and closing sections |
| olive-900 | `#262D10` | `bg-olive-900` | TBD |

### Ochre and Bark
| Token | Hex | Tailwind | Use |
|---|---|---|---|
| ochre-100 | `#F6E6BF` | `bg-ochre-100` | Warning soft fill |
| ochre-300 | `#EBC572` | `text-ochre-300` | Headline on bark |
| ochre-500 | `#D9A441` | `bg-ochre-500` | Ochre section |
| ochre-700 | `#8F6519` | `text-ochre-700` | Warning |
| bark-700 | `#5A3F2E` | `bg-bark-700` | TBD |
| bark-900 | `#3B2A1E` | `bg-bark-900` | FAQ section |

### Neutrals (warm)
| Token | Hex | Tailwind | Use |
|---|---|---|---|
| white | `#FFFFFF` | `bg-white` | Cards, link buttons |
| cream-50 | `#FBF7F0` | `bg-cream-50` | Nav bar, raised surface, text on dark |
| cream-100 | `#F6EFE2` | `bg-cream-100` | Page background |
| cream-200 | `#EFE5D3` | `bg-cream-200` | Sunken surface, field fill, subtle border |
| sand-300 | `#E0D2BA` | `border-sand-300` | Default border, secondary hover |
| sand-400 | `#C9B89C` | `bg-sand-400` | Switch off |
| ink-400 | `#9A8C7E` | `text-ink-400` | Placeholder |
| ink-500 | `#6F6154` | `text-ink-500` | Muted text |
| ink-700 | `#4A3D31` | `text-ink-700` | Secondary text, dark hover |
| ink-900 | `#2A2118` | `text-ink-900` | Primary text, dark button |

### Feedback
| Token | Hex | Tailwind |
|---|---|---|
| red-100 | `#F5D8D0` | `bg-red-100` |
| red-500 | `#B03A28` | `text-red-500` |

### Semantic aliases
| Alias | Maps to | Tailwind |
|---|---|---|
| bg-page | cream-100 | `bg-page` |
| surface-card / raised / sunken / inverse | white / cream-50 / cream-200 / ink-900 | `bg-surface-card` etc. |
| text-primary / secondary / muted / inverse / on-accent | ink-900 / ink-700 / ink-500 / cream-50 / white | `text-fg-primary` etc. |
| border-subtle / default / strong | cream-200 / sand-300 / ink-900 | `border-line-subtle` etc. |
| accent / hover / press / soft | clay-500 / 600 / 700 / 100 | `bg-accent`, `hover:bg-accent-hover` |
| success / warning / danger | olive-600 / ochre-700 / red-500 | `text-success` etc. |
| success-soft / warning-soft / danger-soft | olive-100 / ochre-100 / red-100 | `bg-success-soft` etc. |
| overlay-hover / press | `rgba(42,33,24,.06)` / `.10` | `hover:bg-overlay-hover` |

### Section pairings (marketing bands)
| Section | Background | Text | Accent headline |
|---|---|---|---|
| Olive | olive-700 | cream-50 | — |
| Clay | clay-500 | white | — |
| Cream | cream-100 | ink-900 | clay-600 |
| Ochre | ochre-500 | ink-900 | — |
| Bark | bark-900 | cream-50 | ochre-300 |

Dark mode: **TBD**.

## Typography

Fonts (Google Fonts, load with `next/font/google`):
- Sans: **Commissioner** 400/500/600/700/800. Fallback `"Source Sans 3", "Segoe UI", system-ui, sans-serif`
- Mono: **DM Mono** 400/500. Use for URLs, handles, numbers in data.

| Token | Size | Weight | Line-height | Tracking | Tailwind |
|---|---|---|---|---|---|
| display-xl | 76px | 800 | 0.98 | -0.03em | `text-display-xl` |
| display-l | 60px | 800 | 1.0 | -0.03em | `text-display-l` |
| display-m | 44px | 800 | 1.02 | -0.03em | `text-display-m` |
| h1 | 34px | 700 | 1.15 | -0.015em | `text-h1` |
| h2 | 26px | 700 | 1.15 | -0.015em | `text-h2` |
| h3 | 20px | 700 | 1.15 | -0.015em | `text-h3` |
| body-l | 18px | 400 | 1.5 | 0 | `text-body-l` |
| body | 16px | 400/500 | 1.5 | 0 | `text-body` |
| body-s | 14px | 400/600 | 1.5 | 0 | `text-body-s` |
| caption | 12px | 400/600 | 1.5 | 0 | `text-caption` |

- Caps tracking: `0.08em` (mono labels only).
- Responsive type scaling: **TBD**.

## Spacing (4px base)
| Token | px | Tailwind (default scale) |
|---|---|---|
| space-1 | 4 | `p-1` |
| space-2 | 8 | `p-2` |
| space-3 | 12 | `p-3` |
| space-4 | 16 | `p-4` |
| space-5 | 20 | `p-5` |
| space-6 | 24 | `p-6` |
| space-8 | 32 | `p-8` |
| space-10 | 40 | `p-10` |
| space-12 | 48 | `p-12` |
| space-16 | 64 | `p-16` |
| space-20 | 80 | `p-20` |
| space-30 | 120 | `p-30` (custom) |

Layout constants: container `1200px` (`max-w-container`), page gutter 24px, nav height 68px, marketing section padding 112px vertical.

## Radius
| Token | px | Tailwind | Use |
|---|---|---|---|
| xs | 6 | `rounded-xs` | Inner details |
| sm | 10 | `rounded-sm` | Small button, link thumb |
| md | 14 | `rounded-md` | **Default**: buttons, fields, link rows |
| lg | 20 | `rounded-lg` | Cards, FAQ rows, nav bar |
| xl | 28 | `rounded-xl` | Profile card, footer card |
| full | 999 | `rounded-full` | Badges, avatars, switch |

## Shadows (warm ink tint)
| Token | Value | Tailwind | Use |
|---|---|---|---|
| sm | `0 1px 2px rgba(42,33,24,.08), 0 0 0 1px rgba(42,33,24,.04)` | `shadow-sm` | Resting link rows |
| md | `0 8px 24px -8px rgba(42,33,24,.20)` | `shadow-md` | Hover, raised card, nav |
| lg | `0 28px 56px -20px rgba(42,33,24,.32)` | `shadow-lg` | Hero profile preview |
| focus | `0 0 0 3px rgba(181,83,47,.32)` | `shadow-focus` | Focus ring |

## Breakpoints
**TBD.** The system defines none. Current layouts reflow without fixed breakpoints:
- Split blocks: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr))`
- Hero: same pattern with 440px minimum
- Footer: `repeat(auto-fit, minmax(140px, 1fr))`

Until breakpoints are defined, use Tailwind defaults (`sm 640`, `md 768`, `lg 1024`, `xl 1280`).

## Motion
| Token | Value | Tailwind | Use |
|---|---|---|---|
| dur-fast | 120ms | `duration-fast` | Press scale |
| dur | 200ms | `duration-base` | Hover color, lift |
| dur-slow | 360ms | `duration-slow` | Section reveal |
| ease-out | `cubic-bezier(.2,.8,.2,1)` | `ease-brand` | Default |
| ease-spring | `cubic-bezier(.34,1.4,.64,1)` | `ease-spring` | Switch thumb only |

Patterns:
- Hover lift: `-translate-y-0.5` + `shadow-md` (link rows, interactive cards)
- Press: `active:scale-[.97]` buttons, `active:scale-[.985]` link rows
- Reveal: fade + 8–12px rise (optional)
- `prefers-reduced-motion` handling: **TBD** (recommend disabling transforms)

## Tailwind config
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        clay:  { 50:'#FBF1EB',100:'#F4DCCF',300:'#E0A083',500:'#B5532F',600:'#9E4626',700:'#823820',900:'#4A1F12' },
        olive: { 50:'#F2F3E6',100:'#E3E6CC',300:'#B5BE84',500:'#6B7A3A',600:'#5A682F',700:'#46521F',900:'#262D10' },
        ochre: { 100:'#F6E6BF',300:'#EBC572',500:'#D9A441',700:'#8F6519' },
        bark:  { 700:'#5A3F2E',900:'#3B2A1E' },
        cream: { 50:'#FBF7F0',100:'#F6EFE2',200:'#EFE5D3' },
        sand:  { 300:'#E0D2BA',400:'#C9B89C' },
        ink:   { 400:'#9A8C7E',500:'#6F6154',700:'#4A3D31',900:'#2A2118' },
        red:   { 100:'#F5D8D0',500:'#B03A28' },
        page: '#F6EFE2',
        surface: { card:'#FFFFFF', raised:'#FBF7F0', sunken:'#EFE5D3', inverse:'#2A2118' },
        fg: { primary:'#2A2118', secondary:'#4A3D31', muted:'#6F6154', inverse:'#FBF7F0', 'on-accent':'#FFFFFF' },
        line: { subtle:'#EFE5D3', DEFAULT:'#E0D2BA', strong:'#2A2118' },
        accent: { DEFAULT:'#B5532F', hover:'#9E4626', press:'#823820', soft:'#F4DCCF' },
        success: { DEFAULT:'#5A682F', soft:'#E3E6CC' },
        warning: { DEFAULT:'#8F6519', soft:'#F6E6BF' },
        danger:  { DEFAULT:'#B03A28', soft:'#F5D8D0' },
        overlay: { hover:'rgba(42,33,24,.06)', press:'rgba(42,33,24,.10)' },
      },
      fontFamily: {
        sans: ['var(--font-commissioner)', '"Source Sans 3"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['76px', { lineHeight: '0.98', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-l':  ['60px', { lineHeight: '1',    letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-m':  ['44px', { lineHeight: '1.02', letterSpacing: '-0.03em', fontWeight: '800' }],
        h1: ['34px', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '700' }],
        h2: ['26px', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '700' }],
        h3: ['20px', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '700' }],
        'body-l': ['18px', '1.5'], body: ['16px', '1.5'], 'body-s': ['14px', '1.5'], caption: ['12px', '1.5'],
      },
      spacing: { 30: '120px' },
      maxWidth: { container: '1200px' },
      borderRadius: { xs:'6px', sm:'10px', md:'14px', lg:'20px', xl:'28px', full:'999px' },
      boxShadow: {
        sm: '0 1px 2px rgba(42,33,24,.08), 0 0 0 1px rgba(42,33,24,.04)',
        md: '0 8px 24px -8px rgba(42,33,24,.20)',
        lg: '0 28px 56px -20px rgba(42,33,24,.32)',
        focus: '0 0 0 3px rgba(181,83,47,.32)',
      },
      transitionDuration: { fast: '120ms', base: '200ms', slow: '360ms' },
      transitionTimingFunction: { brand: 'cubic-bezier(.2,.8,.2,1)', spring: 'cubic-bezier(.34,1.4,.64,1)' },
    },
  },
};
```
