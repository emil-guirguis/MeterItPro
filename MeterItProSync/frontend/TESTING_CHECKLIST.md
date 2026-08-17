# Testing Checklist for Sync Frontend Refactoring

## ✅ Pre-Deployment Checklist

### Build and Compilation
- [ ] Run `npm run build` - verify no TypeScript errors
- [ ] Run `npm run lint` - verify no linting errors
- [ ] Check browser console for runtime errors

### Connection Status Testing

#### Local Sync Database
- [ ] With sync DB running: Status shows 🟢 "Local Sync Connected"
- [ ] With sync DB stopped: Status shows 🔴 "Local Sync Error/Disconnected"
- [ ] Hover tooltip displays correct message
- [ ] Status updates within 30 seconds of connection change

#### Remote Database
- [ ] With remote DB accessible: Status shows 🟢 "Remote DB Connected"
- [ ] With remote DB unreachable: Status shows 🔴 "Remote DB Error/Disconnected"
- [ ] Warning message appears when remote system is down
- [ ] Hover tooltip displays correct message

#### Remote API
- [ ] With Client System API running: Status shows 🟢 "Remote API Connected"
- [ ] With Client System API stopped: Status shows 🔴 "Remote API Error/Disconnected"
- [ ] Warning message appears when remote system is down
- [ ] Hover tooltip displays correct message

### Tenant Connection Flow

#### No Tenant Scenario
- [ ] Page loads successfully without errors
- [ ] Company Info card shows "Not Connected" state
- [ ] Info message explains what to do next
- [ ] "Connect Account" button is visible and clickable
- [ ] MeterSyncCard displays (always visible)
- [ ] BACnetMeterReadingCard displays (always visible)
- [ ] Sync-related cards are hidden (correct behavior)

#### Login Flow
- [ ] Click "Connect Account" button opens modal
- [ ] Email and password fields are functional
- [ ] Empty fields disable "Connect" button
- [ ] Invalid credentials show appropriate error
- [ ] Valid credentials trigger tenant sync
- [ ] Page refreshes after successful login
- [ ] All cards appear after login

#### With Tenant Scenario
- [ ] Company Info displays tenant name
- [ ] Address information displays correctly (if available)
- [ ] Website link is clickable (if available)
- [ ] Tenant ID shows in small text at bottom
- [ ] Connection status bubbles display
- [ ] Warning message shows if remote system down
- [ ] All sync cards now visible

### Error Message Testing

#### Network Errors
- [ ] Connection timeout shows: "Connection timeout. Please check if the sync service is running."
- [ ] Connection refused shows: "Cannot reach the sync service..."
- [ ] Network error shows: "Network connection error..."

#### HTTP Errors
- [ ] 404 error shows: "Tenant information not found..."
- [ ] 500 error shows: "Server error occurred..."
- [ ] 503 error shows: "Sync service is temporarily unavailable..."

#### Invalid Data
- [ ] Invalid tenant data shows: "Invalid tenant data received..."
- [ ] Error messages are user-friendly and actionable

### Sync Status Page

#### Card Visibility
- [ ] CompanyInfoCard always visible (top-left)
- [ ] Sync Queue card visible only with tenant
- [ ] Last Successful Sync card visible only with tenant
- [ ] Manual Sync card visible only with tenant
- [ ] Last Meter Sync card visible only with tenant
- [ ] Meter Count card visible only with tenant
- [ ] Last Meter Sync Results visible only with tenant
- [ ] Manual Meter Sync visible only with tenant
- [ ] MeterSyncCard always visible
- [ ] BACnetMeterReadingCard always visible

#### Sync Functionality
- [ ] Manual sync button works
- [ ] Manual sync disabled when Client System unreachable
- [ ] Success message appears after sync
- [ ] Error message appears on sync failure
- [ ] Page updates after sync completes

#### Meter Sync Functionality
- [ ] Manual meter sync button works
- [ ] Success message appears after sync
- [ ] Error message appears on sync failure
- [ ] Meter count updates correctly

### Visual and UX

#### Responsive Design
- [ ] Desktop view (>1200px): Cards in grid layout
- [ ] Tablet view (768-1200px): Cards stack appropriately
- [ ] Mobile view (<768px): Single column layout
- [ ] Connection bubbles wrap on small screens

#### Animations and Transitions
- [ ] Connection status bubbles animate on hover
- [ ] Status color transitions are smooth (0.3s ease)
- [ ] Shadow increases on hover
- [ ] Slight upward translation on hover

#### Accessibility
- [ ] All buttons have proper labels
- [ ] Tooltips provide helpful context
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

### Performance

#### Initial Load
- [ ] Page loads within 2 seconds
- [ ] Loading spinner shows during initial fetch
- [ ] No console errors or warnings
- [ ] Connection checks complete within 5 seconds each

#### Polling
- [ ] Status updates every 30 seconds automatically
- [ ] Last update timestamp shows correctly
- [ ] Polling doesn't cause memory leaks
- [ ] Polling stops when page unmounted

### Edge Cases

#### Rapid State Changes
- [ ] Toggling services quickly doesn't cause errors
- [ ] Status indicators handle rapid changes gracefully
- [ ] No race conditions in connection checks

#### Partial Connectivity
- [ ] Local DB up, remote down: Appropriate warnings
- [ ] Remote DB up, API down: Appropriate warnings
- [ ] All combinations show correct status

#### Data Validation
- [ ] Missing tenant fields handled gracefully
- [ ] Null values don't cause crashes
- [ ] Undefined properties have fallbacks
- [ ] Empty strings display as expected

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## 🐛 Common Issues to Watch For

### Issue: Connection status stuck on "Checking..."
**Solution**: Check if `/api/health/*` endpoints are accessible

### Issue: Cards not appearing even with tenant
**Solution**: Verify `tenantInfo` in useAppStore has data

### Issue: Login fails silently
**Solution**: Check browser console for API errors, verify auth endpoint

### Issue: Page doesn't refresh after login
**Solution**: Check if `window.location.reload()` is being called

### Issue: Connection bubbles wrong color
**Solution**: Verify ConnectionState enum values match component logic

## 📝 Post-Deployment Verification

- [ ] Monitor error logs for unexpected issues
- [ ] Check user feedback on new error messages
- [ ] Verify connection status accuracy in production
- [ ] Confirm all sync operations work as expected
- [ ] Validate performance metrics are acceptable

## 🎯 Success Criteria

- ✅ Zero TypeScript errors
- ✅ Zero linter errors
- ✅ All cards display correctly with/without tenant
- ✅ Error messages are clear and helpful
- ✅ Connection status updates in real-time
- ✅ Login flow works smoothly
- ✅ No console errors in normal operation
- ✅ Responsive on all screen sizes
- ✅ Smooth animations and transitions
- ✅ No memory leaks from polling

---

**Tested by**: _______________  
**Date**: _______________  
**Environment**: [ ] Dev [ ] Staging [ ] Production  
**Status**: [ ] Pass [ ] Fail [ ] Needs Review
