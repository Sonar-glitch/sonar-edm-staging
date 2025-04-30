#!/bin/bash

# Phase 1 Deployment Script (FIXED): Add MatchPercentage to EventsSection
# Target: sonar-edm-staging
# Branch: feature/enhanced-dashboard-ui

# --- Configuration ---
HEROKU_APP_NAME="sonar-edm-staging"
HEROKU_GIT_URL="https://git.heroku.com/sonar-edm-staging.git"
PROJECT_DIR="/c/sonar/users/sonar-edm-user"
BRANCH_NAME="feature/enhanced-dashboard-ui"
COMMIT_MESSAGE="feat: Integrate MatchPercentage into EventsSection (Phase 1)"

# Files to deploy (relative to script location)
NEW_EVENTS_SECTION_FILE="EventsSectionPhase1.js"
MATCH_PERCENTAGE_JS_FILE="MatchPercentage.js"
MATCH_PERCENTAGE_CSS_FILE="MatchPercentage.module.css"

# Target paths within the project
TARGET_EVENTS_SECTION_PATH="components/EventsSection.js"
TARGET_MATCH_PERCENTAGE_JS_PATH="components/MatchPercentage.js"
TARGET_MATCH_PERCENTAGE_CSS_PATH="styles/MatchPercentage.module.css"

# Backup directory
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)_phase1_deploy_fix"

# --- Pre-checks ---
echo "Starting Phase 1 deployment (FIXED) to $HEROKU_APP_NAME on branch $BRANCH_NAME..."

# Check if in the correct project directory
if [ "$(pwd)" != "$PROJECT_DIR" ]; then
  echo "Error: Script must be run from the project root directory: $PROJECT_DIR"
  exit 1
fi

# Check if on the correct branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "$BRANCH_NAME" ]; then
  echo "Error: You must be on the 	$BRANCH_NAME	 branch to run this script."
  echo "Current branch is 	$current_branch	. Please run: git checkout $BRANCH_NAME"
  exit 1
fi

# Check if required files exist
if [ ! -f "$NEW_EVENTS_SECTION_FILE" ]; then
  echo "Error: Required file 	$NEW_EVENTS_SECTION_FILE	 not found in the current directory."
  exit 1
fi
if [ ! -f "$MATCH_PERCENTAGE_JS_FILE" ]; then
  echo "Error: Required file 	$MATCH_PERCENTAGE_JS_FILE	 not found in the current directory."
  exit 1
fi
if [ ! -f "$MATCH_PERCENTAGE_CSS_FILE" ]; then
  echo "Error: Required file 	$MATCH_PERCENTAGE_CSS_FILE	 not found in the current directory."
  exit 1
fi

# --- Backup ---
echo "Creating backup directory: $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR/components"
mkdir -p "$BACKUP_DIR/styles"

if [ -f "$TARGET_EVENTS_SECTION_PATH" ]; then
  echo "Backing up $TARGET_EVENTS_SECTION_PATH..."
  cp "$TARGET_EVENTS_SECTION_PATH" "$BACKUP_DIR/components/"
fi
if [ -f "$TARGET_MATCH_PERCENTAGE_JS_PATH" ]; then
  echo "Backing up $TARGET_MATCH_PERCENTAGE_JS_PATH..."
  cp "$TARGET_MATCH_PERCENTAGE_JS_PATH" "$BACKUP_DIR/components/"
fi
if [ -f "$TARGET_MATCH_PERCENTAGE_CSS_PATH" ]; then
  echo "Backing up $TARGET_MATCH_PERCENTAGE_CSS_PATH..."
  cp "$TARGET_MATCH_PERCENTAGE_CSS_PATH" "$BACKUP_DIR/styles/"
fi

# --- Copy Files ---
echo "Copying new files..."
mkdir -p components
mkdir -p styles

cp "$NEW_EVENTS_SECTION_FILE" "$TARGET_EVENTS_SECTION_PATH"
cp "$MATCH_PERCENTAGE_JS_FILE" "$TARGET_MATCH_PERCENTAGE_JS_PATH"
cp "$MATCH_PERCENTAGE_CSS_FILE" "$TARGET_MATCH_PERCENTAGE_CSS_PATH"

echo "Files copied successfully."

# --- Git Operations ---
echo "Staging changes..."
git add "$TARGET_EVENTS_SECTION_PATH" "$TARGET_MATCH_PERCENTAGE_JS_PATH" "$TARGET_MATCH_PERCENTAGE_CSS_PATH"

# Check if there are changes to commit
if git diff --staged --quiet; then
  echo "No changes staged. Exiting."
  # Optionally, still try to push if the commit might already exist but wasn't pushed
  # echo "No changes staged, attempting push anyway..."
  # git push $HEROKU_GIT_URL $BRANCH_NAME:main
  # exit $?
  exit 0
fi

echo "Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# --- Heroku Deployment ---
echo "Pushing changes to Heroku app: $HEROKU_APP_NAME (Branch: $BRANCH_NAME)..."
# CORRECTED PUSH COMMAND: Push the local branch to the remote main branch
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

echo "Phase 1 deployment script (FIXED) completed."

