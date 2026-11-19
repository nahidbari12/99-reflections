#!/bin/bash

echo "🛠 Building the project..."
npm run build

echo "📁 Creating temporary deployment folder..."
mkdir -p gh-pages-temp
cp -r dist/* gh-pages-temp/
cd gh-pages-temp

echo "🌿 Initializing a new Git repo for deployment..."
git init

# ✅ Use clean HTTPS URL (authentication is handled via ~/.netrc)
git remote add origin https://github.com/nahidbari12/99-reflections.git

git checkout -b gh-pages

echo "➕ Adding and committing files..."
git add .
git commit -m "Deploy to GitHub Pages"

echo "🚀 Pushing to gh-pages branch..."
git push origin gh-pages --force

cd ..
rm -rf gh-pages-temp

echo "✅ Deployment complete!"
echo "🌐 Your site will be live shortly at: https://nahidbari12.github.io/99-reflections"
