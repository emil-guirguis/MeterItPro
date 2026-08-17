# Requirements Document: Comprehensive Dependency Cleanup

## Introduction

This specification defines the requirements for auditing and removing unused libraries, npm packages, services, utilities, and components across the entire MeterIt solution. The solution consists of multiple workspaces (client backend/frontend/mcp, sync mcp/frontend, and framework frontend/backend) with interdependencies. The goal is to reduce technical debt, improve maintainability, reduce bundle sizes, and eliminate orphaned code while ensuring all builds succeed and functionality is preserved.

## Glossary

- **Workspace**: A directory containing a package.json and source code (e.g., client/backend, MeterItPro/frontend, MeterItProSync/mcp)
- **Dependency**: An npm package listed in package.json (production or dev)
- **Unused Dependency**: An npm package in package.json that is not imported or used anywhere in the codebase
- **Unused Code**: Source files, components, hooks, utilities, or services that are not imported by any active code
- **Orphaned Code**: Code files that exist but have no references from other parts of the system
- **Import**: A reference to a module, component, or utility via import/require statements
- **Active Code**: Code that is directly or transitively imported by entry points or active modules
- **Entry Point**: The main file that starts execution (e.g., src/server.js, src/main.tsx, dist/index.js)
- **Transitive Dependency**: A dependency required by another dependency
- **Peer Dependency**: A dependency that should be provided by the consuming package
- **Dev Dependency**: A dependency only needed during development or testing
- **Production Dependency**: A dependency needed at runtime

## Requirements

### Requirement 1: Audit All npm Dependencies

**User Story:** As a developer, I want to audit all npm packages across all workspaces, so that I can identify which packages are actually being used in the codebase.

#### Acceptance Criteria

1. WHEN the audit begins, THE System SHALL scan all package.json files in the following workspaces:
   - Root package.json
   - client/backend/package.json
   - MeterItPro/frontend/package.json
   - MeterItPro/mcp/package.json
   - MeterItProSync/mcp/package.json
   - MeterItProSync/frontend/package.json
   - framework/frontend/package.json

2. WHEN scanning dependencies, THE System SHALL categorize each package as:
   - Production dependency (in dependencies)
   - Development dependency (in devDependencies)
   - Peer dependency (in peerDependencies)

3. WHEN analyzing each dependency, THE System SHALL determine if it is:
   - Directly imported in source code
   - Transitively required by other dependencies
   - Only used in configuration files or build scripts
   - Completely unused

4. WHEN the audit completes, THE System SHALL generate a report listing:
   - All dependencies by workspace
   - Usage status for each dependency (used/unused)
   - Reason for usage or reason for being unused
   - Estimated impact of removal (bundle size, functionality)

### Requirement 2: Identify Unused npm Packages

**User Story:** As a developer, I want to identify which npm packages are not being used, so that I can remove them and reduce dependencies.

#### Acceptance Criteria

1. WHEN analyzing imports, THE System SHALL scan all TypeScript, JavaScript, and JSX files for import/require statements

2. WHEN checking for usage, THE System SHALL verify that each dependency is:
   - Imported in at least one source file, OR
   - Required by another dependency, OR
   - Explicitly needed for build/runtime configuration

3. WHEN a package is not found in any imports, THE System SHALL mark it as unused and note:
   - The workspace where it appears
   - Whether it's a production or dev dependency
   - Any configuration files that reference it

4. WHEN the analysis completes, THE System SHALL provide a list of unused packages grouped by workspace

### Requirement 3: Identify Unused Source Code Files and Modules

**User Story:** As a developer, I want to identify unused source files, components, hooks, and utilities, so that I can remove orphaned code.

#### Acceptance Criteria

1. WHEN scanning source code, THE System SHALL identify all TypeScript, JavaScript, JSX, and TSX files in src/ directories

2. WHEN analyzing imports, THE System SHALL build a dependency graph showing which files import which other files

