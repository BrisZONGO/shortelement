const express = require('express');
const path = require('path');
const upload = require('../middleware/upload');
const { protect, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    const extension = path.extname(req.file.originalname || '').replace('.', '');

    res.status(201).json({
      success: true,
      message: 'Fichier uploadé avec succès',
      file: {
        nom: req.file.originalname,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        extension,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

