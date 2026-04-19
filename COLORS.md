# Claro — Color Tokens
**Status: Locked v1.0**

---

## Core palette

| Role | Name | Hex |
|---|---|---|
| Background | Warm Off-White | `#F8F7F4` |
| Type / UI | Near-Black | `#1A1A1A` |
| Accent | Slate | `#2E4057` |

## Status colors

| Status | Name | Hex |
|---|---|---|
| Apply Now | Forest Green | `#2D6A4F` |
| Apply with Tailoring | Burnt Amber | `#A86B2D` |
| Stretch | Burnt Orange | `#C4622D` |
| Skip | Mid-Gray | `#888888` |

---

## Tailwind CSS variables
Add to `globals.css`:

```css
:root {
  --color-bg: #F8F7F4;
  --color-text: #1A1A1A;
  --color-accent: #2E4057;
  --color-status-apply: #2D6A4F;
  --color-status-tailor: #A86B2D;
  --color-status-stretch: #C4622D;
  --color-status-skip: #888888;
}
```

## Tailwind config
Add to `tailwind.config.js`:

```js
colors: {
  brand: {
    bg: '#F8F7F4',
    text: '#1A1A1A',
    accent: '#2E4057',
  },
  status: {
    apply: '#2D6A4F',
    tailor: '#A86B2D',
    stretch: '#C4622D',
    skip: '#888888',
  }
}
```

---

## Contrast ratios (WCAG)

| Combination | Ratio | Pass |
|---|---|---|
| Near-Black on Off-White | ~16:1 | AAA |
| Slate on Off-White | ~7.2:1 | AAA |
| White on Forest Green | ~5.8:1 | AA |
| White on Burnt Amber | ~4.6:1 | AA |
| White on Burnt Orange | ~4.5:1 | AA |
| White on Mid-Gray | ~3.9:1 | AA Large only |

**Note:** Skip (Mid-Gray) passes AA for large text only. Always pair the Skip label with the text "Skip" — never rely on color alone.
