# Design Document: Fix Authentication Infinite Loop

## Overview

The authentication infinite loop is caused by excessive logging and complex schema initialization in the User model's `findById` method. The fix involves:

1. **Disable verbose logging during authentication** - Remove or conditionally disable console.log statements in schema initialization and model mapping
2. **Optimize User.findById()** - Create a lightweight authentication-specific lookup that skips unnecessary processing
3. **Add performance monitoring** - Track authentication timing to detect future performance issues
4. **Ensure tenant context is set** - Properly initialize global.currentTenantId for multi-tenant filtering

## Architecture

### Current Flow (Problematic)
```
authenticateToken middleware
  ↓
User.findById(decoded.userId)
  ↓
BaseModel.findById()
  ↓
buildSelectSQL() + db.query()
  ↓
_mapResultToInstance()
  ↓
new User(row) → constructor
  ↓
User.schema.initializeFromData()
  ↓
[EXCESSIVE LOGGING - 100+ console.log statements]
  ↓
Returns User instance (after 500ms+ delay)
```

### Optimized Flow
```
authenticateToken middleware
  ↓
User.findByIdForAuth(decoded.userId)  [NEW - lightweight method]
  ↓
buildSelectSQL() + db.query()
  ↓
_mapResultToInstanceForAuth()  [NEW - minimal logging]
  ↓
new User(row) → constructor
  ↓
User.schema.initializeFromData(instance, row, { skipLogging: true })
  ↓
[MINIMAL LOGGING - only auth-specific events]
  ↓
Returns User instance (within 100ms)
```

## Components and Interfaces

### 1. SchemaDefinition.initializeFromData() - Enhanced

**Purpose**: Initialize model instance fields from database data with optional logging control

**Changes**:
- Add `options` parameter with `skipLogging` flag
- Conditionally skip console.log statements when `skipLogging: true`
- Maintain full functionality when logging is enabled

**Signature**:
```javascript
function initializeFromData(instance, data, options = {}) {
  const { skipLogging = false } = options;
  
  if (!skipLogging) {
    console.log('\n' + '█'.repeat(120));
    console.log('█ [SCHEMA] initializeFromData - START');
    // ... existing logging
  }
  
  // ... initialization logic (unchanged)
}
```

### 2. BaseModel._mapResultToInstance() - Enhanced

**Purpose**: Map database result row to model instance with optional logging control

**Changes**:
- Add `options` parameter with `skipLogging` flag
- Pass options to schema initialization
- Conditionally skip console.log statements

**Signature**:
```javascript
static _mapResultToInstance(row, options = {}) {
  const { skipLogging = false } = options;
  
  if (!skipLogging) {
    console.log('\n' + '█'.repeat(120));
    console.log('█ [BASEMODEL] _mapResultToInstance - START');
    // ... existing logging
  }
  
  // ... deserialization logic
  
  return new this(deserializedRow);
}
```

### 3. BaseModel._getFields() - Enhanced

**Purpose**: Extract and cache field metadata with optional logging control

**Changes**:
- Add static `_skipFieldLogging` flag for authentication paths
- Conditionally skip console.log statements when flag is set
- Reset flag after use

**Signature**:
```javascript
static _getFields(skipLogging = false) {
  if (this._fields) {
    return this._fields;
  }
  
  this._validateConfiguration();
  let fields = extractFields(this);
  
  if (!skipLogging) {
    console.log('\n' + '█'.repeat(120));
    console.log('█ FIELD EXTRACTION FOR:', this.name);
    // ... existing logging
  }
  
  // ... field merging logic
  
  this._fields = fields;
  return this._fields;
}
```

### 4. User.findByIdForAuth() - New Method

**Purpose**: Lightweight user lookup optimized for authentication

**Behavior**:
- Calls User.findById() with skipLogging option
- Returns user with all required fields for authentication
- Does NOT load tenant relationship (autoLoad: false)
- Completes within 100ms

**Signature**:
```javascript
static async findByIdForAuth(id) {
  try {
    const fields = this._getFields(true); // skipLogging = true
    const where = { [this.primaryKey]: id };
    
    const queryResult = buildSelectSQL(this.tableName, fields, {
      where,
      relationships: this.relationships,
      limit: 1
    });
    
    const db = this._getDb();
    const result = await db.query(queryResult.sql, queryResult.values);
    
    if (result.rows && result.rows.length > 0) {
      return this._mapResultToInstance(result.rows[0], { skipLogging: true });
    }
    
    return null;
  } catch (error) {
    console.error(`[${this.name}] findByIdForAuth error:`, error.message);
    throw error;
  }
}
```

### 5. authenticateToken Middleware - Enhanced

**Purpose**: Authenticate JWT tokens with optimized user lookup

**Changes**:
- Use User.findByIdForAuth() instead of User.findById()
- Add performance timing
- Reduce logging to essential events only
- Ensure tenant context is set

**Key Changes**:
```javascript
const startTime = Date.now();

// Use optimized auth lookup
let user;
try {
  user = await User.findByIdForAuth(decoded.userId);
} catch (userLookupError) {
  console.error('[AUTH] User lookup failed:', userLookupError.message);
  return res.status(500).json({
    success: false,
    message: 'Failed to verify user'
  });
}

const duration = Date.now() - startTime;
if (duration > 100) {
  console.warn(`[AUTH] User lookup took ${duration}ms (threshold: 100ms)`);
}

// ... rest of middleware
```

