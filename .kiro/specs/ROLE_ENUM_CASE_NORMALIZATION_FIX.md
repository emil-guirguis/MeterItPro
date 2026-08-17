# Role Enum Case Normalization Fix

## Problem
MUI Select component was throwing a warning when loading users with lowercase role values:
```
MUI: You have provided an out-of-range value `technician` for the select (name="role") component.
Consider providing a value that matches one of the available options or ''.
The available values are `Admin`, `Manager`, `Technician`, `Viewer`.
```

## Root Cause
**Case mismatch between schema definition and database storage:**
- Schema defined role enum as: `['Admin', 'Manager', 'Technician', 'Viewer']` (capitalized)
- Database stored role values as: `'admin'`, `'manager'`, `'technician'`, `'viewer'` (lowercase)
- When form loaded a user with `role: 'technician'`, MUI rejected it because it didn't match the capitalized enum values

## Solution
Normalized all role enum values to lowercase for consistency across the entire system.

## Changes Made

### 1. Backend Schema (UserWithSchema.js)
**File:** `client/backend/src/models/UserWithSchema.js`

Changed role field enum values from capitalized to lowercase:
```javascript
// Before
enumValues: ['Admin', 'Manager', 'Technician', 'Viewer'],
default: 'Viewer',

// After
enumValues: ['admin', 'manager', 'technician', 'viewer'],
default: 'viewer',
```

### 2. Frontend TypeScript Types (userConfig.ts)
**File:** `MeterItPro/frontend/src/features/users/userConfig.ts`

Updated User type and UserRole type to use lowercase:
```typescript
// Before
role: 'Admin' | 'Manager' | 'Technician' | 'Viewer';
export type UserRole = 'Admin' | 'Manager' | 'Technician' | 'Viewer';

// After
role: 'admin' | 'manager' | 'technician' | 'viewer';
export type UserRole = 'admin' | 'manager' | 'technician' | 'viewer';
```

### 3. Frontend Filter Options (userConfig.ts)
Updated filter options to use lowercase values:
```javascript
// Before
{ label: 'Admin', value: 'Admin' },
{ label: 'Manager', value: 'Manager' },
{ label: 'Technician', value: 'Technician' },
{ label: 'Viewer', value: 'Viewer' },

// After
{ label: 'Admin', value: 'admin' },
{ label: 'Manager', value: 'manager' },
{ label: 'Technician', value: 'technician' },
{ label: 'Viewer', value: 'viewer' },
```

### 4. Frontend Role Rendering (userConfig.ts)
Updated role badge rendering to capitalize display text:
```typescript
// Before
render: (value) => {
  const role = value as UserRole;
  switch (role) {
    case 'Admin': return 'error';
    case 'Manager': return 'warning';
    // ...
  }
  return role; // Displayed as-is
}

// After
render: (value) => {
  const role = value as UserRole;
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);
  switch (role.toLowerCase()) {
    case 'admin': return 'error';
    case 'manager': return 'warning';
    // ...
  }
  return displayRole; // Displayed capitalized
}
```

### 5. Frontend Stats (userConfig.ts)
Updated admin count filter:
```javascript
// Before
items.filter(u => u.role === 'Admin').length

// After
items.filter(u => u.role === 'admin').length
```

### 6. Test File (test-user-permissions-update.js)
**File:** `client/backend/test-user-permissions-update.js`

Updated test data:
```javascript
// Before
role: 'Manager',

// After
role: 'manager',
```

## Consistency Verification

✅ **Backend:** Already using lowercase roles in:
- `PermissionsService.js` - All role mappings use lowercase
- `auth.js` - Role comparisons use lowercase
- `server.js` - Default admin role is lowercase

✅ **Frontend:** Already using lowercase roles in:
- `navigationUtils.ts` - Role-based routing uses lowercase
- `usersStore.ts` - Role filtering uses lowercase

✅ **No SQL migrations needed** - No hardcoded role values found in migration files

## How the Fix Works

1. **Schema defines lowercase enums** - The role field now has `enumValues: ['admin', 'manager', 'technician', 'viewer']`

2. **Form receives lowercase values** - When loading a user from the database, the role value is `'technician'` (lowercase)

3. **MUI Select accepts the value** - The select options are created from enumValues, so they're also lowercase, and the value matches

4. **Display shows capitalized text** - The `BaseForm.tsx` component automatically capitalizes the first letter when creating option labels:
   ```typescript
   label: val.charAt(0).toUpperCase() + val.slice(1)
   ```

5. **User sees "Technician"** - The UI displays the capitalized version while the data remains lowercase

## Testing

To verify the fix:
1. Load a user with any role (admin, manager, technician, viewer)
2. Open the user edit form
3. The role select should display the correct value without MUI warnings
4. The role should display capitalized in the list view
5. Filters should work correctly with lowercase values

## Impact

- ✅ No breaking changes - All existing code already uses lowercase roles
- ✅ Database compatible - Existing data uses lowercase roles
- ✅ Type-safe - TypeScript types now match actual data
- ✅ UI consistent - Display shows capitalized text while data remains lowercase
