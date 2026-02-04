const express = require('express');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const SettingsService = require('../services/settingsService');

const router = express.Router();
router.use(authenticateToken);

// Get company settings
router.get('/company', requirePermission('settings:read'), async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found in user context'
      });
    }
    
    const settings = await SettingsService.getCompanySettings(tenantId);
    
    res.json({ 
      success: true, 
      data: settings 
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching company settings:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch company settings',
      error: errorMessage 
    });
  }
});

// Update company settings
router.put('/company', requirePermission('settings:update'), async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.user.tenantId;
    console.log('[SETTINGS] Tenant ID from user:', tenantId);
    console.log('[SETTINGS] User object:', { tenant_id: req.user.tenant_id, tenantId: req.user.tenantId });
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found in user context'
      });
    }
    
    console.log('[SETTINGS] Updating company settings with data:', req.body);
    const dbData = SettingsService.formatForDatabase(req.body);
    console.log('[SETTINGS] Formatted DB data:', dbData);
    
    const settings = await SettingsService.updateCompanySettings(tenantId, dbData);
    console.log('[SETTINGS] Update successful:', settings);
    
    res.json({ 
      success: true, 
      data: settings,
      message: 'Company settings updated successfully'
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack : '';
    console.error('[SETTINGS] Error updating company settings:', err);
    console.error('[SETTINGS] Error stack:', errorStack);
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update company settings',
      error: errorMessage 
    });
  }
});

// Legacy endpoint for backward compatibility
router.get('/', requirePermission('settings:read'), async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID not found in user context'
      });
    }
    
    const settings = await SettingsService.getCompanySettings(tenantId);
    
    res.json({ 
      success: true, 
      data: { company: settings } 
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching settings:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch settings',
      error: errorMessage 
    });
  }
});

module.exports = router;