#!/bin/bash

# Deployment Script: Implement New Dashboard Layout (Target Screenshot)
# Target: sonar-edm-staging
# Branch: feature/enhanced-dashboard-ui

# --- Configuration ---
HEROKU_APP_NAME="sonar-edm-staging"
HEROKU_GIT_URL="https://git.heroku.com/sonar-edm-staging.git"
PROJECT_DIR="/c/sonar/users/sonar-edm-user"
BRANCH_NAME="feature/enhanced-dashboard-ui"
COMMIT_MESSAGE="feat: Implement new dashboard layout with compact sections and horizontal event cards"

# Files to deploy (relative to script location)
# These are the files created in the sandbox
NEW_DASHBOARD_PAGE="DashboardNewLayout.js"
NEW_DASHBOARD_CSS="DashboardNewLayout.module.css"
NEW_EVENTS_SECTION="EventsSectionSorted.js"
NEW_EVENT_CARD="NewEventCardRevised.js"
NEW_EVENT_CARD_CSS="NewEventCard.module.css"
COMPACT_SOUND_CHAR="SoundCharacteristicsCompact.js"
COMPACT_SOUND_CHAR_CSS="SoundCharacteristicsCompact.module.css"
MATCH_PERCENTAGE_JS="MatchPercentage.js" # Assumed to be present from previous steps
MATCH_PERCENTAGE_CSS="MatchPercentage.module.css" # Assumed to be present
FILTER_PANEL_JS="EnhancedFilterPanel.js" # Assumed to be present
FILTER_PANEL_CSS="EnhancedFilterPanel.module.css" # Assumed to be present

# Target paths within the project
TARGET_DASHBOARD_PAGE="pages/dashboard.js"
TARGET_DASHBOARD_CSS="styles/Dashboard.module.css"
TARGET_EVENTS_SECTION="components/EventsSection.js"
TARGET_EVENT_CARD="components/NewEventCard.js" # Note: New component name
TARGET_EVENT_CARD_CSS="styles/NewEventCard.module.css"
TARGET_SOUND_CHAR="components/SoundCharacteristics.js"
TARGET_SOUND_CHAR_CSS="styles/SoundCharacteristics.module.css"
TARGET_MATCH_PERCENTAGE_JS="components/MatchPercentage.js"
TARGET_MATCH_PERCENTAGE_CSS="styles/MatchPercentage.module.css"
TARGET_FILTER_PANEL_JS="components/EnhancedFilterPanel.js"
TARGET_FILTER_PANEL_CSS="styles/EnhancedFilterPanel.module.css"

# Backup directory
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)_new_layout_deploy"

# --- Pre-checks ---
echo "Starting new dashboard layout deployment to $HEROKU_APP_NAME on branch $BRANCH_NAME..."

# Check if in the correct project directory
if [ "$(pwd)" != "$PROJECT_DIR" ]; then
  echo "Error: Script must be run from the project root directory: $PROJECT_DIR"
  exit 1
fi

# Check if on the correct branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "$BRANCH_NAME" ]; then
  echo "Error: You must be on the '$BRANCH_NAME' branch to run this script."
  echo "Current branch is '$current_branch'. Please run: git checkout $BRANCH_NAME"
  exit 1
fi

# Check if required source files exist (add checks for assumed files too)
if [ ! -f "$NEW_DASHBOARD_PAGE" ]; then echo "Error: Required file '$NEW_DASHBOARD_PAGE' not found."; exit 1; fi
if [ ! -f "$NEW_DASHBOARD_CSS" ]; then echo "Error: Required file '$NEW_DASHBOARD_CSS' not found."; exit 1; fi
if [ ! -f "$NEW_EVENTS_SECTION" ]; then echo "Error: Required file '$NEW_EVENTS_SECTION' not found."; exit 1; fi
if [ ! -f "$NEW_EVENT_CARD" ]; then echo "Error: Required file '$NEW_EVENT_CARD' not found."; exit 1; fi
if [ ! -f "$NEW_EVENT_CARD_CSS" ]; then echo "Error: Required file '$NEW_EVENT_CARD_CSS' not found."; exit 1; fi
if [ ! -f "$COMPACT_SOUND_CHAR" ]; then echo "Error: Required file '$COMPACT_SOUND_CHAR' not found."; exit 1; fi
if [ ! -f "$COMPACT_SOUND_CHAR_CSS" ]; then echo "Error: Required file '$COMPACT_SOUND_CHAR_CSS' not found."; exit 1; fi
if [ ! -f "$MATCH_PERCENTAGE_JS" ]; then echo "Error: Required file '$MATCH_PERCENTAGE_JS' not found. Please ensure it's in the root."; exit 1; fi
if [ ! -f "$MATCH_PERCENTAGE_CSS" ]; then echo "Error: Required file '$MATCH_PERCENTAGE_CSS' not found. Please ensure it's in the root."; exit 1; fi
if [ ! -f "$FILTER_PANEL_JS" ]; then echo "Error: Required file '$FILTER_PANEL_JS' not found. Please ensure it's in the root."; exit 1; fi
if [ ! -f "$FILTER_PANEL_CSS" ]; then echo "Error: Required file '$FILTER_PANEL_CSS' not found. Please ensure it's in the root."; exit 1; fi