3. WHEN checking for usage, THE System SHALL determine if each file is:
   - Imported by at least one other file, OR
   - An entry point (server.js, main.tsx, index.ts), OR
   - Exported from an index file that is imported elsewhere

4. WHEN a file is not referenced, THE System SHALL mark it as unused and note:
   - The workspace where it exists
   - The file path
   - Any files that might have previously imported it

5. WHEN the analysis completes, THE System SHALL provide a list of unused files grouped by workspace and type (components, hooks, utilities, services)

### Requirement 4: Identify Unused Services and Utilities

**User Story:** As a developer, I want to identify unused backend services and utility modules, so that I can remove unnecessary code.

#### Acceptance Criteria

1. WHEN scanning backend code, THE System SHALL identify service files in src/services/ directories

2. WHEN analyzing services, THE System SHALL determine if each service is:
   - Imported by route handlers or other services
   - Registered in initialization code
   - Used in middleware or configuration
   - Completely unused

3. WHEN scanning utilities, THE System SHALL identify utility files in src/utils/ or similar directories

4. WHEN analyzing utilities, THE System SHALL determine if each utility is:
   - Imported by at least one other file
   - Exported from an index file that is imported
   - Completely unused

5. WHEN the analysis completes, THE System SHALL provide a categorized list of unused services and utilities

### Requirement 5: Identify Unused Components and Hooks

**User Story:** As a developer, I want to identify unused React components and custom hooks, so that I can remove unnecessary UI code.

#### Acceptance Criteria

1. WHEN scanning frontend code, THE System SHALL identify React component files (*.tsx, *.jsx) in src/components/ directories

2. WHEN analyzing components, THE System SHALL determine if each component is:
   - Imported by other components or pages
   - Exported from an index file that is imported
   - Used in routing configuration
   - Completely unused

3. WHEN scanning for hooks, THE System SHALL identify custom hook files (use*.ts, use*.tsx) in src/hooks/ directories

4. WHEN analyzing hooks, THE System SHALL determine if each hook is:
   - Imported by components or other hooks
   - Exported from an index file that is imported
   - Completely unused

5. WHEN the analysis completes, THE System SHALL provide a list of unused components and hooks grouped by workspace

### Requirement 6: Remove Unused npm Dependencies

**User Story:** As a developer, I want to remove unused npm packages from package.json files, so that I can reduce dependencies and bundle size.

#### Acceptance Criteria

1. WHEN removing a dependency, THE System SHALL:
   - Remove it from the appropriate package.json (dependencies, devDependencies, or peerDependencies)
   - Update package-lock.json accordingly
   - Verify no other dependencies require it

2. WHEN a dependency is removed, THE System SHALL verify that:
   - No import statements reference the package
   - No configuration files reference the package
   - No build scripts reference the package

3. WHEN all unused dependencies are removed, THE System SHALL run npm install to update lock files

4. WHEN the removal completes, THE System SHALL verify that:
   - All package.json files are valid JSON
   - All lock files are consistent with package.json files

### Requirement 7: Remove Unused Source Code Files

**User Story:** As a developer, I want to remove unused source files, so that I can clean up the codebase.

#### Acceptance Criteria

1. WHEN removing a file, THE System SHALL:
   - Delete the file from the filesystem
   - Verify no other files import it
   - Check for any references in configuration or build files

2. WHEN a file is removed, THE System SHALL verify that:
   - No import statements reference the deleted file
   - No index files export the deleted file
   - No configuration files reference the deleted file

3. WHEN removing unused files, THE System SHALL preserve:
   - Entry point files (server.js, main.tsx, index.ts)
   - Configuration files
   - Test files (unless they test only unused code)
   - Type definition files that are imported

4. WHEN the removal completes, THE System SHALL verify that:
   - All remaining imports are valid
   - No broken references exist

### Requirement 8: Verify No Broken Imports Remain

