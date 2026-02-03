# Requirements Document: Fix Authentication Infinite Loop

## Introduction

The `authenticateToken` middleware is experiencing performance degradation and potential infinite loops when verifying JWT tokens. The root cause is excessive logging and schema initialization overhead in the User model's `findById` method. When a user logs in, the middleware calls `User.findById()` to verify the user exists, which triggers complex schema initialization with extensive console.log statements. This causes either timeout errors or "Failed to verify user" responses on valid tokens.

The fix requires optimizing the User lookup process to be fast and lightweight, removing unnecessary logging from authentication paths, and ensuring the middleware completes within acceptable timeframes.

## Glossary

- **JWT Token**: JSON Web Token used for stateless authentication
- **User Model**: The User entity representing authenticated users
- **Schema Initialization**: The process of populating model instance fields from database data
- **Middleware**: Express middleware function that intercepts requests for authentication
- **Tenant Context**: Multi-tenant isolation mechanism using global.currentTenantId
- **findById**: Database query method to retrieve a record by primary key
- **Deserialization**: Converting database values to proper JavaScript types

## Requirements

### Requirement 1: Optimize User.findById() Performance

**User Story:** As a system administrator, I want the User lookup during authentication to complete quickly, so that login requests don't timeout or fail.

#### Acceptance Criteria

1. WHEN User.findById() is called during authentication, THE System SHALL complete the lookup within 100ms
2. WHEN User.findById() is called, THE System SHALL NOT load unnecessary relationships (tenant relationship should not be auto-loaded)
3. WHEN User.findById() is called, THE System SHALL return a User instance with all required fields (id, email, name, role, tenant_id, active, permissions, passwordHash)
4. WHEN User.findById() is called with an invalid ID, THE System SHALL return null without throwing an error

### Requirement 2: Remove Excessive Logging from Authentication Path

**User Story:** As a developer, I want authentication logs to be concise and focused, so that I can debug issues without being overwhelmed by verbose output.

#### Acceptance Criteria

1. WHEN User.findById() is called during authentication, THE System SHALL NOT log extensive field initialization details
2. WHEN BaseModel._mapResultToInstance() is called during authentication, THE System SHALL NOT log deserialization details
3. WHEN BaseModel._getFields() is called during authentication, THE System SHALL NOT log field extraction details
4. WHEN authenticateToken middleware executes, THE System SHALL only log authentication-specific events (token decoded, user found, permissions set)
5. WHEN an authentication error occurs, THE System SHALL log a concise error message with the error type and reason

### Requirement 3: Ensure Tenant Context is Properly Set

**User Story:** As a system architect, I want tenant isolation to work correctly during authentication, so that users only access their own tenant's data.

#### Acceptance Criteria

1. WHEN a user is authenticated, THE System SHALL set global.currentTenantId from the user's tenant_id field
2. WHEN global.currentTenantId is set, THE System SHALL use it for automatic tenant filtering in subsequent queries
3. WHEN a user's tenant_id is missing, THE System SHALL attempt to derive it from the user.tenant relationship if available
4. WHEN tenant context is set, THE System SHALL ensure all subsequent database queries are filtered by tenant_id

### Requirement 4: Handle Authentication Errors Gracefully

**User Story:** As a developer, I want clear error messages when authentication fails, so that I can quickly identify and fix issues.

#### Acceptance Criteria

1. WHEN a token is expired, THE System SHALL return a 401 status with message "Token expired"
2. WHEN a token is invalid, THE System SHALL return a 401 status with message "Invalid token"
3. WHEN a token is missing, THE System SHALL return a 401 status with message "Access token required"
4. WHEN a user is not found, THE System SHALL return a 401 status with message "Invalid token - user not found"
5. WHEN a user is inactive, THE System SHALL return a 401 status with message "Account is inactive"
6. WHEN User.findById() fails with a database error, THE System SHALL return a 500 status with a descriptive error message
7. WHEN an unexpected error occurs, THE System SHALL log the error and return a 500 status with message "Authentication error"

### Requirement 5: Verify Authentication Works for All Protected Routes

**User Story:** As a QA engineer, I want to verify that authentication works correctly after the fix, so that all protected routes are properly secured.

#### Acceptance Criteria

1. WHEN a valid token is provided, THE System SHALL authenticate the user and attach user data to req.user
2. WHEN a valid token is provided, THE System SHALL set user permissions from the database or derive them from the user's role
3. WHEN a valid token is provided, THE System SHALL set global.currentTenantId for tenant filtering
4. WHEN a valid token is provided, THE System SHALL remove the passwordHash from the user object before attaching to request
5. WHEN authentication succeeds, THE System SHALL call next() to proceed to the next middleware/route handler
6. WHEN authentication fails, THE System SHALL return an error response and NOT call next()

### Requirement 6: Optimize Schema Initialization for Authentication

**User Story:** As a performance engineer, I want schema initialization to be lightweight during authentication, so that it doesn't become a bottleneck.

#### Acceptance Criteria

1. WHEN User model is instantiated during authentication, THE System SHALL skip logging of field initialization details
2. WHEN User model is instantiated during authentication, THE System SHALL only initialize fields that are actually needed (not all schema fields)
3. WHEN User model is instantiated, THE System SHALL use a fast path that doesn't trigger extensive schema processing
4. WHEN User model is instantiated, THE System SHALL still properly deserialize database values to correct JavaScript types

### Requirement 7: Add Performance Monitoring to Authentication

**User Story:** As a system administrator, I want to monitor authentication performance, so that I can detect and fix performance issues early.

#### Acceptance Criteria

1. WHEN authenticateToken middleware executes, THE System SHALL measure the total execution time
2. WHEN User.findById() executes, THE System SHALL measure the query execution time
3. WHEN execution time exceeds 100ms, THE System SHALL log a warning with the execution time
4. WHEN execution time exceeds 500ms, THE System SHALL log an error with the execution time
5. WHEN performance metrics are logged, THE System SHALL include the operation name and execution time in milliseconds
