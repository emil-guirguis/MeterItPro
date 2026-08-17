# Design Document: Unused Libraries Cleanup

## Overview

This design outlines the systematic removal of unused npm packages, dead code files, and orphaned imports from the entire solution. The cleanup spans all workspaces and will reduce dependencies, improve build times, and simplify maintenance.

## Audit Results

### Backend (client/backend/package.json)

**Potentially Unused Packages**:
- `qrcode` - Only used in TwoFactorService.js for generating QR codes (USED)
- `speakeasy` - Only used in TwoFactorService.js for TOTP generation (USED)
- `isomorphic-dompurify` - Only used in TemplateRenderer.js for email sanitization (USED)
- `node-fetch` - Check if actually used in codebase (AUDIT NEEDED)
- `multer` - Check if used for file uploads (AUDIT NEEDED)

**Confirmed Used**:
- express, cors, helmet, dotenv, pg, bcryptjs, jsonwebtoken, winston, node-cron, express-validator, joi, express-rate-limit, nodemailer

### Frontend (MeterItPro/frontend/package.json)

**Potentially Unused Packages**:
- `@microlink/react-json-view` - Used in framework/frontend/components/jsonbfield/JSONBField.tsx (USED)
- `react-grid-layout` - Used in framework/frontend/dashboards/components/DashboardPage.tsx (USED)
- `react-resizable` - Used with react-grid-layout (USED)
- `immer` - Check if used in state management (AUDIT NEEDED)
- `mui-tel-input` - Check if used in forms (AUDIT NEEDED)

**Confirmed Used**:
- react, react-dom, react-router-dom, axios, zustand, @mui/material, @mui/icons-material, @emotion/react, @emotion/styled, recharts

### Client MCP (MeterItPro/mcp/package.json)

**Potentially Unused Packages**:
- All packages appear to be used (AUDIT NEEDED)

### Sync MCP (MeterItProSync/mcp/package.json)

**Potentially Unused Packages**:
- All packages appear to be used (AUDIT NEEDED)

### Framework Frontend (framework/frontend/package.json)

**Potentially Unused Packages**:
- `recharts` - Version mismatch with MeterItPro/frontend (2.10.0 vs 3.6.0) - NEEDS ALIGNMENT

## Architecture

### Current Architecture

The solution has multiple workspaces with their own package.json files:
- `client/backend` - Node.js Express backend
- `MeterItPro/frontend` - React TypeScript frontend
- `MeterItPro/mcp` - Client MCP server
- `MeterItProSync/mcp` - Sync MCP server
- `MeterItProSync/frontend` - Sync frontend
- `framework/frontend` - Shared framework components

### Target Architecture

After cleanup:
- All unused npm packages removed from package.json files
- All dead code files removed from the codebase
- All orphaned imports removed
- All workspaces have minimal, focused dependencies
- Version consistency across workspaces where applicable

## Components and Interfaces

### Files to Audit for Dead Code

**Backend**:
- `client/backend/src/services/` - Check for unused service files
- `client/backend/src/routes/` - Check for unused route files
- `client/backend/src/utils/` - Check for unused utility files
- `client/backend/src/helpers/` - Check for unused helper files

**Frontend**:
- `MeterItPro/frontend/src/services/` - Check for unused service files
- `MeterItPro/frontend/src/components/` - Check for unused component files
- `MeterItPro/frontend/src/hooks/` - Check for unused hook files
- `MeterItPro/frontend/src/utils/` - Check for unused utility files

**Framework**:
- `framework/frontend/components/` - Check for unused component files
- `framework/frontend/hooks/` - Check for unused hook files
- `framework/frontend/utils/` - Check for unused utility files

### Packages to Audit

**Backend**:
1. `node-fetch` - Search for usage in codebase
2. `multer` - Search for usage in codebase
3. `qrcode` - Confirmed used in TwoFactorService
4. `speakeasy` - Confirmed used in TwoFactorService
5. `isomorphic-dompurify` - Confirmed used in TemplateRenderer

**Frontend**:
1. `immer` - Search for usage in state management
2. `mui-tel-input` - Search for usage in forms
3. `@microlink/react-json-view` - Confirmed used in JSONBField
4. `react-grid-layout` - Confirmed used in DashboardPage
5. `react-resizable` - Confirmed used with react-grid-layout

**Framework**:
1. `recharts` - Version mismatch with frontend (2.10.0 vs 3.6.0)

