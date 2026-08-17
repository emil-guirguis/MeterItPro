# /diagnose — Systematic Root Cause Analysis

**Usage:** `/diagnose <bug description>`

Before touching any code, rule out every layer below. Output the table, then propose fix only after confirmed root cause.

---

## Protocol

### Step 1 — Gather symptom
Read the error verbatim. Note: which service, which endpoint/component, what the actual vs expected value is.

### Step 2 — Rule out each layer in order

Run the commands for each layer. Mark status: ✅ Ruled Out | ⚠️ Suspected | 🔴 Confirmed

| # | Layer | Check Commands | Status |
|---|-------|---------------|--------|
| 1 | **Wrangler secrets vs .dev.vars** | `cat MeterItPro/api/.dev.vars`, `npx wrangler secret list` (prod) — compare key names and values | |
| 2 | **Root .env overriding service .env** | `cat .env`, `cat MeterItProSync/api/.env`, `cat MeterItProSync/frontend/.env`, `cat MeterItPro/api/.env` — check for duplicate keys | |
| 3 | **VS Code launch.json env override** | `cat .vscode/launch.json` — look for `env` blocks overriding vars set in .env files | |
| 4 | **Stale dist/ from missing clean** | Check `ls MeterItProSync/api/dist/ -lt` (newest files), compare timestamps to source edits. Check `package.json` for `clean` script using rimraf | |
| 5 | **SQL aggregation (GROUP BY losing data)** | Read the query — if using `MAX()`/`MIN()` with timestamps in GROUP BY, timestamps may be dropped. Prefer `DISTINCT ON (col) ORDER BY col, timestamp DESC` | |
| 6 | **Client-side lazy chunk load mistaken for server lag** | Check Network tab chunk timing. Look for dynamic `import()` in route files. Server logs will show no hit if it's client-side | |
| 7 | **MUI data-* on wrapper not root** | `grep -r "data-testid" MeterItProSync/frontend/src` — verify attribute is on the MUI component, not a wrapping `<div>` | |

### Step 3 — Output table

```
| Layer                        | Status        | Evidence |
|------------------------------|---------------|----------|
| Wrangler secrets vs .dev.vars| ✅ Ruled Out  | Keys match |
| Root .env override           | ⚠️ Suspected  | DB_URL defined in both root and MeterItProSync/api |
| launch.json override         | ✅ Ruled Out  | No env block |
| Stale dist/                  | ✅ Ruled Out  | dist newer than src |
| SQL aggregation              | ✅ Ruled Out  | No GROUP BY in query |
| Lazy chunk load              | ✅ Ruled Out  | Server logs show 500 |
| MUI data-* placement         | ✅ Ruled Out  | Not UI bug |
```

### Step 4 — State root cause in 2-3 sentences

Name the layer, the mechanism, and why the symptom follows from it.

### Step 5 — Propose fix, wait for approval

Do not edit code until user confirms diagnosis.

---

## Recurring Root Causes (historical)

1. **Wrangler secrets/dev.vars mismatch** — prod uses `wrangler secret`, local uses `.dev.vars`. Missing key in `.dev.vars` silently underfines env var in Worker.
2. **Root .env shadowing service .env** — dotenv loads root `.env` first; service-specific keys get overwritten if root also defines them.
3. **launch.json env block** — VS Code injects these at process start, overriding anything the app loads from disk.
4. **Stale dist/** — TypeScript compiled to `dist/` but `clean` script missing or not run; old JS runs instead of new TS. Use `rimraf dist` (not `rm -rf`) for Windows compat.
5. **GROUP BY losing timestamps** — `MAX(timestamp)` in SELECT with GROUP BY aggregates away the row. Fix: `DISTINCT ON (id) ORDER BY id, timestamp DESC`.
6. **Lazy chunk mistaken for server lag** — React dynamic imports cause waterfall on first load; no server log = client issue.
7. **MUI data-* on wrapper div** — MUI renders its own root element; `data-testid` on a wrapping `<div>` doesn't reach the component's DOM root.
