// @ts-nocheck
const express = require('express');
const Contact = require('../models/ContactWithSchema.js');
const { requirePermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
// Note: authenticateToken is now applied globally in server.js

// Get all contacts with filtering and pagination
router.get('/', requirePermission('contact:read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search
    } = req.query;

    console.log('\n' + '='.repeat(80));
    console.log('[API] GET /contacts - Fetch Contacts');
    console.log('='.repeat(80));
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('='.repeat(80) + '\n');

    // Build where clause for Contact
    let where = {};
    
    // Handle search parameter
    if (search) {
      where.name = search; // Assuming search by name
    }

    // Use framework method to process filters from query parameters
    const filters = Contact.processFilters(req.query);
    where = { ...where, ...filters };

    // Build options for findAll
    const options = {
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      tenant_id: req.user?.tenant_id // Automatic tenant filtering
    };

    console.log('[API] Query options:', JSON.stringify(options, null, 2));

    // Get contacts
    const result = await Contact.findAll(options);

    console.log('[API] Query result - items count:', result.rows.length, 'total:', result.pagination.total);
    console.log('='.repeat(80) + '\n');

    res.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
});

// Get single contact by ID
router.get('/:id', requirePermission('contact:read'), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contact' });
  }
});

// Create contact
router.post('/', requirePermission('contact:create'), asyncHandler(async (req, res) => {
  console.log('\n' + '█'.repeat(120));
  console.log('█ [API] POST /contacts - Create Contact');
  console.log('█'.repeat(120));
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Request Body Keys:', Object.keys(req.body));
  console.log('User Object Keys:', Object.keys(req.user || {}));
  console.log('User Object:', JSON.stringify(req.user, null, 2));
  console.log('User tenant_id:', req.user?.tenant_id);
  console.log('User tenant_id type:', typeof req.user?.tenant_id);
  console.log('User tenant_id is null?', req.user?.tenant_id === null);
  console.log('User tenant_id is undefined?', req.user?.tenant_id === undefined);
  console.log('User tenant_id is falsy?', !req.user?.tenant_id);
  console.log('█'.repeat(120) + '\n');
  
  // CRITICAL: Always set tenant_id from authenticated user
  // This is required for the foreign key constraint on tenant_id
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    console.error('ERROR: No tenant_id found in user object!');
    console.error('User object full dump:', req.user);
    return res.status(400).json({
      success: false,
      message: 'User must have a valid tenant_id to create contacts',
      debug: {
        user_tenant_id: req.user?.tenant_id,
        user_keys: Object.keys(req.user || {}),
        user_full: req.user
      }
    });
  }
  
  const contactData = {
    ...req.body,
    tenant_id: tenantId
  };
  
  console.log('Contact data to save:', JSON.stringify(contactData, null, 2));
  
  const contact = new Contact(contactData);
  
  console.log('\n' + '█'.repeat(120));
  console.log('█ [CONTACT] Instance created');
  console.log('█'.repeat(120));
  console.log('Contact instance properties:', Object.keys(contact).filter(k => !k.startsWith('_')));
  console.log('Contact instance data:', {
    contact_id: contact.contact_id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    active: contact.active,
    company: contact.company,
    role: contact.role,
    street: contact.street,
    city: contact.city,
    state: contact.state,
    zip: contact.zip,
    country: contact.country,
    notes: contact.notes,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
    tenant_id: contact.tenant_id
  });
  console.log('█'.repeat(120) + '\n');
  
  await contact.save();
  
  console.log('[API] Contact created successfully:', contact.contact_id);
  res.status(201).json({ success: true, data: contact });
}));

// Update contact
router.put('/:id', requirePermission('contact:update'), asyncHandler(async (req, res) => {
  console.log('\n' + '='.repeat(80));
  console.log('[API] PUT /contacts/:id - Update Contact');
  console.log('='.repeat(80));
  console.log('Contact ID:', req.params.id);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('='.repeat(80) + '\n');
  
  // Find the contact first
  const contact = await Contact.findById(req.params.id);
  
  console.log('\n' + '='.repeat(80));
  console.log('[API] Contact found from database');
  console.log('='.repeat(80));
  console.log('Contact instance keys:', Object.keys(contact));
  console.log('Contact.id:', contact.id);
  console.log('Contact.contact_id:', contact.contact_id);
  console.log('Contact[Contact.primaryKey]:', contact[Contact.primaryKey]);
  console.log('='.repeat(80) + '\n');
  
  if (!contact) {
    return res.status(404).json({ success: false, message: 'Contact not found' });
  }
  
  // CRITICAL: Protect tenant_id from being changed
  // Validate that the contact belongs to the authenticated user's tenant
  const userTenantId = req.user?.tenant_id;
  if (contact.tenant_id !== userTenantId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update this contact'
    });
  }
  
  // Remove tenant_id from update data - it cannot be changed
  const updateData = { ...req.body };
  delete updateData.tenant_id;
  
  // Update the contact using instance method
  await contact.update(updateData);
  
  console.log('\n' + '='.repeat(80));
  console.log('[API] Contact Updated Successfully');
  console.log('='.repeat(80));
  console.log('Updated Contact:', JSON.stringify(contact, null, 2));
  console.log('='.repeat(80) + '\n');
  
  res.json({ success: true, data: contact });
}));

// Delete contact
router.delete('/:id', requirePermission('contact:delete'), async (req, res) => {
  try {
    // Find the contact first
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    
    // Delete the contact using instance method
    await contact.delete();
    
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ success: false, message: 'Failed to delete contact' });
  }
});


// Get contact statistics
router.get('/stats/overview', requirePermission('contact:read'), async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          customers: { $sum: { $cond: [{ $eq: ['$type', 'customer'] }, 1, 0] } },
          vendors: { $sum: { $cond: [{ $eq: ['$type', 'vendor'] }, 1, 0] } },
          activeContacts: { $sum: { $cond: [{ $eq: ['$active', 'true'] }, 1, 0] } },
          inactiveContacts: { $sum: { $cond: [{ $eq: ['$active', 'false'] }, 1, 0] } }
        }
      }
    ]);

    const industryStats = await Contact.aggregate([
      { $match: { industry: { $exists: true, $ne: null } } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalContacts: 0,
          customers: 0,
          vendors: 0,
          activeContacts: 0,
          inactiveContacts: 0
        },
        topIndustries: industryStats
      }
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contact statistics' });
  }
});

module.exports = router;