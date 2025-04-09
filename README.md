# Sonar EDM Platform

A dual-focused platform for EDM promoters and music fans, providing analytics, insights, and recommendations based on music taste analysis.

## Features

### For Promoters
- Artist popularity prediction
- Event demand forecasting
- Ticket price optimization
- Genre trend analysis
- City-specific audience preferences
- Similar artist recommendations

### For Music Fans
- Music taste analysis
- Event recommendations based on preferences
- Similar artist discovery
- Trending artist highlights
- Location-based recommendations

## One-Click Deployment

Sonar EDM Platform offers a simple one-click deployment process that handles all configuration and setup automatically.

### Prerequisites

- Node.js v16 or higher
- npm v7 or higher
- MongoDB database (Atlas recommended)
- Spotify Developer account

### Option 1: Local Setup

1. Clone the repository:
```bash
git clone https://github.com/Sonar-glitch/sonar-edm-platform.git
cd sonar-edm-platform
```

2. Run the setup script:
```bash
node scripts/setup.js
```

3. Follow the prompts to enter your credentials:
   - Spotify Client ID and Secret
   - MongoDB URI
   - NextAuth Secret (or let the script generate one)

4. Install dependencies:
```bash
npm install
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Heroku Deployment

1. Click the "Deploy to Heroku" button below:

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

2. Fill in the required environment variables:
   - `SPOTIFY_CLIENT_ID`: Your Spotify API Client ID
   - `SPOTIFY_CLIENT_SECRET`: Your Spotify API Client Secret
   - `MONGODB_URI`: Your MongoDB connection string
   - `NEXTAUTH_SECRET`: Secret for NextAuth (will be auto-generated if left blank)

3. Click "Deploy" and wait for the deployment to complete.

4. Once deployed, click "View" to open your application.

### Option 3: Automated Deployment Script

For more control over the deployment process, you can use the included deployment script:

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/sonar-edm-platform.git
cd sonar-edm-platform
```

2. Run the deployment script:
```bash
node scripts/deploy.js
```

3. Follow the prompts to enter your credentials and deployment preferences.

4. The script will handle the rest, including:
   - Setting up environment variables
   - Installing dependencies
   - Deploying to Heroku (if selected)

## Configuration

All API keys and credentials are managed through a centralized configuration system. The main configuration file is `config.js`, which loads environment variables from `.env`.

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `SPOTIFY_CLIENT_ID` | Your Spotify API Client ID |
| `SPOTIFY_CLIENT_SECRET` | Your Spotify API Client Secret |
| `MONGODB_URI` | Your MongoDB connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth authentication |
| `NEXTAUTH_URL` | URL of your application (for authentication callbacks) |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Application name | Sonar EDM Platform |
| `NODE_ENV` | Environment mode | development |
| `PORT` | Port for local development | 3000 |
| `MONGODB_DB_NAME` | MongoDB database name | sonar-edm |
| `FEATURE_*` | Feature flags for enabling/disabling specific functionality | true |

## API Endpoints

### Spotify API

- `GET /api/spotify?type=search&query=<query>&searchType=<type>`: Search for artists, tracks, or genres
- `GET /api/spotify?type=artist&id=<id>`: Get artist details
- `GET /api/spotify?type=top-tracks&id=<id>&market=<market>`: Get top tracks for an artist
- `GET /api/spotify?type=related-artists&id=<id>`: Get related artists
- `GET /api/spotify?type=recommendations&genres=<genres>`: Get genre recommendations

### Prediction API

- `POST /api/prediction?type=artist-popularity`: Predict artist popularity
- `POST /api/prediction?type=event-demand`: Forecast event demand
- `POST /api/prediction?type=ticket-price`: Optimize ticket pricing
- `POST /api/prediction?type=music-taste`: Analyze music taste

## Project Structure

```
sonar-edm-platform/
├── components/       # React components
├── lib/              # Core functionality
│   ├── spotify.js    # Spotify API integration
│   ├── mongodb.js    # MongoDB connection
│   ├── auth.js       # NextAuth configuration
│   └── prediction.js # AI prediction models
├── pages/            # Next.js pages
│   ├── api/          # API routes
│   ├── promoters/    # Promoter-focused pages
│   └── users/        # User-focused pages
├── public/           # Static assets
├── scripts/          # Utility scripts
│   ├── setup.js      # Setup script
│   └── deploy.js     # Deployment script
├── styles/           # CSS styles
├── config.js         # Centralized configuration
├── .env.example      # Example environment variables
└── app.json          # Heroku configuration
```

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## License

MIT
