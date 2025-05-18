#!/bin/bash

# Install render CLI if needed
npm install -g @render/cli

# Login to Render (you'll need to complete this step interactively)
render login

# Deploy the backend service
render deploy service backend-api

echo "Backend deployment initiated. Check the Render dashboard for progress." 