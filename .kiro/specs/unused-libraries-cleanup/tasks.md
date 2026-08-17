# Implementation Plan: Unused Libraries Cleanup

## Overview

This implementation plan breaks down the unused libraries cleanup into discrete, actionable tasks. Each task focuses on auditing and removing unused packages and dead code from specific workspaces. The plan follows a logical order: audit first, then remove, then verify.

## Tasks

- [x] 1. Audit Backend npm Packages
  - ✅ `node-fetch` - USED in QueryParser.ts and EmbeddingsService.ts for OpenAI API calls
  - ✅ `multer` - USED in middleware/upload.js for file uploads
  - ✅ `qrcode` - USED in TwoFactorService.js for QR code generation
  - ✅ `speakeasy` - USED in TwoFactorService.js for TOTP generation
  - ✅ `isomorphic-dompurify` - USED in TemplateRenderer.js for email sanitization
  - All backend packages are actively used
  - _Requirements: 1.1, 1.2_

- [x] 2. Audit Frontend npm Packages
  - ✅ `immer` - USED in zustand stores (uiSlice, createEntitySlice, settingsStore)
  - ❌ `mui-tel-input` - NOT USED (only commented out in FormField.tsx)
  - ✅ `@microlink/react-json-view` - USED in JSONBField.tsx
  - ✅ `react-grid-layout` - USED in DashboardPage.tsx
  - ✅ `react-resizable` - USED with react-grid-layout
  - ✅ `@testing-library/*` - USED in test files
  - ✅ `jest-axe` - NOT USED (no toHaveNoViolations found)
  - ✅ `globals` - USED in eslint.config.js
  - Found 2 unused packages: `mui-tel-input`, `jest-axe`
  - _Requirements: 2.1, 2.2_

- [ ] 3. Audit MCP npm Packages
  - Verify all packages in MeterItPro/mcp/package.json are used
  - Verify all packages in MeterItProSync/mcp/package.json are used
  - Document findings
  - _Requirements: 3.1, 3.2_

- [ ] 4. Audit Framework npm Packages
  - Check recharts version alignment between framework/frontend and MeterItPro/frontend
  - Verify all packages in framework/frontend/package.json are used
  - Document findings
  - _Requirements: 4.1, 4.2_

- [ ] 5. Identify Dead Code Files in Backend
  - Scan client/backend/src/services/ for unused files
  - Scan client/backend/src/routes/ for unused files
  - Scan client/backend/src/utils/ for unused files
  - Scan client/backend/src/helpers/ for unused files
  - Document findings
  - _Requirements: 5.1, 5.2_

- [ ] 6. Identify Dead Code Files in Frontend
  - Scan MeterItPro/frontend/src/services/ for unused files
  - Scan MeterItPro/frontend/src/components/ for unused files
  - Scan MeterItPro/frontend/src/hooks/ for unused files
  - Scan MeterItPro/frontend/src/utils/ for unused files
  - Document findings
  - _Requirements: 5.1, 5.2_

- [ ] 7. Identify Dead Code Files in Framework
  - Scan framework/frontend/components/ for unused files
  - Scan framework/frontend/hooks/ for unused files
  - Scan framework/frontend/utils/ for unused files
  - Document findings
  - _Requirements: 5.1, 5.2_

- [ ] 8. Remove Unused Backend npm Packages
  - Based on audit results, remove unused packages from client/backend/package.json
  - Run `npm install` to update package-lock.json
  - Verify no build errors
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 9. Remove Unused Frontend npm Packages
  - Based on audit results, remove unused packages from MeterItPro/frontend/package.json
  - Run `npm install` to update package-lock.json
  - Verify no build errors
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 10. Remove Unused MCP npm Packages
  - Based on audit results, remove unused packages from MeterItPro/mcp/package.json
  - Based on audit results, remove unused packages from MeterItProSync/mcp/package.json
  - Run `npm install` in both directories
  - Verify no build errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 11. Remove Unused Framework npm Packages
  - Based on audit results, remove unused packages from framework/frontend/package.json
  - Align recharts version if needed
  - Run `npm install` to update package-lock.json
  - Verify no build errors
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 12. Remove Dead Code Files from Backend
  - Delete identified unused files from client/backend
  - Remove any orphaned imports
  - Verify no build errors
  - _Requirements: 5.1, 5.2_

- [ ] 13. Remove Dead Code Files from Frontend
  - Delete identified unused files from MeterItPro/frontend
  - Remove any orphaned imports
  - Verify no build errors
  - _Requirements: 5.1, 5.2_

- [ ] 14. Remove Dead Code Files from Framework
  - Delete identified unused files from framework/frontend
  - Remove any orphaned imports
  - Verify no build errors
  - _Requirements: 5.1, 5.2_

- [ ] 15. Verify No Broken Imports
  - Run TypeScript compiler on entire codebase
  - Search for any remaining references to deleted packages or files
  - Verify no import errors
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 16. Verify Frontend Build Success
  - Run `npm run build` in MeterItPro/frontend
  - Verify no errors or warnings
  - Verify bundle size is reduced
  - _Requirements: 7.1_

- [ ] 17. Verify Backend Build Success
  - Run `npm run build` in client/backend (if applicable)
  - Verify no errors or warnings
  - _Requirements: 7.2_

- [ ] 18. Verify MCP Builds Success
  - Run `npm run build` in MeterItPro/mcp
  - Run `npm run build` in MeterItProSync/mcp
  - Verify no errors or warnings
  - _Requirements: 7.3_

- [ ] 19. Verify Framework Build Success
  - Run `npm run build` in framework/frontend
  - Verify no errors or warnings
  - _Requirements: 7.4_

- [ ] 20. Verify Application Startup
  - Start the backend server
  - Verify no errors related to missing modules
  - Verify all endpoints are accessible
  - _Requirements: 8.1, 8.2_

- [ ] 21. Verify Frontend Functionality
  - Load the frontend application
  - Verify all pages load correctly
  - Verify all features work as expected
  - _Requirements: 8.2, 8.3_

- [ ] 22. Verify MCP Server Functionality
  - Start the MCP servers
  - Verify all tools are available
  - Verify all tools function correctly
  - _Requirements: 8.4_

- [ ] 23. Final Checkpoint - Cleanup Complete
  - Verify all tasks completed
  - Verify all builds succeed
  - Verify all functionality preserved
  - Document cleanup results
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_

## Notes

- Each task is designed to be completed independently
- Tasks should be executed in order to maintain code integrity
- After each task, verify that the codebase still builds successfully
- If any task fails, investigate and resolve before proceeding to the next task
- The checkpoint tasks (16-23) ensure that the cleanup is progressing correctly
- All unused packages and dead code should be removed by task 14, with tasks 15-23 focused on verification

</content>
</invoke>