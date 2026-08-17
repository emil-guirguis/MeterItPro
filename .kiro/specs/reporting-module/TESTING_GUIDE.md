# Reporting Module Testing Guide

## Quick Start

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd client/backend
npm start

# Terminal 2 - Frontend
cd MeterItPro/frontend
npm run dev
```

### 2. Access Reports Module

Navigate to: `http://localhost:5173/reports`

## Test Scenarios

### Scenario 1: View Reports List

**Steps**:
1. Navigate to `/reports`
2. Verify the reports list displays
3. Check that columns show: Name, Type, Enabled
4. Verify stats display at the top

**Expected Results**:
- List loads without errors
- Columns are properly formatted
- Stats show correct counts
- Empty state message if no reports exist

### Scenario 2: Create New Report

**Steps**:
1. Click "Create Report" button
2. Fill in the form:
   - **Name**: "Daily Usage Report"
   - **Type**: Select "Meter Readings"
   - **Enabled**: Check the box
   - **Schedule**: "0 9 * * *" (Daily at 9 AM)
   - **Recipients**: "user@example.com, admin@example.com"
3. Click "Save"

**Expected Results**:
- Form opens in modal
- All fields render correctly
- Recipients field accepts comma-separated emails
- Form submits successfully
- New report appears in list
- Success notification displays

### Scenario 3: Edit Existing Report

**Steps**:
1. Click edit icon on a report
2. Modify the name
3. Add another recipient email
4. Click "Save"

**Expected Results**:
- Form opens with existing data
- Recipients display as comma-separated string
- Changes save successfully
- List updates with new data

### Scenario 4: Delete Report

**Steps**:
1. Click delete icon on a report
2. Confirm deletion in dialog

**Expected Results**:
- Confirmation dialog appears
- Report is deleted after confirmation
- List updates to remove deleted report

### Scenario 5: Filter Reports

**Steps**:
1. Click "Filters" button
2. Select "Type" filter
3. Choose "Meter Readings"
4. Apply filter

**Expected Results**:
- Filter panel opens
- Type filter options display
- List filters to show only matching reports
- Stats update to reflect filtered data

### Scenario 6: Search Reports

**Steps**:
1. Enter text in search box
2. Verify list filters in real-time

**Expected Results**:
- Search works across report names
- Results update as you type
- Clear search button appears

### Scenario 7: Export Reports

**Steps**:
1. Click "Export" button
2. Select CSV format
3. Click "Export"

**Expected Results**:
- Export modal opens
- CSV file downloads
- File contains all report data
- Columns match list columns

### Scenario 8: View Report History

**Steps**:
1. Select a report (if history tab is implemented)
2. Switch to "History" tab
3. View execution history

**Expected Results**:
- History tab appears
- Execution records display
- Date filters work
- Email logs can be viewed

### Scenario 9: Pagination

**Steps**:
1. Create multiple reports (>10)
2. Navigate through pages

**Expected Results**:
- Pagination controls appear
- Page navigation works
- Items per page selector works
- Total count is accurate

### Scenario 10: Form Validation

**Steps**:
1. Click "Create Report"
2. Try to submit empty form
3. Try invalid email format
4. Try invalid cron expression

**Expected Results**:
- Required field errors display
- Email validation works
- Cron validation works (backend)
- Form prevents submission with errors

## API Testing

### Test Schema Endpoint

```bash
curl -X GET http://localhost:3001/api/schema/report \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "entityName": "Report",
    "tableName": "reports",
    "formFields": { ... },
    "formTabs": [ ... ]
  }
}
```

### Test List Reports

```bash
curl -X GET http://localhost:3001/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 10,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

### Test Create Report

```bash
curl -X POST http://localhost:3001/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Report",
    "type": "meter_readings",
    "schedule": "0 9 * * *",
    "recipients": ["user@example.com"],
    "enabled": true
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Test Report",
    "type": "meter_readings",
    ...
  }
}
```

## Common Issues & Solutions

### Issue: Schema not loading
**Solution**: Check that ReportWithSchema is registered in `client/backend/src/routes/schema.js`

### Issue: Recipients not saving
**Solution**: Verify transformation functions in schema definition (fromApi/toApi)

### Issue: Form fields not rendering
**Solution**: Check browser console for schema loading errors

### Issue: List not displaying
**Solution**: Verify API endpoint returns correct data structure

### Issue: Authentication errors
**Solution**: Ensure token is valid and user has proper permissions

## Browser Console Checks

Open browser DevTools and check for:

1. **Schema Loading**:
   ```
   [ReportAPI] Making request to: /api/schema/report
   [ReportAPI] Response status: 200
   ```

2. **Data Fetching**:
   ```
   [reportsService] getAll called with params: {...}
   [ReportAPI] Making request to: /api/reports?page=1&limit=10
   ```

3. **No Errors**:
   - No red error messages
   - No 404 or 500 responses
   - No TypeScript errors

## Performance Checks

- [ ] List loads in < 1 second
- [ ] Form opens instantly
- [ ] Search filters in real-time
- [ ] No memory leaks (check DevTools Memory tab)
- [ ] No unnecessary re-renders

## Accessibility Checks

- [ ] All buttons have labels
- [ ] Form fields have labels
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG standards

## Mobile Responsive Checks

- [ ] List displays on mobile
- [ ] Form is usable on mobile
- [ ] Buttons are touch-friendly
- [ ] No horizontal scrolling
- [ ] Columns hide appropriately

## Success Criteria

✅ All test scenarios pass
✅ No console errors
✅ API responses are correct
✅ Data persists correctly
✅ UI is responsive
✅ Performance is acceptable

## Reporting Issues

If you find issues, document:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser console errors
5. Network tab responses
6. Screenshots if applicable

## Next Steps After Testing

1. Fix any issues found
2. Add unit tests for store
3. Add integration tests for API
4. Update user documentation
5. Deploy to staging environment
