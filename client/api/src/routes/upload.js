const express = require('express');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { uploadSingle, getFileUrl, deleteFile } = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Upload image endpoint
router.post('/image', requirePermission('settings:update'), uploadSingle('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = getFileUrl(req, req.file.filename);
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      deleteFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

// Delete image endpoint
router.delete('/image/:filename', requirePermission('settings:update'), async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }
    
    const filePath = path.join(__dirname, '../../uploads', filename);
    deleteFile(filePath);
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
});

module.exports = router;