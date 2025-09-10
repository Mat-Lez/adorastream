const ContentModel = require('../models/ContentModel');

class ContentService {
  constructor() {
    this.contentModel = new ContentModel();
  }

  // Get all content with filtering
  async getAllContent(filters = {}) {
    try {
      const content = this.contentModel.filter(filters);
      return content;
    } catch (error) {
      throw new Error(`Failed to retrieve content: ${error.message}`);
    }
  }

  // Get content by ID
  async getContentById(id) {
    try {
      if (!this.isValidUUID(id)) {
        throw new Error('Invalid content ID format');
      }
      
      const content = this.contentModel.getById(id);
      return content;
    } catch (error) {
      throw new Error(`Failed to retrieve content: ${error.message}`);
    }
  }

  // Get episodes by series ID
  async getEpisodesBySeries(seriesId) {
    try {
      if (!this.isValidUUID(seriesId)) {
        throw new Error('Invalid series ID format');
      }

      // Check if series exists
      const series = this.contentModel.getById(seriesId);
      if (!series || series.type !== 'series') {
        throw new Error('Series not found');
      }

      const episodes = this.contentModel.getEpisodesBySeries(seriesId);
      return episodes;
    } catch (error) {
      throw new Error(`Failed to retrieve episodes: ${error.message}`);
    }
  }

  // Create new content
  async createContent(contentData) {
    try {
      this.validateContentData(contentData);
      const newContent = this.contentModel.create(contentData);
      return newContent;
    } catch (error) {
      throw new Error(`Failed to create content: ${error.message}`);
    }
  }

  // Update content (full update)
  async updateContent(id, updateData) {
    try {
      if (!this.isValidUUID(id)) {
        throw new Error('Invalid content ID format');
      }

      this.validateContentData(updateData);
      const updatedContent = this.contentModel.update(id, updateData);
      return updatedContent;
    } catch (error) {
      throw new Error(`Failed to update content: ${error.message}`);
    }
  }

  // Partially update content
  async patchContent(id, updateData) {
    try {
      if (!this.isValidUUID(id)) {
        throw new Error('Invalid content ID format');
      }

      const existingContent = this.contentModel.getById(id);
      if (!existingContent) {
        return null;
      }

      // Merge with existing data
      const mergedData = { ...existingContent, ...updateData };
      this.validateContentData(mergedData);
      
      const updatedContent = this.contentModel.update(id, updateData);
      return updatedContent;
    } catch (error) {
      throw new Error(`Failed to update content: ${error.message}`);
    }
  }

  // Delete content
  async deleteContent(id) {
    try {
      if (!this.isValidUUID(id)) {
        throw new Error('Invalid content ID format');
      }

      const deletedContent = this.contentModel.delete(id);
      return deletedContent;
    } catch (error) {
      throw new Error(`Failed to delete content: ${error.message}`);
    }
  }

  // Validate content data
  validateContentData(contentData) {
    const requiredFields = {
      movie: ['type', 'title', 'releaseYear', 'duration', 'director'],
      series: ['type', 'title', 'releaseYear', 'totalSeasons', 'totalEpisodes', 'creator'],
      episode: ['type', 'title', 'seriesId', 'seasonNumber', 'episodeNumber', 'duration']
    };

    const contentType = contentData.type;
    if (!contentType || !requiredFields[contentType]) {
      throw new Error('Invalid content type');
    }

    const missingFields = requiredFields[contentType].filter(field => !contentData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Additional validations
    if (contentData.rating && (contentData.rating < 0 || contentData.rating > 10)) {
      throw new Error('Rating must be between 0 and 10');
    }

    if (contentData.releaseYear && (contentData.releaseYear < 1900 || contentData.releaseYear > new Date().getFullYear() + 5)) {
      throw new Error('Invalid release year');
    }
  }

  // Validate UUID format
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = ContentService;
