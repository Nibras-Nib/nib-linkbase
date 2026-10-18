# Linkbase UI: Components and Patterns

Reference implementations: `components/**/*.jsx` (props in `.d.ts`), styles in `tokens/components.css`. Tailwind classes use the config in `design-system.md`. **TBD** = not defined by the system.

Icons are all [Lucide](https://lucide.dev) (`lucide-react` in Next.js), with a 2px stroke, inheriting `currentColor`. Sizes: 16 inline / small buttons, 18 buttons, 20 default, 24 feature.

---

## Button
Height 48 / padding-x 22 / radius 14 / 16px semibold / 1.5px border / gap 8.

| Size | Height | Padding-x | Font | Radius | Icon |
|---|---|---|---|---|---|
| sm | 36 | 14 | 14px | 10 | 16 |
| md | 48 | 22 | 16px | 14 | 18 |
| lg | 56 | 28 | 17px | 14 | 18 |

| Variant | Rest | Hover | Pressed | Use |
|---|---|---|---|---|
| primary | `bg-clay-500 text-white` | `bg-clay-600` | `bg-clay-700` | One main action per view |
| dark | `bg-ink-900 text-cream-50` | `bg-ink-700` | — | Nav "Sign up free" |
| secondary | `bg-cream-200 text-ink-900` | `bg-sand-300` | — | "Log in", "Add link" |
| outline | `border-sand-300 text-ink-900` | `border-ink-900` | — | Low emphasis |
| ghost | transparent | `bg-overlay-hover` | — | Nav links |
| light | `bg-cream-50 text-ink-900` | `bg-white` | — | On colored sections |

States (all variants): press `scale(.97)` over 120ms; focus-visible `shadow-focus`, no outline; disabled `opacity-45`, no pointer events. Loading state: **TBD**.

```tsx
<button className="inline-flex items-center justify-center gap-2 h-12 px-[22px] rounded-md border-[1.5px] border-transparent
  bg-clay-500 text-white font-semibold text-body leading-none whitespace-nowrap
  transition duration-base ease-brand hover:bg-clay-600 active:bg-clay-700 active:scale-[.97]
  focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-45 disabled:pointer-events-none">
  Claim your link <ArrowRight size={18} />
</button>
```
Props: `variant`, `size`, `icon`, `iconRight`, `block` (full width), `disabled`, `href` (renders `<a>`).

## IconButton
Square, radius 14 (sm: 10). Sizes: sm 32 / md 40 / lg 48. Icon 16 (sm), 20 otherwise.

| Variant | Rest | Hover |
|---|---|---|
| soft (default) | `bg-cream-200` | `bg-sand-300` |
| ghost | transparent | `bg-overlay-hover` |
| dark | `bg-ink-900 text-cream-50` | `bg-ink-700` |
| outline | `bg-white border-[1.5px] border-sand-300` | `border-ink-900` |

Press `scale(.94)`. **`label` is required** and is used for `aria-label` and `title`.

## Input
Field 52px tall, padding-x 16, radius 14, fill `cream-200`, 1.5px transparent border, 16px medium text. Label is 14px semibold with a 6px gap. Hint is 13px `ink-500`.

| State | Style |
|---|---|
| Rest | `bg-cream-200` |
| Hover | `bg-[#ECE0CB]` |
| Focus (focus-within) | `bg-white border-clay-500 shadow-focus` |
| Error | `bg-white border-red-500`; hint turns `text-red-500` |
| Disabled | **TBD** |
| Tone `light` | `bg-white` at rest (for colored sections) |

`suffix` renders a node inside the field after the input (pulled 8px into the right padding), such as an icon button.

### PasswordInput
Client Component (`components/ui/password-input.tsx`) built on `Input`. Its `suffix` is a 40×40 ghost icon button (radius 10, 20px `Eye` / `EyeOff`, `text-fg-muted`, hover `bg-overlay-hover`) that switches the field between `type="password"` and `type="text"`. The button is `type="button"` so it never submits the form, has `aria-label` "Show password" / "Hide password" and `aria-pressed`, and shows `shadow-focus`. Each field toggles on its own. Use it for every password field, with `autoComplete` set to `current-password` on log-in and `new-password` on sign-up.

The prefix (e.g. `linkbase.me/`) is static text in `ink-500` inside the box. Placeholder is `ink-400`.
Error copy offers a fix: "That name is taken. Try mara.studio".

## Switch
Track 46×28, `rounded-full`. Thumb 22px white, inset 3px, `0 1px 3px rgba(42,33,24,.3)`.

| State | Track | Thumb |
|---|---|---|
| Off | `bg-sand-400` | x = 0 |
| On | `bg-olive-500` | x = 18px |
| Focus | `shadow-focus` | — |
| Disabled | `opacity-45`, not-allowed | — |

The thumb moves with `ease-spring` over 200ms. Render as `<button role="switch" aria-checked>`. An optional label sits to the right with a 12px gap, in 15px medium.

## Tabs
| Variant | Spec |
|---|---|
| underline | Gap 28, 1px `cream-200` bottom rule. Tab is 17px semibold, `ink-500` → `ink-900` on hover/selected. Selected bar is 2.5px `ink-900`, radius 2. |
| pill | Container `bg-cream-200 p-1 rounded-md gap-1`. Tab is 15px, padding 9×16, radius 10. Selected tab is `bg-white shadow-sm`. |

Markup: `role="tablist"`, each `role="tab"` + `aria-selected`. Arrow-key navigation: **TBD**.

## Avatar
Circle, `object-cover`. Fallback is up to 2 initials, 700 weight, font size = 38% of diameter, on `bg-clay-100 text-clay-700`.
Sizes: 32 list, 48 default, 72–96 profile header (88 in ProfileCard). `ring`: `0 0 0 3px cream-50, 0 0 0 5px clay-500`.

## Badge
Height 24, padding-x 10, `rounded-full`, 12px semibold, optional 13px leading icon with a 5px gap. Non-interactive.

| Tone | Classes | Use |
|---|---|---|
| neutral | `bg-cream-200 text-ink-700` | Draft |
| clay | `bg-clay-100 text-clay-700` | New |
| olive | `bg-olive-100 text-olive-700` | Available / success |
| ochre | `bg-ochre-100 text-ochre-700` | Pro / warning |
| dark | `bg-ink-900 text-cream-50` | Hidden |

## Card
Radius 20, default padding 24, `bg-white`.

| Variant | Style |
|---|---|
| default | 1px `cream-200` border |
| raised | No border, `shadow-md` |
| sunken | `bg-cream-200`, no border |
| `interactive` | Hover `-translate-y-0.5 shadow-md`, 200ms |

## LinkButton (profile link row)
Full width, min-height 58, padding 8×48, radius 14, 16px semibold, line-height 1.25, title centered. Rest `bg-white shadow-sm`.

| Variant | Style |
|---|---|
| filled | `bg-white shadow-sm` |
| outline | Transparent, 1.5px `ink-900` border, no shadow. Hover `bg-overlay-hover`. |
| accent | `bg-clay-500 text-white`. Use for **one** featured link only. |

States: hover lift 2px + `shadow-md`; press `scale(.985)`; focus `shadow-focus` (**TBD**: not styled in source; add it).
Slots: thumb 42×42 at left 8px, radius 10, `bg-clay-100` with a 20px icon or `<img>`. "More" kebab is 32×32 at right 10px, `ink-500`, and must not trigger navigation.
Keep the title centered even when a thumb is present: the slots are absolutely positioned.

## ProfileCard (public profile)
Width 340 (configurable), `bg-cream-100`, radius 28, padding 20/18/22, `shadow-lg`, centered column with a 16px gap.
Order:
1. Top bar: wordmark chip (34px tall, white, radius 10, 12px bold) and share button (34×34)
2. Avatar 88
3. Name 20px bold, -0.015em
4. Handle in mono 13px `ink-500`, prefixed `@`
5. Bio 14px, 1.45, `ink-700`
6. Social icons 20px, gap 14
7. Links stack, gap 10
8. Footer "Made with Linkbase", 12px `ink-500`

Themes: one default (cream). Theme switching is **TBD**. Full-page (non-card) profile layout: **TBD**; use the same column at max-width ~560px.

## Accordion (FAQ)
Separate rows, gap 10, each radius 20. Header padding 20×24, 17px semibold, chevron 20px rotates 180° when open. Body padding 0 24 22, 16px, line-height 1.55.

| Tone | Row | Hover | Body text |
|---|---|---|---|
| light | `bg-white` | `bg-overlay-hover` | `ink-700` |
| dark | `bg-[rgba(251,247,240,.08)] text-cream-50` | `bg-[rgba(251,247,240,.06)]` | `sand-300` |

`single` (default true) allows only one row open at a time. Header is a `<button aria-expanded>`. Open/close height animation: **TBD** (currently instant).

---

## Layout patterns

### Page shell (marketing)
- Container `max-w-container mx-auto px-6`.
- Full-bleed color sections, vertical padding 112px, in the order olive → clay → cream → ochre → bark → olive. Text and accent pairings are listed in `design-system.md`.
- The hero adds top padding (168px) for the floating nav.

### Floating nav
`sticky top-3`, z-10, 68px tall, `bg-cream-50 rounded-lg shadow-md`, padding `0 12px 0 24px`, gap 28. Contents: wordmark (24px / 800 / -0.035em), ghost `sm` links, then secondary "Log in" and dark "Sign up free". Mobile menu: **TBD**.

### Split block
Two columns, visual and copy, gap 64, `items-center`, wraps via `repeat(auto-fit, minmax(min(100%,420px),1fr))`. Copy column: display-m headline (`text-wrap: balance`), body-l paragraph (max-width 480), one button. Alternate sides with `reverse`.

### Username claim
Input (`prefix="linkbase.me/"`, tone light) and an `lg` primary button in a flex row with a 10px gap that wraps. Success replaces the form with a cream-50 card (radius 20, padding 20), an olive "Available" badge, the mono URL and a dark "Continue" button. Server validation rules: **TBD** (the demo allows `a-z 0-9 . _`).

### Footer
Cream-50 card, radius 28, padding 40, inside the olive band with 24px side and bottom padding. Grid `repeat(auto-fit,minmax(140px,1fr))`, gap 32. A 1px `cream-200` divider sits above the copyright line (13px `ink-500`).

### Product preview tilt
Hero preview may be rotated 2°. Use it once per page.

### Not defined
Onboarding flow, dashboard editor layout, settings, and modal/dialog, toast, tooltip and dropdown components are all **TBD**.

---

## Accessibility
- **Contrast:** text on clay-500 must be white. On ochre-500 and cream backgrounds use ink-900. On olive-700 and bark-900 use cream-50. Don't put ink-500 muted text on sunken or colored fills below 4.5:1. Verify any new pairing.
- **Focus:** every interactive element shows `shadow-focus` on `:focus-visible`. Never remove focus without a replacement.
- **Targets:** minimum 44×44 on touch. IconButton `sm` (32) and the LinkButton kebab (32) are below this; pad the hit area on mobile.
- **Labels:** IconButton requires `aria-label`. Inputs use a wrapping `<label>`; if no visible label is shown, supply `aria-label`. Decorative icons get `aria-hidden="true"`.
- **Semantics:** Switch uses `role="switch"` + `aria-checked`. Tabs use `tablist`/`tab` + `aria-selected`. Accordion headers are buttons with `aria-expanded`. LinkButtons are real `<a href>`.
- **Errors:** connect the hint to the input with `aria-describedby` and set `aria-invalid` (**TBD** in source; add it).
- **Motion:** respect `prefers-reduced-motion` by disabling lift, scale and the tilt (**TBD** in source).
- **Avatars:** `alt` = person's name; the initials fallback should expose the name to screen readers.
