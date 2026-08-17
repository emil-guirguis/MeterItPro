# Design System Changes — Apply to Codebase

Generated: April 2026  
Source: MeterIt Pro Design System (this project)

Copy each file below into your `MeterItPro/` codebase at the matching path.

---

## Files changed

### 1. New logo mark
**What changed:** Redesigned from a gauge/dial face to a rising bar chart with a cyan lightning bolt accent.

| File in this folder | Copy to codebase |
|---|---|
| `MeterItPro/frontend/src/assets/meteritpro-logo.svg` | `MeterItPro/MeterItPro/frontend/src/assets/meteritpro-logo.svg` |
| `MeterItPro/frontend/public/favicon.svg` | `MeterItPro/MeterItPro/frontend/public/favicon.svg` |

> The sync console doesn't ship its own logo — it references the client app's. No sync changes needed.

---

### 2. Table header font size (muiTheme.ts)
**What changed:** `MuiTableHead` cell `fontSize` reduced from `0.8125rem` (13px) → `0.6875rem` (11px). `letterSpacing` tightened from `0.02em` → `0.04em` to match the smaller size.

| File in this folder | Copy to codebase |
|---|---|
| `MeterItPro/frontend/src/theme/muiTheme.ts` | `MeterItPro/MeterItPro/frontend/src/theme/muiTheme.ts` |

**Diff (if you prefer to apply manually):**
```diff
- fontSize: '0.8125rem',
- letterSpacing: '0.02em',
+ fontSize: '0.6875rem',   // 11px
+ letterSpacing: '0.04em',
```

---

## No other files changed

All other design system decisions (colors, input focus, sidebar states, spacing, shadows) matched the existing codebase exactly and required no changes.

---

## How to copy

**Option A — drag and drop:** Open this `apply/` folder in your file manager and drag files into your codebase at the paths above.

**Option B — terminal:**
```bash
# From MeterItPro/ root:
cp <path-to-design-system>/apply/MeterItPro/frontend/src/assets/meteritpro-logo.svg \
   MeterItPro/frontend/src/assets/meteritpro-logo.svg

cp <path-to-design-system>/apply/MeterItPro/frontend/public/favicon.svg \
   MeterItPro/frontend/public/favicon.svg

cp <path-to-design-system>/apply/MeterItPro/frontend/src/theme/muiTheme.ts \
   MeterItPro/frontend/src/theme/muiTheme.ts
```

After copying, rebuild the frontend: `npm run build` in `MeterItPro/frontend/`.
