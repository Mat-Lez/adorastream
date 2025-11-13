# AdoraStream

AdoraStream is a full-stack streaming platform for browsing, managing, and watching movies or series. It provides profile-based access, rich media browsing, a dynamic home screen with recommendations, and an admin workflow for ingesting new content—built on Node.js, Express, EJS, and MongoDB.

## Authors

- Matanel — [@Mat-Lez](https://github.com/Mat-Lez)
- Adoram — [@adoramshoval](https://github.com/adoramshoval)
- Tamar — [@tamareyal](https://github.com/tamareyal)
- Roy — [@roys10](https://github.com/roys10)

## Installation and Setup

Clone the repository:

```bash
git clone https://github.com/Mat-Lez/adorastream.git
cd adorastream
```

Install dependencies:

```bash
npm install
```

Create environment configuration by copying `.env-template` to `.env` and filling in the values:

```bash
PORT=3000
SESSION_SECRET=
MONGODB_URI=mongodb://127.0.0.1:27017/adorastream
OMDB_API_KEY=
ADMIN_USERNAME=
ADMIN_PASSWORD=
DEFAULT_GENRE_LIMIT=10
GENRE_FETCH_LIMIT_MULTIPLIER=25
ENDLESS_SCROLLING_CONTENT_AMOUNT=20
CONTINUE_WATCHING_LIMIT=12
```

Run the application in development mode:

```bash
npm run dev
```

Or start normally:

```bash
npm start
```

## Project Structure

```
adorastream/
├── adorastream-backend/
│   ├── app.js                      # Express app bootstrap
│   ├── controllers/                # Route handlers (auth, content, pages, watch history, etc.)
│   ├── middleware/                 # Auth, error handling, audit, caching
│   ├── models/                     # Mongoose schemas (User, Content, WatchHistory, DailyWatch…)
│   ├── routes/                     # API and view route definitions
│   ├── services/                   # Content enrichment, uploads, ratings
│   ├── assets/                     # Local media (posters, videos, tmp uploads)
│   └── utils/                      # Helpers (seeding, response formatting)
├── public/
│   ├── css/                        # Stylesheets for main UI, player, settings
│   ├── js/                         # Front-end logic (navigation, infinite scroll, previews, etc.)
│   └── utils/                      # Shared browser-side utilities
├── views/
│   ├── pages/                      # Top-level EJS templates (login, content-main, player…)
│   └── partials/                   # Reusable layout components (topbar, grids, genre filters)
├── testing/                        # Manual testing helpers and seed scripts
├── package.json                    # Node.js manifest and scripts
└── .env-template                   # Environment variable reference
```

## Core Functionality

- 🔐 **Authentication & Profiles** – Session-based login with multiple profiles per account and middleware enforcement.
- 🧭 **Content Browsing** – Dynamic home screen sections (continue watching, popular, recommendations, genre rows), dedicated movies/series pages with infinite scrolling and genre filtering, full-text search scoped by media type.
- ▶️ **Media Consumption** – Preview overlay with resume/start-over controls, integrated player page, episode progression for series, persisted watch progress.
- 🕒 **Watch History & Engagement** – Last-position tracking, partial-watch queue, favorites/likes per profile, daily watch logging for analytics.
- 🛠️ **Content Management** – Admin-only workflows for adding movies/series, poster/video uploads, batch episode ingestion, async enrichment hooks.
- ⚙️ **Operational Tooling** – Error/audit logging with DB persistence, configurable grid sizing and retrieval thresholds via environment variables.
