const express = require('express');
const ContentController = require('../controllers/ContentController');
const { contentValidation, idValidation, queryValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();
const contentController = new ContentController();

// Get all content with optional filtering
router.get('/', queryValidation, handleValidationErrors, contentController.getAllContent.bind(contentController));

// Get content by ID
router.get('/:id', idValidation, handleValidationErrors, contentController.getContentById.bind(contentController));

// Create new content
router.post('/', contentValidation, handleValidationErrors, contentController.createContent.bind(contentController));

// Update content (full update)
router.put('/:id', idValidation, contentValidation, handleValidationErrors, contentController.updateContent.bind(contentController));

// Partially update content
router.patch('/:id', idValidation, handleValidationErrors, contentController.patchContent.bind(contentController));

// Delete content
router.delete('/:id', idValidation, handleValidationErrors, contentController.deleteContent.bind(contentController));

module.exports = router;