## Data Models

### User Instance (After Authentication)

```javascript
{
  users_id: number,           // Primary key
  name: string,               // User name
  email: string,              // User email
  phone: string,              // User phone
  role: string,               // User role (admin, manager, technician, viewer)
  active: boolean,            // Account active status
  tenant_id: number,          // Tenant ID for multi-tenancy
  permissions: object|array,  // User permissions
  passwordHash: string,       // Hashed password (removed before attaching to req)
  createdAt: date,            // Account creation timestamp
  updatedAt: date,            // Last update timestamp
  lastLogin: date,            // Last login timestamp
  failedLoginAttempts: number,// Failed login counter
  lockedUntil: date           // Account lock timestamp
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Authentication Completes Within Timeout

*For any* valid JWT token and existing user, calling authenticateToken should complete within 500ms (with 100ms target for user lookup).

**Validates: Requirements 1.1, 7.1, 7.2**

### Property 2: Valid Token Authenticates User

*For any* valid JWT token with a valid userId, the middleware should authenticate the user and attach user data to req.user with all required fields (id, email, name, role, tenant_id, active, permissions).

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 3: Tenant Context is Set on Authentication

*For any* authenticated user, global.currentTenantId should be set to the user's tenant_id value.

**Validates: Requirements 3.1, 3.2**

### Property 4: Password Hash is Removed from Request

*For any* authenticated user, the req.user object should NOT contain the passwordHash field.

**Validates: Requirements 5.4**

### Property 5: Invalid Token Returns 401

*For any* invalid, expired, or missing JWT token, the middleware should return a 401 status code with an appropriate error message.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Inactive User Cannot Authenticate

*For any* user with active=false, the middleware should return a 401 status with message "Account is inactive".

**Validates: Requirements 4.5**

### Property 7: User Lookup Returns Null for Missing User

*For any* non-existent userId, User.findByIdForAuth() should return null without throwing an error.

**Validates: Requirements 1.4**

### Property 8: Logging is Minimal During Authentication

*For any* authentication request, the console output should contain only authentication-specific events (token decoded, user found, permissions set) and NOT contain verbose schema initialization logs.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

## Error Handling

### Authentication Errors

| Error | Status | Message | Cause |
|-------|--------|---------|-------|
| Missing Token | 401 | "Access token required" | No Authorization header |
| Expired Token | 401 | "Token expired" | JWT expired |
| Invalid Token | 401 | "Invalid token" | JWT signature invalid |
| Missing userId | 401 | "Invalid token - missing user ID" | Token missing userId field |
| User Not Found | 401 | "Invalid token - user not found" | User doesn't exist |
| Inactive User | 401 | "Account is inactive" | User.active = false |
| User Lookup Failed | 500 | "Failed to verify user" | Database error during lookup |
| Unexpected Error | 500 | "Authentication error" | Unhandled exception |

### Error Logging

- **Debug**: Token decoded successfully, user found, permissions set
- **Warning**: User lookup exceeded 100ms threshold
- **Error**: User lookup exceeded 500ms threshold, database errors, unexpected exceptions

## Testing Strategy

### Unit Tests

1. **Token Validation**
   - Valid token with valid userId
   - Expired token
   - Invalid token signature
   - Missing token
   - Token missing userId field

2. **User Lookup**
   - User exists and is active
   - User doesn't exist
   - User is inactive
   - Database error during lookup

3. **Tenant Context**
   - Tenant ID is set from user.tenant_id
   - Tenant ID is derived from user.tenant relationship if tenant_id is missing
   - Global context is properly isolated between requests

4. **Permission Handling**
   - Permissions are loaded from database if available
   - Permissions are derived from role if not in database
   - Permissions are attached to req.user

5. **Password Handling**
   - Password hash is removed from req.user
   - Password hash is not exposed in error messages

### Property-Based Tests

1. **Property 1: Authentication Completes Within Timeout**
   - Generate random valid tokens with random userIds
   - Measure execution time for each authentication
   - Verify all complete within 500ms threshold

2. **Property 2: Valid Token Authenticates User**
   - Generate random valid tokens with existing userIds
   - Verify req.user contains all required fields
   - Verify req.user.id matches token userId

3. **Property 3: Tenant Context is Set**
   - Generate random users with random tenant_ids
   - Verify global.currentTenantId matches user.tenant_id after authentication

4. **Property 4: Password Hash is Removed**
   - Generate random authenticated users
   - Verify req.user does NOT contain passwordHash field

5. **Property 5: Invalid Token Returns 401**
   - Generate random invalid tokens (expired, wrong signature, missing userId)
   - Verify response status is 401
   - Verify response contains appropriate error message

6. **Property 6: Inactive User Cannot Authenticate**
   - Generate random users with active=false
   - Verify response status is 401
   - Verify response message is "Account is inactive"

7. **Property 7: User Lookup Returns Null for Missing User**
   - Generate random non-existent userIds
   - Verify User.findByIdForAuth() returns null
   - Verify no error is thrown

8. **Property 8: Logging is Minimal**
   - Capture console output during authentication
   - Verify output does NOT contain schema initialization logs
   - Verify output contains only authentication-specific events

### Test Configuration

- Minimum 100 iterations per property test
- Each test tagged with: **Feature: fix-auth-infinite-loop, Property {number}: {property_text}**
- Unit tests focus on specific examples and edge cases
- Property tests verify universal correctness across all inputs