# --- Backup ---
echo "Creating backup directory: $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR/pages"
mkdir -p "$BACKUP_DIR/components"
mkdir -p "$BACKUP_DIR/styles"

# Backup existing files that will be overwritten or added
[ -f "$TARGET_DASHBOARD_PAGE" ] && cp "$TARGET_DASHBOARD_PAGE" "$BACKUP_DIR/pages/"
[ -f "$TARGET_DASHBOARD_CSS" ] && cp "$TARGET_DASHBOARD_CSS" "$BACKUP_DIR/styles/"
[ -f "$TARGET_EVENTS_SECTION" ] && cp "$TARGET_EVENTS_SECTION" "$BACKUP_DIR/components/"
[ -f "$TARGET_EVENT_CARD" ] && cp "$TARGET_EVENT_CARD" "$BACKUP_DIR/components/"
[ -f "$TARGET_EVENT_CARD_CSS" ] && cp "$TARGET_EVENT_CARD_CSS" "$BACKUP_DIR/styles/"
[ -f "$TARGET_SOUND_CHAR" ] && cp "$TARGET_SOUND_CHAR" "$BACKUP_DIR/components/"
[ -f "$TARGET_SOUND_CHAR_CSS" ] && cp "$TARGET_SOUND_CHAR_CSS" "$BACKUP_DIR/styles/"
[ -f "$TARGET_MATCH_PERCENTAGE_JS" ] && cp "$TARGET_MATCH_PERCENTAGE_JS" "$BACKUP_DIR/components/"
[ -f "$TARGET_MATCH_PERCENTAGE_CSS" ] && cp "$TARGET_MATCH_PERCENTAGE_CSS" "$BACKUP_DIR/styles/"
[ -f "$TARGET_FILTER_PANEL_JS" ] && cp "$TARGET_FILTER_PANEL_JS" "$BACKUP_DIR/components/"
[ -f "$TARGET_FILTER_PANEL_CSS" ] && cp "$TARGET_FILTER_PANEL_CSS" "$BACKUP_DIR/styles/"

# --- Copy Files ---
echo "Copying new files..."
mkdir -p pages
mkdir -p components
mkdir -p styles

cp "$NEW_DASHBOARD_PAGE" "$TARGET_DASHBOARD_PAGE"
cp "$NEW_DASHBOARD_CSS" "$TARGET_DASHBOARD_CSS"
cp "$NEW_EVENTS_SECTION" "$TARGET_EVENTS_SECTION"
cp "$NEW_EVENT_CARD" "$TARGET_EVENT_CARD"
cp "$NEW_EVENT_CARD_CSS" "$TARGET_EVENT_CARD_CSS"
cp "$COMPACT_SOUND_CHAR" "$TARGET_SOUND_CHAR"
cp "$COMPACT_SOUND_CHAR_CSS" "$TARGET_SOUND_CHAR_CSS"
cp "$MATCH_PERCENTAGE_JS" "$TARGET_MATCH_PERCENTAGE_JS"
cp "$MATCH_PERCENTAGE_CSS" "$TARGET_MATCH_PERCENTAGE_CSS"
cp "$FILTER_PANEL_JS" "$TARGET_FILTER_PANEL_JS"
cp "$FILTER_PANEL_CSS" "$TARGET_FILTER_PANEL_CSS"

echo "Files copied successfully."

# --- Git Operations ---
echo "Staging changes..."
# Add all potentially changed/added files
git add "$TARGET_DASHBOARD_PAGE" \
        "$TARGET_DASHBOARD_CSS" \
        "$TARGET_EVENTS_SECTION" \
        "$TARGET_EVENT_CARD" \
        "$TARGET_EVENT_CARD_CSS" \
        "$TARGET_SOUND_CHAR" \
        "$TARGET_SOUND_CHAR_CSS" \
        "$TARGET_MATCH_PERCENTAGE_JS" \
        "$TARGET_MATCH_PERCENTAGE_CSS" \
        "$TARGET_FILTER_PANEL_JS" \
        "$TARGET_FILTER_PANEL_CSS"

# Check if there are changes to commit
if git diff --staged --quiet; then
  echo "No changes staged. Exiting."
  exit 0
fi

echo "Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# --- Heroku Deployment ---
echo "Pushing changes to Heroku app: $HEROKU_APP_NAME (Branch: $BRANCH_NAME)..."
# Push the local branch to the remote main branch
git push $HEROKU_GIT_URL $BRANCH_NAME:refs/heads/main

if [ $? -ne 0 ]; then
  echo "Error: Failed to push changes to Heroku."
  exit 1
fi

echo "Deployment push successful. Restarting Heroku app..."
heroku restart --app $HEROKU_APP_NAME

if [ $? -ne 0 ]; then
  echo "Warning: Failed to restart Heroku app. Please check the Heroku dashboard."
fi

echo "New dashboard layout deployment script completed."

