# Dashboard Card Edit Blank Page - Design

## Root Cause Analysis

**TypeError**: `Cannot read properties of undefined (reading 'toString')`  
**Location**: `DashboardCardModal.tsx:361`  
**Reason**: Backend returns `meter_element_id` but frontend code accesses `element.id`

### Data Structure Mismatch

**Backend Response** (from `/api/dashboard/meters/:meterId/elements`):
```javascript
{
  meter_element_id: 123,  // ← Backend returns this
  element: "Phase A",
  name: "Phase A - Voltage",
  meter_id: 456
}
```

**Frontend Code** (line 361 in DashboardCardModal.tsx):
```typescript
meterElements.map(element => (
  <MenuItem key={element.id} value={element.id.toString()}>  // ← Tries to access element.id (undefined!)
```

## Solution Overview

Fix the data mapping mismatch by updating frontend code to use `meter_element_id` instead of `id`.

## Implementation Strategy

### Fix 1: Update Frontend Type Definition
**File**: `MeterItPro/frontend/src/services/dashboardService.ts`

**Change**: Update the return type of `getMeterElementsByMeter()` to match backend response:

```typescript
// Change from:
async getMeterElementsByMeter(meterId: number): Promise<Array<{ id: number; element: string; name: string; meter_id: number }>>

// To:
async getMeterElementsByMeter(meterId: number): Promise<Array<{ meter_element_id: number; element: string; name: string; meter_id: number }>>
```

### Fix 2: Update Modal Component
**File**: `framework/frontend/dashboards/components/DashboardCardModal.tsx`

**Change**: Update line 361 to use `meter_element_id`:

```typescript
// Change from:
{meterElements && meterElements.length > 0 && meterElements.map(element => (
  <MenuItem key={element.id} value={element.id.toString()}>

// To:
{meterElements && meterElements.length > 0 && meterElements.map(element => (
  <MenuItem key={element.meter_element_id} value={element.meter_element_id.toString()}>
```

Also update the form data initialization to use `meter_element_id`:

```typescript
// In the useEffect that initializes form data, change:
meter_element_id: card.meter_element_id?.toString() || '',

// To ensure it correctly maps the ID from the card data
```

## Correctness Properties

### Property 1: Modal Opens Without TypeError
**Validates: Requirements 1.1**

When a user clicks Edit on any dashboard card:
- No TypeError should occur
- The modal should render successfully
- All form fields should be visible

### Property 2: Meter Elements Display Correctly
**Validates: Requirements 1.2**

When meter elements are fetched and displayed:
- All elements should appear in the selector dropdown
- Element IDs should be properly mapped from `meter_element_id`
- Selected element should be saveable with correct ID

### Property 3: Form Works for Multiple Cards
**Validates: Requirements 1.3**

When editing different cards:
- Modal should open without errors for any card
- Form should display correct data for each card
- No crashes on multiple sequential edits

## Files to Modify
1. `framework/frontend/dashboards/components/DashboardCardModal.tsx` - Fix line 361 and related code
2. `MeterItPro/frontend/src/services/dashboardService.ts` - Update type definition

## Testing Strategy

### Unit Tests
- Test meter element rendering with `meter_element_id` mapping
- Test form submission with correct element ID
- Test error handling for missing data

### Integration Tests
- Test full edit flow: click Edit → modal opens → form populated → submit
- Test editing multiple cards in sequence
- Test error handling

### Property-Based Tests
- For any dashboard card, clicking Edit should open modal without errors
- For any meter element, the selector should display it correctly
- For any sequence of card edits, the form should work correctly

## Rollback Plan
- Changes are minimal and isolated
- No database schema changes
- Can revert to previous version if issues arise
