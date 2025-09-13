const axios = require('axios');

// Test script to demonstrate external rating functionality
const BASE_URL = 'http://localhost:3000';

async function testExternalRating() {
  console.log('🧪 Testing External Rating Integration\n');

  try {
    // 1. Check rating service status
    console.log('1. Checking rating service status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/content/rating-service/status`);
    console.log('✅ Rating service status:', JSON.stringify(statusResponse.data, null, 2));
    console.log('');

    // 2. Create content without rating (should trigger external rating fetch)
    console.log('2. Creating content without rating (should fetch external rating)...');
    const newContent = {
      type: 'movie',
      title: 'The Matrix',
      description: 'A computer hacker learns about the true nature of reality.',
      releaseYear: 1999,
      duration: 136,
      genre: ['Action', 'Sci-Fi'],
      director: 'The Wachowskis',
      cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss']
    };

    const createResponse = await axios.post(`${BASE_URL}/api/content`, newContent);
    console.log('✅ Content created with external rating:', JSON.stringify(createResponse.data, null, 2));
    console.log('');

    const contentId = createResponse.data.data.id;

    // 3. Fetch external rating for existing content
    console.log('3. Fetching external rating for existing content...');
    const ratingResponse = await axios.post(`${BASE_URL}/api/content/${contentId}/fetch-rating`);
    console.log('✅ External rating fetched:', JSON.stringify(ratingResponse.data, null, 2));
    console.log('');

    // 4. Check cache statistics
    console.log('4. Checking cache statistics...');
    const cacheStatsResponse = await axios.get(`${BASE_URL}/api/content/rating-service/cache/stats`);
    console.log('✅ Cache statistics:', JSON.stringify(cacheStatsResponse.data, null, 2));
    console.log('');

    // 5. Test with a TV series
    console.log('5. Testing with TV series...');
    const seriesContent = {
      type: 'series',
      title: 'Breaking Bad',
      description: 'A high school chemistry teacher turned methamphetamine manufacturer.',
      releaseYear: 2008,
      totalSeasons: 5,
      totalEpisodes: 62,
      genre: ['Crime', 'Drama', 'Thriller'],
      creator: 'Vince Gilligan',
      cast: ['Bryan Cranston', 'Aaron Paul', 'Anna Gunn']
    };

    const seriesResponse = await axios.post(`${BASE_URL}/api/content`, seriesContent);
    console.log('✅ Series created with external rating:', JSON.stringify(seriesResponse.data, null, 2));
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testExternalRating();