## Correctness Properties

### Property 1: No Unused npm Packages

**Validates: Requirements 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2**

*For any* npm package declared in package.json, the package SHALL be imported and used in the codebase, OR the package SHALL be removed from package.json.

### Property 2: No Dead Code Files

**Validates: Requirements 5.1, 5.2**

*For any* code file in the codebase, the file SHALL be imported by at least one other module, OR the file SHALL be removed from the codebase.

### Property 3: No Broken Imports

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

*For any* import statement in the codebase, the imported module SHALL exist and be available, OR the import SHALL be removed.

### Property 4: All Builds Succeed

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

*For any* workspace in the solution, the build process SHALL complete successfully without errors or warnings related to missing modules.

### Property 5: Application Functionality Preserved

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

*For any* feature in the application, the feature SHALL function correctly after cleanup, with no regressions or missing functionality.

## Error Handling

### Audit Errors

**Missing Imports**:
- If a package is removed but still imported, the build will fail with "Cannot find module" error
- Resolution: Add the package back or remove the import

**Dead Code Detection**:
- If a file is removed but still imported, the build will fail with "Cannot find module" error
- Resolution: Add the file back or remove the import

### Build Errors

**TypeScript Errors**:
- If types are missing after package removal, TypeScript will report errors
- Resolution: Add the package back or update type definitions

**Runtime Errors**:
- If code is missing after file removal, the application will throw errors at runtime
- Resolution: Add the file back or update imports

## Testing Strategy

### Unit Testing

**Package Audit**:
- Verify that all packages in package.json are imported in the codebase
- Verify that no packages are imported from node_modules that are not in package.json

**Dead Code Detection**:
- Verify that all code files are imported by at least one other module
- Verify that no files are orphaned or unreachable

**Import Verification**:
- Verify that all import statements reference existing modules
- Verify that no import statements reference deleted modules

### Build Verification

**Frontend Build**:
- Run `npm run build` in MeterItPro/frontend
- Verify no errors or warnings
- Verify bundle size is reduced

**Backend Build**:
- Run `npm run build` in client/backend (if applicable)
- Verify no errors or warnings

**MCP Builds**:
- Run `npm run build` in MeterItPro/mcp
- Run `npm run build` in MeterItProSync/mcp
- Verify no errors or warnings

**Framework Build**:
- Run `npm run build` in framework/frontend
- Verify no errors or warnings

### Integration Testing

**Application Startup**:
- Start the backend server
- Verify no errors related to missing modules
- Verify all endpoints are accessible

**Frontend Functionality**:
- Load the frontend application
- Verify all pages load correctly
- Verify all features work as expected

**MCP Server Functionality**:
- Start the MCP servers
- Verify all tools are available
- Verify all tools function correctly

## Implementation Notes

### Removal Order

1. **Audit Phase**: Identify all unused packages and dead code files
2. **Package Removal**: Remove unused packages from package.json files
3. **Dead Code Removal**: Remove dead code files from the codebase
4. **Import Cleanup**: Remove orphaned imports
5. **Build Verification**: Verify all builds succeed
6. **Functionality Verification**: Verify application functionality is preserved

### Audit Checklist

**Backend Packages**:
- [ ] Audit `node-fetch` usage
- [ ] Audit `multer` usage
- [ ] Confirm `qrcode` usage
- [ ] Confirm `speakeasy` usage
- [ ] Confirm `isomorphic-dompurify` usage

**Frontend Packages**:
- [ ] Audit `immer` usage
- [ ] Audit `mui-tel-input` usage
- [ ] Confirm `@microlink/react-json-view` usage
- [ ] Confirm `react-grid-layout` usage
- [ ] Confirm `react-resizable` usage

**Framework Packages**:
- [ ] Align `recharts` version with frontend

**Dead Code Files**:
- [ ] Scan backend services for unused files
- [ ] Scan backend routes for unused files
- [ ] Scan frontend components for unused files
- [ ] Scan frontend hooks for unused files
- [ ] Scan framework components for unused files

### Verification Checklist

- [ ] All unused packages removed from package.json
- [ ] All dead code files removed from codebase
- [ ] All orphaned imports removed
- [ ] Frontend build succeeds
- [ ] Backend build succeeds
- [ ] MCP builds succeed
- [ ] Framework build succeeds
- [ ] Application starts without errors
- [ ] All features work correctly
- [ ] No console errors on startup

</content>
</invoke>