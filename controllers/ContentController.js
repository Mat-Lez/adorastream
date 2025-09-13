const ContentService = require('../services/ContentService');
const ContentView = require('../views/ContentView');

class ContentController {
  constructor() {
    this.contentService = new ContentService();
    this.contentView = new ContentView();
  }

  // Get all content with optional filtering
  async getAllContent(req, res) {
    try {
      const content = await this.contentService.getAllContent(req.query);
      const response = this.contentView.renderContentList(content);
      res.json(response);
    } catch (error) {
      const errorResponse = this.contentView.renderError('Failed to fetch content', error.message);
      res.status(500).json(errorResponse);
    }
  }

  // Get content by ID
  async getContentById(req, res) {
    try {
      const content = await this.contentService.getContentById(req.params.id);
      if (!content) {
        const errorResponse = this.contentView.renderError('Content not found', null, 404);
        return res.status(404).json(errorResponse);
      }
      
      const response = this.contentView.renderContent(content);
      res.json(response);
    } catch (error) {
      const errorResponse = this.contentView.renderError('Failed to fetch content', error.message);
      res.status(500).json(errorResponse);
    }
  }

  // Get episodes by series ID
  async getEpisodesBySeries(req, res) {
    try {
      const { seriesId } = req.params;
      const episodes = await this.contentService.getEpisodesBySeries(seriesId);
      const response = this.contentView.renderContentList(episodes, 'episodes');
      res.json(response);
    } catch (error) {
      const errorResponse = this.contentView.renderError('Failed to fetch episodes', error.message);
      res.status(500).json(errorResponse);
    }
  }

  // Create new content
  async createContent(req, res) {
    try {
      const newContent = await this.contentService.createContent(req.body);
      const response = this.contentView.renderContent(newContent, 'Content created successfully');
      res.status(201).json(response);
    } catch (error) {
      const errorResponse = this.contentView.renderError('Failed to create content', error.message);
      res.status(500).json(errorResponse);
    }
  }

  // Update content (full update)
  async updateContent(req, res) {
    try {
      const updatedContent = await this.contentService.updateContent(req.params.id, req.body);
      if (!updatedContent) {
        const errorResponse = this.contentView.renderError('Content not found', null, 404);
        return res.status(404).json(errorResponse);
      }
      
      const response = this.contentView.renderContent(updatedContent, 'Content updated successfully');
      res.json(response);
    } catch (error) {
      const errorResponse = this.contentView.renderError('Failed to update content', error.message);
      res.status(500).json(errorResponse);
    }
  }

  // Partially update content
  async patchContent(req, res) {
    try {
      const updatedContent = await this.contentService.patchContent(req.params.id, req.body);
      if (!updatedContent) {
        const errorResponse = this.contentView.renderError('Content not found', null, 404);
        return res.status(404).json(errorResponse);
      }
      
      const response = this.contentView.renderContent(updatedContent, 'Content updated successfully');
      res.json(response);
    } catch (error) {
      const errorResponse = this.contentView.renderError('Failed to update content', error.message);
      res.status(500).json(errorResponse);
    }
  }

  // Delete content
  async deleteContent(req, res) {
    try {
      const deletedContent = await this.contentService.deleteContent(req.params.id);
      if (!deletedContent) {
        const errorResponse = this.contentView.renderError('Content not found', null, 404);
        return res.status(404).json(errorResponse);
      }
      
      const response = this.contentView.renderContent(deletedContent, 'Content deleted successfully');
      res.json(response);
    } catch (error) {
      const errorResponse = this.contentView.renderError('Failed to delete content', error.message);
      res.status(500).json(errorResponse);
    }
  }

  // Fetch external rating for existing content
  async fetchExternalRating(req, res) {
    try {
      const updatedContent = await this.contentService.fetchExternalRating(req.params.id);
      const response = this.contentView.renderContent(updatedContent, 'External rating fetched and updated successfully');
      res.json(response);
    } catch (error) {
      const errorResponse = this.contentView.renderError('Failed to fetch external rating', error.message);
      res.status(500).json(errorResponse);
    }
  }

  // Get rating service status
  async getRatingServiceStatus(req, res) {
    try {
      const status = this.contentService.getRatingServiceStatus();
      const response = this.contentView.renderContent(status, 'Rating service status retrieved');
      res.json(response);
    } catch (error) {
      const errorResponse = this.contentView.renderError('Failed to get rating service status', error.message);
      res.status(500).json(errorResponse);
    }
  }

  // Clear rating cache
  async clearRatingCache(req, res) {
    try {
      const result = this.contentService.clearRatingCache();
      const response = this.contentView.renderContent(result, 'Rating cache cleared successfully');
      res.json(response);
    } catch (error) {
      const errorResponse = this.contentView.renderError('Failed to clear rating cache', error.message);
      res.status(500).json(errorResponse);
    }
  }

  // Get rating cache statistics
  async getRatingCacheStats(req, res) {
    try {
      const stats = this.contentService.getRatingCacheStats();
      const response = this.contentView.renderContent(stats, 'Rating cache statistics retrieved');
      res.json(response);
    } catch (error) {
      const errorResponse = this.contentView.renderError('Failed to get rating cache statistics', error.message);
      res.status(500).json(errorResponse);
    }
  }
}

module.exports = ContentController;
