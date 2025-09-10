# AdoraStream Content Catalog API

A comprehensive REST API for managing movies, series, and episodes in a streaming platform. Built with Express.js and Node.js.

## Features

- **Full CRUD Operations** for movies, series, and episodes
- **Advanced Filtering** by type, genre, rating, year, and search terms
- **Input Validation** with comprehensive error handling
- **RESTful API Design** following best practices
- **In-Memory Storage** with sample data included
- **Security Middleware** with Helmet and CORS
- **Request Logging** with Morgan
- **Health Monitoring** endpoints

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start the server
npm start

# Start in development mode (with auto-restart)
npm run dev
```

The API will be available at `http://localhost:3000`

### Health Check

```bash
curl http://localhost:3000/health
```

## API Endpoints

### Content Management

#### Get All Content
```http
GET /api/content
```

**Query Parameters:**
- `type` - Filter by content type (`movie`, `series`, `episode`)
- `genre` - Filter by genre (partial match)
- `rating` - Filter by minimum rating (0-10)
- `year` - Filter by release year
- `search` - Search in title and description

**Example:**
```bash
# Get all movies
curl "http://localhost:3000/api/content?type=movie"

# Get action movies with rating >= 8.0
curl "http://localhost:3000/api/content?type=movie&genre=action&rating=8.0"

# Search for "batman"
curl "http://localhost:3000/api/content?search=batman"
```

#### Get Content by ID
```http
GET /api/content/:id
```

**Example:**
```bash
curl http://localhost:3000/api/content/123e4567-e89b-12d3-a456-426614174000
```

#### Get Episodes by Series
```http
GET /api/series/:seriesId/episodes
```

**Example:**
```bash
curl http://localhost:3000/api/series/123e4567-e89b-12d3-a456-426614174000/episodes
```

#### Create Content
```http
POST /api/content
Content-Type: application/json
```

**Movie Example:**
```json
{
  "type": "movie",
  "title": "The Matrix",
  "description": "A computer hacker learns about the true nature of reality.",
  "releaseYear": 1999,
  "duration": 136,
  "genre": ["Action", "Sci-Fi"],
  "rating": 8.7,
  "director": "The Wachowskis",
  "cast": ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
  "posterUrl": "https://example.com/matrix-poster.jpg",
  "trailerUrl": "https://example.com/matrix-trailer.mp4"
}
```

**Series Example:**
```json
{
  "type": "series",
  "title": "Stranger Things",
  "description": "Supernatural events in a small town.",
  "releaseYear": 2016,
  "totalSeasons": 4,
  "totalEpisodes": 34,
  "genre": ["Drama", "Fantasy", "Horror"],
  "rating": 8.7,
  "creator": "The Duffer Brothers",
  "cast": ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"],
  "posterUrl": "https://example.com/stranger-things-poster.jpg",
  "trailerUrl": "https://example.com/stranger-things-trailer.mp4"
}
```

**Episode Example:**
```json
{
  "type": "episode",
  "title": "The Vanishing of Will Byers",
  "description": "A young boy vanishes into thin air.",
  "seriesId": "123e4567-e89b-12d3-a456-426614174000",
  "seasonNumber": 1,
  "episodeNumber": 1,
  "duration": 48,
  "releaseYear": 2016,
  "rating": 8.5,
  "director": "The Duffer Brothers",
  "cast": ["Millie Bobby Brown", "Finn Wolfhard"],
  "thumbnailUrl": "https://example.com/stranger-things-s1e1-thumb.jpg",
  "videoUrl": "https://example.com/stranger-things-s1e1.mp4"
}
```

#### Update Content
```http
PUT /api/content/:id
Content-Type: application/json
```

**Example:**
```json
{
  "title": "The Matrix Reloaded",
  "rating": 7.2
}
```

#### Partial Update
```http
PATCH /api/content/:id
Content-Type: application/json
```

**Example:**
```json
{
  "rating": 8.9
}
```

#### Delete Content
```http
DELETE /api/content/:id
```

### Statistics

#### Get API Statistics
```http
GET /api/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "movies": 2,
    "series": 1,
    "episodes": 2,
    "averageRating": 8.78
  }
}
```

## Content Types

