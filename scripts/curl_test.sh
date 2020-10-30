#!/usr/bin/env bash

nohup bash -c "npm start 2>&1 &" && sleep 5
echo "Checking '/' page..."
curl -v -X GET "http://localhost:1880/"
echo "Checking '/health' page..."
curl -v -X GET "http://localhost:1880/health"
