# TIKO System Management

## Overview
Instead of dozens of scattered scripts, we now have one comprehensive management tool.

## Quick Start
```bash
# Local usage
node tiko-manager.js overview

# Production usage  
heroku run "node tiko-manager.js overview" --app sonar-edm-staging
```

## Commands

### `overview` (default)
Complete system status including:
- Database collections overview
- Enhancement pipeline status
- Event processing statistics

### `performance`
Pipeline performance analysis:
- Enhancement speed metrics
- Source breakdown (Spotify, Apple Music, Essentia)
- Recent activity trends

### `casa-loma`
Casa Loma specific analysis for debugging scoring issues

### `cleanup`
System maintenance:
- Remove old cache entries
- Reset failed enhancement attempts

### `events [query]`
Event analysis with optional MongoDB query:
```bash
# All events
node tiko-manager.js events

# Events with artists
node tiko-manager.js events '{"artists": {"$exists": true}}'

# High-scoring events
node tiko-manager.js events '{"personalizedScore": {"$gte": 80}}'
```

## Migration from Old Scripts

| Old Script | New Command |
|------------|-------------|
| `check_production_db.js` | `tiko-manager.js overview` |
| `check_all_collections.js` | `tiko-manager.js overview` |
| `casa_loma_check.js` | `tiko-manager.js casa-loma` |
| `match_score_analysis.js` | `tiko-manager.js performance` |
| `test_frontend_fix.js` | `tiko-manager.js casa-loma` |

## Database Connection
The tool automatically uses:
- `MONGODB_URI` environment variable
- `MONGODB_DB` environment variable (defaults to 'test')

## Cleanup
Run `node cleanup-scripts.js` to remove all the old scattered scripts.
