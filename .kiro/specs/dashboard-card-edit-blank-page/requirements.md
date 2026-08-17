# Dashboard Card Edit Blank Page - Requirements

## Feature Name
dashboard-card-edit-blank-page

## Problem Statement
When a user clicks the "Edit" button on a dashboard card, the edit modal crashes with a TypeError: "Cannot read properties of undefined (reading 'toString')" because the backend returns `meter_element_id` but the frontend code expects `id`.

## User Stories

### 1.1 Edit Card Modal Should Display Form Without Errors
**As a** dashboard user  
**I want to** see the card editing form when I click the Edit button without errors  
**So that** I can modify the card's configuration

**Acceptance Criteria:**
- When the Edit button is clicked on a dashboard card, a modal dialog opens
- The modal displays all form fields (card name, description, meter selector, etc.)
- The form is populated with the current card's data
- No TypeError or blank page appears
- The modal renders successfully with all meter elements

### 1.2 Meter Elements Should Map Correctly
**As a** the system  
**I want to** correctly map backend meter element data to frontend expectations  
**So that** the form can display and select meter elements

**Acceptance Criteria:**
- Backend returns `meter_element_id` field
- Frontend correctly maps `meter_element_id` to `id` for rendering
- Meter element selector displays all available elements
- Selected meter element can be properly saved

### 1.3 Modal Should Properly Re-render on Card Selection
**As a** dashboard user  
**I want to** the modal to properly update when I select different cards to edit  
**So that** I can edit multiple cards without issues

**Acceptance Criteria:**
- Clicking Edit on different cards updates the modal form correctly
- The form data changes to reflect the selected card
- No stale data from previous edits appears in the form
- The modal re-renders properly each time a new card is selected

## Technical Context

### Root Cause Identified
**Data Mapping Mismatch**: The backend route `/api/dashboard/meters/:meterId/elements` returns objects with `meter_element_id` field, but the frontend DashboardCardModal component tries to access `element.id` which is undefined, causing a TypeError at line 361.

**Backend Response Structure**:
```javascript
{
  meter_element_id: 123,  // ← Backend returns this
  element: "Phase A",
  name: "Phase A - Voltage",
  meter_id: 456
}
```

**Frontend Expectation**:
```typescript
{
  id: 123,  // ← Frontend expects this
  element: "Phase A",
  name: "Phase A - Voltage",
  meter_id: 456
}
```

### Affected Files
- `framework/frontend/dashboards/components/DashboardCardModal.tsx` - Line 361 tries to access `element.id.toString()`
- `MeterItPro/frontend/src/services/dashboardService.ts` - Type definition expects `id` field
- `client/backend/src/routes/dashboard.js` - Returns `meter_element_id` instead of `id`

## Success Criteria
- Edit button click opens a properly populated modal form without errors
- All form fields display with current card data
- No TypeError or blank pages appear
- Meter elements are correctly displayed in the selector
- Multiple card edits work correctly without stale data
