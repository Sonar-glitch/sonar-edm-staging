#!/bin/bash

# TIKO Deployment Script
# This script deploys the fixed TIKO platform to Heroku

echo "Deploying TIKO platform to Heroku..."

# Add all changes
git add .

# Commit changes
git commit -m "Fix user flow, implement working music taste page, and fix Ticketmaster API"

# Push to Heroku
git push heroku main

echo "Deployment complete!"
