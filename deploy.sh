#!/usr/bin/env bash
# One-command deploy: builds the site and publishes dist/ to the gh-pages branch.
# Usage:  bash deploy.sh          (run from the proteus-ai folder)
set -e

echo "==> Building site..."
npm run build

echo "==> Switching to gh-pages worktree..."
git fetch origin gh-pages
git checkout gh-pages
git pull origin gh-pages

echo "==> Replacing site files with fresh build..."
git rm -r --cached . >/dev/null 2>&1 || true
git checkout main -- .gitignore
cp -r dist/* .
git add -A
git commit -m "Deploy site build $(date +%Y-%m-%d\ %H:%M)" || echo "Nothing to commit"

echo "==> Pushing to GitHub..."
git push origin gh-pages

echo "==> Done. Back to main..."
git checkout main

echo ""
echo "Site updated: https://degenopus.github.io/proteus-ai/"
