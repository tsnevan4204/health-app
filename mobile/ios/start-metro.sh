#!/bin/bash

# Script to auto-start Metro bundler for Xcode builds
# This allows running the app directly from Xcode without manually starting Metro

set -e

# Check if Metro is already running
if pgrep -f "expo start" > /dev/null; then
    echo "📱 Metro bundler is already running"
    exit 0
fi

# Change to project root directory
cd "${SRCROOT}/.."

# Start Metro bundler in background
echo "🚀 Starting Metro bundler for Xcode build..."

# Kill any existing Metro processes first
pkill -f "expo start" || true
pkill -f "metro" || true

# Start Metro bundler
nohup npx expo start --dev-client --port 8081 > metro.log 2>&1 &

# Wait for Metro to start
echo "⏳ Waiting for Metro bundler to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:8081/status > /dev/null 2>&1; then
        echo "✅ Metro bundler started successfully on port 8081"
        exit 0
    fi
    sleep 1
done

echo "⚠️  Metro bundler may still be starting. Check metro.log if issues persist."
exit 0