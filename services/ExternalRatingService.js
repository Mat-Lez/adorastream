const axios = require('axios');
const NodeCache = require('node-cache');

class ExternalRatingService {
  constructor() {
    // Cache ratings for 24 hours to avoid repeated API calls
    this.cache = new NodeCache({ stdTTL: 86400 });
    
    // API configurations
    this.apis = {
      omdb: {
        baseUrl: 'http://www.omdbapi.com/',
        apiKey: process.env.OMDB_API_KEY,
        enabled: !!process.env.OMDB_API_KEY
      },
      tmdb: {
        baseUrl: 'https://api.themoviedb.org/3/',
        apiKey: process.env.TMDB_API_KEY,
        enabled: !!process.env.TMDB_API_KEY
      }
    };
  }

  // Main method to fetch rating for content
  async fetchRating(title, year = null, type = 'movie') {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(title, year, type);
      const cachedRating = this.cache.get(cacheKey);
      if (cachedRating) {
        console.log(`Rating found in cache for: ${title}`);
        return cachedRating;
      }

      // Try different APIs in order of preference
      let rating = null;
      
      if (this.apis.omdb.enabled) {
        rating = await this.fetchFromOMDb(title, year, type);
      }
      
      if (!rating && this.apis.tmdb.enabled) {
        rating = await this.fetchFromTMDB(title, year, type);
      }

      if (!rating) {
        // Fallback to default rating if no external source available
        rating = this.getDefaultRating();
      }

      // Cache the result
      this.cache.set(cacheKey, rating);
      
      return rating;
    } catch (error) {
      console.error('Error fetching external rating:', error.message);
      return this.getDefaultRating();
    }
  }

  // Fetch rating from OMDb API (IMDb data)
  async fetchFromOMDb(title, year, type) {
    try {
      const params = {
        apikey: this.apis.omdb.apiKey,
        t: title,
        type: type === 'movie' ? 'movie' : 'series',
        plot: 'short'
      };

      if (year) {
        params.y = year;
      }

      const response = await axios.get(this.apis.omdb.baseUrl, { params });
      
      if (response.data.Response === 'True') {
        const data = response.data;
        return {
          source: 'OMDb (IMDb)',
          imdbRating: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null,
          imdbVotes: data.imdbVotes !== 'N/A' ? parseInt(data.imdbVotes.replace(/,/g, '')) : null,
          metascore: data.Metascore !== 'N/A' ? parseInt(data.Metascore) : null,
          rottenTomatoes: data.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value,
          plot: data.Plot,
          director: data.Director,
          writer: data.Writer,
          actors: data.Actors,
          genre: data.Genre?.split(', '),
          runtime: data.Runtime !== 'N/A' ? data.Runtime : null,
          year: data.Year,
          rated: data.Rated,
          language: data.Language,
          country: data.Country,
          awards: data.Awards,
          poster: data.Poster !== 'N/A' ? data.Poster : null,
          imdbID: data.imdbID,
          type: data.Type,
          dvd: data.DVD,
          boxOffice: data.BoxOffice,
          production: data.Production,
          website: data.Website
        };
      }
      
      return null;
    } catch (error) {
      console.error('OMDb API error:', error.message);
      return null;
    }
  }

  // Fetch rating from The Movie Database (TMDB)
  async fetchFromTMDB(title, year, type) {
    try {
      // First, search for the content
      const searchParams = {
        api_key: this.apis.tmdb.apiKey,
        query: title,
        language: 'en-US'
      };

      if (year) {
        searchParams.year = year;
      }

      const searchUrl = type === 'movie' 
        ? `${this.apis.tmdb.baseUrl}search/movie`
        : `${this.apis.tmdb.baseUrl}search/tv`;

      const searchResponse = await axios.get(searchUrl, { params: searchParams });
      
      if (searchResponse.data.results && searchResponse.data.results.length > 0) {
        const content = searchResponse.data.results[0];
        
        // Get detailed information
        const detailUrl = type === 'movie'
          ? `${this.apis.tmdb.baseUrl}movie/${content.id}`
          : `${this.apis.tmdb.baseUrl}tv/${content.id}`;
        
        const detailParams = {
          api_key: this.apis.tmdb.apiKey,
          language: 'en-US',
          append_to_response: 'credits,external_ids'
        };

        const detailResponse = await axios.get(detailUrl, { params: detailParams });
        const details = detailResponse.data;

        return {
          source: 'TMDB',
          tmdbRating: details.vote_average,
          tmdbVoteCount: details.vote_count,
          popularity: details.popularity,
          overview: details.overview,
          genres: details.genres?.map(g => g.name),
          runtime: details.runtime || details.episode_run_time?.[0],
          year: type === 'movie' ? details.release_date?.substring(0, 4) : details.first_air_date?.substring(0, 4),
          status: details.status,
          tagline: details.tagline,
          poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
          backdrop: details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : null,
          imdbId: details.external_ids?.imdb_id,
          homepage: details.homepage,
          productionCompanies: details.production_companies?.map(c => c.name),
          productionCountries: details.production_countries?.map(c => c.name),
          spokenLanguages: details.spoken_languages?.map(l => l.name),
          tmdbId: details.id
        };
      }
      
      return null;
    } catch (error) {
      console.error('TMDB API error:', error.message);
      return null;
    }
  }

  // Get default rating when external APIs fail
  getDefaultRating() {
    return {
      source: 'Default',
      rating: 7.0,
      note: 'External rating unavailable, using default rating'
    };
  }

  // Generate cache key
  getCacheKey(title, year, type) {
    return `rating_${type}_${title.toLowerCase().replace(/\s+/g, '_')}_${year || 'any'}`;
  }

  // Get available APIs status
  getApiStatus() {
    return {
      omdb: {
        enabled: this.apis.omdb.enabled,
        hasApiKey: !!this.apis.omdb.apiKey
      },
      tmdb: {
        enabled: this.apis.tmdb.enabled,
        hasApiKey: !!this.apis.tmdb.apiKey
      }
    };
  }

  // Clear cache
  clearCache() {
    this.cache.flushAll();
    return { message: 'Cache cleared successfully' };
  }

  // Get cache statistics
  getCacheStats() {
    return this.cache.getStats();
  }
}

module.exports = ExternalRatingService;
