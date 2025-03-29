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

echo "Creating GitHub repository $REPO_NAME if it doesn't exist..."
# Create repo if it doesn't exist (this might fail if repo exists, which is fine)
curl -s -o /dev/null -w "%{http_code}" \
  --request POST \
  --url https://api.github.com/user/repos \
  --header "Accept: application/vnd.github.v3+json" \
  --header "Authorization: token $GITHUB_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{\"name\":\"$REPO_NAME\", \"private\": false}"

echo "Configuring Git..."
# Configure Git with token authentication
git remote set-url origin https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git

# Verify remote URL (hide token)
echo "Remote URL configured (token hidden):"
git remote -v | sed "s/$GITHUB_TOKEN/*****/g"

echo "Pushing to GitHub repository: $GITHUB_USERNAME/$REPO_NAME"
git push -u origin main

echo "Push completed"