#!/bin/bash
# Exit on error
set -e

# Load environment variables if .env exists
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

# Check for GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is not set."
  echo "Please set GITHUB_TOKEN in your AI Studio UI Secrets panel."
  exit 1
fi

echo "GitHub Token detected. Authenticating GitHub CLI..."
echo "$GITHUB_TOKEN" | gh auth login --with-token

echo "Successfully authenticated. Configuring git remote..."
git remote remove origin || true
git remote add origin "https://x-access-token:$GITHUB_TOKEN@github.com/chantha-cmd-web/Payroll-System.git"
git branch -M main

echo "Pushing latest changes to the main branch..."
git push -u origin main --force

echo "Building and deploying to GitHub Pages..."
npm run deploy

echo "Deployment completed successfully! Your application will be live at: https://chantha-cmd-web.github.io/Payroll-System/"