**User Story:** As a developer, I want to verify that all remaining imports are valid, so that the codebase is in a consistent state.

#### Acceptance Criteria

1. WHEN verifying imports, THE System SHALL scan all source files for import/require statements

2. WHEN checking each import, THE System SHALL verify that:
   - The imported file exists
   - The imported module is exported from the target file
   - The import path is correct

3. WHEN an import is broken, THE System SHALL:
   - Report the file containing the broken import
   - Report the import statement
   - Report the reason it's broken (file not found, not exported, etc.)

4. WHEN the verification completes, THE System SHALL report:
   - Total number of imports checked
   - Number of broken imports found
   - List of all broken imports with details

### Requirement 9: Verify Builds Succeed

**User Story:** As a developer, I want to verify that all builds succeed after cleanup, so that I can ensure functionality is preserved.

#### Acceptance Criteria

1. WHEN running builds, THE System SHALL execute:
   - npm run build in MeterItPro/frontend
   - npm run build in MeterItProSync/frontend
   - npm run build in client/backend (if applicable)
   - npm run build in MeterItProSync/mcp (if applicable)

2. WHEN a build runs, THE System SHALL verify that:
   - The build completes without errors
   - The build completes without critical warnings
   - Output files are generated

3. WHEN a build fails, THE System SHALL:
   - Report the build that failed
   - Report the error messages
   - Suggest potential causes

4. WHEN all builds complete, THE System SHALL report:
   - Build status for each workspace
   - Any warnings or issues encountered
   - Estimated bundle size changes

### Requirement 10: Verify Functionality is Preserved

**User Story:** As a developer, I want to verify that functionality is preserved after cleanup, so that I can ensure no features are broken.

#### Acceptance Criteria

1. WHEN verifying functionality, THE System SHALL:
   - Run all existing unit tests
   - Run all existing integration tests
   - Check for any test failures

2. WHEN tests run, THE System SHALL verify that:
   - All tests pass
   - No new test failures are introduced
   - Test coverage is maintained

3. WHEN a test fails, THE System SHALL:
   - Report the test that failed
   - Report the error message
   - Suggest potential causes

4. WHEN verification completes, THE System SHALL report:
   - Total tests run
   - Tests passed
   - Tests failed
   - Overall functionality status

### Requirement 11: Generate Cleanup Report

**User Story:** As a developer, I want a comprehensive report of all cleanup actions, so that I can understand what was changed and why.

#### Acceptance Criteria

1. WHEN generating the report, THE System SHALL include:
   - Summary of dependencies removed
   - Summary of files removed
   - Summary of changes made to each workspace
   - Impact analysis (bundle size reduction, maintenance improvement)

2. WHEN documenting changes, THE System SHALL list:
   - Each removed dependency with reason
   - Each removed file with reason
   - Each modified file with changes made

3. WHEN the report is complete, THE System SHALL provide:
   - Total dependencies removed
   - Total files removed
   - Estimated bundle size reduction
   - Estimated maintenance improvement
   - Recommendations for future cleanup

### Requirement 12: Handle Interdependencies Between Workspaces

**User Story:** As a developer, I want the cleanup process to handle interdependencies between workspaces, so that I don't accidentally break cross-workspace imports.

#### Acceptance Criteria

1. WHEN analyzing dependencies, THE System SHALL identify:
   - Which workspaces import from other workspaces
   - Which packages are shared across workspaces
   - Which utilities are used by multiple workspaces

2. WHEN removing code, THE System SHALL verify that:
   - No other workspace imports the removed code
   - No shared utilities are removed if still needed
   - Cross-workspace imports remain valid

3. WHEN a cross-workspace dependency is found, THE System SHALL:
   - Report the dependency
   - Verify it's still needed
   - Preserve it if needed by multiple workspaces

4. WHEN the analysis completes, THE System SHALL provide:
   - List of cross-workspace dependencies
   - List of shared utilities
   - Recommendations for consolidation

