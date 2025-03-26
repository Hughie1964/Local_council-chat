#!/bin/bash

# Replace these values with your actual GitHub username and repository name
GITHUB_USERNAME="Hughie1964"
REPO_NAME="Local_council-chat"

# Check if GITHUB_TOKEN environment variable exists
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable not found"
  echo "Please set it using Replit Secrets with the name GITHUB_TOKEN"
  exit 1
fi

# Configure Git with token authentication
git remote set-url origin https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git

# Push to GitHub
echo "Pushing to GitHub repository: $GITHUB_USERNAME/$REPO_NAME"
git push -u origin main

echo "Push completed"