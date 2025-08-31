#!/bin/bash

# Product Hunt Discord Bot Deployment Script
# This script handles deployment to Vercel

set -e

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

# Check if required environment variables are set
echo "🔍 Checking environment variables..."

REQUIRED_VARS=(
    "PH_TOKEN"
    "DISCORD_TOKEN"
    "DISCORD_CHANNEL_ID"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var environment variable is not set"
        exit 1
    fi
done

echo "✅ All required environment variables are set"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf .vercel/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."

if command -v vercel &> /dev/null; then
    # Use Vercel CLI if available
    vercel --prod
else
    # Use git push if Vercel CLI is not available
    echo "📤 Pushing to GitHub for Vercel deployment..."
    git add .
    git commit -m "Deploy: $(date)"
    git push origin main
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Your bot should be live shortly."
echo "📊 Monitor deployment at: https://vercel.com/dashboard"
