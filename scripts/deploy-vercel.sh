#!/bin/bash

# Vercel Deployment Script for Product Hunt Discord Bot
# This script handles deployment to Vercel without Docker

set -e

echo "🚀 Starting Vercel deployment process..."

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
        echo "💡 Set this in your Vercel project settings"
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
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."

# Check if already linked to Vercel
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking to Vercel project..."
    vercel --yes
else
    echo "📤 Deploying to existing Vercel project..."
    vercel --prod
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Your bot should be live shortly."
echo "📊 Monitor deployment at: https://vercel.com/dashboard"

# Test the deployment
echo "🧪 Testing deployment..."
sleep 5

# Get the deployment URL
DEPLOYMENT_URL=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "🔗 Testing health endpoint: $DEPLOYMENT_URL/health"
    
    # Test health endpoint
    if curl -s "$DEPLOYMENT_URL/health" > /dev/null; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed - check Vercel logs"
    fi
else
    echo "⚠️  Could not determine deployment URL"
fi

echo "🎉 Deployment process complete!"
echo "📋 Next steps:"
echo "   1. Configure environment variables in Vercel dashboard"
echo "   2. Test the bot endpoints"
echo "   3. Monitor the bot activity"
echo "   4. Set up external monitoring"
