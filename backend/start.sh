#!/bin/bash

# Start the RQ background worker in the background
echo "🚀 Starting Valkey RQ Background Worker..."
python worker.py &

# Start the FastAPI web server in the foreground
echo "⚡ Starting FastAPI App Server..."
python app.py
