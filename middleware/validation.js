const { body, param, query, validationResult } = require('express-validator');

// Validation rules for content creation/update
const contentValidation = [
  body('type')
    .isIn(['movie', 'series', 'episode'])
    .withMessage('Type must be movie, series, or episode'),
  
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('releaseYear')
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('Release year must be a valid year'),
  
  body('genre')
    .optional()
    .isArray()
    .withMessage('Genre must be an array'),
  
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Rating must be between 0 and 10'),
  
  // Movie-specific validations
  body('duration')
    .if(body('type').equals('movie'))
    .isInt({ min: 1 })
    .withMessage('Duration is required for movies and must be a positive integer'),
  
  body('director')
    .if(body('type').equals('movie'))
    .notEmpty()
    .withMessage('Director is required for movies'),
  
  // Series-specific validations
  body('totalSeasons')
    .if(body('type').equals('series'))
    .isInt({ min: 1 })
    .withMessage('Total seasons is required for series and must be a positive integer'),
  
  body('totalEpisodes')
    .if(body('type').equals('series'))
    .isInt({ min: 1 })
    .withMessage('Total episodes is required for series and must be a positive integer'),
  
  body('creator')
    .if(body('type').equals('series'))
    .notEmpty()
    .withMessage('Creator is required for series'),
  
  // Episode-specific validations
  body('seriesId')
    .if(body('type').equals('episode'))
    .isUUID()
    .withMessage('Series ID is required for episodes and must be a valid UUID'),
  
  body('seasonNumber')
    .if(body('type').equals('episode'))
    .isInt({ min: 1 })
    .withMessage('Season number is required for episodes and must be a positive integer'),
  
  body('episodeNumber')
    .if(body('type').equals('episode'))
    .isInt({ min: 1 })
    .withMessage('Episode number is required for episodes and must be a positive integer'),
  
  body('duration')
    .if(body('type').equals('episode'))
    .isInt({ min: 1 })
    .withMessage('Duration is required for episodes and must be a positive integer'),
  
  body('cast')
    .optional()
    .isArray()
    .withMessage('Cast must be an array'),
  
  body('posterUrl')
    .optional()
    .isURL()
    .withMessage('Poster URL must be a valid URL'),
  
  body('trailerUrl')
    .optional()
    .isURL()
    .withMessage('Trailer URL must be a valid URL'),
  
  body('thumbnailUrl')
    .optional()
    .isURL()
    .withMessage('Thumbnail URL must be a valid URL'),
  
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL')
];

// Validation for ID parameter
const idValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid content ID format')
];

// Validation for query parameters
const queryValidation = [
  query('type')
    .optional()
    .isIn(['movie', 'series', 'episode'])
    .withMessage('Type filter must be movie, series, or episode'),
  
  query('rating')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Rating filter must be between 0 and 10'),
  
  query('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('Year filter must be a valid year'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  contentValidation,
  idValidation,
  queryValidation,
  handleValidationErrors
};