### Movie
- `type`: "movie"
- `title`: Movie title
- `description`: Movie description
- `releaseYear`: Release year
- `duration`: Duration in minutes
- `genre`: Array of genres
- `rating`: Rating (0-10)
- `director`: Director name
- `cast`: Array of cast members
- `posterUrl`: Poster image URL
- `trailerUrl`: Trailer video URL

### Series
- `type`: "series"
- `title`: Series title
- `description`: Series description
- `releaseYear`: Release year
- `totalSeasons`: Number of seasons
- `totalEpisodes`: Total number of episodes
- `genre`: Array of genres
- `rating`: Rating (0-10)
- `creator`: Creator name
- `cast`: Array of cast members
- `posterUrl`: Poster image URL
- `trailerUrl`: Trailer video URL

### Episode
- `type`: "episode"
- `title`: Episode title
- `description`: Episode description
- `seriesId`: ID of the parent series
- `seasonNumber`: Season number
- `episodeNumber`: Episode number within season
- `duration`: Duration in minutes
- `releaseYear`: Release year
- `rating`: Rating (0-10)
- `director`: Director name
- `cast`: Array of cast members
- `thumbnailUrl`: Episode thumbnail URL
- `videoUrl`: Episode video URL

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Project Structure (MVC Architecture)
```
adorastream/
├── controllers/            # Controllers (handle HTTP requests/responses)
│   ├── ContentController.js
│   ├── StatsController.js
│   └── HealthController.js
├── services/              # Services (business logic layer)
│   ├── ContentService.js
│   └── StatsService.js
├── models/                # Models (data layer)
│   └── ContentModel.js
├── views/                 # Views (response formatting)
│   ├── ContentView.js
│   ├── StatsView.js
│   └── HealthView.js
├── routes/                # Routes (URL routing)
│   ├── contentRoutes.js
│   ├── seriesRoutes.js
│   ├── statsRoutes.js
│   └── healthRoutes.js
├── middleware/            # Middleware (validation, etc.)
│   └── validation.js
├── server.js              # Express server setup
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

### MVC Architecture Benefits

**Model (Data Layer)**
- `ContentModel.js`: Pure data operations, no business logic
- Handles CRUD operations and data filtering
- No HTTP concerns or response formatting

**View (Presentation Layer)**
- `ContentView.js`, `StatsView.js`, `HealthView.js`: Response formatting
- Consistent API response structure
- Separates data from presentation

**Controller (Request Handling)**
- `ContentController.js`, `StatsController.js`, `HealthController.js`: HTTP request/response handling
- Orchestrates between services and views
- No business logic, just coordination

**Service (Business Logic)**
- `ContentService.js`, `StatsService.js`: Business rules and validation
- Contains all business logic and data processing
- Independent of HTTP concerns

### Architecture Flow
```
HTTP Request → Routes → Controllers → Services → Models
                     ↓
HTTP Response ← Views ← Controllers ← Services ← Models
```

**Request Flow:**
1. **Routes** (`routes/`) - Define URL patterns and HTTP methods
2. **Controllers** (`controllers/`) - Handle HTTP requests, call services
3. **Services** (`services/`) - Execute business logic, validate data
4. **Models** (`models/`) - Perform data operations (CRUD)

**Response Flow:**
1. **Models** - Return raw data
2. **Services** - Process and validate data
3. **Controllers** - Call views for formatting
4. **Views** (`views/`) - Format data for API response
5. **Routes** - Send HTTP response

### Adding New Features

1. **New Content Types**: 
   - Add validation rules in `middleware/validation.js`
   - Extend `ContentModel.js` for data operations
   - Update `ContentService.js` for business logic
   - Add view methods in `ContentView.js`

2. **New Endpoints**: 
   - Create new controller in `controllers/`
   - Add service logic in `services/`
   - Create route file in `routes/`
   - Register routes in `server.js`

3. **New Business Logic**: 
   - Add methods to appropriate service classes
   - Keep controllers thin, services fat

4. **New Response Formats**: 
   - Add methods to view classes
   - Maintain consistent API structure

## Sample Data

The API comes with sample data including:
- 2 movies (The Dark Knight, Inception)
- 1 series (Breaking Bad)
- 2 episodes (Breaking Bad S1E1, S1E2)

## License

ISC