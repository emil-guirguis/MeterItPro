# Automatic Version Numbering System

This project uses an automatic version numbering system inspired by Tesla's versioning format.

## Version Format

**Format:** `YYYY.WW.B`

- **YYYY**: Current year (e.g., 2025)
- **WW**: ISO week number (01-53)
- **B**: Build number (increments for each build in the same week)

**Example:** `2025.47.3`
- Year: 2025
- Week: 47 (47th week of the year)
- Build: 3 (third build this week)

## How It Works

### 1. Version Generation

The version is automatically generated during the build process:

```bash
npm run build
```

This runs the `prebuild` script which executes `scripts/generate-version.mjs`:
- Calculates the current year and ISO week number
- Reads the existing `version.json` file (if it exists)
- If building in the same week, increments the build number
- If a new week, resets the build number to 1
- Writes the new version to `version.json`

### 2. Build-Time Injection

The Vite plugin (`client/frontend/vite-plugins/version-plugin.ts`) reads the `version.json` file and injects the version into the application at build time via environment variables:

- `import.meta.env.VITE_APP_VERSION`: The version string (e.g., "2025.47.3")
- `import.meta.env.VITE_APP_VERSION_INFO`: Full version metadata (JSON string)

### 3. Runtime Access

The version is displayed in the user menu dropdown in the header. The framework provides utilities to access the version:

**Framework utility** (`framework/frontend/shared/utils/version.ts`):
```typescript
import { getAppVersion, formatVersion } from '@framework/shared/utils/version';

const version = getAppVersion(); // "2025.47.3" or "dev"
const formatted = formatVersion(version); // "v2025.47.3" or "Development"
```

**Client utility** (`client/frontend/src/utils/version.ts`):
```typescript
import { getVersion, getVersionInfo, getVersionDisplay } from './utils/version';

const version = getVersion(); // "2025.47.3"
const info = getVersionInfo(); // Full version object with metadata
const display = getVersionDisplay(); // "v2025.47.3 (November 20, 2025, 10:30 AM)"
```

## Files

### Core Files

- **`scripts/generate-version.mjs`**: Version generation script
- **`version.json`**: Generated version file (git-ignored)
- **`client/frontend/vite-plugins/version-plugin.ts`**: Vite plugin for build-time injection

### Utility Files

- **`framework/frontend/shared/utils/version.ts`**: Framework version utility
- **`client/frontend/src/utils/version.ts`**: Client version utility with extended features

### Configuration

- **`client/frontend/src/vite-env.d.ts`**: TypeScript declarations for environment variables

## Development vs Production

### Development Mode
- Version displays as "Development" or "dev"
- No version file is required
- Useful for local development

### Production Build
- Version is automatically generated and injected
- Displays as "v2025.47.3" format
- Build number increments automatically

## Manual Version Generation

You can manually generate a version without building:

```bash
node scripts/generate-version.mjs
```

This creates/updates the `version.json` file in the project root.

## Version File Format

The `version.json` file contains:

```json
{
  "version": "2025.47.3",
  "year": 2025,
  "week": 47,
  "build": 3,
  "timestamp": "2025-11-20T15:30:00.000Z",
  "date": "November 20, 2025, 10:30 AM"
}
```

## Git Configuration

The `version.json` file should be added to `.gitignore` since it's generated during builds:

```gitignore
# Version file (auto-generated)
version.json
```

## Continuous Integration

In CI/CD pipelines, the version is automatically generated during the build step:

```yaml
- name: Build
  run: npm run build
  # This automatically runs prebuild which generates the version
```

## Customization

### Change Version Format

Edit `scripts/generate-version.mjs` to modify the version format:

```javascript
const version = `${year}.${week}.${buildNumber}`;
```

### Add Version to Other Locations

Import the version utility anywhere in your application:

```typescript
import { getVersion } from './utils/version';

console.log(`App version: ${getVersion()}`);
```

## Troubleshooting

### Version shows as "dev" in production

- Ensure `prebuild` script runs before build
- Check that `version.json` exists in project root
- Verify Vite plugin is properly configured

### Build number doesn't increment

- Delete `version.json` and rebuild
- Check system date/time is correct
- Verify week calculation in `generate-version.mjs`

### TypeScript errors with import.meta.env

- Ensure `vite-env.d.ts` is included in your `tsconfig.json`
- Restart TypeScript server in your IDE
