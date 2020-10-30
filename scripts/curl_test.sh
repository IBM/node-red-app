#!/bin/bash

nohup bash -c "npm start 2>&1 &" && sleep 5
echo "Checking '/' page..."
curl -X GET "https://localhost:1880/"
echo "Checking '/health' page..."
curl -X GET "https://localhost:1880/health"
