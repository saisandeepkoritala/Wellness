#!/bin/bash

echo "🚀 Starting deployment..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Create a simple deployment message
echo ""
echo "🎉 Deployment ready!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your GitHub repository: https://github.com/NavyanthReddy/Wellness-Tracker"
echo "2. Go to Settings > Pages"
echo "3. Set Source to 'Deploy from a branch'"
echo "4. Select 'main' branch and '/build' folder"
echo "5. Click Save"
echo ""
echo "🌐 Your app will be available at: https://navyanthreddy.github.io/Wellness-Tracker/"
echo ""
echo "💡 Alternative: You can also deploy to Netlify by:"
echo "1. Go to https://netlify.com"
echo "2. Drag and drop the 'build' folder"
echo "3. Get a live URL instantly!"
