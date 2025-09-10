const { v4: uuidv4 } = require('uuid');

class ContentModel {
  constructor() {
    this.content = new Map();
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Sample movies
    const movie1 = {
      id: uuidv4(),
      type: 'movie',
      title: 'The Dark Knight',
      description: 'Batman faces the Joker in this epic superhero film.',
      releaseYear: 2008,
      duration: 152, // minutes
      genre: ['Action', 'Crime', 'Drama'],
      rating: 9.0,
      director: 'Christopher Nolan',
      cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
      posterUrl: 'https://example.com/dark-knight-poster.jpg',
      trailerUrl: 'https://example.com/dark-knight-trailer.mp4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const movie2 = {
      id: uuidv4(),
      type: 'movie',
      title: 'Inception',
      description: 'A thief who steals corporate secrets through dream-sharing technology.',
      releaseYear: 2010,
      duration: 148,
      genre: ['Action', 'Sci-Fi', 'Thriller'],
      rating: 8.8,
      director: 'Christopher Nolan',
      cast: ['Leonardo DiCaprio', 'Marion Cotillard', 'Tom Hardy'],
      posterUrl: 'https://example.com/inception-poster.jpg',
      trailerUrl: 'https://example.com/inception-trailer.mp4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Sample series
    const series1 = {
      id: uuidv4(),
      type: 'series',
      title: 'Breaking Bad',
      description: 'A high school chemistry teacher turned methamphetamine manufacturer.',
      releaseYear: 2008,
      totalSeasons: 5,
      totalEpisodes: 62,
      genre: ['Crime', 'Drama', 'Thriller'],
      rating: 9.5,
      creator: 'Vince Gilligan',
      cast: ['Bryan Cranston', 'Aaron Paul', 'Anna Gunn'],
      posterUrl: 'https://example.com/breaking-bad-poster.jpg',
      trailerUrl: 'https://example.com/breaking-bad-trailer.mp4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Sample episodes
    const episode1 = {
      id: uuidv4(),
      type: 'episode',
      title: 'Pilot',
      description: 'Walter White discovers he has lung cancer and partners with Jesse Pinkman.',
      seriesId: series1.id,
      seasonNumber: 1,
      episodeNumber: 1,
      duration: 58,
      releaseYear: 2008,
      rating: 8.9,
      director: 'Vince Gilligan',
      cast: ['Bryan Cranston', 'Aaron Paul'],
      thumbnailUrl: 'https://example.com/breaking-bad-s1e1-thumb.jpg',
      videoUrl: 'https://example.com/breaking-bad-s1e1.mp4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const episode2 = {
      id: uuidv4(),
      type: 'episode',
      title: 'Cat\'s in the Bag...',
      description: 'Walter and Jesse try to dispose of the bodies.',
      seriesId: series1.id,
      seasonNumber: 1,
      episodeNumber: 2,
      duration: 48,
      releaseYear: 2008,
      rating: 8.7,
      director: 'Adam Bernstein',
      cast: ['Bryan Cranston', 'Aaron Paul'],
      thumbnailUrl: 'https://example.com/breaking-bad-s1e2-thumb.jpg',
      videoUrl: 'https://example.com/breaking-bad-s1e2.mp4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store all content
    this.content.set(movie1.id, movie1);
    this.content.set(movie2.id, movie2);
    this.content.set(series1.id, series1);
    this.content.set(episode1.id, episode1);
    this.content.set(episode2.id, episode2);
  }

  // Create new content
  create(contentData) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const newContent = {
      id,
      ...contentData,
      createdAt: now,
      updatedAt: now
    };

    this.content.set(id, newContent);
    return newContent;
  }

  // Get all content
  getAll() {
    return Array.from(this.content.values());
  }

  // Get content by ID
  getById(id) {
    return this.content.get(id) || null;
  }

  // Get episodes by series ID
  getEpisodesBySeries(seriesId) {
    return Array.from(this.content.values())
      .filter(item => item.type === 'episode' && item.seriesId === seriesId)
      .sort((a, b) => {
        if (a.seasonNumber !== b.seasonNumber) {
          return a.seasonNumber - b.seasonNumber;
        }
        return a.episodeNumber - b.episodeNumber;
      });
  }

  // Update content
  update(id, updateData) {
    const existingContent = this.content.get(id);
    if (!existingContent) {
      return null;
    }

    const updatedContent = {
      ...existingContent,
      ...updateData,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    this.content.set(id, updatedContent);
    return updatedContent;
  }

  // Delete content
  delete(id) {
    const deletedContent = this.content.get(id);
    if (!deletedContent) {
      return null;
    }

    this.content.delete(id);
    return deletedContent;
  }

  // Get content statistics
  getStats() {
    const allContent = Array.from(this.content.values());
    const movies = allContent.filter(item => item.type === 'movie');
    const series = allContent.filter(item => item.type === 'series');
    const episodes = allContent.filter(item => item.type === 'episode');

    return {
      total: allContent.length,
      movies: movies.length,
      series: series.length,
      episodes: episodes.length,
      averageRating: allContent.reduce((sum, item) => sum + (item.rating || 0), 0) / allContent.length
    };
  }

  // Filter content by criteria
  filter(filters = {}) {
    let results = this.getAll();

    // Apply filters
    if (filters.type) {
      results = results.filter(item => item.type === filters.type);
    }

    if (filters.genre) {
      results = results.filter(item => 
        item.genre && item.genre.some(g => 
          g.toLowerCase().includes(filters.genre.toLowerCase())
        )
      );
    }

    if (filters.rating) {
      results = results.filter(item => item.rating >= filters.rating);
    }

    if (filters.year) {
      results = results.filter(item => item.releaseYear === parseInt(filters.year));
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      results = results.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by creation date (newest first)
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return results;
  }
}

module.exports = ContentModel;
